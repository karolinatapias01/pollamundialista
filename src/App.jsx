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

function App() {
  const {
    currentUser, users, matches, reactions, loading,
    setCurrentUser, registerUser, makePrediction,
    saveGroupPrediction, updateMatchResult,
    updateGroupResult, updateChampion,
    addReaction, removeReaction, deleteUser
  } = useAppState();

  const [activeTab, setActiveTab] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem('polla_tutorial_done');
  });

  const handleFinishTutorial = () => {
    localStorage.setItem('polla_tutorial_done', 'true');
    setShowTutorial(false);
  };

  useEffect(() => {
    const interval = startAutoSync();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const interval = startNotifications(matches, currentUser);
    return () => clearInterval(interval);
  }, [matches, currentUser]);

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

  return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a' }}>

      {showTutorial && currentUser && <Tutorial onFinish={handleFinishTutorial}/>}

      <header style={{ background:'linear-gradient(135deg,#0f1f0f 0%,#0a1628 50%,#1a0a28 100%)', borderBottom:'1px solid rgba(255,255,255,0.08)', position:'sticky', top:0, zIndex:50 }}>
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
                  <p style={{ fontSize:'11px', color:'#4ade80', marginTop:'2px' }}>{currentUser.points||0} pts</p>
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
              <button onClick={()=>setShowTutorial(true)}
                style={{ width:'100%', textAlign:'left', padding:'10px 14px', fontSize:'14px', color:'#93c5fd', background:'none', border:'none', cursor:'pointer' }}>
                ❓ Ver tutorial
              </button>
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth:'900px', margin:'0 auto', padding:'16px 16px 100px' }}>
        {activeTab==='home'    && <Home users={users} currentUser={currentUser} matches={matches} onNavigate={setActiveTab}/>}
        {activeTab==='matches' && <Matches matches={matches} currentUser={currentUser} onMakePrediction={makePrediction} reactions={reactions} onAddReaction={addReaction} onRemoveReaction={removeReaction} users={users}/>}
        {activeTab==='groups'  && <Groups currentUser={currentUser} onSaveGroupPrediction={saveGroupPrediction} users={users} matches={matches}/>}
        {activeTab==='results' && <Results matches={matches} currentUser={currentUser} users={users}/>}
        {activeTab==='ranking' && <Ranking users={users} currentUser={currentUser}/>}
        {activeTab==='news'    && <News/>}
        {activeTab==='history' && <History users={users} currentUser={currentUser} matches={matches}/>}
        {activeTab==='admin'   && currentUser.isAdmin && <AdminPanel matches={matches} onUpdateResult={updateMatchResult} onUpdateGroupResult={updateGroupResult} onUpdateChampion={updateChampion} users={users} onDeleteUser={deleteUser}/>}
      </main>

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