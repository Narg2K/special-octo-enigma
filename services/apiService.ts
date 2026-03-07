
import { createClient } from "@supabase/supabase-js";
import { Employee, ActivityLog, Inquiry } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  async signIn(email: string, pass: string) {
    return await supabase.auth.signInWithPassword({ email, password: pass });
  },

  async signUp(email: string, pass: string, firstName: string, lastName: string, role: string) {
    return await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { first_name: firstName, last_name: lastName, role }
      }
    });
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
  }
};
