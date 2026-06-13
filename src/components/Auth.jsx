import React, { useState } from 'react';
import { teams } from '../data/teams';

const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name, 'es'));

const Flag = ({ code, size = 32 }) => {
  if (!code) return <span style={{ fontSize: size * 0.8 + 'px' }}>🏳️</span>;
  return (
    <img
      src={`https://hatscripts.github.io/circle-flags/flags/${code.toLowerCase()}.svg`}
      width={size} height={size} alt={code}
      style={{ borderRadius: '50%', objectFit: 'cover' }}
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
};

const Auth = ({ onLogin, onRegister, users }) => {
  const [mode, setMode] = useState('login');
  const [accessCode, setAccessCode] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedChampion, setSelectedChampion] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [registered, setRegistered] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const ACCESS_CODE = 'pollamundialista';

  const filteredTeams = sortedTeams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    if (accessCode.toLowerCase() !== ACCESS_CODE) { setError('Código de acceso incorrecto'); return; }
    if (!name.trim()) { setError('Ingresa tu nombre'); return; }
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (!user) { setError('Usuario no encontrado. ¿Necesitas registrarte?'); return; }
    if (!user.approved && !user.isAdmin) {
      setRegisteredUser(user);
      setRegistered(true);
      return;
    }
    onLogin(user);
  };

  const handleRegisterStep1 = (e) => {
    e.preventDefault();
    setError('');
    if (accessCode.toLowerCase() !== ACCESS_CODE) { setError('Código de acceso incorrecto'); return; }
    if (!name.trim()) { setError('Ingresa tu nombre'); return; }
    if (users.find(u => u.name.toLowerCase() === name.toLowerCase())) {
      setError('Este nombre ya está registrado. Intenta iniciar sesión.'); return;
    }
    setStep(2);
  };

  const handleRegisterStep2 = (e) => {
    e.preventDefault();
    if (!selectedAvatar) { setError('Selecciona un avatar'); return; }
    setError(''); setSearch(''); setStep(3);
  };

  const handleRegisterStep3 = async (e) => {
    e.preventDefault();
    if (!selectedChampion) { setError('Selecciona tu pronóstico del campeón'); return; }
    const newUser = await onRegister(name, nickname, selectedAvatar, selectedChampion);
    // Si es el primer usuario (admin) entra directo, si no muestra pantalla de espera
    if (newUser.isAdmin) {
      onLogin(newUser);
    } else {
      setRegisteredUser(newUser);
      setRegistered(true);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px', color: 'white', fontSize: '15px', outline: 'none',
  };
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' };

  // Pantalla de espera de aprobación
  if (registered) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0e1a 0%,#0f1f0f 50%,#0a1628 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'white', marginBottom: '12px' }}>
            ¡Registro exitoso!
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', marginBottom: '24px' }}>
            Tu cuenta está pendiente de aprobación. El administrador te activará una vez confirme tu pago de <strong style={{ color: 'white' }}>$15.000</strong>.
          </p>
          <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', marginBottom: '28px' }}>
            <div style={{ fontSize: '14px', color: '#fb923c', fontWeight: '600', marginBottom: '6px' }}>¿Ya pagaste?</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
              Avísale al administrador con tu nombre:<br/>
              <strong style={{ color: 'white' }}>{name}</strong>
            </div>
          </div>
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)', marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Tu pronóstico del campeón quedó guardado ✓</div>
          </div>
          <button onClick={() => { setRegistered(false); setMode('login'); setStep(1); setName(''); setAccessCode(''); }}
            style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0e1a 0%,#0f1f0f 50%,#0a1628 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse,rgba(22,163,74,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '32px', backdropFilter: 'blur(10px)' }}>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg,#16a34a,#15803d)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px' }}>⚽</div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
            Polla<span style={{ color: '#4ade80' }}>Mundialista</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '4px' }}>Mundial 2026 🏆</p>
        </div>

        {mode === 'register' && step > 1 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
            {[1,2,3].map(s => (
              <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: step >= s ? '#4ade80' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
            ))}
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{ flex: 1, padding: '8px', borderRadius: '9px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', background: mode===m?'rgba(74,222,128,0.2)':'transparent', color: mode===m?'#4ade80':'rgba(255,255,255,0.5)', border: mode===m?'1px solid rgba(74,222,128,0.3)':'1px solid transparent' }}>
                {m === 'login' ? 'Entrar' : 'Registrarse'}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* LOGIN */}
        {mode === 'login' && step === 1 && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Código de acceso</label>
              <input style={inputStyle} type="text" value={accessCode} onChange={e => setAccessCode(e.target.value)} placeholder="Ingresa el código" />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Tu nombre</label>
              <input style={inputStyle} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Juan Pérez" />
            </div>
            <button type="submit" style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', fontWeight: '600', fontSize: '15px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Entrar →
            </button>
          </form>
        )}

        {/* REGISTER STEP 1 */}
        {mode === 'register' && step === 1 && (
          <form onSubmit={handleRegisterStep1}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Código de acceso</label>
              <input style={inputStyle} type="text" value={accessCode} onChange={e => setAccessCode(e.target.value)} placeholder="Pide el código al admin" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Tu nombre *</label>
              <input style={inputStyle} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Juan Pérez" />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Apodo (opcional)</label>
              <input style={inputStyle} type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Ej: El Experto 🧠" />
            </div>
            <button type="submit" style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', fontWeight: '600', fontSize: '15px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Siguiente →
            </button>
            {users.length === 0 && <p style={{ textAlign: 'center', fontSize: '13px', color: '#4ade80', marginTop: '12px' }}>🎉 Serás el primer usuario y tendrás acceso de administrador</p>}
          </form>
        )}

        {/* REGISTER STEP 2 — Avatar */}
        {mode === 'register' && step === 2 && (
          <form onSubmit={handleRegisterStep2}>
            <div style={{ marginBottom: '12px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>Elige tu equipo favorito</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Será tu avatar — orden alfabético</p>
            </div>
            <input type="text" placeholder="🔍 Buscar equipo..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, marginBottom: '10px', fontSize: '13px', padding: '8px 12px' }}
            />
            <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', marginBottom: '16px' }}>
              {filteredTeams.map(team => (
                <button key={team.id} type="button" onClick={() => setSelectedAvatar(team.id)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px',
                    background: selectedAvatar === team.id ? 'rgba(74,222,128,0.15)' : 'transparent',
                    border: selectedAvatar === team.id ? '1px solid rgba(74,222,128,0.4)' : '1px solid transparent',
                    cursor: 'pointer', marginBottom: '2px', transition: 'all 0.15s' }}>
                  <Flag code={team.flagCode} size={24} />
                  <span style={{ fontSize: '13px', fontWeight: '500', color: selectedAvatar === team.id ? '#4ade80' : 'rgba(255,255,255,0.8)' }}>{team.name}</span>
                  {selectedAvatar === team.id && <span style={{ marginLeft: 'auto', color: '#4ade80' }}>✓</span>}
                </button>
              ))}
              {filteredTeams.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '16px' }}>No se encontró ese equipo</p>}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontWeight: '500', cursor: 'pointer' }}>← Atrás</button>
              <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', fontWeight: '600', fontSize: '15px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>Siguiente →</button>
            </div>
          </form>
        )}

        {/* REGISTER STEP 3 — Campeón */}
        {mode === 'register' && step === 3 && (
          <form onSubmit={handleRegisterStep3}>
            <div style={{ marginBottom: '12px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>¿Quién ganará el Mundial?</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Este pronóstico no se puede cambiar · +15 pts si aciertas</p>
            </div>
            <input type="text" placeholder="🔍 Buscar equipo..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, marginBottom: '10px', fontSize: '13px', padding: '8px 12px' }}
            />
            <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', marginBottom: '16px' }}>
              {filteredTeams.map(team => (
                <button key={team.id} type="button" onClick={() => setSelectedChampion(team.id)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px',
                    background: selectedChampion === team.id ? 'rgba(250,204,21,0.12)' : 'transparent',
                    border: selectedChampion === team.id ? '1px solid rgba(250,204,21,0.4)' : '1px solid transparent',
                    cursor: 'pointer', marginBottom: '2px', transition: 'all 0.15s' }}>
                  <Flag code={team.flagCode} size={24} />
                  <span style={{ fontSize: '13px', fontWeight: '500', color: selectedChampion === team.id ? '#fde047' : 'rgba(255,255,255,0.8)' }}>{team.name}</span>
                  {selectedChampion === team.id && <span style={{ marginLeft: 'auto', fontSize: '16px' }}>🏆</span>}
                </button>
              ))}
              {filteredTeams.length === 0 && <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '16px' }}>No se encontró ese equipo</p>}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setStep(2)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontWeight: '500', cursor: 'pointer' }}>← Atrás</button>
              <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', fontWeight: '600', fontSize: '15px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>¡Registrarme! 🎉</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;