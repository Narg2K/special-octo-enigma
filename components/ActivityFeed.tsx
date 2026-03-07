
import React, { useState, useEffect, useRef } from 'react';
import { Activity, Clock, User, Filter, Search, Database, Zap, Timer, ChevronLeft, ChevronRight } from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityFeedProps {
  logs: ActivityLog[];
}

const LOGS_PER_PAGE = 20;

// Handles both ISO ("2026-03-06T14:30:00.000Z") and legacy locale strings ("06/03/2026, 14:30:00")
const formatLogTimestamp = (ts: string) => {
  const d = new Date(ts);
  if (!isNaN(d.getTime())) {
    return {
      time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      date: d.toLocaleDateString('fr-FR'),
    };
  }
  // Legacy fallback
  const [date, time] = ts.split(', ');
  return { date: date || ts, time: time || '' };
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter]);

  // Remonter en haut de la liste lors du changement de page
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || log.category === filter;
    return matchesSearch && matchesFilter;
  });

  // Sort by date (newest first — DB returns newest first, preserve that order)
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const da = new Date(a.timestamp).getTime();
    const db = new Date(b.timestamp).getTime();
    // Fallback for non-parseable legacy timestamps: keep original order
    if (isNaN(da) || isNaN(db)) return 0;
    return db - da;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedLogs.length / LOGS_PER_PAGE);
  const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
  const paginatedLogs = sortedLogs.slice(startIndex, startIndex + LOGS_PER_PAGE);

  const getCategoryStyles = (category: string) => {
    switch(category) {
      case 'SOC': return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <Database size={14} /> };
      case 'RETARD': return { bg: 'bg-red-50', text: 'text-red-600', icon: <Timer size={14} /> };
      case 'EQUIPE': return { bg: 'bg-blue-50', text: 'text-blue-600', icon: <User size={14} /> };
      case 'FORMATION': return { bg: 'bg-amber-50', text: 'text-amber-600', icon: <Zap size={14} /> };
      default: return { bg: 'bg-slate-50', text: 'text-slate-600', icon: <Activity size={14} /> };
    }
  };

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Logs Système</h1>
          <p className="text-slate-500 font-medium">Journal d'audit complet des modifications système et managériales.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 w-full sm:w-auto">
           <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input
                type="text"
                placeholder="Rechercher une action..."
                className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold outline-none focus:border-[#264f36] transition-all w-full sm:w-56 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

           <div className="overflow-x-auto no-scrollbar">
             <div className="flex bg-white p-1 rounded-full border border-slate-200 shadow-sm min-w-max">
               {['ALL', 'EQUIPE', 'SOC', 'RETARD', 'FORMATION'].map((cat) => (
                 <button
                   key={cat}
                   onClick={() => setFilter(cat)}
                   className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                     filter === cat ? 'bg-[#264f36] text-white' : 'text-slate-400 hover:text-slate-600'
                   }`}
                 >
                   {cat === 'ALL' ? 'Tout' : cat}
                 </button>
               ))}
             </div>
           </div>
        </div>
      </div>

      {/* Main Log Feed */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
         <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock size={16} /> Chronologie des modifications
            </span>
            <span className="text-[9px] font-bold text-[#264f36] bg-[#264f36]/10 px-3 py-1 rounded-full uppercase tracking-widest">
              {filteredLogs.length} événements trouvés
            </span>
         </div>

         <div 
           ref={scrollContainerRef}
           className="divide-y divide-slate-50 max-h-[70vh] overflow-y-auto custom-scrollbar"
         >
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => {
                const styles = getCategoryStyles(log.category);
                return (
                  <div key={log.id} className="p-6 hover:bg-slate-50/30 transition-all flex items-start gap-6 relative group">
                    <div className="hidden md:flex flex-col items-end min-w-[100px] pt-1">
                       <span className="text-[10px] font-black text-slate-900">{formatLogTimestamp(log.timestamp).time}</span>
                       <span className="text-[8px] font-bold text-slate-400 uppercase">{formatLogTimestamp(log.timestamp).date}</span>
                    </div>

                    <div className="relative flex flex-col items-center">
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm shrink-0 z-10 ${styles.bg} ${styles.text}`}>
                          {styles.icon}
                       </div>
                       <div className="absolute top-10 bottom-[-30px] w-0.5 bg-slate-100 group-last:hidden"></div>
                    </div>

                    <div className="flex-1 space-y-2">
                       <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.action}</h4>
                          <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${styles.bg} ${styles.text}`}>
                             {log.category}
                          </div>
                       </div>
                       <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                         {log.details}
                       </p>
                       <div className="flex items-center gap-2 pt-1">
                          <div className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[8px] font-black">
                             {log.user[0]}
                          </div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Modifié par : {log.user}</span>
                       </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-24 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-center mx-auto mb-6">
                   <Activity size={32} className="text-slate-200" />
                </div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucun événement enregistré</p>
              </div>
            )}
         </div>

         {/* Pagination Controls */}
         {totalPages > 1 && (
            <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Page {currentPage} sur {totalPages}
               </div>
               <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#264f36] hover:border-[#264f36] disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all shadow-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm border ${
                          currentPage === i + 1 
                            ? 'bg-[#264f36] text-white border-[#264f36]' 
                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#264f36] hover:border-[#264f36] disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all shadow-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default ActivityFeed;
