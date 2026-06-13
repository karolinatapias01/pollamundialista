// Solicitar permiso de notificaciones
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };
  
  // Enviar notificación
  const sendNotification = (title, body, icon = '/vite.svg') => {
    if (Notification.permission !== 'granted') return;
    new Notification(title, { body, icon });
  };
  
  // Verificar partidos próximos a cerrar
  export const checkUpcomingMatches = (matches, currentUser) => {
    const now = new Date();
    matches.forEach(match => {
      if (match.status === 'finished') return;
      if (!match.homeTeam || !match.awayTeam) return;
  
      const matchDate = new Date(match.date);
      const diffMinutes = (matchDate - now) / 60000;
  
      // Notificar a los 60 minutos si no ha pronosticado
      if (diffMinutes > 59 && diffMinutes <= 60) {
        const hasPred = currentUser.predictions?.[match.id];
        if (!hasPred) {
          sendNotification(
            '⏰ ¡Cierra pronto!',
            `Tienes 1 hora para pronosticar el partido. No te quedes sin puntuar.`
          );
        }
      }
  
      // Notificar a los 15 minutos si no ha pronosticado
      if (diffMinutes > 14 && diffMinutes <= 15) {
        const hasPred = currentUser.predictions?.[match.id];
        if (!hasPred) {
          sendNotification(
            '🚨 ¡Últimos 15 minutos!',
            `El pronóstico cierra muy pronto. ¡Entra ya a la app!`
          );
        }
      }
  
      // Notificar a los 10 minutos (cierre)
      if (diffMinutes > 9 && diffMinutes <= 10) {
        sendNotification(
          '🔒 ¡Pronóstico cerrando!',
          `En 10 minutos se cierran los pronósticos. ¡Es tu última oportunidad!`
        );
      }
    });
  };
  
  // Iniciar verificación cada minuto
  export const startNotifications = (matches, currentUser) => {
    requestNotificationPermission();
    checkUpcomingMatches(matches, currentUser);
    return setInterval(() => {
      checkUpcomingMatches(matches, currentUser);
    }, 60 * 1000);
  };