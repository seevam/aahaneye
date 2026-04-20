export type UserRole = 'user' | 'admin' | 'guest';
export type RelationshipType = 'self' | 'parent' | 'child' | 'spouse' | 'sibling' | 'caregiver' | 'other';
export type SchedulingMode = 'fixed_interval' | 'count_based' | 'specific_times' | 'custom';
export type ReminderStatus = 'scheduled' | 'fired' | 'taken' | 'snoozed' | 'skipped' | 'missed';
export type DonationFrequency = 'one_time' | 'monthly';
export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type StoryCategory = 'article' | 'video' | 'news' | 'tip' | 'patient_story';
export type StoryVisibility = 'draft' | 'scheduled' | 'published' | 'hidden';
export type DevicePlatform = 'ios' | 'android';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  role: UserRole;
  preferredLanguage: string;
  timezone: string;
  notificationSettings: Record<string, unknown>;
  isGuest: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  name: string;
  dob: string | null;
  avatarUrl: string | null;
  notes: string | null;
  relationship: RelationshipType;
  preferredLanguage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Medication {
  id: string;
  canonicalName: string;
  synonyms: string[];
  brandNames: string[];
  primaryImageUrl: string | null;
  thumbnailUrl: string | null;
  dosageForms: string[];
  description: string | null;
  isVerified: boolean;
}

export interface FixedIntervalParams {
  intervalMinutes: number;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface CountBasedParams {
  count: number;
  gapMinutes: number;
  startTime: string; // HH:mm
}

export interface SpecificTimesParams {
  times: string[]; // HH:mm[]
}

export interface CustomParams {
  cron: string;
}

export type SchedulingParams =
  | { mode: 'fixed_interval'; params: FixedIntervalParams }
  | { mode: 'count_based'; params: CountBasedParams }
  | { mode: 'specific_times'; params: SpecificTimesParams }
  | { mode: 'custom'; params: CustomParams };

export interface ReminderSchedule {
  id: string;
  patientId: string;
  medicationId: string | null;
  customMedicationName: string | null;
  dosageText: string | null;
  schedulingMode: SchedulingMode;
  schedulingParams: SchedulingParams;
  timezone: string;
  startDate: string;
  endDate: string | null;
  daysOfWeek: number[];
  allowDndOverride: boolean;
  soundId: string;
  vibrationEnabled: boolean;
  showMedicationImage: boolean;
  snoozeLimit: number;
  snoozeIntervalMinutes: number;
  missTimeoutMinutes: number;
  minSpacingMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderInstance {
  id: string;
  scheduleId: string;
  patientId: string;
  scheduledTime: string;
  actualTime: string | null;
  status: ReminderStatus;
  snoozeCount: number;
  notes: string | null;
}

export interface Story {
  id: string;
  title: string;
  bodyText: string | null;
  category: StoryCategory;
  language: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  videoDurationSeconds: number | null;
  author: string | null;
  tags: string[];
  visibility: StoryVisibility;
  publishTime: string | null;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorName: string | null;
  clinicName: string | null;
  appointmentTime: string;
  durationMinutes: number;
  notes: string | null;
}

export interface Donation {
  id: string;
  userId: string;
  amountCents: number;
  currency: string;
  frequency: DonationFrequency;
  status: DonationStatus;
  receiptUrl: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
