
import { Role, Employee, DayAvailability, GlobalCertConfig } from './types';

export const DEFAULT_AVAILABILITY: DayAvailability[] = [
  { day: 'Lundi', isAvailable: true, startTime: '08:00', endTime: '17:00' },
  { day: 'Mardi', isAvailable: true, startTime: '08:00', endTime: '17:00' },
  { day: 'Mercredi', isAvailable: true, startTime: '08:00', endTime: '17:00' },
  { day: 'Jeudi', isAvailable: true, startTime: '08:00', endTime: '17:00' },
  { day: 'Vendredi', isAvailable: true, startTime: '08:00', endTime: '17:00' },
  { day: 'Samedi', isAvailable: false, startTime: '00:00', endTime: '00:00' },
  { day: 'Dimanche', isAvailable: false, startTime: '00:00', endTime: '00:00' },
];

export const DEFAULT_CERTIFICATIONS: GlobalCertConfig[] = [
  { name: 'FRED APP', isMandatory: true, validityMonths: 12 },
  { name: 'HACCP / HYGIÈNE', isMandatory: true, validityMonths: 24 },
  { name: 'SST (SECOURISME)', isMandatory: true, validityMonths: 24 },
  { name: 'SÉCURITÉ INCENDIE', isMandatory: true, validityMonths: 12 }
];

export const DEFAULT_SKILLS = [
  'LIGNE / GARNITURE',
  'BOISSONS / DESSERTS',
  'FRITES',
  'DRIVE / COMMANDE',
  'ACCUEIL / SALLE',
  'LIVRAISON',
  'MAINTENANCE LOURDE'
];

export const MOCK_TRAINING_MODULES: any[] = [];
export const MOCK_EMPLOYEES: Employee[] = [];
