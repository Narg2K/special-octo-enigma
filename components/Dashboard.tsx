
import React from 'react';
import { GraduationCap, CheckCircle, Users, ShieldAlert, BellRing, UserCheck, AlertOctagon, ShieldCheck, FileWarning, ChevronRight, Coffee, HeartHandshake } from 'lucide-react';
import { GlobalCertConfig, Role, Employee } from '../types';

interface DashboardProps {
  employees: Employee[];
  availableCertifications: GlobalCertConfig[];
  availableSkills: string[];
  onNavigateToEmployee: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ employees, availableCertifications, availableSkills, onNavigateToEmployee }) => {
  const mandatoryConfigs = availableCertifications.filter(c => c.isMandatory);
  
  const alertsByEmployee = employees
    .filter(emp => emp.role === Role.TRAINER || emp.role === Role.EQUIPPIER)
    .reduce((acc, emp) => {
    const empAlerts = [];
    for (const globalCert of mandatoryConfigs) {
      const empCert = emp.certifications.find(c => c.name === globalCert.name);
      if (!empCert || empCert.status !== 'Complété') {
        empAlerts.push({ certName: globalCert.name, type: 'MANQUANT', priority: 'HIGH' });
      } else if (empCert.expiryDate) {
        const expiryDate = new Date(empCert.expiryDate.split('/').reverse().join('-'));
        const now = new Date();
        const thirtyDays = new Date(); thirtyDays.setDate(now.getDate() + 30);
        if (expiryDate < now) empAlerts.push({ certName: globalCert.name, type: 'EXPIRÉ', priority: 'HIGH' });
        else if (expiryDate < thirtyDays) empAlerts.push({ certName: globalCert.name, type: 'ÉCHÉANCE', priority: 'MEDIUM' });
      }
    }
    if (empAlerts.length > 0) acc.push({ id: emp.id, name: emp.name, role: emp.role, alerts: empAlerts });
    return acc;
  }, [] as any[]);

  const targetEmployees = employees.filter(emp => emp.role === Role.TRAINER || emp.role === Role.EQUIPPIER);

  const completedCerts = targetEmployees.reduce((acc, emp) => {
    return acc + mandatoryConfigs.filter(mc => emp.certifications.some(c => c.name === mc.name && c.status === 'Complété')).length;
  }, 0);
  
  const totalSlots = targetEmployees.length * mandatoryConfigs.length;
  const certCompliance = totalSlots > 0 ? Math.round((completedCerts / totalSlots) * 100) : 100;

  const StatCard = ({ icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) => (
    <div className="bg-white p-4 md:p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center space-x-3 md:space-x-4 transition-all">
      <div className={`${color} p-3 md:p-4 rounded-xl shadow-lg`}>{icon}</div>
      <div>
        <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xl md:text-3xl font-black text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-10 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Pilotage McFormation</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm italic">Conformité opérationnelle Store #0437.</p>
        </div>
        <div className={`flex items-center gap-4 px-6 md:px-8 py-3 md:py-4 rounded-full shadow-xl self-start sm:self-auto ${certCompliance < 80 ? 'bg-red-600' : 'bg-[#264f36]'} text-white`}>
           <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Conformité Certificats</span>
              <span className="text-xl md:text-2xl font-black">{certCompliance}%</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard icon={<ShieldCheck size={20} className="text-slate-400" />} label="Managers" value={employees.filter(e => e.role === Role.MANAGER).length} color="bg-white border border-slate-100" />
        <StatCard icon={<GraduationCap size={20} className="text-white" />} label="Formateurs" value={employees.filter(e => e.role === Role.TRAINER).length} color="bg-blue-600" />
        <StatCard icon={<Users size={20} className="text-white" />} label="Équipiers" value={employees.filter(e => e.role === Role.EQUIPPIER).length} color="bg-sky-400" />
        <StatCard icon={<Coffee size={20} className="text-white" />} label="Mc Café" value={employees.filter(e => e.role === Role.MCCAFE).length} color="bg-emerald-500" />
        <StatCard icon={<HeartHandshake size={20} className="text-white" />} label="Accueil" value={employees.filter(e => e.role === Role.HOTE).length} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-6">
              <BellRing className="text-red-500" size={20} /> Alertes prioritaires ({alertsByEmployee.length})
            </h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
              {alertsByEmployee.map((emp) => (
                <button 
                  key={emp.id} 
                  onClick={() => onNavigateToEmployee(emp.id)} 
                  className="w-full text-left p-5 bg-white border border-slate-100 rounded-[1.5rem] flex flex-col gap-3 hover:border-red-200 hover:bg-red-50/30 transition-all shadow-sm group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-black text-sm text-white shadow-lg group-hover:scale-110 transition-transform">
                        {emp.name[0]}
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase text-slate-900 tracking-tight">{emp.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{emp.role}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-red-500 transition-colors" />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {emp.alerts.map((alert: any, idx: number) => (
                      <div 
                        key={idx} 
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-2 border ${
                          alert.type === 'EXPIRÉ' || alert.type === 'MANQUANT' 
                            ? 'bg-red-50 border-red-100 text-red-600' 
                            : 'bg-amber-50 border-amber-100 text-amber-600'
                        }`}
                      >
                        {alert.type === 'EXPIRÉ' ? <AlertOctagon size={10} /> : <FileWarning size={10} />}
                        <span className="text-[9px] font-black uppercase tracking-tight">
                          {alert.certName}: {alert.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
              {alertsByEmployee.length === 0 && (
                <div className="text-center py-16 space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck size={32} className="text-emerald-500" />
                  </div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Conformité 100% - Aucune alerte</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
           <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-6">
             <GraduationCap className="text-[#264f36]" size={20} /> Qualité Opérationnelle
           </h2>
           <div className="flex-1 overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-slate-100">
                   <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Poste</th>
                   <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Formés</th>
                   <th className="pb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Ratio</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {availableSkills.map(skill => {
                   const trained = targetEmployees.filter(e => e.skills.some(s => s.name === skill && (s.level === 'Formé' || s.level === 'Expert'))).length;
                   const pct = targetEmployees.length > 0 ? Math.round((trained / targetEmployees.length) * 100) : 0;
                   return (
                     <tr key={skill}>
                       <td className="py-4 text-[10px] font-black uppercase text-slate-800">{skill}</td>
                       <td className="py-4 text-center font-black text-sm text-[#264f36]">{trained}</td>
                       <td className="py-4">
                          <div className="w-16 sm:w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-[#264f36]" style={{ width: `${pct}%` }}></div>
                          </div>
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
