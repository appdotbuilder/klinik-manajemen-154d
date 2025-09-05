import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable, medicalCheckupsTable } from '../db/schema';
import { getMedicalCheckups } from '../handlers/get_medical_checkups';

describe('getMedicalCheckups', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no medical checkups exist', async () => {
    const result = await getMedicalCheckups();

    expect(result).toEqual([]);
  });

  it('should fetch all medical checkups from database', async () => {
    // First create a test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Test Patient',
        date_of_birth: '1990-01-01',
        gender: 'female',
        phone: '+1234567890',
        address: '123 Test St'
      })
      .returning()
      .execute();

    const patientId = patientResult[0].id;

    // Create test medical checkup records
    await db.insert(medicalCheckupsTable)
      .values([
        {
          patient_id: patientId,
          checkup_date: '2024-01-15',
          checkup_type: 'routine',
          weight: '65.50',
          height: '165.00',
          blood_pressure: '120/80',
          temperature: '36.5',
          heart_rate: 72,
          symptoms: 'None',
          diagnosis: 'Healthy',
          treatment: 'Continue routine care',
          medication_prescribed: 'Vitamin D',
          doctor_name: 'Dr. Smith',
          next_checkup_date: '2024-07-15',
          notes: 'Patient in good health'
        },
        {
          patient_id: patientId,
          checkup_date: '2024-02-10',
          checkup_type: 'pregnancy',
          weight: '70.25',
          height: '165.00',
          blood_pressure: '118/75',
          temperature: '36.8',
          heart_rate: 78,
          symptoms: 'Morning sickness',
          diagnosis: 'Normal pregnancy progress',
          treatment: 'Prenatal vitamins',
          medication_prescribed: 'Folic acid, Iron supplements',
          doctor_name: 'Dr. Johnson',
          next_checkup_date: '2024-03-10',
          notes: 'Pregnancy progressing normally'
        }
      ])
      .execute();

    const result = await getMedicalCheckups();

    expect(result).toHaveLength(2);

    // Check first checkup
    const firstCheckup = result.find(c => c.checkup_type === 'routine');
    expect(firstCheckup).toBeDefined();
    expect(firstCheckup!.patient_id).toEqual(patientId);
    expect(firstCheckup!.checkup_date).toBeInstanceOf(Date);
    expect(firstCheckup!.checkup_type).toEqual('routine');
    expect(firstCheckup!.weight).toEqual(65.50);
    expect(typeof firstCheckup!.weight).toBe('number');
    expect(firstCheckup!.height).toEqual(165.00);
    expect(typeof firstCheckup!.height).toBe('number');
    expect(firstCheckup!.blood_pressure).toEqual('120/80');
    expect(firstCheckup!.temperature).toEqual(36.5);
    expect(typeof firstCheckup!.temperature).toBe('number');
    expect(firstCheckup!.heart_rate).toEqual(72);
    expect(firstCheckup!.symptoms).toEqual('None');
    expect(firstCheckup!.diagnosis).toEqual('Healthy');
    expect(firstCheckup!.treatment).toEqual('Continue routine care');
    expect(firstCheckup!.medication_prescribed).toEqual('Vitamin D');
    expect(firstCheckup!.doctor_name).toEqual('Dr. Smith');
    expect(firstCheckup!.next_checkup_date).toBeInstanceOf(Date);
    expect(firstCheckup!.notes).toEqual('Patient in good health');
    expect(firstCheckup!.id).toBeDefined();
    expect(firstCheckup!.created_at).toBeInstanceOf(Date);
    expect(firstCheckup!.updated_at).toBeInstanceOf(Date);

    // Check second checkup
    const secondCheckup = result.find(c => c.checkup_type === 'pregnancy');
    expect(secondCheckup).toBeDefined();
    expect(secondCheckup!.patient_id).toEqual(patientId);
    expect(secondCheckup!.checkup_type).toEqual('pregnancy');
    expect(secondCheckup!.weight).toEqual(70.25);
    expect(typeof secondCheckup!.weight).toBe('number');
    expect(secondCheckup!.height).toEqual(165.00);
    expect(typeof secondCheckup!.height).toBe('number');
    expect(secondCheckup!.temperature).toEqual(36.8);
    expect(typeof secondCheckup!.temperature).toBe('number');
    expect(secondCheckup!.heart_rate).toEqual(78);
    expect(secondCheckup!.symptoms).toEqual('Morning sickness');
    expect(secondCheckup!.diagnosis).toEqual('Normal pregnancy progress');
    expect(secondCheckup!.doctor_name).toEqual('Dr. Johnson');
  });

  it('should handle null numeric values correctly', async () => {
    // Create a test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Test Patient',
        date_of_birth: '1990-01-01',
        gender: 'male',
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const patientId = patientResult[0].id;

    // Create medical checkup with null numeric values
    await db.insert(medicalCheckupsTable)
      .values({
        patient_id: patientId,
        checkup_date: '2024-01-15',
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
        doctor_name: 'Dr. Smith',
        next_checkup_date: null,
        notes: null
      })
      .execute();

    const result = await getMedicalCheckups();

    expect(result).toHaveLength(1);
    const checkup = result[0];
    expect(checkup.weight).toBeNull();
    expect(checkup.height).toBeNull();
    expect(checkup.temperature).toBeNull();
    expect(checkup.heart_rate).toBeNull();
    expect(checkup.blood_pressure).toBeNull();
    expect(checkup.symptoms).toBeNull();
    expect(checkup.diagnosis).toBeNull();
    expect(checkup.treatment).toBeNull();
    expect(checkup.medication_prescribed).toBeNull();
    expect(checkup.next_checkup_date).toBeNull();
    expect(checkup.notes).toBeNull();
  });

  it('should fetch multiple checkups for different patients', async () => {
    // Create two test patients
    const patient1Result = await db.insert(patientsTable)
      .values({
        name: 'Patient One',
        date_of_birth: '1985-01-01',
        gender: 'female',
        phone: '+1111111111',
        address: '123 First St'
      })
      .returning()
      .execute();

    const patient2Result = await db.insert(patientsTable)
      .values({
        name: 'Patient Two',
        date_of_birth: '1990-01-01',
        gender: 'male',
        phone: '+2222222222',
        address: '456 Second St'
      })
      .returning()
      .execute();

    const patient1Id = patient1Result[0].id;
    const patient2Id = patient2Result[0].id;

    // Create checkups for both patients
    await db.insert(medicalCheckupsTable)
      .values([
        {
          patient_id: patient1Id,
          checkup_date: '2024-01-15',
          checkup_type: 'routine',
          weight: '60.00',
          height: '160.00',
          temperature: '36.6',
          doctor_name: 'Dr. Smith'
        },
        {
          patient_id: patient2Id,
          checkup_date: '2024-01-20',
          checkup_type: 'child',
          weight: '25.50',
          height: '120.00',
          temperature: '36.7',
          doctor_name: 'Dr. Johnson'
        }
      ])
      .execute();

    const result = await getMedicalCheckups();

    expect(result).toHaveLength(2);
    
    // Verify both patients' checkups are included
    const patient1Checkup = result.find(c => c.patient_id === patient1Id);
    const patient2Checkup = result.find(c => c.patient_id === patient2Id);
    
    expect(patient1Checkup).toBeDefined();
    expect(patient1Checkup!.checkup_type).toEqual('routine');
    expect(patient1Checkup!.weight).toEqual(60.00);
    
    expect(patient2Checkup).toBeDefined();
    expect(patient2Checkup!.checkup_type).toEqual('child');
    expect(patient2Checkup!.weight).toEqual(25.50);
  });

  it('should handle different checkup types correctly', async () => {
    // Create a test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Test Patient',
        date_of_birth: '1980-01-01',
        gender: 'female'
      })
      .returning()
      .execute();

    const patientId = patientResult[0].id;

    // Create checkups with different types
    await db.insert(medicalCheckupsTable)
      .values([
        {
          patient_id: patientId,
          checkup_date: '2024-01-01',
          checkup_type: 'routine',
          doctor_name: 'Dr. A'
        },
        {
          patient_id: patientId,
          checkup_date: '2024-01-02',
          checkup_type: 'pregnancy',
          doctor_name: 'Dr. B'
        },
        {
          patient_id: patientId,
          checkup_date: '2024-01-03',
          checkup_type: 'child',
          doctor_name: 'Dr. C'
        },
        {
          patient_id: patientId,
          checkup_date: '2024-01-04',
          checkup_type: 'adult',
          doctor_name: 'Dr. D'
        },
        {
          patient_id: patientId,
          checkup_date: '2024-01-05',
          checkup_type: 'elderly',
          doctor_name: 'Dr. E'
        }
      ])
      .execute();

    const result = await getMedicalCheckups();

    expect(result).toHaveLength(5);
    
    const checkupTypes = result.map(c => c.checkup_type);
    expect(checkupTypes).toContain('routine');
    expect(checkupTypes).toContain('pregnancy');
    expect(checkupTypes).toContain('child');
    expect(checkupTypes).toContain('adult');
    expect(checkupTypes).toContain('elderly');
  });
});