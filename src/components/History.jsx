import React, { useState, useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { getTeamById } from '../data/teams';

const card = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
};

const History = ({ users, currentUser, matches }) => {
  const [selectedUserId, setSelectedUserId] = useState(null);

  const sortedUsers = [...users].sort((a, b) => b.points - a.points);
  const selectedUser = users.find(u => u.id === selectedUserId);

  const finishedMatches = useMemo(() =>
    matches.filter(m => m.status === 'finished')
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [matches]
  );

  const getPredictionResult = (match, prediction) => {
    if (!prediction) return 'none';
    const actualResult = match.homeScore > match.awayScore ? 'home'
      : match.homeScore < match.awayScore ? 'away' : 'draw';
    const predictedResult = prediction.result
      || (prediction.homeScore > prediction.awayScore ? 'home'
        : prediction.homeScore < prediction.awayScore ? 'away' : 'draw');
    const isExact = prediction.homeScore !== undefined && prediction.awayScore !== undefined
      && parseInt(prediction.homeScore) === parseInt(match.homeScore)
      && parseInt(prediction.awayScore) === parseInt(match.awayScore);
    if (isExact) return 'exact';
    if (predictedResult === actualResult) return 'correct';
    return 'wrong';
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'America/Bogota'
  });

  // ── Vista lista de jugadores ──
  if (!selectedUser) {
    return (
      <div>
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>Historial de jugadores</h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Selecciona un jugador para ver sus pronósticos</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sortedUsers.map((user, idx) => {
            const isMe = user.id === currentUser.id;
            const medals = ['🥇','🥈','🥉'];
            const totalPredicted = finishedMatches.filter(m => user.predictions[m.id]).length;
            let exact = 0, correct = 0;
            finishedMatches.forEach(m => {
              const r = getPredictionResult(m, user.predictions[m.id]);
              if (r === 'exact') exact++;
              else if (r === 'correct') correct++;
            });

            return (
              <button key={user.id} onClick={() => setSelectedUserId(user.id)}
                style={{
                  ...card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  background: isMe ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.04)',
                  borderLeft: isMe ? '3px solid #4ade80' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}>
                <div style={{ fontSize: idx < 3 ? '22px' : '14px', fontWeight: '700', color: 'rgba(255,255,255,0.35)', width: '28px', textAlign: 'center' }}>
                  {idx < 3 ? medals[idx] : `${idx+1}`}
                </div>
                <span style={{ fontSize: '28px' }}>{user.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
                      {user.nickname || user.name}
                    </span>
                    {isMe && <span style={{ fontSize: '10px', background: 'rgba(74,222,128,0.2)', color: '#4ade80', padding: '1px 6px', borderRadius: '4px' }}>tú</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                    <span>{totalPredicted} pronósticos</span>
                    <span style={{ color: '#fde047' }}>🎯 {exact}</span>
                    <span style={{ color: '#4ade80' }}>✓ {correct}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#4ade80' }}>{user.points}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>pts</div>
                </div>
                <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.25)' }}>›</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Vista historial de un jugador ──
  const userMatches = finishedMatches.filter(m => selectedUser.predictions[m.id]);
  const noPredict   = finishedMatches.filter(m => !selectedUser.predictions[m.id]);

  const resultColors = {
    exact:   { bg: 'rgba(253,224,71,0.08)',  border: 'rgba(253,224,71,0.25)',   text: '#fde047', label: '🎯 Exacto +3' },
    correct: { bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)',   text: '#4ade80', label: '✓ Correcto +1' },
    wrong:   { bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.2)',   text: '#f87171', label: '✗ Falló' },
    none:    { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)',  text: '#64748b', label: 'Sin pronóstico' },
  };

  let exact = 0, correct = 0, wrong = 0;
  userMatches.forEach(m => {
    const r = getPredictionResult(m, selectedUser.predictions[m.id]);
    if (r === 'exact') exact++;
    else if (r === 'correct') correct++;
    else wrong++;
  });

  return (
    <div>
      {/* Header jugador */}
      <div style={{ ...card, padding: '16px 18px', marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg,#7c3aed,#c026d3)' }} />
        <button onClick={() => setSelectedUserId(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '12px', padding: 0 }}>
          <ChevronLeft size={15} /> Volver
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '40px' }}>{selectedUser.avatar}</span>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: 'white' }}>{selectedUser.nickname || selectedUser.name}</div>
            <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: '600', marginTop: '2px' }}>{selectedUser.points} puntos</div>
          </div>
        </div>
        {/* Mini stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginTop: '14px' }}>
          {[
            { label: '🎯 Exactos', val: exact, color: '#fde047' },
            { label: '✓ Correctos', val: correct, color: '#4ade80' },
            { label: '✗ Fallidos', val: wrong, color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de pronósticos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {userMatches.map(match => {
          const homeTeam = getTeamById(match.homeTeam);
          const awayTeam = getTeamById(match.awayTeam);
          const pred = selectedUser.predictions[match.id];
          const predResult = getPredictionResult(match, pred);
          const rc = resultColors[predResult];

          return (
            <div key={match.id} style={{ background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: '12px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{formatDate(match.date)}{match.group ? ` · Grupo ${match.group}` : ''}</span>
                <span style={{ fontSize: '11px', fontWeight: '600', color: rc.text }}>{rc.label}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px' }}>{homeTeam?.flag || '❓'}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '3px' }}>{homeTeam?.name}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '70px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>
                    {match.homeScore} <span style={{ color: 'rgba(255,255,255,0.3)' }}>-</span> {match.awayScore}
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>resultado</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '28px' }}>{awayTeam?.flag || '❓'}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '3px' }}>{awayTeam?.name}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Pronóstico:</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: rc.text }}>
                  {pred.homeScore !== undefined && pred.awayScore !== undefined
                    ? `${pred.homeScore} - ${pred.awayScore}`
                    : pred.result === 'home' ? `Gana ${homeTeam?.name}`
                    : pred.result === 'away' ? `Gana ${awayTeam?.name}`
                    : 'Empate'}
                </span>
              </div>
            </div>
          );
        })}

        {userMatches.length === 0 && (
          <div style={{ ...card, padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>📋</div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
              {finishedMatches.length === 0 ? 'Aún no hay partidos finalizados' : 'Este jugador no ha hecho pronósticos aún'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
