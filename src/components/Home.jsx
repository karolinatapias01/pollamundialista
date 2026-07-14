import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import { getTeamById } from '../data/teams';

const card = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px' };

const Flag = ({ code, size = 32 }) => {
  if (!code) return <span style={{fontSize:size*0.7+'px'}}>🏳️</span>;
  return (
    <img src={`https://hatscripts.github.io/circle-flags/flags/${code.toLowerCase()}.svg`}
      width={size} height={size} alt={code}
      style={{borderRadius:'50%',objectFit:'cover'}}
      onError={e=>{e.target.style.display='none';}}/>
  );
};

const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!targetDate) return;
    const update = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) { setTimeLeft('¡Ya empezó!'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
      else setTimeLeft(`${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);
  return timeLeft;
};

const ALL_GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

const Home = ({ users, currentUser, matches, onNavigate }) => {
  const [showGroupsDetail, setShowGroupsDetail] = useState(false);
  const [showR32Detail, setShowR32Detail] = useState(false);
  const [showQrtDetail, setShowQrtDetail] = useState(false);
  const [showSemisDetail, setShowSemisDetail] = useState(false);

  const liveUser = users.find(u => u.id === currentUser.id) || currentUser;

  const sortedUsers = [...users].sort((a,b) => (b.points||0) - (a.points||0));
  const myPosition = sortedUsers.findIndex(u => u.id === currentUser.id) + 1;

  const nextMatch = useMemo(() => {
    const now = new Date();
    return matches
      .filter(m => m.status !== 'finished' && m.homeTeam && m.awayTeam && new Date(m.date) > now)
      .sort((a,b) => new Date(a.date) - new Date(b.date))[0];
  }, [matches]);

  const lastMatch = useMemo(() => {
    return matches
      .filter(m => m.status === 'finished')
      .sort((a,b) => new Date(b.date) - new Date(a.date))[0];
  }, [matches]);

  const todayMatches = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    return matches.filter(m => {
      const d = new Date(m.date).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
      return d === today && m.homeTeam && m.awayTeam;
    });
  }, [matches]);

  const countdown = useCountdown(nextMatch?.date);

  const formatTime = (ds) => new Date(ds).toLocaleTimeString('es-CO',{
    timeZone:'America/Bogota', hour:'2-digit', minute:'2-digit', hour12:true
  });

  const formatDate = (ds) => new Date(ds).toLocaleDateString('es-CO',{
    timeZone:'America/Bogota', weekday:'short', day:'numeric', month:'short'
  });

  const pendingToday = todayMatches.filter(m => {
    const canPredict = new Date() < new Date(new Date(m.date).getTime() - 10*60*1000);
    return canPredict && !liveUser.predictions?.[m.id] && m.status !== 'finished';
  });

  const pendingGroups = useMemo(() => {
    return ALL_GROUPS.filter(g => {
      const firstMatch = matches
        .filter(m => m.phase==='groups' && m.group===g)
        .sort((a,b) => new Date(a.date)-new Date(b.date))[0];
      if (!firstMatch) return false;
      const isOpen = new Date() < new Date(firstMatch.date);
      const hasPred = liveUser.groupPredictions?.[g];
      return isOpen && !hasPred;
    });
  }, [matches, liveUser]);

  const groupsWithResults = useMemo(() => {
    const results = liveUser.groupResults || {};
    return ALL_GROUPS.filter(g => results[g]?.first && results[g]?.second);
  }, [liveUser]);

  const myGroupPoints = useMemo(() => {
    const results = liveUser.groupResults || {};
    const preds = liveUser.groupPredictions || {};
    let total = 0;
    groupsWithResults.forEach(g => {
      const pred = preds[g];
      const result = results[g];
      if (!pred || !result) return;
      if (pred.first === result.first && pred.second === result.second) total += 10;
      else if (
        (pred.first === result.first || pred.first === result.second) &&
        (pred.second === result.first || pred.second === result.second)
      ) total += 5;
      else if (
        pred.first === result.first || pred.first === result.second ||
        pred.second === result.first || pred.second === result.second
      ) total += 2;
    });
    return total;
  }, [liveUser, groupsWithResults]);

  // Puntos R32 clasificados
  const r32Results = liveUser.round16Results || [];
  const r32Pred = liveUser.round16Prediction || [];
  const hasR32Results = r32Results.length > 0;
  const myR32Points = useMemo(() => {
    if (!hasR32Results || r32Pred.length === 0) return 0;
    return r32Results.filter(t => r32Pred.includes(t)).length * 2;
  }, [r32Results, r32Pred, hasR32Results]);

  // Puntos Octavos clasificados
  const qrtResults = liveUser.quartersResults || [];
  const qrtPred = liveUser.quartersPrediction || [];
  const hasQrtResults = qrtResults.length > 0;
  const myQrtPoints = useMemo(() => {
    if (!hasQrtResults || qrtPred.length === 0) return 0;
    return qrtResults.filter(t => qrtPred.includes(t)).length * 2;
  }, [qrtResults, qrtPred, hasQrtResults]);
const semResults = liveUser.semisResults || [];
  const semPred = liveUser.quartersPrediction || [];
  const hasSemResults = semResults.length > 0;
  const mySemPoints = useMemo(() => {
    if (!hasSemResults || semPred.length === 0) return 0;
    return semResults.filter(t => semPred.includes(t)).length * 5;
  }, [semResults, semPred, hasSemResults]);
  const s = (key) => liveUser?.stats?.[key] ?? 0;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>

      {/* Bienvenida */}
      <div style={{...card, padding:'20px 22px', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:'linear-gradient(90deg,#16a34a,#4ade80)'}}/>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
          <div style={{fontSize:'36px'}}>{liveUser.avatar?.length<=2?liveUser.avatar:'👤'}</div>
          <div>
            <div style={{fontSize:'18px',fontWeight:'800',color:'white'}}>
              ¡Hola, {liveUser.nickname||liveUser.name}!
            </div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.45)',marginTop:'2px'}}>
              Mundial 2026 · {matches.filter(m=>m.status==='finished').length} partidos jugados
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px'}}>
          {[
            {label:'Posición', val:myPosition>0?`#${myPosition}`:'-', color:'#fbbf24', icon:'🏅'},
            {label:'Puntos',   val:liveUser.points||0,                 color:'#4ade80', icon:'⭐'},
            {label:'Aciertos', val:s('correctPredictions'),            color:'#60a5fa', icon:'✓'},
            {label:'Exactos',  val:s('exactScores'),                   color:'#fde047', icon:'🎯'},
          ].map(stat=>(
            <div key={stat.label} style={{background:'rgba(255,255,255,0.05)',borderRadius:'12px',padding:'12px 8px',textAlign:'center'}}>
              <div style={{fontSize:'8px',marginBottom:'4px'}}>{stat.icon}</div>
              <div style={{fontSize:'20px',fontWeight:'800',color:stat.color}}>{stat.val}</div>
              <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',marginTop:'2px'}}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Banner grupos */}
      {groupsWithResults.length > 0 && (
        <div style={{borderRadius:'14px',background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.25)',overflow:'hidden'}}>
          <div style={{padding:'14px 16px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:'13px',fontWeight:'700',color:'#4ade80',marginBottom:'3px'}}>
                  📊 Puntos de clasificados asignados
                </div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.45)'}}>
                  {groupsWithResults.length} grupo{groupsWithResults.length>1?'s':''} calificados · Tú obtuviste{' '}
                  <span style={{color:'#4ade80',fontWeight:'700'}}>{myGroupPoints} pts</span> de grupos
                </div>
              </div>
              <button onClick={()=>setShowGroupsDetail(!showGroupsDetail)}
                style={{padding:'6px 12px',borderRadius:'8px',background:'rgba(74,222,128,0.15)',border:'1px solid rgba(74,222,128,0.3)',color:'#4ade80',fontSize:'12px',fontWeight:'600',cursor:'pointer',whiteSpace:'nowrap',marginLeft:'10px'}}>
                {showGroupsDetail ? 'Ocultar' : 'Ver detalle'}
              </button>
            </div>
          </div>
          {showGroupsDetail && (
            <div style={{borderTop:'1px solid rgba(74,222,128,0.15)',padding:'12px 16px',display:'flex',flexDirection:'column',gap:'8px'}}>
              {groupsWithResults.map(g => {
                const results = liveUser.groupResults || {};
                const preds = liveUser.groupPredictions || {};
                const result = results[g];
                const pred = preds[g];
                const first = getTeamById(result?.first);
                const second = getTeamById(result?.second);
                const predFirst = getTeamById(pred?.first);
                const predSecond = getTeamById(pred?.second);
                let pts = 0, label = '';
                if (pred && result) {
                  if (pred.first === result.first && pred.second === result.second) { pts = 10; label = '🥇 Orden exacto'; }
                  else if ((pred.first === result.first || pred.first === result.second) && (pred.second === result.first || pred.second === result.second)) { pts = 5; label = '✓ Ambos equipos'; }
                  else if (pred.first === result.first || pred.first === result.second || pred.second === result.first || pred.second === result.second) { pts = 2; label = '~ Un equipo'; }
                  else { pts = 0; label = '✗ Sin acierto'; }
                }
                return (
                  <div key={g} style={{padding:'10px 12px',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                      <span style={{fontSize:'12px',fontWeight:'700',color:'rgba(255,255,255,0.6)'}}>Grupo {g}</span>
                      <span style={{fontSize:'13px',fontWeight:'800',color:pts>0?'#4ade80':'#f87171'}}>{pts>0?`+${pts} pts`:pred?label:'Sin pronóstico'}</span>
                    </div>
                    <div style={{display:'flex',gap:'12px'}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Resultado</div>
                        <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'5px'}}><Flag code={first?.flagCode} size={14}/><span style={{fontSize:'11px',color:'rgba(255,255,255,0.7)'}}>🥇 {first?.name||'—'}</span></div>
                          <div style={{display:'flex',alignItems:'center',gap:'5px'}}><Flag code={second?.flagCode} size={14}/><span style={{fontSize:'11px',color:'rgba(255,255,255,0.7)'}}>🥈 {second?.name||'—'}</span></div>
                        </div>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Tu pronóstico</div>
                        {pred ? (
                          <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'5px'}}><Flag code={predFirst?.flagCode} size={14}/><span style={{fontSize:'11px',color:'rgba(255,255,255,0.7)'}}>🥇 {predFirst?.name||'—'}</span></div>
                            <div style={{display:'flex',alignItems:'center',gap:'5px'}}><Flag code={predSecond?.flagCode} size={14}/><span style={{fontSize:'11px',color:'rgba(255,255,255,0.7)'}}>🥈 {predSecond?.name||'—'}</span></div>
                          </div>
                        ) : <span style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>Sin pronóstico</span>}
                      </div>
                    </div>
                    {pts > 0 && label && <div style={{marginTop:'6px',fontSize:'10px',color:'rgba(74,222,128,0.7)'}}>{label}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Banner R32 */}
      {hasR32Results && (
        <div style={{borderRadius:'14px',background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.25)',overflow:'hidden'}}>
          <div style={{padding:'14px 16px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:'13px',fontWeight:'700',color:'#fbbf24',marginBottom:'3px'}}>
                  🔥 Puntos clasificados R32 asignados
                </div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.45)'}}>
                  {r32Results.length} equipos confirmados · Tú obtuviste{' '}
                  <span style={{color:'#fbbf24',fontWeight:'700'}}>{myR32Points} pts</span> de clasificados R32
                  {r32Pred.length > 0 && (
                    <span style={{color:'rgba(255,255,255,0.35)',marginLeft:'6px'}}>
                      ({r32Results.filter(t => r32Pred.includes(t)).length}/{r32Results.length} aciertos)
                    </span>
                  )}
                </div>
              </div>
              <button onClick={()=>setShowR32Detail(!showR32Detail)}
                style={{padding:'6px 12px',borderRadius:'8px',background:'rgba(251,191,36,0.15)',border:'1px solid rgba(251,191,36,0.3)',color:'#fbbf24',fontSize:'12px',fontWeight:'600',cursor:'pointer',whiteSpace:'nowrap',marginLeft:'10px'}}>
                {showR32Detail ? 'Ocultar' : 'Ver detalle'}
              </button>
            </div>
          </div>
          {showR32Detail && (
            <div style={{borderTop:'1px solid rgba(251,191,36,0.15)',padding:'12px 16px'}}>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'10px'}}>Tus {r32Pred.length} equipos seleccionados:</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'14px'}}>
                {r32Pred.length > 0 ? r32Pred.map(teamId => {
                  const team = getTeamById(teamId);
                  const isCorrect = r32Results.includes(teamId);
                  return (
                    <div key={teamId} style={{display:'flex',alignItems:'center',gap:'4px',padding:'5px 10px',borderRadius:'8px',
                      background:isCorrect?'rgba(74,222,128,0.15)':'rgba(239,68,68,0.1)',
                      border:isCorrect?'1px solid rgba(74,222,128,0.3)':'1px solid rgba(239,68,68,0.2)'}}>
                      <Flag code={team?.flagCode} size={16}/>
                      <span style={{fontSize:'11px',color:isCorrect?'#4ade80':'#f87171'}}>{team?.name||teamId}</span>
                      <span style={{fontSize:'10px'}}>{isCorrect?'✓':'✗'}</span>
                    </div>
                  );
                }) : <span style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>No pronosticaste</span>}
              </div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'10px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.05em'}}>👥 Pronósticos de todos</div>
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {[...users].filter(u=>u.round16Prediction?.length>0).sort((a,b)=>{
                  const ptsA = (a.round16Results||r32Results).filter(t=>(a.round16Prediction||[]).includes(t)).length*2;
                  const ptsB = (b.round16Results||r32Results).filter(t=>(b.round16Prediction||[]).includes(t)).length*2;
                  return ptsB - ptsA;
                }).map(u => {
                  const pred = u.round16Prediction || [];
                  const aciertos = r32Results.filter(t => pred.includes(t)).length;
                  const pts = aciertos * 2;
                  const team = getTeamById(u.avatar);
                  const isMe = u.id === currentUser.id;
                  return (
                    <div key={u.id} style={{padding:'10px 12px',borderRadius:'10px',
                      background:isMe?'rgba(251,191,36,0.08)':'rgba(255,255,255,0.03)',
                      border:isMe?'1px solid rgba(251,191,36,0.2)':'1px solid rgba(255,255,255,0.06)'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                          {team?.flagCode
                            ?<img src={`https://hatscripts.github.io/circle-flags/flags/${team.flagCode}.svg`} width={20} height={20} style={{borderRadius:'50%'}} onError={e=>{e.target.style.display='none';}}/>
                            :<span style={{fontSize:'16px'}}>{u.avatar||'👤'}</span>
                          }
                          <span style={{fontSize:'13px',fontWeight:'600',color:isMe?'#fbbf24':'rgba(255,255,255,0.85)'}}>
                            {u.name}{u.nickname&&u.nickname!==u.name?` (${u.nickname})`:''}
                            {isMe&&<span style={{fontSize:'10px',color:'#fbbf24',marginLeft:'4px'}}>tú</span>}
                          </span>
                        </div>
                        <span style={{fontSize:'13px',fontWeight:'700',color:pts>0?'#4ade80':'rgba(255,255,255,0.3)'}}>
                          {aciertos}/{r32Results.length} · +{pts} pts
                        </span>
                      </div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                        {pred.map(teamId => {
                          const t = getTeamById(teamId);
                          const ok = r32Results.includes(teamId);
                          return (
                            <div key={teamId} style={{display:'flex',alignItems:'center',gap:'3px',padding:'3px 7px',borderRadius:'6px',
                              background:ok?'rgba(74,222,128,0.12)':'rgba(239,68,68,0.08)',
                              border:ok?'1px solid rgba(74,222,128,0.25)':'1px solid rgba(239,68,68,0.15)'}}>
                              <Flag code={t?.flagCode} size={12}/>
                              <span style={{fontSize:'10px',color:ok?'#4ade80':'#f87171'}}>{t?.name||teamId}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ Banner Octavos clasificados */}
      {hasQrtResults && (
        <div style={{borderRadius:'14px',background:'rgba(96,165,250,0.08)',border:'1px solid rgba(96,165,250,0.25)',overflow:'hidden'}}>
          <div style={{padding:'14px 16px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:'13px',fontWeight:'700',color:'#93c5fd',marginBottom:'3px'}}>
                  💪 Puntos clasificados Octavos asignados
                </div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.45)'}}>
                  {qrtResults.length} equipos confirmados · Tú obtuviste{' '}
                  <span style={{color:'#93c5fd',fontWeight:'700'}}>{myQrtPoints} pts</span> de clasificados Octavos
                  {qrtPred.length > 0 && (
                    <span style={{color:'rgba(255,255,255,0.35)',marginLeft:'6px'}}>
                      ({qrtResults.filter(t => qrtPred.includes(t)).length}/{qrtResults.length} aciertos)
                    </span>
                  )}
                </div>
              </div>
              <button onClick={()=>setShowQrtDetail(!showQrtDetail)}
                style={{padding:'6px 12px',borderRadius:'8px',background:'rgba(96,165,250,0.15)',border:'1px solid rgba(96,165,250,0.3)',color:'#93c5fd',fontSize:'12px',fontWeight:'600',cursor:'pointer',whiteSpace:'nowrap',marginLeft:'10px'}}>
                {showQrtDetail ? 'Ocultar' : 'Ver detalle'}
              </button>
            </div>
          </div>
          {showQrtDetail && (
            <div style={{borderTop:'1px solid rgba(96,165,250,0.15)',padding:'12px 16px'}}>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'10px'}}>Tus {qrtPred.length} equipos seleccionados:</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'14px'}}>
                {qrtPred.length > 0 ? qrtPred.map(teamId => {
                  const team = getTeamById(teamId);
                  const isCorrect = qrtResults.includes(teamId);
                  return (
                    <div key={teamId} style={{display:'flex',alignItems:'center',gap:'4px',padding:'5px 10px',borderRadius:'8px',
                      background:isCorrect?'rgba(74,222,128,0.15)':'rgba(239,68,68,0.1)',
                      border:isCorrect?'1px solid rgba(74,222,128,0.3)':'1px solid rgba(239,68,68,0.2)'}}>
                      <Flag code={team?.flagCode} size={16}/>
                      <span style={{fontSize:'11px',color:isCorrect?'#4ade80':'#f87171'}}>{team?.name||teamId}</span>
                      <span style={{fontSize:'10px'}}>{isCorrect?'✓':'✗'}</span>
                    </div>
                  );
                }) : <span style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>No pronosticaste</span>}
              </div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'10px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.05em'}}>👥 Pronósticos de todos</div>
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {[...users].filter(u=>u.quartersPrediction?.length>0).sort((a,b)=>{
                  const ptsA = (a.quartersResults||qrtResults).filter(t=>(a.quartersPrediction||[]).includes(t)).length*2;
                  const ptsB = (b.quartersResults||qrtResults).filter(t=>(b.quartersPrediction||[]).includes(t)).length*2;
                  return ptsB - ptsA;
                }).map(u => {
                  const pred = u.quartersPrediction || [];
                  const aciertos = qrtResults.filter(t => pred.includes(t)).length;
                  const pts = aciertos * 2;
                  const team = getTeamById(u.avatar);
                  const isMe = u.id === currentUser.id;
                  return (
                    <div key={u.id} style={{padding:'10px 12px',borderRadius:'10px',
                      background:isMe?'rgba(96,165,250,0.08)':'rgba(255,255,255,0.03)',
                      border:isMe?'1px solid rgba(96,165,250,0.2)':'1px solid rgba(255,255,255,0.06)'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                          {team?.flagCode
                            ?<img src={`https://hatscripts.github.io/circle-flags/flags/${team.flagCode}.svg`} width={20} height={20} style={{borderRadius:'50%'}} onError={e=>{e.target.style.display='none';}}/>
                            :<span style={{fontSize:'16px'}}>{u.avatar||'👤'}</span>
                          }
                          <span style={{fontSize:'13px',fontWeight:'600',color:isMe?'#93c5fd':'rgba(255,255,255,0.85)'}}>
                            {u.name}{u.nickname&&u.nickname!==u.name?` (${u.nickname})`:''}
                            {isMe&&<span style={{fontSize:'10px',color:'#93c5fd',marginLeft:'4px'}}>tú</span>}
                          </span>
                        </div>
                        <span style={{fontSize:'13px',fontWeight:'700',color:pts>0?'#4ade80':'rgba(255,255,255,0.3)'}}>
                          {aciertos}/{qrtResults.length} · +{pts} pts
                        </span>
                      </div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                        {pred.map(teamId => {
                          const t = getTeamById(teamId);
                          const ok = qrtResults.includes(teamId);
                          return (
                            <div key={teamId} style={{display:'flex',alignItems:'center',gap:'3px',padding:'3px 7px',borderRadius:'6px',
                              background:ok?'rgba(74,222,128,0.12)':'rgba(239,68,68,0.08)',
                              border:ok?'1px solid rgba(74,222,128,0.25)':'1px solid rgba(239,68,68,0.15)'}}>
                              <Flag code={t?.flagCode} size={12}/>
                              <span style={{fontSize:'10px',color:ok?'#4ade80':'#f87171'}}>{t?.name||teamId}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {hasSemResults && (
        <div style={{borderRadius:'14px',background:'rgba(168,85,247,0.08)',border:'1px solid rgba(168,85,247,0.25)',overflow:'hidden'}}>
          <div style={{padding:'14px 16px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:'13px',fontWeight:'700',color:'#c084fc',marginBottom:'3px'}}>
                  ⚔️ Puntos clasificados Semis asignados
                </div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.45)'}}>
                  {semResults.length} equipos confirmados · Tú obtuviste{' '}
                  <span style={{color:'#c084fc',fontWeight:'700'}}>{mySemPoints} pts</span> de clasificados Semis
                  {semPred.length > 0 && (
                    <span style={{color:'rgba(255,255,255,0.35)',marginLeft:'6px'}}>
                      ({semResults.filter(t => semPred.includes(t)).length}/{semResults.length} aciertos)
                    </span>
                  )}
                </div>
              </div>
              <button onClick={()=>setShowSemisDetail(!showSemisDetail)}
                style={{padding:'6px 12px',borderRadius:'8px',background:'rgba(168,85,247,0.15)',border:'1px solid rgba(168,85,247,0.3)',color:'#c084fc',fontSize:'12px',fontWeight:'600',cursor:'pointer',whiteSpace:'nowrap',marginLeft:'10px'}}>
                {showSemisDetail ? 'Ocultar' : 'Ver detalle'}
              </button>
            </div>
          </div>
          {showSemisDetail && (
            <div style={{borderTop:'1px solid rgba(168,85,247,0.15)',padding:'12px 16px'}}>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'10px'}}>Tus equipos seleccionados:</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                {semPred.length > 0 ? semPred.map(teamId => {
                  const team = getTeamById(teamId);
                  const isCorrect = semResults.includes(teamId);
                  return (
                    <div key={teamId} style={{display:'flex',alignItems:'center',gap:'4px',padding:'5px 10px',borderRadius:'8px',
                      background:isCorrect?'rgba(74,222,128,0.15)':'rgba(239,68,68,0.1)',
                      border:isCorrect?'1px solid rgba(74,222,128,0.3)':'1px solid rgba(239,68,68,0.2)'}}>
                      <Flag code={team?.flagCode} size={16}/>
                      <span style={{fontSize:'11px',color:isCorrect?'#4ade80':'#f87171'}}>{team?.name||teamId}</span>
                      <span style={{fontSize:'10px'}}>{isCorrect?'✓':'✗'}</span>
                    </div>
                  );
                }) : <span style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>No pronosticaste</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerta grupos sin pronosticar */}
      {pendingGroups.length > 0 && (
        <div style={{padding:'14px 16px',borderRadius:'14px',background:'rgba(168,85,247,0.1)',border:'1px solid rgba(168,85,247,0.3)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:'13px',fontWeight:'700',color:'#c084fc',marginBottom:'3px'}}>
                📊 Tienes {pendingGroups.length} grupo{pendingGroups.length>1?'s':''} sin pronosticar
              </div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.45)'}}>
                Grupo{pendingGroups.length>1?'s':''}: {pendingGroups.join(', ')} · ¡Hazlo antes de que cierren!
              </div>
            </div>
            <button onClick={()=>onNavigate('groups')}
              style={{padding:'8px 14px',borderRadius:'10px',background:'rgba(168,85,247,0.2)',border:'1px solid rgba(168,85,247,0.4)',color:'#c084fc',fontSize:'12px',fontWeight:'600',cursor:'pointer',whiteSpace:'nowrap',marginLeft:'10px'}}>
              Ir →
            </button>
          </div>
        </div>
      )}

      {/* Alerta partidos pendientes hoy */}
      {pendingToday.length > 0 && (
        <div style={{padding:'14px 16px',borderRadius:'14px',background:'rgba(251,191,36,0.1)',border:'1px solid rgba(251,191,36,0.3)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:'13px',fontWeight:'700',color:'#fbbf24',marginBottom:'3px'}}>
                ⚠️ Tienes {pendingToday.length} partido{pendingToday.length>1?'s':''} sin pronosticar hoy
              </div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.45)'}}>
                {pendingToday.map(m=>{
                  const h=getTeamById(m.homeTeam); const a=getTeamById(m.awayTeam);
                  return `${h?.name} vs ${a?.name}`;
                }).join(' · ')}
              </div>
            </div>
            <button onClick={()=>{
              const phase = pendingToday[0]?.phase || 'groups';
              onNavigate('matches', phase);
            }}
              style={{padding:'8px 14px',borderRadius:'10px',background:'rgba(251,191,36,0.2)',border:'1px solid rgba(251,191,36,0.4)',color:'#fbbf24',fontSize:'12px',fontWeight:'600',cursor:'pointer',whiteSpace:'nowrap',marginLeft:'10px'}}>
              Ir →
            </button>
          </div>
        </div>
      )}

      {/* Próximo partido */}
      {nextMatch && (
        <div style={{...card,padding:'18px 20px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:'linear-gradient(90deg,#3b82f6,#60a5fa)'}}/>
          <div style={{fontSize:'11px',fontWeight:'600',color:'#93c5fd',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'12px'}}>
            ⚡ Próximo partido
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
            <div style={{textAlign:'center'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:'6px'}}>
                <Flag code={getTeamById(nextMatch.homeTeam)?.flagCode} size={40}/>
              </div>
              <div style={{fontSize:'13px',fontWeight:'600',color:'rgba(255,255,255,0.85)'}}>{getTeamById(nextMatch.homeTeam)?.name}</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'22px',fontWeight:'300',color:'rgba(255,255,255,0.2)',letterSpacing:'4px',marginBottom:'4px'}}>vs</div>
              <div style={{fontSize:'12px',color:'#4ade80',fontWeight:'700'}}>{countdown}</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:'6px'}}>
                <Flag code={getTeamById(nextMatch.awayTeam)?.flagCode} size={40}/>
              </div>
              <div style={{fontSize:'13px',fontWeight:'600',color:'rgba(255,255,255,0.85)'}}>{getTeamById(nextMatch.awayTeam)?.name}</div>
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>
              <Clock size={12} style={{display:'inline',marginRight:'4px'}}/>
              {formatDate(nextMatch.date)} · {formatTime(nextMatch.date)}
            </div>
            {!liveUser.predictions?.[nextMatch.id] && (
              <button onClick={()=>onNavigate('matches', nextMatch.phase)}
                style={{padding:'6px 12px',borderRadius:'8px',background:'linear-gradient(135deg,#16a34a,#15803d)',border:'none',color:'white',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>
                Pronosticar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Partidos de hoy */}
      {todayMatches.length > 0 && (
        <div style={{...card,padding:'16px 18px'}}>
          <div style={{fontSize:'11px',fontWeight:'600',color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'12px'}}>
            📅 Partidos de hoy ({todayMatches.length})
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {todayMatches.map(m=>{
              const h=getTeamById(m.homeTeam); const a=getTeamById(m.awayTeam);
              const hasPred = liveUser.predictions?.[m.id];
              const isFinished = m.status==='finished';
              return(
                <div key={m.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                  <Flag code={h?.flagCode} size={24}/>
                  <span style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',fontWeight:'500'}}>{h?.name}</span>
                  <span style={{fontSize:'12px',color:'rgba(255,255,255,0.3)',margin:'0 4px'}}>
                    {isFinished?`${m.homeScore}-${m.awayScore}`:'vs'}
                  </span>
                  <span style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',fontWeight:'500'}}>{a?.name}</span>
                  <Flag code={a?.flagCode} size={24}/>
                  <span style={{marginLeft:'auto',fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>{formatTime(m.date)}</span>
                  {!isFinished && (
                    <span style={{fontSize:'10px',padding:'2px 7px',borderRadius:'6px',
                      background:hasPred?'rgba(74,222,128,0.15)':'rgba(251,191,36,0.15)',
                      color:hasPred?'#4ade80':'#fbbf24',
                      border:`1px solid ${hasPred?'rgba(74,222,128,0.3)':'rgba(251,191,36,0.3)'}`}}>
                      {hasPred?'✓':'Pendiente'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Último resultado */}
      {lastMatch && (
        <div style={{...card,padding:'16px 18px'}}>
          <div style={{fontSize:'11px',fontWeight:'600',color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'12px'}}>
            🏁 Último resultado
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:'12px'}}>
            <div style={{textAlign:'center'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:'6px'}}><Flag code={getTeamById(lastMatch.homeTeam)?.flagCode} size={32}/></div>
              <div style={{fontSize:'12px',fontWeight:'600',color:lastMatch.homeScore>lastMatch.awayScore?'white':'rgba(255,255,255,0.5)'}}>{getTeamById(lastMatch.homeTeam)?.name}</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'26px',fontWeight:'800',color:'white',letterSpacing:'-1px'}}>{lastMatch.homeScore} - {lastMatch.awayScore}</div>
              <div style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',marginTop:'2px'}}>{formatDate(lastMatch.date)}</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:'6px'}}><Flag code={getTeamById(lastMatch.awayTeam)?.flagCode} size={32}/></div>
              <div style={{fontSize:'12px',fontWeight:'600',color:lastMatch.awayScore>lastMatch.homeScore?'white':'rgba(255,255,255,0.5)'}}>{getTeamById(lastMatch.awayTeam)?.name}</div>
            </div>
          </div>
        </div>
      )}

      {/* Mini ranking */}
      {sortedUsers.length > 0 && (
        <div style={{...card,padding:'16px 18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
            <div style={{fontSize:'11px',fontWeight:'600',color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
              🏆 Ranking
            </div>
            <button onClick={()=>onNavigate('ranking')}
              style={{fontSize:'12px',color:'#4ade80',background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'3px'}}>
              Ver todo <ChevronRight size={13}/>
            </button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
            {sortedUsers.slice(0,5).map((user,idx)=>{
              const isMe = user.id===currentUser.id;
              const medals=['🥇','🥈','🥉'];
              return(
                <div key={user.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',borderRadius:'10px',
                  background:isMe?'rgba(74,222,128,0.08)':'transparent',
                  border:isMe?'1px solid rgba(74,222,128,0.2)':'1px solid transparent'}}>
                  <span style={{fontSize:idx<3?'16px':'13px',fontWeight:'600',color:'rgba(255,255,255,0.4)',width:'22px',textAlign:'center'}}>
                    {idx<3?medals[idx]:`${idx+1}`}
                  </span>
                  <span style={{fontSize:'20px'}}>{user.avatar?.length<=2?user.avatar:'👤'}</span>
                  <span style={{fontSize:'13px',fontWeight:'500',color:isMe?'#4ade80':'rgba(255,255,255,0.8)',flex:1}}>
                    {user.name}{user.nickname?` "${user.nickname}"`:''} 
                    {isMe&&<span style={{fontSize:'10px',color:'#4ade80',marginLeft:'6px'}}>tú</span>}
                  </span>
                  <span style={{fontSize:'16px',fontWeight:'800',color:'#4ade80'}}>{user.points||0}</span>
                </div>
              );
            })}
            {myPosition > 5 && (
              <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',borderRadius:'10px',background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.2)'}}>
                <span style={{fontSize:'13px',fontWeight:'600',color:'rgba(255,255,255,0.4)',width:'22px',textAlign:'center'}}>{myPosition}</span>
                <span style={{fontSize:'20px'}}>{liveUser.avatar?.length<=2?liveUser.avatar:'👤'}</span>
                <span style={{fontSize:'13px',fontWeight:'500',color:'#4ade80',flex:1}}>{liveUser.name}{liveUser.nickname?` "${liveUser.nickname}"`:''} <span style={{fontSize:'10px'}}>tú</span></span>
                <span style={{fontSize:'16px',fontWeight:'800',color:'#4ade80'}}>{liveUser.points||0}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;