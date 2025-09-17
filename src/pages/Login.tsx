// src/pages/Login.tsx
import { User, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import brandLogo from '../assets/images/RMKV_logo.png';
import { motion, AnimatePresence, type Variants } from "framer-motion";

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" }}
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('password@123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const user = await login({ username, password });
        
        if (user) {
            navigate(user.role === 'admin' ? '/dashboard' : '/queue');
        } else {
            setError('Invalid credentials. Please try again.');
        }
    } catch (error) {
        setError('An unexpected error occurred. Please try again later.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans" style={{ background: 'radial-gradient(circle, #2d3a4b 0%, #1a1a2e 100%)' }}>
      <motion.div
        className="bg-white/5 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-6 text-center">
            <img src={brandLogo} className="w-25 mb-4" alt="RMKV Logo"/>
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-gray-400 text-sm">Log in to continue to RMKV</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div variants={itemVariants} className="relative">
            <User className="w-5 h-5 text-gray-400 absolute top-1/2 left-4 -translate-y-1/2"/>
            <input
              className="w-full py-3 pl-12 pr-4 text-white bg-white/10 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all placeholder:text-gray-400"
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </motion.div>
          <motion.div variants={itemVariants} className="relative">
            <Lock className="w-5 h-5 text-gray-400 absolute top-1/2 left-4 -translate-y-1/2"/>
            <input
              className="w-full py-3 pl-12 pr-12 text-white bg-white/10 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all placeholder:text-gray-400"
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center justify-center gap-2 text-red-400 text-sm text-center"
              >
                <AlertTriangle size={16} /> {error}
              </motion.p>
            )}
          </AnimatePresence>
          
          <motion.div variants={itemVariants}>
            <motion.button
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-4 focus:ring-violet-500/50 transition-shadow duration-300 shadow-lg hover:shadow-purple-500/40 disabled:opacity-50"
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </motion.button>
          </motion.div>
        </form>

      </motion.div>
    </div>
  );
}

export default Login;