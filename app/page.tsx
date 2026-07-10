"use client";

import { useState, useEffect, useRef } from 'react';

type AppState = 'MATCH_SELECT' | 'AR_HUD_LIVE';

interface Match {
  id: string;
  home: string;
  away: string;
  homeShort: string;
  awayShort: string;
  time: string;
  baseOdds: { home: string; draw: string; away: string };
  baseConsensus: number;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [appState, setAppState] = useState<AppState>('MATCH_SELECT');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [liveScore, setLiveScore] = useState<string>('0 - 0');
  const [currentOdds, setCurrentOdds] = useState({ home: '1.50', draw: '2.80', away: '1.50' });
  const [liveConsensus, setLiveConsensus] = useState<number>(50);
  const [cameraPermission, setCameraPermission] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const matches: Match[] = [
    {
      id: 'fra_mor', home: 'France', away: 'Morocco', homeShort: 'FRA', awayShort: 'MAR', time: '04:00 PM EDT',
      baseOdds: { home: '1.65', draw: '3.40', away: '5.10' }, baseConsensus: 62,
    },
    {
      id: 'bra_jap', home: 'Brazil', away: 'Japan', homeShort: 'BRA', awayShort: 'JAP', time: '02:00 PM EDT',
      baseOdds: { home: '1.22', draw: '5.80', away: '12.50' }, baseConsensus: 78,
    },
    {
      id: 'ger_par', home: 'Germany', away: 'Paraguay', homeShort: 'GER', awayShort: 'PAR', time: '12:00 PM EDT',
      baseOdds: { home: '1.45', draw: '4.20', away: '7.30' }, baseConsensus: 54,
    },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (appState === 'AR_HUD_LIVE') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .then((stream) => {
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setCameraPermission(true);
            }
          })
          .catch((err) => {
            console.warn("Camera streaming fallback active:", err);
            setCameraPermission(false);
          });
      } else {
        setCameraPermission(false);
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [appState, mounted]);

  useEffect(() => {
    if (appState === 'AR_HUD_LIVE' && selectedMatch) {
      setLiveScore('0 - 0');
      setCurrentOdds(selectedMatch.baseOdds);
      setLiveConsensus(selectedMatch.baseConsensus);

      const interval = setInterval(() => {
        setCurrentOdds(prev => {
          const h = Math.max(1.02, parseFloat(prev.home) + (Math.random() * 0.04 - 0.02)).toFixed(2);
          const d = Math.max(1.02, parseFloat(prev.draw) + (Math.random() * 0.06 - 0.03)).toFixed(2);
          const a = Math.max(1.02, parseFloat(prev.away) + (Math.random() * 0.10 - 0.05)).toFixed(2);
          return { home: h, draw: d, away: a };
        });

        setLiveConsensus(prev => {
          const variance = Math.random() > 0.5 ? 1 : -1;
          return Math.min(94, Math.max(6, prev + variance));
        });

        setLiveScore(prev => {
          if (prev === '0 - 0' && Math.random() > 0.90) {
            return "1 - 0";
          }
          return prev;
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [appState, selectedMatch]);

  if (!mounted) {
    return <div style={{ backgroundColor: '#050508', minHeight: '100vh', width: '100vw' }} />;
  }

  return (
    <main style={{
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: '#050508',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box',
      color: '#ffffff',
    }}>

      <div style={{
        width: '100%',
        maxWidth: '412px',
        height: '100vh',
        maxHeight: '892px',
        backgroundColor: '#0a0a14',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0px 0px 40px rgba(0, 240, 255, 0.15)',
        border: '1px solid #1c1c32',
        borderRadius: '44px',
        boxSizing: 'border-box',
      }}>

        {appState === 'MATCH_SELECT' && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '48px 24px 24px 24px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ backgroundColor: '#00f0ff', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #00f0ff' }} />
              <span style={{ color: '#52527a', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>BlinkEdge Stream Engine</span>
            </div>

            <h1 style={{ color: '#ffffff', fontSize: '32px', fontWeight: 900, margin: '0 0 32px 0', letterSpacing: '-0.5px' }}>Live Matches</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', overflowY: 'auto', flex: 1 }}>
              {matches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => { setSelectedMatch(match); setAppState('AR_HUD_LIVE'); }}
                  style={{
                    width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#121222', border: '1px solid #20203a', borderRadius: '24px', padding: '22px', color: '#ffffff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', boxSizing: 'border-box', textAlign: 'left', outline: 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.3px' }}>{match.home}</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#00f0ff', backgroundColor: 'rgba(0,240,255,0.08)', padding: '3px 9px', borderRadius: '6px', fontFamily: 'monospace' }}>VS</span>
                    <span style={{ fontWeight: 800, fontSize: '16px', textAlign: 'right', letterSpacing: '0.3px' }}>{match.away}</span>
                  </div>
                  <div style={{ width: '100%', height: '1px', backgroundColor: '#20203a', margin: '16px 0 12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '12px', color: '#686888', fontWeight: 500 }}>
                    <span>World Cup 2026</span>
                    <span>{match.time}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {appState === 'AR_HUD_LIVE' && selectedMatch && (
          <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>

            {cameraPermission ? (
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, zIndex: 1 }} />
            ) : (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 1,
                background: 'radial-gradient(circle at center, #14142b 0%, #080811 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ color: 'rgba(0, 240, 255, 0.04)', fontSize: '14px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', textAlign: 'center', transform: 'rotate(-15deg)', width: '150%' }}>
                  BlinkEdge Telemetry • Grid Scanning Active • BlinkEdge Telemetry • Grid Scanning Active • BlinkEdge Telemetry
                </div>
              </div>
            )}

            <div style={{ position: 'absolute', top: '36px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
              <button
                onClick={() => setAppState('MATCH_SELECT')}
                style={{ backgroundColor: 'rgba(10, 10, 18, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)', color: '#ffffff', padding: '10px 18px', borderRadius: '16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', outline: 'none' }}
              >
                ← Exit HUD
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(16, 185, 129, 0.16)', border: '1px solid rgba(16, 185, 129, 0.4)', backdropFilter: 'blur(20px)', color: '#10b981', fontSize: '11px', fontWeight: 700, padding: '8px 14px', borderRadius: '24px', letterSpacing: '0.3px' }}>
                <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }} />
                TXODDS DATA FEED
              </div>
            </div>

            <div style={{ position: 'absolute', top: '100px', left: '16px', right: '16px', backgroundColor: 'rgba(12, 12, 20, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(24px)', zIndex: 10, boxSizing: 'border-box', boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', width: '30%', textAlign: 'left' }}>{selectedMatch.homeShort}</span>
              <span style={{ fontSize: '36px', fontWeight: 900, color: '#00f0ff', fontFamily: 'monospace', width: '40%', textAlign: 'center', letterSpacing: '1px' }}>{liveScore}</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', width: '30%', textAlign: 'right' }}>{selectedMatch.awayShort}</span>
            </div>

            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px 40px 20px',
              background: 'linear-gradient(to top, rgba(8,8,14,0.98) 0%, rgba(8,8,14,0.95) 85%, rgba(8,8,14,0.4) 100%)',
              backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 10,
              borderTop: '1px solid rgba(255,255,255,0.07)', boxSizing: 'border-box', borderBottomLeftRadius: '44px', borderBottomRightRadius: '44px',
            }}>

              <div style={{ backgroundColor: 'rgba(16, 16, 28, 0.65)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '18px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', fontWeight: 700 }}>
                  <span style={{ color: '#80809a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Market Consensus</span>
                  <span style={{ color: '#00f0ff', fontWeight: 800, fontFamily: 'monospace' }}>POS {liveConsensus}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#141424', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${liveConsensus}%`, height: '100%', background: 'linear-gradient(90deg, #0052ff 0%, #00f0ff 100%)', transition: 'width 0.5s ease-out' }} />
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(16, 16, 28, 0.65)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '18px', boxSizing: 'border-box' }}>
                <div style={{ color: '#80809a', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
                  Live Odds Matrix
                </div>

                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                  <div style={{ flex: 1, backgroundColor: '#0c0c16', border: '1px solid #1e1e35', borderRadius: '16px', padding: '14px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#4c4c6a', fontWeight: 'bold' }}>1</span>
                    <span style={{ fontSize: '17px', fontWeight: 900, color: '#00f0ff', fontFamily: 'monospace' }}>{currentOdds.home}</span>
                  </div>

                  <div style={{ flex: 1, backgroundColor: '#0c0c16', border: '1px solid #1e1e35', borderRadius: '16px', padding: '14px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#4c4c6a', fontWeight: 'bold' }}>X</span>
                    <span style={{ fontSize: '17px', fontWeight: 900, color: '#ffffff', fontFamily: 'monospace' }}>{currentOdds.draw}</span>
                  </div>

                  <div style={{ flex: 1, backgroundColor: '#0c0c16', border: '1px solid #1e1e35', borderRadius: '16px', padding: '14px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#4c4c6a', fontWeight: 'bold' }}>2</span>
                    <span style={{ fontSize: '17px', fontWeight: 900, color: '#00f0ff', fontFamily: 'monospace' }}>{currentOdds.away}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}
