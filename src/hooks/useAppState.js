import { useState, useEffect } from 'react';
import {
  collection, doc, onSnapshot, setDoc, updateDoc, getDoc, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { matches as initialMatches } from '../data/matches';

const useAppState = () => {
  const [users,       setUsers]           = useState([]);
  const [currentUser, setCurrentUserState] = useState(() => {
    const s = localStorage.getItem('polla_currentUser');
    return s ? JSON.parse(s) : null;
  });
  const [matches,   setMatches]   = useState(initialMatches);
  const [reactions, setReactions] = useState({});
  const [loading,   setLoading]   = useState(true);

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
      if (snap.empty) {
        initialMatches.forEach(async (m) => {
          await setDoc(doc(db, 'matches', String(m.id)), m);
        });
        setMatches(initialMatches);
      } else {
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

  const registerUser = async (name, nickname, avatar, championPrediction) => {
    const newUser = {
      id: Date.now().toString(),
      name, nickname, avatar, championPrediction,
      points: 0,
      predictions: {},
      groupPredictions: {},
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

  const makePrediction = async (userId, matchId, result, homeScore, awayScore) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const user = userSnap.data();

    // Filtrar undefined para que Firebase no falle
    const prediction = { result };
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

  const saveGroupPrediction = async (userId, group, first, second) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const user = userSnap.data();
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

      const actualResult = match.homeScore > match.awayScore ? 'home'
        : match.homeScore < match.awayScore ? 'away' : 'draw';
      const predictedResult = prediction.result
        || (prediction.homeScore > prediction.awayScore ? 'home'
          : prediction.homeScore < prediction.awayScore ? 'away' : 'draw');
      const isExact = prediction.homeScore !== undefined && prediction.awayScore !== undefined
        && parseInt(prediction.homeScore) === parseInt(match.homeScore)
        && parseInt(prediction.awayScore) === parseInt(match.awayScore);

      if (isExact) {
        totalPoints += 3; exactScores++; correctPredictions++;
        currentStreak++; maxStreak = Math.max(maxStreak, currentStreak);
      } else if (predictedResult === actualResult) {
        totalPoints += 1; correctPredictions++;
        currentStreak++; maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        incorrectPredictions++; currentStreak = 0;
      }
    });

    // Puntos de grupos
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

    if (user.championCorrect) totalPoints += 15;

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
    const updatedMatches = matches.map(m =>
      m.id === matchId ? { ...m, homeScore, awayScore, status: 'finished' } : m
    );
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();
      const updated = recalculateUserPoints(user, updatedMatches);
      await updateDoc(doc(db, 'users', userDoc.id), {
        points: updated.points,
        stats: updated.stats
      });
    }
  };

  const updateGroupResult = async (group, first, second) => {
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();
      const updatedUser = {
        ...user,
        groupResults: { ...(user.groupResults||{}), [group]: { first, second } }
      };
      const recalculated = recalculateUserPoints(updatedUser, matches);
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
          points: (user.points || 0) + 15,
          championCorrect: true
        });
      }
    }
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
    saveGroupPrediction, updateMatchResult,
    updateGroupResult, updateChampion,
    addReaction, removeReaction
  };
};

export default useAppState;