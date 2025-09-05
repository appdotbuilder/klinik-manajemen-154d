import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type UpdatePatientInput, type CreatePatientInput } from '../schema';
import { updatePatient } from '../handlers/update_patient';
import { eq } from 'drizzle-orm';

// Test input for creating a patient first
const testPatientData: CreatePatientInput = {
  name: 'Original Patient',
  date_of_birth: new Date('1990-01-01'),
  gender: 'female',
  phone: '555-0123',
  address: '123 Original Street'
};

describe('updatePatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestPatient = async () => {
    const result = await db.insert(patientsTable)
      .values({
        name: testPatientData.name,
        date_of_birth: testPatientData.date_of_birth.toISOString().split('T')[0], // Convert to string format
        gender: testPatientData.gender,
        phone: testPatientData.phone,
        address: testPatientData.address
      })
      .returning()
      .execute();
    
    // Convert date strings back to Date objects for consistency
    const patient = result[0];
    return {
      ...patient,
      date_of_birth: new Date(patient.date_of_birth),
      created_at: new Date(patient.created_at),
      updated_at: new Date(patient.updated_at)
    };
  };

  it('should update all patient fields', async () => {
    const patient = await createTestPatient();
    
    const updateInput: UpdatePatientInput = {
      id: patient.id,
      name: 'Updated Patient Name',
      date_of_birth: new Date('1985-06-15'),
      gender: 'male',
      phone: '555-9999',
      address: '456 Updated Avenue'
    };

    const result = await updatePatient(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(patient.id);
    expect(result.name).toEqual('Updated Patient Name');
    expect(result.date_of_birth).toEqual(new Date('1985-06-15'));
    expect(result.gender).toEqual('male');
    expect(result.phone).toEqual('555-9999');
    expect(result.address).toEqual('456 Updated Avenue');
    expect(result.created_at).toEqual(patient.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > patient.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    const patient = await createTestPatient();
    
    const updateInput: UpdatePatientInput = {
      id: patient.id,
      name: 'Partially Updated Name',
      phone: '555-7777'
    };

    const result = await updatePatient(updateInput);

    // Verify only specified fields are updated, others remain unchanged
    expect(result.name).toEqual('Partially Updated Name');
    expect(result.phone).toEqual('555-7777');
    expect(result.date_of_birth).toEqual(patient.date_of_birth);
    expect(result.gender).toEqual(patient.gender);
    expect(result.address).toEqual(patient.address);
    expect(result.updated_at > patient.updated_at).toBe(true);
  });

  it('should update nullable fields to null', async () => {
    const patient = await createTestPatient();
    
    const updateInput: UpdatePatientInput = {
      id: patient.id,
      phone: null,
      address: null
    };

    const result = await updatePatient(updateInput);

    // Verify nullable fields can be set to null
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.name).toEqual(patient.name); // Unchanged
    expect(result.updated_at > patient.updated_at).toBe(true);
  });

  it('should save updated data to database', async () => {
    const patient = await createTestPatient();
    
    const updateInput: UpdatePatientInput = {
      id: patient.id,
      name: 'Database Updated Name',
      gender: 'male'
    };

    await updatePatient(updateInput);

    // Verify changes are persisted in database
    const updatedPatient = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, patient.id))
      .execute();

    expect(updatedPatient).toHaveLength(1);
    expect(updatedPatient[0].name).toEqual('Database Updated Name');
    expect(updatedPatient[0].gender).toEqual('male');
    expect(new Date(updatedPatient[0].date_of_birth)).toEqual(patient.date_of_birth);
  });

  it('should throw error for non-existent patient', async () => {
    const updateInput: UpdatePatientInput = {
      id: 999999,
      name: 'Non-existent Patient'
    };

    await expect(updatePatient(updateInput)).rejects.toThrow(/patient with id 999999 not found/i);
  });

  it('should handle date updates correctly', async () => {
    const patient = await createTestPatient();
    const newBirthDate = new Date('1995-12-25');
    
    const updateInput: UpdatePatientInput = {
      id: patient.id,
      date_of_birth: newBirthDate
    };

    const result = await updatePatient(updateInput);

    expect(result.date_of_birth).toEqual(newBirthDate);
    expect(result.date_of_birth).toBeInstanceOf(Date);
  });

  it('should preserve created_at timestamp', async () => {
    const patient = await createTestPatient();
    const originalCreatedAt = patient.created_at;
    
    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdatePatientInput = {
      id: patient.id,
      name: 'Name Change'
    };

    const result = await updatePatient(updateInput);

    expect(result.created_at).toEqual(originalCreatedAt);
    expect(result.updated_at > originalCreatedAt).toBe(true);
  });

  it('should handle empty update gracefully', async () => {
    const patient = await createTestPatient();
    const originalUpdatedAt = patient.updated_at;
    
    // Wait to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdatePatientInput = {
      id: patient.id
    };

    const result = await updatePatient(updateInput);

    // Even with no field updates, updated_at should still be refreshed
    expect(result.updated_at > originalUpdatedAt).toBe(true);
    expect(result.name).toEqual(patient.name);
    expect(result.date_of_birth).toEqual(patient.date_of_birth);
    expect(result.gender).toEqual(patient.gender);
    expect(result.phone).toEqual(patient.phone);
    expect(result.address).toEqual(patient.address);
  });
});