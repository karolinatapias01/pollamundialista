import React, { useState, useEffect } from 'react';

const STEPS = [
  {
    emoji: '⚽',
    title: '¡Bienvenido a PollaMundialista!',
    desc: 'Aquí puedes pronosticar los partidos del Mundial 2026 y competir con tus amigos por el primer lugar.',
    detail: 'Cada acierto suma puntos. ¡El que más acierte gana!',
    color: '#4ade80'
  },
  {
    emoji: '🎯',
    title: 'Cómo pronosticar',
    desc: 'Ve a la pestaña ⚽ Partidos, elige quién gana o empata, y si quieres más puntos ingresa el marcador exacto.',
    detail: 'Los pronósticos cierran 10 minutos antes de cada partido.',
    color: '#93c5fd'
  },
  {
    emoji: '⭐',
    title: 'Sistema de puntos',
    desc: null,
    points: [
      { label: 'Resultado correcto (G/E/P)', pts: '+1 pt', color: '#4ade80' },
      { label: 'Marcador exacto', pts: '+3 pts', color: '#fde047' },
      { label: 'Clasificados de grupo (sin orden)', pts: '+5 pts', color: '#93c5fd' },
      { label: 'Clasificados de grupo (orden exacto)', pts: '+10 pts', color: '#f97316' },
      { label: 'Campeón del Mundial', pts: '+15 pts', color: '#c084fc' },
    ],
    color: '#fde047'
  },
  {
    emoji: '📊',
    title: 'Pronóstico de grupos',
    desc: 'En la pestaña 📊 Grupos puedes ver la tabla de posiciones de cada grupo y pronosticar quién queda 1° y 2°.',
    detail: 'Solo puedes pronosticar antes de que empiece el primer partido del grupo.',
    color: '#f97316'
  },
  {
    emoji: '📱',
    title: 'Instala la app',
    desc: 'Puedes instalar PollaMundialista en tu celular como una app real.',
    steps: [
      '📱 En iPhone: toca el botón compartir y "Agregar a inicio"',
      '🤖 En Android: toca los 3 puntos del navegador y "Instalar app"',
    ],
    color: '#c084fc'
  },
  {
    emoji: '🏆',
    title: '¡Ya estás listo!',
    desc: '¡Que empiece la competencia! Revisa el ranking para ver cómo vas vs tus amigos.',
    detail: 'Las noticias del Mundial están en la pestaña 📰. ¡Mucha suerte!',
    color: '#4ade80'
  },
];

const Tutorial = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.85)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'20px'
    }}>
      <div style={{
        background:'#0f1a2e', border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:'24px', padding:'32px 28px', maxWidth:'420px', width:'100%',
        position:'relative', overflow:'hidden'
      }}>
        {/* Barra de progreso */}
        <div style={{display:'flex', gap:'4px', marginBottom:'28px'}}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              flex:1, height:'3px', borderRadius:'2px',
              background: i <= step ? current.color : 'rgba(255,255,255,0.1)',
              transition:'background 0.3s'
            }}/>
          ))}
        </div>

        {/* Emoji */}
        <div style={{fontSize:'56px', textAlign:'center', marginBottom:'16px'}}>
          {current.emoji}
        </div>

        {/* Título */}
        <div style={{fontSize:'20px', fontWeight:'800', color:'white', textAlign:'center', marginBottom:'14px'}}>
          {current.title}
        </div>

        {/* Contenido */}
        {current.desc && (
          <div style={{fontSize:'14px', color:'rgba(255,255,255,0.7)', textAlign:'center', lineHeight:'1.6', marginBottom:'12px'}}>
            {current.desc}
          </div>
        )}

        {current.detail && (
          <div style={{fontSize:'13px', color:'rgba(255,255,255,0.45)', textAlign:'center', lineHeight:'1.5', marginBottom:'16px'}}>
            {current.detail}
          </div>
        )}

        {/* Puntos */}
        {current.points && (
          <div style={{display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px'}}>
            {current.points.map((p, i) => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'8px 12px', borderRadius:'10px', background:'rgba(255,255,255,0.04)'}}>
                <span style={{fontSize:'12px', color:'rgba(255,255,255,0.6)'}}>{p.label}</span>
                <span style={{fontSize:'13px', fontWeight:'700', color:p.color}}>{p.pts}</span>
              </div>
            ))}
          </div>
        )}

        {/* Pasos de instalación */}
        {current.steps && (
          <div style={{display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px'}}>
            {current.steps.map((s, i) => (
              <div key={i} style={{fontSize:'13px', color:'rgba(255,255,255,0.65)',
                padding:'10px 14px', borderRadius:'10px', background:'rgba(255,255,255,0.05)',
                lineHeight:'1.5'}}>
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Botones */}
        <div style={{display:'flex', gap:'10px', marginTop:'8px'}}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{flex:1, padding:'12px', borderRadius:'12px', fontSize:'14px', fontWeight:'600',
                background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                color:'rgba(255,255,255,0.6)', cursor:'pointer'}}>
              ← Atrás
            </button>
          )}
          <button onClick={() => isLast ? onFinish() : setStep(s => s + 1)}
            style={{flex:2, padding:'12px', borderRadius:'12px', fontSize:'14px', fontWeight:'700',
              background:`linear-gradient(135deg, ${current.color}, ${current.color}99)`,
              border:'none', color:'#0a0e1a', cursor:'pointer'}}>
            {isLast ? '¡Empezar! 🚀' : 'Siguiente →'}
          </button>
        </div>

        {/* Saltar */}
        {!isLast && (
          <button onClick={onFinish}
            style={{width:'100%', marginTop:'12px', fontSize:'12px', color:'rgba(255,255,255,0.3)',
              background:'none', border:'none', cursor:'pointer'}}>
            Saltar tutorial
          </button>
        )}
      </div>
    </div>
  );
};

export default Tutorial;