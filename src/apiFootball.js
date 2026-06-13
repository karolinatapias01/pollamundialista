const API_KEY = '07686714a9mshf98d2240ee1ee3fp11ef95jsnaeadc57cfeb9';
const LEAGUE_ID = 1;
const SEASON = 2026;

export const fetchLiveAndRecentMatches = async () => {
  try {
    const response = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${LEAGUE_ID}&season=${SEASON}&last=10`,
      {
        headers: {
          'X-RapidAPI-Key': API_KEY,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }
      }
    );
    const data = await response.json();
    return data.response || [];
  } catch (error) {
    console.error('Error API-Football:', error);
    return [];
  }
};

export const fetchTodayMatches = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${LEAGUE_ID}&season=${SEASON}&date=${today}`,
      {
        headers: {
          'X-RapidAPI-Key': API_KEY,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }
      }
    );
    const data = await response.json();
    return data.response || [];
  } catch (error) {
    console.error('Error API-Football:', error);
    return [];
  }
};