import React, { useState, useMemo } from 'react';
import { getTeamById } from '../data/teams';
import { matches as allMatchesData } from '../data/matches';

const card = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px' };

const Flag = ({ code, size = 28 }) => {
  if (!code) return <span style={{fontSize:size*0.8+'px'}}>🏳️</span>;
  return (
    <img src={`https://hatscripts.github.io/circle-flags/flags/${code.toLowerCase()}.svg`}
      width={size} height={size} alt={code}
      style={{borderRadius:'50%',objectFit:'cover'}}
      onError={e=>{e.target.style.display='none';}}/>
  );
};

const ALL_GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

const getTeamsByGroup = (group) => {
  const gMatches = allMatchesData.filter(m => m.phase==='groups' && m.group===group);
  const ids = new Set();
  gMatches.forEach(m => { if(m.homeTeam) ids.add(m.homeTeam); if(m.awayTeam) ids.add(m.awayTeam); });
  return [...ids].map(id => getTeamById(id)).filter(Boolean);
};

const calcStandings = (group, liveMatches) => {
  const teams = getTeamsByGroup(group);
  const standings = {};
  teams.forEach(t => {
    standings[t.id] = { team: t, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 };
  });
  const groupMatches = liveMatches.filter(m => m.phase==='groups' && m.group===group && m.status==='finished');
  groupMatches.forEach(m => {
    const h = standings[m.homeTeam];
    const a = standings[m.awayTeam];
    if (!h || !a) return;
    h.pj++; a.pj++;
    h.gf += m.homeScore; h.gc += m.awayScore;
    a.gf += m.awayScore; a.gc += m.homeScore;
    if (m.homeScore > m.awayScore) { h.pg++; h.pts+=3; a.pp++; }
    else if (m.homeScore < m.awayScore) { a.pg++; a.pts+=3; h.pp++; }
    else { h.pe++; a.pe++; h.pts++; a.pts++; }
  });
  return Object.values(standings).sort((a,b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.gc;
    const gdB = b.gf - b.gc;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });
};

const Groups = ({ currentUser, onSaveGroupPrediction, users, matches, groupsForceOpen }) => {
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [activeTab, setActiveTab] = useState('standings');
  const [selections, setSelections] = useState({});

  const liveMatches = matches || allMatchesData;

 const isGroupOpen = (group) => {
  if (groupsForceOpen) return true;
  const gMatches = liveMatches.filter(m => m.phase==='groups' && m.group===group);
  if (!gMatches.length) return false;
  const firstDate = new Date(Math.min(...gMatches.map(m => new Date(m.date))));
  return new Date() < firstDate;
};

  const standings = useMemo(() => calcStandings(selectedGroup, liveMatches), [selectedGroup, liveMatches]);

  const myPred = currentUser.groupPredictions?.[selectedGroup];
  const localSel = selections[selectedGroup] || {};
  const groupTeams = useMemo(() => getTeamsByGroup(selectedGroup), [selectedGroup]);

  const handleSelect = (teamId, position) => {
    const current = selections[selectedGroup] || {};
    const newSel = { ...current };
    if (newSel[position] === teamId) { delete newSel[position]; }
    else { if (newSel.first === teamId) delete newSel.first; if (newSel.second === teamId) delete newSel.second; newSel[position] = teamId; }
    setSelections(prev => ({ ...prev, [selectedGroup]: newSel }));
  };

  const handleSave = () => {
    const sel = selections[selectedGroup] || {};
    if (!sel.first || !sel.second) { alert('Selecciona el 1° y 2° clasificado'); return; }
    onSaveGroupPrediction(currentUser.id, selectedGroup, sel.first, sel.second);
    alert(`✓ Pronóstico del Grupo ${selectedGroup} guardado`);
  };

  const tabBtn = (id, label) => (
    <button onClick={() => setActiveTab(id)}
      style={{flex:1, padding:'8px', borderRadius:'10px', fontSize:'13px', fontWeight:'500', cursor:'pointer',
        background: activeTab===id ? 'rgba(74,222,128,0.15)' : 'transparent',
        color: activeTab===id ? '#4ade80' : 'rgba(255,255,255,0.5)',
        border: activeTab===id ? '1px solid rgba(74,222,128,0.3)' : '1px solid transparent'}}>
      {label}
    </button>
  );

  return (
    <div>
      <div style={{...card, padding:'12px 16px', marginBottom:'12px'}}>
        <div style={{fontSize:'12px',fontWeight:'700',color:'white',marginBottom:'6px'}}>🏅 Pronóstico de clasificados</div>
        <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
          {[
            {label:'2 equipos en orden exacto', pts:'+10', color:'#fde047'},
            {label:'2 equipos correctos (sin orden)', pts:'+5', color:'#4ade80'},
            {label:'1 equipo correcto', pts:'+2', color:'#93c5fd'},
          ].map(r=>(
            <div key={r.label} style={{display:'flex',justifyContent:'space-between',fontSize:'11px'}}>
              <span style={{color:'rgba(255,255,255,0.45)'}}>{r.label}</span>
              <span style={{fontWeight:'700',color:r.color}}>{r.pts} pts</span>
            </div>
          ))}
        </div>
      </div>

      {groupsForceOpen && (
        <div style={{padding:'10px 14px',borderRadius:'12px',background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',marginBottom:'12px',textAlign:'center'}}>
          <span style={{fontSize:'13px',color:'#4ade80',fontWeight:'600'}}>🔓 Todos los grupos están abiertos para pronosticar</span>
        </div>
      )}

      <div style={{...card, padding:'12px 14px', marginBottom:'12px'}}>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.05em'}}>
          Selecciona un grupo
        </div>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
          {ALL_GROUPS.map(g => {
            const open = isGroupOpen(g);
            const isSelected = selectedGroup === g;
            return (
              <button key={g} onClick={() => setSelectedGroup(g)}
                style={{width:'38px',height:'38px',borderRadius:'10px',fontSize:'13px',fontWeight:'600',cursor:'pointer',position:'relative',
                  background:isSelected?'rgba(74,222,128,0.2)':'rgba(255,255,255,0.04)',
                  border:isSelected?'1px solid rgba(74,222,128,0.5)':'1px solid rgba(255,255,255,0.08)',
                  color:isSelected?'#4ade80':open?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.35)'}}>
                {g}
                {open && <span style={{position:'absolute',top:'-3px',right:'-3px',width:'7px',height:'7px',borderRadius:'50%',background:'#4ade80'}}/>}
              </button>
            );
          })}
        </div>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginTop:'8px',display:'flex',alignItems:'center',gap:'6px'}}>
          <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'#4ade80',display:'inline-block'}}/>
          Abierto para pronosticar
        </div>
      </div>

      <div style={{...card, padding:'6px', marginBottom:'12px', display:'flex', gap:'4px'}}>
        {tabBtn('standings', '📊 Tabla de posiciones')}
        {tabBtn('predict', '🎯 Mi pronóstico')}
      </div>

      {activeTab === 'standings' && (
        <div style={{...card, overflow:'hidden'}}>
          <div style={{padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{fontSize:'14px',fontWeight:'700',color:'white'}}>Grupo {selectedGroup}</span>
            <span style={{fontSize:'11px',color:'rgba(255,255,255,0.35)'}}>
              {liveMatches.filter(m=>m.phase==='groups'&&m.group===selectedGroup&&m.status==='finished').length} / {allMatchesData.filter(m=>m.phase==='groups'&&m.group===selectedGroup).length} partidos
            </span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  {['#','Equipo','PJ','PG','PE','PP','GF','GC','DG','Pts'].map((h,i)=>(
                    <th key={h} style={{padding:'10px 8px',textAlign:i<=1?'left':'center',fontSize:'11px',fontWeight:'600',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.03em',whiteSpace:'nowrap'}}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standings.map((s, idx) => {
                  const isQ = idx < 2;
                  return (
                    <tr key={s.team.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)',background:isQ?'rgba(74,222,128,0.04)':'transparent'}}>
                      <td style={{padding:'10px 8px',textAlign:'left'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                          {isQ && <span style={{width:'3px',height:'24px',borderRadius:'2px',background:'#4ade80',display:'inline-block'}}/>}
                          <span style={{fontSize:'13px',fontWeight:'600',color:isQ?'#4ade80':'rgba(255,255,255,0.4)'}}>{idx+1}</span>
                        </div>
                      </td>
                      <td style={{padding:'10px 8px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <Flag code={s.team.flagCode} size={22}/>
                          <span style={{fontSize:'13px',fontWeight:'500',color:'rgba(255,255,255,0.85)',whiteSpace:'nowrap'}}>{s.team.name}</span>
                        </div>
                      </td>
                      {[s.pj,s.pg,s.pe,s.pp,s.gf,s.gc,s.gf-s.gc].map((val,i)=>(
                        <td key={i} style={{padding:'10px 8px',textAlign:'center',fontSize:'13px',color:'rgba(255,255,255,0.6)'}}>
                          {i===6&&val>0?`+${val}`:val}
                        </td>
                      ))}
                      <td style={{padding:'10px 8px',textAlign:'center'}}>
                        <span style={{fontSize:'14px',fontWeight:'800',color:isQ?'#4ade80':'white'}}>{s.pts}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{padding:'10px 16px',fontSize:'11px',color:'rgba(255,255,255,0.3)',borderTop:'1px solid rgba(255,255,255,0.05)'}}>
            <span style={{color:'#4ade80'}}>█</span> Clasifican a octavos · PJ=Jugados · DG=Diferencia de goles
          </div>
        </div>
      )}

      {activeTab === 'predict' && (
        <div style={{...card, padding:'18px 20px'}}>
          {!isGroupOpen(selectedGroup) ? (
            <div style={{textAlign:'center',padding:'20px'}}>
              <div style={{fontSize:'28px',marginBottom:'10px'}}>🔒</div>
              <div style={{fontSize:'14px',fontWeight:'600',color:'rgba(255,255,255,0.6)',marginBottom:'6px'}}>
                Grupo {selectedGroup} cerrado
              </div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)'}}>Ya comenzaron los partidos de este grupo</div>
              {myPred && (
                <div style={{marginTop:'16px',padding:'12px',borderRadius:'12px',background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.2)'}}>
                  <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'8px'}}>Tu pronóstico fue:</div>
                  <div style={{display:'flex',justifyContent:'center',gap:'20px'}}>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:'10px',color:'#4ade80',fontWeight:'700',marginBottom:'4px'}}>1°</div>
                      <Flag code={getTeamById(myPred.first)?.flagCode} size={28}/>
                      <div style={{fontSize:'11px',color:'rgba(255,255,255,0.7)',marginTop:'4px'}}>{getTeamById(myPred.first)?.name}</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:'10px',color:'#93c5fd',fontWeight:'700',marginBottom:'4px'}}>2°</div>
                      <Flag code={getTeamById(myPred.second)?.flagCode} size={28}/>
                      <div style={{fontSize:'11px',color:'rgba(255,255,255,0.7)',marginTop:'4px'}}>{getTeamById(myPred.second)?.name}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{marginBottom:'16px'}}>
                <div style={{fontSize:'15px',fontWeight:'700',color:'white',marginBottom:'4px'}}>¿Quién clasifica del Grupo {selectedGroup}?</div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>Selecciona 1° y 2° clasificado</div>
              </div>

              {myPred && !selections[selectedGroup] && (
                <div style={{padding:'12px',borderRadius:'10px',background:'rgba(74,222,128,0.08)',border:'1px solid rgba(74,222,128,0.2)',marginBottom:'14px'}}>
                  <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>✓ Pronóstico guardado</div>
                  <div style={{display:'flex',gap:'16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <span style={{fontSize:'11px',color:'#4ade80',fontWeight:'700'}}>1°</span>
                      <Flag code={getTeamById(myPred.first)?.flagCode} size={20}/>
                      <span style={{fontSize:'12px',color:'white'}}>{getTeamById(myPred.first)?.name}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <span style={{fontSize:'11px',color:'#93c5fd',fontWeight:'700'}}>2°</span>
                      <Flag code={getTeamById(myPred.second)?.flagCode} size={20}/>
                      <span style={{fontSize:'12px',color:'white'}}>{getTeamById(myPred.second)?.name}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelections(prev=>({...prev,[selectedGroup]:{first:myPred.first,second:myPred.second}}))}
                    style={{fontSize:'12px',color:'#93c5fd',background:'none',border:'none',cursor:'pointer',marginTop:'6px'}}>
                    Modificar
                  </button>
                </div>
              )}

              <div style={{marginBottom:'12px'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 72px 72px',gap:'6px',marginBottom:'6px',padding:'0 4px'}}>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)'}}>Equipo</div>
                  <div style={{fontSize:'11px',color:'#4ade80',textAlign:'center',fontWeight:'700'}}>1°</div>
                  <div style={{fontSize:'11px',color:'#93c5fd',textAlign:'center',fontWeight:'700'}}>2°</div>
                </div>
                {groupTeams.map(team => {
                  const sel = selections[selectedGroup] || {};
                  const isFirst = sel.first === team.id;
                  const isSecond = sel.second === team.id;
                  return (
                    <div key={team.id} style={{display:'grid',gridTemplateColumns:'1fr 72px 72px',gap:'6px',alignItems:'center',padding:'8px 6px',borderRadius:'10px',marginBottom:'3px',
                      background:isFirst?'rgba(74,222,128,0.08)':isSecond?'rgba(59,130,246,0.08)':'rgba(255,255,255,0.02)',
                      border:isFirst?'1px solid rgba(74,222,128,0.2)':isSecond?'1px solid rgba(59,130,246,0.2)':'1px solid transparent'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <Flag code={team.flagCode} size={24}/>
                        <span style={{fontSize:'13px',fontWeight:'500',color:'rgba(255,255,255,0.85)'}}>{team.name}</span>
                      </div>
                      <div style={{textAlign:'center'}}>
                        <button onClick={() => handleSelect(team.id,'first')}
                          style={{width:'34px',height:'34px',borderRadius:'50%',cursor:'pointer',fontSize:'12px',fontWeight:'700',
                            background:isFirst?'rgba(74,222,128,0.3)':'rgba(255,255,255,0.05)',
                            border:isFirst?'2px solid #4ade80':'2px solid rgba(255,255,255,0.1)',
                            color:isFirst?'#4ade80':'rgba(255,255,255,0.4)'}}>
                          {isFirst?'✓':'1°'}
                        </button>
                      </div>
                      <div style={{textAlign:'center'}}>
                        <button onClick={() => handleSelect(team.id,'second')}
                          style={{width:'34px',height:'34px',borderRadius:'50%',cursor:'pointer',fontSize:'12px',fontWeight:'700',
                            background:isSecond?'rgba(59,130,246,0.3)':'rgba(255,255,255,0.05)',
                            border:isSecond?'2px solid #93c5fd':'2px solid rgba(255,255,255,0.1)',
                            color:isSecond?'#93c5fd':'rgba(255,255,255,0.4)'}}>
                          {isSecond?'✓':'2°'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(localSel.first || localSel.second) && (
                <div style={{padding:'10px 12px',borderRadius:'10px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',marginBottom:'12px'}}>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',marginBottom:'6px'}}>Tu selección:</div>
                  <div style={{display:'flex',gap:'16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <span style={{fontSize:'11px',color:'#4ade80',fontWeight:'700'}}>1°</span>
                      {localSel.first?<><Flag code={getTeamById(localSel.first)?.flagCode} size={20}/><span style={{fontSize:'12px',color:'white'}}>{getTeamById(localSel.first)?.name}</span></>:<span style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>—</span>}
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <span style={{fontSize:'11px',color:'#93c5fd',fontWeight:'700'}}>2°</span>
                      {localSel.second?<><Flag code={getTeamById(localSel.second)?.flagCode} size={20}/><span style={{fontSize:'12px',color:'white'}}>{getTeamById(localSel.second)?.name}</span></>:<span style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>—</span>}
                    </div>
                  </div>
                </div>
              )}

              <button onClick={handleSave} disabled={!localSel.first||!localSel.second}
                style={{width:'100%',padding:'12px',borderRadius:'10px',fontWeight:'600',fontSize:'14px',cursor:'pointer',border:'none',
                  background:localSel.first&&localSel.second?'linear-gradient(135deg,#16a34a,#15803d)':'rgba(255,255,255,0.06)',
                  color:localSel.first&&localSel.second?'white':'rgba(255,255,255,0.3)'}}>
                Guardar pronóstico Grupo {selectedGroup}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Groups;