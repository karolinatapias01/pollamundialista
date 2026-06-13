// Fixture oficial Mundial 2026 — Horario Colombia (UTC-5)
// Fuente: FIFA / Señal Colombia

export const matches = [

  // ── GRUPO A: México, Sudáfrica, Corea del Sur, República Checa ──
  { id: 1,  phase: 'groups', group: 'A', homeTeam: 'mex', awayTeam: 'rsa', date: '2026-06-11T14:00:00-05:00', venue: 'Ciudad de México', status: 'pending' },
  { id: 2,  phase: 'groups', group: 'A', homeTeam: 'kor', awayTeam: 'cze', date: '2026-06-11T21:00:00-05:00', venue: 'Guadalajara',      status: 'pending' },
  { id: 3,  phase: 'groups', group: 'A', homeTeam: 'cze', awayTeam: 'rsa', date: '2026-06-18T11:00:00-05:00', venue: 'Atlanta',          status: 'pending' },
  { id: 4,  phase: 'groups', group: 'A', homeTeam: 'mex', awayTeam: 'kor', date: '2026-06-18T20:00:00-05:00', venue: 'Guadalajara',      status: 'pending' },
  { id: 5,  phase: 'groups', group: 'A', homeTeam: 'rsa', awayTeam: 'kor', date: '2026-06-24T20:00:00-05:00', venue: 'Monterrey',        status: 'pending' },
  { id: 6,  phase: 'groups', group: 'A', homeTeam: 'cze', awayTeam: 'mex', date: '2026-06-24T20:00:00-05:00', venue: 'Ciudad de México', status: 'pending' },

  // ── GRUPO B: Canadá, Bosnia-Herzegovina, Catar, Suiza ──
  { id: 7,  phase: 'groups', group: 'B', homeTeam: 'can', awayTeam: 'bih', date: '2026-06-12T14:00:00-05:00', venue: 'Toronto',     status: 'pending' },
  { id: 8,  phase: 'groups', group: 'B', homeTeam: 'qat', awayTeam: 'sui', date: '2026-06-13T14:00:00-05:00', venue: 'San Francisco', status: 'pending' },
  { id: 9,  phase: 'groups', group: 'B', homeTeam: 'sui', awayTeam: 'bih', date: '2026-06-18T14:00:00-05:00', venue: 'Los Ángeles', status: 'pending' },
  { id: 10, phase: 'groups', group: 'B', homeTeam: 'can', awayTeam: 'qat', date: '2026-06-18T17:00:00-05:00', venue: 'Vancouver',   status: 'pending' },
  { id: 11, phase: 'groups', group: 'B', homeTeam: 'sui', awayTeam: 'can', date: '2026-06-24T14:00:00-05:00', venue: 'Vancouver',   status: 'pending' },
  { id: 12, phase: 'groups', group: 'B', homeTeam: 'bih', awayTeam: 'qat', date: '2026-06-24T14:00:00-05:00', venue: 'Seattle',     status: 'pending' },

  // ── GRUPO C: Brasil, Marruecos, Haití, Escocia ──
  { id: 13, phase: 'groups', group: 'C', homeTeam: 'bra', awayTeam: 'mar', date: '2026-06-13T17:00:00-05:00', venue: 'Nueva York',   status: 'pending' },
  { id: 14, phase: 'groups', group: 'C', homeTeam: 'hai', awayTeam: 'sco', date: '2026-06-13T20:00:00-05:00', venue: 'Filadelfia',   status: 'pending' },
  { id: 15, phase: 'groups', group: 'C', homeTeam: 'sco', awayTeam: 'mar', date: '2026-06-19T17:00:00-05:00', venue: 'Boston',       status: 'pending' },
  { id: 16, phase: 'groups', group: 'C', homeTeam: 'bra', awayTeam: 'hai', date: '2026-06-19T20:00:00-05:00', venue: 'Filadelfia',   status: 'pending' },
  { id: 17, phase: 'groups', group: 'C', homeTeam: 'mar', awayTeam: 'hai', date: '2026-06-24T17:00:00-05:00', venue: 'Atlanta',      status: 'pending' },
  { id: 18, phase: 'groups', group: 'C', homeTeam: 'sco', awayTeam: 'bra', date: '2026-06-24T17:00:00-05:00', venue: 'Miami',        status: 'pending' },

  // ── GRUPO D: Estados Unidos, Paraguay, Australia, Turquía ──
  { id: 19, phase: 'groups', group: 'D', homeTeam: 'usa', awayTeam: 'par', date: '2026-06-12T20:00:00-05:00', venue: 'Los Ángeles',  status: 'pending' },
  { id: 20, phase: 'groups', group: 'D', homeTeam: 'aus', awayTeam: 'tur', date: '2026-06-13T23:00:00-05:00', venue: 'Seattle',      status: 'pending' },
  { id: 21, phase: 'groups', group: 'D', homeTeam: 'usa', awayTeam: 'aus', date: '2026-06-19T14:00:00-05:00', venue: 'Seattle',      status: 'pending' },
  { id: 22, phase: 'groups', group: 'D', homeTeam: 'tur', awayTeam: 'par', date: '2026-06-19T23:00:00-05:00', venue: 'San Francisco', status: 'pending' },
  { id: 23, phase: 'groups', group: 'D', homeTeam: 'tur', awayTeam: 'usa', date: '2026-06-25T21:00:00-05:00', venue: 'Los Ángeles',  status: 'pending' },
  { id: 24, phase: 'groups', group: 'D', homeTeam: 'par', awayTeam: 'aus', date: '2026-06-25T21:00:00-05:00', venue: 'San Francisco', status: 'pending' },

  // ── GRUPO E: Alemania, Curazao, Costa de Marfil, Ecuador ──
  { id: 25, phase: 'groups', group: 'E', homeTeam: 'ger', awayTeam: 'cur', date: '2026-06-14T12:00:00-05:00', venue: 'Houston',      status: 'pending' },
  { id: 26, phase: 'groups', group: 'E', homeTeam: 'civ', awayTeam: 'ecu', date: '2026-06-14T18:00:00-05:00', venue: 'Filadelfia',   status: 'pending' },
  { id: 27, phase: 'groups', group: 'E', homeTeam: 'ger', awayTeam: 'civ', date: '2026-06-20T15:00:00-05:00', venue: 'Toronto',      status: 'pending' },
  { id: 28, phase: 'groups', group: 'E', homeTeam: 'ecu', awayTeam: 'cur', date: '2026-06-20T19:00:00-05:00', venue: 'Kansas City',  status: 'pending' },
  { id: 29, phase: 'groups', group: 'E', homeTeam: 'ecu', awayTeam: 'ger', date: '2026-06-25T15:00:00-05:00', venue: 'Nueva York',   status: 'pending' },
  { id: 30, phase: 'groups', group: 'E', homeTeam: 'cur', awayTeam: 'civ', date: '2026-06-25T15:00:00-05:00', venue: 'Filadelfia',   status: 'pending' },

  // ── GRUPO F: Países Bajos, Japón, Suecia, Túnez ──
  { id: 31, phase: 'groups', group: 'F', homeTeam: 'ned', awayTeam: 'jpn', date: '2026-06-14T15:00:00-05:00', venue: 'Dallas',       status: 'pending' },
  { id: 32, phase: 'groups', group: 'F', homeTeam: 'swe', awayTeam: 'tun', date: '2026-06-14T21:00:00-05:00', venue: 'Monterrey',    status: 'pending' },
  { id: 33, phase: 'groups', group: 'F', homeTeam: 'ned', awayTeam: 'swe', date: '2026-06-20T12:00:00-05:00', venue: 'Houston',      status: 'pending' },
  { id: 34, phase: 'groups', group: 'F', homeTeam: 'tun', awayTeam: 'jpn', date: '2026-06-20T23:00:00-05:00', venue: 'Monterrey',    status: 'pending' },
  { id: 35, phase: 'groups', group: 'F', homeTeam: 'tun', awayTeam: 'ned', date: '2026-06-25T18:00:00-05:00', venue: 'Kansas City',  status: 'pending' },
  { id: 36, phase: 'groups', group: 'F', homeTeam: 'jpn', awayTeam: 'swe', date: '2026-06-25T18:00:00-05:00', venue: 'Dallas',       status: 'pending' },

  // ── GRUPO G: Bélgica, Egipto, Irán, Nueva Zelanda ──
  { id: 37, phase: 'groups', group: 'G', homeTeam: 'bel', awayTeam: 'egy', date: '2026-06-15T14:00:00-05:00', venue: 'Seattle',      status: 'pending' },
  { id: 38, phase: 'groups', group: 'G', homeTeam: 'irn', awayTeam: 'nzl', date: '2026-06-15T20:00:00-05:00', venue: 'Los Ángeles',  status: 'pending' },
  { id: 39, phase: 'groups', group: 'G', homeTeam: 'bel', awayTeam: 'irn', date: '2026-06-21T14:00:00-05:00', venue: 'Los Ángeles',  status: 'pending' },
  { id: 40, phase: 'groups', group: 'G', homeTeam: 'nzl', awayTeam: 'egy', date: '2026-06-21T20:00:00-05:00', venue: 'Vancouver',    status: 'pending' },
  { id: 41, phase: 'groups', group: 'G', homeTeam: 'nzl', awayTeam: 'bel', date: '2026-06-26T22:00:00-05:00', venue: 'Vancouver',    status: 'pending' },
  { id: 42, phase: 'groups', group: 'G', homeTeam: 'egy', awayTeam: 'irn', date: '2026-06-26T22:00:00-05:00', venue: 'Seattle',      status: 'pending' },

  // ── GRUPO H: España, Cabo Verde, Arabia Saudita, Uruguay ──
  { id: 43, phase: 'groups', group: 'H', homeTeam: 'esp', awayTeam: 'cpv', date: '2026-06-15T11:00:00-05:00', venue: 'Atlanta',      status: 'pending' },
  { id: 44, phase: 'groups', group: 'H', homeTeam: 'ksa', awayTeam: 'ury', date: '2026-06-15T17:00:00-05:00', venue: 'Miami',        status: 'pending' },
  { id: 45, phase: 'groups', group: 'H', homeTeam: 'esp', awayTeam: 'ksa', date: '2026-06-21T11:00:00-05:00', venue: 'Atlanta',      status: 'pending' },
  { id: 46, phase: 'groups', group: 'H', homeTeam: 'ury', awayTeam: 'cpv', date: '2026-06-21T17:00:00-05:00', venue: 'Miami',        status: 'pending' },
  { id: 47, phase: 'groups', group: 'H', homeTeam: 'ury', awayTeam: 'esp', date: '2026-06-26T19:00:00-05:00', venue: 'Guadalajara',  status: 'pending' },
  { id: 48, phase: 'groups', group: 'H', homeTeam: 'cpv', awayTeam: 'ksa', date: '2026-06-26T19:00:00-05:00', venue: 'Houston',      status: 'pending' },

  // ── GRUPO I: Francia, Senegal, Irak, Noruega ──
  { id: 49, phase: 'groups', group: 'I', homeTeam: 'fra', awayTeam: 'sen', date: '2026-06-16T14:00:00-05:00', venue: 'Nueva York',   status: 'pending' },
  { id: 50, phase: 'groups', group: 'I', homeTeam: 'irq', awayTeam: 'nor', date: '2026-06-16T17:00:00-05:00', venue: 'Boston',       status: 'pending' },
  { id: 51, phase: 'groups', group: 'I', homeTeam: 'fra', awayTeam: 'irq', date: '2026-06-22T16:00:00-05:00', venue: 'Filadelfia',   status: 'pending' },
  { id: 52, phase: 'groups', group: 'I', homeTeam: 'nor', awayTeam: 'sen', date: '2026-06-22T19:00:00-05:00', venue: 'Nueva York',   status: 'pending' },
  { id: 53, phase: 'groups', group: 'I', homeTeam: 'nor', awayTeam: 'fra', date: '2026-06-26T14:00:00-05:00', venue: 'Boston',       status: 'pending' },
  { id: 54, phase: 'groups', group: 'I', homeTeam: 'sen', awayTeam: 'irq', date: '2026-06-26T14:00:00-05:00', venue: 'Kansas City',  status: 'pending' },

  // ── GRUPO J: Argentina, Argelia, Austria, Jordania ──
  { id: 55, phase: 'groups', group: 'J', homeTeam: 'arg', awayTeam: 'alg', date: '2026-06-16T20:00:00-05:00', venue: 'Kansas City',  status: 'pending' },
  { id: 56, phase: 'groups', group: 'J', homeTeam: 'aut', awayTeam: 'jor', date: '2026-06-16T23:00:00-05:00', venue: 'San Francisco', status: 'pending' },
  { id: 57, phase: 'groups', group: 'J', homeTeam: 'arg', awayTeam: 'aut', date: '2026-06-22T12:00:00-05:00', venue: 'Dallas',       status: 'pending' },
  { id: 58, phase: 'groups', group: 'J', homeTeam: 'jor', awayTeam: 'alg', date: '2026-06-22T23:00:00-05:00', venue: 'San Francisco', status: 'pending' },
  { id: 59, phase: 'groups', group: 'J', homeTeam: 'jor', awayTeam: 'arg', date: '2026-06-27T21:00:00-05:00', venue: 'Dallas',       status: 'pending' },
  { id: 60, phase: 'groups', group: 'J', homeTeam: 'alg', awayTeam: 'aut', date: '2026-06-27T21:00:00-05:00', venue: 'Kansas City',  status: 'pending' },

  // ── GRUPO K: Portugal, RD Congo, Uzbekistán, Colombia ──
  { id: 61, phase: 'groups', group: 'K', homeTeam: 'por', awayTeam: 'cod', date: '2026-06-17T12:00:00-05:00', venue: 'Houston',      status: 'pending' },
  { id: 62, phase: 'groups', group: 'K', homeTeam: 'uzb', awayTeam: 'col', date: '2026-06-17T21:00:00-05:00', venue: 'Ciudad de México', status: 'pending' },
  { id: 63, phase: 'groups', group: 'K', homeTeam: 'por', awayTeam: 'uzb', date: '2026-06-23T12:00:00-05:00', venue: 'Houston',      status: 'pending' },
  { id: 64, phase: 'groups', group: 'K', homeTeam: 'col', awayTeam: 'cod', date: '2026-06-23T21:00:00-05:00', venue: 'Guadalajara',  status: 'pending' },
  { id: 65, phase: 'groups', group: 'K', homeTeam: 'col', awayTeam: 'por', date: '2026-06-27T18:30:00-05:00', venue: 'Miami',        status: 'pending' },
  { id: 66, phase: 'groups', group: 'K', homeTeam: 'cod', awayTeam: 'uzb', date: '2026-06-27T18:30:00-05:00', venue: 'Atlanta',      status: 'pending' },

  // ── GRUPO L: Inglaterra, Croacia, Ghana, Panamá ──
  { id: 67, phase: 'groups', group: 'L', homeTeam: 'eng', awayTeam: 'cro', date: '2026-06-17T15:00:00-05:00', venue: 'Dallas',       status: 'pending' },
  { id: 68, phase: 'groups', group: 'L', homeTeam: 'gha', awayTeam: 'pan', date: '2026-06-17T18:00:00-05:00', venue: 'Toronto',      status: 'pending' },
  { id: 69, phase: 'groups', group: 'L', homeTeam: 'eng', awayTeam: 'gha', date: '2026-06-23T15:00:00-05:00', venue: 'Boston',       status: 'pending' },
  { id: 70, phase: 'groups', group: 'L', homeTeam: 'pan', awayTeam: 'cro', date: '2026-06-23T18:00:00-05:00', venue: 'Toronto',      status: 'pending' },
  { id: 71, phase: 'groups', group: 'L', homeTeam: 'pan', awayTeam: 'eng', date: '2026-06-27T16:00:00-05:00', venue: 'Nueva York',   status: 'pending' },
  { id: 72, phase: 'groups', group: 'L', homeTeam: 'cro', awayTeam: 'gha', date: '2026-06-27T16:00:00-05:00', venue: 'Filadelfia',   status: 'pending' },

  // ── DIECISEISAVOS ──
  { id: 73,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-06-28T14:00:00-05:00', venue: 'Los Ángeles',   status: 'pending' },
  { id: 74,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-06-29T14:00:00-05:00', venue: 'Boston',        status: 'pending' },
  { id: 75,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-06-29T17:00:00-05:00', venue: 'Monterrey',     status: 'pending' },
  { id: 76,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-06-29T20:00:00-05:00', venue: 'Houston',       status: 'pending' },
  { id: 77,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-06-30T14:00:00-05:00', venue: 'Nueva York',    status: 'pending' },
  { id: 78,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-06-30T17:00:00-05:00', venue: 'Dallas',        status: 'pending' },
  { id: 79,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-06-30T20:00:00-05:00', venue: 'Ciudad de México', status: 'pending' },
  { id: 80,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-07-01T14:00:00-05:00', venue: 'Atlanta',       status: 'pending' },
  { id: 81,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-07-01T17:00:00-05:00', venue: 'San Francisco', status: 'pending' },
  { id: 82,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-07-01T20:00:00-05:00', venue: 'Seattle',       status: 'pending' },
  { id: 83,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-07-02T14:00:00-05:00', venue: 'Toronto',       status: 'pending' },
  { id: 84,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-07-02T17:00:00-05:00', venue: 'Los Ángeles',   status: 'pending' },
  { id: 85,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-07-02T20:00:00-05:00', venue: 'Vancouver',     status: 'pending' },
  { id: 86,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-07-03T14:00:00-05:00', venue: 'Miami',         status: 'pending' },
  { id: 87,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-07-03T17:00:00-05:00', venue: 'Kansas City',   status: 'pending' },
  { id: 88,  phase: 'round16', homeTeam: null, awayTeam: null, date: '2026-07-03T20:00:00-05:00', venue: 'Dallas',        status: 'pending' },

  // ── OCTAVOS ──
  { id: 89,  phase: 'quarters', homeTeam: null, awayTeam: null, date: '2026-07-04T14:00:00-05:00', venue: 'Filadelfia',   status: 'pending' },
  { id: 90,  phase: 'quarters', homeTeam: null, awayTeam: null, date: '2026-07-04T19:00:00-05:00', venue: 'Houston',      status: 'pending' },
  { id: 91,  phase: 'quarters', homeTeam: null, awayTeam: null, date: '2026-07-05T14:00:00-05:00', venue: 'Nueva York',   status: 'pending' },
  { id: 92,  phase: 'quarters', homeTeam: null, awayTeam: null, date: '2026-07-05T19:00:00-05:00', venue: 'Ciudad de México', status: 'pending' },
  { id: 93,  phase: 'quarters', homeTeam: null, awayTeam: null, date: '2026-07-06T14:00:00-05:00', venue: 'Dallas',       status: 'pending' },
  { id: 94,  phase: 'quarters', homeTeam: null, awayTeam: null, date: '2026-07-06T19:00:00-05:00', venue: 'Seattle',      status: 'pending' },
  { id: 95,  phase: 'quarters', homeTeam: null, awayTeam: null, date: '2026-07-07T14:00:00-05:00', venue: 'Atlanta',      status: 'pending' },
  { id: 96,  phase: 'quarters', homeTeam: null, awayTeam: null, date: '2026-07-07T19:00:00-05:00', venue: 'Vancouver',    status: 'pending' },

  // ── CUARTOS ──
  { id: 97,  phase: 'semis', homeTeam: null, awayTeam: null, date: '2026-07-09T19:00:00-05:00', venue: 'Boston',        status: 'pending' },
  { id: 98,  phase: 'semis', homeTeam: null, awayTeam: null, date: '2026-07-10T19:00:00-05:00', venue: 'Los Ángeles',   status: 'pending' },
  { id: 99,  phase: 'semis', homeTeam: null, awayTeam: null, date: '2026-07-11T15:00:00-05:00', venue: 'Miami',         status: 'pending' },
  { id: 100, phase: 'semis', homeTeam: null, awayTeam: null, date: '2026-07-11T19:00:00-05:00', venue: 'Kansas City',   status: 'pending' },

  // ── SEMIFINALES ──
  { id: 101, phase: 'semis', homeTeam: null, awayTeam: null, date: '2026-07-14T19:00:00-05:00', venue: 'Dallas',        status: 'pending' },
  { id: 102, phase: 'semis', homeTeam: null, awayTeam: null, date: '2026-07-15T19:00:00-05:00', venue: 'Atlanta',       status: 'pending' },

  // ── TERCER PUESTO ──
  { id: 103, phase: 'third',  homeTeam: null, awayTeam: null, date: '2026-07-18T15:00:00-05:00', venue: 'Miami',         status: 'pending' },

  // ── FINAL ──
  { id: 104, phase: 'final',  homeTeam: null, awayTeam: null, date: '2026-07-19T15:00:00-05:00', venue: 'Nueva York',    status: 'pending' },
];

export const getMatchById    = (id)    => matches.find(m => m.id === id);
export const getMatchesByPhase = (phase) => matches.filter(m => m.phase === phase);
export const getMatchesByGroup = (group) => matches.filter(m => m.group === group);