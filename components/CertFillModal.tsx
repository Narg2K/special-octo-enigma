
import React, { useState, useEffect, useRef } from 'react';
import { X, Pen, RotateCcw, CheckCircle2, Clock, Loader2, CalendarCheck, CheckSquare } from 'lucide-react';
import { Employee, EmployeeCert, GlobalCertConfig } from '../types';
import { supabase } from '../services/apiService';
import jsPDF from 'jspdf';

const CHECKLIST_ITEMS = [
  'Formation théorique effectuée',
  'Formation pratique effectuée',
  'Évaluation des connaissances validée',
  "Documents de formation remis à l'employé",
  'Attestation signée par le stagiaire',
];

interface CertFillModalProps {
  employee: Employee;
  certConfig: GlobalCertConfig;
  onClose: () => void;
  onComplete: (cert: EmployeeCert) => void;
}

const CertFillModal: React.FC<CertFillModalProps> = ({ employee, certConfig, onClose, onComplete }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(CHECKLIST_ITEMS.length).fill(false));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const computeExpiry = (fromDate: string) => {
    const d = new Date(fromDate);
    d.setMonth(d.getMonth() + certConfig.validityMonths);
    return d;
  };

  const renewalDate = computeExpiry(date);
  const renewalStr = renewalDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const daysUntilRenewal = Math.ceil((renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => { isDrawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const isCanvasEmpty = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext('2d')!;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== 248 || data[i + 1] !== 250 || data[i + 2] !== 252) return false;
    }
    return true;
  };

  const generateAndUpload = async () => {
    if (!checkedItems.every(Boolean)) {
      setError('Veuillez valider tous les points de formation avant de signer.');
      return;
    }
    if (isCanvasEmpty()) {
      setError('Veuillez apposer votre signature avant de valider.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const obtainedDate = new Date(date);
      const expiryDate = computeExpiry(date);

      // --- Generate PDF ---
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header background
      doc.setFillColor(38, 79, 54);
      doc.rect(0, 0, 210, 44, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text("McDonald's — McFormation", 20, 17);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Attestation de formation : ${certConfig.name}`, 20, 28);
      doc.text('Store #0437', 20, 37);

      // Employee section
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Informations Employé', 20, 58);
      doc.setDrawColor(38, 79, 54);
      doc.line(20, 61, 190, 61);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nom   : ${employee.name}`, 20, 69);
      doc.text(`Rôle  : ${employee.role}`, 20, 77);
      doc.text(`Email : ${employee.email || 'N/A'}`, 20, 85);

      // Certification section
      doc.setFont('helvetica', 'bold');
      doc.text('Informations Certification', 20, 101);
      doc.line(20, 104, 190, 104);
      doc.setFont('helvetica', 'normal');
      doc.text(`Type                 : ${certConfig.name}`, 20, 112);
      doc.text(`Date d'obtention     : ${obtainedDate.toLocaleDateString('fr-FR')}`, 20, 120);
      doc.text(`Validité             : ${certConfig.validityMonths} mois`, 20, 128);
      doc.text(`Prochain renouvellement : ${expiryDate.toLocaleDateString('fr-FR')}`, 20, 136);

      // Checklist section
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Points de formation validés', 20, 148);
      doc.setDrawColor(38, 79, 54);
      doc.line(20, 151, 190, 151);
      doc.setFontSize(9);
      CHECKLIST_ITEMS.forEach((item, i) => {
        const cy = 158 + i * 7;
        const checked = checkedItems[i];
        // Checkbox square
        doc.setDrawColor(38, 79, 54);
        doc.setFillColor(checked ? 38 : 248, checked ? 79 : 250, checked ? 54 : 252);
        doc.rect(20, cy - 3.5, 4, 4, 'FD');
        // Checkmark
        if (checked) {
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.text('\u2713', 20.5, cy);
        }
        // Label
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'normal');
        doc.text(item, 27, cy);
      });

      // Renewal badge box
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(20, 198, 170, 12, 3, 3, 'FD');
      doc.setTextColor(22, 101, 52);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Renouveler avant le : ${expiryDate.toLocaleDateString('fr-FR')}  (dans ${daysUntilRenewal} jours)`, 25, 206);

      // Signature section
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Signature du responsable', 20, 222);
      doc.setDrawColor(38, 79, 54);
      doc.line(20, 225, 190, 225);
      const canvas = canvasRef.current!;
      const signatureData = canvas.toDataURL('image/png');
      doc.addImage(signatureData, 'PNG', 20, 228, 90, 36);
      doc.setDrawColor(200, 210, 220);
      doc.rect(20, 228, 90, 36);

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(160, 160, 160);
      doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} — McFormation Store #0437`, 20, 284);

      const pdfBlob = doc.output('blob');

      // --- Upload to Supabase Storage ---
      const safeName = certConfig.name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${safeName}_${date}.pdf`;
      const filePath = `${employee.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('certifications')
        .upload(filePath, pdfBlob, { contentType: 'application/pdf', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('certifications')
        .getPublicUrl(filePath);

      const cert: EmployeeCert = {
        name: certConfig.name,
        status: 'Complété',
        dateObtained: date,
        expiryDate: expiryDate.toISOString().split('T')[0],
        documentUrl: publicUrl,
      };

      onComplete(cert);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération du document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="bg-[#264f36] p-6 text-white shrink-0">
          <button onClick={onClose} className="absolute top-5 right-5 p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
          <div className="flex items-start justify-between pr-12">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter leading-tight">{certConfig.name}</h2>
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1">{employee.name}</p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-2 rounded-2xl shrink-0">
              <Clock size={14} className="text-emerald-300" />
              <span className="font-black text-sm tabular-nums">{certConfig.validityMonths} mois</span>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Employee info */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Employé', value: employee.name },
              { label: 'Rôle', value: employee.role },
              { label: 'Certification', value: certConfig.name },
              { label: 'Validité', value: `${certConfig.validityMonths} mois` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-xs font-black text-slate-900 uppercase truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Date picker */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date d'obtention</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-[#264f36] transition-all"
            />
          </div>

          {/* Renewal date indicator */}
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${daysUntilRenewal < 30 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <CalendarCheck size={20} className={daysUntilRenewal < 30 ? 'text-red-500' : 'text-emerald-500'} />
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Prochain renouvellement</p>
              <p className={`text-sm font-black uppercase ${daysUntilRenewal < 30 ? 'text-red-700' : 'text-emerald-700'}`}>
                {renewalStr}
              </p>
              <p className="text-[8px] font-bold text-slate-400 uppercase">dans {daysUntilRenewal} jours</p>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Points de formation à valider</label>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-2">
              {CHECKLIST_ITEMS.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCheckedItems(prev => prev.map((v, idx) => idx === i ? !v : v))}
                  className="w-full flex items-center gap-3 text-left group"
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${checkedItems[i] ? 'bg-[#264f36] border-[#264f36]' : 'border-slate-200 bg-white group-hover:border-[#264f36]'}`}>
                    {checkedItems[i] && <CheckSquare size={12} className="text-white" />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide transition-colors ${checkedItems[i] ? 'text-[#264f36]' : 'text-slate-500 group-hover:text-slate-700'}`}>{item}</span>
                </button>
              ))}
            </div>
            {checkedItems.every(Boolean) && (
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest text-center">✓ Tous les points validés</p>
            )}
          </div>

          {/* Signature pad */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Pen size={11} /> Signature numérique
              </label>
              <button onClick={clearCanvas} className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">
                <RotateCcw size={11} /> Effacer
              </button>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden hover:border-[#264f36] transition-colors touch-none">
              <canvas
                ref={canvasRef}
                width={560}
                height={140}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={e => { e.preventDefault(); startDraw(e); }}
                onTouchMove={e => { e.preventDefault(); draw(e); }}
                onTouchEnd={stopDraw}
              />
            </div>
            <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest text-center">Signez dans le cadre ci-dessus</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl text-[9px] font-black uppercase tracking-widest">
              {error}
            </div>
          )}

          <button
            onClick={generateAndUpload}
            disabled={uploading}
            className="w-full py-4 bg-[#264f36] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-900 transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
          >
            {uploading
              ? <><Loader2 className="animate-spin" size={18} /> Génération en cours...</>
              : <><CheckCircle2 size={18} /> Valider et Enregistrer</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertFillModal;
