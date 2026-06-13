// 48 equipos del Mundial 2026 con códigos ISO para banderas reales
export const teams = [
  // GRUPO A
  { id: 'mex', name: 'México',          flag: '🇲🇽', flagCode: 'mx', confederation: 'CONCACAF' },
  { id: 'rsa', name: 'Sudáfrica',       flag: '🇿🇦', flagCode: 'za', confederation: 'CAF'      },
  { id: 'kor', name: 'Corea del Sur',   flag: '🇰🇷', flagCode: 'kr', confederation: 'AFC'      },
  { id: 'cze', name: 'Rep. Checa',      flag: '🇨🇿', flagCode: 'cz', confederation: 'UEFA'     },
  // GRUPO B
  { id: 'can', name: 'Canadá',          flag: '🇨🇦', flagCode: 'ca', confederation: 'CONCACAF' },
  { id: 'bih', name: 'Bosnia-Herz.',    flag: '🇧🇦', flagCode: 'ba', confederation: 'UEFA'     },
  { id: 'qat', name: 'Catar',           flag: '🇶🇦', flagCode: 'qa', confederation: 'AFC'      },
  { id: 'sui', name: 'Suiza',           flag: '🇨🇭', flagCode: 'ch', confederation: 'UEFA'     },
  // GRUPO C
  { id: 'bra', name: 'Brasil',          flag: '🇧🇷', flagCode: 'br', confederation: 'CONMEBOL' },
  { id: 'mar', name: 'Marruecos',       flag: '🇲🇦', flagCode: 'ma', confederation: 'CAF'      },
  { id: 'hai', name: 'Haití',           flag: '🇭🇹', flagCode: 'ht', confederation: 'CONCACAF' },
  { id: 'sco', name: 'Escocia',         flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', flagCode: 'gb-sct', confederation: 'UEFA' },
  // GRUPO D
  { id: 'usa', name: 'Estados Unidos',  flag: '🇺🇸', flagCode: 'us', confederation: 'CONCACAF' },
  { id: 'par', name: 'Paraguay',        flag: '🇵🇾', flagCode: 'py', confederation: 'CONMEBOL' },
  { id: 'aus', name: 'Australia',       flag: '🇦🇺', flagCode: 'au', confederation: 'AFC'      },
  { id: 'tur', name: 'Turquía',         flag: '🇹🇷', flagCode: 'tr', confederation: 'UEFA'     },
  // GRUPO E
  { id: 'ger', name: 'Alemania',        flag: '🇩🇪', flagCode: 'de', confederation: 'UEFA'     },
  { id: 'cur', name: 'Curazao',         flag: '🇨🇼', flagCode: 'cw', confederation: 'CONCACAF' },
  { id: 'civ', name: 'Costa de Marfil', flag: '🇨🇮', flagCode: 'ci', confederation: 'CAF'      },
  { id: 'ecu', name: 'Ecuador',         flag: '🇪🇨', flagCode: 'ec', confederation: 'CONMEBOL' },
  // GRUPO F
  { id: 'ned', name: 'Países Bajos',    flag: '🇳🇱', flagCode: 'nl', confederation: 'UEFA'     },
  { id: 'jpn', name: 'Japón',           flag: '🇯🇵', flagCode: 'jp', confederation: 'AFC'      },
  { id: 'swe', name: 'Suecia',          flag: '🇸🇪', flagCode: 'se', confederation: 'UEFA'     },
  { id: 'tun', name: 'Túnez',           flag: '🇹🇳', flagCode: 'tn', confederation: 'CAF'      },
  // GRUPO G
  { id: 'bel', name: 'Bélgica',         flag: '🇧🇪', flagCode: 'be', confederation: 'UEFA'     },
  { id: 'egy', name: 'Egipto',          flag: '🇪🇬', flagCode: 'eg', confederation: 'CAF'      },
  { id: 'irn', name: 'Irán',            flag: '🇮🇷', flagCode: 'ir', confederation: 'AFC'      },
  { id: 'nzl', name: 'Nueva Zelanda',   flag: '🇳🇿', flagCode: 'nz', confederation: 'OFC'      },
  // GRUPO H
  { id: 'esp', name: 'España',          flag: '🇪🇸', flagCode: 'es', confederation: 'UEFA'     },
  { id: 'cpv', name: 'Cabo Verde',      flag: '🇨🇻', flagCode: 'cv', confederation: 'CAF'      },
  { id: 'ksa', name: 'Arabia Saudita',  flag: '🇸🇦', flagCode: 'sa', confederation: 'AFC'      },
  { id: 'ury', name: 'Uruguay',         flag: '🇺🇾', flagCode: 'uy', confederation: 'CONMEBOL' },
  // GRUPO I
  { id: 'fra', name: 'Francia',         flag: '🇫🇷', flagCode: 'fr', confederation: 'UEFA'     },
  { id: 'sen', name: 'Senegal',         flag: '🇸🇳', flagCode: 'sn', confederation: 'CAF'      },
  { id: 'irq', name: 'Irak',            flag: '🇮🇶', flagCode: 'iq', confederation: 'AFC'      },
  { id: 'nor', name: 'Noruega',         flag: '🇳🇴', flagCode: 'no', confederation: 'UEFA'     },
  // GRUPO J
  { id: 'arg', name: 'Argentina',       flag: '🇦🇷', flagCode: 'ar', confederation: 'CONMEBOL' },
  { id: 'alg', name: 'Argelia',         flag: '🇩🇿', flagCode: 'dz', confederation: 'CAF'      },
  { id: 'aut', name: 'Austria',         flag: '🇦🇹', flagCode: 'at', confederation: 'UEFA'     },
  { id: 'jor', name: 'Jordania',        flag: '🇯🇴', flagCode: 'jo', confederation: 'AFC'      },
  // GRUPO K
  { id: 'por', name: 'Portugal',        flag: '🇵🇹', flagCode: 'pt', confederation: 'UEFA'     },
  { id: 'cod', name: 'RD Congo',        flag: '🇨🇩', flagCode: 'cd', confederation: 'CAF'      },
  { id: 'uzb', name: 'Uzbekistán',      flag: '🇺🇿', flagCode: 'uz', confederation: 'AFC'      },
  { id: 'col', name: 'Colombia',        flag: '🇨🇴', flagCode: 'co', confederation: 'CONMEBOL' },
  // GRUPO L
  { id: 'eng', name: 'Inglaterra',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', flagCode: 'gb-eng', confederation: 'UEFA' },
  { id: 'cro', name: 'Croacia',         flag: '🇭🇷', flagCode: 'hr', confederation: 'UEFA'     },
  { id: 'gha', name: 'Ghana',           flag: '🇬🇭', flagCode: 'gh', confederation: 'CAF'      },
  { id: 'pan', name: 'Panamá',          flag: '🇵🇦', flagCode: 'pa', confederation: 'CONCACAF' },
];

export const getTeamById = (id) => teams.find(t => t.id === id);