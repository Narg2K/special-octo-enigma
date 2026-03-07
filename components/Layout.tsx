
import React, { useState } from 'react';
import { LayoutDashboard, GraduationCap, Users, LogOut, Archive, Menu, X, Activity, HelpCircle, Settings as SettingsIcon, Grid2X2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: { firstName: string; lastName: string; role: string };
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenSupport: () => void;
  onResetModule: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, onLogout, onOpenSettings, onOpenSupport, onResetModule }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Bord', icon: <LayoutDashboard size={20} /> },
    { id: 'employees', label: 'Équipe', icon: <Users size={20} /> },
    { id: 'archive', label: 'Archives', icon: <Archive size={20} /> },
    { id: 'logs', label: 'Activités', icon: <Activity size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden flex-col lg:flex-row">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-[#264f36] text-white flex flex-col hidden lg:flex border-r border-[#1d3c29] shrink-0">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight italic">McFormation</span>
          </div>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id ? 'bg-white text-[#264f36] shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-bold">{item.label}</span>
            </button>
          ))}
          
          <div className="pt-6 mt-6 border-t border-white/20">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 px-4">Navigation Système</p>
            <button
              onClick={onResetModule}
              className="w-full flex items-center space-x-3 px-4 py-4 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-white/10 transition-all font-black uppercase text-[10px] tracking-widest border border-emerald-500/20"
            >
              <Grid2X2 size={20} />
              <span>Changer d'outil</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-4">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center font-bold border-2 border-emerald-400 overflow-hidden shrink-0">
               {user?.firstName?.[0] || '?'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate leading-none mb-1">{user?.firstName} {user?.lastName}</p>
              <p className="text-[9px] text-emerald-400 truncate uppercase font-black tracking-widest">{user?.role || 'Rôle'}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <button onClick={onOpenSettings} className="w-full flex items-center space-x-3 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <SettingsIcon size={18} />
              <span className="text-sm font-bold">Réglages</span>
            </button>
            <button onClick={onOpenSupport} className="w-full flex items-center space-x-3 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <HelpCircle size={18} />
              <span className="text-sm font-bold">Support</span>
            </button>
            <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <LogOut size={18} />
              <span className="text-sm font-bold">Quitter</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="lg:hidden h-16 bg-[#264f36] text-white flex items-center justify-between px-4 z-[100] shrink-0 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="bg-white/10 p-1.5 rounded-lg border border-white/20">
            <GraduationCap size={18} className="text-emerald-400" />
          </div>
          <span className="font-black uppercase tracking-tighter text-sm italic">McFormation</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Menu Mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[90] bg-[#264f36] flex flex-col pt-20 p-6 animate-in slide-in-from-top-4 duration-300">
           <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
              {/* Main Navigation Items */}
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${
                    activeTab === item.id 
                      ? 'bg-white text-[#264f36] shadow-xl' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="text-lg font-black uppercase tracking-widest">{item.label}</span>
                </button>
              ))}

              <div className="h-px bg-white/10 w-full my-4"></div>

              {/* Mobile Settings Access */}
              <button
                onClick={() => { onOpenSettings(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center space-x-4 p-4 rounded-2xl text-white/70 hover:bg-white/5 hover:text-white transition-all"
              >
                <SettingsIcon size={24} />
                <span className="text-lg font-black uppercase tracking-widest">Réglages</span>
              </button>
              
              <button
                onClick={() => { onOpenSupport(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center space-x-4 p-4 rounded-2xl text-white/70 hover:bg-white/5 hover:text-white transition-all"
              >
                <HelpCircle size={24} />
                <span className="text-lg font-black uppercase tracking-widest">Support</span>
              </button>

              {/* Explicit separation for "Changer d'outil" */}
              <div className="py-6">
                <div className="h-px bg-white/20 w-full mb-6"></div>
                <button
                  onClick={() => { onResetModule(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center space-x-4 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-lg"
                >
                  <Grid2X2 size={24} />
                  <div className="text-left">
                    <span className="block text-lg font-black uppercase tracking-widest">Console</span>
                    <span className="block text-[10px] font-bold uppercase opacity-60">Changer d'outil</span>
                  </div>
                </button>
              </div>

              <div className="pb-8">
                 <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 font-black uppercase text-xs tracking-widest">
                    <LogOut size={20} /> Déconnexion
                 </button>
              </div>
           </div>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative custom-scrollbar bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
