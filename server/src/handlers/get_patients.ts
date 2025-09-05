import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type Patient } from '../schema';

export const getPatients = async (): Promise<Patient[]> => {
  try {
    // Fetch all patients from the database
    const results = await db.select()
      .from(patientsTable)
      .execute();

    // Convert date strings to Date objects to match schema expectations
    return results.map(patient => ({
      ...patient,
      date_of_birth: new Date(patient.date_of_birth)
    }));
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    throw error;
  }
};