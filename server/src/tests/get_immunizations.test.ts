import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable, immunizationsTable } from '../db/schema';
import { getImmunizations } from '../handlers/get_immunizations';

describe('getImmunizations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no immunizations exist', async () => {
    const result = await getImmunizations();
    expect(result).toEqual([]);
  });

  it('should fetch all immunization records', async () => {
    // Create a test patient first
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Test Patient',
        date_of_birth: '1990-01-01',
        gender: 'female',
        phone: '1234567890',
        address: '123 Test St'
      })
      .returning()
      .execute();

    const patientId = patientResult[0].id;

    // Create test immunization records
    const testImmunizations = [
      {
        patient_id: patientId,
        vaccine_name: 'MMR Vaccine',
        vaccine_type: 'basic' as const,
        vaccination_date: '2023-01-15',
        next_vaccination_date: '2024-01-15',
        batch_number: 'MMR-001',
        administered_by: 'Dr. Smith',
        side_effects: 'Minor redness at injection site',
        notes: 'First dose of MMR vaccine'
      },
      {
        patient_id: patientId,
        vaccine_name: 'COVID-19 Vaccine',
        vaccine_type: 'additional' as const,
        vaccination_date: '2023-03-20',
        next_vaccination_date: null,
        batch_number: 'COV-123',
        administered_by: 'Nurse Johnson',
        side_effects: null,
        notes: 'Booster shot'
      },
      {
        patient_id: patientId,
        vaccine_name: 'Flu Vaccine',
        vaccine_type: 'booster' as const,
        vaccination_date: '2023-10-01',
        next_vaccination_date: '2024-10-01',
        batch_number: 'FLU-456',
        administered_by: 'Dr. Brown',
        side_effects: 'Mild fatigue for 24 hours',
        notes: 'Annual flu vaccination'
      }
    ];

    await db.insert(immunizationsTable)
      .values(testImmunizations)
      .execute();

    const result = await getImmunizations();

    // Verify we get all immunization records
    expect(result).toHaveLength(3);

    // Verify each immunization has correct structure
    result.forEach(immunization => {
      expect(immunization.id).toBeDefined();
      expect(immunization.patient_id).toEqual(patientId);
      expect(immunization.vaccine_name).toBeDefined();
      expect(['basic', 'additional', 'booster']).toContain(immunization.vaccine_type);
      expect(immunization.vaccination_date).toBeInstanceOf(Date);
      expect(immunization.administered_by).toBeDefined();
      expect(immunization.created_at).toBeInstanceOf(Date);
      expect(immunization.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific immunization data
    const mmrVaccine = result.find(i => i.vaccine_name === 'MMR Vaccine');
    expect(mmrVaccine).toBeDefined();
    expect(mmrVaccine!.vaccine_type).toEqual('basic');
    expect(mmrVaccine!.batch_number).toEqual('MMR-001');
    expect(mmrVaccine!.administered_by).toEqual('Dr. Smith');
    expect(mmrVaccine!.side_effects).toEqual('Minor redness at injection site');
    expect(mmrVaccine!.notes).toEqual('First dose of MMR vaccine');
    expect(mmrVaccine!.next_vaccination_date).toBeInstanceOf(Date);

    const covidVaccine = result.find(i => i.vaccine_name === 'COVID-19 Vaccine');
    expect(covidVaccine).toBeDefined();
    expect(covidVaccine!.vaccine_type).toEqual('additional');
    expect(covidVaccine!.next_vaccination_date).toBeNull();
    expect(covidVaccine!.side_effects).toBeNull();

    const fluVaccine = result.find(i => i.vaccine_name === 'Flu Vaccine');
    expect(fluVaccine).toBeDefined();
    expect(fluVaccine!.vaccine_type).toEqual('booster');
    expect(fluVaccine!.side_effects).toEqual('Mild fatigue for 24 hours');
  });

  it('should handle multiple patients with immunizations', async () => {
    // Create multiple test patients
    const patient1Result = await db.insert(patientsTable)
      .values({
        name: 'Patient One',
        date_of_birth: '1985-05-15',
        gender: 'male',
        phone: '1111111111',
        address: '111 First St'
      })
      .returning()
      .execute();

    const patient2Result = await db.insert(patientsTable)
      .values({
        name: 'Patient Two',
        date_of_birth: '1992-08-22',
        gender: 'female',
        phone: '2222222222',
        address: '222 Second St'
      })
      .returning()
      .execute();

    const patient1Id = patient1Result[0].id;
    const patient2Id = patient2Result[0].id;

    // Create immunizations for both patients
    await db.insert(immunizationsTable)
      .values([
        {
          patient_id: patient1Id,
          vaccine_name: 'Hepatitis B',
          vaccine_type: 'basic',
          vaccination_date: '2023-02-10',
          next_vaccination_date: '2024-02-10',
          batch_number: 'HEP-B-001',
          administered_by: 'Dr. Wilson',
          side_effects: null,
          notes: 'First dose'
        },
        {
          patient_id: patient2Id,
          vaccine_name: 'Tetanus',
          vaccine_type: 'booster',
          vaccination_date: '2023-04-05',
          next_vaccination_date: '2033-04-05',
          batch_number: 'TET-002',
          administered_by: 'Nurse Davis',
          side_effects: 'Slight soreness',
          notes: 'Ten-year booster'
        }
      ])
      .execute();

    const result = await getImmunizations();

    expect(result).toHaveLength(2);
    expect(result.map(i => i.patient_id)).toContain(patient1Id);
    expect(result.map(i => i.patient_id)).toContain(patient2Id);
    expect(result.map(i => i.vaccine_name)).toContain('Hepatitis B');
    expect(result.map(i => i.vaccine_name)).toContain('Tetanus');
  });

  it('should handle nullable fields correctly', async () => {
    // Create a test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Test Patient',
        date_of_birth: '1995-12-01',
        gender: 'male',
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const patientId = patientResult[0].id;

    // Create immunization with minimal required fields
    await db.insert(immunizationsTable)
      .values({
        patient_id: patientId,
        vaccine_name: 'Basic Vaccine',
        vaccine_type: 'basic',
        vaccination_date: '2023-06-01',
        next_vaccination_date: null,
        batch_number: null,
        administered_by: 'Dr. Minimal',
        side_effects: null,
        notes: null
      })
      .execute();

    const result = await getImmunizations();

    expect(result).toHaveLength(1);
    const immunization = result[0];
    expect(immunization.next_vaccination_date).toBeNull();
    expect(immunization.batch_number).toBeNull();
    expect(immunization.side_effects).toBeNull();
    expect(immunization.notes).toBeNull();
    expect(immunization.vaccine_name).toEqual('Basic Vaccine');
    expect(immunization.administered_by).toEqual('Dr. Minimal');
  });

  it('should return immunizations sorted by database order', async () => {
    // Create a test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Test Patient',
        date_of_birth: '1988-07-15',
        gender: 'female',
        phone: '5555555555',
        address: '555 Test Ave'
      })
      .returning()
      .execute();

    const patientId = patientResult[0].id;

    // Create multiple immunizations with different dates
    const immunizations = [
      {
        patient_id: patientId,
        vaccine_name: 'First Vaccine',
        vaccine_type: 'basic' as const,
        vaccination_date: '2023-01-01',
        next_vaccination_date: null,
        batch_number: 'FIRST-001',
        administered_by: 'Dr. First',
        side_effects: null,
        notes: 'First vaccination'
      },
      {
        patient_id: patientId,
        vaccine_name: 'Second Vaccine',
        vaccine_type: 'additional' as const,
        vaccination_date: '2023-02-01',
        next_vaccination_date: null,
        batch_number: 'SECOND-002',
        administered_by: 'Dr. Second',
        side_effects: null,
        notes: 'Second vaccination'
      }
    ];

    // Insert immunizations one by one to maintain order
    for (const immunization of immunizations) {
      await db.insert(immunizationsTable)
        .values(immunization)
        .execute();
    }

    const result = await getImmunizations();

    expect(result).toHaveLength(2);
    // Verify we can access all immunizations regardless of order
    expect(result.map(i => i.vaccine_name)).toContain('First Vaccine');
    expect(result.map(i => i.vaccine_name)).toContain('Second Vaccine');
  });
});