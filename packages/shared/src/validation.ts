import { z } from 'zod';

// Auth
export const signupSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().min(5).max(50).optional(),
  password: z.string().min(8).max(128),
  preferredLanguage: z.string().default('en'),
  timezone: z.string().default('UTC'),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone is required',
});

export const loginSchema = z.object({
  identifier: z.string().min(1), // email or phone
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// Patient
export const createPatientSchema = z.object({
  name: z.string().min(1).max(255),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  relationship: z.enum(['self', 'parent', 'child', 'spouse', 'sibling', 'caregiver', 'other']).default('self'),
  preferredLanguage: z.string().default('en'),
  notes: z.string().max(1000).optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

// Scheduling params
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const fixedIntervalParamsSchema = z.object({
  intervalMinutes: z.number().int().min(1).max(1440),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
});

export const countBasedParamsSchema = z.object({
  count: z.number().int().min(1).max(100),
  gapMinutes: z.number().int().min(1).max(1440),
  startTime: z.string().regex(timeRegex),
});

export const specificTimesParamsSchema = z.object({
  times: z.array(z.string().regex(timeRegex)).min(1).max(50),
});

export const customParamsSchema = z.object({
  cron: z.string().min(1),
});

// Reminder
export const createReminderSchema = z.object({
  patientId: z.string().uuid(),
  medicationId: z.string().uuid().optional(),
  customMedicationName: z.string().max(255).optional(),
  dosageText: z.string().max(500).optional(),
  schedulingMode: z.enum(['fixed_interval', 'count_based', 'specific_times', 'custom']),
  schedulingParams: z.union([
    z.object({ mode: z.literal('fixed_interval'), params: fixedIntervalParamsSchema }),
    z.object({ mode: z.literal('count_based'), params: countBasedParamsSchema }),
    z.object({ mode: z.literal('specific_times'), params: specificTimesParamsSchema }),
    z.object({ mode: z.literal('custom'), params: customParamsSchema }),
  ]),
  timezone: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  allowDndOverride: z.boolean().default(false),
  soundId: z.string().default('default'),
  vibrationEnabled: z.boolean().default(true),
  showMedicationImage: z.boolean().default(true),
  snoozeLimit: z.number().int().min(0).max(10).default(3),
  snoozeIntervalMinutes: z.number().int().min(1).max(60).default(10),
  missTimeoutMinutes: z.number().int().min(5).max(120).default(30),
  minSpacingMinutes: z.number().int().min(1).max(60).default(5),
}).refine((data) => data.medicationId || data.customMedicationName, {
  message: 'Either medicationId or customMedicationName is required',
});

// Use the inner object shape for partial updates (refine can't be made partial)
export const updateReminderSchema = z.object({
  medicationId: z.string().uuid().optional(),
  customMedicationName: z.string().max(255).optional(),
  dosageText: z.string().max(500).optional(),
  schedulingMode: z.enum(['fixed_interval', 'count_based', 'specific_times', 'custom']).optional(),
  schedulingParams: z.union([
    z.object({ mode: z.literal('fixed_interval'), params: fixedIntervalParamsSchema }),
    z.object({ mode: z.literal('count_based'), params: countBasedParamsSchema }),
    z.object({ mode: z.literal('specific_times'), params: specificTimesParamsSchema }),
    z.object({ mode: z.literal('custom'), params: customParamsSchema }),
  ]).optional(),
  timezone: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  allowDndOverride: z.boolean().optional(),
  soundId: z.string().optional(),
  vibrationEnabled: z.boolean().optional(),
  showMedicationImage: z.boolean().optional(),
  snoozeLimit: z.number().int().min(0).max(10).optional(),
  snoozeIntervalMinutes: z.number().int().min(1).max(60).optional(),
  missTimeoutMinutes: z.number().int().min(5).max(120).optional(),
  minSpacingMinutes: z.number().int().min(1).max(60).optional(),
  isActive: z.boolean().optional(),
});

export const instanceActionSchema = z.object({
  action: z.enum(['taken', 'skipped', 'snoozed']),
  notes: z.string().max(500).optional(),
});

// Appointment
export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorName: z.string().max(255).optional(),
  clinicName: z.string().max(255).optional(),
  appointmentTime: z.string().datetime(),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  notes: z.string().max(1000).optional(),
  reminderRules: z.array(z.object({
    minutesBefore: z.number().int().min(0),
  })).default([]),
});

// Device
export const registerDeviceSchema = z.object({
  pushToken: z.string().optional(),
  platform: z.enum(['ios', 'android']),
  deviceName: z.string().max(255).optional(),
  appVersion: z.string().max(50).optional(),
  osVersion: z.string().max(50).optional(),
});

// Donation
export const createDonationSchema = z.object({
  amountCents: z.number().int().min(100),
  currency: z.string().length(3).default('USD'),
  frequency: z.enum(['one_time', 'monthly']).default('one_time'),
});

// Query params
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Export types
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
export type InstanceActionInput = z.infer<typeof instanceActionSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
export type CreateDonationInput = z.infer<typeof createDonationSchema>;
