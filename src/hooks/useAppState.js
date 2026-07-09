import { useState, useEffect } from 'react';
import {
  collection, doc, onSnapshot, setDoc, updateDoc, getDoc, getDocs, deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { matches as initialMatches } from '../data/matches';

const getPhasePoints = (phase) => {
  switch(phase) {
    case 'groups':   return { correct: 1, exact: 4 };
    case 'round16':  return { correct: 3, exact: 9 };
    case 'quarters': return { correct: 4, exact: 12 };
    case 'semis':    return { correct: 5, exact: 15 };
    case 'third':    return { correct: 6, exact: 18 };
    case 'final':    return { correct: 7, exact: 21 };
    default:         return { correct: 1, exact: 4 };
  }
};

const useAppState = () => {
  const [users,           setUsers]           = useState([]);
  const [currentUser,     setCurrentUserState] = useState(null);
  const [matches,         setMatches]         = useState(initialMatches);
  const [reactions,       setReactions]       = useState({});
  const [loading,         setLoading]         = useState(true);
  const [groupsForceOpen, setGroupsForceOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('polla_currentUser');
    if (!saved) return;
    const savedUser = JSON.parse(saved);
    setCurrentUserState({ ...savedUser, _loading: true });
  }, []);

  const setCurrentUser = (user) => {
    setCurrentUserState(user);
    if (user) localStorage.setItem('polla_currentUser', JSON.stringify(user));
    else localStorage.removeItem('polla_currentUser');
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(data);
      setCurrentUserState(prev => {
        if (!prev) return prev;
        const updated = data.find(u => u.id === prev.id);
        if (updated) {
          localStorage.setItem('polla_currentUser', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'matches'), (snap) => {
      if (!snap.empty) {
        const data = snap.docs.map(d => ({ ...d.data(), id: parseInt(d.id) }));
        data.sort((a, b) => a.id - b.id);
        setMatches(data);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'reactions'), (snap) => {
      const data = {};
      snap.docs.forEach(d => { data[d.id] = d.data(); });
      setReactions(data);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'groups'), (snap) => {
      if (snap.exists()) setGroupsForceOpen(snap.data().forceOpen || false);
      else setGroupsForceOpen(false);
    });
    return unsub;
  }, []);

  const registerUser = async (name, nickname, avatar, championPrediction) => {
    const newUser = {
      id: Date.now().toString(),
      name, nickname, avatar, championPrediction,
      points: 0,
      predictions: {},
      groupPredictions: {},
      round16Prediction: [],
      quartersPrediction: [],
      semisPrediction: [],
      approved: users.length === 0,
      stats: {
        correctPredictions: 0,
        incorrectPredictions: 0,
        exactScores: 0,
        currentStreak: 0,
        maxStreak: 0,
        totalPredictions: 0,
      },
      isAdmin: users.length === 0,
      badges: []
    };
    await setDoc(doc(db, 'users', newUser.id), newUser);
    return newUser;
  };

  const approveUser = async (userId) => {
    await updateDoc(doc(db, 'users', userId), { approved: true });
  };

  const rejectUser = async (userId) => {
    await deleteDoc(doc(db, 'users', userId));
  };

  const makePrediction = async (userId, matchId, result, homeScore, awayScore) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const user = userSnap.data();
    if (!user.approved && !user.isAdmin) throw new Error('Usuario no aprobado');

    const prediction = { result, timestamp: Date.now() };
    if (homeScore !== undefined && homeScore !== null && !isNaN(homeScore)) {
      prediction.homeScore = parseInt(homeScore);
    }
    if (awayScore !== undefined && awayScore !== null && !isNaN(awayScore)) {
      prediction.awayScore = parseInt(awayScore);
    }

    const updatedPredictions = {
      ...user.predictions,
      [matchId]: prediction
    };
    await updateDoc(userRef, {
      predictions: updatedPredictions,
      'stats.totalPredictions': Object.keys(updatedPredictions).length
    });
  };

  const saveRound16Prediction = async (userId, teamIds) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const user = userSnap.data();
    if (!user.approved && !user.isAdmin) throw new Error('Usuario no aprobado');
    await updateDoc(userRef, { round16Prediction: teamIds });
  };

  const saveQuartersPrediction = async (userId, teamIds) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const user = userSnap.data();
    if (!user.approved && !user.isAdmin) throw new Error('Usuario no aprobado');
    await updateDoc(userRef, { quartersPrediction: teamIds });
  };

  // ✅ NUEVO: Guardar pronóstico 4 clasificados a semis
  const saveSemisPrediction = async (userId, teamIds) => {
    await updateDoc(doc(db, 'users', userId), { semisPrediction: teamIds });
  };

  const saveGroupPrediction = async (userId, group, first, second) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const user = userSnap.data();
    if (!user.approved && !user.isAdmin) throw new Error('Usuario no aprobado');
    const updatedGroupPredictions = {
      ...(user.groupPredictions || {}),
      [group]: { first, second }
    };
    await updateDoc(userRef, { groupPredictions: updatedGroupPredictions });
  };

  const recalculateUserPoints = (user, allMatches) => {
    let totalPoints = 0;
    let correctPredictions = 0, incorrectPredictions = 0;
    let exactScores = 0, currentStreak = 0, maxStreak = 0;

    const finished = allMatches.filter(m => m.status === 'finished');
    const sorted = [...finished].sort((a, b) => a.id - b.id);

    sorted.forEach(match => {
      const prediction = user.predictions?.[match.id];
      if (!prediction) return;

      const pts = getPhasePoints(match.phase);
      const actualResult = match.homeScore > match.awayScore ? 'home'
        : match.homeScore < match.awayScore ? 'away' : 'draw';
      const hasBothScores = prediction.homeScore !== undefined && prediction.awayScore !== undefined;
      const predictedResult = prediction.result || (hasBothScores
        ? (prediction.homeScore > prediction.awayScore ? 'home'
          : prediction.homeScore < prediction.awayScore ? 'away' : 'draw')
        : null);
      const isExact = hasBothScores
        && parseInt(prediction.homeScore) === parseInt(match.homeScore)
        && parseInt(prediction.awayScore) === parseInt(match.awayScore);

      if (predictedResult === null) {
        incorrectPredictions++; currentStreak = 0;
      } else if (isExact) {
        totalPoints += pts.exact; exactScores++; correctPredictions++;
        currentStreak++; maxStreak = Math.max(maxStreak, currentStreak);
      } else if (predictedResult === actualResult) {
        totalPoints += pts.correct; correctPredictions++;
        currentStreak++; maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        incorrectPredictions++; currentStreak = 0;
      }
    });

    const groupPreds = user.groupPredictions || {};
    Object.entries(groupPreds).forEach(([group, pred]) => {
      if (!pred?.first || !pred?.second) return;
      const groupResult = user.groupResults?.[group];
      if (!groupResult) return;
      if (pred.first === groupResult.first && pred.second === groupResult.second) {
        totalPoints += 10;
      } else if (
        (pred.first === groupResult.first || pred.first === groupResult.second) &&
        (pred.second === groupResult.first || pred.second === groupResult.second)
      ) {
        totalPoints += 5;
      } else if (
        pred.first === groupResult.first || pred.first === groupResult.second ||
        pred.second === groupResult.first || pred.second === groupResult.second
      ) {
        totalPoints += 2;
      }
    });

    const round16Pred = user.round16Prediction || [];
    const round16Results = user.round16Results || [];
    if (round16Results.length > 0 && round16Pred.length > 0) {
      round16Results.forEach(teamId => {
        if (round16Pred.includes(teamId)) totalPoints += 2;
      });
    }

    const quartersPred = user.quartersPrediction || [];
    const quartersResults = user.quartersResults || [];
    if (quartersResults.length > 0 && quartersPred.length > 0) {
      quartersResults.forEach(teamId => {
        if (quartersPred.includes(teamId)) totalPoints += 2;
      });
    }

    // ✅ NUEVO: Puntos clasificados semis (+4 por cada acierto)
    const semisPred = user.semisPrediction || [];
    const semisResults = user.semisResults || [];
    if (semisResults.length > 0 && semisPred.length > 0) {
      semisResults.forEach(teamId => {
        if (semisPred.includes(teamId)) totalPoints += 5;
      });
    }

    if (user.championCorrect) totalPoints += 30;

    return {
      ...user,
      points: totalPoints,
      stats: {
        ...(user.stats || {}),
        correctPredictions,
        incorrectPredictions,
        exactScores,
        currentStreak,
        maxStreak,
        totalPredictions: Object.keys(user.predictions || {}).length
      }
    };
  };

  const updateMatchResult = async (matchId, homeScore, awayScore) => {
    await updateDoc(doc(db, 'matches', String(matchId)), {
      homeScore, awayScore, status: 'finished'
    });
    const matchesSnap = await getDocs(collection(db, 'matches'));
    const freshMatches = matchesSnap.docs.map(d => ({ ...d.data(), id: parseInt(d.id) }));
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();
      const updated = recalculateUserPoints(user, freshMatches);
      await updateDoc(doc(db, 'users', userDoc.id), {
        points: updated.points,
        stats: updated.stats
      });
    }
  };

  const updateRound16Results = async (teamIds) => {
    const usersSnap = await getDocs(collection(db, 'users'));
    const matchesSnap = await getDocs(collection(db, 'matches'));
    const freshMatches = matchesSnap.docs.map(d => ({ ...d.data(), id: parseInt(d.id) }));
    for (const userDoc of usersSnap.docs) {
      const user = { ...userDoc.data(), round16Results: teamIds };
      const updated = recalculateUserPoints(user, freshMatches);
      await updateDoc(doc(db, 'users', userDoc.id), {
        round16Results: teamIds,
        points: updated.points,
        stats: updated.stats
      });
    }
  };

  const updateQuartersResults = async (teamIds) => {
    const usersSnap = await getDocs(collection(db, 'users'));
    const matchesSnap = await getDocs(collection(db, 'matches'));
    const freshMatches = matchesSnap.docs.map(d => ({ ...d.data(), id: parseInt(d.id) }));
    for (const userDoc of usersSnap.docs) {
      const user = { ...userDoc.data(), quartersResults: teamIds };
      const updated = recalculateUserPoints(user, freshMatches);
      await updateDoc(doc(db, 'users', userDoc.id), {
        quartersResults: teamIds,
        points: updated.points,
        stats: updated.stats
      });
    }
  };

  // ✅ NUEVO: Confirmar 4 clasificados a semis y asignar puntos
  const updateSemisResults = async (teamIds) => {
    const usersSnap = await getDocs(collection(db, 'users'));
    const matchesSnap = await getDocs(collection(db, 'matches'));
    const freshMatches = matchesSnap.docs.map(d => ({ ...d.data(), id: parseInt(d.id) }));
    for (const userDoc of usersSnap.docs) {
      const user = { ...userDoc.data(), semisResults: teamIds };
      const updated = recalculateUserPoints(user, freshMatches);
      await updateDoc(doc(db, 'users', userDoc.id), {
        semisResults: teamIds,
        points: updated.points,
        stats: updated.stats
      });
    }
  };

  const updateGroupResult = async (group, first, second) => {
    const matchesSnap = await getDocs(collection(db, 'matches'));
    const freshMatches = matchesSnap.docs.map(d => ({ ...d.data(), id: parseInt(d.id) }));
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();
      const updatedUser = {
        ...user,
        groupResults: { ...(user.groupResults||{}), [group]: { first, second } }
      };
      const recalculated = recalculateUserPoints(updatedUser, freshMatches);
      await updateDoc(doc(db, 'users', userDoc.id), {
        groupResults: updatedUser.groupResults,
        points: recalculated.points,
        stats: recalculated.stats
      });
    }
  };

  const updateChampion = async (championId) => {
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();
      if (user.championPrediction === championId) {
        await updateDoc(doc(db, 'users', userDoc.id), {
          points: (user.points || 0) + 30,
          championCorrect: true
        });
      }
    }
  };

  const recalculateAllPoints = async () => {
    const matchesSnap = await getDocs(collection(db, 'matches'));
    const freshMatches = matchesSnap.docs.map(d => ({ ...d.data(), id: parseInt(d.id) }));
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();
      const updated = recalculateUserPoints(user, freshMatches);
      await updateDoc(doc(db, 'users', userDoc.id), {
        points: updated.points,
        stats: updated.stats
      });
    }
  };

  const openRound16Predictions = async () => {
    await setDoc(doc(db, 'settings', 'round16'), { forceOpen: true });
  };

  const closeRound16Predictions = async () => {
    await setDoc(doc(db, 'settings', 'round16'), { forceOpen: false });
  };

  const openQuartersPredictions = async () => {
    await setDoc(doc(db, 'settings', 'quarters'), { forceOpen: true });
  };

  const closeQuartersPredictions = async () => {
    await setDoc(doc(db, 'settings', 'quarters'), { forceOpen: false });
  };

  // ✅ NUEVO: Abrir/cerrar pronóstico semis
  const openSemisPredictions = async () => {
    await setDoc(doc(db, 'settings', 'semis'), { forceOpen: true });
  };

  const closeSemisPredictions = async () => {
    await setDoc(doc(db, 'settings', 'semis'), { forceOpen: false });
  };

  const deleteUser = async (userId) => {
    await deleteDoc(doc(db, 'users', userId));
  };

  const resetAllUsers = async () => {
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const userDoc of usersSnap.docs) {
      await updateDoc(doc(db, 'users', userDoc.id), {
        points: 0,
        predictions: {},
        groupPredictions: {},
        round16Prediction: [],
        round16Results: [],
        quartersPrediction: [],
        quartersResults: [],
        semisPrediction: [],
        semisResults: [],
        championCorrect: false,
        groupResults: {},
        stats: {
          correctPredictions: 0,
          incorrectPredictions: 0,
          exactScores: 0,
          currentStreak: 0,
          maxStreak: 0,
          totalPredictions: 0,
        }
      });
    }
    const matchesSnap = await getDocs(collection(db, 'matches'));
    for (const matchDoc of matchesSnap.docs) {
      await updateDoc(doc(db, 'matches', matchDoc.id), {
        status: 'pending',
        homeScore: null,
        awayScore: null,
      });
    }
  };

  const openAllGroups = async () => {
    await setDoc(doc(db, 'settings', 'groups'), { forceOpen: true });
  };

  const closeAllGroups = async () => {
    await setDoc(doc(db, 'settings', 'groups'), { forceOpen: false });
  };

  const addReaction = async (matchId, userId, emoji) => {
    const ref = doc(db, 'reactions', String(matchId));
    const snap = await getDoc(ref);
    const current = snap.exists() ? snap.data() : {};
    await setDoc(ref, { ...current, [userId]: emoji });
  };

  const removeReaction = async (matchId, userId) => {
    const ref = doc(db, 'reactions', String(matchId));
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const current = { ...snap.data() };
    delete current[userId];
    await setDoc(ref, current);
  };

  return {
    users, currentUser, matches, reactions, loading,
    setCurrentUser, registerUser, makePrediction,
    saveGroupPrediction, saveRound16Prediction, saveQuartersPrediction, saveSemisPrediction,
    updateMatchResult, updateRound16Results, updateQuartersResults, updateSemisResults,
    updateGroupResult, updateChampion,
    recalculateAllPoints,
    openRound16Predictions, closeRound16Predictions,
    openQuartersPredictions, closeQuartersPredictions,
    openSemisPredictions, closeSemisPredictions,
    addReaction, removeReaction, deleteUser,
    approveUser, rejectUser, resetAllUsers,
    openAllGroups, closeAllGroups, groupsForceOpen
  };
};

export default useAppState;