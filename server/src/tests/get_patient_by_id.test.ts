import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type GetPatientByIdInput, type CreatePatientInput } from '../schema';
import { getPatientById } from '../handlers/get_patient_by_id';

// Test data for creating patients
const testPatient: CreatePatientInput = {
  name: 'John Doe',
  date_of_birth: new Date('1990-05-15'),
  gender: 'male',
  phone: '+1234567890',
  address: '123 Main St, Anytown'
};

const testPatient2: CreatePatientInput = {
  name: 'Jane Smith',
  date_of_birth: new Date('1985-03-20'),
  gender: 'female',
  phone: null,
  address: null
};

describe('getPatientById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a patient when valid ID is provided', async () => {
    // Create a test patient first
    const insertResult = await db.insert(patientsTable)
      .values({
        name: testPatient.name,
        date_of_birth: testPatient.date_of_birth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        gender: testPatient.gender,
        phone: testPatient.phone,
        address: testPatient.address
      })
      .returning()
      .execute();

    const createdPatient = insertResult[0];
    
    // Test the handler
    const input: GetPatientByIdInput = { id: createdPatient.id };
    const result = await getPatientById(input);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPatient.id);
    expect(result!.name).toEqual('John Doe');
    expect(result!.date_of_birth).toEqual(testPatient.date_of_birth);
    expect(result!.gender).toEqual('male');
    expect(result!.phone).toEqual('+1234567890');
    expect(result!.address).toEqual('123 Main St, Anytown');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when patient ID does not exist', async () => {
    const input: GetPatientByIdInput = { id: 999 };
    const result = await getPatientById(input);

    expect(result).toBeNull();
  });

  it('should handle patient with null phone and address', async () => {
    // Create a test patient with null optional fields
    const insertResult = await db.insert(patientsTable)
      .values({
        name: testPatient2.name,
        date_of_birth: testPatient2.date_of_birth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        gender: testPatient2.gender,
        phone: testPatient2.phone,
        address: testPatient2.address
      })
      .returning()
      .execute();

    const createdPatient = insertResult[0];
    
    // Test the handler
    const input: GetPatientByIdInput = { id: createdPatient.id };
    const result = await getPatientById(input);

    // Verify result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPatient.id);
    expect(result!.name).toEqual('Jane Smith');
    expect(result!.date_of_birth).toEqual(testPatient2.date_of_birth);
    expect(result!.gender).toEqual('female');
    expect(result!.phone).toBeNull();
    expect(result!.address).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return correct patient when multiple patients exist', async () => {
    // Create multiple test patients
    const insertResult1 = await db.insert(patientsTable)
      .values({
        name: testPatient.name,
        date_of_birth: testPatient.date_of_birth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        gender: testPatient.gender,
        phone: testPatient.phone,
        address: testPatient.address
      })
      .returning()
      .execute();

    const insertResult2 = await db.insert(patientsTable)
      .values({
        name: testPatient2.name,
        date_of_birth: testPatient2.date_of_birth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        gender: testPatient2.gender,
        phone: testPatient2.phone,
        address: testPatient2.address
      })
      .returning()
      .execute();

    const patient1 = insertResult1[0];
    const patient2 = insertResult2[0];
    
    // Test retrieving the second patient
    const input: GetPatientByIdInput = { id: patient2.id };
    const result = await getPatientById(input);

    // Verify we get the correct patient
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(patient2.id);
    expect(result!.name).toEqual('Jane Smith');
    expect(result!.gender).toEqual('female');
    
    // Ensure we didn't get the first patient
    expect(result!.id).not.toEqual(patient1.id);
    expect(result!.name).not.toEqual('John Doe');
  });

  it('should handle database connection properly', async () => {
    // Create a test patient
    const insertResult = await db.insert(patientsTable)
      .values({
        name: testPatient.name,
        date_of_birth: testPatient.date_of_birth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        gender: testPatient.gender,
        phone: testPatient.phone,
        address: testPatient.address
      })
      .returning()
      .execute();

    const createdPatient = insertResult[0];

    // Multiple calls should work correctly
    const input: GetPatientByIdInput = { id: createdPatient.id };
    const result1 = await getPatientById(input);
    const result2 = await getPatientById(input);

    // Both calls should return the same patient
    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result1!.id).toEqual(result2!.id);
    expect(result1!.name).toEqual(result2!.name);
  });
});