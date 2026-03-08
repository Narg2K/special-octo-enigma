
import { createClient } from "@supabase/supabase-js";
import { Employee, ActivityLog, Inquiry, UserProfile, EmailTemplate } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Converts "Jean-Paul" → "jean.paul", strips accents
const normalizeStr = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

export const toIdentifiant = (firstName: string, lastName: string) =>
  `${normalizeStr(firstName)}.${normalizeStr(lastName)}`;

const toSqlDate = (dateVal?: any) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
  const dateStr = String(dateVal).trim();
  if (dateStr === "" || dateStr === "undefined" || dateStr === "null") return null;

  if (dateStr.includes('/') && dateStr.split('/').length === 3) {
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return dateStr;
};

export const apiService = {
  // identifiant = "jean.dupont" → email = "jean.dupont@mcfo.app"
  async signIn(identifiant: string, pass: string) {
    const email = identifiant.trim().toLowerCase() + '@mcfo.app';
    return await supabase.auth.signInWithPassword({ email, password: pass });
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async getUserProfile(userId: string) {
    return await supabase.from('profiles').select('*').eq('id', userId).single();
  },

  async getSettings() {
    try {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (error) throw error;
      if (!data) return { skills: [], certs: [], contracts: [] };
      return {
        skills: data.find(d => d.key === 'mcfo_skills')?.value || [],
        certs: data.find(d => d.key === 'mcfo_certs')?.value || [],
        contracts: data.find(d => d.key === 'mcfo_contracts')?.value || []
      };
    } catch (e) {
      console.error('getSettings error:', e);
      return { skills: [], certs: [], contracts: [] };
    }
  },

  async saveSettings(key: string, data: any) {
    const { error } = await supabase.from('app_settings').upsert({
      key, value: data, updated_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  async getEmployees(type: 'active' | 'archived' | 'deleted' = 'active'): Promise<Employee[]> {
    let query = supabase.from('employees').select('*');

    if (type === 'active') {
      query = query.eq('is_archived', false).eq('is_deleted', false);
    } else if (type === 'archived') {
      query = query.eq('is_archived', true).eq('is_deleted', false);
    } else if (type === 'deleted') {
      query = query.eq('is_deleted', true);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) return [];

    return (data || []).map(row => ({
      ...row,
      id: row.id,
      entryDate: row.entry_date,
      contractEndDate: row.contract_end_date,
      phoneNumber: row.phone_number,
      contractType: row.contract_type,
      isArchived: row.is_archived,
      isDeleted: row.is_deleted,
      archivedDate: row.archived_date,
      archivedReason: row.archived_reason,
      deletedDate: row.deleted_date
    })) as Employee[];
  },

  async saveEmployees(employees: Employee[]) {
    if (!employees || employees.length === 0) return;
    const payload = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      skills: emp.skills,
      trainings: emp.trainings,
      certifications: emp.certifications,
      availability: emp.availability,
      entry_date: toSqlDate(emp.entryDate),
      contract_end_date: toSqlDate(emp.contractEndDate),
      phone_number: emp.phoneNumber,
      contract_type: emp.contractType,
      is_archived: emp.isArchived ?? false,
      is_deleted: emp.isDeleted ?? false,
      archived_date: toSqlDate(emp.archivedDate),
      archived_reason: emp.archivedReason,
      deleted_date: toSqlDate(emp.deletedDate)
    }));

    const { error } = await supabase.from('employees').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async permanentDeleteEmployee(id: string) {
    return await supabase.from('employees').delete().eq('id', id);
  },

  async emptyTrash() {
    return await supabase.from('employees').delete().eq('is_deleted', true);
  },

  async getLogs(): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(500);
    if (error) return [];
    return data.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      user: log.user_name,
      action: log.action,
      details: log.details,
      category: log.category as any
    }));
  },

  async addLog(log: ActivityLog) {
    const { error } = await supabase.from('activity_logs').insert([{
      id: log.id,
      user_name: log.user,
      action: log.action,
      details: log.details,
      category: log.category,
      timestamp: log.timestamp
    }]);
    if (error) console.error('addLog error:', error);
  },

  async submitInquiry(inquiry: Omit<Inquiry, 'id' | 'status' | 'created_at'>) {
    return await supabase.from('inquiries').insert([inquiry]);
  },

  // ── Admin functions ───────────────────────────────────────────────────────

  async adminGetAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      identifiant: row.identifiant || '',
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      realEmail: row.real_email || '',
      role: row.role || 'Directeur',
      createdAt: row.created_at,
    }));
  },

  async adminCreateUser(
    firstName: string,
    lastName: string,
    role: string,
    realEmail: string,
    tempPassword: string
  ): Promise<UserProfile> {
    const identifiant = toIdentifiant(firstName, lastName);
    const supabaseEmail = `${identifiant}@mcfo.app`;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: supabaseEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName, role },
    });
    if (error) throw error;

    const userId = data.user.id;
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      role,
      identifiant,
      real_email: realEmail,
    });
    if (profileError) throw profileError;

    return { id: userId, identifiant, firstName, lastName, realEmail, role };
  },

  async adminDeleteUser(userId: string) {
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) throw authErr;
    await supabaseAdmin.from('profiles').delete().eq('id', userId);
  },

  async adminUpdatePassword(userId: string, newPassword: string) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) throw error;
  },

  async getEmailTemplate(): Promise<EmailTemplate> {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'invitation_email_template')
      .single();
    return data?.value || {
      subject: 'Votre accès McFormation Store #0437',
      body: 'Bonjour {prenom},\n\nVotre compte a été créé.\n\nIdentifiant : {identifiant}\nMot de passe temporaire : {password}\n\nConnexion : https://mcdo-console.vercel.app\n\nCordialement',
    };
  },

  async saveEmailTemplate(template: EmailTemplate) {
    const { error } = await supabase.from('app_settings').upsert({
      key: 'invitation_email_template',
      value: template,
    });
    if (error) throw error;
  },

  async sendInvitationEmail(to: string, template: EmailTemplate, vars: Record<string, string>) {
    const RESEND_KEY = import.meta.env.VITE_RESEND_API_KEY as string;
    const filled = (s: string) =>
      Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), s);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'McFormation <onboarding@resend.dev>',
        to,
        subject: filled(template.subject),
        text: filled(template.body),
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Erreur envoi email');
    }
  },
};
