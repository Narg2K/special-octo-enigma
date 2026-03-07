
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { X, MousePointer, CheckSquare, PenLine, Trash2, Save, Upload, Loader2, ZoomIn, ZoomOut, FileEdit, Type, Calendar, User, UserCircle, ArrowLeft } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Employee, EmployeeCert, GlobalCertConfig, PDFField } from '../types';
import { supabase } from '../services/apiService';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

type Tool = 'select' | 'checkbox' | 'signature' | 'text' | 'date' | 'trainer' | 'employee';

interface PDFFormBuilderProps {
  mode: 'edit' | 'fill';
  certConfig: GlobalCertConfig;
  employee?: Employee;
  onClose: () => void;
  onSaveTemplate?: (updated: GlobalCertConfig) => void;
  onComplete?: (cert: EmployeeCert) => void;
}

interface PageRender {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

const PDFFormBuilder: React.FC<PDFFormBuilderProps> = ({
  mode, certConfig, employee, onClose, onSaveTemplate, onComplete,
}) => {
  const [pages, setPages] = useState<PageRender[]>([]);
  const [fields, setFields] = useState<PDFField[]>(certConfig.pdfFields || []);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);

  // Fill mode state
  const [checkedFields, setCheckedFields] = useState<Record<string, boolean>>({});
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  // Signature canvases stored in a ref (not state) to avoid re-renders clearing them
  const sigCanvasesRef = useRef<Record<string, HTMLCanvasElement>>({});
  const sigRefCallbacks = useRef<Record<string, (el: HTMLCanvasElement | null) => void>>({});
  const [isDrawing, setIsDrawing] = useState<Record<string, boolean>>({});

  // Fill mode: post-save preview
  const [savedPdfUrl, setSavedPdfUrl] = useState<string | null>(null);
  const [savedCert, setSavedCert] = useState<EmployeeCert | null>(null);

  // Edit mode: upload
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [templatePath, setTemplatePath] = useState<string | undefined>(certConfig.pdfTemplatePath);

  // Date for fill mode — defaults to today, user-editable (linked to expiry)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Trainer name — logged-in user
  const [trainerName, setTrainerName] = useState('');
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single();
      const fn = (data as any)?.first_name || '';
      const ln = (data as any)?.last_name || '';
      setTrainerName([fn, ln].filter(Boolean).join(' ') || user.email || '');
    })();
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const existingPdfInputRef = useRef<HTMLInputElement>(null);
  const [uploadingExisting, setUploadingExisting] = useState(false);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Drag/resize refs (edit mode)
  const dragRef = useRef<{
    fieldId: string;
    type: 'move' | 'resize';
    startMouseX: number;
    startMouseY: number;
    startFieldX: number;
    startFieldY: number;
    startFieldW: number;
    startFieldH: number;
    pageW: number;
    pageH: number;
  } | null>(null);
  const draggedRef = useRef(false);
  const scaleRef = useRef(scale);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  // Fixed render scale for quality — zoom is CSS-only to preserve signatures
  const RENDER_SCALE = 1.5;

  const renderPages = useCallback(async (pdf: pdfjsLib.PDFDocumentProxy) => {
    const rendered: PageRender[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      // annotationMode: 1 = ENABLE — renders all annotations (incl. form checkboxes) directly on canvas
      await page.render({ canvasContext: ctx as any, viewport, canvas, annotationMode: 1 } as any).promise;
      rendered.push({ canvas, width: viewport.width, height: viewport.height });
    }
    setPages(rendered);
  }, []);

  // Load PDF once — never depends on scale
  useEffect(() => {
    if (!templatePath) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { data: { publicUrl } } = supabase.storage.from('pdf-templates').getPublicUrl(templatePath);
        const pdf = await pdfjsLib.getDocument({
          url: publicUrl,
          cMapPacked: true,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        }).promise;
        pdfDocRef.current = pdf;
        await renderPages(pdf);
      } catch (e: any) {
        setError('Impossible de charger le PDF : ' + (e.message || String(e)));
      } finally {
        setLoading(false);
      }
    })();
  }, [templatePath, renderPages]);

  useLayoutEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Global drag/resize mouse handlers (edit mode)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      draggedRef.current = true;
      const d = dragRef.current;
      const s = scaleRef.current;
      const dxPct = ((e.clientX - d.startMouseX) / (d.pageW * s)) * 100;
      const dyPct = ((e.clientY - d.startMouseY) / (d.pageH * s)) * 100;
      setFields(prev => prev.map(f => {
        if (f.id !== d.fieldId) return f;
        if (d.type === 'move') {
          return {
            ...f,
            x: Math.max(0, Math.min(100 - f.width, d.startFieldX + dxPct)),
            y: Math.max(0, Math.min(100 - f.height, d.startFieldY + dyPct)),
          };
        }
        return {
          ...f,
          width: Math.max(2, d.startFieldW + dxPct),
          height: Math.max(2, d.startFieldH + dyPct),
        };
      }));
    };
    const onUp = () => {
      if (dragRef.current && draggedRef.current) {
        window.addEventListener('click', e => e.stopPropagation(), { capture: true, once: true });
      }
      dragRef.current = null;
      draggedRef.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Edit mode: upload PDF template
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    setError(null);
    try {
      const safeName = certConfig.name.replace(/[^a-zA-Z0-9]/g, '_');
      const path = `${safeName}.pdf`;
      const { error: upErr } = await supabase.storage
        .from('pdf-templates')
        .upload(path, file, { contentType: 'application/pdf', upsert: true });
      if (upErr) throw upErr;
      setTemplatePath(path);
    } catch (e: any) {
      setError('Erreur upload : ' + (e.message || String(e)));
    } finally {
      setUploadingPdf(false);
    }
  };

  // Edit mode: click on page to add a field
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
    if (mode !== 'edit' || activeTool === 'select') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newField: PDFField = {
      id: crypto.randomUUID(),
      type: activeTool as PDFField['type'],
      page: pageIndex,
      x,
      y,
      width: activeTool === 'signature' ? 25 : activeTool === 'checkbox' ? 3 : 35,
      height: activeTool === 'signature' ? 10 : activeTool === 'checkbox' ? 3 : 4,
      label: activeTool === 'signature' ? 'Signature' : activeTool === 'text' ? 'Texte' : activeTool === 'date' ? 'Date' : activeTool === 'trainer' ? 'Formateur' : activeTool === 'employee' ? 'Équipier' : 'Case à cocher',
    };
    setFields(prev => [...prev, newField]);
  };

  const removeField = (id: string) => setFields(prev => prev.filter(f => f.id !== id));

  const startMove = (e: React.MouseEvent, field: PDFField, pageW: number, pageH: number) => {
    e.stopPropagation();
    e.preventDefault();
    draggedRef.current = false;
    dragRef.current = { fieldId: field.id, type: 'move', startMouseX: e.clientX, startMouseY: e.clientY, startFieldX: field.x, startFieldY: field.y, startFieldW: field.width, startFieldH: field.height, pageW, pageH };
  };

  const startResize = (e: React.MouseEvent, field: PDFField, pageW: number, pageH: number) => {
    e.stopPropagation();
    e.preventDefault();
    draggedRef.current = false;
    dragRef.current = { fieldId: field.id, type: 'resize', startMouseX: e.clientX, startMouseY: e.clientY, startFieldX: field.x, startFieldY: field.y, startFieldW: field.width, startFieldH: field.height, pageW, pageH };
  };

  // Edit mode: auto-detect AcroForm fields from the PDF
  const [detecting, setDetecting] = useState(false);
  const [detectedCount, setDetectedCount] = useState<number | null>(null);

  const handleDetectFields = async () => {
    if (!pdfDocRef.current) return;
    setDetecting(true);
    setDetectedCount(null);
    try {
      const pdf = pdfDocRef.current;
      const detected: PDFField[] = [];

      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: 1 });
        const pw = viewport.width;
        const ph = viewport.height;
        const annotations = await page.getAnnotations();

        for (const ann of annotations) {
          if (ann.subtype !== 'Widget') continue;
          const [x1, y1, x2, y2]: number[] = ann.rect;
          const fx = (Math.min(x1, x2) / pw) * 100;
          const fw = (Math.abs(x2 - x1) / pw) * 100;
          const fh = (Math.abs(y2 - y1) / ph) * 100;
          const fy = ((ph - Math.max(y1, y2)) / ph) * 100;

          const rawName: string = (ann.fieldName || '').toLowerCase();

          let type: PDFField['type'] = 'text';
          if (ann.fieldType === 'Sig') type = 'signature';
          else if (ann.fieldType === 'Btn') type = 'checkbox';
          else if (/signat/.test(rawName)) type = 'signature';
          else if (/formateur|trainer|animateur/.test(rawName)) type = 'trainer';
          else if (/equipier|équipier|employee|employ|stagiaire|nom/.test(rawName)) type = 'employee';
          else if (/date/.test(rawName)) type = 'date';

          const labelMap: Record<PDFField['type'], string> = {
            checkbox: 'Case', signature: 'Signature', text: 'Texte',
            date: 'Date', trainer: 'Formateur', employee: 'Équipier',
          };

          detected.push({
            id: crypto.randomUUID(),
            type,
            page: i,
            x: fx,
            y: fy,
            width: Math.max(2, fw),
            height: Math.max(1, fh),
            label: ann.fieldName || labelMap[type],
          });
        }
      }

      setFields(prev => [...prev, ...detected]);
      setDetectedCount(detected.length);
    } finally {
      setDetecting(false);
    }
  };

  // Edit mode: save layout
  const handleSaveTemplate = async () => {
    if (!onSaveTemplate) return;
    setSaving(true);
    try {
      onSaveTemplate({ ...certConfig, pdfTemplatePath: templatePath, pdfFields: fields });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Fill mode: upload an already-filled PDF directly to certifications
  const handleUploadExistingPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee) return;
    setUploadingExisting(true);
    setError(null);
    try {
      const safeName = certConfig.name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${safeName}_${date}.pdf`;
      const filePath = `${employee.id}/${fileName}`;
      const { error: upErr } = await supabase.storage
        .from('certifications')
        .upload(filePath, file, { contentType: 'application/pdf', upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl: docUrl } } = supabase.storage.from('certifications').getPublicUrl(filePath);
      const expiryDate = new Date(date);
      expiryDate.setMonth(expiryDate.getMonth() + certConfig.validityMonths);
      const cert: EmployeeCert = {
        name: certConfig.name,
        status: 'Complété',
        dateObtained: date,
        expiryDate: expiryDate.toISOString().split('T')[0],
        documentUrl: docUrl,
      };
      setSavedPdfUrl(docUrl);
      setSavedCert(cert);
    } catch (err: any) {
      setError('Erreur : ' + (err.message || String(err)));
    } finally {
      setUploadingExisting(false);
      e.target.value = '';
    }
  };

  // Fill mode: stable signature canvas ref callbacks (created once per field to prevent re-renders clearing canvas)
  const getSigRef = (fieldId: string) => {
    if (!sigRefCallbacks.current[fieldId]) {
      sigRefCallbacks.current[fieldId] = (canvas: HTMLCanvasElement | null) => {
        if (!canvas) { delete sigCanvasesRef.current[fieldId]; return; }
        if (sigCanvasesRef.current[fieldId] === canvas) return; // already set up
        sigCanvasesRef.current[fieldId] = canvas;
        const ctx = canvas.getContext('2d')!;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      };
    }
    return sigRefCallbacks.current[fieldId];
  };

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * sx, y: ((e as React.MouseEvent).clientY - rect.top) * sy };
  };

  const startSig = (e: React.MouseEvent | React.TouchEvent, fieldId: string) => {
    e.preventDefault();
    const canvas = sigCanvasesRef.current[fieldId];
    if (!canvas) return;
    setIsDrawing(prev => ({ ...prev, [fieldId]: true }));
    const ctx = canvas.getContext('2d')!;
    const pos = getCanvasPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const drawSig = (e: React.MouseEvent | React.TouchEvent, fieldId: string) => {
    e.preventDefault();
    if (!isDrawing[fieldId]) return;
    const canvas = sigCanvasesRef.current[fieldId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getCanvasPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopSig = (fieldId: string) => setIsDrawing(prev => ({ ...prev, [fieldId]: false }));

  const clearSig = (fieldId: string) => {
    const canvas = sigCanvasesRef.current[fieldId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const isSigEmpty = (fieldId: string) => {
    const canvas = sigCanvasesRef.current[fieldId];
    if (!canvas) return true;
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return false;
    return true;
  };

  // Fill mode: generate and save filled PDF
  const handleFillAndSave = async () => {
    if (!employee) return;
    setSaving(true);
    setError(null);
    try {
      const { data: { publicUrl } } = supabase.storage.from('pdf-templates').getPublicUrl(templatePath!);
      const resp = await fetch(publicUrl);
      const bytes = await resp.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const pdfPages = pdfDoc.getPages();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const form = pdfDoc.getForm();

      // Phase 1 — set AcroForm field states via pdf-lib API (works for detected fields whose
      // label matches the original AcroForm field name). Track which fields were handled this way.
      const handledViaAcroForm = new Set<string>();
      for (const field of fields) {
        const label = field.label;
        if (!label) continue;
        try {
          if (field.type === 'checkbox') {
            const cb = form.getCheckBox(label);
            if (checkedFields[field.id]) cb.check(); else cb.uncheck();
            handledViaAcroForm.add(field.id);
          } else if (field.type === 'text' && textValues[field.id]) {
            form.getTextField(label).setText(textValues[field.id]);
            handledViaAcroForm.add(field.id);
          } else if (field.type === 'date') {
            form.getTextField(label).setText(textValues[field.id] || date);
            handledViaAcroForm.add(field.id);
          } else if (field.type === 'trainer') {
            form.getTextField(label).setText(trainerName);
            handledViaAcroForm.add(field.id);
          } else if (field.type === 'employee') {
            form.getTextField(label).setText(employee.name);
            handledViaAcroForm.add(field.id);
          }
        } catch (_) { /* field not in AcroForm — will draw manually below */ }
      }

      // Flatten with correct AcroForm states (embeds appearances into page content)
      try { form.flatten(); } catch (_) {}

      // Phase 2 — draw custom content for fields NOT handled via AcroForm
      // (manually placed fields) + signatures always go here
      for (const field of fields) {
        if (field.type !== 'signature' && handledViaAcroForm.has(field.id)) continue;
        const page = pdfPages[field.page];
        if (!page) continue;
        const pw = page.getWidth();
        const ph = page.getHeight();
        const fx = (field.x / 100) * pw;
        const fw = (field.width / 100) * pw;
        const fh = (field.height / 100) * ph;
        const fy = ph - (field.y / 100) * ph - fh; // PDF y-axis is bottom-up

        const drawStr = (txt: string) => {
          const fs = fh * 0.55;
          page.drawText(txt, { x: fx + 2, y: fy + (fh - fs) / 2, size: fs, font: helvetica, color: rgb(0.05, 0.05, 0.05), maxWidth: fw - 4 });
        };

        if (field.type === 'text' && textValues[field.id]) drawStr(textValues[field.id]);
        if (field.type === 'date') drawStr(textValues[field.id] || date);
        if (field.type === 'trainer' && trainerName) drawStr(trainerName);
        if (field.type === 'employee' && employee?.name) drawStr(employee.name);

        if (field.type === 'checkbox' && checkedFields[field.id]) {
          page.drawRectangle({ x: fx, y: fy, width: fw, height: fh, color: rgb(0.15, 0.31, 0.21) });
          const pad = fw * 0.15;
          page.drawLine({ start: { x: fx + pad, y: fy + fh * 0.45 }, end: { x: fx + fw * 0.42, y: fy + pad }, thickness: fw * 0.12, color: rgb(1, 1, 1) });
          page.drawLine({ start: { x: fx + fw * 0.42, y: fy + pad }, end: { x: fx + fw - pad, y: fy + fh * 0.75 }, thickness: fw * 0.12, color: rgb(1, 1, 1) });
        }

        if (field.type === 'signature') {
          const canvas = sigCanvasesRef.current[field.id];
          if (canvas && !isSigEmpty(field.id)) {
            const pngData = canvas.toDataURL('image/png');
            const pngBytes = await fetch(pngData).then(r => r.arrayBuffer());
            const img = await pdfDoc.embedPng(pngBytes);
            page.drawImage(img, { x: fx, y: fy, width: fw, height: fh });
          }
        }
      }

      const filledBytes = await pdfDoc.save();
      const blob = new Blob([filledBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

      const safeName = certConfig.name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${safeName}_${date}.pdf`;
      const filePath = `${employee.id}/${fileName}`;

      const { error: upErr } = await supabase.storage
        .from('certifications')
        .upload(filePath, blob, { contentType: 'application/pdf', upsert: true });
      if (upErr) throw upErr;

      const { data: { publicUrl: docUrl } } = supabase.storage.from('certifications').getPublicUrl(filePath);

      const expiryDate = new Date(date);
      expiryDate.setMonth(expiryDate.getMonth() + certConfig.validityMonths);

      const cert: EmployeeCert = {
        name: certConfig.name,
        status: 'Complété',
        dateObtained: date,
        expiryDate: expiryDate.toISOString().split('T')[0],
        documentUrl: docUrl,
      };
      setSavedPdfUrl(docUrl);
      setSavedCert(cert);
    } catch (e: any) {
      setError('Erreur : ' + (e.message || String(e)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1500] flex flex-col bg-slate-900">
      {/* Header */}
      <div className="bg-[#264f36] px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-white font-black uppercase tracking-tighter text-lg leading-tight">{certConfig.name}</h2>
          <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest">
            {mode === 'edit' ? 'Éditeur de champs PDF' : `Remplissage — ${employee?.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'fill' && !savedPdfUrl && error && (
            <span className="text-red-300 text-[10px] font-bold max-w-xs truncate">{error}</span>
          )}
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors">
            <ZoomOut size={16} />
          </button>
          <span className="text-white text-xs font-black w-10 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(2.5, s + 0.25))} className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors">
            <ZoomIn size={16} />
          </button>
          {mode === 'fill' && !savedPdfUrl && (
            <>
              <input
                ref={existingPdfInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleUploadExistingPdf}
              />
              <input
                type="date"
                value={date}
                onChange={e => {
                  setDate(e.target.value);
                  setTextValues(prev => {
                    const updated = { ...prev };
                    fields.filter(f => f.type === 'date').forEach(f => { updated[f.id] = e.target.value; });
                    return updated;
                  });
                }}
                className="bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2 text-[10px] font-black outline-none"
              />
              <button
                onClick={() => existingPdfInputRef.current?.click()}
                disabled={uploadingExisting}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40"
              >
                {uploadingExisting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Importer PDF
              </button>
              <button
                onClick={handleFillAndSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Valider
              </button>
            </>
          )}
          <button onClick={onClose} className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Preview after save */}
        {savedPdfUrl && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 text-[10px] font-black uppercase tracking-widest">PDF enregistré avec succès</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSavedPdfUrl(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  <ArrowLeft size={14} />
                  Modifier
                </button>
                <button
                  onClick={() => { onComplete?.(savedCert!); onClose(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#264f36] hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  <Save size={14} />
                  Confirmer
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe src={savedPdfUrl} className="w-full h-full border-0" title="Aperçu du PDF" />
            </div>
          </div>
        )}

        {/* Sidebar — edit mode only */}
        {!savedPdfUrl && mode === 'edit' && (
          <div className="w-56 md:w-64 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 space-y-3">
              {/* Upload */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Template PDF</p>
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPdf}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  {uploadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {templatePath ? 'Remplacer PDF' : 'Charger PDF'}
                </button>
                {templatePath && <p className="text-[8px] text-emerald-400 font-bold truncate">{templatePath}</p>}
                {templatePath && pages.length > 0 && (
                  <button
                    onClick={handleDetectFields}
                    disabled={detecting}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40"
                  >
                    {detecting ? <Loader2 size={14} className="animate-spin" /> : <MousePointer size={14} />}
                    {detecting ? 'Détection...' : 'Détecter les champs'}
                  </button>
                )}
                {detectedCount !== null && (
                  <p className="text-[8px] font-bold text-center">
                    {detectedCount === 0
                      ? <span className="text-amber-400">Aucun champ AcroForm trouvé</span>
                      : <span className="text-violet-400">{detectedCount} champ{detectedCount > 1 ? 's' : ''} détecté{detectedCount > 1 ? 's' : ''}</span>
                    }
                  </p>
                )}
              </div>

              <div className="border-t border-slate-700 pt-3 space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Outil actif</p>
                {[
                  { id: 'select', icon: <MousePointer size={14} />, label: 'Sélection' },
                  { id: 'checkbox', icon: <CheckSquare size={14} />, label: 'Case à cocher' },
                  { id: 'text', icon: <Type size={14} />, label: 'Champ texte' },
                  { id: 'date', icon: <Calendar size={14} />, label: 'Date' },
                  { id: 'trainer', icon: <User size={14} />, label: 'Nom formateur' },
                  { id: 'employee', icon: <UserCircle size={14} />, label: 'Nom équipier' },
                  { id: 'signature', icon: <PenLine size={14} />, label: 'Zone signature' },
                ].map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id as Tool)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                      activeTool === tool.id ? 'bg-[#264f36] text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {tool.icon} {tool.label}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-700 pt-3 space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Champs ({fields.length})</p>
                {[...fields].sort((a, b) => a.page !== b.page ? a.page - b.page : a.y - b.y).map(f => (
                  <div key={f.id} className="flex items-center gap-1 bg-slate-700 rounded-lg px-2 py-1">
                    <select
                      value={f.type}
                      onChange={e => setFields(prev => prev.map(field =>
                        field.id === f.id ? { ...field, type: e.target.value as PDFField['type'] } : field
                      ))}
                      className="flex-1 min-w-0 bg-slate-600 text-slate-200 text-[8px] font-bold rounded px-1 py-0.5 outline-none cursor-pointer"
                    >
                      <option value="text">Texte</option>
                      <option value="checkbox">Case</option>
                      <option value="date">Date</option>
                      <option value="trainer">Formateur</option>
                      <option value="employee">Équipier</option>
                      <option value="signature">Signature</option>
                    </select>
                    <span className="text-[8px] text-slate-400 shrink-0">p.{f.page + 1}</span>
                    <button onClick={() => removeField(f.id)} className="text-slate-500 hover:text-red-400 transition-colors shrink-0">
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveTemplate}
                disabled={saving || !templatePath}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-[#264f36] hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Sauvegarder
              </button>
            </div>
          </div>
        )}

        {/* PDF Canvas area */}
        {!savedPdfUrl && <div ref={containerRef} className="flex-1 overflow-auto bg-slate-700 p-6">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <Loader2 size={32} className="animate-spin text-emerald-400 mx-auto" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Chargement du PDF...</p>
              </div>
            </div>
          )}

          {!loading && !templatePath && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 max-w-sm p-8">
                <div className="w-20 h-20 bg-slate-600 rounded-[2rem] flex items-center justify-center mx-auto">
                  {mode === 'fill' ? <FileEdit size={32} className="text-slate-400" /> : <Upload size={32} className="text-slate-400" />}
                </div>
                {mode === 'fill' ? (
                  <>
                    <p className="text-white font-black uppercase text-sm tracking-tight">Aucun document configuré</p>
                    <p className="text-slate-400 text-xs font-medium leading-relaxed">
                      Allez dans <span className="text-emerald-400 font-bold">Paramètres → {certConfig.name} → "Config. PDF"</span> pour uploader le document officiel et placer les champs de saisie.
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Chargez un PDF dans le panneau gauche</p>
                )}
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-400 text-sm font-bold bg-red-900/30 px-6 py-4 rounded-2xl">{error}</p>
            </div>
          )}

          {!loading && pages.length > 0 && (
            <div
              className="space-y-6 flex flex-col items-center"
              style={{ transform: `scale(${scale})`, transformOrigin: 'top center', marginBottom: `${(scale - 1) * 100}%` }}
            >
              {pages.map((page, pageIndex) => (
                <div key={pageIndex} className="shadow-2xl rounded-sm overflow-visible">
                  <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2 text-center">Page {pageIndex + 1}</p>
                  <div
                    className="relative"
                    style={{ width: page.width, height: page.height, cursor: mode === 'edit' && activeTool !== 'select' ? 'crosshair' : 'default' }}
                    onClick={e => handlePageClick(e, pageIndex)}
                  >
                    {/* Rendered PDF page */}
                    <img
                      src={page.canvas.toDataURL()}
                      alt={`Page ${pageIndex + 1}`}
                      style={{ width: page.width, height: page.height, display: 'block' }}
                      draggable={false}
                    />

                    {/* Field overlays */}
                    {fields.filter(f => f.page === pageIndex).map(field => {
                      const left = `${field.x}%`;
                      const top = `${field.y}%`;
                      const width = `${field.width}%`;
                      const height = `${field.height}%`;

                      if (field.type === 'checkbox') {
                        const checked = checkedFields[field.id];
                        return (
                          <div
                            key={field.id}
                            style={{ position: 'absolute', left, top, width, height, cursor: mode === 'edit' ? 'move' : 'default' }}
                            className="group"
                            onMouseDown={mode === 'edit' ? e => startMove(e, field, page.width, page.height) : undefined}
                            onClick={e => {
                              if (mode === 'fill') {
                                e.stopPropagation();
                                setCheckedFields(prev => ({ ...prev, [field.id]: !prev[field.id] }));
                              }
                            }}
                          >
                            <div
                              className={`w-full h-full border-2 rounded-sm flex items-center justify-center transition-all ${
                                mode === 'fill' ? 'cursor-pointer' : ''
                              } ${
                                checked
                                  ? 'bg-[#264f36] border-[#264f36]'
                                  : 'bg-white/80 border-emerald-500 hover:bg-emerald-50'
                              }`}
                            >
                              {checked && <span className="text-white font-black" style={{ fontSize: `${field.height * page.height / 100 * 0.6}px` }}>✓</span>}
                            </div>
                            {mode === 'edit' && (
                              <>
                                <button
                                  className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={e => { e.stopPropagation(); removeField(field.id); }}
                                >
                                  <X size={8} />
                                </button>
                                <div
                                  className="absolute bottom-0 right-0 w-3 h-3 bg-white border border-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ cursor: 'se-resize' }}
                                  onMouseDown={e => startResize(e, field, page.width, page.height)}
                                />
                              </>
                            )}
                          </div>
                        );
                      }

                      if (field.type === 'text') {
                        return (
                          <div
                            key={field.id}
                            style={{ position: 'absolute', left, top, width, height, cursor: mode === 'edit' ? 'move' : 'default' }}
                            className="group"
                            onMouseDown={mode === 'edit' ? e => startMove(e, field, page.width, page.height) : undefined}
                            onClick={e => e.stopPropagation()}
                          >
                            {mode === 'fill' ? (
                              <input
                                type="text"
                                value={textValues[field.id] || ''}
                                onChange={e => setTextValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                                placeholder={field.label || 'Texte...'}
                                className="w-full h-full bg-white/90 border-2 border-amber-400 rounded-sm px-1 text-slate-900 outline-none"
                                style={{ fontSize: `${field.height * page.height / 100 * 0.45}px` }}
                              />
                            ) : (
                              <div className="w-full h-full border-2 border-dashed border-amber-400 rounded-sm bg-amber-50/20 flex items-center px-1">
                                <span className="text-amber-400 text-[9px] font-black uppercase truncate">{field.label || 'Texte'}</span>
                                <button
                                  className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={e => { e.stopPropagation(); removeField(field.id); }}
                                >
                                  <X size={8} />
                                </button>
                                <div
                                  className="absolute bottom-0 right-0 w-3 h-3 bg-white border border-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ cursor: 'se-resize' }}
                                  onMouseDown={e => startResize(e, field, page.width, page.height)}
                                />
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (field.type === 'signature') {
                        return (
                          <div
                            key={field.id}
                            style={{ position: 'absolute', left, top, width, height, cursor: mode === 'edit' ? 'move' : 'default' }}
                            className="group"
                            onMouseDown={mode === 'edit' ? e => startMove(e, field, page.width, page.height) : undefined}
                            onClick={e => e.stopPropagation()}
                          >
                            {mode === 'fill' ? (
                              <div className="w-full h-full border-2 border-dashed border-blue-400 rounded-sm bg-blue-50/30 relative overflow-hidden">
                                <canvas
                                  ref={getSigRef(field.id)}
                                  width={Math.round((field.width / 100) * page.width * 2)}
                                  height={Math.round((field.height / 100) * page.height * 2)}
                                  className="w-full h-full cursor-crosshair touch-none"
                                  onMouseDown={e => startSig(e, field.id)}
                                  onMouseMove={e => drawSig(e, field.id)}
                                  onMouseUp={() => stopSig(field.id)}
                                  onMouseLeave={() => stopSig(field.id)}
                                  onTouchStart={e => startSig(e, field.id)}
                                  onTouchMove={e => drawSig(e, field.id)}
                                  onTouchEnd={() => stopSig(field.id)}
                                />
                                <button
                                  className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white/80 text-slate-600 rounded text-[8px] font-black uppercase"
                                  onClick={() => clearSig(field.id)}
                                >
                                  Effacer
                                </button>
                              </div>
                            ) : (
                              <div className="w-full h-full border-2 border-dashed border-blue-400 rounded-sm bg-blue-50/20 flex items-center justify-center">
                                <PenLine size={14} className="text-blue-400" />
                                <button
                                  className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={e => { e.stopPropagation(); removeField(field.id); }}
                                >
                                  <X size={8} />
                                </button>
                                <div
                                  className="absolute bottom-0 right-0 w-3 h-3 bg-white border border-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ cursor: 'se-resize' }}
                                  onMouseDown={e => startResize(e, field, page.width, page.height)}
                                />
                              </div>
                            )}
                          </div>
                        );
                      }
                      // Date / Trainer / Employee — auto-fill fields
                      const autoLabel =
                        field.type === 'date' ? (mode === 'fill' ? '' : 'Date') :
                        field.type === 'trainer' ? (mode === 'fill' ? trainerName : 'Nom formateur') :
                        field.type === 'employee' ? (mode === 'fill' ? (employee?.name || '') : 'Nom équipier') : null;

                      if (autoLabel !== null) {
                        const borderColor = field.type === 'date' ? 'border-purple-400' : field.type === 'trainer' ? 'border-cyan-400' : 'border-orange-400';
                        const bgColor = field.type === 'date' ? 'bg-purple-50/20' : field.type === 'trainer' ? 'bg-cyan-50/20' : 'bg-orange-50/20';
                        const textColor = field.type === 'date' ? 'text-purple-300' : field.type === 'trainer' ? 'text-cyan-300' : 'text-orange-300';
                        return (
                          <div
                            key={field.id}
                            style={{ position: 'absolute', left, top, width, height, cursor: mode === 'edit' ? 'move' : 'default' }}
                            className="group"
                            onMouseDown={mode === 'edit' ? e => startMove(e, field, page.width, page.height) : undefined}
                            onClick={e => e.stopPropagation()}
                          >
                            {mode === 'fill' && field.type === 'date' ? (
                              <input
                                type="date"
                                value={textValues[field.id] || date}
                                onChange={e => {
                                  setTextValues(prev => ({ ...prev, [field.id]: e.target.value }));
                                  setDate(e.target.value);
                                }}
                                className="w-full h-full bg-white/90 border-2 border-purple-400 rounded-sm px-1 text-slate-900 outline-none"
                                style={{ fontSize: `${field.height * page.height / 100 * 0.42}px` }}
                              />
                            ) : (
                              <div className={`w-full h-full border-2 border-dashed ${borderColor} rounded-sm ${bgColor} flex items-center px-1`}>
                                <span className={`${textColor} text-[9px] font-black uppercase truncate w-full text-center`}>
                                  {mode === 'fill' ? autoLabel : field.label}
                                </span>
                                {mode === 'edit' && (
                                  <>
                                    <button
                                      className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={e => { e.stopPropagation(); removeField(field.id); }}
                                    >
                                      <X size={8} />
                                    </button>
                                    <div
                                      className="absolute bottom-0 right-0 w-3 h-3 bg-white border border-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      style={{ cursor: 'se-resize' }}
                                      onMouseDown={e => startResize(e, field, page.width, page.height)}
                                    />
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}
      </div>
    </div>
  );
};

export default PDFFormBuilder;
