import { db } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const API_KEY = '1262383aa29f25c346f37d2a9928a7e0';
const BASE_URL = 'https://v3.football.api-sports.io';

const teamNameToId = {
  'Mexico': 'mex', 'South Africa': 'rsa', 'Korea Republic': 'kor',
  'Czech Republic': 'cze', 'Canada': 'can', 'Bosnia-Herzegovina': 'bih',
  'Qatar': 'qat', 'Switzerland': 'sui', 'Brazil': 'bra', 'Morocco': 'mar',
  'Haiti': 'hai', 'Scotland': 'sco', 'United States': 'usa', 'Paraguay': 'par',
  'Australia': 'aus', 'Turkey': 'tur', 'Germany': 'ger', 'Curacao': 'cur',
  'Ivory Coast': 'civ', 'Ecuador': 'ecu', 'Netherlands': 'ned', 'Japan': 'jpn',
  'Sweden': 'swe', 'Tunisia': 'tun', 'Belgium': 'bel', 'Egypt': 'egy',
  'Iran': 'irn', 'New Zealand': 'nzl', 'Spain': 'esp', 'Cape Verde': 'cpv',
  'Saudi Arabia': 'ksa', 'Uruguay': 'ury', 'France': 'fra', 'Senegal': 'sen',
  'Iraq': 'irq', 'Norway': 'nor', 'Argentina': 'arg', 'Algeria': 'alg',
  'Austria': 'aut', 'Jordan': 'jor', 'Portugal': 'por', 'DR Congo': 'cod',
  'Uzbekistan': 'uzb', 'Colombia': 'col', 'England': 'eng', 'Croatia': 'cro',
  'Ghana': 'gha', 'Panama': 'pan'
};

const findLeagueId = async () => {
  try {
    const r = await fetch(`${BASE_URL}/leagues?name=World Cup&season=2026`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const d = await r.json();
    console.log('🏆 Ligas encontradas:', JSON.stringify(d.response?.slice(0,3)));
    return d.response?.[0]?.league?.id || 1;
  } catch(e) {
    console.error('Error buscando liga:', e);
    return 1;
  }
};

const fetchRecentMatches = async (leagueId) => {
  try {
    const url = `${BASE_URL}/fixtures?league=${leagueId}&season=2026&last=20`;
    console.log('📡 Consultando:', url);
    const response = await fetch(url, {
      headers: { 'x-apisports-key': API_KEY }
    });
    const data = await response.json();
    console.log('API respuesta completa:', JSON.stringify(data).slice(0, 500));
    return data.response || [];
  } catch (error) {
    console.error('Error API:', error);
    return [];
  }
};

const recalculateAllUsers = async (updatedMatches) => {
  const usersSnap = await getDocs(collection(db, 'users'));
  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    let totalPoints = 0;
    let correctPredictions = 0, incorrectPredictions = 0;
    let exactScores = 0, currentStreak = 0, maxStreak = 0;

    const finished = updatedMatches.filter(m => m.status === 'finished');
    finished.sort((a, b) => a.id - b.id);

    finished.forEach(match => {
      const prediction = user.predictions?.[match.id];
      if (!prediction) return;
      const actualResult = match.homeScore > match.awayScore ? 'home'
        : match.homeScore < match.awayScore ? 'away' : 'draw';
      const predictedResult = prediction.result
        || (prediction.homeScore > prediction.awayScore ? 'home'
          : prediction.homeScore < prediction.awayScore ? 'away' : 'draw');
      const isExact = prediction.homeScore !== undefined
        && prediction.awayScore !== undefined
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

    if (user.championCorrect) totalPoints += 15;

    await updateDoc(doc(db, 'users', userDoc.id), {
      points: totalPoints,
      stats: {
        ...(user.stats || {}),
        correctPredictions, incorrectPredictions,
        exactScores, currentStreak, maxStreak,
        totalPredictions: Object.keys(user.predictions || {}).length
      }
    });
  }
};

export const syncResults = async () => {
  try {
    console.log('🔄 Sincronizando resultados...');
    const leagueId = await findLeagueId();
    console.log('🏆 League ID encontrado:', leagueId);
    const apiMatches = await fetchRecentMatches(leagueId);

    if (!apiMatches.length) {
      console.log('ℹ️ No se encontraron partidos');
      return;
    }

    const matchesSnap = await getDocs(collection(db, 'matches'));
    const ourMatches = matchesSnap.docs.map(d => ({ ...d.data(), id: parseInt(d.id) }));
    let updated = false;
    const updatedMatches = [...ourMatches];

    for (const apiMatch of apiMatches) {
      const status = apiMatch.fixture.status.short;
      const isFinished = status === 'FT' || status === 'AET' || status === 'PEN';
      if (!isFinished) continue;

      const homeTeamName = apiMatch.teams.home.name;
      const awayTeamName = apiMatch.teams.away.name;
      const homeScore = apiMatch.goals.home;
      const awayScore = apiMatch.goals.away;
      const homeId = teamNameToId[homeTeamName];
      const awayId = teamNameToId[awayTeamName];

      if (!homeId || !awayId) {
        console.log(`⚠️ Sin mapeo: ${homeTeamName} vs ${awayTeamName}`);
        continue;
      }

      const ourMatch = ourMatches.find(m =>
        m.homeTeam === homeId && m.awayTeam === awayId && m.status !== 'finished'
      );

      if (ourMatch && homeScore !== null && awayScore !== null) {
        await updateDoc(doc(db, 'matches', String(ourMatch.id)), {
          homeScore, awayScore, status: 'finished'
        });
        const idx = updatedMatches.findIndex(m => m.id === ourMatch.id);
        if (idx !== -1) updatedMatches[idx] = { ...updatedMatches[idx], homeScore, awayScore, status: 'finished' };
        updated = true;
        console.log(`✓ ${homeTeamName} ${homeScore}-${awayScore} ${awayTeamName}`);
      }
    }

    if (updated) {
      await recalculateAllUsers(updatedMatches);
      console.log('✓ Puntos recalculados');
    } else {
      console.log('ℹ️ Sin partidos nuevos para actualizar');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

export const startAutoSync = () => {
  syncResults();
  return setInterval(syncResults, 5 * 60 * 1000);
};