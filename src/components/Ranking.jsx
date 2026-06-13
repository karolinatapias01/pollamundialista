import React from 'react';
import { Trophy, Target, Zap, Award, TrendingUp } from 'lucide-react';
import { getTeamById } from '../data/teams';

const card = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px' };

const Flag = ({ code, size = 32 }) => {
  if (!code) return <span style={{fontSize:size*0.8+'px'}}>🏳️</span>;
  return (
    <img src={`https://hatscripts.github.io/circle-flags/flags/${code.toLowerCase()}.svg`}
      width={size} height={size} alt={code}
      style={{borderRadius:'50%',objectFit:'cover'}}
      onError={e=>{e.target.style.display='none';}}/>
  );
};

const Avatar = ({ avatar, size = 32 }) => {
  const team = getTeamById(avatar);
  if (team?.flagCode) return <Flag code={team.flagCode} size={size}/>;
  if (avatar) return <span style={{fontSize:size*0.8+'px'}}>{avatar}</span>;
  return <span style={{fontSize:size*0.8+'px'}}>👤</span>;
};

// Helper seguro para stats
const s = (user, key) => user?.stats?.[key] ?? 0;

const Ranking = ({ users, currentUser }) => {
  const sortedUsers = [...users].sort((a,b) => (b.points||0) - (a.points||0));

  const getAccuracy = (user) => {
    const correct = s(user,'correctPredictions');
    const incorrect = s(user,'incorrectPredictions');
    const total = correct + incorrect;
    return total === 0 ? 0 : ((correct / total) * 100).toFixed(1);
  };

  const podiumColors = [
    {bg:'rgba(250,204,21,0.12)',border:'rgba(250,204,21,0.3)',text:'#fde047',medal:'🥇'},
    {bg:'rgba(148,163,184,0.1)',border:'rgba(148,163,184,0.25)',text:'#cbd5e1',medal:'🥈'},
    {bg:'rgba(234,88,12,0.1)',border:'rgba(234,88,12,0.25)',text:'#fb923c',medal:'🥉'},
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

      {/* Podio */}
      {sortedUsers.length >= 3 && (
        <div style={{...card,padding:'24px',overflow:'hidden',position:'relative'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:'linear-gradient(90deg,#fbbf24,#f59e0b)'}}/>
          <div style={{textAlign:'center',marginBottom:'20px'}}>
            <h2 style={{fontSize:'16px',fontWeight:'700',color:'rgba(255,255,255,0.9)',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
              <Trophy size={18} style={{color:'#fbbf24'}}/> Podio
            </h2>
          </div>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'center',gap:'12px'}}>
            {[1,0,2].map((pos) => {
              const user = sortedUsers[pos];
              if (!user) return null;
              const c = podiumColors[pos];
              const isFirst = pos === 0;
              return (
                <div key={pos} style={{flex:1,maxWidth:isFirst?'150px':'130px',textAlign:'center',marginBottom:isFirst?'8px':0}}>
                  <div style={{padding:isFirst?'20px 14px':'16px 12px',borderRadius:isFirst?'16px':'14px',background:c.bg,border:`${isFirst?'2px':'1px'} solid ${c.border}`,marginBottom:'6px',position:'relative'}}>
                    {isFirst && <div style={{position:'absolute',top:'-10px',left:'50%',transform:'translateX(-50%)',fontSize:'20px'}}>👑</div>}
                    <div style={{display:'flex',justifyContent:'center',marginBottom:'8px',marginTop:isFirst?'4px':0}}>
                      <Avatar avatar={user.avatar} size={isFirst?36:28}/>
                    </div>
                    <div style={{fontSize:isFirst?'13px':'12px',fontWeight:'700',color:'white',marginBottom:'4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {user.nickname||user.name}
                    </div>
                    <div style={{fontSize:isFirst?'28px':'22px',fontWeight:'800',color:c.text}}>{user.points||0}</div>
                    <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>pts</div>
                  </div>
                  <div style={{fontSize:isFirst?'32px':'28px'}}>{c.medal}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabla completa */}
      <div style={{...card,overflow:'hidden'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',gap:'8px'}}>
          <TrendingUp size={18} style={{color:'#4ade80'}}/>
          <h2 style={{fontSize:'15px',fontWeight:'700',color:'white'}}>Clasificación general</h2>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                {['Pos','Jugador','Pts','✓/✗','🎯','Racha','%'].map((h,i) => (
                  <th key={h} style={{padding:'10px 14px',textAlign:i<=1?'left':'center',fontSize:'11px',fontWeight:'600',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user, idx) => {
                const isMe = user.id === currentUser.id;
                const medals = ['🥇','🥈','🥉'];
                return (
                  <tr key={user.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)',background:isMe?'rgba(74,222,128,0.05)':'transparent',borderLeft:isMe?'3px solid #4ade80':'3px solid transparent'}}>
                    <td style={{padding:'12px 14px',width:'48px'}}>
                      {idx < 3
                        ? <span style={{fontSize:'20px'}}>{medals[idx]}</span>
                        : <span style={{fontSize:'14px',fontWeight:'600',color:'rgba(255,255,255,0.35)'}}>{idx+1}</span>}
                    </td>
                    <td style={{padding:'12px 14px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <Avatar avatar={user.avatar} size={28}/>
                        <div>
                          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                            <span style={{fontSize:'14px',fontWeight:'600',color:'rgba(255,255,255,0.9)'}}>{user.nickname||user.name}</span>
                            {isMe && <span style={{fontSize:'10px',background:'rgba(74,222,128,0.2)',color:'#4ade80',padding:'1px 6px',borderRadius:'4px'}}>tú</span>}
                            {user.isAdmin && <span style={{fontSize:'10px',background:'rgba(168,85,247,0.2)',color:'#c084fc',padding:'1px 6px',borderRadius:'4px'}}>admin</span>}
                          </div>
                          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.3)',marginTop:'1px'}}>{s(user,'totalPredictions')} pronósticos</div>
                        </div>
                      </div>
                    </td>
                    <td style={{padding:'12px 14px',textAlign:'center'}}>
                      <span style={{fontSize:'20px',fontWeight:'800',color:'#4ade80'}}>{user.points||0}</span>
                    </td>
                    <td style={{padding:'12px 14px',textAlign:'center'}}>
                      <span style={{fontSize:'13px',color:'#86efac'}}>{s(user,'correctPredictions')}</span>
                      <span style={{color:'rgba(255,255,255,0.2)',margin:'0 3px'}}>/</span>
                      <span style={{fontSize:'13px',color:'#f87171'}}>{s(user,'incorrectPredictions')}</span>
                    </td>
                    <td style={{padding:'12px 14px',textAlign:'center'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'4px'}}>
                        <Target size={13} style={{color:'#fbbf24'}}/>
                        <span style={{fontSize:'13px',fontWeight:'600',color:'rgba(255,255,255,0.8)'}}>{s(user,'exactScores')}</span>
                      </div>
                    </td>
                    <td style={{padding:'12px 14px',textAlign:'center'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'3px'}}>
                        <Zap size={13} style={{color:'#f97316'}}/>
                        <span style={{fontSize:'13px',fontWeight:'600',color:'rgba(255,255,255,0.8)'}}>{s(user,'currentStreak')}</span>
                      </div>
                    </td>
                    <td style={{padding:'12px 14px',textAlign:'center'}}>
                      <span style={{fontSize:'13px',color:'rgba(255,255,255,0.5)'}}>{getAccuracy(user)}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mis estadísticas */}
      <div style={{...card,padding:'20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px'}}>
          <Award size={18} style={{color:'#a78bfa'}}/>
          <h3 style={{fontSize:'15px',fontWeight:'700',color:'white'}}>Tus estadísticas</h3>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'10px'}}>
          {[
            {label:'Puntos',       val: currentUser.points||0,                        color:'#4ade80'},
            {label:'Aciertos',     val: s(currentUser,'correctPredictions'),           color:'#60a5fa'},
            {label:'Exactos 🎯',   val: s(currentUser,'exactScores'),                 color:'#fbbf24'},
            {label:'Mejor racha',  val: s(currentUser,'maxStreak'),                   color:'#f97316'},
          ].map(stat => (
            <div key={stat.label} style={{padding:'16px',borderRadius:'12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',textAlign:'center'}}>
              <div style={{fontSize:'28px',fontWeight:'800',color:stat.color}}>{stat.val}</div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginTop:'4px'}}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Ranking;