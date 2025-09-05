import { serial, text, pgTable, timestamp, numeric, integer, pgEnum, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const genderEnum = pgEnum('gender', ['male', 'female']);
export const deliveryTypeEnum = pgEnum('delivery_type', ['normal', 'caesarean', 'assisted']);
export const vaccineTypeEnum = pgEnum('vaccine_type', ['basic', 'additional', 'booster']);
export const checkupTypeEnum = pgEnum('checkup_type', ['routine', 'pregnancy', 'child', 'adult', 'elderly']);

// Patients table
export const patientsTable = pgTable('patients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  date_of_birth: date('date_of_birth').notNull(),
  gender: genderEnum('gender').notNull(),
  phone: text('phone'),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Delivery services table
export const deliveryServicesTable = pgTable('delivery_services', {
  id: serial('id').primaryKey(),
  patient_id: integer('patient_id').references(() => patientsTable.id).notNull(),
  delivery_date: date('delivery_date').notNull(),
  delivery_type: deliveryTypeEnum('delivery_type').notNull(),
  baby_weight: numeric('baby_weight', { precision: 5, scale: 2 }).notNull(),
  baby_gender: genderEnum('baby_gender').notNull(),
  baby_name: text('baby_name'),
  complications: text('complications'),
  doctor_name: text('doctor_name').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Immunizations table
export const immunizationsTable = pgTable('immunizations', {
  id: serial('id').primaryKey(),
  patient_id: integer('patient_id').references(() => patientsTable.id).notNull(),
  vaccine_name: text('vaccine_name').notNull(),
  vaccine_type: vaccineTypeEnum('vaccine_type').notNull(),
  vaccination_date: date('vaccination_date').notNull(),
  next_vaccination_date: date('next_vaccination_date'),
  batch_number: text('batch_number'),
  administered_by: text('administered_by').notNull(),
  side_effects: text('side_effects'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Medical checkups table
export const medicalCheckupsTable = pgTable('medical_checkups', {
  id: serial('id').primaryKey(),
  patient_id: integer('patient_id').references(() => patientsTable.id).notNull(),
  checkup_date: date('checkup_date').notNull(),
  checkup_type: checkupTypeEnum('checkup_type').notNull(),
  weight: numeric('weight', { precision: 5, scale: 2 }),
  height: numeric('height', { precision: 5, scale: 2 }),
  blood_pressure: text('blood_pressure'),
  temperature: numeric('temperature', { precision: 4, scale: 1 }),
  heart_rate: integer('heart_rate'),
  symptoms: text('symptoms'),
  diagnosis: text('diagnosis'),
  treatment: text('treatment'),
  medication_prescribed: text('medication_prescribed'),
  doctor_name: text('doctor_name').notNull(),
  next_checkup_date: date('next_checkup_date'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const patientsRelations = relations(patientsTable, ({ many }) => ({
  deliveryServices: many(deliveryServicesTable),
  immunizations: many(immunizationsTable),
  medicalCheckups: many(medicalCheckupsTable),
}));

export const deliveryServicesRelations = relations(deliveryServicesTable, ({ one }) => ({
  patient: one(patientsTable, {
    fields: [deliveryServicesTable.patient_id],
    references: [patientsTable.id],
  }),
}));

export const immunizationsRelations = relations(immunizationsTable, ({ one }) => ({
  patient: one(patientsTable, {
    fields: [immunizationsTable.patient_id],
    references: [patientsTable.id],
  }),
}));

export const medicalCheckupsRelations = relations(medicalCheckupsTable, ({ one }) => ({
  patient: one(patientsTable, {
    fields: [medicalCheckupsTable.patient_id],
    references: [patientsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Patient = typeof patientsTable.$inferSelect;
export type NewPatient = typeof patientsTable.$inferInsert;

export type DeliveryService = typeof deliveryServicesTable.$inferSelect;
export type NewDeliveryService = typeof deliveryServicesTable.$inferInsert;

export type Immunization = typeof immunizationsTable.$inferSelect;
export type NewImmunization = typeof immunizationsTable.$inferInsert;

export type MedicalCheckup = typeof medicalCheckupsTable.$inferSelect;
export type NewMedicalCheckup = typeof medicalCheckupsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  patients: patientsTable,
  deliveryServices: deliveryServicesTable,
  immunizations: immunizationsTable,
  medicalCheckups: medicalCheckupsTable,
};