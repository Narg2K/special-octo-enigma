
import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Users, Mail, Plus, Trash2, Send, Save,
  Loader2, AlertCircle, CheckCircle, Eye, EyeOff,
  RefreshCw, ShieldCheck, Copy, Key
} from 'lucide-react';
import { UserProfile, EmailTemplate } from '../types';
import { apiService, toIdentifiant } from '../services/apiService';

interface AdminPanelProps {
  onBack: () => void;
}

const ROLES = ['Directeur', 'Admin', 'Manager', 'Formateur'];

const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'template'>('users');

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Create user form
  const [form, setForm] = useState({ firstName: '', lastName: '', role: 'Directeur', realEmail: '', tempPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Invitation state per user
  const [sendingInvite, setSendingInvite] = useState<Record<string, boolean>>({});
  const [inviteSuccess, setInviteSuccess] = useState<Record<string, boolean>>({});
  const [invitePasswords, setInvitePasswords] = useState<Record<string, string>>({});

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Email template state
  const [template, setTemplate] = useState<EmailTemplate>({
    subject: 'Votre accès McFormation Store #0437',
    body: 'Bonjour {prenom},\n\nVotre compte a été créé.\n\nIdentifiant : {identifiant}\nMot de passe temporaire : {password}\n\nConnexion : https://mcdo-console.vercel.app\n\nCordialement,\nL\'équipe McFormation',
  });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);

  const generatedIdentifiant = form.firstName && form.lastName
    ? toIdentifiant(form.firstName, form.lastName)
    : '';

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const data = await apiService.adminGetAllUsers();
      setUsers(data);
    } catch (e: any) {
      setUsersError(e.message || 'Erreur chargement utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadTemplate = useCallback(async () => {
    try {
      const t = await apiService.getEmailTemplate();
      setTemplate(t);
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadUsers();
    loadTemplate();
  }, [loadUsers, loadTemplate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.realEmail || !form.tempPassword) return;
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const newUser = await apiService.adminCreateUser(
        form.firstName, form.lastName, form.role, form.realEmail, form.tempPassword
      );
      setUsers(prev => [...prev, newUser]);
      setInvitePasswords(prev => ({ ...prev, [newUser.id]: form.tempPassword }));
      setCreateSuccess(`Compte créé : ${newUser.identifiant}`);
      setForm({ firstName: '', lastName: '', role: 'Directeur', realEmail: '', tempPassword: '' });
    } catch (e: any) {
      setCreateError(e.message || 'Erreur création utilisateur');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Supprimer définitivement cet utilisateur ?')) return;
    setDeletingId(userId);
    try {
      await apiService.adminDeleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) {
      alert('Erreur suppression : ' + (e.message || String(e)));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendInvite = async (user: UserProfile) => {
    const pwd = invitePasswords[user.id];
    if (!user.realEmail) { alert('Email réel manquant pour cet utilisateur.'); return; }
    setSendingInvite(prev => ({ ...prev, [user.id]: true }));
    try {
      await apiService.sendInvitationEmail(user.realEmail, template, {
        prenom: user.firstName,
        nom: user.lastName,
        identifiant: user.identifiant,
        password: pwd || '(voir mot de passe créé)',
      });
      setInviteSuccess(prev => ({ ...prev, [user.id]: true }));
      setTimeout(() => setInviteSuccess(prev => ({ ...prev, [user.id]: false })), 3000);
    } catch (e: any) {
      alert('Erreur envoi : ' + (e.message || String(e)));
    } finally {
      setSendingInvite(prev => ({ ...prev, [user.id]: false }));
    }
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      await apiService.saveEmailTemplate(template);
      setTemplateSaved(true);
      setTimeout(() => setTemplateSaved(false), 3000);
    } catch (e: any) {
      alert('Erreur sauvegarde : ' + (e.message || String(e)));
    } finally {
      setSavingTemplate(false);
    }
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text).catch(() => {});

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50">

      {/* Header */}
      <div className="bg-slate-900 shrink-0 border-b border-slate-800">
        <div className="px-4 md:px-6 h-16 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors shrink-0"
          >
            <ArrowLeft size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Retour</span>
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="bg-white/10 p-2 rounded-xl shrink-0">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-black uppercase tracking-tighter text-sm md:text-base leading-none">
                Panneau Admin
              </h1>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                {users.length} utilisateur{users.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center bg-white/10 rounded-xl overflow-hidden shrink-0">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'users' ? 'bg-white text-slate-900' : 'text-white hover:bg-white/10'}`}
            >
              <Users size={13} /> Utilisateurs
            </button>
            <button
              onClick={() => setActiveTab('template')}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'template' ? 'bg-white text-slate-900' : 'text-white hover:bg-white/10'}`}
            >
              <Mail size={13} /> Template email
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Tab Utilisateurs ────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">

            {/* Create user form */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Plus size={16} className="text-[#264f36]" />
                <h2 className="font-black uppercase tracking-tighter text-sm text-slate-900">Créer un utilisateur</h2>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prénom</label>
                    <input
                      value={form.firstName}
                      onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      placeholder="Jean"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-[#264f36] transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nom</label>
                    <input
                      value={form.lastName}
                      onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      placeholder="Dupont"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-[#264f36] transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rôle</label>
                    <select
                      value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-[#264f36] transition-colors cursor-pointer"
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email réel (pour invitation)</label>
                    <input
                      type="email"
                      value={form.realEmail}
                      onChange={e => setForm(f => ({ ...f, realEmail: e.target.value }))}
                      placeholder="jean.dupont@gmail.com"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-[#264f36] transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mot de passe temporaire</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.tempPassword}
                        onChange={e => setForm(f => ({ ...f, tempPassword: e.target.value }))}
                        placeholder="Mcdo2024!"
                        className="w-full px-4 py-3 pr-10 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-[#264f36] transition-colors"
                        required
                        minLength={8}
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tempPassword: generatePassword() }))}
                      className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors shrink-0"
                      title="Générer un mot de passe"
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>
                </div>

                {/* Identifiant preview */}
                {generatedIdentifiant && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Identifiant généré</p>
                      <p className="font-black text-emerald-800 text-sm">{generatedIdentifiant}</p>
                    </div>
                    <button type="button" onClick={() => copyToClipboard(generatedIdentifiant)} className="text-emerald-500 hover:text-emerald-700 shrink-0">
                      <Copy size={14} />
                    </button>
                  </div>
                )}

                {createError && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
                    <AlertCircle size={14} className="text-red-500 shrink-0" />
                    <p className="text-red-600 text-xs font-bold">{createError}</p>
                  </div>
                )}
                {createSuccess && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    <p className="text-emerald-700 text-xs font-bold">{createSuccess}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={creating || !generatedIdentifiant}
                  className="flex items-center gap-2 px-6 py-3 bg-[#264f36] hover:bg-emerald-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Créer l'utilisateur
                </button>
              </form>
            </div>

            {/* Users list */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-slate-500" />
                  <h2 className="font-black uppercase tracking-tighter text-sm text-slate-900">Utilisateurs ({users.length})</h2>
                </div>
                <button onClick={loadUsers} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                  <RefreshCw size={14} className={loadingUsers ? 'animate-spin' : ''} />
                </button>
              </div>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-slate-300" />
                </div>
              ) : usersError ? (
                <div className="flex items-center gap-2 m-6 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
                  <AlertCircle size={14} className="text-red-500" />
                  <p className="text-red-600 text-xs font-bold">{usersError}</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-xs font-bold uppercase tracking-widest">Aucun utilisateur</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {users.map(user => (
                    <div key={user.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Avatar + info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-[#264f36] text-white rounded-2xl flex items-center justify-center font-black text-sm shrink-0">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 text-sm truncate">{user.firstName} {user.lastName}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-mono text-[10px] text-[#264f36] bg-emerald-50 px-2 py-0.5 rounded-lg font-bold cursor-pointer hover:bg-emerald-100 transition-colors"
                              onClick={() => copyToClipboard(user.identifiant)}
                              title="Cliquer pour copier"
                            >
                              {user.identifiant}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-lg">
                              {user.role}
                            </span>
                          </div>
                          {user.realEmail && (
                            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{user.realEmail}</p>
                          )}
                        </div>
                      </div>

                      {/* Password field for invitation */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative">
                          <Key size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Mot de passe"
                            value={invitePasswords[user.id] || ''}
                            onChange={e => setInvitePasswords(prev => ({ ...prev, [user.id]: e.target.value }))}
                            className="pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:border-[#264f36] w-28 transition-colors"
                          />
                        </div>

                        <button
                          onClick={() => handleSendInvite(user)}
                          disabled={sendingInvite[user.id] || !user.realEmail}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 shrink-0 ${inviteSuccess[user.id] ? 'bg-emerald-500 text-white' : 'bg-slate-900 hover:bg-slate-700 text-white'}`}
                        >
                          {sendingInvite[user.id] ? <Loader2 size={12} className="animate-spin" /> : inviteSuccess[user.id] ? <CheckCircle size={12} /> : <Send size={12} />}
                          {inviteSuccess[user.id] ? 'Envoyé' : 'Inviter'}
                        </button>

                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                        >
                          {deletingId === user.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab Template Email ───────────────────────────────────────── */}
        {activeTab === 'template' && (
          <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Mail size={16} className="text-slate-500" />
                <h2 className="font-black uppercase tracking-tighter text-sm text-slate-900">Template d'invitation</h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Variables reference */}
                <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Variables disponibles</p>
                  <div className="flex flex-wrap gap-2">
                    {['{prenom}', '{nom}', '{identifiant}', '{password}'].map(v => (
                      <button
                        key={v}
                        onClick={() => setTemplate(t => ({ ...t, body: t.body + v }))}
                        className="font-mono text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-lg hover:border-[#264f36] hover:text-[#264f36] transition-colors font-bold"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 font-medium">Cliquer sur une variable pour l'ajouter au corps du message</p>
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Objet de l'email</label>
                  <input
                    value={template.subject}
                    onChange={e => setTemplate(t => ({ ...t, subject: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-[#264f36] transition-colors"
                  />
                </div>

                {/* Body */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Corps du message</label>
                  <textarea
                    value={template.body}
                    onChange={e => setTemplate(t => ({ ...t, body: e.target.value }))}
                    rows={10}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm outline-none focus:border-[#264f36] transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Preview */}
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aperçu (avec données exemple)</p>
                  <div className="px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-500 mb-1">Objet : <span className="text-slate-700">{template.subject.replace(/{prenom}/g,'Jean').replace(/{nom}/g,'Dupont').replace(/{identifiant}/g,'jean.dupont').replace(/{password}/g,'Mcdo2024!')}</span></p>
                    <hr className="border-slate-200 my-2" />
                    <pre className="text-xs text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                      {template.body.replace(/{prenom}/g,'Jean').replace(/{nom}/g,'Dupont').replace(/{identifiant}/g,'jean.dupont').replace(/{password}/g,'Mcdo2024!')}
                    </pre>
                  </div>
                </div>

                <button
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 ${templateSaved ? 'bg-emerald-500 text-white' : 'bg-slate-900 hover:bg-slate-700 text-white'}`}
                >
                  {savingTemplate ? <Loader2 size={14} className="animate-spin" /> : templateSaved ? <CheckCircle size={14} /> : <Save size={14} />}
                  {templateSaved ? 'Sauvegardé !' : 'Sauvegarder le template'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
