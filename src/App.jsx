import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import Auth from './components/Auth';
import Home from './components/Home';
import Matches from './components/Matches';
import Ranking from './components/Ranking';
import Results from './components/Results';
import History from './components/History';
import Groups from './components/Groups';
import News from './components/News';
import AdminPanel from './components/AdminPanel';
import Tutorial from './components/Tutorial';
import useAppState from './hooks/useAppState';
import { startAutoSync } from './syncService';
import { startNotifications } from './notifications';

const PendingScreen = ({ currentUser, onLogout }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const registered = parseInt(currentUser.id);
    const elapsed = Math.floor((Date.now() - registered) / 1000);
    return Math.max(0, 300 - elapsed);
  });
  const [expired, setExpired] = useState(() => {
    const registered = parseInt(currentUser.id);
    const elapsed = Math.floor((Date.now() - registered) / 1000);
    return elapsed >= 300;
  });

  useEffect(() => {
    if (expired) return;
    if (timeLeft <= 0) { setExpired(true); return; }
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setExpired(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [expired]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (expired) {
    return (
      <div style={{ minHeight:'100vh', background:'#0a0e1a', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
        <div style={{ textAlign:'center', maxWidth:'380px' }}>
          <div style={{ fontSize:'56px', marginBottom:'20px' }}>⏳</div>
          <div style={{ fontSize:'22px', fontWeight:'800', color:'white', marginBottom:'12px' }}>Tiempo de prueba terminado</div>
          <div style={{ fontSize:'15px', color:'rgba(255,255,255,0.6)', lineHeight:'1.6', marginBottom:'24px' }}>
            Espero que te haya gustado la app. Para activar tu cuenta y empezar a pronosticar avísale al administrador que ya pagaste.
          </div>
          <div style={{ padding:'16px', borderRadius:'14px', background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.2)', marginBottom:'24px' }}>
            <div style={{ fontSize:'13px', color:'#fb923c', fontWeight:'600', marginBottom:'4px' }}>Tu nombre registrado:</div>
            <div style={{ fontSize:'15px', color:'white', fontWeight:'700' }}>{currentUser.name}</div>
          </div>
          <button onClick={onLogout}
            style={{ padding:'12px 32px', background:'linear-gradient(135deg,#16a34a,#15803d)', border:'none', color:'white', fontSize:'14px', fontWeight:'600', borderRadius:'12px', cursor:'pointer' }}>
            Salir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:1000, background:'rgba(249,115,22,0.95)', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ fontSize:'13px', color:'white', fontWeight:'500' }}>
        ⏱️ Modo prueba — No puedes pronosticar aún
      </div>
      <div style={{ fontSize:'15px', fontWeight:'800', color:'white', background:'rgba(0,0,0,0.2)', padding:'4px 12px', borderRadius:'8px' }}>
        {minutes}:{seconds.toString().padStart(2,'0')}
      </div>
    </div>
  );
};

function App() {
  const {
    currentUser, users, matches, reactions, loading,
    setCurrentUser, registerUser, makePrediction,
    saveGroupPrediction, saveRound16Prediction,
    updateMatchResult, updateRound16Results,
    updateGroupResult, updateChampion,
    recalculateAllPoints,
    addReaction, removeReaction, deleteUser,
    approveUser, rejectUser, resetAllUsers,
    openAllGroups, closeAllGroups, groupsForceOpen
  } = useAppState();

  const [activeTab,    setActiveTab]    = useState('home');
  const [matchesPhase, setMatchesPhase] = useState('groups');
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem('polla_tutorial_done');
  });
  const [trialExpired, setTrialExpired] = useState(false);
  const [showRules,    setShowRules]    = useState(false);

  const handleNavigate = (tab, phase) => {
    setActiveTab(tab);
    if (phase) setMatchesPhase(phase);
  };

  const handleFinishTutorial = () => {
    localStorage.setItem('polla_tutorial_done', 'true');
    setShowTutorial(false);
  };

  useEffect(() => {
    if (currentUser) setActiveTab('home');
  }, [currentUser?.id]);

  useEffect(() => {
    const interval = startAutoSync();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const interval = startNotifications(matches, currentUser);
    return () => clearInterval(interval);
  }, [matches, currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.approved || currentUser.isAdmin) return;
    const registered = parseInt(currentUser.id);
    const elapsed = Math.floor((Date.now() - registered) / 1000);
    if (elapsed >= 300) { setTrialExpired(true); return; }
    const remaining = 300 - elapsed;
    const timeout = setTimeout(() => setTrialExpired(true), remaining * 1000);
    return () => clearTimeout(timeout);
  }, [currentUser]);

  if (!currentUser) {
    return <Auth onLogin={setCurrentUser} onRegister={registerUser} users={users} />;
  }

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#0a0e1a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'40px', marginBottom:'16px' }}>⚽</div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'15px' }}>Cargando PollaMundialista...</div>
        </div>
      </div>
    );
  }

  if (trialExpired && !currentUser.approved && !currentUser.isAdmin) {
    return (
      <div style={{ minHeight:'100vh', background:'#0a0e1a', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
        <div style={{ textAlign:'center', maxWidth:'380px' }}>
          <div style={{ fontSize:'56px', marginBottom:'20px' }}>⏳</div>
          <div style={{ fontSize:'22px', fontWeight:'800', color:'white', marginBottom:'12px' }}>Tiempo de prueba terminado</div>
          <div style={{ fontSize:'15px', color:'rgba(255,255,255,0.6)', lineHeight:'1.6', marginBottom:'24px' }}>
            Espero que te haya gustado la app. Para activar tu cuenta avísale al administrador que ya pagaste.
          </div>
          <div style={{ padding:'16px', borderRadius:'14px', background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.2)', marginBottom:'24px' }}>
            <div style={{ fontSize:'13px', color:'#fb923c', fontWeight:'600', marginBottom:'4px' }}>Tu nombre registrado:</div>
            <div style={{ fontSize:'15px', color:'white', fontWeight:'700' }}>{currentUser.name}</div>
          </div>
          <button onClick={() => setCurrentUser(null)}
            style={{ padding:'12px 32px', background:'linear-gradient(135deg,#16a34a,#15803d)', border:'none', color:'white', fontSize:'14px', fontWeight:'600', borderRadius:'12px', cursor:'pointer' }}>
            Salir
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id:'home',    label:'Inicio',     emoji:'🏠' },
    { id:'matches', label:'Partidos',   emoji:'⚽' },
    { id:'groups',  label:'Grupos',     emoji:'📊' },
    { id:'results', label:'Resultados', emoji:'🏁' },
    { id:'ranking', label:'Ranking',    emoji:'🏆' },
    { id:'news',    label:'Noticias',   emoji:'📰' },
    { id:'history', label:'Historial',  emoji:'📋' },
    ...(currentUser.isAdmin ? [{ id:'admin', label:'Admin', emoji:'👑' }] : [])
  ];

  const bottomTabs = [
    { id:'home',    label:'Inicio',     emoji:'🏠' },
    { id:'matches', label:'Partidos',   emoji:'⚽' },
    { id:'results', label:'Resultados', emoji:'🏁' },
    { id:'ranking', label:'Ranking',    emoji:'🏆' },
    { id:'news',    label:'Noticias',   emoji:'📰' },
  ];

  const isPending = !currentUser.approved && !currentUser.isAdmin;

  return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a' }}>

      {isPending && !trialExpired && (
        <PendingScreen currentUser={currentUser} onLogout={() => setCurrentUser(null)}/>
      )}

      {showTutorial && currentUser && <Tutorial onFinish={handleFinishTutorial}/>}

      <header style={{ background:'linear-gradient(135deg,#0f1f0f 0%,#0a1628 50%,#1a0a28 100%)', borderBottom:'1px solid rgba(255,255,255,0.08)', position:'sticky', top: isPending ? '44px' : 0, zIndex:50 }}>
        <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 16px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:'64px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'36px', height:'36px', background:'linear-gradient(135deg,#16a34a,#15803d)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>⚽</div>
              <div>
                <span style={{ fontWeight:'800', color:'white', fontSize:'17px', letterSpacing:'-0.5px' }}>Polla</span>
                <span style={{ fontWeight:'800', fontSize:'17px', color:'#4ade80', letterSpacing:'-0.5px' }}>Mundialista</span>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', lineHeight:1 }}>Mundial 2026</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px' }}>
                <span style={{ fontSize:'18px' }}>{currentUser.avatar?.length<=2?currentUser.avatar:'👤'}</span>
                <div>
                  <p style={{ fontSize:'12px', fontWeight:'600', color:'white', lineHeight:1 }}>{currentUser.nickname||currentUser.name}</p>
                  <p style={{ fontSize:'11px', color: isPending?'#fb923c':'#4ade80', marginTop:'2px' }}>{isPending?'⏳ Pendiente':currentUser.points+' pts'}</p>
                </div>
              </div>
              <button onClick={()=>{ if(confirm('¿Salir?')) setCurrentUser(null); }}
                style={{ padding:'8px', borderRadius:'8px', color:'rgba(255,255,255,0.4)', background:'none', border:'none', cursor:'pointer' }}>
                <LogOut size={17}/>
              </button>
              <button onClick={()=>setMenuOpen(!menuOpen)}
                style={{ padding:'8px', color:'rgba(255,255,255,0.7)', background:'none', border:'none', cursor:'pointer' }}>
                {menuOpen?<X size={22}/>:<Menu size={22}/>}
              </button>
            </div>
          </div>
          {menuOpen && (
            <div style={{ paddingBottom:'12px', borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:'12px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'4px', marginBottom:'8px' }}>
                {tabs.map(tab=>(
                  <button key={tab.id} onClick={()=>{ setActiveTab(tab.id); setMenuOpen(false); }}
                    style={{ textAlign:'left', padding:'10px 14px', borderRadius:'10px', fontSize:'14px', fontWeight:'500', cursor:'pointer',
                      background:activeTab===tab.id?'rgba(74,222,128,0.12)':'transparent',
                      color:activeTab===tab.id?'#4ade80':'rgba(255,255,255,0.65)', border:'none' }}>
                    {tab.emoji} {tab.label}
                  </button>
                ))}
              </div>
              <button onClick={()=>{ if(confirm('¿Salir?')) setCurrentUser(null); }}
                style={{ width:'100%', textAlign:'left', padding:'10px 14px', fontSize:'14px', color:'#f87171', background:'none', border:'none', cursor:'pointer' }}>
                Salir
              </button>
              <button onClick={()=>{ setShowTutorial(true); setMenuOpen(false); }}
                style={{ width:'100%', textAlign:'left', padding:'10px 14px', fontSize:'14px', color:'#93c5fd', background:'none', border:'none', cursor:'pointer' }}>
                ❓ Ver tutorial
              </button>
              <button onClick={()=>{ setShowRules(true); setMenuOpen(false); }}
                style={{ width:'100%', textAlign:'left', padding:'10px 14px', fontSize:'14px', color:'#c084fc', background:'none', border:'none', cursor:'pointer' }}>
                📋 Ver reglas
              </button>
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth:'900px', margin:'0 auto', padding:'16px 16px 100px' }}>
        {activeTab==='home'    && <Home users={users} currentUser={currentUser} matches={matches} onNavigate={handleNavigate}/>}
        {activeTab==='matches' && <Matches key={matchesPhase} matches={matches} currentUser={currentUser} onMakePrediction={makePrediction} onSaveRound16Prediction={saveRound16Prediction} reactions={reactions} onAddReaction={addReaction} onRemoveReaction={removeReaction} users={users} initialPhase={matchesPhase}/>}
        {activeTab==='groups'  && <Groups currentUser={currentUser} onSaveGroupPrediction={saveGroupPrediction} users={users} matches={matches} groupsForceOpen={groupsForceOpen}/>}
        {activeTab==='results' && <Results matches={matches} currentUser={currentUser} users={users}/>}
        {activeTab==='ranking' && <Ranking users={users} currentUser={currentUser}/>}
        {activeTab==='news'    && <News/>}
        {activeTab==='history' && <History users={users} currentUser={currentUser} matches={matches}/>}
        {activeTab==='admin'   && currentUser.isAdmin && <AdminPanel matches={matches} onUpdateResult={updateMatchResult} onUpdateGroupResult={updateGroupResult} onUpdateChampion={updateChampion} onUpdateRound16Results={updateRound16Results} onRecalculateAll={recalculateAllPoints} users={users} onDeleteUser={deleteUser} onApproveUser={approveUser} onRejectUser={rejectUser} onResetAll={resetAllUsers} onOpenAllGroups={openAllGroups} onCloseAllGroups={closeAllGroups}/>}
      </main>

      <button onClick={()=>setShowRules(true)}
        style={{ position:'fixed', bottom:'80px', right:'16px', zIndex:45, width:'44px', height:'44px', borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#c026d3)', border:'none', cursor:'pointer', fontSize:'20px', boxShadow:'0 4px 20px rgba(124,58,237,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        📋
      </button>

      {showRules && (
        <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={()=>setShowRules(false)}>
          <div style={{ background:'#0f1a2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px 20px 0 0', padding:'24px 20px', width:'100%', maxWidth:'500px', maxHeight:'80vh', overflowY:'auto' }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ width:'40px', height:'4px', borderRadius:'2px', background:'rgba(255,255,255,0.2)', margin:'0 auto 20px' }}/>
            <h2 style={{ fontSize:'18px', fontWeight:'800', color:'white', marginBottom:'20px', textAlign:'center' }}>📋 Reglas y Puntos</h2>
            {[
              { title:'⚽ Grupos (cerrado)', items:[
                { label:'Resultado correcto', pts:'+1 pt', color:'#4ade80' },
                { label:'Marcador exacto', pts:'+4 pts', color:'#fde047' },
              ]},
              { title:'🔥 Ronda de 32', items:[
                { label:'Resultado correcto', pts:'+3 pts', color:'#4ade80' },
                { label:'Marcador exacto', pts:'+9 pts', color:'#fde047' },
                { label:'Equipo clasificado adivinado', pts:'+2 pts', color:'#c084fc' },
              ]},
              { title:'💪 Octavos de final', items:[
                { label:'Resultado correcto', pts:'+4 pts', color:'#4ade80' },
                { label:'Marcador exacto', pts:'+12 pts', color:'#fde047' },
              ]},
              { title:'🏅 Semis y Cuartos', items:[
                { label:'Resultado correcto', pts:'+5 pts', color:'#4ade80' },
                { label:'Marcador exacto', pts:'+15 pts', color:'#fde047' },
              ]},
              { title:'🥉 3er puesto', items:[
                { label:'Resultado correcto', pts:'+6 pts', color:'#4ade80' },
                { label:'Marcador exacto', pts:'+18 pts', color:'#fde047' },
              ]},
              { title:'🥇 Final', items:[
                { label:'Resultado correcto', pts:'+7 pts', color:'#4ade80' },
                { label:'Marcador exacto', pts:'+21 pts', color:'#fde047' },
              ]},
              { title:'📊 Clasificados de grupo', items:[
                { label:'1° y 2° en orden exacto', pts:'+10 pts', color:'#fde047' },
                { label:'Ambos equipos sin importar orden', pts:'+5 pts', color:'#4ade80' },
                { label:'Un equipo correcto', pts:'+2 pts', color:'#93c5fd' },
              ]},
              { title:'🏆 Campeón del Mundial', items:[
                { label:'Adivinas el campeón', pts:'+30 pts', color:'#c084fc' },
              ]},
            ].map(section=>(
              <div key={section.title} style={{ marginBottom:'20px' }}>
                <div style={{ fontSize:'14px', fontWeight:'700', color:'rgba(255,255,255,0.7)', marginBottom:'10px' }}>{section.title}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  {section.items.map(item=>(
                    <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderRadius:'10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.65)' }}>{item.label}</span>
                      <span style={{ fontSize:'14px', fontWeight:'800', color:item.color }}>{item.pts}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ padding:'14px', borderRadius:'12px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.15)', marginBottom:'16px' }}>
              <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', lineHeight:'1.6' }}>
                🔒 Los pronósticos cierran <strong style={{color:'white'}}>10 minutos</strong> antes de cada partido.<br/>
                🔥 Los 16 clasificados se pronostican antes del primer partido de la ronda.<br/>
                💰 Inscripción: <strong style={{color:'white'}}>$15.000</strong>
              </div>
            </div>
            <button onClick={()=>setShowRules(false)}
              style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,#7c3aed,#c026d3)', border:'none', color:'white', fontWeight:'600', fontSize:'14px', borderRadius:'12px', cursor:'pointer' }}>
              Entendido ✓
            </button>
          </div>
        </div>
      )}

      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:40, background:'#0f1a0f', borderTop:'1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display:'flex', maxWidth:'900px', margin:'0 auto' }}>
          {bottomTabs.map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 0', fontSize:'9px', fontWeight:'500', background:'none', border:'none', cursor:'pointer',
                color:activeTab===tab.id?'#4ade80':'rgba(255,255,255,0.35)' }}>
              <span style={{ fontSize:'16px', marginBottom:'2px' }}>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;