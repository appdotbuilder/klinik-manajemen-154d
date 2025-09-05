import { db } from '../db';
import { immunizationsTable } from '../db/schema';
import { type GetServicesByPatientIdInput, type Immunization } from '../schema';
import { eq } from 'drizzle-orm';

export const getImmunizationsByPatient = async (input: GetServicesByPatientIdInput): Promise<Immunization[]> => {
  try {
    // Query immunizations for the specified patient
    const results = await db.select()
      .from(immunizationsTable)
      .where(eq(immunizationsTable.patient_id, input.patientId))
      .execute();

    // Convert date fields from strings to Date objects before returning
    return results.map(immunization => ({
      ...immunization,
      vaccination_date: new Date(immunization.vaccination_date),
      next_vaccination_date: immunization.next_vaccination_date ? new Date(immunization.next_vaccination_date) : null,
      created_at: new Date(immunization.created_at),
      updated_at: new Date(immunization.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch immunizations for patient:', error);
    throw error;
  }
};