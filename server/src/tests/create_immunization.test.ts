import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { immunizationsTable, patientsTable } from '../db/schema';
import { type CreateImmunizationInput } from '../schema';
import { createImmunization } from '../handlers/create_immunization';
import { eq } from 'drizzle-orm';

// Test patient data
const testPatient = {
  name: 'John Doe',
  date_of_birth: '1990-01-01',
  gender: 'male' as const,
  phone: '+1234567890',
  address: '123 Test Street'
};

// Test immunization input
const testInput: CreateImmunizationInput = {
  patient_id: 1, // Will be set after patient creation
  vaccine_name: 'Hepatitis B',
  vaccine_type: 'basic',
  vaccination_date: new Date('2024-01-15'),
  next_vaccination_date: new Date('2024-07-15'),
  batch_number: 'HB2024001',
  administered_by: 'Dr. Smith',
  side_effects: 'Mild soreness at injection site',
  notes: 'Patient tolerated vaccine well'
};

describe('createImmunization', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an immunization record', async () => {
    // Create prerequisite patient
    const patientResult = await db.insert(patientsTable)
      .values(testPatient)
      .returning()
      .execute();

    const inputWithPatientId = {
      ...testInput,
      patient_id: patientResult[0].id
    };

    const result = await createImmunization(inputWithPatientId);

    // Basic field validation
    expect(result.id).toBeDefined();
    expect(result.patient_id).toEqual(patientResult[0].id);
    expect(result.vaccine_name).toEqual('Hepatitis B');
    expect(result.vaccine_type).toEqual('basic');
    expect(result.vaccination_date).toEqual(new Date('2024-01-15'));
    expect(result.next_vaccination_date).toEqual(new Date('2024-07-15'));
    expect(result.batch_number).toEqual('HB2024001');
    expect(result.administered_by).toEqual('Dr. Smith');
    expect(result.side_effects).toEqual('Mild soreness at injection site');
    expect(result.notes).toEqual('Patient tolerated vaccine well');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save immunization to database', async () => {
    // Create prerequisite patient
    const patientResult = await db.insert(patientsTable)
      .values(testPatient)
      .returning()
      .execute();

    const inputWithPatientId = {
      ...testInput,
      patient_id: patientResult[0].id
    };

    const result = await createImmunization(inputWithPatientId);

    // Verify in database
    const immunizations = await db.select()
      .from(immunizationsTable)
      .where(eq(immunizationsTable.id, result.id))
      .execute();

    expect(immunizations).toHaveLength(1);
    expect(immunizations[0].patient_id).toEqual(patientResult[0].id);
    expect(immunizations[0].vaccine_name).toEqual('Hepatitis B');
    expect(immunizations[0].vaccine_type).toEqual('basic');
    expect(immunizations[0].vaccination_date).toEqual('2024-01-15');
    expect(immunizations[0].next_vaccination_date).toEqual('2024-07-15');
    expect(immunizations[0].batch_number).toEqual('HB2024001');
    expect(immunizations[0].administered_by).toEqual('Dr. Smith');
    expect(immunizations[0].side_effects).toEqual('Mild soreness at injection site');
    expect(immunizations[0].notes).toEqual('Patient tolerated vaccine well');
    expect(immunizations[0].created_at).toBeInstanceOf(Date);
    expect(immunizations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    // Create prerequisite patient
    const patientResult = await db.insert(patientsTable)
      .values(testPatient)
      .returning()
      .execute();

    const minimalInput: CreateImmunizationInput = {
      patient_id: patientResult[0].id,
      vaccine_name: 'MMR',
      vaccine_type: 'booster',
      vaccination_date: new Date('2024-02-01'),
      next_vaccination_date: null,
      batch_number: null,
      administered_by: 'Dr. Johnson',
      side_effects: null,
      notes: null
    };

    const result = await createImmunization(minimalInput);

    expect(result.vaccine_name).toEqual('MMR');
    expect(result.vaccine_type).toEqual('booster');
    expect(result.next_vaccination_date).toBeNull();
    expect(result.batch_number).toBeNull();
    expect(result.side_effects).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.administered_by).toEqual('Dr. Johnson');
  });

  it('should throw error when patient does not exist', async () => {
    const inputWithInvalidPatient = {
      ...testInput,
      patient_id: 999 // Non-existent patient ID
    };

    await expect(createImmunization(inputWithInvalidPatient))
      .rejects
      .toThrow(/Patient with id 999 not found/i);
  });

  it('should handle different vaccine types', async () => {
    // Create prerequisite patient
    const patientResult = await db.insert(patientsTable)
      .values(testPatient)
      .returning()
      .execute();

    const additionalVaccineInput: CreateImmunizationInput = {
      patient_id: patientResult[0].id,
      vaccine_name: 'COVID-19',
      vaccine_type: 'additional',
      vaccination_date: new Date('2024-03-01'),
      next_vaccination_date: null,
      batch_number: 'COV2024001',
      administered_by: 'Dr. Wilson',
      side_effects: 'No adverse reactions',
      notes: 'Second dose administered'
    };

    const result = await createImmunization(additionalVaccineInput);

    expect(result.vaccine_name).toEqual('COVID-19');
    expect(result.vaccine_type).toEqual('additional');
    expect(result.batch_number).toEqual('COV2024001');
  });
});