import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput, type Patient } from '../schema';

export const createPatient = async (input: CreatePatientInput): Promise<Patient> => {
  try {
    // Insert patient record - convert Date to string for date column
    const result = await db.insert(patientsTable)
      .values({
        name: input.name,
        date_of_birth: input.date_of_birth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        gender: input.gender,
        phone: input.phone,
        address: input.address
      })
      .returning()
      .execute();

    // Convert date string back to Date object for return
    return {
      ...result[0],
      date_of_birth: new Date(result[0].date_of_birth)
    };
  } catch (error) {
    console.error('Patient creation failed:', error);
    throw error;
  }
};