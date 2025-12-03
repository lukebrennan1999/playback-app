import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Edit3, Check, Save, Loader, Plus, Trash2, 
  Music, Calendar, Video, Upload, Link as LinkIcon, FileText, 
  Download, Home, BarChart2, Share2, Copy, Mail, User, Palette, Type, ChevronDown, Lock, QrCode, FileDown,
  Facebook, Globe, Twitter, Instagram, Youtube, Disc, CloudLightning, Smartphone, Laptop, MousePointer, Layout, ArrowUp, ArrowDown, Eye, EyeOff, Rewind
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, storage } from '../lib/firebase.js'; // Explicit extension

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const THEMES = {
  blue: { name: "Electric Blue", bg: "bg-blue-500" },
  red: { name: "Crimson Red", bg: "bg-red-500" },
  green: { name: "Emerald Green", bg: "bg-green-500" },
  purple: { name: "Neon Purple", bg: "bg-purple-500" },
};

const FONT_OPTIONS = [
  { label: 'Modern Sans (Inter)', value: 'font-sans', class: 'font-sans' },
  { label: 'Elegant Serif (Playfair)', value: 'font-serif', class: 'font-serif' },
  { label: 'Tech Mono (Space)', value: 'font-mono', class: 'font-mono' },
  { label: 'Classic (Georgia)', value: "font-['Georgia']", class: "font-['Georgia']" },
  { label: 'Clean (Verdana)', value: "font-['Verdana']", class: "font-['Verdana']" },
  { label: 'Retro (Courier)', value: "font-['Courier_New']", class: "font-['Courier_New']" },
];

const PLATFORM_OPTIONS = [
  { value: 'spotify', label: 'Spotify' },
  { value: 'apple', label: 'Apple Music' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'soundcloud', label: 'SoundCloud' },
  { value: 'bandcamp', label: 'Bandcamp' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'website', label: 'Website' },
];

const DEFAULT_SECTIONS = [
    { id: 'contact', type: 'contact', title: 'Contact', visible: true },
    { id: 'vault', type: 'vault', title: 'The Vault Assets', visible: true },
    { id: 'songs', type: 'songs', title: 'Songs', visible: true },
    { id: 'videos', type: 'videos', title: 'Videos', visible: true },
    { id: 'tour', type: 'tour', title: 'Tour Dates', visible: true },
    { id: 'press', type: 'press', title: 'Press & Reviews', visible: true },
];

// Helper: Setup User Profile
async function setupUserEPK(uid, displayName, email) {
    const docRef = doc(db, "bands", uid); 
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        const newProfile = {
            bandName: displayName || "New Artist",
            tagline: "New Artist Profile",
            bio: "Welcome! Describe your sound, mission, and achievements here.",
            views: 0,
            vaultUnlocks: 0,
            vaultPin: "1234",
            dailyViews: {},
            stats: { mobile: 0, desktop: 0, downloads: {}, linkClicks: {} },
            heroImage: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=2874&auto=format&fit=crop",
            songs: [], tour: [], videos: [], press: [], socials: [],
            vault: { techRider: "", pressPhotos: "" },
            manager: { name: displayName || "", email: email || "" },
            font: 'font-sans',
            colors: { background: '#050505', accent: '#3b82f6', font: '#ffffff' },
            sections: DEFAULT_SECTIONS,
            createdAt: serverTimestamp()
        };
        await setDoc(docRef, newProfile);
        return newProfile;
    }
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  
  const [showFontMenu, setShowFontMenu] = useState(false);
  const fontMenuRef = useRef(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      const targetUid = currentUser ? currentUser.uid : 'neon-echo'; 
      const targetName = currentUser?.displayName || 'Neon Echo';
      const targetEmail = currentUser?.email || '';
      
      setUser(currentUser || { uid: targetUid, displayName: targetName });

      try {
        const profile = await setupUserEPK(targetUid, targetName, targetEmail);
        setData(profile);
      } catch(e) {
          console.error("Dashboard Setup Error:", e);
      }
      setLoading(false);
    });

    const handleClickOutside = (event) => {
        if (fontMenuRef.current && !fontMenuRef.current.contains(event.target)) {
            setShowFontMenu(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        unsubscribe();
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSave = async () => {
    if (!user || !data) return;
    setSaving(true);
    try {
      const docRef = doc(db, "bands", user.uid);
      await setDoc(docRef, data);
      showToast("✅ Saved to Cloud!");
    } catch (error) {
      console.error("Error saving data:", error);
      showToast("❌ Error Saving");
    }
    setSaving(false);
  };

  const handleFileUpload = async (e, type, id = null) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    if (file.size > MAX_FILE_SIZE) {
        showToast("❌ File too large (Max 10MB)");
        e.target.value = null;
        return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `uploads/${user.uid}/${type}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      if (type === 'hero') setData({ ...data, heroImage: url });
      else if (type === 'techRider') setData({ ...data, vault: { ...data.vault, techRider: url } });
      else if (type === 'pressPhotos') setData({ ...data, vault: { ...data.vault, pressPhotos: url } });
      else if (type === 'audio') {
        const updatedSongs = data.songs.map(s => s.id === id ? { ...s, audioUrl: url } : s);
        setData({ ...data, songs: updatedSongs });
      } else if (type === 'custom_image' || type === 'custom_audio') {
          const newSections = data.sections.map(s => s.id === id ? { ...s, fileUrl: url } : s);
          setData({ ...data, sections: newSections });
      }
      showToast("File Uploaded!");
    } catch (error) {
      console.error("Upload failed", error);
      showToast("❌ Upload Failed");
    }
    setUploading(false);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // State Updaters...
  const moveSection = (index, direction) => {
      const newSections = [...data.sections];
      if (direction === 'up' && index > 0) [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
      else if (direction === 'down' && index < newSections.length - 1) [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      setData({ ...data, sections: newSections });
  };
  const toggleSectionVisibility = (index) => {
      const newSections = [...data.sections];
      newSections[index].visible = !newSections[index].visible;
      setData({ ...data, sections: newSections });
  };
  const addCustomSection = () => {
      const newSection = { id: `custom_${Date.now()}`, type: 'custom', title: 'New Section', contentType: 'text', content: '', url: '', fileUrl: '', visible: true };
      setData({ ...data, sections: [...(data.sections || []), newSection] });
  };
  const deleteSection = (index) => {
      const newSections = [...data.sections];
      newSections.splice(index, 1);
      setData({ ...data, sections: newSections });
  };
  const updateCustomSection = (id, field, value) => {
      const newSections = data.sections.map(s => s.id === id ? { ...s, [field]: value } : s);
      setData({ ...data, sections: newSections });
  };

  const addSong = () => setData({ ...data, songs: [...(data.songs || []), { id: Date.now(), title: "New Track", duration: "0:00", audioUrl: "" }] });
  const removeSong = (id) => setData({ ...data, songs: data.songs.filter(s => s.id !== id) });
  const updateSong = (id, field, val) => setData({ ...data, songs: data.songs.map(s => s.id === id ? { ...s, [field]: val } : s) });
  
  const addTour = () => { 
      const today = new Date().toISOString().split('T')[0];
      setData({ ...data, tour: [...(data.tour || []), { id: Date.now(), date: today, venue: "Venue", city: "City", ticketUrl: "" }] });
  };
  const removeTour = (id) => setData({ ...data, tour: data.tour.filter(t => t.id !== id) });
  const updateTour = (id, field, val) => setData({ ...data, tour: data.tour.map(t => t.id === id ? { ...t, [field]: val } : t) });

  const addVideo = () => setData({ ...data, videos: [...(data.videos || []), { id: Date.now(), title: "New Video", url: "" }] });
  const removeVideo = (id) => setData({ ...data, videos: data.videos.filter(v => v.id !== id) });
  const updateVideo = (id, field, val) => setData({ ...data, videos: data.videos.map(v => v.id === id ? { ...v, [field]: val } : v) });

  const addPress = () => setData({ ...data, press: [...(data.press || []), { id: Date.now(), publication: "Publication", quote: "Quote...", link: "" }] });
  const removePress = (id) => setData({ ...data, press: data.press.filter(p => p.id !== id) });
  const updatePress = (id, field, val) => setData({ ...data, press: data.press.map(p => p.id === id ? { ...p, [field]: val } : p) });

  const addSocial = () => setData({ ...data, socials: [...(data.socials || []), { id: Date.now(), platform: 'instagram', url: '' }] });
  const removeSocial = (id) => setData({ ...data, socials: data.socials.filter(s => s.id !== id) });
  const updateSocial = (id, field, val) => { 
      let newPlatform = null;
      if (field === 'url') {
          if (val.includes('spotify')) newPlatform = 'spotify';
          else if (val.includes('instagram')) newPlatform = 'instagram';
      }
      setData({ ...data, socials: data.socials.map(s => {
          if (s.id !== id) return s;
          const updated = { ...s, [field]: val };
          if (newPlatform) updated.platform = newPlatform; 
          return updated;
      })});
  };

  const getChartData = () => {
    if (!data?.dailyViews) return [];
    const sortedDates = Object.keys(data.dailyViews).sort().slice(-7);
    return sortedDates.map(date => {
        const d = new Date(date);
        return {
            label: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            value: data.dailyViews[date]
        };
    });
  };

  const handleDownloadQR = async () => {
    try {
        const epkUrl = `${window.location.protocol}//${window.location.host}/${user?.uid}`;
        const qrColor = data?.colors?.font?.replace('#', '') || 'ffffff';
        const qrBgColor = data?.colors?.background?.replace('#', '') || '050505';
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(epkUrl)}&color=${qrColor}&bgcolor=${qrBgColor}`;
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `${data.bandName.replace(/\s+/g, '_')}_QR.png`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showToast("QR Code Downloaded!");
    } catch (error) {
        console.error(error);
        showToast("Download failed.");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-black text-white">Loading...</div>;
  if (!data) return <div className="flex h-screen items-center justify-center bg-black text-white">No Data</div>;

  const chartData = getChartData();
  const maxView = chartData.length > 0 ? Math.max(...chartData.map(d => d.value), 10) : 10;
  const totalMobile = data?.stats?.mobile || 0;
  const totalDesktop = data?.stats?.desktop || 0;
  const totalVisits = totalMobile + totalDesktop || 1; 
  const topDownloads = Object.entries(data?.stats?.downloads || {}).sort(([,a], [,b]) => b - a).slice(0, 3);
  const epkUrl = `${window.location.protocol}//${window.location.host}/${user?.uid}`;

  // RENDER HELPERS
  const renderSectionContent = (section) => {
      switch(section.type) {
          case 'contact': return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-xs text-gray-500 mb-1 block">Contact Name</label><input type="text" value={data.manager?.name || ""} onChange={(e) => setData({...data, manager: {...data.manager, name: e.target.value}})} className="w-full rounded-lg border border-white/10 bg-black p-3 text-white focus:outline-none" /></div>
                    <div><label className="text-xs text-gray-500 mb-1 block">Contact Email</label><input type="email" value={data.manager?.email || ""} onChange={(e) => setData({...data, manager: {...data.manager, email: e.target.value}})} className="w-full rounded-lg border border-white/10 bg-black p-3 text-white focus:outline-none" /></div>
                </div>
              );
          case 'vault': return (
                <div className="space-y-4">
                    <div className="mb-4 p-4 bg-black/30 rounded-lg border border-white/10"><label className="text-xs text-gray-500 mb-2 block uppercase tracking-wider">Access PIN</label><div className="flex items-center gap-4"><div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/10"><Lock size={20} className="text-gray-400"/></div><input type="text" maxLength="4" value={data.vaultPin || "1234"} onChange={(e) => setData({...data, vaultPin: e.target.value.replace(/\D/g,'')})} className="bg-transparent text-xl font-mono tracking-widest text-white outline-none w-24 border-b border-white/20 focus:border-white" /></div></div>
                    <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/10"><div className="flex items-center gap-3"><FileText className="text-blue-500" size={20} /><div><p className="text-sm font-bold">Tech Rider (PDF)</p><p className="text-xs text-gray-500">{data.vault?.techRider ? "File Uploaded ✅" : "No file yet"}</p></div></div><label className="cursor-pointer text-xs bg-white/10 px-3 py-2 rounded hover:bg-white/20">Upload PDF <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'techRider')} /></label></div>
                    <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/10"><div className="flex items-center gap-3"><Download className="text-green-500" size={20} /><div><p className="text-sm font-bold">Press Photos (ZIP)</p><p className="text-xs text-gray-500">{data.vault?.pressPhotos ? "File Uploaded ✅" : "No file yet"}</p></div></div><label className="cursor-pointer text-xs bg-white/10 px-3 py-2 rounded hover:bg-white/20">Upload ZIP <input type="file" accept=".zip,.rar" className="hidden" onChange={(e) => handleFileUpload(e, 'pressPhotos')} /></label></div>
                </div>
              );
          case 'songs': return (
                <div className="space-y-3">
                    <div className="flex justify-end mb-2"><button onClick={addSong} className="text-xs flex items-center gap-1 bg-white/10 px-2 py-1 rounded hover:bg-white/20"><Plus size={12}/> Add Song</button></div>
                    {(data.songs || []).map((song) => (
                        <div key={song.id} className="flex items-center gap-3 rounded-lg bg-black/50 p-3">
                        <input type="text" value={song.title} onChange={(e) => updateSong(song.id, 'title', e.target.value)} className="flex-1 bg-transparent font-medium text-white focus:outline-none" placeholder="Song Title" />
                        <input type="text" value={song.duration} onChange={(e) => updateSong(song.id, 'duration', e.target.value)} className="w-16 bg-transparent text-right text-sm text-gray-500 focus:outline-none" placeholder="3:00" />
                        <label className={`cursor-pointer p-2 rounded-lg transition-colors ${song.audioUrl ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white hover:bg-white/20'}`}>{uploading ? <Loader className="animate-spin" size={16}/> : <Upload size={16} />}<input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'audio', song.id)} /></label>
                        <button onClick={() => removeSong(song.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                        </div>
                    ))}
                </div>
              );
          case 'videos': return (
                <div className="space-y-3">
                    <div className="flex justify-end mb-2"><button onClick={addVideo} className="text-xs flex items-center gap-1 bg-white/10 px-2 py-1 rounded hover:bg-white/20"><Plus size={12}/> Add Video</button></div>
                    {(data.videos || []).map(vid => (<div key={vid.id} className="flex gap-2 bg-black/50 p-3 rounded-lg"><input value={vid.title} onChange={(e)=>updateVideo(vid.id,'title',e.target.value)} className="bg-transparent flex-1 outline-none"/><input value={vid.url} onChange={(e)=>updateVideo(vid.id,'url',e.target.value)} className="bg-transparent w-full text-xs text-gray-500 outline-none" placeholder="YouTube URL"/><button onClick={()=>removeVideo(vid.id)}><Trash2 size={16} className="text-red-500"/></button></div>))}
                </div>
              );
          case 'tour': return (
                <div className="space-y-3">
                    <div className="flex justify-end mb-2"><button onClick={addTour} className="text-xs flex items-center gap-1 bg-white/10 px-2 py-1 rounded hover:bg-white/20"><Plus size={12}/> Add Date</button></div>
                    {(data.tour || []).map(t => (
                        <div key={t.id} className="flex flex-col gap-2 bg-black/50 p-3 rounded-lg">
                            <div className="flex gap-2 items-center"><input type="date" value={t.date} onChange={(e)=>updateTour(t.id,'date',e.target.value)} className="bg-transparent text-sm text-gray-300 outline-none p-2 rounded hover:bg-white/5" /><input value={t.venue} onChange={(e)=>updateTour(t.id,'venue',e.target.value)} className="bg-transparent flex-1 font-bold outline-none" placeholder="Venue"/><input value={t.city} onChange={(e)=>updateTour(t.id,'city',e.target.value)} className="bg-transparent w-24 text-sm text-gray-400 outline-none" placeholder="City"/><button onClick={()=>removeTour(t.id)}><Trash2 size={16} className="text-red-500"/></button></div>
                            <input value={t.ticketUrl} onChange={(e)=>updateTour(t.id,'ticketUrl',e.target.value)} className="bg-black/30 p-2 text-xs w-full outline-none" placeholder="Ticket Link"/>
                        </div>
                      ))}
                </div>
              );
          case 'press': return (
                <div className="space-y-3">
                    <div className="flex justify-end mb-2"><button onClick={addPress} className="text-xs flex items-center gap-1 bg-white/10 px-2 py-1 rounded hover:bg-white/20"><Plus size={12}/> Add Review</button></div>
                    {(data.press || []).map(p => (
                        <div key={p.id} className="flex flex-col gap-2 bg-black/50 p-3 rounded-lg">
                            <div className="flex gap-2"><input value={p.publication} onChange={(e)=>updatePress(p.id,'publication',e.target.value)} className="bg-transparent font-bold w-1/3 outline-none text-white" placeholder="Publication Name" /><input value={p.link} onChange={(e)=>updatePress(p.id,'link',e.target.value)} className="bg-transparent text-blue-400 text-sm flex-1 outline-none" placeholder="Link URL" /><button onClick={()=>removePress(p.id)}><Trash2 size={16} className="text-red-500"/></button></div>
                            <input value={p.quote} onChange={(e)=>updatePress(p.id,'quote',e.target.value)} className="bg-transparent text-sm text-gray-400 w-full outline-none italic border-t border-white/5 pt-2" placeholder="Quote..." />
                        </div>
                    ))}
                </div>
              );
          case 'custom': return (
                  <div className="space-y-4">
                      <div className="flex gap-4">
                          <div className="flex-1"><input type="text" value={section.title} onChange={(e) => updateCustomSection(section.id, 'title', e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-2 text-white font-bold" placeholder="Section Title"/></div>
                          <select value={section.contentType || 'text'} onChange={(e) => updateCustomSection(section.id, 'contentType', e.target.value)} className="bg-black border border-white/10 rounded-lg p-2 text-sm text-gray-400 outline-none"><option value="text">Text</option><option value="image">Image</option><option value="video">Video</option><option value="link">Link</option><option value="audio">Audio</option></select>
                      </div>
                      {(!section.contentType || section.contentType === 'text') && (<textarea value={section.content} onChange={(e) => updateCustomSection(section.id, 'content', e.target.value)} className="w-full h-24 bg-black border border-white/10 rounded-lg p-2 text-sm text-white resize-none" placeholder="Add text content..."/>)}
                      {section.contentType === 'image' && (<div className="border border-dashed border-white/10 rounded-lg p-4 text-center">{section.fileUrl ? (<div className="relative w-full h-48 mb-3"><img src={section.fileUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" /><button onClick={() => updateCustomSection(section.id, 'fileUrl', '')} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-red-500 transition-colors"><Trash2 size={14}/></button></div>) : (<label className="cursor-pointer flex flex-col items-center gap-2 text-gray-500 hover:text-white transition-colors"><Upload size={24} /><span className="text-xs">Upload Image (Max 10MB)</span><input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'custom_image', section.id)} /></label>)}</div>)}
                      {section.contentType === 'video' && (<input type="text" value={section.url || ''} onChange={(e) => updateCustomSection(section.id, 'url', e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white" placeholder="Paste YouTube/Vimeo URL..."/>)}
                      {section.contentType === 'link' && (<div className="space-y-2"><input type="text" value={section.content || ''} onChange={(e) => updateCustomSection(section.id, 'content', e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white" placeholder="Link Label"/><input type="text" value={section.url || ''} onChange={(e) => updateCustomSection(section.id, 'url', e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white" placeholder="https://..."/></div>)}
                      {section.contentType === 'audio' && (<div className="border border-white/10 rounded-lg p-3 flex items-center justify-between"><div className="flex items-center gap-3"><Music size={20} className="text-gray-400"/><div className="text-sm">{section.fileUrl ? <span className="text-green-400">Audio Uploaded</span> : <span className="text-gray-500">No audio file</span>}</div></div><label className="cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-xs flex items-center gap-2 transition-colors">{uploading ? <Loader size={12} className="animate-spin"/> : <Upload size={12}/>}<span>{section.fileUrl ? 'Replace' : 'Upload'}</span><input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'custom_audio', section.id)} /></label></div>)}
                  </div>
              );
          default: return null;
      }
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0908] text-white selection:bg-orange-500/30">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col border-r border-white/10 bg-[#0f0e0d] md:flex">
        <div className="p-6 flex items-center gap-2"><div className="text-orange-500"><Rewind size={24} fill="currentColor" /></div><h1 className="text-2xl font-bold tracking-tighter">PLAYBACK</h1></div>
        <div className="flex-1 px-3 py-4 space-y-1">
            <button onClick={() => setActiveTab('home')} className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 transition-colors ${activeTab === 'home' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><Home size={20} /><span className="font-medium">Overview</span></button>
            <button onClick={() => setActiveTab('editor')} className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 transition-colors ${activeTab === 'editor' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><Edit3 size={20} /><span className="font-medium">Edit EPK</span></button>
            <button onClick={() => setActiveTab('analytics')} className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 transition-colors ${activeTab === 'analytics' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><BarChart2 size={20} /><span className="font-medium">Analytics</span></button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 rounded-full bg-white px-6 py-3 text-black z-50 shadow-xl">{toast}</div>}

          {activeTab === 'home' && (
            <div className="space-y-8 animate-fade-in">
                <div><h2 className="text-3xl font-bold">Welcome back</h2><p className="text-gray-400">Your EPK Overview.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    <div className="p-6 rounded-2xl bg-[#111] border border-white/5 h-full flex flex-col justify-center"><p className="text-sm text-gray-400 mb-2">Total Views</p><p className="text-4xl font-bold text-white">{data.views || 0}</p></div>
                    <div className="p-6 rounded-2xl bg-[#111] border border-white/5 h-full flex flex-col justify-center"><p className="text-sm text-gray-400 mb-2">Active Songs</p><p className="text-4xl font-bold text-white">{data.songs?.length || 0}</p></div>
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/20 h-full flex flex-col justify-between">
                        <div><p className="text-sm text-orange-200 mb-2">Your EPK Link</p><div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/10"><code className="text-xs text-orange-300 truncate flex-1">playback.app/neon-echo</code><button onClick={() => {navigator.clipboard.writeText('https://playback-app.vercel.app/neon-echo'); showToast("Link Copied!")}} className="p-1 hover:text-white text-gray-400"><Copy size={14}/></button></div></div>
                        <button onClick={() => window.open('/neon-echo', '_blank')} className="mt-4 w-full py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"><Share2 size={16}/> View Live Page</button>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8 animate-fade-in">
                <div><h2 className="text-3xl font-bold">Analytics</h2><p className="text-gray-400">Track how visitors engage.</p></div>
                <div className="p-8 rounded-2xl bg-[#111] border border-white/5"><h3 className="text-lg font-bold mb-8">Views over time</h3><div className="h-64 flex items-end justify-between gap-4">{chartData.length > 0 ? chartData.map((d, i) => (<div key={i} className="flex-1 flex flex-col justify-end h-full group"><div style={{ height: `${(d.value / maxView) * 100}%` }} className="w-full bg-orange-600/50 hover:bg-orange-500 transition-all rounded-t-sm relative min-h-[4px]"><div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">{d.value}</div></div><p className="text-xs text-gray-500 text-center mt-2">{d.label}</p></div>)) : (<p className="w-full text-center text-gray-600 self-center">No view data yet.</p>)}</div></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    <div className="p-6 rounded-2xl bg-[#111] border border-white/5 h-full flex flex-col"><h3 className="font-bold mb-4">Engagement</h3><div className="grid grid-cols-2 gap-4 text-center flex-1 items-center"><div className="p-4 bg-white/5 rounded-xl flex flex-col justify-center h-full"><p className="text-2xl font-bold text-white">{data.vaultUnlocks || 0}</p><p className="text-xs text-gray-500">Unlocks</p></div><div className="p-4 bg-white/5 rounded-xl flex flex-col justify-center h-full"><p className="text-2xl font-bold text-white">{data.views > 0 ? Math.round((data.vaultUnlocks / data.views) * 100) : 0}%</p><p className="text-xs text-gray-500">Conv.</p></div></div></div>
                    <div className="p-6 rounded-2xl bg-[#111] border border-white/5 h-full flex flex-col"><h3 className="font-bold mb-4">Device</h3><div className="space-y-4 flex-1 flex flex-col justify-center"><div><div className="flex justify-between text-sm mb-1"><span className="flex items-center gap-2 text-gray-400"><Smartphone size={14}/> Mobile</span><span>{Math.round((totalMobile / totalVisits) * 100)}%</span></div><div className="w-full bg-white/5 h-2 rounded-full"><div className="bg-orange-500 h-full rounded-full" style={{width: `${(totalMobile/totalVisits)*100}%`}}></div></div></div><div><div className="flex justify-between text-sm mb-1"><span className="flex items-center gap-2 text-gray-400"><Laptop size={14}/> Desktop</span><span>{Math.round((totalDesktop / totalVisits) * 100)}%</span></div><div className="w-full bg-white/5 h-2 rounded-full"><div className="bg-blue-500 h-full rounded-full" style={{width: `${(totalDesktop/totalVisits)*100}%`}}></div></div></div></div></div>
                    <div className="p-6 rounded-2xl bg-[#111] border border-white/5 h-full flex flex-col"><h3 className="font-bold mb-4">Downloads</h3><div className="flex-1 flex flex-col justify-center">{topDownloads.length > 0 ? (<div className="space-y-3">{topDownloads.map(([name, count]) => (<div key={name} className="flex justify-between items-center p-3 bg-white/5 rounded-lg"><span className="text-xs capitalize text-gray-300 truncate w-24">{name}</span><span className="text-xs font-bold">{count}</span></div>))}</div>) : (<p className="text-sm text-gray-600 text-center">No data.</p>)}</div></div>
                </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="space-y-8 animate-fade-in">
                <div className="flex items-center justify-between"><h2 className="text-3xl font-bold">Edit Content</h2><button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 font-bold hover:bg-orange-500 disabled:opacity-50">{saving ? <Loader className="animate-spin" size={20}/> : <Save size={20} />}<span>{saving ? "Saving..." : "Save Changes"}</span></button></div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/5 bg-[#111] p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-xl font-bold"><Palette size={20} /> Design & Colors</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg"><span className="text-sm text-gray-400">Background</span><div className="flex items-center gap-2"><span className="text-xs font-mono text-gray-500">{data.colors?.background}</span><input type="color" value={data.colors?.background || '#050505'} onChange={(e) => setData({...data, colors: {...data.colors, background: e.target.value}})} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" /></div></div>
                            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg"><span className="text-sm text-gray-400">Accent Color</span><div className="flex items-center gap-2"><span className="text-xs font-mono text-gray-500">{data.colors?.accent}</span><input type="color" value={data.colors?.accent || '#3b82f6'} onChange={(e) => setData({...data, colors: {...data.colors, accent: e.target.value}})} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" /></div></div>
                            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg"><span className="text-sm text-gray-400">Font Color</span><div className="flex items-center gap-2"><span className="text-xs font-mono text-gray-500">{data.colors?.font}</span><input type="color" value={data.colors?.font || '#ffffff'} onChange={(e) => setData({...data, colors: {...data.colors, font: e.target.value}})} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" /></div></div>
                             <div className="pt-2 border-t border-white/10" ref={fontMenuRef}><label className="flex items-center gap-2 text-sm text-gray-400 mb-2"><Type size={14}/> Typography</label><div className="relative"><button onClick={() => setShowFontMenu(!showFontMenu)} className="w-full flex items-center justify-between bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white hover:border-white/30 transition-colors"><span className={FONT_OPTIONS.find(f => f.value === data.font)?.class}>{FONT_OPTIONS.find(f => f.value === data.font)?.label || "Select Font"}</span><ChevronDown size={16} className={`text-gray-500 transition-transform ${showFontMenu ? 'rotate-180' : ''}`}/></button>{showFontMenu && (<div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">{FONT_OPTIONS.map((opt) => (<button key={opt.value} onClick={() => { setData({...data, font: opt.value}); setShowFontMenu(false); }} className={`w-full text-left px-4 py-3 text-sm hover:bg-white/5 flex items-center justify-between group ${data.font === opt.value ? 'bg-white/5 text-white' : 'text-gray-400'}`}><span className={`${opt.class} text-base`}>{opt.label}</span>{data.font === opt.value && <Check size={14} className="text-blue-500" />}</button>))}</div>)}</div></div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-[#111] p-6"><h3 className="mb-4 flex items-center gap-2 text-xl font-bold"><Upload size={20} /> Hero Image</h3><div className="flex items-center gap-4"><img src={data.heroImage} alt="Hero" className="h-24 w-24 rounded-lg object-cover border border-white/10 bg-black" /><label className="flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20 transition-colors h-10">{uploading ? <Loader className="animate-spin" size={16}/> : <Upload size={16} />}<span className="text-sm font-medium">{uploading ? "Uploading..." : "Change"}</span><input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'hero')} /></label></div></div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-[#111] p-6">
                    <div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 text-xl font-bold"><Edit3 size={20} /> Details & Links</h3><button onClick={addSocial} className="rounded-full bg-white/10 p-2 hover:bg-white/20 flex items-center gap-1 text-sm font-bold"><Plus size={14} /> Add Link</button></div>
                    <div className="space-y-4"><input type="text" value={data.bandName} onChange={(e) => setData({...data, bandName: e.target.value})} className="w-full rounded-lg border border-white/10 bg-black p-3 text-white focus:outline-none" placeholder="Band Name" /><input type="text" value={data.tagline} onChange={(e) => setData({...data, tagline: e.target.value})} className="w-full rounded-lg border border-white/10 bg-black p-3 text-white focus:outline-none" placeholder="Tagline" /><textarea value={data.bio} onChange={(e) => setData({...data, bio: e.target.value})} className="h-24 w-full resize-none rounded-lg border border-white/10 bg-black p-3 text-white focus:outline-none" placeholder="Bio" /><div className="grid grid-cols-1 gap-3 pt-4 border-t border-white/10"><label className="text-xs text-gray-500 uppercase font-bold mb-1">Social Profiles</label>{(data.socials || []).map(social => (<div key={social.id} className="flex gap-2 items-center bg-black/30 p-2 rounded-lg border border-white/5"><select value={social.platform} onChange={(e) => updateSocial(social.id, 'platform', e.target.value)} className="bg-transparent border-r border-white/10 px-2 py-1 text-sm outline-none text-gray-400 hover:text-white cursor-pointer w-32">{PLATFORM_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select><input type="text" value={social.url} onChange={(e) => updateSocial(social.id, 'url', e.target.value)} className="flex-1 bg-transparent px-2 py-1 text-sm outline-none text-white" placeholder="Paste URL..."/><button onClick={() => removeSocial(social.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={16} /></button></div>))}</div></div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-400 border-b border-white/10 pb-2 mb-4">Content Sections</h3>
                    {data.sections?.map((section, index) => (
                        <div key={section.id} className="rounded-2xl border border-white/5 bg-[#111] p-6 relative group transition-all hover:border-white/20">
                            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3">
                                    {section.type === 'custom' ? (
                                        <input value={section.title} onChange={(e) => updateCustomSection(section.id, 'title', e.target.value)} className="text-xl font-bold bg-transparent border-b border-transparent hover:border-white/20 focus:border-white outline-none"/>
                                    ) : (
                                        <h3 className="text-xl font-bold flex items-center gap-2 capitalize"><Layout size={18} className="text-gray-500"/> {section.title}</h3>
                                    )}
                                </div>
                                <div className="flex items-center gap-2"><button onClick={() => toggleSectionVisibility(index)} className={`p-2 rounded hover:bg-white/10 ${section.visible ? 'text-green-400' : 'text-gray-600'}`}>{section.visible ? <Eye size={16}/> : <EyeOff size={16}/>}</button><div className="h-4 w-px bg-white/10"></div><button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-2 rounded hover:bg-white/10 disabled:opacity-30"><ArrowUp size={16}/></button><button onClick={() => moveSection(index, 'down')} disabled={index === data.sections.length - 1} className="p-2 rounded hover:bg-white/10 disabled:opacity-30"><ArrowDown size={16}/></button>{section.type === 'custom' && (<button onClick={() => deleteSection(index)} className="p-2 rounded hover:bg-red-900/20 text-red-500 ml-2"><Trash2 size={16}/></button>)}</div>
                            </div>
                            {section.visible && renderSectionContent(section)}
                            {!section.visible && <div className="text-center py-4 text-gray-600 text-sm italic">Section Hidden</div>}
                        </div>
                    ))}
                </div>

                <button onClick={addCustomSection} className="w-full py-4 rounded-xl border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 text-gray-400 font-bold flex items-center justify-center gap-2 transition-all"><Plus size={20} /> Add Custom Section</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}