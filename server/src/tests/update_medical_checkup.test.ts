import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable, medicalCheckupsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateMedicalCheckupInput, type CreatePatientInput } from '../schema';
import { updateMedicalCheckup } from '../handlers/update_medical_checkup';

// Test patient data
const testPatient = {
  name: 'Jane Doe',
  date_of_birth: '1985-05-15',
  gender: 'female' as const,
  phone: '+1234567890',
  address: '123 Main St'
};

// Initial checkup data for testing updates
const initialCheckupData = {
  checkup_date: '2024-01-15',
  checkup_type: 'routine' as const,
  weight: 65.5,
  height: 165.0,
  blood_pressure: '120/80',
  temperature: 36.5,
  heart_rate: 72,
  symptoms: 'Initial symptoms',
  diagnosis: 'Initial diagnosis',
  treatment: 'Initial treatment',
  medication_prescribed: 'Initial medication',
  doctor_name: 'Dr. Initial',
  next_checkup_date: '2024-02-15',
  notes: 'Initial notes'
};

describe('updateMedicalCheckup', () => {
  let testPatientId: number;
  let testCheckupId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test patient
    const patientResult = await db.insert(patientsTable)
      .values(testPatient)
      .returning()
      .execute();
    testPatientId = patientResult[0].id;

    // Create initial medical checkup
    const checkupResult = await db.insert(medicalCheckupsTable)
      .values({
        patient_id: testPatientId,
        ...initialCheckupData,
        weight: initialCheckupData.weight.toString(),
        height: initialCheckupData.height.toString(),
        temperature: initialCheckupData.temperature.toString()
      })
      .returning()
      .execute();
    testCheckupId = checkupResult[0].id;
  });

  afterEach(resetDB);

  it('should update a medical checkup with all fields', async () => {
    const updateInput: UpdateMedicalCheckupInput = {
      id: testCheckupId,
      checkup_date: new Date('2024-01-20'),
      checkup_type: 'pregnancy',
      weight: 67.2,
      height: 166.0,
      blood_pressure: '125/85',
      temperature: 37.0,
      heart_rate: 75,
      symptoms: 'Updated symptoms',
      diagnosis: 'Updated diagnosis',
      treatment: 'Updated treatment',
      medication_prescribed: 'Updated medication',
      doctor_name: 'Dr. Updated',
      next_checkup_date: new Date('2024-02-20'),
      notes: 'Updated notes'
    };

    const result = await updateMedicalCheckup(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(testCheckupId);
    expect(result.patient_id).toEqual(testPatientId);
    expect(result.checkup_date).toEqual(new Date('2024-01-20'));
    expect(result.checkup_type).toEqual('pregnancy');
    expect(result.weight).toEqual(67.2);
    expect(typeof result.weight).toBe('number');
    expect(result.height).toEqual(166.0);
    expect(typeof result.height).toBe('number');
    expect(result.blood_pressure).toEqual('125/85');
    expect(result.temperature).toEqual(37.0);
    expect(typeof result.temperature).toBe('number');
    expect(result.heart_rate).toEqual(75);
    expect(result.symptoms).toEqual('Updated symptoms');
    expect(result.diagnosis).toEqual('Updated diagnosis');
    expect(result.treatment).toEqual('Updated treatment');
    expect(result.medication_prescribed).toEqual('Updated medication');
    expect(result.doctor_name).toEqual('Dr. Updated');
    expect(result.next_checkup_date).toEqual(new Date('2024-02-20'));
    expect(result.notes).toEqual('Updated notes');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateMedicalCheckupInput = {
      id: testCheckupId,
      weight: 70.0,
      blood_pressure: '130/90',
      doctor_name: 'Dr. Partial Update'
    };

    const result = await updateMedicalCheckup(updateInput);

    // Verify only specified fields were updated
    expect(result.weight).toEqual(70.0);
    expect(result.blood_pressure).toEqual('130/90');
    expect(result.doctor_name).toEqual('Dr. Partial Update');
    
    // Verify other fields remained unchanged
    expect(result.checkup_type).toEqual('routine');
    expect(result.height).toEqual(165.0);
    expect(result.temperature).toEqual(36.5);
    expect(result.symptoms).toEqual('Initial symptoms');
    expect(result.diagnosis).toEqual('Initial diagnosis');
  });

  it('should handle null values correctly', async () => {
    const updateInput: UpdateMedicalCheckupInput = {
      id: testCheckupId,
      weight: null,
      height: null,
      blood_pressure: null,
      temperature: null,
      heart_rate: null,
      symptoms: null,
      diagnosis: null,
      treatment: null,
      medication_prescribed: null,
      next_checkup_date: null,
      notes: null
    };

    const result = await updateMedicalCheckup(updateInput);

    // Verify null fields
    expect(result.weight).toBeNull();
    expect(result.height).toBeNull();
    expect(result.blood_pressure).toBeNull();
    expect(result.temperature).toBeNull();
    expect(result.heart_rate).toBeNull();
    expect(result.symptoms).toBeNull();
    expect(result.diagnosis).toBeNull();
    expect(result.treatment).toBeNull();
    expect(result.medication_prescribed).toBeNull();
    expect(result.next_checkup_date).toBeNull();
    expect(result.notes).toBeNull();
    
    // Required fields should remain unchanged
    expect(result.checkup_date).toEqual(new Date('2024-01-15'));
    expect(result.checkup_type).toEqual('routine');
    expect(result.doctor_name).toEqual('Dr. Initial');
  });

  it('should save updated data to database', async () => {
    const updateInput: UpdateMedicalCheckupInput = {
      id: testCheckupId,
      checkup_type: 'child',
      weight: 68.5,
      doctor_name: 'Dr. Database Test'
    };

    await updateMedicalCheckup(updateInput);

    // Query database directly to verify changes were persisted
    const checkups = await db.select()
      .from(medicalCheckupsTable)
      .where(eq(medicalCheckupsTable.id, testCheckupId))
      .execute();

    expect(checkups).toHaveLength(1);
    const savedCheckup = checkups[0];
    expect(savedCheckup.checkup_type).toEqual('child');
    expect(parseFloat(savedCheckup.weight!)).toEqual(68.5);
    expect(savedCheckup.doctor_name).toEqual('Dr. Database Test');
    expect(savedCheckup.updated_at).toBeInstanceOf(Date);
  });

  it('should update patient_id when provided', async () => {
    // Create another test patient
    const anotherPatientResult = await db.insert(patientsTable)
      .values({
        name: 'Another Patient',
        date_of_birth: '1990-01-01',
        gender: 'male',
        phone: null,
        address: null
      })
      .returning()
      .execute();
    
    const anotherPatientId = anotherPatientResult[0].id;

    const updateInput: UpdateMedicalCheckupInput = {
      id: testCheckupId,
      patient_id: anotherPatientId
    };

    const result = await updateMedicalCheckup(updateInput);

    expect(result.patient_id).toEqual(anotherPatientId);
  });

  it('should throw error when checkup does not exist', async () => {
    const updateInput: UpdateMedicalCheckupInput = {
      id: 99999, // Non-existent ID
      doctor_name: 'Dr. Not Found'
    };

    await expect(updateMedicalCheckup(updateInput)).rejects.toThrow(/Medical checkup with id 99999 not found/i);
  });

  it('should handle all checkup types correctly', async () => {
    const checkupTypes = ['routine', 'pregnancy', 'child', 'adult', 'elderly'] as const;
    
    for (const checkupType of checkupTypes) {
      const updateInput: UpdateMedicalCheckupInput = {
        id: testCheckupId,
        checkup_type: checkupType
      };

      const result = await updateMedicalCheckup(updateInput);
      expect(result.checkup_type).toEqual(checkupType);
    }
  });

  it('should preserve numeric precision for measurements', async () => {
    const updateInput: UpdateMedicalCheckupInput = {
      id: testCheckupId,
      weight: 65.25,
      height: 170.75,
      temperature: 36.8
    };

    const result = await updateMedicalCheckup(updateInput);

    expect(result.weight).toEqual(65.25);
    expect(result.height).toEqual(170.75);
    expect(result.temperature).toEqual(36.8);
    
    // Verify types are numbers
    expect(typeof result.weight).toBe('number');
    expect(typeof result.height).toBe('number');
    expect(typeof result.temperature).toBe('number');
  });
});