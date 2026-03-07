
import React, { useState } from 'react';
import { Trash2, Search, RotateCcw, Calendar, AlertTriangle, X, ArrowLeft, Trash, Eye, Clock, User } from 'lucide-react';
import { Employee, Role } from '../types';
import { ROLE_COLOR_CONFIG, ROLE_ICON_CONFIG } from './EmployeeList';

interface TrashListProps {
  trashEmployees: Employee[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
  onBack?: () => void;
}

const TrashList: React.FC<TrashListProps> = ({ trashEmployees, onRestore, onPermanentDelete, onEmptyTrash, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [confirmPermanentId, setConfirmPermanentId] = useState<string | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const filtered = trashEmployees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const calculateDaysLeft = (deletedDate?: string) => {
    if (!deletedDate) return 30;
    let cleanDate = deletedDate;
    if (deletedDate.includes('/')) {
        const [d, m, y] = deletedDate.split('/');
        cleanDate = `${y}-${m}-${d}`;
    }
    const date = new Date(cleanDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  };

  const getRoleStyle = (role: Role) => ROLE_COLOR_CONFIG[role] || ROLE_COLOR_CONFIG[Role.EQUIPPIER];

  return (
    <div className="space-y-8 animate-in relative w-full pb-10">
      {/* Modal: Détails du profil supprimé (Style Archive) */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setSelectedEmployee(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 p-0">
             <div className={`${getRoleStyle(selectedEmployee.role).bg} p-8 text-white relative`}>
                <button onClick={() => setSelectedEmployee(null)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center font-black text-2xl border border-white/20 relative">
                    {selectedEmployee.name[0]}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white text-slate-900 rounded-lg flex items-center justify-center shadow-lg">
                      {(() => {
                        const Icon = ROLE_ICON_CONFIG[selectedEmployee.role] || User;
                        return <Icon size={12} />;
                      })()}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{selectedEmployee.name}</h2>
                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">{selectedEmployee.role}</p>
                  </div>
                </div>
             </div>
             <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                   <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Supprimé le</span>
                      <p className="text-xs font-black text-slate-900">{selectedEmployee.deletedDate || 'Non renseigné'}</p>
                   </div>
                   <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
                      <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block mb-1">Avant destruction</span>
                      <p className="text-xs font-black text-red-600 uppercase">{calculateDaysLeft(selectedEmployee.deletedDate)} jours restants</p>
                   </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => { onRestore(selectedEmployee.id); setSelectedEmployee(null); }} className="flex-1 py-4 bg-[#264f36] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all">
                     <RotateCcw size={18} /> Restaurer le dossier
                  </button>
                  <button onClick={() => { setConfirmPermanentId(selectedEmployee.id); setSelectedEmployee(null); }} className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-red-700 transition-all">
                     Détruire
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Confirmation destruction (Style Archive) */}
      {confirmPermanentId && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={() => setConfirmPermanentId(null)} />
           <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center space-y-8 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto border border-red-100">
                 <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black uppercase text-slate-900 tracking-tighter">Action Irréversible</h3>
              <p className="text-[11px] text-slate-500 font-medium">Le dossier sera définitivement effacé du serveur.</p>
              <div className="flex gap-4">
                 <button onClick={() => setConfirmPermanentId(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest">Annuler</button>
                 <button onClick={() => { onPermanentDelete(confirmPermanentId); setConfirmPermanentId(null); }} className="flex-1 py-4 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Détruire</button>
              </div>
           </div>
        </div>
      )}

      {/* Header Corbeille */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#264f36] transition-colors">
              <ArrowLeft size={16} /> Retour à l'équipe active
            </button>
          )}
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Corbeille Opérationnelle</h1>
            <p className="text-slate-500 font-medium mt-1 italic">Dossiers en attente de destruction (30 jours).</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           {/* La section des onglets Équipiers/Responsables a été retirée pour une vue globale */}

           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input 
                type="text" 
                placeholder="Rechercher dans la corbeille..." 
                className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold outline-none focus:border-red-500 transition-all w-64 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           {trashEmployees.length > 0 && (
              <button 
                onClick={() => setShowEmptyConfirm(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md"
              >
                 <Trash size={14} /> Vider la Corbeille
              </button>
           )}
        </div>
      </div>

      {/* Liste (Style ArchiveList appliqué ici) */}
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 sm:px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Employé</th>
              <th className="hidden sm:table-cell px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Supprimé le</th>
              <th className="hidden sm:table-cell px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Délai Restant</th>
              <th className="px-4 sm:px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length > 0 ? filtered.map(emp => {
              const rStyle = getRoleStyle(emp.role as Role);
              const days = calculateDaysLeft(emp.deletedDate);
              const RoleIcon = ROLE_ICON_CONFIG[emp.role] || User;
              return (
                <tr key={emp.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 sm:px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all border shadow-sm ${rStyle.bg} ${rStyle.text} ${rStyle.border}`}>
                        <RoleIcon size={20} />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate leading-tight">{emp.name}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-widest opacity-80 truncate ${rStyle.text}`}>{emp.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-8 py-5">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                       <Calendar size={14} className="text-slate-300" />
                       {emp.deletedDate || '-'}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-8 py-5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase ${days < 7 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Clock size={12} />
                      {days} Jours
                    </div>
                  </td>
                  <td className="px-4 sm:px-8 py-5 text-right whitespace-nowrap">
                     <div className="flex justify-end gap-2 sm:gap-3">
                        <button 
                          onClick={() => setSelectedEmployee(emp)}
                          className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md"
                        >
                           <Eye size={14} /><span className="hidden sm:inline"> Détails</span>
                        </button>
                        <button 
                          onClick={() => onRestore(emp.id)}
                          className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          title="Restaurer"
                        >
                           <RotateCcw size={18} />
                        </button>
                        <button 
                          onClick={() => setConfirmPermanentId(emp.id)}
                          className="p-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          title="Détruire"
                        >
                           <Trash2 size={18} />
                        </button>
                     </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center">
                   <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                    <Trash2 size={40} className="text-slate-200" />
                   </div>
                   <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">La corbeille est vide</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Vider la Corbeille */}
      {showEmptyConfirm && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-red-950/90 backdrop-blur-xl" onClick={() => setShowEmptyConfirm(false)} />
           <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-12 text-center space-y-8 animate-in zoom-in-95">
              <div className="w-24 h-24 bg-red-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl">
                 <Trash size={48} />
              </div>
              <h3 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">Tout détruire ?</h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Cette opération est immédiate et irréversible pour tous les dossiers.</p>
              <div className="flex gap-4">
                 <button onClick={() => setShowEmptyConfirm(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest">Annuler</button>
                 <button onClick={() => { onEmptyTrash(); setShowEmptyConfirm(false); }} className="flex-1 py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl">Vider</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TrashList;
