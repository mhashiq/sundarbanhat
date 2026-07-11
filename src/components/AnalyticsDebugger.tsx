import React, { useEffect, useState } from 'react';
import { Terminal, X, Trash2, CheckCircle2 } from 'lucide-react';

interface DataLayerEvent {
  id: string;
  time: string;
  payload: any;
}

export const AnalyticsDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<DataLayerEvent[]>([]);

  // 1. Detect if dev mode or url parameter toggle (?analytics_debug=true) is set
  useEffect(() => {
    const isDev = import.meta.env.DEV;
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || window.location.search);
    const hasParam = urlParams.get('analytics_debug') === 'true';
    const isLocalEnabled = localStorage.getItem('sh_analytics_debug') === 'true';

    if (hasParam) {
      localStorage.setItem('sh_analytics_debug', 'true');
      setIsVisible(true);
    } else if (isDev || isLocalEnabled) {
      setIsVisible(true);
    }
  }, []);

  // 2. Intercept window.dataLayer.push to catch events dynamically
  useEffect(() => {
    if (!isVisible) return;

    // Load initial dataLayer events
    const initialEvents: DataLayerEvent[] = (window.dataLayer || []).map((evt, idx) => ({
      id: `init-${idx}-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      payload: evt
    }));
    setEvents(initialEvents);

    // Override push method
    const originalPush = window.dataLayer.push;
    window.dataLayer.push = function (...args: any[]) {
      const result = originalPush.apply(window.dataLayer, args as any);
      
      const newEvts = args.map(arg => ({
        id: `push-${Math.random()}-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        payload: JSON.parse(JSON.stringify(arg)) // Deep clone to freeze object state
      }));

      setEvents(prev => [...newEvts, ...prev].slice(0, 50)); // Limit to latest 50 events
      return result;
    };

    return () => {
      window.dataLayer.push = originalPush;
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const handleClear = () => {
    setEvents([]);
  };

  const handleCloseDebugger = () => {
    localStorage.removeItem('sh_analytics_debug');
    setIsVisible(false);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 99999, fontFamily: 'monospace' }}>
      {/* Floating Trigger Button */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            backgroundColor: 'var(--color-forest-dark)',
            color: 'var(--color-honey)',
            border: '2px solid var(--color-honey)',
            borderRadius: '50%',
            width: '54px',
            height: '54px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s ease',
            position: 'relative'
          }}
          title="Open GTM/GA4 Analytics Debugger"
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Terminal size={22} />
          {events.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              backgroundColor: '#e53935',
              color: '#fff',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              border: '2px solid #fff'
            }}>
              {events.length}
            </span>
          )}
        </button>
      ) : (
        /* Expanded Console Panel */
        <div style={{
          width: '380px',
          height: '480px',
          backgroundColor: 'rgba(7, 34, 17, 0.95)',
          color: '#00ff66',
          border: '2px solid var(--color-honey)',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 15px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(7, 34, 17, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-honey)' }}>
              <Terminal size={16} />
              <span style={{ fontWeight: 'bold', fontSize: '12px' }}>GTM dataLayer Event Monitor</span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleClear} 
                style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', padding: '2px' }}
                title="Clear logs"
              >
                <Trash2 size={14} />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', padding: '2px' }}
                title="Minimize debugger"
              >
                <X size={14} />
              </button>
              <button 
                onClick={handleCloseDebugger} 
                style={{ background: 'none', border: 'none', color: '#ff1111', cursor: 'pointer', padding: '2px', fontWeight: 'bold' }}
                title="Deactivate debugger completely"
              >
                Off
              </button>
            </div>
          </div>

          {/* Logs View */}
          <div style={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '12px',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {events.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                No events tracked yet.
              </div>
            ) : (
              events.map((evt) => (
                <div 
                  key={evt.id} 
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-honey)', marginBottom: '4px' }}>
                    <strong>⚡ {evt.payload.event || 'gtm.js (Load)'}</strong>
                    <span style={{ color: '#888', fontSize: '10px' }}>{evt.time}</span>
                  </div>
                  
                  {/* Detailed payload viewer */}
                  <pre style={{
                    margin: 0,
                    padding: '6px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderRadius: '4px',
                    overflowX: 'auto',
                    color: '#ddd',
                    fontSize: '10px',
                    lineHeight: '1.4'
                  }}>
                    {JSON.stringify(evt.payload, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>

          {/* Status bar */}
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid rgba(212, 175, 55, 0.3)',
            fontSize: '10px',
            color: '#888',
            backgroundColor: 'rgba(7, 34, 17, 0.8)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={10} style={{ color: '#00ff66' }} />
              <span>GTM Container: GTM-MV88V9NC</span>
            </div>
            <span>Dev Mode</span>
          </div>
        </div>
      )}
    </div>
  );
};
