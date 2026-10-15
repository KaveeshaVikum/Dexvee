import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from './firebase';

// Firebase returns codes like "auth/invalid-credential" — translate the
// common ones into something a shopper can act on.
function friendlyError(err) {
  switch (err?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'That email address doesn\'t look right.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/weak-password':
      return 'Please choose a stronger password (at least 8 characters).';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network problem. Check your connection and try again.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method. Sign in with the method you used originally.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method isn\'t switched on yet. Please try another method.';
    case 'auth/unauthorized-domain':
      return 'This website isn\'t authorized for sign-in yet. Please contact us.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export default function AuthPage({ user, authReady, onProfileUpdated }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  // Already signed in? Skip the form.
  useEffect(() => {
    if (authReady && user) navigate('/account', { replace: true });
  }, [authReady, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setInfo('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (isSignUp) {
      if (formData.password.length < 8) {
        setError('Please use a password with at least 8 characters.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setBusy(true);
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        if (formData.name.trim()) {
          await updateProfile(cred.user, { displayName: formData.name.trim() });
          onProfileUpdated?.();
        }
      } else {
        await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
      }
      navigate('/account');
    } catch (err) {
      console.error('Auth error:', err);
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSocial = async (provider) => {
    setError('');
    setInfo('');
    setBusy(true);
    try {
      await signInWithPopup(auth, provider);
      navigate('/account');
    } catch (err) {
      // Closing the pop-up yourself isn't an error worth showing.
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        console.error('Social sign-in error:', err);
        setError(friendlyError(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    setError('');
    setInfo('');
    if (!formData.email.trim()) {
      setError('Enter your email address above first, then click "Forgot password?".');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, formData.email.trim());
      setInfo('If an account exists for that email, a password reset link is on its way. Check your spam folder too.');
    } catch (err) {
      console.error('Reset error:', err);
      setError(friendlyError(err));
    }
  };

  const inputClass = 'w-full border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium outline-none focus:border-[#1A0F2E] bg-gray-50/50 focus:bg-white transition-all';

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden p-8 space-y-6">

        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex">
            <div className="bg-[#1A0F2E] p-3 rounded-2xl shadow-md inline-flex items-center justify-center">
              <img src="/logo.png" alt="Dexvee" className="h-10 w-auto object-contain" />
            </div>
          </Link>
          <h2 className="text-2xl font-black text-gray-800">{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
          <p className="text-xs font-medium text-gray-500">
            {isSignUp ? 'Sign up to start shopping and track your orders' : 'Sign in to view your orders and account'}
          </p>
        </div>

        <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center">
          <button type="button" onClick={() => { setIsSignUp(false); setError(''); setInfo(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${!isSignUp ? 'bg-[#1A0F2E] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}>
            Sign In
          </button>
          <button type="button" onClick={() => { setIsSignUp(true); setError(''); setInfo(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${isSignUp ? 'bg-[#1A0F2E] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}>
            Sign Up
          </button>
        </div>

        {/* Social sign-in */}
        <div className="space-y-3">
          <button type="button" disabled={busy} onClick={() => handleSocial(googleProvider)}
            className="w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <GoogleIcon /> Continue with Google
          </button>
          <button type="button" disabled={busy} onClick={() => handleSocial(facebookProvider)}
            className="w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <FacebookIcon /> Continue with Facebook
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          <div className="flex-1 h-px bg-gray-200" /> or use email <div className="flex-1 h-px bg-gray-200" />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs font-semibold px-4 py-3 rounded-2xl border border-red-100">{error}</div>
        )}
        {info && (
          <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-3 rounded-2xl border border-emerald-100">{info}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input type="text" name="name" required autoComplete="name" placeholder="Your full name"
                  value={formData.name} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="email" name="email" required autoComplete="email" placeholder="name@example.com"
                value={formData.email} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type={showPassword ? 'text' : 'password'} name="password" required
                autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder="••••••••"
                value={formData.password} onChange={handleChange} className={`${inputClass} pr-12`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input type={showPassword ? 'text' : 'password'} name="confirmPassword" required autoComplete="new-password"
                  placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          )}

          {!isSignUp && (
            <div className="flex justify-end">
              <button type="button" onClick={handleForgot} className="text-xs font-bold text-[#1A0F2E] hover:underline">
                Forgot password?
              </button>
            </div>
          )}

          <button type="submit" disabled={busy}
            className="w-full py-4 bg-[#1A0F2E] hover:bg-[#0D0717] text-white font-black text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
            <span>{busy ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}</span>
            {!busy && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs font-semibold text-gray-400">
          <ShieldCheck className="w-4 h-4 text-[#1A0F2E]" />
          <span>Sign-in is handled securely by Google Firebase</span>
        </div>
      </div>
    </div>
  );
}