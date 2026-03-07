
import React from 'react';
import {
  GraduationCap,
  ChevronRight,
  Lock,
  Package,
  Leaf,
  Settings,
  LogOut
} from 'lucide-react';

export type ModuleType = 'training' | 'product' | 'eco';

interface ModuleSelectionProps {
  onSelect: (module: ModuleType) => void;
  user: { firstName: string; lastName: string; email: string; role: string };
  onOpenSettings: () => void;
  onOpenSupport: () => void;
  onLogout: () => void;
}

const ModuleSelection: React.FC<ModuleSelectionProps> = ({ onSelect, user, onOpenSettings, onOpenSupport, onLogout }) => {
  const modules = [
    {
      id: 'training' as const,
      title: 'Formation & SOC',
      desc: 'Gestion de la polyvalence, validations SOC et suivi des certificats légaux.',
      icon: GraduationCap,
      active: true,
      color: 'bg-emerald-50 text-[#264f36]'
    },
    {
      id: 'product' as const,
      title: 'Gestion Produit',
      desc: 'Inventaires, stocks, DLC et pertes restaurant.',
      icon: Package,
      active: false,
      color: 'bg-slate-100 text-slate-400'
    },
    {
      id: 'eco' as const,
      title: 'Eco Progress',
      desc: 'Tableau de bord durabilité et impact environnemental.',
      icon: Leaf,
      active: false,
      color: 'bg-slate-100 text-slate-400'
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-8 relative overflow-x-hidden">
      {/* HEADER TOP RIGHT - User info next to buttons - Now fully responsive */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-30 flex items-center gap-2 sm:gap-3">
        {/* User Badge Component - Adaptative for mobile */}
        <div className="flex items-center gap-2 sm:gap-3 bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-[1.25rem] shadow-sm">
          <div className="w-7 h-7 sm:w-8 h-8 bg-[#264f36] text-white rounded-lg flex items-center justify-center font-black text-[10px] sm:text-sm shadow-sm shrink-0">
            {user?.firstName?.[0] || '?'}
          </div>
          <div className="text-left overflow-hidden">
            <p className="text-[9px] sm:text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none mb-0.5 truncate max-w-[80px] sm:max-w-none">
              {user?.firstName} <span className="hidden xs:inline">{user?.lastName}</span>
            </p>
            <p className="hidden sm:block text-[7px] font-bold text-[#264f36] uppercase tracking-[0.15em] leading-none">
              {user?.role}
            </p>
          </div>
        </div>

        <button onClick={onOpenSettings} className="w-9 h-9 sm:w-10 sm:h-10 bg-white border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center hover:text-[#264f36] hover:border-[#264f36] transition-all shadow-sm shrink-0">
          <Settings size={18} />
        </button>
        <button onClick={onLogout} className="w-9 h-9 sm:w-10 sm:h-10 bg-red-50 border border-red-100 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm shrink-0">
          <LogOut size={18} />
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center mb-8 md:mb-12 animate-in slide-in-from-top-4 duration-700 w-full text-center mt-16 sm:mt-0">
        <div className="bg-[#264f36] p-4 rounded-[1.5rem] shadow-2xl shadow-[#264f36]/30 mb-6 flex items-center justify-center">
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg" alt="McDonald's" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
        </div>
        
        <h1 className="text-slate-900 text-2xl md:text-4xl font-black tracking-tighter mb-2 italic">
          McDonald's <span className="text-[#264f36]">Console</span>
        </h1>
        <div className="px-4 py-1.5 bg-slate-100 rounded-full border border-slate-200 inline-block mb-6 md:mb-10">
           <span className="text-slate-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest">
             Pilotage Opérationnel Store #0437
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl w-full relative z-10">
        {modules.map((module) => {
          const Icon = module.icon;
          return module.active ? (
            <button key={module.id} onClick={() => onSelect(module.id)} className="group relative bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 hover:border-[#264f36] transition-all duration-500 text-left flex flex-col shadow-sm hover:shadow-2xl">
              <div className={`${module.color} p-4 rounded-2xl w-fit mb-4 group-hover:bg-[#264f36] group-hover:text-white transition-colors`}>
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mb-2 uppercase">{module.title}</h2>
                <p className="text-slate-500 text-[10px] md:text-xs font-medium leading-relaxed">{module.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-end">
                <div className="flex items-center gap-1 text-[#264f36] font-black text-[9px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                  Entrer <ChevronRight size={14} />
                </div>
              </div>
            </button>
          ) : (
            <div key={module.id} className="relative bg-slate-50/50 p-6 md:p-8 rounded-[2rem] border border-dashed border-slate-200 text-left flex flex-col opacity-60 cursor-not-allowed">
              <div className={`${module.color} p-4 rounded-2xl w-fit mb-4`}>
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-black text-slate-300 tracking-tight mb-2 uppercase">{module.title}</h2>
                <p className="text-slate-400 text-[10px] md:text-xs font-medium leading-relaxed italic">Outil bientôt disponible</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300 font-black text-[8px] uppercase tracking-widest"><Lock size={12} /> Accès Verrouillé</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModuleSelection;
