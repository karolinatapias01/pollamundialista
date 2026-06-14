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

const Home = ({ users, currentUser, matches, onNavigate }) => {
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
    return canPredict && !currentUser.predictions?.[m.id] && m.status !== 'finished';
  });

  // Grupos abiertos sin pronosticar
  const pendingGroups = useMemo(() => {
    const allGroups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    return allGroups.filter(g => {
      const firstMatch = matches
        .filter(m => m.phase==='groups' && m.group===g)
        .sort((a,b) => new Date(a.date)-new Date(b.date))[0];
      if (!firstMatch) return false;
      const isOpen = new Date() < new Date(firstMatch.date);
      const hasPred = currentUser.groupPredictions?.[g];
      return isOpen && !hasPred;
    });
  }, [matches, currentUser]);

  const s = (key) => currentUser?.stats?.[key] ?? 0;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>

      {/* Bienvenida */}
      <div style={{...card, padding:'20px 22px', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:'linear-gradient(90deg,#16a34a,#4ade80)'}}/>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
          <div style={{fontSize:'36px'}}>{currentUser.avatar?.length<=2?currentUser.avatar:'👤'}</div>
          <div>
            <div style={{fontSize:'18px',fontWeight:'800',color:'white'}}>
              ¡Hola, {currentUser.nickname||currentUser.name}!
            </div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.45)',marginTop:'2px'}}>
              Mundial 2026 · {matches.filter(m=>m.status==='finished').length} partidos jugados
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px'}}>
          {[
            {label:'Posición', val:myPosition>0?`#${myPosition}`:'-', color:'#fbbf24', icon:'🏅'},
            {label:'Puntos',   val:currentUser.points||0,             color:'#4ade80', icon:'⭐'},
            {label:'Aciertos', val:s('correctPredictions'),           color:'#60a5fa', icon:'✓'},
            {label:'Exactos',  val:s('exactScores'),                  color:'#fde047', icon:'🎯'},
          ].map(stat=>(
            <div key={stat.label} style={{background:'rgba(255,255,255,0.05)',borderRadius:'12px',padding:'12px 8px',textAlign:'center'}}>
              <div style={{fontSize:'8px',marginBottom:'4px'}}>{stat.icon}</div>
              <div style={{fontSize:'20px',fontWeight:'800',color:stat.color}}>{stat.val}</div>
              <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',marginTop:'2px'}}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

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
            <button onClick={()=>onNavigate('matches')}
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
            {!currentUser.predictions?.[nextMatch.id] && (
              <button onClick={()=>onNavigate('matches')}
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
              const hasPred = currentUser.predictions?.[m.id];
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
                <span style={{fontSize:'20px'}}>{currentUser.avatar?.length<=2?currentUser.avatar:'👤'}</span>
                <span style={{fontSize:'13px',fontWeight:'500',color:'#4ade80',flex:1}}>{currentUser.name}{currentUser.nickname?` "${currentUser.nickname}"`:''} <span style={{fontSize:'10px'}}>tú</span></span>
                <span style={{fontSize:'16px',fontWeight:'800',color:'#4ade80'}}>{currentUser.points||0}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;