import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTeamById } from '../data/teams';

const card = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px' };

const Flag = ({ code, size = 36 }) => {
  if (!code) return <span style={{fontSize:size*0.7+'px'}}>🏳️</span>;
  return (
    <img src={`https://hatscripts.github.io/circle-flags/flags/${code.toLowerCase()}.svg`}
      width={size} height={size} alt={code}
      style={{borderRadius:'50%',objectFit:'cover'}}
      onError={e=>{e.target.style.display='none';}}/>
  );
};

const toColDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const todayCol = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

const Results = ({ matches, currentUser }) => {
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);

  const finishedMatches = useMemo(() =>
    matches.filter(m => m.status === 'finished')
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [matches]
  );

  // Días disponibles con partidos finalizados
  const availableDays = useMemo(() => {
    const set = new Set(finishedMatches.map(m => toColDate(m.date)));
    return [...set].sort().reverse(); // más reciente primero
  }, [finishedMatches]);

  // Día efectivo
  const effectiveDate = selectedDate || availableDays[0] || null;

  const getMyPrediction = (matchId) => currentUser.predictions?.[matchId];

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

  // Partidos del día seleccionado filtrados
  const matchesForDay = useMemo(() =>
    effectiveDate
      ? finishedMatches.filter(m => toColDate(m.date) === effectiveDate)
      : finishedMatches,
    [finishedMatches, effectiveDate]
  );

  const filteredMatches = useMemo(() => {
    if (filter === 'all') return matchesForDay;
    return matchesForDay.filter(m => {
      const pred = getMyPrediction(m.id);
      return getPredictionResult(m, pred) === filter;
    });
  }, [matchesForDay, filter, currentUser]);

  const formatDayLabel = (dateStr) => {
    if (!dateStr) return '';
    const today = todayCol();
    const yest = new Date(); yest.setDate(yest.getDate()-1);
    const yesterStr = yest.toLocaleDateString('en-CA',{timeZone:'America/Bogota'});
    if (dateStr === today) return 'Hoy';
    if (dateStr === yesterStr) return 'Ayer';
    const [y,m,d] = dateStr.split('-');
    return new Date(+y,+m-1,+d).toLocaleDateString('es-CO',{weekday:'short',day:'numeric',month:'short'});
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('es-CO', {
    hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'America/Bogota'
  });

  // Estadísticas globales (todos los días)
  const myStats = useMemo(() => {
    let exact=0, correct=0, wrong=0;
    finishedMatches.forEach(m => {
      const r = getPredictionResult(m, getMyPrediction(m.id));
      if (r==='exact') exact++;
      else if (r==='correct') correct++;
      else if (r==='wrong') wrong++;
    });
    return { exact, correct, wrong };
  }, [finishedMatches]);

  const resultColors = {
    exact:   { bg:'rgba(253,224,71,0.08)',  border:'rgba(253,224,71,0.2)',   text:'#fde047', label:'🎯 Exacto +3' },
    correct: { bg:'rgba(74,222,128,0.08)',  border:'rgba(74,222,128,0.2)',   text:'#4ade80', label:'✓ Correcto +1' },
    wrong:   { bg:'rgba(248,113,113,0.06)', border:'rgba(248,113,113,0.15)', text:'#f87171', label:'✗ Fallido' },
    none:    { bg:'rgba(255,255,255,0.02)', border:'rgba(255,255,255,0.06)', text:'#94a3b8', label:'Sin pronóstico' },
  };

  // Navegación entre días
  const currentDayIndex = availableDays.indexOf(effectiveDate);
  const prevDay = currentDayIndex < availableDays.length - 1 ? availableDays[currentDayIndex + 1] : null;
  const nextDay = currentDayIndex > 0 ? availableDays[currentDayIndex - 1] : null;

  return (
    <div>
      {/* Stats globales */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginBottom:'14px'}}>
        {[
          {label:'Jugados',    val:finishedMatches.length, color:'#94a3b8'},
          {label:'🎯 Exactos', val:myStats.exact,          color:'#fde047'},
          {label:'✓ Correctos',val:myStats.correct,        color:'#4ade80'},
          {label:'✗ Fallidos', val:myStats.wrong,          color:'#f87171'},
        ].map(s=>(
          <div key={s.label} style={{...card,padding:'12px 8px',textAlign:'center'}}>
            <div style={{fontSize:'22px',fontWeight:'800',color:s.color}}>{s.val}</div>
            <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',marginTop:'3px'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Navegador de días */}
      {availableDays.length > 0 && (
        <div style={{...card,padding:'12px 16px',marginBottom:'12px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
            <button onClick={() => prevDay && setSelectedDate(prevDay)} disabled={!prevDay}
              style={{padding:'6px 10px',borderRadius:'8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:prevDay?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.2)',cursor:prevDay?'pointer':'default'}}>
              <ChevronLeft size={16}/>
            </button>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'16px',fontWeight:'700',color:'white'}}>{formatDayLabel(effectiveDate)}</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',marginTop:'1px'}}>{matchesForDay.length} partido{matchesForDay.length!==1?'s':''}</div>
            </div>
            <button onClick={() => nextDay && setSelectedDate(nextDay)} disabled={!nextDay}
              style={{padding:'6px 10px',borderRadius:'8px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:nextDay?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.2)',cursor:nextDay?'pointer':'default'}}>
              <ChevronRight size={16}/>
            </button>
          </div>

          {/* Pastillas de días */}
          <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'2px'}}>
            {availableDays.map(d=>(
              <button key={d} onClick={()=>setSelectedDate(d)}
                style={{flexShrink:0,padding:'5px 12px',borderRadius:'16px',fontSize:'12px',fontWeight:'500',cursor:'pointer',whiteSpace:'nowrap',
                  background:d===effectiveDate?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.04)',
                  border:d===effectiveDate?'1px solid rgba(74,222,128,0.4)':'1px solid rgba(255,255,255,0.08)',
                  color:d===effectiveDate?'#4ade80':d===todayCol()?'#fbbf24':'rgba(255,255,255,0.45)'}}>
                {formatDayLabel(d)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{...card,padding:'12px 14px',marginBottom:'12px',display:'flex',gap:'6px',overflowX:'auto'}}>
        {[
          {id:'all',     label:'Todos',      count:matchesForDay.length},
          {id:'exact',   label:'🎯 Exacto',  count:matchesForDay.filter(m=>getPredictionResult(m,getMyPrediction(m.id))==='exact').length},
          {id:'correct', label:'✓ Correcto', count:matchesForDay.filter(m=>getPredictionResult(m,getMyPrediction(m.id))==='correct').length},
          {id:'wrong',   label:'✗ Fallido',  count:matchesForDay.filter(m=>getPredictionResult(m,getMyPrediction(m.id))==='wrong').length},
        ].map(p=>(
          <button key={p.id} onClick={()=>setFilter(p.id)}
            style={{padding:'5px 12px',borderRadius:'16px',fontSize:'12px',fontWeight:'500',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,
              background:filter===p.id?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.04)',
              border:filter===p.id?'1px solid rgba(74,222,128,0.4)':'1px solid rgba(255,255,255,0.08)',
              color:filter===p.id?'#4ade80':'rgba(255,255,255,0.45)'}}>
            {p.label} <span style={{opacity:0.6}}>({p.count})</span>
          </button>
        ))}
      </div>

      {/* Lista de partidos */}
      <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
        {filteredMatches.map(match=>{
          const homeTeam = getTeamById(match.homeTeam);
          const awayTeam = getTeamById(match.awayTeam);
          const myPred   = getMyPrediction(match.id);
          const predResult = getPredictionResult(match, myPred);
          const rc = resultColors[predResult];
          const winner = match.homeScore > match.awayScore ? homeTeam?.name
            : match.homeScore < match.awayScore ? awayTeam?.name : 'Empate';

          return (
            <div key={match.id} style={{background:rc.bg,border:`1px solid ${rc.border}`,borderRadius:'14px',padding:'16px 18px',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:rc.border}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                <span style={{fontSize:'11px',color:'rgba(255,255,255,0.35)'}}>{formatDate(match.date)}</span>
                <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                  {match.group&&<span style={{fontSize:'10px',padding:'1px 6px',borderRadius:'4px',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.3)'}}>Grupo {match.group}</span>}
                  <span style={{fontSize:'11px',fontWeight:'600',color:rc.text}}>{rc.label}</span>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:'12px',marginBottom:myPred?'12px':0}}>
                <div style={{textAlign:'center'}}>
                  <div style={{display:'flex',justifyContent:'center',marginBottom:'6px'}}>
                    <Flag code={homeTeam?.flagCode} size={36}/>
                  </div>
                  <div style={{fontSize:'12px',fontWeight:'600',color:match.homeScore>match.awayScore?'white':'rgba(255,255,255,0.5)'}}>{homeTeam?.name||'TBD'}</div>
                </div>
                <div style={{textAlign:'center',minWidth:'80px'}}>
                  <div style={{fontSize:'28px',fontWeight:'800',color:'white',letterSpacing:'-1px'}}>
                    {match.homeScore} <span style={{color:'rgba(255,255,255,0.3)'}}>-</span> {match.awayScore}
                  </div>
                  <div style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',marginTop:'2px'}}>{winner}</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{display:'flex',justifyContent:'center',marginBottom:'6px'}}>
                    <Flag code={awayTeam?.flagCode} size={36}/>
                  </div>
                  <div style={{fontSize:'12px',fontWeight:'600',color:match.awayScore>match.homeScore?'white':'rgba(255,255,255,0.5)'}}>{awayTeam?.name||'TBD'}</div>
                </div>
              </div>
              {myPred && (
                <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>Tu pronóstico:</span>
                  <span style={{fontSize:'14px',fontWeight:'700',color:rc.text}}>
                    {myPred.homeScore!==undefined&&myPred.awayScore!==undefined
                      ? `${myPred.homeScore} - ${myPred.awayScore}`
                      : myPred.result==='home'?`Gana ${homeTeam?.name}`
                      : myPred.result==='away'?`Gana ${awayTeam?.name}`
                      : 'Empate'}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {filteredMatches.length===0&&(
          <div style={{...card,padding:'48px',textAlign:'center'}}>
            <div style={{fontSize:'32px',marginBottom:'12px'}}>🏁</div>
            <div style={{fontSize:'15px',color:'rgba(255,255,255,0.4)'}}>
              {finishedMatches.length===0?'Aún no hay partidos finalizados':'No hay partidos con ese filtro'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;