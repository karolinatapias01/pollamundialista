import React, { useState, useMemo, useEffect } from 'react';
import { Clock, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTeamById } from '../data/teams';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';

const REACTION_EMOJIS = ['😂','🔥','💀','🤯','😭','🎉','👏','💪','🙌','😱','🤦','👑'];

const card = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px' };
const pill  = (active) => ({ padding:'6px 14px', borderRadius:'20px', fontSize:'13px', fontWeight:'500', cursor:'pointer', whiteSpace:'nowrap', border:active?'1px solid rgba(74,222,128,0.4)':'1px solid rgba(255,255,255,0.1)', background:active?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.04)', color:active?'#4ade80':'rgba(255,255,255,0.5)', transition:'all 0.15s' });

const Flag = ({ code, size = 40 }) => {
  if (!code) return <span style={{ fontSize: size * 0.7 + 'px' }}>🏳️</span>;
  return (
    <img src={`https://hatscripts.github.io/circle-flags/flags/${code.toLowerCase()}.svg`}
      width={size} height={size} alt={code}
      style={{ borderRadius: '50%', objectFit: 'cover' }}
      onError={(e) => { e.target.style.display='none'; }}/>
  );
};

const toColDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const todayCol  = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

const formatTimestamp = (ts) => {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const getPhaseLabel = (phase) => {
  switch(phase) {
    case 'round16':  return { correct: 3, exact: 9 };
    case 'quarters': return { correct: 4, exact: 12 };
    case 'semis':    return { correct: 5, exact: 15 };
    case 'third':    return { correct: 6, exact: 18 };
    case 'final':    return { correct: 7, exact: 21 };
    default:         return { correct: 1, exact: 4 };
  }
};

const getPredLabel = (pred, homeTeam, awayTeam) => {
  const result = pred.result || (
    pred.homeScore !== undefined && pred.awayScore !== undefined
      ? pred.homeScore > pred.awayScore ? 'home'
        : pred.homeScore < pred.awayScore ? 'away' : 'draw'
      : null
  );
  const resultLabel = result === 'home' ? `Gana ${homeTeam?.name||'Local'}`
    : result === 'away' ? `Gana ${awayTeam?.name||'Visitante'}`
    : result === 'draw' ? 'Empate' : '—';
  const scoreLabel = pred.homeScore !== undefined && pred.awayScore !== undefined
    ? `${pred.homeScore}-${pred.awayScore}` : '';
  return { resultLabel, scoreLabel, result };
};

const calcPredResult = (pred, match) => {
  const hasBothScores = pred.homeScore !== undefined && pred.awayScore !== undefined;
  const actualResult = match.homeScore > match.awayScore ? 'home'
    : match.homeScore < match.awayScore ? 'away' : 'draw';
  const predResult = pred.result || (hasBothScores
    ? (pred.homeScore > pred.awayScore ? 'home'
      : pred.homeScore < pred.awayScore ? 'away' : 'draw')
    : null);
  const correct = predResult !== null && predResult === actualResult;
  const exact = hasBothScores && correct
    && parseInt(pred.homeScore) === parseInt(match.homeScore)
    && parseInt(pred.awayScore) === parseInt(match.awayScore);
  return { correct, exact, predResult, actualResult };
};

const ROUND16_TEAMS = [
  'rsa','can','bra','jpn','ger','par','ned','mar',
  'civ','nor','fra','swe','mex','ecu','eng','cod',
  'bel','sen','usa','bih','esp','aut','arg','cpv',
  'sui','alg','col','gha','aus','egy','por','cro'
];

const QUARTERS_TEAMS = [
  'can','mar','par','fra','bra','nor','mex','eng',
  'por','esp','usa','bel','arg','egy','sui','col'
];

// ✅ 8 equipos que juegan cuartos de final
const SEMIS_TEAMS = [
  'fra','mar','esp','bel','nor','eng','arg','sui'
];

const Matches = ({ matches, currentUser, onMakePrediction, onSaveRound16Prediction, onSaveQuartersPrediction, onSaveSemisPrediction, reactions, onAddReaction, onRemoveReaction, users, initialPhase }) => {
  const [selectedPhase, setSelectedPhase] = useState(() => {
    if (initialPhase && initialPhase !== 'groups') return initialPhase;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const todayPhases = matches
      .filter(m => m.homeTeam && m.awayTeam && m.status !== 'finished')
      .filter(m => new Date(m.date).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) === today);
    if (todayPhases.length > 0) return todayPhases[0].phase;
    return initialPhase || 'groups';
  });
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [selectedDate,  setSelectedDate]  = useState(todayCol());
  const [viewMode,      setViewMode]      = useState('date');
  const [predictions,   setPredictions]   = useState({});
  const [showReactions, setShowReactions] = useState({});
  const [saving,        setSaving]        = useState({});
  const [round16Sel,    setRound16Sel]    = useState([]);
  const [savingR16,     setSavingR16]     = useState(false);
  const [round16ForceOpen, setRound16ForceOpen] = useState(false);
  const [quartersSel,   setQuartersSel]   = useState([]);
  const [savingQrt,     setSavingQrt]     = useState(false);
  const [quartersForceOpen, setQuartersForceOpen] = useState(false);
  const [semisSel,      setSemisSel]      = useState([]);
  const [savingSemis,   setSavingSemis]   = useState(false);
  const [semisForceOpen, setSemisForceOpen] = useState(false);

  useEffect(() => {
    if (initialPhase) setSelectedPhase(initialPhase);
  }, [initialPhase]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'round16'), (snap) => {
      if (snap.exists()) setRound16ForceOpen(snap.data().forceOpen || false);
      else setRound16ForceOpen(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'quarters'), (snap) => {
      if (snap.exists()) setQuartersForceOpen(snap.data().forceOpen || false);
      else setQuartersForceOpen(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'semis'), (snap) => {
      if (snap.exists()) setSemisForceOpen(snap.data().forceOpen || false);
      else setSemisForceOpen(false);
    });
    return unsub;
  }, []);

  const phases = [
    { id:'groups',   label:'⚽ Grupos'  },
    { id:'round16',  label:'🔥 R. de 32' },
    { id:'quarters', label:'💪 Octavos' },
    { id:'semis',    label:'🏅 Semis'   },
    { id:'final',    label:'🏆 Final'   },
  ];
  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  const firstRound16Match = useMemo(() => {
    return matches
      .filter(m => m.phase === 'round16' && m.homeTeam && m.awayTeam)
      .sort((a,b) => new Date(a.date) - new Date(b.date))[0];
  }, [matches]);

  const firstQuartersMatch = useMemo(() => {
    return matches
      .filter(m => m.phase === 'quarters' && m.homeTeam && m.awayTeam)
      .sort((a,b) => new Date(a.date) - new Date(b.date))[0];
  }, [matches]);

  const firstSemisMatch = useMemo(() => {
    return matches
      .filter(m => m.phase === 'semis' && m.homeTeam && m.awayTeam)
      .sort((a,b) => new Date(a.date) - new Date(b.date))[0];
  }, [matches]);

  const blockedTeams = useMemo(() => {
    const blocked = new Set();
    matches
      .filter(m => m.phase === 'round16' && m.status === 'finished')
      .forEach(m => {
        if (m.homeTeam) blocked.add(m.homeTeam);
        if (m.awayTeam) blocked.add(m.awayTeam);
      });
    return blocked;
  }, [matches]);

  const blockedQuartersTeams = useMemo(() => {
    const blocked = new Set();
    matches
      .filter(m => m.phase === 'quarters' && m.status === 'finished')
      .forEach(m => {
        if (m.homeTeam) blocked.add(m.homeTeam);
        if (m.awayTeam) blocked.add(m.awayTeam);
      });
    return blocked;
  }, [matches]);

  const blockedSemisTeams = useMemo(() => {
    const blocked = new Set();
    matches
      .filter(m => m.phase === 'semis' && m.status === 'finished')
      .forEach(m => {
        if (m.homeTeam) blocked.add(m.homeTeam);
        if (m.awayTeam) blocked.add(m.awayTeam);
      });
    return blocked;
  }, [matches]);

  const reqQuarters = useMemo(() => {
    const bl = new Set();
    matches.filter(m => m.phase==='quarters' && m.status==='finished').forEach(m => {
      if(m.homeTeam) bl.add(m.homeTeam);
      if(m.awayTeam) bl.add(m.awayTeam);
    });
    return Math.min(8, QUARTERS_TEAMS.filter(t => !bl.has(t)).length);
  }, [matches]);

  const reqSemis = useMemo(() => {
    const bl = new Set();
    matches.filter(m => m.phase==='semis' && m.status==='finished').forEach(m => {
      if(m.homeTeam) bl.add(m.homeTeam);
      if(m.awayTeam) bl.add(m.awayTeam);
    });
    return Math.min(4, SEMIS_TEAMS.filter(t => !bl.has(t)).length);
  }, [matches]);

  const round16IsOpen = useMemo(() => {
    if (round16ForceOpen) return true;
    if (!firstRound16Match) return false;
    return new Date() < new Date(firstRound16Match.date);
  }, [firstRound16Match, round16ForceOpen]);

  const quartersIsOpen = useMemo(() => {
    if (quartersForceOpen) return true;
    if (!firstQuartersMatch) return false;
    return new Date() < new Date(firstQuartersMatch.date);
  }, [firstQuartersMatch, quartersForceOpen]);

  const semisIsOpen = useMemo(() => {
    if (semisForceOpen) return true;
    if (!firstSemisMatch) return false;
    return new Date() < new Date(firstSemisMatch.date);
  }, [firstSemisMatch, semisForceOpen]);

  const myRound16Pred = currentUser.round16Prediction || [];
  const round16Results = currentUser.round16Results || [];
  const hasRound16Pred = myRound16Pred.length > 0;

  const myQuartersPred = currentUser.quartersPrediction || [];
  const quartersResults = currentUser.quartersResults || [];
  const hasQuartersPred = myQuartersPred.length > 0;

  const mySemisPred = currentUser.semisPrediction || [];
  const semisResults = currentUser.semisResults || [];
  const hasSemisPred = mySemisPred.length > 0;

  const toggleRound16Team = (teamId) => {
    if (blockedTeams.has(teamId)) return;
    setRound16Sel(prev => {
      if (prev.includes(teamId)) return prev.filter(t => t !== teamId);
      if (prev.length >= 16) { alert('Ya seleccionaste 16 equipos'); return prev; }
      return [...prev, teamId];
    });
  };

  const toggleQuartersTeam = (teamId) => {
    if (blockedQuartersTeams.has(teamId)) return;
    setQuartersSel(prev => {
      if (prev.includes(teamId)) return prev.filter(t => t !== teamId);
      if (prev.length >= 99) { return prev; }
      return [...prev, teamId];
    });
  };

  const toggleSemisTeam = (teamId) => {
    if (blockedSemisTeams.has(teamId)) return;
    setSemisSel(prev => {
      if (prev.includes(teamId)) return prev.filter(t => t !== teamId);
      if (prev.length >= 4) { alert('Ya seleccionaste 4 equipos'); return prev; }
      return [...prev, teamId];
    });
  };

  const handleSaveRound16 = async () => {
    if (round16Sel.length !== 16) { alert(`Selecciona exactamente 16 equipos (tienes ${round16Sel.length})`); return; }
    setSavingR16(true);
    try {
      await onSaveRound16Prediction(currentUser.id, round16Sel);
      setRound16Sel([]);
      alert('✅ Pronóstico de clasificados guardado');
    } catch(e) {
      alert('Error al guardar. Intente de nuevo.');
    } finally {
      setSavingR16(false);
    }
  };

  const handleSaveQuarters = async () => {
    const _avail = QUARTERS_TEAMS.filter(t => !blockedQuartersTeams.has(t));
    const _req = _avail.length;
    if (false) { alert(`Selecciona exactamente ${_req} equipos (tienes ${quartersSel.length})`); return; }
    setSavingQrt(true);
    try {
      await onSaveQuartersPrediction(currentUser.id, quartersSel);
      setQuartersSel([]);
      alert('✅ Pronóstico de clasificados a cuartos guardado');
    } catch(e) {
      alert('Error al guardar. Intente de nuevo.');
    } finally {
      setSavingQrt(false);
    }
  };

  const handleSaveSemis = async () => {
    if (semisSel.length === 0) { alert('Selecciona al menos 1 equipo'); return; }
    setSavingSemis(true);
    try {
      await onSaveSemisPrediction(currentUser.id, semisSel);
      setSemisSel([]);
      alert('✅ Pronóstico de clasificados a semis guardado');
    } catch(e) {
      alert('Error al guardar. Intente de nuevo.');
    } finally {
      setSavingSemis(false);
    }
  };

  const daysInPhase = useMemo(() => {
    const base = selectedPhase==='groups' ? matches.filter(m=>m.phase==='groups') : matches.filter(m=>m.phase===selectedPhase);
    return [...new Set(base.map(m=>toColDate(m.date)))].sort();
  }, [matches, selectedPhase]);

  const effectiveDate = daysInPhase.includes(selectedDate) ? selectedDate : (daysInPhase[0]||selectedDate);

  const filteredMatches = useMemo(() => {
    if (selectedPhase==='groups') {
      return viewMode==='date'
        ? matches.filter(m=>m.phase==='groups'&&toColDate(m.date)===effectiveDate)
        : matches.filter(m=>m.phase==='groups'&&m.group===selectedGroup);
    }
    return matches.filter(m=>m.phase===selectedPhase&&toColDate(m.date)===effectiveDate);
  }, [matches, selectedPhase, viewMode, effectiveDate, selectedGroup]);

  const currentDayIndex = daysInPhase.indexOf(effectiveDate);
  const prevDay = currentDayIndex>0 ? daysInPhase[currentDayIndex-1] : null;
  const nextDay = currentDayIndex<daysInPhase.length-1 ? daysInPhase[currentDayIndex+1] : null;

  const formatDayLabel = (dateStr) => {
    if (!dateStr) return '';
    const today = todayCol();
    const tom = new Date(); tom.setDate(tom.getDate()+1);
    const tomStr = tom.toLocaleDateString('en-CA',{timeZone:'America/Bogota'});
    const yest = new Date(); yest.setDate(yest.getDate()-1);
    const yesterStr = yest.toLocaleDateString('en-CA',{timeZone:'America/Bogota'});
    if (dateStr===today) return 'Hoy';
    if (dateStr===tomStr) return 'Mañana';
    if (dateStr===yesterStr) return 'Ayer';
    const [y,m,d] = dateStr.split('-');
    return new Date(+y,+m-1,+d).toLocaleDateString('es-CO',{weekday:'short',day:'numeric',month:'short'});
  };

  const formatTime = (ds) => new Date(ds).toLocaleTimeString('es-CO',{timeZone:'America/Bogota',hour:'2-digit',minute:'2-digit',hour12:true});

  const canPredict = (match) => {
    if (match.status==='finished') return false;
    return new Date() < new Date(new Date(match.date).getTime()-10*60*1000);
  };

  const getUserPrediction = (matchId) => currentUser.predictions?.[matchId];

  const setPredField = (matchId, field, value) =>
    setPredictions(prev=>({...prev,[matchId]:{...prev[matchId],[field]:value}}));

  const handleSubmit = async (matchId) => {
    const p = predictions[matchId]||{};
    const home = p.home !== undefined ? p.home : 0;
    const away = p.away !== undefined ? p.away : 0;
    const result = p.result||(home>away?'home':home<away?'away':'draw');
    setSaving(prev=>({...prev,[matchId]:true}));
    try {
      await onMakePrediction(currentUser.id, matchId, result, parseInt(home), parseInt(away));
      setPredictions(prev=>{ const n={...prev}; delete n[matchId]; return n; });
    } catch(e) {
      alert('Error al guardar. Intente de nuevo.');
    } finally {
      setSaving(prev=>({...prev,[matchId]:false}));
    }
  };

  const toggleReactionPicker = (matchId) => setShowReactions(prev=>({...prev,[matchId]:!prev[matchId]}));
  const handleReaction = (matchId, emoji) => {
    const cur = reactions[matchId]?.[currentUser.id];
    cur===emoji ? onRemoveReaction(matchId,currentUser.id) : onAddReaction(matchId,currentUser.id,emoji);
    setShowReactions(prev=>({...prev,[matchId]:false}));
  };
  const getReactionCounts = (matchId) => {
    const counts={};
    Object.values(reactions[matchId]||{}).forEach(e=>{counts[e]=(counts[e]||0)+1;});
    return counts;
  };
  const getUsersWhoReacted = (matchId, emoji) =>
    Object.entries(reactions[matchId]||{}).filter(([,e])=>e===emoji).map(([uid])=>users.find(u=>u.id===uid)?.nickname||'Usuario');

  const btnGEP = (active, color) => ({
    flex:1, padding:'9px 4px', borderRadius:'10px', fontSize:'12px', fontWeight:'600', cursor:'pointer',
    background:active?`rgba(${color},0.2)`:'rgba(255,255,255,0.04)',
    border:active?`1px solid rgba(${color},0.5)`:'1px solid rgba(255,255,255,0.1)',
    color:active?`rgb(${color})`:'rgba(255,255,255,0.5)', transition:'all 0.15s',
  });

  const isApproved = currentUser.approved || currentUser.isAdmin;

  return (
    <div>
      <div style={{...card,padding:'14px 16px',marginBottom:'12px'}}>
        <div style={{display:'flex',gap:'8px',overflowX:'auto',paddingBottom:'2px'}}>
          {phases.map(p=>(
            <button key={p.id} style={pill(selectedPhase===p.id)} onClick={()=>{setSelectedPhase(p.id);setViewMode('date');}}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECCIÓN R32 CLASIFICADOS */}
      {selectedPhase==='round16' && (
        <div style={{...card,padding:'16px 18px',marginBottom:'12px',borderColor:'rgba(251,191,36,0.2)',background:'rgba(251,191,36,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
            <div>
              <div style={{fontSize:'14px',fontWeight:'700',color:'#fbbf24',marginBottom:'2px'}}>🎯 ¿Quiénes clasifican a Octavos?</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>Escoge 16 equipos · +2 pts por cada acierto · Máx +32 pts</div>
            </div>
            {hasRound16Pred && round16Results.length > 0 && (
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'13px',fontWeight:'800',color:'#4ade80'}}>+{round16Results.filter(t => myRound16Pred.includes(t)).length * 2} pts</div>
                <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)'}}>{round16Results.filter(t => myRound16Pred.includes(t)).length}/16 aciertos</div>
              </div>
            )}
          </div>
          {hasRound16Pred && round16Sel.length === 0 ? (
            <div>
              <div style={{padding:'10px 12px',borderRadius:'10px',background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.2)',marginBottom:'10px'}}>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'8px'}}>✓ Tus 16 equipos seleccionados:</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                  {myRound16Pred.map(teamId => {
                    const team = getTeamById(teamId);
                    const isCorrect = round16Results.includes(teamId);
                    const resultsIn = round16Results.length > 0;
                    return (
                      <div key={teamId} style={{display:'flex',alignItems:'center',gap:'4px',padding:'4px 8px',borderRadius:'8px',
                        background:resultsIn?(isCorrect?'rgba(74,222,128,0.15)':'rgba(239,68,68,0.1)'):'rgba(255,255,255,0.06)',
                        border:resultsIn?(isCorrect?'1px solid rgba(74,222,128,0.3)':'1px solid rgba(239,68,68,0.2)'):'1px solid rgba(255,255,255,0.1)'}}>
                        <Flag code={team?.flagCode} size={16}/>
                        <span style={{fontSize:'11px',color:resultsIn?(isCorrect?'#4ade80':'#f87171'):'rgba(255,255,255,0.7)'}}>{team?.name||teamId}</span>
                        {resultsIn && <span style={{fontSize:'10px'}}>{isCorrect?'✓':'✗'}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              {round16IsOpen && (
                <button onClick={()=>setRound16Sel([...myRound16Pred])} style={{fontSize:'12px',color:'#93c5fd',background:'none',border:'none',cursor:'pointer'}}>Modificar selección</button>
              )}
            </div>
          ) : round16IsOpen && isApproved ? (
            <div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginBottom:'6px'}}>
                Seleccionados: <span style={{color:round16Sel.length===16?'#4ade80':'#fbbf24',fontWeight:'700'}}>{round16Sel.length}/16</span>
              </div>
              {blockedTeams.size > 0 && <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',marginBottom:'10px'}}>🔒 Los equipos en gris ya jugaron</div>}
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'12px'}}>
                {ROUND16_TEAMS.map(teamId => {
                  const team = getTeamById(teamId);
                  const isSelected = round16Sel.includes(teamId);
                  const isBlocked = blockedTeams.has(teamId);
                  return (
                    <button key={teamId} onClick={()=>toggleRound16Team(teamId)} disabled={isBlocked}
                      style={{display:'flex',alignItems:'center',gap:'5px',padding:'6px 10px',borderRadius:'8px',
                        cursor:isBlocked?'not-allowed':'pointer', opacity:isBlocked?0.35:1,
                        background:isBlocked?'rgba(255,255,255,0.02)':isSelected?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.04)',
                        border:isBlocked?'1px solid rgba(255,255,255,0.05)':isSelected?'1px solid rgba(74,222,128,0.4)':'1px solid rgba(255,255,255,0.08)',
                        color:isBlocked?'rgba(255,255,255,0.3)':isSelected?'#4ade80':'rgba(255,255,255,0.6)'}}>
                      <Flag code={team?.flagCode} size={18}/>
                      <span style={{fontSize:'12px',fontWeight:isSelected?'700':'400',textDecoration:isBlocked?'line-through':'none'}}>{team?.name||teamId}</span>
                      {isSelected && !isBlocked && <span style={{fontSize:'10px'}}>✓</span>}
                      {isBlocked && <span style={{fontSize:'10px'}}>🔒</span>}
                    </button>
                  );
                })}
              </div>
              <button onClick={handleSaveRound16} disabled={savingR16||round16Sel.length!==16}
                style={{width:'100%',padding:'11px',borderRadius:'10px',fontWeight:'600',fontSize:'14px',cursor:round16Sel.length===16?'pointer':'default',border:'none',
                  background:round16Sel.length===16?'linear-gradient(135deg,#d97706,#f59e0b)':'rgba(255,255,255,0.06)',
                  color:round16Sel.length===16?'white':'rgba(255,255,255,0.3)'}}>
                {savingR16?'⏳ Guardando...':round16Sel.length===16?'Guardar mis 16 clasificados':'Selecciona 16 equipos'}
              </button>
            </div>
          ) : !round16IsOpen && !hasRound16Pred ? (
            <div style={{textAlign:'center',padding:'12px',color:'rgba(255,255,255,0.35)',fontSize:'13px'}}>🔒 El tiempo para pronosticar los clasificados ya cerró</div>
          ) : null}
        </div>
      )}

      {/* SECCIÓN OCTAVOS - CLASIFICADOS A CUARTOS */}
      {selectedPhase==='quarters' && (
        <div style={{...card,padding:'16px 18px',marginBottom:'12px',borderColor:'rgba(96,165,250,0.2)',background:'rgba(96,165,250,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
            <div>
              <div style={{fontSize:'14px',fontWeight:'700',color:'#93c5fd',marginBottom:'2px'}}>🎯 ¿Quiénes clasifican a Cuartos?</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>Escoge hasta 8 equipos · +2 pts por cada acierto · Máx +16 pts</div>
            </div>
            {hasQuartersPred && quartersResults.length > 0 && (
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'13px',fontWeight:'800',color:'#4ade80'}}>+{quartersResults.filter(t => myQuartersPred.includes(t)).length * 2} pts</div>
                <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)'}}>{quartersResults.filter(t => myQuartersPred.includes(t)).length}/8 aciertos</div>
              </div>
            )}
          </div>
          {hasQuartersPred && quartersSel.length === 0 ? (
            <div>
              <div style={{padding:'10px 12px',borderRadius:'10px',background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.2)',marginBottom:'10px'}}>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'8px'}}>✓ Tus equipos seleccionados:</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                  {myQuartersPred.map(teamId => {
                    const team = getTeamById(teamId);
                    const isCorrect = quartersResults.includes(teamId);
                    const resultsIn = quartersResults.length > 0;
                    return (
                      <div key={teamId} style={{display:'flex',alignItems:'center',gap:'4px',padding:'4px 8px',borderRadius:'8px',
                        background:resultsIn?(isCorrect?'rgba(74,222,128,0.15)':'rgba(239,68,68,0.1)'):'rgba(255,255,255,0.06)',
                        border:resultsIn?(isCorrect?'1px solid rgba(74,222,128,0.3)':'1px solid rgba(239,68,68,0.2)'):'1px solid rgba(255,255,255,0.1)'}}>
                        <Flag code={team?.flagCode} size={16}/>
                        <span style={{fontSize:'11px',color:resultsIn?(isCorrect?'#4ade80':'#f87171'):'rgba(255,255,255,0.7)'}}>{team?.name||teamId}</span>
                        {resultsIn && <span style={{fontSize:'10px'}}>{isCorrect?'✓':'✗'}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              {quartersIsOpen && (
                <button onClick={()=>setQuartersSel([...myQuartersPred])} style={{fontSize:'12px',color:'#93c5fd',background:'none',border:'none',cursor:'pointer'}}>Modificar selección</button>
              )}
            </div>
          ) : quartersIsOpen && isApproved ? (
            <div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginBottom:'6px'}}>
                Seleccionados: <span style={{color:quartersSel.length>0?'#4ade80':'#93c5fd',fontWeight:'700'}}>{quartersSel.length}/8</span>
              </div>
              {blockedQuartersTeams.size > 0 && <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',marginBottom:'10px'}}>🔒 Los equipos en gris ya jugaron</div>}
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'12px'}}>
                {QUARTERS_TEAMS.map(teamId => {
                  const team = getTeamById(teamId);
                  const isSelected = quartersSel.includes(teamId);
                  const isBlocked = blockedQuartersTeams.has(teamId);
                  return (
                    <button key={teamId} onClick={()=>toggleQuartersTeam(teamId)} disabled={isBlocked}
                      style={{display:'flex',alignItems:'center',gap:'5px',padding:'6px 10px',borderRadius:'8px',
                        cursor:isBlocked?'not-allowed':'pointer', opacity:isBlocked?0.35:1,
                        background:isBlocked?'rgba(255,255,255,0.02)':isSelected?'rgba(96,165,250,0.15)':'rgba(255,255,255,0.04)',
                        border:isBlocked?'1px solid rgba(255,255,255,0.05)':isSelected?'1px solid rgba(96,165,250,0.4)':'1px solid rgba(255,255,255,0.08)',
                        color:isBlocked?'rgba(255,255,255,0.3)':isSelected?'#93c5fd':'rgba(255,255,255,0.6)'}}>
                      <Flag code={team?.flagCode} size={18}/>
                      <span style={{fontSize:'12px',fontWeight:isSelected?'700':'400',textDecoration:isBlocked?'line-through':'none'}}>{team?.name||teamId}</span>
                      {isSelected && !isBlocked && <span style={{fontSize:'10px'}}>✓</span>}
                      {isBlocked && <span style={{fontSize:'10px'}}>🔒</span>}
                    </button>
                  );
                })}
              </div>
              <button onClick={handleSaveQuarters} disabled={savingQrt||quartersSel.length===0}
                style={{width:'100%',padding:'11px',borderRadius:'10px',fontWeight:'600',fontSize:'14px',
                  cursor:quartersSel.length>0?'pointer':'default',border:'none',
                  background:quartersSel.length>0?'linear-gradient(135deg,#2563eb,#3b82f6)':'rgba(255,255,255,0.06)',
                  color:quartersSel.length>0?'white':'rgba(255,255,255,0.3)'}}>
                {savingQrt?'⏳ Guardando...':quartersSel.length>0?'Guardar mis clasificados':'Elige tus clasificados'}
              </button>
            </div>
          ) : !quartersIsOpen && !hasQuartersPred ? (
            <div style={{textAlign:'center',padding:'12px',color:'rgba(255,255,255,0.35)',fontSize:'13px'}}>🔒 El tiempo para pronosticar los clasificados a cuartos ya cerró</div>
          ) : null}
        </div>
      )}

      {/* ✅ NUEVO: SECCIÓN SEMIS - CLASIFICADOS A SEMIFINALES */}
      {selectedPhase==='semis' && (
        <div style={{...card,padding:'16px 18px',marginBottom:'12px',borderColor:'rgba(168,85,247,0.2)',background:'rgba(168,85,247,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
            <div>
              <div style={{fontSize:'14px',fontWeight:'700',color:'#c084fc',marginBottom:'2px'}}>🎯 ¿Quiénes clasifican a Semifinales?</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>Escoge 4 equipos · +5 pts por cada acierto · Máx +20 pts</div>
            </div>
            {hasSemisPred && semisResults.length > 0 && (
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'13px',fontWeight:'800',color:'#4ade80'}}>+{semisResults.filter(t => mySemisPred.includes(t)).length * 5} pts</div>
                <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)'}}>{semisResults.filter(t => mySemisPred.includes(t)).length}/4 aciertos</div>
              </div>
            )}
          </div>
          {hasSemisPred && semisSel.length === 0 ? (
            <div>
              <div style={{padding:'10px 12px',borderRadius:'10px',background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.2)',marginBottom:'10px'}}>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'8px'}}>✓ Tus 4 equipos seleccionados:</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                  {mySemisPred.map(teamId => {
                    const team = getTeamById(teamId);
                    const isCorrect = semisResults.includes(teamId);
                    const resultsIn = semisResults.length > 0;
                    return (
                      <div key={teamId} style={{display:'flex',alignItems:'center',gap:'4px',padding:'4px 8px',borderRadius:'8px',
                        background:resultsIn?(isCorrect?'rgba(74,222,128,0.15)':'rgba(239,68,68,0.1)'):'rgba(255,255,255,0.06)',
                        border:resultsIn?(isCorrect?'1px solid rgba(74,222,128,0.3)':'1px solid rgba(239,68,68,0.2)'):'1px solid rgba(255,255,255,0.1)'}}>
                        <Flag code={team?.flagCode} size={16}/>
                        <span style={{fontSize:'11px',color:resultsIn?(isCorrect?'#4ade80':'#f87171'):'rgba(255,255,255,0.7)'}}>{team?.name||teamId}</span>
                        {resultsIn && <span style={{fontSize:'10px'}}>{isCorrect?'✓':'✗'}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              {semisIsOpen && (
                <button onClick={()=>setSemisSel([...mySemisPred])} style={{fontSize:'12px',color:'#93c5fd',background:'none',border:'none',cursor:'pointer'}}>Modificar selección</button>
              )}
            </div>
          ) : semisIsOpen && isApproved ? (
            <div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginBottom:'6px'}}>
                Seleccionados: <span style={{color:semisSel.length===4?'#4ade80':'#c084fc',fontWeight:'700'}}>{semisSel.length}/4</span>
              </div>
              {blockedSemisTeams.size > 0 && <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',marginBottom:'10px'}}>🔒 Los equipos en gris ya jugaron</div>}
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'12px'}}>
                {SEMIS_TEAMS.map(teamId => {
                  const team = getTeamById(teamId);
                  const isSelected = semisSel.includes(teamId);
                  const isBlocked = blockedSemisTeams.has(teamId);
                  return (
                    <button key={teamId} onClick={()=>toggleSemisTeam(teamId)} disabled={isBlocked}
                      style={{display:'flex',alignItems:'center',gap:'5px',padding:'6px 10px',borderRadius:'8px',
                        cursor:isBlocked?'not-allowed':'pointer', opacity:isBlocked?0.35:1,
                        background:isBlocked?'rgba(255,255,255,0.02)':isSelected?'rgba(168,85,247,0.15)':'rgba(255,255,255,0.04)',
                        border:isBlocked?'1px solid rgba(255,255,255,0.05)':isSelected?'1px solid rgba(168,85,247,0.4)':'1px solid rgba(255,255,255,0.08)',
                        color:isBlocked?'rgba(255,255,255,0.3)':isSelected?'#c084fc':'rgba(255,255,255,0.6)'}}>
                      <Flag code={team?.flagCode} size={18}/>
                      <span style={{fontSize:'12px',fontWeight:isSelected?'700':'400',textDecoration:isBlocked?'line-through':'none'}}>{team?.name||teamId}</span>
                      {isSelected && !isBlocked && <span style={{fontSize:'10px'}}>✓</span>}
                      {isBlocked && <span style={{fontSize:'10px'}}>🔒</span>}
                    </button>
                  );
                })}
              </div>
              <button onClick={handleSaveSemis} disabled={savingSemis||semisSel.length===0}
                style={{width:'100%',padding:'11px',borderRadius:'10px',fontWeight:'600',fontSize:'14px',
                  cursor:semisSel.length>0?'pointer':'default',border:'none',
                  background:semisSel.length>0?'linear-gradient(135deg,#7c3aed,#c026d3)':'rgba(255,255,255,0.06)',
                  color:semisSel.length>0?'white':'rgba(255,255,255,0.3)'}}>
                {savingSemis?'⏳ Guardando...':semisSel.length>0?'Guardar mis 4 clasificados a Semis':'Selecciona 4 equipos'}
              </button>
            </div>
          ) : !semisIsOpen && !hasSemisPred ? (
            <div style={{textAlign:'center',padding:'12px',color:'rgba(255,255,255,0.35)',fontSize:'13px'}}>🔒 El tiempo para pronosticar los clasificados a semis ya cerró</div>
          ) : null}
        </div>
      )}

      <div style={{...card,padding:'12px 16px',marginBottom:'12px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
          <button onClick={()=>prevDay&&setSelectedDate(prevDay)} disabled={!prevDay}
            style={{padding:'6px 10px',borderRadius:'8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:prevDay?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.2)',cursor:prevDay?'pointer':'default'}}>
            <ChevronLeft size={16}/>
          </button>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'16px',fontWeight:'700',color:'white'}}>{formatDayLabel(effectiveDate)}</div>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',marginTop:'1px'}}>{filteredMatches.length} partido{filteredMatches.length!==1?'s':''}</div>
          </div>
          <button onClick={()=>nextDay&&setSelectedDate(nextDay)} disabled={!nextDay}
            style={{padding:'6px 10px',borderRadius:'8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:nextDay?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.2)',cursor:nextDay?'pointer':'default'}}>
            <ChevronRight size={16}/>
          </button>
        </div>
        <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'2px'}}>
          {daysInPhase.map(d=>(
            <button key={d} onClick={()=>setSelectedDate(d)}
              style={{flexShrink:0,padding:'5px 12px',borderRadius:'16px',fontSize:'12px',fontWeight:'500',cursor:'pointer',whiteSpace:'nowrap',
                background:d===effectiveDate?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.04)',
                border:d===effectiveDate?'1px solid rgba(74,222,128,0.4)':'1px solid rgba(255,255,255,0.08)',
                color:d===effectiveDate?'#4ade80':d===todayCol()?'#fbbf24':'rgba(255,255,255,0.45)'}}>
              {formatDayLabel(d)}
            </button>
          ))}
        </div>
        {selectedPhase==='groups' && (
          <div style={{marginTop:'10px',paddingTop:'10px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
              <span style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Ver por grupo</span>
              <button onClick={()=>setViewMode(viewMode==='group'?'date':'group')}
                style={{fontSize:'11px',padding:'3px 10px',borderRadius:'8px',cursor:'pointer',
                  background:viewMode==='group'?'rgba(59,130,246,0.15)':'rgba(255,255,255,0.04)',
                  border:viewMode==='group'?'1px solid rgba(59,130,246,0.4)':'1px solid rgba(255,255,255,0.1)',
                  color:viewMode==='group'?'#93c5fd':'rgba(255,255,255,0.4)'}}>
                {viewMode==='group'?'✓ Activo':'Activar'}
              </button>
            </div>
            {viewMode==='group' && (
              <div style={{display:'flex',gap:'5px',overflowX:'auto'}}>
                {groups.map(g=>(
                  <button key={g} onClick={()=>setSelectedGroup(g)}
                    style={{width:'34px',height:'34px',borderRadius:'8px',fontSize:'12px',fontWeight:'600',flexShrink:0,cursor:'pointer',
                      background:selectedGroup===g?'rgba(59,130,246,0.2)':'rgba(255,255,255,0.04)',
                      border:selectedGroup===g?'1px solid rgba(59,130,246,0.5)':'1px solid rgba(255,255,255,0.08)',
                      color:selectedGroup===g?'#93c5fd':'rgba(255,255,255,0.4)'}}>
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
        {filteredMatches.map(match=>{
          const homeTeam=getTeamById(match.homeTeam);
          const awayTeam=getTeamById(match.awayTeam);
          const userPred=getUserPrediction(match.id);
          const canPred=canPredict(match);
          const isFinished=match.status==='finished';
          const reactionCounts=getReactionCounts(match.id);
          const localPred=predictions[match.id];
          const isSaving=saving[match.id];
          const pts = getPhaseLabel(match.phase);

          return (
            <div key={match.id} style={{...card,padding:'18px 20px',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',
                background:isFinished?'linear-gradient(90deg,#16a34a,#4ade80)':canPred?'linear-gradient(90deg,#3b82f6,#60a5fa)':'linear-gradient(90deg,#6b7280,#9ca3af)'}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>
                  <Clock size={12}/><span>{formatTime(match.date)}</span>
                  {match.group&&<span style={{marginLeft:'4px',fontSize:'11px',padding:'1px 6px',borderRadius:'4px',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.35)'}}>Grupo {match.group}</span>}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  {isFinished&&<span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'6px',background:'rgba(22,163,74,0.15)',color:'#4ade80',border:'1px solid rgba(22,163,74,0.25)'}}>Finalizado</span>}
                  {!isFinished&&!canPred&&<span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'6px',background:'rgba(107,114,128,0.15)',color:'#9ca3af',border:'1px solid rgba(107,114,128,0.2)'}}>Cerrado</span>}
                  {canPred&&<span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'6px',background:'rgba(59,130,246,0.15)',color:'#93c5fd',border:'1px solid rgba(59,130,246,0.25)'}}>Abierto</span>}
                  <span style={{fontSize:'11px',color:'rgba(255,255,255,0.25)'}}>{match.venue}</span>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{display:'flex',justifyContent:'center',marginBottom:'8px'}}><Flag code={homeTeam?.flagCode} size={38}/></div>
                  <div style={{fontSize:'13px',fontWeight:'600',color:'rgba(255,255,255,0.85)'}}>{homeTeam?.name||'TBD'}</div>
                </div>
                <div style={{textAlign:'center',minWidth:'80px'}}>
                  {isFinished?(
                    <div style={{fontSize:'28px',fontWeight:'800',color:'white',letterSpacing:'-1px'}}>
                      {match.homeScore} <span style={{color:'rgba(255,255,255,0.3)'}}>-</span> {match.awayScore}
                    </div>
                  ):userPred&&!localPred?(
                    <div>
                      {userPred.homeScore!==undefined&&userPred.awayScore!==undefined?(
                        <div style={{fontSize:'22px',fontWeight:'700',color:'#4ade80'}}>{userPred.homeScore} - {userPred.awayScore}</div>
                      ):(
                        <div style={{fontSize:'12px',fontWeight:'700',color:'#4ade80',textAlign:'center',lineHeight:1.4}}>
                          {userPred.result==='home'?`Gana ${homeTeam?.name}`:userPred.result==='away'?`Gana ${awayTeam?.name}`:'Empate'}
                        </div>
                      )}
                      <div style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',marginTop:'3px'}}>tu pronóstico</div>
                    </div>
                  ):(
                    <div style={{fontSize:'24px',fontWeight:'300',color:'rgba(255,255,255,0.2)',letterSpacing:'2px'}}>- -</div>
                  )}
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{display:'flex',justifyContent:'center',marginBottom:'8px'}}><Flag code={awayTeam?.flagCode} size={38}/></div>
                  <div style={{fontSize:'13px',fontWeight:'600',color:'rgba(255,255,255,0.85)'}}>{awayTeam?.name||'TBD'}</div>
                </div>
              </div>

              {isFinished&&(
                <div>
                  {userPred&&(()=>{
                    const { correct, exact } = calcPredResult(userPred, match);
                    const { resultLabel, scoreLabel } = getPredLabel(userPred, homeTeam, awayTeam);
                    const actualResultLabel = match.homeScore > match.awayScore ? `Gana ${homeTeam?.name}` : match.homeScore < match.awayScore ? `Gana ${awayTeam?.name}` : 'Empate';
                    return(
                      <div style={{padding:'12px 14px',borderRadius:'10px',marginBottom:'10px',
                        background:correct?'rgba(22,163,74,0.08)':'rgba(239,68,68,0.08)',
                        border:`1px solid ${correct?'rgba(22,163,74,0.2)':'rgba(239,68,68,0.2)'}`}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                          <div>
                            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Tu pronóstico</div>
                            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.8)',fontWeight:'500'}}>
                              {resultLabel}{scoreLabel && <span style={{color:'rgba(255,255,255,0.5)',marginLeft:'6px'}}>· {scoreLabel}</span>}
                            </div>
                            {userPred.timestamp && <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginTop:'3px'}}>🕐 Registrado a las {formatTimestamp(userPred.timestamp)}</div>}
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontSize:'14px',fontWeight:'700',color:exact?'#fde047':correct?'#4ade80':'#f87171'}}>
                              {exact?`🎯 Exacto +${pts.exact}`:correct?`✓ Correcto +${pts.correct}`:'✗ Incorrecto'}
                            </div>
                          </div>
                        </div>
                        <div style={{borderTop:'1px solid rgba(255,255,255,0.08)',paddingTop:'8px'}}>
                          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)'}}>
                            Resultado real: <span style={{color:'rgba(255,255,255,0.6)',fontWeight:'600'}}>{actualResultLabel} · {match.homeScore}-{match.awayScore}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {(()=>{
                    const otherPreds = users
                      .filter(u=>u.id!==currentUser.id&&u.predictions?.[match.id])
                      .map(u=>{
                        const pred=u.predictions[match.id];
                        const { correct, exact } = calcPredResult(pred, match);
                        const { resultLabel, scoreLabel } = getPredLabel(pred, homeTeam, awayTeam);
                        return {user:u,pred,correct,exact,resultLabel,scoreLabel};
                      });
                    if (!otherPreds.length) return null;
                    return(
                      <div style={{marginBottom:'10px',padding:'12px',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'10px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.05em'}}>👥 Pronósticos de otros</div>
                        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                          {otherPreds.map(({user,correct,exact,resultLabel,scoreLabel,pred})=>{
                            const team=getTeamById(user.avatar);
                            return(
                              <div key={user.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',borderRadius:'8px',
                                background:correct?'rgba(22,163,74,0.06)':'rgba(239,68,68,0.06)',
                                border:`1px solid ${correct?'rgba(22,163,74,0.15)':'rgba(239,68,68,0.15)'}`}}>
                                <div style={{display:'flex',alignItems:'center',gap:'6px',flex:1,minWidth:0}}>
                                  {team?.flagCode
                                    ?<img src={`https://hatscripts.github.io/circle-flags/flags/${team.flagCode}.svg`} width={18} height={18} style={{borderRadius:'50%',flexShrink:0}} onError={e=>{e.target.style.display='none';}}/>
                                    :<span style={{fontSize:'14px',flexShrink:0}}>{user.avatar||'👤'}</span>
                                  }
                                  <div style={{minWidth:0}}>
                                    <div style={{fontSize:'12px',fontWeight:'600',color:'rgba(255,255,255,0.85)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                      {user.name || user.nickname || 'Usuario'}
                                      {user.nickname && user.name && user.nickname !== user.name && (
                                        <span style={{fontSize:'10px',fontWeight:'400',color:'rgba(255,255,255,0.4)',marginLeft:'4px'}}>({user.nickname})</span>
                                      )}
                                    </div>
                                    <span style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>{resultLabel}{scoreLabel?` · ${scoreLabel}`:''}</span>
                                    {pred.timestamp && <div style={{fontSize:'10px',color:'rgba(255,255,255,0.25)'}}>🕐 Registrado a las {formatTimestamp(pred.timestamp)}</div>}
                                  </div>
                                </div>
                                <span style={{fontSize:'12px',fontWeight:'700',color:exact?'#fde047':correct?'#4ade80':'#f87171',flexShrink:0,marginLeft:'8px'}}>
                                  {exact?`🎯 +${pts.exact}`:correct?`✓ +${pts.correct}`:'✗'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'10px',display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'}}>
                    {Object.entries(reactionCounts).map(([emoji,count])=>(
                      <button key={emoji} onClick={()=>handleReaction(match.id,emoji)} title={getUsersWhoReacted(match.id,emoji).join(', ')}
                        style={{padding:'3px 9px',borderRadius:'16px',fontSize:'13px',cursor:'pointer',display:'flex',alignItems:'center',gap:'4px',
                          background:reactions[match.id]?.[currentUser.id]===emoji?'rgba(59,130,246,0.2)':'rgba(255,255,255,0.05)',
                          border:reactions[match.id]?.[currentUser.id]===emoji?'1px solid rgba(59,130,246,0.5)':'1px solid rgba(255,255,255,0.1)'}}>
                        <span>{emoji}</span><span style={{fontSize:'12px',color:'rgba(255,255,255,0.6)'}}>{count}</span>
                      </button>
                    ))}
                    <div style={{position:'relative'}}>
                      <button onClick={()=>toggleReactionPicker(match.id)}
                        style={{padding:'3px 10px',borderRadius:'16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',fontSize:'12px',color:'rgba(255,255,255,0.45)'}}>
                        + Reaccionar
                      </button>
                      {showReactions[match.id]&&(
                        <div style={{position:'absolute',bottom:'100%',left:0,marginBottom:'6px',background:'#1a1f2e',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'12px',padding:'10px',zIndex:10,display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'4px',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
                          {REACTION_EMOJIS.map(emoji=>(
                            <button key={emoji} onClick={()=>handleReaction(match.id,emoji)}
                              style={{fontSize:'22px',padding:'6px',borderRadius:'8px',cursor:'pointer',background:'transparent',border:'none'}}
                              onMouseEnter={e=>e.target.style.transform='scale(1.25)'}
                              onMouseLeave={e=>e.target.style.transform='scale(1)'}>
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!isFinished&&canPred&&!isApproved&&(
                <div style={{padding:'14px',borderRadius:'12px',background:'rgba(249,115,22,0.08)',border:'1px solid rgba(249,115,22,0.2)',textAlign:'center'}}>
                  <div style={{fontSize:'24px',marginBottom:'8px'}}>⏳</div>
                  <div style={{fontSize:'14px',fontWeight:'600',color:'#fb923c',marginBottom:'4px'}}>Cuenta pendiente de aprobación</div>
                  <div style={{fontSize:'12px',color:'rgba(255,255,255,0.45)'}}>El administrador debe aprobar tu cuenta para poder pronosticar</div>
                </div>
              )}

              {!isFinished&&canPred&&isApproved&&(
                <div style={{padding:'14px',borderRadius:'12px',background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.15)'}}>
                  {userPred&&!localPred?(
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'4px'}}>✓ Pronóstico guardado</div>
                      <div style={{fontSize:'14px',fontWeight:'700',color:'#4ade80',marginBottom:'4px'}}>
                        {userPred.homeScore!==undefined&&userPred.awayScore!==undefined?`${userPred.homeScore} - ${userPred.awayScore}`:userPred.result==='home'?`Gana ${homeTeam?.name}`:userPred.result==='away'?`Gana ${awayTeam?.name}`:'Empate'}
                      </div>
                      {userPred.timestamp && <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginBottom:'8px'}}>🕐 Registrado a las {formatTimestamp(userPred.timestamp)}</div>}
                      <button onClick={()=>setPredictions(prev=>({...prev,[match.id]:{result:userPred.result||'draw',home:userPred.homeScore??0,away:userPred.awayScore??0}}))}
                        style={{fontSize:'12px',color:'#93c5fd',background:'none',border:'none',cursor:'pointer'}}>Modificar</button>
                    </div>
                  ):(
                    <div>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginBottom:'10px',textAlign:'center'}}>¿Quién gana?</div>
                      <div style={{display:'flex',gap:'6px',marginBottom:'12px'}}>
                        <button style={btnGEP((localPred?.result||'draw')==='home','74,222,128')} onClick={()=>setPredField(match.id,'result','home')}>
                          <div style={{marginBottom:'4px'}}><Flag code={homeTeam?.flagCode} size={20}/></div>Gana
                        </button>
                        <button style={btnGEP((localPred?.result||'draw')==='draw','250,204,21')} onClick={()=>setPredField(match.id,'result','draw')}>
                          🤝<br/>Empate
                        </button>
                        <button style={btnGEP((localPred?.result||'draw')==='away','96,165,250')} onClick={()=>setPredField(match.id,'result','away')}>
                          <div style={{marginBottom:'4px'}}><Flag code={awayTeam?.flagCode} size={20}/></div>Gana
                        </button>
                      </div>
                      <div style={{borderTop:'1px solid rgba(255,255,255,0.08)',paddingTop:'12px',marginBottom:'10px'}}>
                        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',textAlign:'center',marginBottom:'8px'}}>
                          ¿Marcador exacto? <span style={{color:'#fde047'}}>(+{pts.exact} pts total)</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px'}}>
                          <input type="number" min="0" max="20" value={localPred?.home??0}
                            onChange={e=>{const v=parseInt(e.target.value)||0;setPredField(match.id,'home',v);const away=localPred?.away??0;setPredField(match.id,'result',v>away?'home':v<away?'away':'draw');}}
                            style={{width:'54px',textAlign:'center',fontSize:'22px',fontWeight:'700',padding:'8px',borderRadius:'10px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',color:'white'}}/>
                          <span style={{fontSize:'20px',color:'rgba(255,255,255,0.3)'}}>-</span>
                          <input type="number" min="0" max="20" value={localPred?.away??0}
                            onChange={e=>{const v=parseInt(e.target.value)||0;setPredField(match.id,'away',v);const home=localPred?.home??0;setPredField(match.id,'result',home>v?'home':home<v?'away':'draw');}}
                            style={{width:'54px',textAlign:'center',fontSize:'22px',fontWeight:'700',padding:'8px',borderRadius:'10px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',color:'white'}}/>
                        </div>
                      </div>
                      <button onClick={()=>handleSubmit(match.id)} disabled={isSaving}
                        style={{width:'100%',padding:'10px',background:isSaving?'rgba(255,255,255,0.1)':'linear-gradient(135deg,#16a34a,#15803d)',color:'white',fontWeight:'600',fontSize:'14px',borderRadius:'10px',border:'none',cursor:isSaving?'default':'pointer'}}>
                        {isSaving?'⏳ Guardando...':'Guardar Pronóstico'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!isFinished&&!canPred&&(
                <div style={{padding:'10px 14px',borderRadius:'10px',background:'rgba(107,114,128,0.08)',border:'1px solid rgba(107,114,128,0.15)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                  <Lock size={14} style={{color:'rgba(255,255,255,0.3)'}}/>
                  <span style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',fontWeight:'500'}}>Pronósticos cerrados</span>
                  <span style={{fontSize:'12px',color:'rgba(255,255,255,0.25)'}}>· Menos de 10 min</span>
                </div>
              )}
            </div>
          );
        })}

        {filteredMatches.length===0&&(
          <div style={{...card,padding:'48px',textAlign:'center'}}>
            <div style={{fontSize:'32px',marginBottom:'12px'}}>📅</div>
            <div style={{fontSize:'15px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>No hay partidos {formatDayLabel(effectiveDate)==='Hoy'?'hoy':`el ${formatDayLabel(effectiveDate)}`}</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.25)'}}>Use las flechas para ver otro día</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;