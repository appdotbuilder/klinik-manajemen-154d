import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable, medicalCheckupsTable } from '../db/schema';
import { type GetServicesByPatientIdInput } from '../schema';
import { getMedicalCheckupsByPatient } from '../handlers/get_medical_checkups_by_patient';

describe('getMedicalCheckupsByPatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return medical checkups for a specific patient', async () => {
    // Create test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Jane Smith',
        date_of_birth: '1990-05-15',
        gender: 'female',
        phone: '555-0123',
        address: '123 Main St'
      })
      .returning()
      .execute();

    const patientId = patientResult[0].id;

    // Create test medical checkups
    await db.insert(medicalCheckupsTable)
      .values([
        {
          patient_id: patientId,
          checkup_date: '2024-01-15',
          checkup_type: 'routine',
          weight: '70.5',
          height: '165.0',
          blood_pressure: '120/80',
          temperature: '36.5',
          heart_rate: 72,
          symptoms: 'None',
          diagnosis: 'Healthy',
          treatment: 'Continue regular exercise',
          medication_prescribed: null,
          doctor_name: 'Dr. Johnson',
          next_checkup_date: '2024-07-15',
          notes: 'Patient in good health'
        },
        {
          patient_id: patientId,
          checkup_date: '2023-07-15',
          checkup_type: 'pregnancy',
          weight: '68.0',
          height: '165.0',
          blood_pressure: '115/75',
          temperature: '36.8',
          heart_rate: 78,
          symptoms: 'Morning sickness',
          diagnosis: 'Healthy pregnancy - 8 weeks',
          treatment: 'Prenatal vitamins',
          medication_prescribed: 'Folic acid 400mcg daily',
          doctor_name: 'Dr. Wilson',
          next_checkup_date: '2023-08-15',
          notes: 'First prenatal visit'
        }
      ])
      .execute();

    const input: GetServicesByPatientIdInput = {
      patientId: patientId
    };

    const result = await getMedicalCheckupsByPatient(input);

    // Should return both checkups
    expect(result).toHaveLength(2);

    // Should be ordered by checkup_date descending (most recent first)
    expect(result[0].checkup_date).toEqual(new Date('2024-01-15'));
    expect(result[1].checkup_date).toEqual(new Date('2023-07-15'));

    // Verify first checkup data
    const firstCheckup = result[0];
    expect(firstCheckup.patient_id).toEqual(patientId);
    expect(firstCheckup.checkup_type).toEqual('routine');
    expect(firstCheckup.weight).toEqual(70.5);
    expect(typeof firstCheckup.weight).toBe('number');
    expect(firstCheckup.height).toEqual(165.0);
    expect(typeof firstCheckup.height).toBe('number');
    expect(firstCheckup.temperature).toEqual(36.5);
    expect(typeof firstCheckup.temperature).toBe('number');
    expect(firstCheckup.heart_rate).toEqual(72);
    expect(firstCheckup.blood_pressure).toEqual('120/80');
    expect(firstCheckup.doctor_name).toEqual('Dr. Johnson');
    expect(firstCheckup.diagnosis).toEqual('Healthy');

    // Verify second checkup data
    const secondCheckup = result[1];
    expect(secondCheckup.patient_id).toEqual(patientId);
    expect(secondCheckup.checkup_type).toEqual('pregnancy');
    expect(secondCheckup.weight).toEqual(68.0);
    expect(typeof secondCheckup.weight).toBe('number');
    expect(secondCheckup.symptoms).toEqual('Morning sickness');
    expect(secondCheckup.medication_prescribed).toEqual('Folic acid 400mcg daily');
  });

  it('should return empty array for patient with no medical checkups', async () => {
    // Create test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'John Doe',
        date_of_birth: '1985-03-20',
        gender: 'male',
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const input: GetServicesByPatientIdInput = {
      patientId: patientResult[0].id
    };

    const result = await getMedicalCheckupsByPatient(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle null numeric values correctly', async () => {
    // Create test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Test Patient',
        date_of_birth: '1995-12-01',
        gender: 'male',
        phone: '555-9999',
        address: '456 Test Ave'
      })
      .returning()
      .execute();

    const patientId = patientResult[0].id;

    // Create medical checkup with null numeric values
    await db.insert(medicalCheckupsTable)
      .values({
        patient_id: patientId,
        checkup_date: '2024-02-10',
        checkup_type: 'adult',
        weight: null,
        height: null,
        blood_pressure: '130/85',
        temperature: null,
        heart_rate: null,
        symptoms: 'Headache',
        diagnosis: 'Tension headache',
        treatment: 'Rest and hydration',
        medication_prescribed: null,
        doctor_name: 'Dr. Brown',
        next_checkup_date: null,
        notes: null
      })
      .execute();

    const input: GetServicesByPatientIdInput = {
      patientId: patientId
    };

    const result = await getMedicalCheckupsByPatient(input);

    expect(result).toHaveLength(1);

    const checkup = result[0];
    expect(checkup.weight).toBeNull();
    expect(checkup.height).toBeNull();
    expect(checkup.temperature).toBeNull();
    expect(checkup.heart_rate).toBeNull();
    expect(checkup.blood_pressure).toEqual('130/85');
    expect(checkup.symptoms).toEqual('Headache');
    expect(checkup.diagnosis).toEqual('Tension headache');
    expect(checkup.medication_prescribed).toBeNull();
    expect(checkup.next_checkup_date).toBeNull();
    expect(checkup.notes).toBeNull();
  });

  it('should return checkups only for the specified patient', async () => {
    // Create two test patients
    const patient1Result = await db.insert(patientsTable)
      .values({
        name: 'Patient One',
        date_of_birth: '1980-01-01',
        gender: 'male',
        phone: '555-1111',
        address: '111 First St'
      })
      .returning()
      .execute();

    const patient2Result = await db.insert(patientsTable)
      .values({
        name: 'Patient Two',
        date_of_birth: '1985-02-02',
        gender: 'female',
        phone: '555-2222',
        address: '222 Second St'
      })
      .returning()
      .execute();

    const patient1Id = patient1Result[0].id;
    const patient2Id = patient2Result[0].id;

    // Create medical checkups for both patients
    await db.insert(medicalCheckupsTable)
      .values([
        {
          patient_id: patient1Id,
          checkup_date: '2024-01-01',
          checkup_type: 'routine',
          weight: '75.0',
          height: '180.0',
          temperature: '36.7',
          doctor_name: 'Dr. Alpha',
        },
        {
          patient_id: patient2Id,
          checkup_date: '2024-01-02',
          checkup_type: 'routine',
          weight: '60.0',
          height: '160.0',
          temperature: '36.6',
          doctor_name: 'Dr. Beta',
        },
        {
          patient_id: patient1Id,
          checkup_date: '2024-01-15',
          checkup_type: 'adult',
          weight: '74.5',
          height: '180.0',
          temperature: '36.8',
          doctor_name: 'Dr. Alpha',
        }
      ])
      .execute();

    // Query checkups for patient 1
    const input1: GetServicesByPatientIdInput = {
      patientId: patient1Id
    };

    const result1 = await getMedicalCheckupsByPatient(input1);

    // Should return only checkups for patient 1 (2 checkups)
    expect(result1).toHaveLength(2);
    result1.forEach(checkup => {
      expect(checkup.patient_id).toEqual(patient1Id);
      expect(checkup.doctor_name).toEqual('Dr. Alpha');
    });

    // Query checkups for patient 2
    const input2: GetServicesByPatientIdInput = {
      patientId: patient2Id
    };

    const result2 = await getMedicalCheckupsByPatient(input2);

    // Should return only checkups for patient 2 (1 checkup)
    expect(result2).toHaveLength(1);
    expect(result2[0].patient_id).toEqual(patient2Id);
    expect(result2[0].doctor_name).toEqual('Dr. Beta');
    expect(result2[0].weight).toEqual(60.0);
    expect(typeof result2[0].weight).toBe('number');
  });

  it('should handle different checkup types correctly', async () => {
    // Create test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Multi Checkup Patient',
        date_of_birth: '1975-08-15',
        gender: 'female',
        phone: '555-7777',
        address: '777 Multi St'
      })
      .returning()
      .execute();

    const patientId = patientResult[0].id;

    // Create checkups of different types
    await db.insert(medicalCheckupsTable)
      .values([
        {
          patient_id: patientId,
          checkup_date: '2024-03-01',
          checkup_type: 'routine',
          doctor_name: 'Dr. Routine',
        },
        {
          patient_id: patientId,
          checkup_date: '2024-02-15',
          checkup_type: 'pregnancy',
          doctor_name: 'Dr. Pregnancy',
        },
        {
          patient_id: patientId,
          checkup_date: '2024-01-30',
          checkup_type: 'elderly',
          doctor_name: 'Dr. Elderly',
        }
      ])
      .execute();

    const input: GetServicesByPatientIdInput = {
      patientId: patientId
    };

    const result = await getMedicalCheckupsByPatient(input);

    expect(result).toHaveLength(3);

    // Verify different checkup types are present
    const checkupTypes = result.map(checkup => checkup.checkup_type);
    expect(checkupTypes).toContain('routine');
    expect(checkupTypes).toContain('pregnancy');
    expect(checkupTypes).toContain('elderly');

    // Verify ordering by date (most recent first)
    expect(result[0].checkup_date).toEqual(new Date('2024-03-01'));
    expect(result[1].checkup_date).toEqual(new Date('2024-02-15'));
    expect(result[2].checkup_date).toEqual(new Date('2024-01-30'));
  });
});