import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignUp && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Auth logic goes here (Firebase / API)
    console.log(isSignUp ? 'Signing up...' : 'Signing in...', formData);
    
    // Redirect after successful auth
    navigate('/account');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden p-8 space-y-8">
        
        {/* Header & Logo */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2 text-[#2D1B4E]">
            <div className="flex justify-center mb-6">
  <div className="bg-[#2D1B4E] p-3 rounded-2xl shadow-md inline-flex items-center justify-center">
    <img 
      src="/logo.png" 
      alt="Dexvee" 
      className="h-10 w-auto object-contain" 
    />
  </div>
</div>
          </Link>
          <h2 className="text-2xl font-black text-gray-800">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs font-medium text-gray-500">
            {isSignUp ? 'Sign up to start shopping and track orders' : 'Enter your credentials to access your account'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              !isSignUp ? 'bg-[#2D1B4E] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              isSignUp ? 'bg-[#2D1B4E] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-600 text-xs font-semibold px-4 py-3 rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Kaveesha Vikum"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium outline-none focus:border-[#2D1B4E] bg-gray-50/50 focus:bg-white transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                required
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium outline-none focus:border-[#2D1B4E] bg-gray-50/50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full border-2 border-gray-100 rounded-2xl pl-12 pr-12 py-3 text-sm font-medium outline-none focus:border-[#2D1B4E] bg-gray-50/50 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium outline-none focus:border-[#2D1B4E] bg-gray-50/50 focus:bg-white transition-all"
                />
              </div>
            </div>
          )}

          {!isSignUp && (
            <div className="flex justify-end">
              <a href="#forgot" className="text-xs font-bold text-[#2D1B4E] hover:underline">
                Forgot password?
              </a>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-[#2D1B4E] hover:bg-[#1A0F2E] text-white font-black text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest mt-2"
          >
            <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security Assurance */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs font-semibold text-gray-400">
          <ShieldCheck className="w-4 h-4 text-[#2D1B4E]" />
          <span>256-Bit Encrypted Secure Checkout</span>
        </div>

      </div>
    </div>
  );
}