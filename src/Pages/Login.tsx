import React, { useState, useEffect } from 'react';
import { UserRole, User } from '../types';
import { db } from '../services/storage';
import { useToast } from '../components/Toast';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemName, setSystemName] = useState('VendorValuate');
  const [logoUrl, setLogoUrl] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const branding = db.branding.get();
    setSystemName(branding.systemName);
    setLogoUrl(branding.logoUrl);
    
    document.documentElement.style.setProperty('--color-primary', branding.primaryColor);
    document.documentElement.style.setProperty('--color-secondary', branding.secondaryColor);
    document.documentElement.style.setProperty('--color-accent', branding.accentColor);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const users = db.users.getAll();
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (found && found.isActive) {
        if (found.email === 'admin@hartagroup.my' && password !== 'Harta_12345') {
            addToast('Invalid credentials.', 'error');
            setLoading(false);
            return;
        }

        if (found.email !== 'admin@hartagroup.my' && password.length < 3) {
            addToast('Invalid credentials.', 'error');
            setLoading(false);
            return;
        }

        onLogin(found);
        addToast(`Welcome back, ${found.displayName}`, 'success');
      } else {
        addToast('Invalid credentials or account inactive.', 'error');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border-t-4 border-primary animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          {logoUrl && (
            <div className="mb-4 flex justify-center">
              <img src={logoUrl} alt="System Logo" className="h-20 max-w-[200px] object-contain" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-primary mb-2">{systemName}</h1>
          <p className="text-gray-500 text-sm uppercase tracking-wide">Secure Vendor Evaluation Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg hover:opacity-90 transition-opacity font-bold shadow-md"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};