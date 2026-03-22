import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        console.log('Login successful');
      } else {
        await signup(email, password, name);
        console.log('Signup successful');
      }
      // Navigation will happen automatically via App.tsx when user state changes
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
          <div className="text-center mb-10">
            <img src="/CalendarX.png" alt="Calendar X" className="w-20 h-20 mx-auto mb-4" />
            <h2 className="text-5xl font-bold text-black mb-3 tracking-tight">Calendar X</h2>
            <p className="text-gray-600 text-base">Aggregate and share your calendars</p>
          </div>
          
          <h3 className="text-2xl font-bold mb-8 text-black tracking-tight">{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-black mb-2">Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition text-base"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-black mb-2">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition text-base"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition text-base"
                required
                minLength={6}
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl hover:bg-gray-800 font-bold transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <span className="text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-black hover:text-gray-700 font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
