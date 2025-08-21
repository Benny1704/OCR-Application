import { Mail,Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import brandLogo from '../assets/images/logo.png';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError('');
      const loggedIn = login(email);
      if (loggedIn) {
          const role = email === 'admin@nextriq' ? 'admin' : 'user';
          navigate(role === 'admin' ? '/dashboard' : '/queue');
      } else {
          setError('Invalid credentials. Please use admin@nextriq or user@nextriq.');
      }
  };
  return (
      <div className="min-h-screen flex items-center justify-center p-4 font-sans" style={{ background: 'radial-gradient(circle, #2d3a4b 0%, #1a1a2e 100%)' }}>
          <div className="bg-white/10 backdrop-blur-lg p-8 sm:p-10 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in border border-white/20">
              <div className="flex justify-center mb-8">
                  <img src={brandLogo} className="w-24" alt="Nextriq Logo"/>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative">
                      <Mail className="w-5 h-5 text-gray-400 absolute top-1/2 left-4 -translate-y-1/2"/>
                      <input className="w-full py-3 pl-12 pr-4 text-white bg-white/10 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all placeholder:text-gray-400" id="email" type="email" placeholder="admin@nextriq or user@nextriq" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="relative">
                      <Lock className="w-5 h-5 text-gray-400 absolute top-1/2 left-4 -translate-y-1/2"/>
                      <input className="w-full py-3 pl-12 pr-4 text-white bg-white/10 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all placeholder:text-gray-400" id="password" type="password" placeholder="Password" defaultValue="password" />
                  </div>
                  {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                  <button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-4 focus:ring-violet-500/50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/40" type="submit">
                      Log In
                  </button>
              </form>
          </div>
      </div>
  );
}

export default Login
