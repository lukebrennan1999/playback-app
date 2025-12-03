import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase.js'; // Explicit .js extension
import { Loader, AlertTriangle } from 'lucide-react';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PublicEPK from './pages/PublicEPK';

function RequireAuth({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (!auth) {
        console.error("Auth instance is undefined.");
        setError("Database connection failed. Check src/lib/firebase.js keys.");
        setLoading(false);
        return;
    }

    try {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        }, (err) => {
            console.error("Auth Error:", err);
            setError(err.message);
            setLoading(false);
        });
        return () => unsubscribe();
    } catch (err) {
        console.error("Listener Crash:", err);
        setError("Failed to verify identity.");
        setLoading(false);
    }
  }, []);

  if (loading) return <div className="flex h-screen w-full items-center justify-center bg-black text-white"><Loader className="animate-spin text-orange-500" size={32} /></div>;

  if (error) return (
    <div className="flex h-screen w-full items-center justify-center bg-black text-red-500 flex-col gap-4 p-4 text-center">
        <div className="bg-red-500/10 p-4 rounded-full"><AlertTriangle size={32} /></div>
        <h2 className="text-xl font-bold text-white">System Error</h2>
        <p className="text-gray-400">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors">Reload Page</button>
    </div>
  );

  if (!user) return <Navigate to="/" state={{ from: location }} replace />;

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/:bandId" element={<PublicEPK />} />
    </Routes>
  );
}