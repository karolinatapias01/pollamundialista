import React, { useState, useMemo } from 'react';
import { Clock, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTeamById } from '../data/teams';

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

const Matches = ({ matches, currentUser, onMakePrediction, reactions, onAddReaction, onRemoveReaction, users }) => {
  const [selectedPhase, setSelectedPhase] = useState('groups');
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [selectedDate,  setSelectedDate]  = useState(todayCol());
  const [viewMode,      setViewMode]      = useState('date');
  const [predictions,   setPredictions]   = useState({});
  const [showReactions, setShowReactions] = useState({});
  const [saving, setSaving] = useState({});

  const phases = [
    { id:'groups',   label:'⚽ Grupos'  },
    { id:'round16',  label:'🔥 Octavos' },
    { id:'quarters', label:'💪 Cuartos' },
    { id:'semis',    label:'🏅 Semis'   },
    { id:'final',    label:'🏆 Final'   },
  ];
  const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];

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
    if (!p.result && p.home===undefined) { alert('Selecciona Gana/Empate/Pierde o ingresa un marcador'); return; }
    const result = p.result||(p.home>p.away?'home':p.home<p.away?'away':'draw');
    const homeScore = p.home !== undefined ? parseInt(p.home) : undefined;
    const awayScore = p.away !== undefined ? parseInt(p.away) : undefined;
    setSaving(prev=>({...prev,[matchId]:true}));
    try {
      await onMakePrediction(currentUser.id, matchId, result, homeScore, awayScore);
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
          const localPred=predictions[match.id]||{};
          const isSaving=saving[match.id];

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
                  <div style={{display:'flex',justifyContent:'center',marginBottom:'8px'}}>
                    <Flag code={homeTeam?.flagCode} size={38}/>
                  </div>
                  <div style={{fontSize:'13px',fontWeight:'600',color:'rgba(255,255,255,0.85)'}}>{homeTeam?.name||'TBD'}</div>
                </div>
                <div style={{textAlign:'center',minWidth:'80px'}}>
                  {isFinished?(
                    <div style={{fontSize:'28px',fontWeight:'800',color:'white',letterSpacing:'-1px'}}>
                      {match.homeScore} <span style={{color:'rgba(255,255,255,0.3)'}}>-</span> {match.awayScore}
                    </div>
                  ):userPred&&!predictions[match.id]?(
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
                  <div style={{display:'flex',justifyContent:'center',marginBottom:'8px'}}>
                    <Flag code={awayTeam?.flagCode} size={38}/>
                  </div>
                  <div style={{fontSize:'13px',fontWeight:'600',color:'rgba(255,255,255,0.85)'}}>{awayTeam?.name||'TBD'}</div>
                </div>
              </div>

              {isFinished&&(
                <div>
                  {userPred&&(()=>{
                    const actualResult=match.homeScore>match.awayScore?'home':match.homeScore<match.awayScore?'away':'draw';
                    const predResult=userPred.result||(userPred.homeScore>userPred.awayScore?'home':userPred.homeScore<userPred.awayScore?'away':'draw');
                    const correct=predResult===actualResult;
                    const exact=userPred.homeScore!==undefined&&userPred.awayScore!==undefined&&parseInt(userPred.homeScore)===parseInt(match.homeScore)&&parseInt(userPred.awayScore)===parseInt(match.awayScore);
                    return(
                      <div style={{padding:'10px 14px',borderRadius:'10px',marginBottom:'10px',display:'flex',alignItems:'center',justifyContent:'space-between',background:correct?'rgba(22,163,74,0.1)':'rgba(239,68,68,0.08)',border:`1px solid ${correct?'rgba(22,163,74,0.2)':'rgba(239,68,68,0.2)'}`}}>
                        <span style={{fontSize:'13px',color:'rgba(255,255,255,0.5)'}}>
                          Tu: {userPred.homeScore!==undefined?`${userPred.homeScore}-${userPred.awayScore}`:userPred.result==='home'?`Gana ${homeTeam?.name}`:userPred.result==='away'?`Gana ${awayTeam?.name}`:'Empate'}
                        </span>
                        <span style={{fontSize:'13px',fontWeight:'600',color:exact?'#fde047':correct?'#4ade80':'#f87171'}}>
                          {exact?'🎯 Exacto +3':correct?'✓ Correcto +1':'✗ Incorrecto'}
                        </span>
                      </div>
                    );
                  })()}

                  {(()=>{
                    const otherPreds = users
                      .filter(u=>u.id!==currentUser.id&&u.predictions?.[match.id])
                      .map(u=>{
                        const pred=u.predictions[match.id];
                        const actualResult=match.homeScore>match.awayScore?'home':match.homeScore<match.awayScore?'away':'draw';
                        const predResult=pred.result||(pred.homeScore>pred.awayScore?'home':pred.homeScore<pred.awayScore?'away':'draw');
                        const correct=predResult===actualResult;
                        const exact=pred.homeScore!==undefined&&pred.awayScore!==undefined&&parseInt(pred.homeScore)===parseInt(match.homeScore)&&parseInt(pred.awayScore)===parseInt(match.awayScore);
                        return {user:u,pred,correct,exact};
                      });
                    if (!otherPreds.length) return null;
                    return(
                      <div style={{marginBottom:'10px',padding:'12px',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'8px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.05em'}}>
                          👥 Pronósticos de otros
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                          {otherPreds.map(({user,pred,correct,exact})=>{
                            const team=getTeamById(user.avatar);
                            return(
                              <div key={user.id} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px'}}>
                                {team?.flagCode
                                  ?<img src={`https://hatscripts.github.io/circle-flags/flags/${team.flagCode}.svg`} width={18} height={18} style={{borderRadius:'50%'}} onError={e=>{e.target.style.display='none';}}/>
                                  :<span style={{fontSize:'14px'}}>{user.avatar||'👤'}</span>
                                }
                                <span style={{color:'rgba(255,255,255,0.7)',flex:1}}>{user.name}{user.nickname?` "${user.nickname}"`:''}</span>
                                <span style={{color:'rgba(255,255,255,0.5)'}}>
                                  {pred.homeScore!==undefined?`${pred.homeScore}-${pred.awayScore}`:pred.result==='home'?`Gana ${homeTeam?.name}`:pred.result==='away'?`Gana ${awayTeam?.name}`:'Empate'}
                                </span>
                                <span style={{fontWeight:'600',color:exact?'#fde047':correct?'#4ade80':'#f87171'}}>
                                  {exact?'🎯':correct?'✓':'✗'}
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

              {!isFinished&&canPred&&(
                <div style={{padding:'14px',borderRadius:'12px',background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.15)'}}>
                  {userPred&&!predictions[match.id]?(
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'4px'}}>✓ Pronóstico guardado</div>
                      <div style={{fontSize:'14px',fontWeight:'700',color:'#4ade80',marginBottom:'8px'}}>
                        {userPred.homeScore!==undefined?`${userPred.homeScore} - ${userPred.awayScore}`:userPred.result==='home'?`Gana ${homeTeam?.name}`:userPred.result==='away'?`Gana ${awayTeam?.name}`:'Empate'}
                      </div>
                      <button onClick={()=>setPredictions(prev=>({...prev,[match.id]:{result:userPred.result,home:userPred.homeScore,away:userPred.awayScore}}))}
                        style={{fontSize:'12px',color:'#93c5fd',background:'none',border:'none',cursor:'pointer'}}>
                        Modificar
                      </button>
                    </div>
                  ):(
                    <div>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginBottom:'10px',textAlign:'center'}}>¿Quién gana?</div>
                      <div style={{display:'flex',gap:'6px',marginBottom:'12px'}}>
                        <button style={btnGEP(localPred.result==='home','74,222,128')} onClick={()=>setPredField(match.id,'result','home')}>
                          <div style={{marginBottom:'4px'}}><Flag code={homeTeam?.flagCode} size={20}/></div>
                          Gana
                        </button>
                        <button style={btnGEP(localPred.result==='draw','250,204,21')} onClick={()=>setPredField(match.id,'result','draw')}>
                          🤝<br/>Empate
                        </button>
                        <button style={btnGEP(localPred.result==='away','96,165,250')} onClick={()=>setPredField(match.id,'result','away')}>
                          <div style={{marginBottom:'4px'}}><Flag code={awayTeam?.flagCode} size={20}/></div>
                          Gana
                        </button>
                      </div>
                      <div style={{borderTop:'1px solid rgba(255,255,255,0.08)',paddingTop:'12px',marginBottom:'10px'}}>
                        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',textAlign:'center',marginBottom:'8px'}}>
                          ¿Marcador exacto? <span style={{color:'#fde047'}}>(+3 pts)</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px'}}>
                          <input type="number" min="0" max="20" placeholder="0"
                            value={localPred.home??''}
                            onChange={e=>{
                              const v=parseInt(e.target.value);
                              setPredField(match.id,'home',isNaN(v)?undefined:v);
                              if(!isNaN(v)&&localPred.away!==undefined) setPredField(match.id,'result',v>localPred.away?'home':v<localPred.away?'away':'draw');
                            }}
                            style={{width:'54px',textAlign:'center',fontSize:'22px',fontWeight:'700',padding:'8px',borderRadius:'10px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',color:'white'}}/>
                          <span style={{fontSize:'20px',color:'rgba(255,255,255,0.3)'}}>-</span>
                          <input type="number" min="0" max="20" placeholder="0"
                            value={localPred.away??''}
                            onChange={e=>{
                              const v=parseInt(e.target.value);
                              setPredField(match.id,'away',isNaN(v)?undefined:v);
                              if(!isNaN(v)&&localPred.home!==undefined) setPredField(match.id,'result',localPred.home>v?'home':localPred.home<v?'away':'draw');
                            }}
                            style={{width:'54px',textAlign:'center',fontSize:'22px',fontWeight:'700',padding:'8px',borderRadius:'10px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',color:'white'}}/>
                        </div>
                      </div>
                      <button onClick={()=>handleSubmit(match.id)} disabled={isSaving}
                        style={{width:'100%',padding:'10px',background:isSaving?'rgba(255,255,255,0.1)':'linear-gradient(135deg,#16a34a,#15803d)',color:'white',fontWeight:'600',fontSize:'14px',borderRadius:'10px',border:'none',cursor:isSaving?'default':'pointer'}}>
                        {isSaving ? '⏳ Guardando...' : 'Guardar Pronóstico'}
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