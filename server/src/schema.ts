import { z } from 'zod';

// Patient schema
export const patientSchema = z.object({
  id: z.number(),
  name: z.string(),
  date_of_birth: z.coerce.date(),
  gender: z.enum(['male', 'female']),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Patient = z.infer<typeof patientSchema>;

// Input schema for creating patients
export const createPatientInputSchema = z.object({
  name: z.string().min(1),
  date_of_birth: z.coerce.date(),
  gender: z.enum(['male', 'female']),
  phone: z.string().nullable(),
  address: z.string().nullable()
});

export type CreatePatientInput = z.infer<typeof createPatientInputSchema>;

// Input schema for updating patients
export const updatePatientInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  date_of_birth: z.coerce.date().optional(),
  gender: z.enum(['male', 'female']).optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional()
});

export type UpdatePatientInput = z.infer<typeof updatePatientInputSchema>;

// Delivery service schema
export const deliveryServiceSchema = z.object({
  id: z.number(),
  patient_id: z.number(),
  delivery_date: z.coerce.date(),
  delivery_type: z.enum(['normal', 'caesarean', 'assisted']),
  baby_weight: z.number(),
  baby_gender: z.enum(['male', 'female']),
  baby_name: z.string().nullable(),
  complications: z.string().nullable(),
  doctor_name: z.string(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type DeliveryService = z.infer<typeof deliveryServiceSchema>;

// Input schema for creating delivery services
export const createDeliveryServiceInputSchema = z.object({
  patient_id: z.number(),
  delivery_date: z.coerce.date(),
  delivery_type: z.enum(['normal', 'caesarean', 'assisted']),
  baby_weight: z.number().positive(),
  baby_gender: z.enum(['male', 'female']),
  baby_name: z.string().nullable(),
  complications: z.string().nullable(),
  doctor_name: z.string().min(1),
  notes: z.string().nullable()
});

export type CreateDeliveryServiceInput = z.infer<typeof createDeliveryServiceInputSchema>;

// Immunization schema
export const immunizationSchema = z.object({
  id: z.number(),
  patient_id: z.number(),
  vaccine_name: z.string(),
  vaccine_type: z.enum(['basic', 'additional', 'booster']),
  vaccination_date: z.coerce.date(),
  next_vaccination_date: z.coerce.date().nullable(),
  batch_number: z.string().nullable(),
  administered_by: z.string(),
  side_effects: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Immunization = z.infer<typeof immunizationSchema>;

// Input schema for creating immunizations
export const createImmunizationInputSchema = z.object({
  patient_id: z.number(),
  vaccine_name: z.string().min(1),
  vaccine_type: z.enum(['basic', 'additional', 'booster']),
  vaccination_date: z.coerce.date(),
  next_vaccination_date: z.coerce.date().nullable(),
  batch_number: z.string().nullable(),
  administered_by: z.string().min(1),
  side_effects: z.string().nullable(),
  notes: z.string().nullable()
});

export type CreateImmunizationInput = z.infer<typeof createImmunizationInputSchema>;

// Medical checkup schema
export const medicalCheckupSchema = z.object({
  id: z.number(),
  patient_id: z.number(),
  checkup_date: z.coerce.date(),
  checkup_type: z.enum(['routine', 'pregnancy', 'child', 'adult', 'elderly']),
  weight: z.number().nullable(),
  height: z.number().nullable(),
  blood_pressure: z.string().nullable(),
  temperature: z.number().nullable(),
  heart_rate: z.number().int().nullable(),
  symptoms: z.string().nullable(),
  diagnosis: z.string().nullable(),
  treatment: z.string().nullable(),
  medication_prescribed: z.string().nullable(),
  doctor_name: z.string(),
  next_checkup_date: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MedicalCheckup = z.infer<typeof medicalCheckupSchema>;

// Input schema for creating medical checkups
export const createMedicalCheckupInputSchema = z.object({
  patient_id: z.number(),
  checkup_date: z.coerce.date(),
  checkup_type: z.enum(['routine', 'pregnancy', 'child', 'adult', 'elderly']),
  weight: z.number().positive().nullable(),
  height: z.number().positive().nullable(),
  blood_pressure: z.string().nullable(),
  temperature: z.number().nullable(),
  heart_rate: z.number().int().positive().nullable(),
  symptoms: z.string().nullable(),
  diagnosis: z.string().nullable(),
  treatment: z.string().nullable(),
  medication_prescribed: z.string().nullable(),
  doctor_name: z.string().min(1),
  next_checkup_date: z.coerce.date().nullable(),
  notes: z.string().nullable()
});

export type CreateMedicalCheckupInput = z.infer<typeof createMedicalCheckupInputSchema>;

// Input schema for updating medical checkups
export const updateMedicalCheckupInputSchema = z.object({
  id: z.number(),
  patient_id: z.number().optional(),
  checkup_date: z.coerce.date().optional(),
  checkup_type: z.enum(['routine', 'pregnancy', 'child', 'adult', 'elderly']).optional(),
  weight: z.number().positive().nullable().optional(),
  height: z.number().positive().nullable().optional(),
  blood_pressure: z.string().nullable().optional(),
  temperature: z.number().nullable().optional(),
  heart_rate: z.number().int().positive().nullable().optional(),
  symptoms: z.string().nullable().optional(),
  diagnosis: z.string().nullable().optional(),
  treatment: z.string().nullable().optional(),
  medication_prescribed: z.string().nullable().optional(),
  doctor_name: z.string().min(1).optional(),
  next_checkup_date: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateMedicalCheckupInput = z.infer<typeof updateMedicalCheckupInputSchema>;

// Query schemas for filtering and pagination
export const getPatientByIdSchema = z.object({
  id: z.number()
});

export type GetPatientByIdInput = z.infer<typeof getPatientByIdSchema>;

export const getServicesByPatientIdSchema = z.object({
  patientId: z.number()
});

export type GetServicesByPatientIdInput = z.infer<typeof getServicesByPatientIdSchema>;