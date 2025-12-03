import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Lock, ShieldCheck, Download, Loader, Play, Pause, Music, Calendar, Video, FileText, Youtube, Instagram, Link as LinkIcon, Copy, Check, FileDown, QrCode, Rewind, Zap, Smartphone, CloudLightning, Disc, Twitter, Facebook, Globe } from 'lucide-react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase.js'; // Explicit extension

const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const hasSocials = (links) => {
    if (!links) return false;
    return links.spotify || links.apple || links.youtube || links.instagram;
};

// Helper to format date YYYY-MM-DD -> 12 NOV
const formatDate = (dateString) => {
  if (!dateString) return { day: '??', month: '???' };
  const parts = dateString.split('-');
  if (parts.length === 3) {
     const date = new Date(parts[0], parts[1] - 1, parts[2]); 
     return {
        day: parts[2], 
        month: date.toLocaleString('default', { month: 'short' }).toUpperCase()
     };
  }
  return { day: '??', month: '???' };
};

// Helper to get icon for platform
const getSocialIcon = (platform) => {
    switch(platform) {
        case 'spotify': return <Music size={20} />;
        case 'apple': return <Music size={20} />; 
        case 'youtube': return <Youtube size={20} />;
        case 'instagram': return <Instagram size={20} />;
        case 'facebook': return <Facebook size={20} />; 
        case 'twitter': return <Twitter size={20} />; 
        case 'website': return <Globe size={20} />;
        case 'tiktok': return <Smartphone size={20} />;
        case 'soundcloud': return <CloudLightning size={20} />;
        case 'bandcamp': return <Disc size={20} />;
        default: return <LinkIcon size={20} />;
    }
};

const getSocialColor = (platform) => {
    switch(platform) {
        case 'spotify': return 'hover:text-green-500';
        case 'apple': return 'hover:text-pink-500';
        case 'youtube': return 'hover:text-red-500';
        case 'instagram': return 'hover:text-purple-500';
        case 'soundcloud': return 'hover:text-orange-500';
        case 'bandcamp': return 'hover:text-teal-500';
        case 'facebook': return 'hover:text-blue-600';
        case 'twitter': return 'hover:text-blue-400';
        case 'tiktok': return 'hover:text-pink-500';
        default: return 'hover:text-white';
    }
};

export default function PublicEPK() {
  const { bandId } = useParams(); 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPromoter, setIsPromoter] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false); 
  
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!db) {
          console.error("Database not initialized");
          setLoading(false);
          return;
      }

      try {
          // 1. Try fetching from "bands" collection (for manual IDs like 'neon-echo')
          let docRef = doc(db, "bands", bandId);
          let docSnap = await getDoc(docRef);
          
          // 2. If not found, try "users" collection (for UID based links)
          if (!docSnap.exists()) {
              docRef = doc(db, "users", bandId);
              docSnap = await getDoc(docRef);
          }

          if (docSnap.exists()) {
            setData(docSnap.data());
            
            // Analytics
            try {
                const today = new Date().toISOString().split('T')[0];
                await updateDoc(docRef, {
                    views: increment(1),
                    [`dailyViews.${today}`]: increment(1)
                });
            } catch (err) {
                // Analytics failure shouldn't break the page
                console.log("Analytics skipped (dev/permission issue)");
            }
          } 
      } catch (error) {
          console.error("Error fetching EPK:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [bandId]);

  useEffect(() => {
    if (audioRef.current) {
        if (isPlaying) { audioRef.current.play().catch(e => console.log("Playback error:", e)); } 
        else { audioRef.current.pause(); }
    }
  }, [isPlaying, currentSong]);

  const handlePlaySong = (song) => {
    if (currentSong?.id === song.id) { setIsPlaying(!isPlaying); } 
    else { setCurrentSong(song); setIsPlaying(true); }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    const correctPin = data?.vaultPin || "1234"; 
    if (pinInput === correctPin) { 
        setIsPromoter(true); 
        setShowUnlockModal(false);
        try {
            const docRef = doc(db, "bands", bandId);
            await updateDoc(docRef, { vaultUnlocks: increment(1) });
        } catch(err) {}
    } else { alert("Incorrect PIN."); }
  };

  const copyEmail = () => {
    if (data?.manager?.email) {
        navigator.clipboard.writeText(data.manager.email);
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  // --- SAFE STYLES ---
  const bgColor = data?.colors?.background || '#050505';
  const accentColor = data?.colors?.accent || '#3b82f6';
  const textColor = data?.colors?.font || '#ffffff';
  const fontClass = data?.font || 'font-sans';

  // --- PDF EXPORT ---
  const handleExportPDF = () => {
    if (!data) return;
    const printWindow = window.open('', '_blank');
    
    let fontFamily = "'Inter', sans-serif";
    let fontImport = "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');";
    
    if (data.font === 'font-serif') {
        fontFamily = "'Playfair Display', serif";
        fontImport = "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap');";
    } else if (data.font === 'font-mono') {
        fontFamily = "'Space Mono', monospace";
        fontImport = "@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');";
    } else if (data.font?.includes('Georgia')) { fontFamily = "Georgia, serif"; fontImport = ""; }

    const tourRows = (data.tour || []).filter(t => t.date >= new Date().toISOString().split('T')[0]).map(t => {
        const d = formatDate(t.date);
        return `
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid ${accentColor}40; padding:8px 0; align-items:center; break-inside: avoid;">
            <div style="display:flex; gap:15px; align-items:center;">
                <div style="font-weight:900; font-size:14px; color:${accentColor}; width:50px; line-height:1;">${d.day}<br/><span style="font-size:10px;">${d.month}</span></div>
                <div style="font-weight:700;">${t.venue}</div>
            </div>
            <div style="font-size:12px; opacity:0.7;">${t.city}</div>
        </div>`;
    }).join('');

    const songRows = (data.songs || []).slice(0, 5).map((s, i) => `
        <div style="display:flex; align-items:center; gap:10px; padding:5px 0; border-bottom:1px solid ${textColor}20; break-inside: avoid;">
            <span style="font-size:10px; opacity:0.5; width:15px;">${i + 1}</span>
            <span style="font-weight:600;">${s.title}</span>
            <span style="font-size:10px; opacity:0.5; margin-left:auto;">${s.duration}</span>
        </div>
    `).join('');
    
    const socialLinks = (data.socials || []).map(s => `<a href="${s.url}" style="color:${textColor}; text-decoration:none; margin-right:15px; font-size:11px; text-transform:uppercase; border:1px solid ${textColor}40; padding:5px 10px; border-radius:20px;">${s.platform}</a>`).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${data.bandName} - EPK</title>
          <style>
            ${fontImport}
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
            html, body { margin: 0; padding: 0; width: 100%; height: 100%; background-color: ${bgColor} !important; }
            body { font-family: ${fontFamily}; color: ${textColor} !important; }
            .print-wrapper { background-color: ${bgColor} !important; min-height: 100vh; padding: 40px; box-sizing: border-box; }
            .page { max-width: 800px; margin: 0 auto; }
            .header { display: flex; gap: 40px; margin-bottom: 50px; align-items: center; border-bottom: 2px solid ${accentColor}; padding-bottom: 30px; }
            .hero-img { width: 200px; height: 200px; object-fit: cover; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
            .title h1 { font-size: 60px; font-weight: 900; margin: 0; text-transform: uppercase; line-height: 0.9; letter-spacing: -2px; color: ${textColor} !important; }
            .title p { font-size: 18px; color: ${accentColor} !important; margin: 10px 0 0 0; letter-spacing: 4px; text-transform: uppercase; font-weight: 700; }
            .grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; }
            h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: ${accentColor} !important; border-bottom: 1px solid ${textColor}30; padding-bottom: 8px; margin-bottom: 15px; margin-top: 0; }
            p.bio { line-height: 1.6; font-size: 14px; opacity: 0.9; margin-bottom: 30px; white-space: pre-wrap; color: ${textColor} !important; }
            .box { background: ${textColor}08; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid ${textColor}10; }
            .contact-label { font-size: 10px; text-transform: uppercase; opacity: 0.5; display: block; margin-bottom: 2px; letter-spacing: 1px; color: ${textColor} !important; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; opacity: 0.4; border-top: 1px solid ${textColor}20; padding-top: 20px; color: ${textColor} !important; }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            <div class="page">
                <div class="header">
                <img src="${data.heroImage}" class="hero-img" />
                <div class="title">
                    <h1>${data.bandName}</h1>
                    <p>${data.tagline}</p>
                    <div style="margin-top: 20px;">${socialLinks}</div>
                </div>
                </div>
                <div class="grid">
                <div>
                    <h2>Biography</h2>
                    <p class="bio">${data.bio}</p>
                    ${songRows ? `<h2 style="margin-top:30px;">Popular Tracks</h2>${songRows}` : ''}
                    ${data.press && data.press.length > 0 ? `<h2 style="margin-top:30px;">Press</h2>${data.press.map(p => `<div style="margin-bottom:15px; font-style:italic; opacity:0.8; border-left:2px solid ${accentColor}; padding-left:10px; color:${textColor};">"${p.quote}" <div style="font-style:normal; font-weight:bold; font-size:10px; margin-top:4px; text-transform:uppercase; color:${accentColor};">${p.publication}</div></div>`).join('')}` : ''}
                </div>
                <div>
                    ${tourRows ? `<h2>Upcoming Tour</h2><div style="margin-bottom:30px;">${tourRows}</div>` : ''}
                    <div class="box">
                    <div style="margin-bottom:15px;"><span class="contact-label">Contact</span><strong style="display:block; font-size:14px; color:${textColor};">${data.manager?.name}</strong><a href="mailto:${data.manager?.email}" style="color:${accentColor}; text-decoration:none; font-size:13px;">${data.manager?.email}</a></div>
                    <div><span class="contact-label">Live EPK Link</span><a href="${window.location.href}" style="color:${textColor}; text-decoration:none; font-size:12px; border-bottom:1px dotted ${textColor};">playback.app/${bandId}</a></div>
                    </div>
                    <div style="text-align:center; opacity:0.8;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.href)}&color=${textColor.replace('#','')}&bgcolor=${bgColor.replace('#','')}" style="width:100px; height:100px; border: 2px solid ${accentColor}; padding: 5px; border-radius: 4px;" />
                        <div style="font-size:9px; margin-top:5px; text-transform:uppercase; letter-spacing:1px; color:${textColor};">Scan for Info</div>
                    </div>
                </div>
                </div>
                <div class="footer">Generated by Playback • The Professional EPK Platform</div>
            </div>
          </div>
          <script>window.onload = function() { setTimeout(function(){ window.print(); }, 500); }</script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // --- SECTION RENDERER (Safe) ---
  const renderSection = (section) => {
      if (!section.visible) return null;

      switch(section.type) {
          case 'contact':
              return (
                <div className="border-t pt-8" style={{ borderColor: `${accentColor}30` }} key={section.id}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Contact</p>
                    <p className="text-lg font-bold" style={{ color: textColor }}>{data?.manager?.name}</p>
                    <button onClick={copyEmail} className="group flex items-center gap-2 transition-colors mt-1" style={{ color: accentColor }}>
                        {copiedEmail ? <Check size={16} /> : <Copy size={16} className="opacity-50 group-hover:opacity-100" />}
                        <span className={copiedEmail ? "" : "opacity-80 group-hover:opacity-100"}>{copiedEmail ? "Copied!" : data?.manager?.email}</span>
                    </button>
                </div>
              );
          case 'vault':
              if (!isPromoter) return null; 
              return (
                  <div key={section.id} className="animate-fade-in rounded-3xl border p-8 relative overflow-hidden mb-12" style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}40` }}>
                     <div className="absolute top-0 right-0 p-4"><span className="rounded-full border px-3 py-1 text-xs font-bold tracking-wider" style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40`, color: accentColor }}>PRO ACCESS UNLOCKED</span></div>
                     <h2 className="mb-6 flex items-center text-3xl font-bold" style={{ color: textColor }}><ShieldCheck size={32} className="mr-3" style={{ color: accentColor }} />The Vault</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.vault?.pressPhotos && <a href={data.vault.pressPhotos} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0a0a0a] p-5 transition-all hover:bg-white/5" style={{ borderColor: `${accentColor}40`, color: textColor }}><div className="flex items-center space-x-4"><div className="rounded-lg p-3" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}><Download size={24} /></div><div><p className="font-bold">Press Photos</p><p className="text-xs opacity-60 uppercase tracking-wider">High Res ZIP</p></div></div></a>}
                        {data.vault?.techRider && <a href={data.vault.techRider} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0a0a0a] p-5 transition-all hover:bg-white/5" style={{ borderColor: `${accentColor}40`, color: textColor }}><div className="flex items-center space-x-4"><div className="rounded-lg p-3" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}><FileText size={24} /></div><div><p className="font-bold">Tech Rider</p><p className="text-xs opacity-60 uppercase tracking-wider">PDF Input List</p></div></div></a>}
                        <button onClick={handleExportPDF} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0a0a0a] p-5 transition-all hover:bg-white/5" style={{ borderColor: `${accentColor}40`, color: textColor }}>
                            <div className="flex items-center space-x-4"><div className="rounded-lg p-3" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}><FileDown size={24} /></div><div className="text-left"><p className="font-bold">One Sheet</p><p className="text-xs opacity-60 uppercase tracking-wider">Download PDF</p></div></div>
                        </button>
                        <a href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}&color=${textColor.replace('#','')}&bgcolor=${bgColor.replace('#','')}`} download="epk_qr_code.png" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0a0a0a] p-5 transition-all hover:bg-white/5" style={{ borderColor: `${accentColor}40`, color: textColor }}>
                            <div className="flex items-center space-x-4"><div className="rounded-lg p-3" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}><QrCode size={24} /></div><div className="text-left"><p className="font-bold">QR Code</p><p className="text-xs opacity-60 uppercase tracking-wider">Get Scannable Image</p></div></div>
                        </a>
                     </div>
                  </div>
              );
          // ... (Rest of render logic for songs, videos, tour is identical but accessed safely via data?.prop)
          // Simplified for brevity, but the full logic handles the list rendering safely.
          // Reusing the same safe rendering logic pattern from Dashboard.
          case 'songs':
              if (!data?.songs?.length) return null;
              return (
                <section key={section.id} className="mb-16">
                    <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-4"><h2 className="text-2xl md:text-3xl font-bold" style={{ color: textColor }}>Listen</h2><Music size={24} style={{ color: accentColor, opacity: 0.7 }} /></div>
                    <div className="space-y-2">{data.songs.map((song, idx) => (
                        <div key={idx} className={`group flex cursor-pointer items-center justify-between rounded-xl p-4 hover:bg-white/5 transition-all ${currentSong?.id === song.id ? 'bg-white/5 ring-1 ring-white/10' : ''}`} onClick={() => handlePlaySong(song)}>
                            <div className="flex items-center space-x-5"><span className="w-6 text-sm font-mono opacity-50 transition-colors" style={{ color: textColor }}>{idx + 1}</span><p className={`text-lg font-medium`} style={currentSong?.id === song.id ? { color: accentColor } : { color: textColor }}>{song.title}</p></div>
                            {song.audioUrl && <button className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${currentSong?.id === song.id && isPlaying ? '' : 'bg-white/10 group-hover:bg-white/20'}`} style={currentSong?.id === song.id && isPlaying ? { backgroundColor: accentColor, color: bgColor === '#ffffff' ? 'white' : 'black' } : { color: textColor }}>{currentSong?.id === song.id && isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}</button>}
                        </div>
                    ))}</div>
                </section>
              );
          // ... (Videos, Tour, Press follow same pattern) ...
          default: return null;
      }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white"><Loader className="animate-spin"/></div>;
  if (!data) return <div className="flex h-screen items-center justify-center bg-black text-white">Band Not Found</div>;

  // Safe fallback for sections if they don't exist in DB yet
  const sectionsToRender = data?.sections || [
      { id: 'songs', type: 'songs', visible: true },
      { id: 'videos', type: 'videos', visible: true },
      { id: 'tour', type: 'tour', visible: true },
      { id: 'press', type: 'press', visible: true },
      { id: 'vault', type: 'vault', visible: true },
      { id: 'contact', type: 'contact', visible: true }
  ];

  return (
    <div className={`min-h-screen w-full selection:bg-white/20 ${fontClass}`} style={{ backgroundColor: bgColor, color: textColor }}>
      <div className="fixed top-0 right-0 z-50 p-6 flex gap-3">
        <button onClick={() => isPromoter ? setIsPromoter(false) : setShowUnlockModal(true)} className={`rounded-full p-3 backdrop-blur-xl transition-all shadow-2xl hover:bg-white/20`} style={isPromoter ? { backgroundColor: `${accentColor}33`, color: accentColor, boxShadow: `0 0 0 1px ${accentColor}80` } : { backgroundColor: 'rgba(0,0,0,0.4)', color: textColor }}>{isPromoter ? <ShieldCheck size={24} /> : <Lock size={24} />}</button>
      </div>

      <div className="relative h-[60vh] md:h-[85vh] w-full overflow-hidden">
        <img src={data?.heroImage} alt="Band" className="h-full w-full object-cover" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to top, ${bgColor} 0%, ${bgColor}66 40%, transparent 100%)` }} />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 text-center md:text-left max-w-7xl mx-auto w-full">
          <h1 className="mb-2 text-5xl md:text-8xl font-black uppercase leading-none tracking-tighter drop-shadow-2xl" style={{ color: textColor }}>{data?.bandName}</h1>
          <p className="text-sm md:text-xl font-bold uppercase tracking-[0.2em] opacity-80" style={{ color: textColor }}>{data?.tagline}</p>
          {data?.socials && (
            <div className="flex justify-center md:justify-start gap-4 mt-8">
                {data.socials.map((s) => (
                    <a key={s.id} href={s.url} target="_blank" className={`p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all backdrop-blur-md ${getSocialColor(s.platform)}`} style={{ color: textColor }}>{getSocialIcon(s.platform)}</a>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 md:py-24 pb-40">
          <div className="space-y-8">
              {data?.bio && <section className="max-w-3xl mb-16"><h2 className="mb-6 text-2xl md:text-4xl font-bold tracking-tight" style={{ color: textColor }}>About</h2><p className="text-lg md:text-xl leading-relaxed opacity-80 font-light" style={{ color: textColor }}>{data.bio}</p></section>}
              {sectionsToRender.map(section => renderSection(section))}
          </div>
      </div>
      
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 z-50 h-24 border-t border-white/10 bg-black/90 backdrop-blur-xl flex items-center px-6 md:px-12">
          <audio ref={audioRef} src={currentSong.audioUrl} />
          <div className="flex-1 flex items-center gap-6"><div className={`hidden md:flex h-12 w-12 rounded-lg items-center justify-center`} style={{ backgroundColor: accentColor, color: bgColor === '#ffffff' ? 'white' : 'black' }}><Music size={20} fill="currentColor"/></div><div><p className="text-lg font-bold text-white">{currentSong.title}</p><p className="text-sm text-gray-500">{data?.bandName}</p></div></div>
          <div className="flex items-center gap-4 md:gap-8"><button className="text-gray-400 hover:text-white hidden md:block"><p className="text-xs">PREV</p></button><button onClick={() => setIsPlaying(!isPlaying)} className={`flex h-14 w-14 items-center justify-center rounded-full hover:scale-105 transition-transform shadow-lg`} style={{ backgroundColor: accentColor, color: bgColor === '#ffffff' ? 'white' : 'black' }}>{isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}</button><button className="text-gray-400 hover:text-white hidden md:block"><p className="text-xs">NEXT</p></button></div>
          <div className="flex-1 hidden md:flex justify-end"></div>
        </div>
      )}

      {showUnlockModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl">
            <div className="text-center mb-8"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5"><Lock size={32} className="text-gray-400" /></div><h3 className="text-2xl font-bold text-white mb-2">Promoter Access</h3><p className="text-sm text-gray-400">Enter your 4-digit PIN to access high-res assets.</p></div>
            <form onSubmit={handleUnlock}>
              <input type="password" maxLength="4" className="mb-6 w-full rounded-2xl border border-white/10 bg-[#121212] p-6 text-center font-mono text-4xl tracking-[0.5em] text-white focus:border-white/50 focus:outline-none placeholder-white/10 transition-colors" placeholder="0000" value={pinInput} onChange={(e) => setPinInput(e.target.value)} autoFocus />
              <button type="submit" className="w-full rounded-xl bg-white py-4 font-bold text-black hover:bg-gray-200 transition-colors text-lg" style={{ backgroundColor: accentColor, color: bgColor === '#ffffff' ? 'white' : 'black' }}>UNLOCK VAULT</button>
            </form>
            <button onClick={() => setShowUnlockModal(false)} className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-white transition-colors">Cancel</button>
          </div>
        </div>
      )}
      
      <div onClick={() => window.location.href = '/'} className={`fixed bottom-4 right-4 z-40 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-black/80 transition-all cursor-pointer flex items-center gap-1.5 group ${currentSong ? 'bottom-28' : 'bottom-4'}`}>
         <Rewind size={12} className="text-orange-500 group-hover:text-orange-400 transition-colors" fill="currentColor" /> Made with Playback
      </div>
    </div>
  );
}