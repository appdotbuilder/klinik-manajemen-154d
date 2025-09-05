import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput } from '../schema';
import { createPatient } from '../handlers/create_patient';
import { eq } from 'drizzle-orm';

// Test inputs with different scenarios
const testInput: CreatePatientInput = {
  name: 'Jane Doe',
  date_of_birth: new Date('1990-05-15'),
  gender: 'female',
  phone: '+1234567890',
  address: '123 Main St, Anytown, USA'
};

const minimalInput: CreatePatientInput = {
  name: 'John Smith',
  date_of_birth: new Date('1985-12-01'),
  gender: 'male',
  phone: null,
  address: null
};

describe('createPatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a patient with all fields', async () => {
    const result = await createPatient(testInput);

    // Basic field validation
    expect(result.name).toEqual('Jane Doe');
    expect(result.date_of_birth).toEqual(testInput.date_of_birth);
    expect(result.gender).toEqual('female');
    expect(result.phone).toEqual('+1234567890');
    expect(result.address).toEqual('123 Main St, Anytown, USA');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a patient with minimal fields (nulls)', async () => {
    const result = await createPatient(minimalInput);

    expect(result.name).toEqual('John Smith');
    expect(result.date_of_birth).toEqual(minimalInput.date_of_birth);
    expect(result.gender).toEqual('male');
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save patient to database', async () => {
    const result = await createPatient(testInput);

    // Query using proper drizzle syntax
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, result.id))
      .execute();

    expect(patients).toHaveLength(1);
    expect(patients[0].name).toEqual('Jane Doe');
    expect(patients[0].date_of_birth).toEqual('1990-05-15'); // Database stores as string
    expect(patients[0].gender).toEqual('female');
    expect(patients[0].phone).toEqual('+1234567890');
    expect(patients[0].address).toEqual('123 Main St, Anytown, USA');
    expect(patients[0].created_at).toBeInstanceOf(Date);
    expect(patients[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different genders correctly', async () => {
    // Test male patient
    const maleResult = await createPatient({
      ...testInput,
      name: 'John Doe',
      gender: 'male'
    });

    expect(maleResult.gender).toEqual('male');
    expect(maleResult.name).toEqual('John Doe');

    // Test female patient
    const femaleResult = await createPatient({
      ...testInput,
      name: 'Jane Smith',
      gender: 'female'
    });

    expect(femaleResult.gender).toEqual('female');
    expect(femaleResult.name).toEqual('Jane Smith');

    // Verify both are in database
    const allPatients = await db.select()
      .from(patientsTable)
      .execute();

    expect(allPatients).toHaveLength(2);
    const genders = allPatients.map(p => p.gender);
    expect(genders).toContain('male');
    expect(genders).toContain('female');
  });

  it('should handle date of birth correctly', async () => {
    const birthDate = new Date('1995-03-20');
    const result = await createPatient({
      ...testInput,
      date_of_birth: birthDate
    });

    expect(result.date_of_birth).toEqual(birthDate);

    // Verify in database
    const dbPatient = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, result.id))
      .execute();

    expect(dbPatient[0].date_of_birth).toEqual('1995-03-20'); // Database stores as string
  });

  it('should create multiple patients with unique IDs', async () => {
    const patient1 = await createPatient(testInput);
    const patient2 = await createPatient({
      ...minimalInput,
      name: 'Different Patient'
    });

    expect(patient1.id).not.toEqual(patient2.id);
    expect(patient1.id).toBeGreaterThan(0);
    expect(patient2.id).toBeGreaterThan(0);

    // Verify both are in database
    const allPatients = await db.select()
      .from(patientsTable)
      .execute();

    expect(allPatients).toHaveLength(2);
    const names = allPatients.map(p => p.name);
    expect(names).toContain('Jane Doe');
    expect(names).toContain('Different Patient');
  });

  it('should set created_at and updated_at timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createPatient(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});