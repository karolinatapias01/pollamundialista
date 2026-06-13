import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

const card = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px' };

const fetchNews = async () => {
  try {
    const res = await fetch(
      `https://newsdata.io/api/1/latest?apikey=pub_f31fabb41acb4c1a9b24b614ec268622&q=mundial+2026+FIFA&language=es&category=sports`
    );
    const data = await res.json();
    if (data.status === 'success' && data.results?.length > 0) {
      return data.results;
    }
    return [];
  } catch(e) {
    console.error('Error noticias:', e);
    return [];
  }
};

const formatNewsDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', hour12:true
  });
};

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadNews = async () => {
    setLoading(true);
    setError(false);
    try {
      const items = await fetchNews();
      if (items.length > 0) {
        setNews(items);
        setLastUpdate(new Date());
      } else {
        setError(true);
      }
    } catch(e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
        <div>
          <div style={{fontSize:'16px',fontWeight:'700',color:'white'}}>📰 Noticias del Mundial</div>
          {lastUpdate && <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',marginTop:'2px'}}>
            Actualizado: {lastUpdate.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit',hour12:true})}
          </div>}
        </div>
        <button onClick={loadNews} disabled={loading}
          style={{padding:'8px',borderRadius:'10px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.6)',cursor:'pointer'}}>
          <RefreshCw size={16}/>
        </button>
      </div>

      {loading && (
        <div style={{...card,padding:'48px',textAlign:'center'}}>
          <div style={{fontSize:'28px',marginBottom:'12px'}}>⚽</div>
          <div style={{fontSize:'14px',color:'rgba(255,255,255,0.4)'}}>Cargando noticias...</div>
        </div>
      )}

      {error && !loading && (
        <div style={{...card,padding:'32px',textAlign:'center'}}>
          <div style={{fontSize:'28px',marginBottom:'10px'}}>😔</div>
          <div style={{fontSize:'14px',color:'rgba(255,255,255,0.4)',marginBottom:'12px'}}>
            No se pudieron cargar las noticias
          </div>
          <button onClick={loadNews}
            style={{padding:'8px 20px',borderRadius:'10px',background:'linear-gradient(135deg,#16a34a,#15803d)',border:'none',color:'white',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && news.length === 0 && (
        <div style={{...card,padding:'32px',textAlign:'center'}}>
          <div style={{fontSize:'28px',marginBottom:'10px'}}>📭</div>
          <div style={{fontSize:'14px',color:'rgba(255,255,255,0.4)'}}>No hay noticias disponibles</div>
        </div>
      )}

      {!loading && news.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {news.map((item, idx) => (
            <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer"
              style={{...card,padding:'16px 18px',display:'block',textDecoration:'none',cursor:'pointer'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.07)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
              {item.image_url && (
                <img src={item.image_url} alt=""
                  style={{width:'100%',height:'160px',objectFit:'cover',borderRadius:'10px',marginBottom:'12px'}}
                  onError={e=>{e.target.style.display='none';}}/>
              )}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'12px'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:'14px',fontWeight:'600',color:'rgba(255,255,255,0.9)',lineHeight:'1.4',marginBottom:'6px'}}>
                    {item.title}
                  </div>
                  {item.description && (
                    <div style={{fontSize:'12px',color:'rgba(255,255,255,0.45)',lineHeight:'1.5',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                      {item.description}
                    </div>
                  )}
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'8px'}}>
                    <span style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>{item.source_id||'Noticias'}</span>
                    {item.pubDate && (
                      <>
                        <span style={{color:'rgba(255,255,255,0.2)'}}>·</span>
                        <span style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>{formatNewsDate(item.pubDate)}</span>
                      </>
                    )}
                  </div>
                </div>
                <ExternalLink size={14} style={{color:'rgba(255,255,255,0.25)',flexShrink:0,marginTop:'2px'}}/>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default News;