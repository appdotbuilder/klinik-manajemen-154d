import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type GetPatientByIdInput, type Patient } from '../schema';
import { eq } from 'drizzle-orm';

export const getPatientById = async (input: GetPatientByIdInput): Promise<Patient | null> => {
  try {
    // Query patient by ID
    const result = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, input.id))
      .execute();

    // Return null if patient not found
    if (result.length === 0) {
      return null;
    }

    // Convert date strings to Date objects and return the patient record
    const patient = result[0];
    return {
      ...patient,
      date_of_birth: new Date(patient.date_of_birth),
      created_at: new Date(patient.created_at),
      updated_at: new Date(patient.updated_at)
    };
  } catch (error) {
    console.error('Failed to fetch patient by ID:', error);
    throw error;
  }
};