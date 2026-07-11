import React, { useState, useEffect } from 'react';
import { getTeamById } from '../data/teams';

const card = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px' };

const Avatar = ({ user, size = 32 }) => {
  const team = getTeamById(user?.avatar);
  if (team?.flagCode) {
    return <img src={`https://hatscripts.github.io/circle-flags/flags/${team.flagCode}.svg`} width={size} height={size} style={{borderRadius:'50%'}} alt="" onError={e=>{e.target.style.display='none';}}/>;
  }
  return <span style={{fontSize:`${size*0.75}px`}}>{user?.avatar||'👤'}</span>;
};

const RankingPolla = ({ currentUser, users, onSaveRankingPrediction, rankingForceOpen, rankingMonto, rankingCalculated }) => {
  // Participantes habilitados (pagaron) — solo ellos entran al ranking de la polla
  const enabledUsers = users.filter(u => u.rankingPollaEnabled);

  // ¿El usuario actual está habilitado?
  const isEnabled = !!currentUser.rankingPollaEnabled || currentUser.isAdmin;

  // Su pronóstico guardado (array de 5 uids en orden)
  const savedPrediction = currentUser.rankingPrediction?.positions || [];
  const savedTimestamp = currentUser.rankingPrediction?.timestamp || null;

  const [selected, setSelected] = useState(savedPrediction);
  const [saving, setSaving]     = useState(false);
  const [view, setView]         = useState('predict'); // 'predict' | 'ranking'

  useEffect(() => {
    setSelected(currentUser.rankingPrediction?.positions || []);
  }, [currentUser.rankingPrediction]);

  // Ventana abierta para pronosticar
  const windowOpen = rankingForceOpen && !rankingCalculated;

  // Candidatos elegibles = todos los usuarios habilitados (incluye al propio usuario: auto-voto permitido)
  const candidates = enabledUsers;

  const toggleUser = (uid) => {
    if (!windowOpen) return;
    setSelected(prev => {
      if (prev.includes(uid)) return prev.filter(x => x !== uid);
      if (prev.length >= 5) { alert('Ya seleccionaste 5. Quita uno para cambiar.'); return prev; }
      return [...prev, uid];
    });
  };

  const moveUp = (index) => {
    if (index === 0) return;
    setSelected(prev => {
      const arr = [...prev];
      [arr[index-1], arr[index]] = [arr[index], arr[index-1]];
      return arr;
    });
  };

  const moveDown = (index) => {
    setSelected(prev => {
      if (index === prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index+1], arr[index]] = [arr[index], arr[index+1]];
      return arr;
    });
  };

  const handleSave = async () => {
    if (selected.length !== 5) { alert('Debes elegir exactamente 5 usuarios en orden.'); return; }
    if (!confirm('¿Guardar tu Top 5? Podrás cambiarlo mientras la ventana esté abierta.')) return;
    setSaving(true);
    try {
      await onSaveRankingPrediction(currentUser.id, selected);
      alert('✅ ¡Tu Top 5 fue guardado!');
    } catch (e) {
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // Ranking real (contra el que se comparan las predicciones): usuarios habilitados ordenados por puntos del ranking general
  const realRanking = [...enabledUsers].sort((a,b) => (b.points||0) - (a.points||0));
  const realTop5 = realRanking.slice(0, 5).map(u => u.id);

  // Cálculo de puntos de la polla del ranking para mostrar (preview en vivo)
  const calcPollaPoints = (predPositions) => {
    if (!predPositions || predPositions.length === 0) return 0;
    let pts = 0;
    predPositions.forEach((uid, idx) => {
      if (realTop5[idx] === uid) pts += 5;            // posición exacta
      else if (realTop5.includes(uid)) pts += 2;      // está en top 5, otra posición
    });
    return pts;
  };

  const medal = (i) => ['🥇','🥈','🥉','4️⃣','5️⃣'][i] || `${i+1}`;

  const fmtDate = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString('es-CO', { timeZone:'America/Bogota', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', hour12:true });
  };

  // ══════════ VISTA CANDADO: no habilitado ══════════
  if (!isEnabled) {
    return (
      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
        <div style={{...card,padding:'20px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:'linear-gradient(90deg,#f59e0b,#c026d3)'}}/>
          <h2 style={{fontSize:'18px',fontWeight:'800',color:'white',marginBottom:'4px'}}>👑 Polla del Ranking</h2>
          <p style={{fontSize:'13px',color:'rgba(255,255,255,0.45)'}}>Una polla paralela: pronostica el Top 5 final del ranking</p>
        </div>

        <div style={{...card,padding:'32px 24px',textAlign:'center'}}>
          <div style={{fontSize:'56px',marginBottom:'16px'}}>🔒</div>
          <div style={{fontSize:'18px',fontWeight:'800',color:'white',marginBottom:'12px'}}>Participación bloqueada</div>
          <div style={{fontSize:'14px',color:'rgba(255,255,255,0.55)',lineHeight:'1.7',marginBottom:'20px'}}>
            Para participar en la Polla del Ranking debes consignar
            <strong style={{color:'#fbbf24'}}> {rankingMonto || '$10.000'} </strong>
            adicionales. Envía tu comprobante a <strong style={{color:'white'}}>Dianita</strong> y en cuanto confirme el pago se habilitará tu acceso.
          </div>
          <div style={{padding:'16px',borderRadius:'14px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)'}}>
            <div style={{fontSize:'13px',color:'#fbbf24',fontWeight:'700',marginBottom:'8px'}}>¿Cómo funciona?</div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.55)',lineHeight:'1.8',textAlign:'left'}}>
              🎯 Eliges quiénes crees que quedarán en el <strong style={{color:'white'}}>Top 5 del ranking general</strong> al final del Mundial.<br/>
              ✅ <strong style={{color:'#4ade80'}}>+5 pts</strong> por cada usuario que aciertes en su posición exacta.<br/>
              🔸 <strong style={{color:'#93c5fd'}}>+2 pts</strong> si está en el Top 5 pero en otra posición.<br/>
              🏆 Ranking independiente: ¡otra oportunidad de ganar!
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════ VISTA HABILITADO ══════════
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

      {/* Header */}
      <div style={{...card,padding:'20px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:'linear-gradient(90deg,#f59e0b,#c026d3)'}}/>
        <h2 style={{fontSize:'18px',fontWeight:'800',color:'white',marginBottom:'4px'}}>👑 Polla del Ranking</h2>
        <p style={{fontSize:'13px',color:'rgba(255,255,255,0.45)'}}>Pronostica el Top 5 final del ranking general</p>
      </div>

      {/* Tabs internas */}
      <div style={{...card,padding:'8px',display:'flex',gap:'6px'}}>
        {[
          { id:'predict', label:'🎯 Mi Top 5' },
          { id:'ranking', label:'🏆 Ranking Polla' },
        ].map(t => (
          <button key={t.id} onClick={()=>setView(t.id)}
            style={{flex:1,padding:'10px',borderRadius:'10px',fontSize:'13px',fontWeight:'600',cursor:'pointer',border:'none',
              background:view===t.id?'rgba(245,158,11,0.18)':'transparent',
              color:view===t.id?'#fbbf24':'rgba(255,255,255,0.5)'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════ VISTA: MI TOP 5 ═══════ */}
      {view==='predict' && (
        <>
          {/* Estado de la ventana */}
          <div style={{...card,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)'}}>
              Estado de la ventana:
            </div>
            <span style={{fontSize:'12px',fontWeight:'700',padding:'4px 12px',borderRadius:'8px',
              background: windowOpen ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.12)',
              color: windowOpen ? '#4ade80' : '#f87171',
              border: windowOpen ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(239,68,68,0.25)'}}>
              {rankingCalculated ? '🏁 Finalizada' : windowOpen ? '🔓 Abierta' : '🔒 Cerrada'}
            </span>
          </div>

          {/* Reglas rápidas */}
          <div style={{...card,padding:'14px 16px'}}>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.55)',lineHeight:'1.8'}}>
              🎯 Elige <strong style={{color:'white'}}>5 usuarios en orden</strong> (del 1° al 5°).<br/>
              ✅ <strong style={{color:'#4ade80'}}>+5 pts</strong> por acierto en posición exacta.<br/>
              🔸 <strong style={{color:'#93c5fd'}}>+2 pts</strong> si está en el Top 5 pero en otra posición.<br/>
              💡 Puedes votarte a ti mismo. Máximo posible: <strong style={{color:'#fbbf24'}}>25 pts</strong>.
            </div>
          </div>

          {/* Tu selección ordenada */}
          {selected.length > 0 && (
            <div style={{...card,padding:'16px'}}>
              <div style={{fontSize:'13px',fontWeight:'700',color:'white',marginBottom:'12px'}}>Tu Top 5 (ordénalo):</div>
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {selected.map((uid, idx) => {
                  const u = users.find(x => x.id === uid);
                  if (!u) return null;
                  return (
                    <div key={uid} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)'}}>
                      <span style={{fontSize:'20px',minWidth:'28px'}}>{medal(idx)}</span>
                      <Avatar user={u} size={28}/>
                      <span style={{flex:1,fontSize:'14px',fontWeight:'600',color:'white'}}>{u.nickname||u.name}</span>
                      {windowOpen && (
                        <div style={{display:'flex',gap:'4px'}}>
                          <button onClick={()=>moveUp(idx)} disabled={idx===0}
                            style={{width:'30px',height:'30px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.1)',cursor:idx===0?'default':'pointer',
                              background:'rgba(255,255,255,0.05)',color:idx===0?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.7)',fontSize:'14px'}}>▲</button>
                          <button onClick={()=>moveDown(idx)} disabled={idx===selected.length-1}
                            style={{width:'30px',height:'30px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.1)',cursor:idx===selected.length-1?'default':'pointer',
                              background:'rgba(255,255,255,0.05)',color:idx===selected.length-1?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.7)',fontSize:'14px'}}>▼</button>
                          <button onClick={()=>toggleUser(uid)}
                            style={{width:'30px',height:'30px',borderRadius:'8px',border:'1px solid rgba(239,68,68,0.25)',cursor:'pointer',
                              background:'rgba(239,68,68,0.1)',color:'#f87171',fontSize:'14px'}}>✕</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lista de candidatos */}
          {windowOpen && (
            <div style={{...card,padding:'16px'}}>
              <div style={{fontSize:'13px',fontWeight:'700',color:'white',marginBottom:'4px'}}>
                Elige participantes ({selected.length}/5)
              </div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'12px'}}>
                Toca para agregar. El orden en que los agregas es su posición inicial (luego reordena arriba).
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {candidates.map(u => {
                  const isSel = selected.includes(u.id);
                  const isMe = u.id === currentUser.id;
                  return (
                    <button key={u.id} onClick={()=>toggleUser(u.id)}
                      style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',cursor:'pointer',textAlign:'left',
                        background:isSel?'rgba(74,222,128,0.12)':'rgba(255,255,255,0.03)',
                        border:isSel?'1px solid rgba(74,222,128,0.35)':'1px solid rgba(255,255,255,0.06)'}}>
                      <Avatar user={u} size={28}/>
                      <div style={{flex:1}}>
                        <span style={{fontSize:'14px',fontWeight:'600',color:isSel?'#4ade80':'white'}}>{u.nickname||u.name}</span>
                        {isMe && <span style={{fontSize:'11px',color:'#fbbf24',marginLeft:'8px'}}>(tú)</span>}
                      </div>
                      <span style={{fontSize:'12px',color:'rgba(255,255,255,0.35)'}}>{u.points||0} pts</span>
                      {isSel && <span style={{fontSize:'14px',color:'#4ade80'}}>✓</span>}
                    </button>
                  );
                })}
                {candidates.length === 0 && (
                  <div style={{textAlign:'center',padding:'24px',color:'rgba(255,255,255,0.35)',fontSize:'13px'}}>
                    Aún no hay participantes habilitados. Dianita debe habilitar a quienes paguen.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botón guardar */}
          {windowOpen && (
            <button onClick={handleSave} disabled={saving || selected.length !== 5}
              style={{width:'100%',padding:'14px',borderRadius:'12px',fontWeight:'700',fontSize:'14px',border:'none',
                cursor:(saving||selected.length!==5)?'default':'pointer',
                background:selected.length===5?'linear-gradient(135deg,#d97706,#f59e0b)':'rgba(255,255,255,0.06)',
                color:selected.length===5?'white':'rgba(255,255,255,0.3)'}}>
              {saving ? '⏳ Guardando...' : selected.length===5 ? '💾 Guardar mi Top 5' : `Elige ${5-selected.length} más`}
            </button>
          )}

          {/* Ventana cerrada: mostrar pronóstico guardado */}
          {!windowOpen && savedPrediction.length > 0 && (
            <div style={{...card,padding:'14px 16px'}}>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>
                {rankingCalculated ? '🏁 Resultados finales calculados.' : '🔒 La ventana está cerrada.'} Tu pronóstico quedó registrado.
                {savedTimestamp && <span style={{display:'block',marginTop:'4px',color:'rgba(255,255,255,0.35)'}}>Guardado: {fmtDate(savedTimestamp)}</span>}
              </div>
            </div>
          )}

          {!windowOpen && savedPrediction.length === 0 && (
            <div style={{...card,padding:'24px',textAlign:'center'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>⏳</div>
              <div style={{fontSize:'14px',color:'rgba(255,255,255,0.5)'}}>
                La ventana de pronóstico está cerrada y no registraste tu Top 5.
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════ VISTA: RANKING POLLA ═══════ */}
      {view==='ranking' && (
        <>
          {!rankingCalculated && (
            <div style={{...card,padding:'14px 16px'}}>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',lineHeight:'1.6'}}>
                📊 Vista previa en vivo. Los puntos se calculan comparando cada pronóstico contra el Top 5 actual del ranking general. Se congela cuando Dianita presione <strong style={{color:'#fbbf24'}}>Calcular resultados</strong>.
              </div>
            </div>
          )}

          {/* Top 5 real actual */}
          <div style={{...card,padding:'16px'}}>
            <div style={{fontSize:'13px',fontWeight:'700',color:'white',marginBottom:'12px'}}>
              {rankingCalculated ? '🏁 Top 5 final del ranking' : '📈 Top 5 actual del ranking'}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {realRanking.slice(0,5).map((u, idx) => (
                <div key={u.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                  <span style={{fontSize:'18px',minWidth:'26px'}}>{medal(idx)}</span>
                  <Avatar user={u} size={26}/>
                  <span style={{flex:1,fontSize:'13px',fontWeight:'600',color:'white'}}>{u.nickname||u.name}</span>
                  <span style={{fontSize:'13px',fontWeight:'700',color:'#fbbf24'}}>{u.points||0} pts</span>
                </div>
              ))}
              {realRanking.length === 0 && (
                <div style={{textAlign:'center',padding:'20px',color:'rgba(255,255,255,0.35)',fontSize:'13px'}}>Sin participantes habilitados aún.</div>
              )}
            </div>
          </div>

          {/* Clasificación de la Polla del Ranking */}
          <div style={{...card,padding:'16px'}}>
            <div style={{fontSize:'13px',fontWeight:'700',color:'white',marginBottom:'4px'}}>👑 Clasificación Polla del Ranking</div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'12px'}}>Puntos por acertar el Top 5. Solo participantes habilitados.</div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {[...enabledUsers]
                .map(u => ({
                  user: u,
                  pts: rankingCalculated ? (u.rankingPollaPoints || 0) : calcPollaPoints(u.rankingPrediction?.positions || [])
                }))
                .sort((a,b) => b.pts - a.pts)
                .map((row, idx) => {
                  const isMe = row.user.id === currentUser.id;
                  return (
                    <div key={row.user.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',
                      background:isMe?'rgba(245,158,11,0.1)':'rgba(255,255,255,0.03)',
                      border:isMe?'1px solid rgba(245,158,11,0.3)':'1px solid rgba(255,255,255,0.06)'}}>
                      <span style={{fontSize:'14px',fontWeight:'700',color:'rgba(255,255,255,0.4)',minWidth:'24px'}}>{idx+1}</span>
                      <Avatar user={row.user} size={26}/>
                      <div style={{flex:1}}>
                        <span style={{fontSize:'13px',fontWeight:'600',color:'white'}}>{row.user.nickname||row.user.name}</span>
                        {isMe && <span style={{fontSize:'11px',color:'#fbbf24',marginLeft:'6px'}}>(tú)</span>}
                        {(row.user.rankingPrediction?.positions?.length||0)===0 && (
                          <span style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginLeft:'6px'}}>· sin pronóstico</span>
                        )}
                      </div>
                      <span style={{fontSize:'15px',fontWeight:'800',color:row.pts>0?'#4ade80':'rgba(255,255,255,0.3)'}}>+{row.pts}</span>
                    </div>
                  );
                })}
              {enabledUsers.length === 0 && (
                <div style={{textAlign:'center',padding:'20px',color:'rgba(255,255,255,0.35)',fontSize:'13px'}}>Sin participantes habilitados aún.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RankingPolla;