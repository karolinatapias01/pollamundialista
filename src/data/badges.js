export const badges = [
    {
      id: 'sharpshooter',
      name: 'Francotirador',
      icon: '🎯',
      description: 'Acertaste 3 marcadores exactos',
      condition: (user) => user.stats?.exactScores >= 3
    },
    {
      id: 'onfire',
      name: 'En Llamas',
      icon: '🔥',
      description: 'Racha de 5 aciertos seguidos',
      condition: (user) => user.stats?.maxStreak >= 5
    },
    {
      id: 'oracle',
      name: 'Oráculo',
      icon: '👑',
      description: 'Acertaste al campeón del mundial',
      condition: (user) => user.championPrediction && user.stats?.championCorrect
    },
    {
      id: 'prophet',
      name: 'Profeta',
      icon: '🔮',
      description: 'Más del 70% de aciertos',
      condition: (user) => {
        const total = user.stats?.correctPredictions + user.stats?.incorrectPredictions || 0;
        if (total < 10) return false;
        const accuracy = (user.stats?.correctPredictions / total) * 100;
        return accuracy >= 70;
      }
    },
    {
      id: 'consistent',
      name: 'Consistente',
      icon: '·',
      description: 'Pronosticaste todos los partidos de la fase de grupos',
      condition: (user) => user.stats?.totalPredictions >= 48
    },
    {
      id: 'lucky',
      name: 'Suertudo',
      icon: '🍀',
      description: 'Acertaste un resultado considerado sorpresa',
      condition: (user) => user.stats?.surprises >= 1
    },
    {
      id: 'participant',
      name: 'Participante',
      icon: '🎖️',
      description: 'Hiciste tu primer pronóstico',
      condition: (user) => user.stats?.totalPredictions >= 1
    },
    {
      id: 'dedicated',
      name: 'Dedicado',
      icon: '💪',
      description: 'Pronosticaste más de 30 partidos',
      condition: (user) => user.stats?.totalPredictions >= 30
    }
  ];
  
  export const checkBadges = (user) => {
    return badges.filter(badge => badge.condition(user));
  };
  