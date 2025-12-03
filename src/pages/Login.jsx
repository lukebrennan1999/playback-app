import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously 
} from 'firebase/auth';
import { auth } from '../lib/firebase'; // Standard import without .js extension
import { Rewind, Loader, Smartphone, ShieldCheck, BarChart3, Zap, Music, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Email Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (err) {
      console.error("Login Error:", err);
      setError("Could not sign in with Google. Please try again.");
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error("Auth Error:", err);
      const msg = err.message.includes('invalid-credential') ? "Invalid email or password." : 
                  err.message.includes('email-already-in-use') ? "Email already in use." : 
                  err.message.includes('weak-password') ? "Password should be at least 6 characters." :
                  "Authentication failed. Please try again.";
      setError(msg);
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      navigate('/dashboard');
    } catch (err) {
      console.error("Demo Login Error:", err);
      setError("Demo mode failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0a0908] text-white selection:bg-orange-500/30">
      
      {/* LEFT SIDE: The Pitch */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-[#0f0e0d] border-r border-white/5 flex-col justify-between p-16">
        
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-bold tracking-widest uppercase text-orange-400 mb-8">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                v2.0 Now Live
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-tight mb-6">
                Rewind your story.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Get booked.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-md leading-relaxed font-light">
                The multimedia platform for artists shaping music culture. Create a stunning, mobile-first press kit in minutes.
            </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8 mt-12">
            <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 mb-3"><Smartphone size={20}/></div>
                <h3 className="font-bold text-lg">Mobile First</h3>
                <p className="text-sm text-gray-500">Built for the devices promoters actually use.</p>
            </div>
            <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 mb-3"><ShieldCheck size={20}/></div>
                <h3 className="font-bold text-lg">Secure Vault</h3>
                <p className="text-sm text-gray-500">Protect tech riders & contracts with a PIN.</p>
            </div>
            <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 mb-3"><BarChart3 size={20}/></div>
                <h3 className="font-bold text-lg">Real Analytics</h3>
                <p className="text-sm text-gray-500">See exactly when promoters open your link.</p>
            </div>
            <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 mb-3"><Rewind size={20}/></div>
                <h3 className="font-bold text-lg">Instant Playback</h3>
                <p className="text-sm text-gray-500">Update your bio or photos in seconds.</p>
            </div>
        </div>

        <div className="relative z-10 text-sm text-gray-600 font-mono">
            Analog soul, digital power.
        </div>
      </div>

      {/* RIGHT SIDE: The Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md space-y-6">
            
            <div className="lg:hidden text-center mb-8">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-red-600 shadow-xl mb-4">
                    <Rewind size={32} className="text-white fill-white" />
                </div>
                <h1 className="text-3xl font-black tracking-tighter">PLAYBACK</h1>
                <p className="text-gray-400">Rewind the story.</p>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-1">{isSignUp ? "Create Account" : "Welcome"}</h2>
                    <p className="text-gray-400 text-sm">
                        {isSignUp ? "Get started with your professional EPK." : "Log in to manage your artist profile."}
                    </p>
                </div>

                <div className="space-y-4">
                    <button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="group w-full flex items-center justify-center gap-3 bg-white text-black font-bold h-12 rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                    {loading && !email ? (
                        <Loader size={20} className="animate-spin" />
                    ) : (
                        <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                        <span>Continue with Google</span>
                        </>
                    )}
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase tracking-widest">Or with email</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-3">
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="email" 
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                                    required
                                />
                            </div>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="password" 
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-600 text-white font-bold h-12 rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && email ? <Loader size={18} className="animate-spin" /> : null}
                            <span>{isSignUp ? "Sign Up" : "Log In"}</span>
                        </button>
                    </form>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                        {error}
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <button 
                        onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        {isSignUp ? "Already have an account? " : "New to Playback? "}
                        <span className="text-orange-500 font-bold hover:underline">{isSignUp ? "Log In" : "Sign Up"}</span>
                    </button>
                </div>
            </div>
            
            <div className="text-center">
                <button 
                    onClick={handleDemoLogin} 
                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                    Just looking? <span className="underline">View Demo Mode</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}