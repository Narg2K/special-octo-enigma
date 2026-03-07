
import React, { useState } from 'react';
import { Archive, Search, RotateCcw, FileText, Info, X, ArrowLeft, Eye, PenTool, Calendar, UserCircle, Trash2, User } from 'lucide-react';
import { Employee, Role } from '../types';
import { ROLE_COLOR_CONFIG, ROLE_ICON_CONFIG } from './EmployeeList';

interface ArchiveListProps {
  archivedEmployees: Employee[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateReason: (id: string, reason: string) => void;
  onBack?: () => void;
}

const ArchiveList: React.FC<ArchiveListProps> = ({ archivedEmployees, onRestore, onDelete, onUpdateReason, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'valid' | 'pending'>('valid');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState<Employee | null>(null);
  const [completionReason, setCompletionReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const filtered = archivedEmployees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pendingArchives = filtered.filter(emp => emp.archivedReason?.includes('[AUTO]'));
  const validArchives = filtered.filter(emp => !emp.archivedReason?.includes('[AUTO]'));

  const displayList = activeTab === 'valid' ? validArchives : pendingArchives;

  const getRoleStyle = (role: Role) => ROLE_COLOR_CONFIG[role] || ROLE_COLOR_CONFIG[Role.EQUIPPIER];

  const handleFinalizeDossier = () => {
    if (showCompletionModal && completionReason.trim()) {
      onUpdateReason(showCompletionModal.id, completionReason);
      setShowCompletionModal(null);
      setCompletionReason('');
    }
  };

  return (
    <div className="space-y-8 animate-in relative w-full">
      {/* Modal: Détails Archive */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
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
             <div className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date d'Entrée</span>
                      <p className="text-xs font-black text-slate-900">{selectedEmployee.entryDate || 'N/A'}</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Date de Sortie</span>
                      <p className="text-xs font-black text-slate-900">{selectedEmployee.archivedDate || 'N/A'}</p>
                   </div>
                </div>
                <div className="space-y-2">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={14}/> Motif du départ</h4>
                   <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-sm text-slate-600 leading-relaxed">
                     "{selectedEmployee.archivedReason || 'Aucun motif renseigné.'}"
                   </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { onRestore(selectedEmployee.id); setSelectedEmployee(null); }} className="flex-1 py-4 bg-[#264f36] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3">
                     <RotateCcw size={18} /> Réintégrer
                  </button>
                  <button 
                    onClick={() => { 
                      setShowDeleteConfirm(selectedEmployee.id);
                    }} 
                    className="flex-1 py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-red-600 hover:text-white transition-all"
                  >
                     <Trash2 size={18} /> Supprimer
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Modal: Finalisation Motif */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowCompletionModal(null)} />
           <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-6">
              <div className="flex items-center gap-3 text-red-600">
                <PenTool size={24} />
                <h3 className="text-xl font-black uppercase tracking-tighter">Compléter le dossier</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">L'archivage automatique nécessite une validation du motif de fin de contrat.</p>
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-[11px] font-bold text-slate-800 outline-none focus:border-red-500 h-32 resize-none"
                placeholder="Raison officielle (Démission, Fin de CDD, etc.)..."
                value={completionReason}
                onChange={(e) => setCompletionReason(e.target.value)}
              />
              <div className="flex gap-3">
                <button onClick={() => setShowCompletionModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest">Annuler</button>
                <button disabled={!completionReason.trim()} onClick={handleFinalizeDossier} className="flex-1 py-4 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-30 transition-all">Valider</button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#264f36] transition-colors">
              <ArrowLeft size={16} /> Retour
            </button>
          )}
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Archives Équipe</h1>
            <p className="text-slate-500 font-medium mt-1 italic">Dossiers de fin de contrat et historique Store #0437.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 w-full sm:w-auto">
           <div className="overflow-x-auto no-scrollbar">
             <div className="flex bg-white p-1 rounded-full border border-slate-200 shadow-sm min-w-max">
               <button onClick={() => setActiveTab('valid')} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'valid' ? 'bg-[#264f36] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Validés ({validArchives.length})</button>
               <button onClick={() => setActiveTab('pending')} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>À Compléter ({pendingArchives.length})</button>
             </div>
           </div>
           <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input
                type="text"
                placeholder="Rechercher une archive..."
                className="pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-full text-[10px] font-bold outline-none focus:border-[#264f36] transition-all w-full sm:w-56 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 sm:px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Employé</th>
              <th className="hidden sm:table-cell px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date Sortie</th>
              <th className="hidden sm:table-cell px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contrat</th>
              <th className="px-4 sm:px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {displayList.length > 0 ? displayList.map(emp => {
              const rStyle = getRoleStyle(emp.role as Role);
              const isPending = emp.archivedReason?.includes('[AUTO]');
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
                       {emp.archivedDate || '-'}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-8 py-5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{emp.contractType || 'CDI'}</span>
                  </td>
                  <td className="px-4 sm:px-8 py-5 text-right whitespace-nowrap">
                     <div className="flex justify-end gap-2 sm:gap-3">
                        <button 
                          onClick={() => setSelectedEmployee(emp)}
                          className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md"
                        >
                           <Eye size={14} /><span className="hidden sm:inline"> Détails</span>
                        </button>
                        {isPending ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setShowCompletionModal(emp)}
                              className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md animate-pulse"
                            >
                               <PenTool size={14} /><span className="hidden sm:inline"> Valider</span>
                            </button>
                            <button 
                              onClick={() => setShowDeleteConfirm(emp.id)}
                              className="p-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              title="Supprimer"
                            >
                               <Trash2 size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => onRestore(emp.id)}
                              className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              title="Réintégrer"
                            >
                               <RotateCcw size={18} />
                            </button>
                            <button 
                              onClick={() => setShowDeleteConfirm(emp.id)}
                              className="p-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              title="Supprimer"
                            >
                               <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                     </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center">
                   <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                    <Archive size={40} className="text-slate-200" />
                   </div>
                   <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Aucun dossier archivé dans cette catégorie</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Modal: Confirmation Suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-red-950/60 backdrop-blur-md" onClick={() => setShowDeleteConfirm(null)} />
           <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center space-y-8 animate-in zoom-in-95">
              <Trash2 size={40} className="mx-auto text-red-600" />
              <h3 className="text-xl font-black uppercase text-slate-900 tracking-tighter">Mettre à la corbeille ?</h3>
              <p className="text-xs text-slate-500 font-medium">Le dossier sera déplacé vers la corbeille opérationnelle.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest">Annuler</button>
                <button onClick={() => { onDelete(showDeleteConfirm); setShowDeleteConfirm(null); setSelectedEmployee(null); }} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Confirmer</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveList;
