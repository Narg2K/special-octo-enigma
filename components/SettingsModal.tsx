
import React, { useState, useEffect } from 'react';
import {
  User, Save, Plus, X, Award, CheckCircle, Settings as SettingsIcon,
  ListChecks, ShieldAlert, Trash2, Edit3, Minus, Briefcase, GraduationCap,
  Check, LayoutGrid, FileText, Smartphone, CheckCircle2, Package, Layers, FileEdit
} from 'lucide-react';
import { GlobalCertConfig, ContractConfig } from '../types';
import PDFFormBuilder from './PDFFormBuilder';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdateUser: (data: { firstName: string; lastName: string }) => void;
  skills: string[];
  setSkills: (skills: string[]) => void;
  certifications: GlobalCertConfig[];
  setCertifications: (certs: GlobalCertConfig[]) => void;
  contracts: ContractConfig[];
  setContracts: (contracts: ContractConfig[]) => void;
  showReferentials?: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, user, onUpdateUser, skills, setSkills, certifications, setCertifications, contracts, setContracts,
  showReferentials = false
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'referentials'>('profile');
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '', email: '' });
  
  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState<GlobalCertConfig>({ name: '', isMandatory: true, validityMonths: 12 });
  const [newTraining, setNewTraining] = useState<GlobalCertConfig>({ name: '', isMandatory: false, validityMonths: 0 });
  const [newContract, setNewContract] = useState<Omit<ContractConfig, 'id'>>({ name: '', weeklyHours: 35 });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempEditValue, setTempEditValue] = useState<any>(null);
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pdfBuilderCert, setPdfBuilderCert] = useState<GlobalCertConfig | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      setProfileData({ 
        firstName: user.firstName || '', 
        lastName: user.lastName || '', 
        email: user.email || '' 
      });
    }
  }, [user, isOpen]);

  const triggerSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ firstName: profileData.firstName, lastName: profileData.lastName });
    triggerSuccess();
  };

  // --- ACTIONS POSTES ---
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.toUpperCase())) {
      setSkills([...skills, newSkill.toUpperCase()]);
      setNewSkill('');
      triggerSuccess();
    }
  };
  const startEditSkill = (skill: string) => {
    setEditingId(`skill-${skill}`);
    setTempEditValue(skill);
  };
  const saveEditSkill = (oldSkill: string) => {
    if (tempEditValue && tempEditValue.trim()) {
      setSkills(skills.map(s => s === oldSkill ? tempEditValue.toUpperCase() : s));
      setEditingId(null);
      triggerSuccess();
    }
  };

  // --- ACTIONS CONTRATS ---
  const addContract = () => {
    if (newContract.name.trim()) {
      setContracts([...contracts, { id: `CT-${Date.now()}`, ...newContract }]);
      setNewContract({ name: '', weeklyHours: 35 });
      triggerSuccess();
    }
  };
  const startEditContract = (c: ContractConfig) => {
    setEditingId(`contract-${c.id}`);
    setTempEditValue({ ...c });
  };
  const saveEditContract = (id: string) => {
    setContracts(contracts.map(c => c.id === id ? tempEditValue : c));
    setEditingId(null);
    triggerSuccess();
  };

  // --- ACTIONS CERTIFS / FORMATIONS ---
  const addCertConfig = (config: GlobalCertConfig) => {
    if (config.name.trim() && !certifications.find(c => c.name === config.name.toUpperCase())) {
      setCertifications([...certifications, { ...config, name: config.name.toUpperCase() }]);
      if (config.isMandatory) setNewCert({ name: '', isMandatory: true, validityMonths: 12 });
      else setNewTraining({ name: '', isMandatory: false, validityMonths: 0 });
      triggerSuccess();
    }
  };
  const startEditCert = (c: GlobalCertConfig) => {
    setEditingId(`cert-${c.name}`);
    setTempEditValue({ ...c });
  };
  const saveEditCert = (oldName: string) => {
    setCertifications(certifications.map(c => c.name === oldName ? { ...tempEditValue, name: tempEditValue.name.toUpperCase() } : c));
    setEditingId(null);
    triggerSuccess();
  };

  const CompactNumberPicker = ({ value, onChange, label }: { value: number, onChange: (val: number) => void, label: string }) => (
    <div className="flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden h-11">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} className="px-3 hover:bg-slate-50 text-slate-400 border-r border-slate-200 h-full transition-colors"><Minus size={16} /></button>
      <div className="px-4 flex flex-col items-center justify-center min-w-[60px]">
        <span className="text-sm font-black text-slate-900 leading-none">{value}</span>
        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</span>
      </div>
      <button type="button" onClick={() => onChange(value + 1)} className="px-3 hover:bg-slate-50 text-slate-400 border-l border-slate-200 h-full transition-colors"><Plus size={16} /></button>
    </div>
  );

  const handleSavePdfTemplate = (updated: GlobalCertConfig) => {
    setCertifications(certifications.map(c => c.name === updated.name ? updated : c));
    setPdfBuilderCert(null);
    triggerSuccess();
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      <div className="relative w-full max-w-6xl bg-[#f8fafc] rounded-none sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-full sm:h-[85vh] animate-in slide-in-from-bottom-8">
        
        <header className="px-6 py-5 sm:px-10 sm:py-8 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="bg-[#264f36] w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl sm:rounded-[1.25rem] shadow-xl shadow-[#264f36]/20">
              <SettingsIcon size={20} className="text-white sm:w-7 sm:h-7" />
            </div>
            <div>
              <h2 className="text-sm sm:text-2xl font-black text-slate-900 tracking-tighter uppercase">Configuration</h2>
              <p className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Installation & Référentiels Store #0437</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100">
            <X size={24} />
          </button>
        </header>

        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Sidebar Tabs - Now horizontal on mobile */}
          <aside className="w-full sm:w-72 bg-white border-b sm:border-b-0 sm:border-r border-slate-100 p-4 sm:p-8 flex flex-row sm:flex-col gap-2 sm:gap-3 shrink-0 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('profile')} 
              className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all font-black text-[9px] sm:text-[10px] uppercase tracking-widest whitespace-nowrap ${activeTab === 'profile' ? 'bg-[#264f36] text-white shadow-xl shadow-[#264f36]/20 sm:translate-x-2' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              <User size={16} className="sm:w-5 sm:h-5" /> Profil
            </button>
            {showReferentials && (
              <button 
                onClick={() => setActiveTab('referentials')} 
                className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all font-black text-[9px] sm:text-[10px] uppercase tracking-widest whitespace-nowrap ${activeTab === 'referentials' ? 'bg-[#264f36] text-white shadow-xl shadow-[#264f36]/20 sm:translate-x-2' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
              >
                <Layers size={16} className="sm:w-5 sm:h-5" /> Métier
              </button>
            )}
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-12">
            {saveSuccess && (
              <div className="fixed top-20 right-4 sm:top-32 sm:right-12 z-[1100] bg-emerald-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-[1.25rem] flex items-center gap-3 sm:gap-4 shadow-2xl animate-in slide-in-from-right-8">
                <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-center">Enregistré</span>
              </div>
            )}

            {activeTab === 'profile' ? (
              <form onSubmit={handleProfileSave} className="space-y-8 sm:space-y-10 max-w-2xl animate-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Prénom</label>
                    <input type="text" className="w-full h-12 sm:h-14 px-5 sm:px-6 bg-white border border-slate-200 rounded-xl sm:rounded-2xl outline-none focus:border-[#264f36] shadow-sm text-sm font-black uppercase" value={profileData.firstName} onChange={e => setProfileData({...profileData, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nom de famille</label>
                    <input type="text" className="w-full h-12 sm:h-14 px-5 sm:px-6 bg-white border border-slate-200 rounded-xl sm:rounded-2xl outline-none focus:border-[#264f36] shadow-sm text-sm font-black uppercase" value={profileData.lastName} onChange={e => setProfileData({...profileData, lastName: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Identifiant</label>
                  <input type="email" readOnly className="w-full h-12 sm:h-14 px-5 sm:px-6 bg-slate-100 border border-slate-200 rounded-xl sm:rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed" value={profileData.email} />
                </div>
                <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-3 sm:gap-4 px-8 sm:px-10 py-4 sm:py-5 bg-[#264f36] text-white rounded-xl sm:rounded-[1.25rem] text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#264f36]/20 hover:bg-slate-900 transition-all">
                  <Save size={18} /> Sauvegarder
                </button>
              </form>
            ) : (
              <div className="space-y-12 sm:space-y-16 animate-in pb-20">
                
                {/* SECTION POSTES */}
                <section className="space-y-6 sm:space-y-8">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl border border-blue-100 shadow-sm"><LayoutGrid size={20} className="sm:w-6 sm:h-6" /></div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">Postes SOC</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-2xl bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
                    <input 
                      type="text" 
                      placeholder="NOUVEAU POSTE..." 
                      className="flex-1 h-12 sm:h-14 px-5 sm:px-6 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase outline-none focus:bg-white focus:border-blue-500 transition-all"
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                    />
                    <button onClick={addSkill} className="h-12 sm:h-14 px-6 sm:px-8 bg-blue-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                      <Plus size={18} /> Ajouter
                    </button>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {skills.map(skill => (
                      <div key={skill} className={`bg-white border p-4 rounded-xl sm:rounded-2xl flex items-center justify-between group transition-all ${editingId === `skill-${skill}` ? 'border-blue-500 ring-4 ring-blue-50 shadow-xl' : 'border-slate-100 hover:border-blue-200 shadow-sm'}`}>
                        {editingId === `skill-${skill}` ? (
                          <div className="flex items-center gap-2 w-full">
                            <input className="flex-1 min-w-0 text-[10px] font-black uppercase outline-none bg-slate-50 px-3 py-2 rounded-xl border border-blue-200" value={tempEditValue} onChange={e => setTempEditValue(e.target.value)} autoFocus />
                            <button onClick={() => saveEditSkill(skill)} className="p-2 bg-emerald-500 text-white rounded-xl shadow-md hover:bg-emerald-600"><Check size={16}/></button>
                            <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200"><X size={16}/></button>
                          </div>
                        ) : (
                          <>
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest pl-1 truncate">{skill}</span>
                            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditSkill(skill)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                              <button onClick={() => setSkills(skills.filter(s => s !== skill))} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><X size={14} /></button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* SECTION CONTRATS */}
                <section className="space-y-6 sm:space-y-8">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl sm:rounded-2xl border border-emerald-100 shadow-sm"><Briefcase size={20} className="sm:w-6 sm:h-6" /></div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">Contrats</h3>
                  </div>
                  <div className="flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="w-full flex-1 space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Libellé</label>
                        <input 
                          type="text" 
                          placeholder="EX: CDI 35H..." 
                          className="w-full h-12 sm:h-14 px-5 sm:px-6 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase outline-none focus:bg-white focus:border-emerald-500 transition-all"
                          value={newContract.name}
                          onChange={e => setNewContract({...newContract, name: e.target.value})}
                        />
                      </div>
                      <div className="w-full sm:w-auto space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 text-center block sm:text-left">Charge</label>
                        <CompactNumberPicker value={newContract.weeklyHours} label="HEURES" onChange={(v) => setNewContract({...newContract, weeklyHours: v})} />
                      </div>
                      <button onClick={addContract} className="w-full sm:w-auto h-12 sm:h-14 px-8 bg-emerald-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                        <Plus size={20} /> Ajouter
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {contracts.map(contract => (
                      <div key={contract.id} className={`bg-white border p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] flex flex-col justify-between group transition-all min-h-[120px] sm:min-h-[140px] shadow-sm ${editingId === `contract-${contract.id}` ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}>
                        {editingId === `contract-${contract.id}` ? (
                          <div className="space-y-4 w-full">
                            <input className="w-full bg-slate-50 border border-emerald-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none" value={tempEditValue.name} onChange={e => setTempEditValue({...tempEditValue, name: e.target.value})} />
                            <div className="flex items-center justify-between gap-4">
                              <CompactNumberPicker value={tempEditValue.weeklyHours} label="HEURES" onChange={v => setTempEditValue({...tempEditValue, weeklyHours: v})} />
                              <button onClick={() => saveEditContract(contract.id)} className="w-11 h-11 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-all"><Check size={20}/></button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <p className="text-[10px] sm:text-[11px] font-black text-slate-900 uppercase tracking-tight truncate flex-1">{contract.name}</p>
                                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                                  <button onClick={() => startEditContract(contract)} className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg"><Edit3 size={15} /></button>
                                  <button onClick={() => setContracts(contracts.filter(c => c.id !== contract.id))} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{contract.weeklyHours}H / SEMAINE</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* SECTION CERTIFICATS LÉGAUX */}
                <section className="space-y-6 sm:space-y-8">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2.5 bg-red-50 text-red-600 rounded-xl sm:rounded-2xl border border-red-100 shadow-sm"><ShieldAlert size={20} className="sm:w-6 sm:h-6" /></div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">Légaux</h3>
                  </div>
                  <div className="flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="w-full flex-1 space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nom du certificat</label>
                        <input 
                          type="text" 
                          placeholder="EX: HACCP, SST..." 
                          className="w-full h-12 sm:h-14 px-5 sm:px-6 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase outline-none focus:bg-white focus:border-red-500 transition-all"
                          value={newCert.name}
                          onChange={e => setNewCert({...newCert, name: e.target.value})}
                        />
                      </div>
                      <div className="w-full sm:w-auto space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 text-center block sm:text-left">Validité</label>
                        <CompactNumberPicker value={newCert.validityMonths} label="MOIS" onChange={(v) => setNewCert({...newCert, validityMonths: v})} />
                      </div>
                      <button onClick={() => addCertConfig(newCert)} className="w-full sm:w-auto h-12 sm:h-14 px-8 bg-red-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 hover:bg-red-700 transition-all text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20">
                        <Plus size={20} /> Ajouter
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {certifications.filter(c => c.isMandatory).map(cert => (
                      <div key={cert.name} className={`bg-white border p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] flex flex-col justify-between group transition-all min-h-[120px] sm:min-h-[140px] shadow-sm ${editingId === `cert-${cert.name}` ? 'border-red-500 ring-4 ring-red-50 shadow-xl' : 'border-slate-100 hover:border-red-200'}`}>
                        {editingId === `cert-${cert.name}` ? (
                          <div className="space-y-4 w-full">
                            <input className="w-full bg-slate-50 border border-red-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none" value={tempEditValue.name} onChange={e => setTempEditValue({...tempEditValue, name: e.target.value})} />
                            <div className="flex items-center justify-between gap-4">
                              <CompactNumberPicker value={tempEditValue.validityMonths} label="MOIS" onChange={v => setTempEditValue({...tempEditValue, validityMonths: v})} />
                              <button onClick={() => saveEditCert(cert.name)} className="w-11 h-11 bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-red-700 transition-all"><Check size={20}/></button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="text-[10px] sm:text-[11px] font-black text-slate-900 uppercase tracking-tight leading-tight flex-1 mr-2 truncate">{cert.name}</h4>
                              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={() => startEditCert(cert)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Edit3 size={15} /></button>
                                <button onClick={() => setCertifications(certifications.filter(c => c.name !== cert.name))} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={15} /></button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="bg-red-50 text-red-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-red-100 inline-block w-fit">
                                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">{cert.validityMonths} mois</span>
                              </div>
                              <button
                                onClick={() => setPdfBuilderCert(cert)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest transition-all ${
                                  cert.pdfTemplatePath
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <FileEdit size={11} />
                                {cert.pdfTemplatePath ? 'PDF configuré' : 'Config. PDF'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* SECTION FORMATIONS MCDO */}
                <section className="space-y-6 sm:space-y-8">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2.5 bg-[#264f36]/10 text-[#264f36] rounded-xl sm:rounded-2xl border border-[#264f36]/20 shadow-sm"><GraduationCap size={20} className="sm:w-6 sm:h-6" /></div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">Interne McDo</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-2xl bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
                    <input 
                      type="text" 
                      placeholder="NOM DU MODULE..." 
                      className="flex-1 h-12 sm:h-14 px-5 sm:px-6 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase outline-none focus:bg-white focus:border-[#264f36] transition-all"
                      value={newTraining.name}
                      onChange={e => setNewTraining({...newTraining, name: e.target.value})}
                    />
                    <button onClick={() => addCertConfig(newTraining)} className="h-12 sm:h-14 px-8 bg-[#264f36] text-white rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-900 transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#264f36]/20">
                      <Plus size={20} /> Ajouter
                    </button>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {certifications.filter(c => !c.isMandatory).map(training => (
                      <div key={training.name} className={`bg-white border p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-center justify-between group transition-all min-h-[80px] sm:min-h-[90px] shadow-sm ${editingId === `cert-${training.name}` ? 'border-[#264f36] ring-4 ring-[#264f36]/10' : 'border-slate-100 hover:border-[#264f36]'}`}>
                        {editingId === `cert-${training.name}` ? (
                          <div className="flex items-center gap-2 w-full">
                             <input className="flex-1 min-w-0 bg-slate-50 border border-[#264f36]/20 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none" value={tempEditValue.name} onChange={e => setTempEditValue({...tempEditValue, name: e.target.value})} autoFocus />
                             <button onClick={() => saveEditCert(training.name)} className="w-10 h-10 sm:w-12 sm:h-12 bg-[#264f36] text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-slate-900 transition-all flex-shrink-0"><Check size={20} /></button>
                          </div>
                        ) : (
                          <>
                            <h4 className="text-[10px] sm:text-[11px] font-black text-slate-900 uppercase tracking-widest pl-1 truncate flex-1">{training.name}</h4>
                            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                               <button onClick={() => startEditCert(training)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={16} /></button>
                               <button onClick={() => setCertifications(certifications.filter(c => c.name !== training.name))} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {pdfBuilderCert && (
      <PDFFormBuilder
        mode="edit"
        certConfig={pdfBuilderCert}
        onClose={() => setPdfBuilderCert(null)}
        onSaveTemplate={handleSavePdfTemplate}
      />
    )}
    </>
  );
};

export default SettingsModal;
