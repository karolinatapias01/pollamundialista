import React, { useState } from 'react';
import { Save, X, Edit2, AlertCircle, Trash2, CheckCircle } from 'lucide-react';
import { getTeamById, teams } from '../data/teams';
import { matches as allMatches } from '../data/matches';

const card = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px' };

const Flag = ({ code, size = 24 }) => {
  if (!code) return <span>🏳️</span>;
  return <img src={`https://hatscripts.github.io/circle-flags/flags/${code.toLowerCase()}.svg`} width={size} height={size} alt={code} style={{borderRadius:'50%'}} onError={e=>{e.target.style.display='none';}}/>;
};

const ALL_GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

const getTeamsByGroup = (group) => {
  const gMatches = allMatches.filter(m => m.phase==='groups' && m.group===group);
  const ids = new Set();
  gMatches.forEach(m => { if(m.homeTeam) ids.add(m.homeTeam); if(m.awayTeam) ids.add(m.awayTeam); });
  return [...ids].map(id => getTeamById(id)).filter(Boolean);
};

const AdminPanel = ({ matches, onUpdateResult, onUpdateGroupResult, onUpdateChampion, users, onDeleteUser, onApproveUser, onRejectUser, onResetAll }) => {
  const [activeSection, setActiveSection] = useState('pending');
  const [editingMatch, setEditingMatch] = useState(null);
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [filter, setFilter] = useState('pending');
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [groupFirst, setGroupFirst] = useState('');
  const [groupSecond, setGroupSecond] = useState('');
  const [championId, setChampionId] = useState('');
  const [championSaved, setChampionSaved] = useState(false);
  const [resetting, setResetting] = useState(false);

  const pendingUsers = users.filter(u => !u.approved && !u.isAdmin);
  const approvedUsers = users.filter(u => u.approved && !u.isAdmin);

  const filteredMatches = matches.filter(m => {
    if (filter==='pending') return m.status !== 'finished';
    if (filter==='finished') return m.status === 'finished';
    return true;
  });

  const formatDate = (d) => new Date(d).toLocaleDateString('es-CO',{weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:true,timeZone:'America/Bogota'});
  const phaseLabel = (p) => ({groups:'Grupos',round16:'Octavos',quarters:'Cuartos',semis:'Semis',third:'3er Lugar',final:'Final'}[p]||p);
  const inputStyle = { width:'56px',textAlign:'center',fontSize:'22px',fontWeight:'700',padding:'8px',borderRadius:'10px',background:'rgba(255,255,255,0.08)',border:'2px solid rgba(168,85,247,0.4)',color:'white',outline:'none' };

  const sectionBtn = (id, label, emoji, badge) => (
    <button onClick={() => setActiveSection(id)}
      style={{padding:'8px 14px', borderRadius:'10px', fontSize:'13px', fontWeight:'500', cursor:'pointer', position:'relative', whiteSpace:'nowrap',
        background: activeSection===id ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.04)',
        border: activeSection===id ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.08)',
        color: activeSection===id ? '#c084fc' : 'rgba(255,255,255,0.5)'}}>
      {emoji} {label}
      {badge > 0 && (
        <span style={{position:'absolute',top:'-6px',right:'-6px',background:'#ef4444',color:'white',borderRadius:'50%',width:'18px',height:'18px',fontSize:'11px',fontWeight:'700',display:'flex',alignItems:'center',justifyContent:'center'}}>
          {badge}
        </span>
      )}
    </button>
  );

  const UserCard = ({ user }) => {
    const team = getTeamById(user.avatar);
    return (
      <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',borderRadius:'12px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>
        {team?.flagCode
          ? <img src={`https://hatscripts.github.io/circle-flags/flags/${team.flagCode}.svg`} width={32} height={32} style={{borderRadius:'50%'}} onError={e=>{e.target.style.display='none';}}/>
          : <span style={{fontSize:'24px'}}>{user.avatar||'👤'}</span>
        }
        <div style={{flex:1}}>
          <div style={{fontSize:'14px',fontWeight:'600',color:'white'}}>
            {user.name}{user.nickname?` "${user.nickname}"`:''} 
          </div>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginTop:'2px'}}>
            {user.points||0} pts · {Object.keys(user.predictions||{}).length} pronósticos
            {user.championPrediction && (
              <span style={{marginLeft:'8px',color:'#fde047'}}>
                🏆 {getTeamById(user.championPrediction)?.name}
              </span>
            )}
          </div>
        </div>
        <div style={{display:'flex',gap:'6px'}}>
          {!user.approved && (
            <button onClick={()=>onApproveUser(user.id)}
              style={{padding:'8px 12px',borderRadius:'10px',background:'rgba(22,163,74,0.15)',border:'1px solid rgba(22,163,74,0.3)',color:'#4ade80',cursor:'pointer',display:'flex',alignItems:'center',gap:'5px',fontSize:'13px',fontWeight:'500'}}>
              <CheckCircle size={14}/> Aprobar
            </button>
          )}
          {!user.isAdmin && (
            <button onClick={()=>{
              if(!confirm(`¿Eliminar a ${user.name}?`)) return;
              onDeleteUser(user.id);
            }}
              style={{padding:'8px 12px',borderRadius:'10px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',color:'#f87171',cursor:'pointer',display:'flex',alignItems:'center',gap:'5px',fontSize:'13px',fontWeight:'500'}}>
              <Trash2 size={14}/>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

      <div style={{...card,padding:'16px 20px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:'linear-gradient(90deg,#7c3aed,#c026d3)'}}/>
        <h2 style={{fontSize:'17px',fontWeight:'800',color:'white',marginBottom:'4px'}}>👑 Panel de administración</h2>
        <p style={{fontSize:'13px',color:'rgba(255,255,255,0.4)'}}>Gestiona resultados, clasificados, campeón y usuarios</p>
      </div>

      <div style={{...card,padding:'12px 14px',display:'flex',gap:'8px',overflowX:'auto'}}>
        {sectionBtn('pending','Pendientes','⏳', pendingUsers.length)}
        {sectionBtn('matches','Partidos','⚽')}
        {sectionBtn('groups','Clasificados','📊')}
        {sectionBtn('champion','Campeón','🏆')}
        {sectionBtn('users','Usuarios','👥')}
        {sectionBtn('reset','Resetear','🔄')}
      </div>

      {/* PENDIENTES */}
      {activeSection==='pending' && (
        <div style={{...card,padding:'20px'}}>
          <div style={{marginBottom:'16px'}}>
            <h3 style={{fontSize:'15px',fontWeight:'700',color:'white',marginBottom:'4px'}}>⏳ Usuarios pendientes</h3>
            <p style={{fontSize:'13px',color:'rgba(255,255,255,0.4)'}}>Aprueba solo a quienes hayan pagado $15.000</p>
          </div>
          {pendingUsers.length === 0 ? (
            <div style={{textAlign:'center',padding:'32px',color:'rgba(255,255,255,0.35)',fontSize:'14px'}}>
              <div style={{fontSize:'32px',marginBottom:'10px'}}>✅</div>
              No hay usuarios pendientes
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {pendingUsers.map(user => <UserCard key={user.id} user={user}/>)}
            </div>
          )}
        </div>
      )}

      {/* PARTIDOS */}
      {activeSection==='matches' && (
        <>
          <div style={{...card,padding:'12px 14px',display:'flex',gap:'8px',overflowX:'auto'}}>
            {[['pending','⏳ Pendientes'],['finished','✓ Finalizados'],['all','▪ Todos']].map(([id,label])=>(
              <button key={id} onClick={()=>setFilter(id)}
                style={{padding:'6px 14px',borderRadius:'16px',fontSize:'13px',fontWeight:'500',cursor:'pointer',whiteSpace:'nowrap',
                  background:filter===id?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.04)',
                  border:filter===id?'1px solid rgba(74,222,128,0.4)':'1px solid rgba(255,255,255,0.1)',
                  color:filter===id?'#4ade80':'rgba(255,255,255,0.45)'}}>
                {label}
              </button>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {filteredMatches.map(match=>{
              const homeTeam=getTeamById(match.homeTeam);
              const awayTeam=getTeamById(match.awayTeam);
              const isEditing=editingMatch===match.id;
              const isFinished=match.status==='finished';
              return(
                <div key={match.id} style={{...card,padding:'16px 18px',borderLeft:`3px solid ${isFinished?'#16a34a':'#f97316'}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                    <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                      <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'6px',background:isFinished?'rgba(22,163,74,0.12)':'rgba(249,115,22,0.12)',color:isFinished?'#4ade80':'#fb923c',border:`1px solid ${isFinished?'rgba(22,163,74,0.25)':'rgba(249,115,22,0.25)'}`}}>
                        {isFinished?'✓ Finalizado':'⏳ Pendiente'}
                      </span>
                      <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'6px',background:'rgba(59,130,246,0.1)',color:'#93c5fd',border:'1px solid rgba(59,130,246,0.2)'}}>
                        {phaseLabel(match.phase)}{match.group?` · Grupo ${match.group}`:''}
                      </span>
                    </div>
                    <span style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>{formatDate(match.date)}</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
                    <div style={{textAlign:'center'}}>
                      <div style={{display:'flex',justifyContent:'center',marginBottom:'6px'}}><Flag code={homeTeam?.flagCode} size={32}/></div>
                      <div style={{fontSize:'13px',fontWeight:'600',color:'rgba(255,255,255,0.8)'}}>{homeTeam?.name||'TBD'}</div>
                    </div>
                    <div style={{textAlign:'center',minWidth:'110px'}}>
                      {isEditing?(
                        <div style={{display:'flex',alignItems:'center',gap:'8px',justifyContent:'center'}}>
                          <input type="number" min="0" max="20" value={homeScore} onChange={e=>setHomeScore(e.target.value)} style={inputStyle} autoFocus/>
                          <span style={{color:'rgba(255,255,255,0.3)',fontSize:'20px'}}>-</span>
                          <input type="number" min="0" max="20" value={awayScore} onChange={e=>setAwayScore(e.target.value)} style={inputStyle}/>
                        </div>
                      ):(
                        <div style={{fontSize:'26px',fontWeight:'800',color:isFinished?'white':'rgba(255,255,255,0.2)',letterSpacing:'-1px'}}>
                          {isFinished?`${match.homeScore} - ${match.awayScore}`:'- -'}
                        </div>
                      )}
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{display:'flex',justifyContent:'center',marginBottom:'6px'}}><Flag code={awayTeam?.flagCode} size={32}/></div>
                      <div style={{fontSize:'13px',fontWeight:'600',color:'rgba(255,255,255,0.8)'}}>{awayTeam?.name||'TBD'}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'8px'}}>
                    {isEditing?(
                      <>
                        <button onClick={()=>{onUpdateResult(match.id,parseInt(homeScore),parseInt(awayScore));setEditingMatch(null);}}
                          style={{flex:1,padding:'10px',background:'linear-gradient(135deg,#16a34a,#15803d)',color:'white',fontWeight:'600',fontSize:'14px',borderRadius:'10px',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                          <Save size={15}/> Guardar
                        </button>
                        <button onClick={()=>setEditingMatch(null)}
                          style={{padding:'10px 14px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.6)',borderRadius:'10px',cursor:'pointer'}}>
                          <X size={15}/>
                        </button>
                      </>
                    ):(
                      <button onClick={()=>{setEditingMatch(match.id);setHomeScore(match.homeScore?.toString()||'');setAwayScore(match.awayScore?.toString()||'');}}
                        style={{flex:1,padding:'10px',background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.3)',color:'#c084fc',fontWeight:'600',fontSize:'14px',borderRadius:'10px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                        <Edit2 size={15}/>{isFinished?'Editar resultado':'Ingresar resultado'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredMatches.length===0&&(
              <div style={{...card,padding:'40px',textAlign:'center',color:'rgba(255,255,255,0.3)'}}>No hay partidos con este filtro</div>
            )}
          </div>
        </>
      )}

      {/* CLASIFICADOS */}
      {activeSection==='groups' && (
        <div style={{...card,padding:'20px'}}>
          <div style={{marginBottom:'16px'}}>
            <h3 style={{fontSize:'15px',fontWeight:'700',color:'white',marginBottom:'4px'}}>📊 Ingresar clasificados</h3>
            <p style={{fontSize:'13px',color:'rgba(255,255,255,0.4)'}}>Ingresa quién quedó 1° y 2° en cada grupo</p>
          </div>
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'16px'}}>
            {ALL_GROUPS.map(g=>(
              <button key={g} onClick={()=>{setSelectedGroup(g);setGroupFirst('');setGroupSecond('');}}
                style={{width:'36px',height:'36px',borderRadius:'8px',fontSize:'12px',fontWeight:'600',cursor:'pointer',
                  background:selectedGroup===g?'rgba(168,85,247,0.2)':'rgba(255,255,255,0.04)',
                  border:selectedGroup===g?'1px solid rgba(168,85,247,0.4)':'1px solid rgba(255,255,255,0.08)',
                  color:selectedGroup===g?'#c084fc':'rgba(255,255,255,0.5)'}}>
                {g}
              </button>
            ))}
          </div>
          <div style={{fontSize:'14px',fontWeight:'600',color:'white',marginBottom:'12px'}}>Grupo {selectedGroup}</div>
          {['first','second'].map(pos=>(
            <div key={pos} style={{marginBottom:'12px'}}>
              <div style={{fontSize:'12px',color:pos==='first'?'#4ade80':'#93c5fd',fontWeight:'600',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.05em'}}>
                {pos==='first'?'1° Clasificado':'2° Clasificado'}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                {getTeamsByGroup(selectedGroup).map(team=>{
                  const val = pos==='first'?groupFirst:groupSecond;
                  const isSelected = val===team.id;
                  return(
                    <button key={team.id} onClick={()=>pos==='first'?setGroupFirst(team.id):setGroupSecond(team.id)}
                      style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 12px',borderRadius:'10px',cursor:'pointer',
                        background:isSelected?pos==='first'?'rgba(74,222,128,0.15)':'rgba(59,130,246,0.15)':'rgba(255,255,255,0.03)',
                        border:isSelected?pos==='first'?'1px solid rgba(74,222,128,0.4)':'1px solid rgba(59,130,246,0.4)':'1px solid rgba(255,255,255,0.06)'}}>
                      <Flag code={team.flagCode} size={24}/>
                      <span style={{fontSize:'13px',color:isSelected?pos==='first'?'#4ade80':'#93c5fd':'rgba(255,255,255,0.7)'}}>{team.name}</span>
                      {isSelected&&<span style={{marginLeft:'auto',fontSize:'14px'}}>{pos==='first'?'🥇':'🥈'}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button onClick={()=>{
            if(!groupFirst||!groupSecond){alert('Selecciona 1° y 2°');return;}
            if(groupFirst===groupSecond){alert('No pueden ser el mismo equipo');return;}
            onUpdateGroupResult(selectedGroup,groupFirst,groupSecond);
            alert(`✓ Clasificados del Grupo ${selectedGroup} guardados.`);
            setGroupFirst(''); setGroupSecond('');
          }}
            style={{width:'100%',padding:'12px',background:groupFirst&&groupSecond?'linear-gradient(135deg,#7c3aed,#c026d3)':'rgba(255,255,255,0.06)',border:'none',color:groupFirst&&groupSecond?'white':'rgba(255,255,255,0.3)',fontWeight:'600',fontSize:'14px',borderRadius:'10px',cursor:'pointer',marginTop:'8px'}}>
            Guardar clasificados Grupo {selectedGroup}
          </button>
        </div>
      )}

      {/* CAMPEÓN */}
      {activeSection==='champion' && (
        <div style={{...card,padding:'20px'}}>
          <div style={{marginBottom:'16px'}}>
            <h3 style={{fontSize:'15px',fontWeight:'700',color:'white',marginBottom:'4px'}}>🏆 Ingresar campeón</h3>
            <p style={{fontSize:'13px',color:'rgba(255,255,255,0.4)'}}>Da +15 pts a quienes adivinaron el campeón</p>
          </div>
          {championSaved ? (
            <div style={{padding:'16px',borderRadius:'12px',background:'rgba(250,204,21,0.1)',border:'1px solid rgba(250,204,21,0.3)',textAlign:'center'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>🏆</div>
              <div style={{fontSize:'14px',fontWeight:'700',color:'#fde047'}}>¡Campeón registrado!</div>
            </div>
          ) : (
            <>
              <div style={{maxHeight:'350px',overflowY:'auto',marginBottom:'12px'}}>
                {[...teams].sort((a,b)=>a.name.localeCompare(b.name,'es')).map(team=>(
                  <button key={team.id} onClick={()=>setChampionId(team.id)}
                    style={{width:'100%',display:'flex',alignItems:'center',gap:'12px',padding:'10px 14px',borderRadius:'10px',cursor:'pointer',marginBottom:'3px',
                      background:championId===team.id?'rgba(250,204,21,0.12)':'transparent',
                      border:championId===team.id?'1px solid rgba(250,204,21,0.4)':'1px solid transparent'}}>
                    <Flag code={team.flagCode} size={28}/>
                    <span style={{fontSize:'13px',fontWeight:'500',color:championId===team.id?'#fde047':'rgba(255,255,255,0.8)'}}>{team.name}</span>
                    {championId===team.id&&<span style={{marginLeft:'auto',fontSize:'18px'}}>🏆</span>}
                  </button>
                ))}
              </div>
              <button onClick={()=>{
                if(!championId){alert('Selecciona el campeón');return;}
                if(!confirm(`¿Confirmas que el campeón es ${getTeamById(championId)?.name}?`)) return;
                onUpdateChampion(championId);
                setChampionSaved(true);
              }}
                style={{width:'100%',padding:'12px',background:championId?'linear-gradient(135deg,#d97706,#f59e0b)':'rgba(255,255,255,0.06)',border:'none',color:championId?'white':'rgba(255,255,255,0.3)',fontWeight:'600',fontSize:'14px',borderRadius:'10px',cursor:'pointer'}}>
                🏆 Registrar campeón y dar puntos
              </button>
            </>
          )}
        </div>
      )}

      {/* USUARIOS */}
      {activeSection==='users' && (
        <div style={{...card,padding:'20px'}}>
          <div style={{marginBottom:'16px'}}>
            <h3 style={{fontSize:'15px',fontWeight:'700',color:'white',marginBottom:'4px'}}>👥 Usuarios aprobados ({approvedUsers.length})</h3>
            <p style={{fontSize:'13px',color:'rgba(255,255,255,0.4)'}}>Jugadores activos en la polla</p>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {approvedUsers.map(user => <UserCard key={user.id} user={user}/>)}
            {approvedUsers.length===0&&<div style={{textAlign:'center',padding:'24px',color:'rgba(255,255,255,0.35)',fontSize:'14px'}}>No hay usuarios aprobados aún</div>}
          </div>
        </div>
      )}

      {/* RESETEAR */}
      {activeSection==='reset' && (
        <div style={{...card,padding:'20px'}}>
          <div style={{marginBottom:'16px'}}>
            <h3 style={{fontSize:'15px',fontWeight:'700',color:'white',marginBottom:'4px'}}>🔄 Resetear pronósticos</h3>
            <p style={{fontSize:'13px',color:'rgba(255,255,255,0.4)'}}>Borra pronósticos y puntos. Los usuarios y campeón pronosticado se mantienen.</p>
          </div>
          <div style={{padding:'16px',borderRadius:'12px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',marginBottom:'16px'}}>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)',lineHeight:'1.8'}}>
              ✓ Puntos → 0<br/>
              ✓ Pronósticos de partidos → borrados<br/>
              ✓ Pronósticos de grupos → borrados<br/>
              ✓ Resultados de partidos → pendientes<br/>
              ✗ Usuarios → se mantienen<br/>
              ✗ Campeón pronosticado → se mantiene
            </div>
          </div>
          <button
            disabled={resetting}
            onClick={async ()=>{
              if(!confirm('¿Seguro? Esto borra todos los puntos y pronósticos.')) return;
              if(!confirm('¿Está completamente seguro? Esta acción NO se puede deshacer.')) return;
              setResetting(true);
              await onResetAll();
              setResetting(false);
              alert('✓ Todo reseteado. Todos empiezan desde cero.');
            }}
            style={{width:'100%',padding:'14px',background:resetting?'rgba(255,255,255,0.06)':'rgba(239,68,68,0.2)',border:'1px solid rgba(239,68,68,0.4)',color:resetting?'rgba(255,255,255,0.3)':'#f87171',fontWeight:'700',fontSize:'14px',borderRadius:'10px',cursor:resetting?'default':'pointer'}}>
            {resetting?'⏳ Reseteando...':'🔄 Resetear todo y empezar de cero'}
          </button>
        </div>
      )}

      <div style={{padding:'14px 16px',borderRadius:'12px',background:'rgba(59,130,246,0.06)',border:'1px solid rgba(59,130,246,0.15)'}}>
        <div style={{display:'flex',gap:'8px',alignItems:'flex-start'}}>
          <AlertCircle size={15} style={{color:'#93c5fd',flexShrink:0,marginTop:'1px'}}/>
          <ul style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',lineHeight:'1.8',listStyle:'none'}}>
            <li>• Aprueba solo usuarios que hayan pagado $15.000</li>
            <li>• Los pendientes no pueden pronosticar</li>
            <li>• El número rojo en ⏳ indica cuántos esperan aprobación</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;