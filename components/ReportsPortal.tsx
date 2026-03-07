
import React, { useState } from 'react';
import { X, Printer, Download, Loader2, FileText, ChevronLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { Employee, SkillLevel, GlobalCertConfig, Role } from '../types';

interface ReportsPortalProps {
  type: 'soc' | 'certs';
  employees: Employee[];
  availableSkills: string[];
  availableCertifications: GlobalCertConfig[];
  onClose: () => void;
}

const LEVEL_COLORS: Record<SkillLevel, { bg: string; text: string }> = {
  'Expert': { bg: '#264f36', text: '#ffffff' },
  'Formé': { bg: '#10b981', text: '#ffffff' },
  'Intermédiaire': { bg: '#ffbc0d', text: '#000000' },
  'Débutant': { bg: '#fdba74', text: '#92400e' },
  'Non Formé': { bg: '#f1f5f9', text: '#94a3b8' },
};

const CERT_COLORS: Record<string, { bg: string; text: string }> = {
  'Complété': { bg: '#264f36', text: '#ffffff' },
  'À faire': { bg: '#ffbc0d', text: '#000000' },
  'Expiré': { bg: '#ef4444', text: '#ffffff' },
  'Manquant': { bg: '#f1f5f9', text: '#cbd5e1' },
};

const ROLE_INDICATORS: Record<string, string> = {
  [Role.MANAGER]: '#0f172a',
  [Role.TRAINER]: '#2563eb',
  [Role.EQUIPPIER]: '#38bdf8',
  [Role.MCCAFE]: '#10b981',
  [Role.HOTE]: '#ef4444',
};

const formatHeaderName = (name: string) => {
  const upper = name.toUpperCase();
  const dict: Record<string, string> = {
    'MAINTENANCE': 'MAINT.', 'LIVRAISON': 'LIVR.', 'NETTOYAGE': 'NETT.',
    'BOISSON': 'BOIS.', 'CUISON': 'CUIS.', 'VIANDE': 'V.', 'COMMANDE': 'CMD'
  };
  let formatted = upper;
  Object.entries(dict).forEach(([f, s]) => { formatted = formatted.replace(f, s); });
  return formatted;
};

const ReportsPortal: React.FC<ReportsPortalProps> = ({ type, employees, availableSkills, availableCertifications, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const today = new Date().toLocaleDateString('fr-FR');

  const filteredEmployees = employees.filter(emp => emp.role === Role.EQUIPPIER);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    
    // @ts-ignore
    const jspdfLib = window.jspdf;
    // @ts-ignore
    const html2canvasLib = window.html2canvas;

    if (!jspdfLib || !html2canvasLib) {
      console.error("Librairies PDF manquantes");
      alert("Erreur technique : Librairies de génération non prêtes.");
      setIsGenerating(false);
      return;
    }

    try {
      const pdf = new jspdfLib.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // On divise les employés par groupes pour tenir sur des pages A4
      const itemsPerPage = 45;
      const chunks = [];
      for (let i = 0; i < filteredEmployees.length; i += itemsPerPage) {
        chunks.push(filteredEmployees.slice(i, i + itemsPerPage));
      }

      // Si aucun employé, on génère quand même une page vide ou avec l'entête
      if (chunks.length === 0) chunks.push([]);

      for (let i = 0; i < chunks.length; i++) {
        if (i > 0) pdf.addPage();
        
        // On crée un conteneur temporaire pour la capture de la page i
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '210mm';
        tempContainer.style.backgroundColor = '#ffffff';
        document.body.appendChild(tempContainer);

        // On clone l'élément de base mais on ne garde que les employés du chunk
        const baseElement = document.getElementById('report-document-a4');
        if (!baseElement) continue;
        
        const clone = baseElement.cloneNode(true) as HTMLElement;
        clone.style.height = '297mm';
        clone.style.width = '210mm';
        clone.style.minHeight = '297mm';
        clone.style.maxHeight = '297mm';
        clone.style.margin = '0';
        clone.style.padding = '10mm';
        clone.style.boxSizing = 'border-box';
        
        tempContainer.appendChild(clone);

        // On remplace le tbody par celui du chunk
        const tbody = clone.querySelector('tbody');
        if (tbody) {
          tbody.innerHTML = '';
          chunks[i].forEach(emp => {
            const row = document.createElement('tr');
            row.style.height = '18px';
            row.className = 'page-break-inside-avoid';
            
            // Construction manuelle de la ligne pour éviter les problèmes de React/DOM
            const roleColor = ROLE_INDICATORS[emp.role] || '#64748b';
            
            let cellsHtml = `
              <td style="background-color: white; border: none; padding: 0; overflow: hidden; vertical-align: middle;">
                <div style="display: flex; align-items: center; height: 100%; padding-left: 4px; padding-right: 2px; gap: 4px;">
                   <div style="width: 6px; height: 6px; border-radius: 1px; flex-shrink: 0; background-color: ${roleColor};"></div>
                   <span style="font-size: 7px; font-weight: 800; text-transform: uppercase; color: #0f172a; line-height: 1; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${emp.name}</span>
                </div>
              </td>
            `;

            if (type === 'soc') {
              availableSkills.forEach(skillName => {
                const skill = emp.skills.find(s => s.name.toUpperCase() === skillName.toUpperCase());
                const level = skill?.level || 'Non Formé';
                const styles = LEVEL_COLORS[level];
                const char = level === 'Non Formé' ? '-' : level[0].toUpperCase();
                cellsHtml += `
                  <td style="border: none; text-align: center; padding: 0; vertical-align: middle; background-color: ${styles.bg}; width: 16px;">
                    <span style="font-size: 5px; font-weight: 900; line-height: 1; display: block; text-transform: uppercase; color: ${styles.text};">
                      ${char}
                    </span>
                  </td>
                `;
              });
            } else {
              availableCertifications.filter(c => c.isMandatory).forEach(mandatoryCert => {
                const empCert = emp.certifications.find(c => c.name === mandatoryCert.name);
                const status = empCert?.status || 'Manquant';
                const styles = CERT_COLORS[status];
                cellsHtml += `
                  <td style="border: none; text-align: center; padding: 0; vertical-align: middle; background-color: ${styles.bg}; width: 22px;">
                    <span style="font-size: 5px; font-weight: 900; text-transform: uppercase; line-height: 1; color: ${styles.text};">
                      ${status === 'Complété' ? 'V' : '-'}
                    </span>
                  </td>
                `;
              });
            }
            row.innerHTML = cellsHtml;
            tbody.appendChild(row);
          });
        }

        // Ajout du numéro de page en bas
        const footer = clone.querySelector('.mt-8');
        if (footer) {
          const pageNum = document.createElement('div');
          pageNum.style.fontSize = '8px';
          pageNum.style.fontWeight = '900';
          pageNum.style.color = '#cbd5e1';
          pageNum.style.textTransform = 'uppercase';
          pageNum.innerText = `Page ${i + 1} / ${chunks.length}`;
          footer.appendChild(pageNum);
        }

        const canvas = await html2canvasLib(clone, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: 794, // 210mm at 96dpi
          height: 1123 // 297mm at 96dpi
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        document.body.removeChild(tempContainer);
      }

      pdf.save(`MCFO_${type.toUpperCase()}_${today.replace(/\//g, '-')}.pdf`);
    } catch (err) {
      console.error("Erreur génération PDF:", err);
      alert("Une erreur est survenue lors de la création du PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-slate-100 overflow-y-auto font-sans">
      <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-6 no-print z-[610] shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <ChevronLeft size={20} className="text-slate-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-[#264f36] p-2.5 rounded-xl text-white shadow-lg">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-tighter text-slate-900 leading-none">Console d'Exportation</h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Format A4 Portrait • Store #0437</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#264f36] text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isGenerating ? "Génération..." : "Télécharger PDF"}
          </button>
          
          <button 
            onClick={() => window.print()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer size={16} /> Imprimer
          </button>

          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 border border-red-100 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="py-12 flex flex-col items-center no-print bg-slate-200/40 min-h-screen">
        <div 
          id="report-document-a4" 
          className="bg-white shadow-2xl overflow-hidden"
          style={{ 
            width: '210mm', 
            minHeight: '297mm',
            padding: '10mm 10mm',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff'
          }}
        >
          <div className="flex justify-between items-center mb-10 border-b-2 border-slate-900 pb-6 w-full">
            <div className="flex items-center gap-4">
               <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg" alt="M" className="w-12 h-12 object-contain" />
            </div>
            <div className="text-right space-y-1">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Dernière mise à jour : {today}</p>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Téléchargé et émis le : {today}</p>
            </div>
          </div>

          <div className="w-full flex-1">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="h-16">
                  <th className="bg-slate-900 text-white p-2 text-[8px] font-black uppercase border-none text-left w-[120px] align-middle">
                    Employé
                  </th>
                  {type === 'soc' ? (
                    availableSkills.map(skill => (
                      <th key={skill} className="bg-slate-50 border-none p-0 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="transform -rotate-90 whitespace-nowrap text-[6px] font-black uppercase tracking-tighter text-slate-800">
                            {formatHeaderName(skill)}
                          </span>
                        </div>
                      </th>
                    ))
                  ) : (
                    availableCertifications.filter(c => c.isMandatory).map(cert => (
                      <th key={cert.name} className="bg-slate-50 border-none p-1 text-[6px] font-black uppercase leading-tight text-slate-800 text-center align-middle">
                        {cert.name}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="h-5 page-break-inside-avoid">
                    <td className="bg-white border-none p-0 overflow-hidden align-middle">
                      <div className="flex items-center h-full pl-2 pr-1 gap-1.5">
                         <div className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ backgroundColor: ROLE_INDICATORS[emp.role] || '#64748b' }}></div>
                         <span className="text-[7px] font-black uppercase text-slate-900 leading-none block truncate">{emp.name}</span>
                      </div>
                    </td>
                    {type === 'soc' ? (
                      availableSkills.map(skillName => {
                        const skill = emp.skills.find(s => s.name.toUpperCase() === skillName.toUpperCase());
                        const level = skill?.level || 'Non Formé';
                        const styles = LEVEL_COLORS[level];
                        const char = level === 'Non Formé' ? '-' : level[0].toUpperCase();
                        return (
                          <td key={skillName} className="border-none text-center p-0 align-middle" style={{ backgroundColor: styles.bg }}>
                            <span className="text-[5px] font-black leading-none block uppercase" style={{ color: styles.text }}>
                              {char}
                            </span>
                          </td>
                        );
                      })
                    ) : (
                      availableCertifications.filter(c => c.isMandatory).map(mandatoryCert => {
                        const empCert = emp.certifications.find(c => c.name === mandatoryCert.name);
                        const status = empCert?.status || 'Manquant';
                        const styles = CERT_COLORS[status];
                        return (
                          <td key={mandatoryCert.name} className="border-none text-center p-0 align-middle" style={{ backgroundColor: styles.bg }}>
                            <span className="text-[5px] font-black uppercase leading-none" style={{ color: styles.text }}>
                              {status === 'Complété' ? 'V' : '-'}
                            </span>
                          </td>
                        );
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-auto pt-8 mt-8 border-t border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg" alt="M" className="w-6 h-6 object-contain" />
            </div>
            <div className="text-right space-y-1">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Dernière mise à jour : {today}</p>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Téléchargé et émis le : {today}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { background: white !important; margin: 0 !important; }
          .no-print { display: none !important; }
          #report-document-a4 {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
          table { width: 100% !important; border: 1pt solid #cbd5e1 !important; }
          th, td { border: 0.5pt solid #cbd5e1 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportsPortal;
