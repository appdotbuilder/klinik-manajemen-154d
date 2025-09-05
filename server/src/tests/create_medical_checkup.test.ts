import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable, medicalCheckupsTable } from '../db/schema';
import { type CreateMedicalCheckupInput } from '../schema';
import { createMedicalCheckup } from '../handlers/create_medical_checkup';
import { eq } from 'drizzle-orm';

// Helper function to create a test patient
const createTestPatient = async () => {
  const result = await db.insert(patientsTable)
    .values({
      name: 'Test Patient',
      date_of_birth: '1990-01-01',
      gender: 'female',
      phone: '123-456-7890',
      address: '123 Test Street'
    })
    .returning()
    .execute();
  
  return result[0];
};

// Test input with all fields
const fullTestInput: CreateMedicalCheckupInput = {
  patient_id: 1, // Will be updated in tests
  checkup_date: new Date('2024-01-15'),
  checkup_type: 'routine',
  weight: 65.5,
  height: 165.0,
  blood_pressure: '120/80',
  temperature: 36.8,
  heart_rate: 72,
  symptoms: 'Mild headache',
  diagnosis: 'Tension headache',
  treatment: 'Rest and hydration',
  medication_prescribed: 'Ibuprofen 400mg',
  doctor_name: 'Dr. Smith',
  next_checkup_date: new Date('2024-04-15'),
  notes: 'Patient appears healthy overall'
};

// Minimal test input with only required fields
const minimalTestInput: CreateMedicalCheckupInput = {
  patient_id: 1, // Will be updated in tests
  checkup_date: new Date('2024-01-15'),
  checkup_type: 'routine',
  weight: null,
  height: null,
  blood_pressure: null,
  temperature: null,
  heart_rate: null,
  symptoms: null,
  diagnosis: null,
  treatment: null,
  medication_prescribed: null,
  doctor_name: 'Dr. Johnson',
  next_checkup_date: null,
  notes: null
};

describe('createMedicalCheckup', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a medical checkup with all fields', async () => {
    // Create test patient first
    const patient = await createTestPatient();
    const input = { ...fullTestInput, patient_id: patient.id };

    const result = await createMedicalCheckup(input);

    // Basic field validation
    expect(result.patient_id).toEqual(patient.id);
    expect(result.checkup_date).toEqual(new Date('2024-01-15'));
    expect(result.checkup_type).toEqual('routine');
    expect(result.weight).toEqual(65.5);
    expect(typeof result.weight).toBe('number');
    expect(result.height).toEqual(165.0);
    expect(typeof result.height).toBe('number');
    expect(result.blood_pressure).toEqual('120/80');
    expect(result.temperature).toEqual(36.8);
    expect(typeof result.temperature).toBe('number');
    expect(result.heart_rate).toEqual(72);
    expect(result.symptoms).toEqual('Mild headache');
    expect(result.diagnosis).toEqual('Tension headache');
    expect(result.treatment).toEqual('Rest and hydration');
    expect(result.medication_prescribed).toEqual('Ibuprofen 400mg');
    expect(result.doctor_name).toEqual('Dr. Smith');
    expect(result.next_checkup_date).toEqual(new Date('2024-04-15'));
    expect(result.notes).toEqual('Patient appears healthy overall');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a medical checkup with minimal required fields', async () => {
    // Create test patient first
    const patient = await createTestPatient();
    const input = { ...minimalTestInput, patient_id: patient.id };

    const result = await createMedicalCheckup(input);

    // Basic field validation
    expect(result.patient_id).toEqual(patient.id);
    expect(result.checkup_date).toEqual(new Date('2024-01-15'));
    expect(result.checkup_type).toEqual('routine');
    expect(result.weight).toBeNull();
    expect(result.height).toBeNull();
    expect(result.blood_pressure).toBeNull();
    expect(result.temperature).toBeNull();
    expect(result.heart_rate).toBeNull();
    expect(result.symptoms).toBeNull();
    expect(result.diagnosis).toBeNull();
    expect(result.treatment).toBeNull();
    expect(result.medication_prescribed).toBeNull();
    expect(result.doctor_name).toEqual('Dr. Johnson');
    expect(result.next_checkup_date).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save medical checkup to database', async () => {
    // Create test patient first
    const patient = await createTestPatient();
    const input = { ...fullTestInput, patient_id: patient.id };

    const result = await createMedicalCheckup(input);

    // Query using proper drizzle syntax
    const checkups = await db.select()
      .from(medicalCheckupsTable)
      .where(eq(medicalCheckupsTable.id, result.id))
      .execute();

    expect(checkups).toHaveLength(1);
    expect(checkups[0].patient_id).toEqual(patient.id);
    expect(checkups[0].checkup_type).toEqual('routine');
    expect(parseFloat(checkups[0].weight!)).toEqual(65.5);
    expect(parseFloat(checkups[0].height!)).toEqual(165.0);
    expect(checkups[0].blood_pressure).toEqual('120/80');
    expect(parseFloat(checkups[0].temperature!)).toEqual(36.8);
    expect(checkups[0].heart_rate).toEqual(72);
    expect(checkups[0].doctor_name).toEqual('Dr. Smith');
    expect(checkups[0].created_at).toBeInstanceOf(Date);
    expect(checkups[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different checkup types', async () => {
    // Create test patient first
    const patient = await createTestPatient();

    const checkupTypes = ['routine', 'pregnancy', 'child', 'adult', 'elderly'] as const;

    for (const checkupType of checkupTypes) {
      const input = {
        ...minimalTestInput,
        patient_id: patient.id,
        checkup_type: checkupType,
        doctor_name: `Dr. ${checkupType}`
      };

      const result = await createMedicalCheckup(input);

      expect(result.checkup_type).toEqual(checkupType);
      expect(result.doctor_name).toEqual(`Dr. ${checkupType}`);
      expect(result.patient_id).toEqual(patient.id);
    }
  });

  it('should throw error for invalid patient_id', async () => {
    const input = { ...fullTestInput, patient_id: 99999 }; // Non-existent patient

    await expect(createMedicalCheckup(input)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should handle numeric precision correctly', async () => {
    // Create test patient first
    const patient = await createTestPatient();
    
    const input = {
      ...minimalTestInput,
      patient_id: patient.id,
      weight: 68.75, // Test decimal precision
      height: 172.5, // Test decimal precision
      temperature: 37.2 // Test decimal precision
    };

    const result = await createMedicalCheckup(input);

    // Verify numeric precision is maintained
    expect(result.weight).toEqual(68.75);
    expect(result.height).toEqual(172.5);
    expect(result.temperature).toEqual(37.2);
    expect(typeof result.weight).toBe('number');
    expect(typeof result.height).toBe('number');
    expect(typeof result.temperature).toBe('number');

    // Verify in database
    const checkups = await db.select()
      .from(medicalCheckupsTable)
      .where(eq(medicalCheckupsTable.id, result.id))
      .execute();

    expect(parseFloat(checkups[0].weight!)).toEqual(68.75);
    expect(parseFloat(checkups[0].height!)).toEqual(172.5);
    expect(parseFloat(checkups[0].temperature!)).toEqual(37.2);
  });
});