
import React, { useState } from 'react';
import { X, Send, Mail, User, HelpCircle, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { apiService } from '../services/apiService';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { firstName: string; lastName: string; email: string };
}

const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, user }) => {
  const [formData, setFormData] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user ? user.email : '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await apiService.submitInquiry(formData);
      if (submitError) throw submitError;
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ ...formData, subject: '', message: '' });
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        <header className="bg-[#264f36] p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <HelpCircle size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Support Technique</h2>
              <p className="text-xs font-bold opacity-70 uppercase tracking-widest mt-1">Soumettre une demande</p>
            </div>
          </div>
        </header>

        <div className="p-8">
          {success ? (
            <div className="py-12 flex flex-col items-center text-center animate-in zoom-in">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Message Envoyé !</h3>
              <p className="text-sm text-slate-500 font-medium mt-2">Nous reviendrons vers vous dans les plus brefs délais.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-3">
                  <X size={16} /> {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    placeholder="Votre nom" 
                    required 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-[#264f36] transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="email" 
                    placeholder="Votre email" 
                    required 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-[#264f36] transition-all"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    placeholder="Sujet de la demande" 
                    required 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-[#264f36] transition-all"
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                  />
                </div>

                <textarea 
                  placeholder="Votre message..." 
                  required 
                  className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-bold text-slate-800 outline-none focus:border-[#264f36] transition-all h-32 resize-none"
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-[#264f36] text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-slate-900 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Envoyer la demande</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportModal;
