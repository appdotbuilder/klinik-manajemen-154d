import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable, immunizationsTable } from '../db/schema';
import { type GetServicesByPatientIdInput, type CreatePatientInput, type CreateImmunizationInput } from '../schema';
import { getImmunizationsByPatient } from '../handlers/get_immunizations_by_patient';

// Test data
const testPatient: CreatePatientInput = {
  name: 'Jane Doe',
  date_of_birth: new Date('1990-05-15'),
  gender: 'female',
  phone: '123-456-7890',
  address: '123 Main St'
};

const testImmunization1: Omit<CreateImmunizationInput, 'patient_id'> = {
  vaccine_name: 'Hepatitis B',
  vaccine_type: 'basic',
  vaccination_date: new Date('2023-01-15'),
  next_vaccination_date: new Date('2024-01-15'),
  batch_number: 'HB2023-001',
  administered_by: 'Dr. Smith',
  side_effects: 'None',
  notes: 'First dose of Hepatitis B vaccine'
};

const testImmunization2: Omit<CreateImmunizationInput, 'patient_id'> = {
  vaccine_name: 'COVID-19',
  vaccine_type: 'booster',
  vaccination_date: new Date('2023-06-10'),
  next_vaccination_date: null,
  batch_number: 'CV2023-456',
  administered_by: 'Dr. Johnson',
  side_effects: 'Mild soreness at injection site',
  notes: 'Booster shot'
};

describe('getImmunizationsByPatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return immunizations for a specific patient', async () => {
    // Create test patient
    const [patient] = await db.insert(patientsTable)
      .values({
        name: testPatient.name,
        date_of_birth: testPatient.date_of_birth.toISOString().split('T')[0],
        gender: testPatient.gender,
        phone: testPatient.phone,
        address: testPatient.address
      })
      .returning()
      .execute();

    // Create immunizations for the patient
    await db.insert(immunizationsTable)
      .values([
        {
          patient_id: patient.id,
          vaccine_name: testImmunization1.vaccine_name,
          vaccine_type: testImmunization1.vaccine_type,
          vaccination_date: testImmunization1.vaccination_date.toISOString().split('T')[0],
          next_vaccination_date: testImmunization1.next_vaccination_date!.toISOString().split('T')[0],
          batch_number: testImmunization1.batch_number,
          administered_by: testImmunization1.administered_by,
          side_effects: testImmunization1.side_effects,
          notes: testImmunization1.notes
        },
        {
          patient_id: patient.id,
          vaccine_name: testImmunization2.vaccine_name,
          vaccine_type: testImmunization2.vaccine_type,
          vaccination_date: testImmunization2.vaccination_date.toISOString().split('T')[0],
          next_vaccination_date: null, // testImmunization2.next_vaccination_date is null
          batch_number: testImmunization2.batch_number,
          administered_by: testImmunization2.administered_by,
          side_effects: testImmunization2.side_effects,
          notes: testImmunization2.notes
        }
      ])
      .execute();

    const input: GetServicesByPatientIdInput = {
      patientId: patient.id
    };

    const result = await getImmunizationsByPatient(input);

    // Should return both immunizations
    expect(result).toHaveLength(2);
    
    // Check first immunization
    const hepB = result.find(imm => imm.vaccine_name === 'Hepatitis B');
    expect(hepB).toBeDefined();
    expect(hepB!.patient_id).toEqual(patient.id);
    expect(hepB!.vaccine_type).toEqual('basic');
    expect(hepB!.vaccination_date).toBeInstanceOf(Date);
    expect(hepB!.next_vaccination_date).toBeInstanceOf(Date);
    expect(hepB!.batch_number).toEqual('HB2023-001');
    expect(hepB!.administered_by).toEqual('Dr. Smith');
    expect(hepB!.side_effects).toEqual('None');
    expect(hepB!.notes).toEqual('First dose of Hepatitis B vaccine');
    expect(hepB!.created_at).toBeInstanceOf(Date);
    expect(hepB!.updated_at).toBeInstanceOf(Date);

    // Check second immunization
    const covid = result.find(imm => imm.vaccine_name === 'COVID-19');
    expect(covid).toBeDefined();
    expect(covid!.patient_id).toEqual(patient.id);
    expect(covid!.vaccine_type).toEqual('booster');
    expect(covid!.vaccination_date).toBeInstanceOf(Date);
    expect(covid!.next_vaccination_date).toBeNull();
    expect(covid!.batch_number).toEqual('CV2023-456');
    expect(covid!.administered_by).toEqual('Dr. Johnson');
    expect(covid!.side_effects).toEqual('Mild soreness at injection site');
    expect(covid!.notes).toEqual('Booster shot');
  });

  it('should return empty array when patient has no immunizations', async () => {
    // Create test patient
    const [patient] = await db.insert(patientsTable)
      .values({
        name: testPatient.name,
        date_of_birth: testPatient.date_of_birth.toISOString().split('T')[0],
        gender: testPatient.gender,
        phone: testPatient.phone,
        address: testPatient.address
      })
      .returning()
      .execute();

    const input: GetServicesByPatientIdInput = {
      patientId: patient.id
    };

    const result = await getImmunizationsByPatient(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent patient', async () => {
    const input: GetServicesByPatientIdInput = {
      patientId: 999999 // Non-existent patient ID
    };

    const result = await getImmunizationsByPatient(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return immunizations for the specified patient', async () => {
    // Create two test patients
    const [patient1] = await db.insert(patientsTable)
      .values({
        name: 'Patient One',
        date_of_birth: '1985-01-01',
        gender: 'male',
        phone: '111-111-1111',
        address: '111 First St'
      })
      .returning()
      .execute();

    const [patient2] = await db.insert(patientsTable)
      .values({
        name: 'Patient Two',
        date_of_birth: '1990-01-01',
        gender: 'female',
        phone: '222-222-2222',
        address: '222 Second St'
      })
      .returning()
      .execute();

    // Create immunizations for both patients
    await db.insert(immunizationsTable)
      .values([
        {
          patient_id: patient1.id,
          vaccine_name: 'Flu Shot',
          vaccine_type: 'basic',
          vaccination_date: '2023-01-15',
          next_vaccination_date: null,
          batch_number: 'FLU2023-001',
          administered_by: 'Dr. Smith',
          side_effects: null,
          notes: 'Annual flu shot'
        },
        {
          patient_id: patient2.id,
          vaccine_name: 'Tetanus',
          vaccine_type: 'booster',
          vaccination_date: '2023-02-10',
          next_vaccination_date: '2033-02-10',
          batch_number: 'TET2023-002',
          administered_by: 'Dr. Johnson',
          side_effects: null,
          notes: 'Tetanus booster'
        },
        {
          patient_id: patient2.id,
          vaccine_name: 'MMR',
          vaccine_type: 'additional',
          vaccination_date: '2023-03-05',
          next_vaccination_date: null,
          batch_number: 'MMR2023-003',
          administered_by: 'Dr. Brown',
          side_effects: 'Mild fever',
          notes: 'MMR vaccination'
        }
      ])
      .execute();

    // Query for patient2's immunizations
    const input: GetServicesByPatientIdInput = {
      patientId: patient2.id
    };

    const result = await getImmunizationsByPatient(input);

    // Should only return patient2's immunizations (2 total)
    expect(result).toHaveLength(2);
    
    // All returned immunizations should belong to patient2
    result.forEach(immunization => {
      expect(immunization.patient_id).toEqual(patient2.id);
    });

    // Should include both vaccines for patient2
    const vaccineNames = result.map(imm => imm.vaccine_name).sort();
    expect(vaccineNames).toEqual(['MMR', 'Tetanus']);
  });

  it('should handle immunizations with null optional fields', async () => {
    // Create test patient
    const [patient] = await db.insert(patientsTable)
      .values({
        name: testPatient.name,
        date_of_birth: testPatient.date_of_birth.toISOString().split('T')[0],
        gender: testPatient.gender,
        phone: testPatient.phone,
        address: testPatient.address
      })
      .returning()
      .execute();

    // Create immunization with minimal data (nulls for optional fields)
    await db.insert(immunizationsTable)
      .values({
        patient_id: patient.id,
        vaccine_name: 'Basic Vaccine',
        vaccine_type: 'basic',
        vaccination_date: '2023-01-15',
        next_vaccination_date: null,
        batch_number: null,
        administered_by: 'Dr. Smith',
        side_effects: null,
        notes: null
      })
      .execute();

    const input: GetServicesByPatientIdInput = {
      patientId: patient.id
    };

    const result = await getImmunizationsByPatient(input);

    expect(result).toHaveLength(1);
    
    const immunization = result[0];
    expect(immunization.patient_id).toEqual(patient.id);
    expect(immunization.vaccine_name).toEqual('Basic Vaccine');
    expect(immunization.vaccine_type).toEqual('basic');
    expect(immunization.vaccination_date).toBeInstanceOf(Date);
    expect(immunization.next_vaccination_date).toBeNull();
    expect(immunization.batch_number).toBeNull();
    expect(immunization.administered_by).toEqual('Dr. Smith');
    expect(immunization.side_effects).toBeNull();
    expect(immunization.notes).toBeNull();
    expect(immunization.id).toBeDefined();
    expect(immunization.created_at).toBeInstanceOf(Date);
    expect(immunization.updated_at).toBeInstanceOf(Date);
  });
});