import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRole, User } from '../types';
import { db } from '../services/storage';
import { 
  LayoutDashboard, Users, Truck, FileText, ClipboardList, PlusCircle, BarChart3, 
  LogOut, Menu, WifiOff, UserCircle, Award, Palette, History
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [systemName, setSystemName] = useState('VendorValuate');
  const [logoUrl, setLogoUrl] = useState('');
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const branding = db.branding.get();
    setSystemName(branding.systemName);
    setLogoUrl(branding.logoUrl);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!user) return <>{children}</>;

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          isActive 
            ? 'bg-secondary text-white' 
            : 'text-gray-300 hover:bg-white/10 hover:text-white'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Icon size={20} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-primary text-white transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <h1 className="text-xl font-bold flex items-center gap-2 truncate">
              {logoUrl ? <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain bg-white rounded-full p-0.5" /> : <ClipboardList />} 
              {systemName}
            </h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {user.role === UserRole.Admin && (
              <>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2 px-4">Admin</div>
                <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem to="/admin/vendors" icon={Truck} label="Vendors" />
                <NavItem to="/admin/users" icon={Users} label="Users" />
                <NavItem to="/admin/templates" icon={FileText} label="Templates" />
                <NavItem to="/admin/reports" icon={BarChart3} label="Reports" />
              </>
            )}
            
            {user.role === UserRole.Evaluator && (
              <>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2 px-4">Evaluator</div>
                <NavItem to="/evaluator/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem to="/evaluator/new" icon={PlusCircle} label="New Evaluation" />
                <NavItem to="/evaluator/history" icon={ClipboardList} label="My Evaluations" />
              </>
            )}
          </nav>

          <div className="p-4 border-t border-white/10 bg-secondary">
            <div className="flex items-center gap-3 px-4 mb-4 hover:opacity-80 transition-opacity">
              <UserCircle className="text-gray-300" />
              <div>
                <p className="text-sm font-medium">{user.displayName}</p>
                <p className="text-xs text-gray-400">{user.role}</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden w-full">
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center">
           <h1 className="text-lg font-bold text-primary">{systemName}</h1>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600">
             <Menu />
           </button>
        </header>

        {!isOnline && (
          <div className="bg-yellow-500 text-white text-center py-1 text-sm flex justify-center items-center gap-2">
            <WifiOff size={14} /> You are offline. Changes are saved locally and will sync when online.
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};