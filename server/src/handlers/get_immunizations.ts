import { db } from '../db';
import { immunizationsTable } from '../db/schema';
import { type Immunization } from '../schema';

export const getImmunizations = async (): Promise<Immunization[]> => {
  try {
    const results = await db.select()
      .from(immunizationsTable)
      .execute();

    // Convert date fields to Date objects before returning
    return results.map(immunization => ({
      ...immunization,
      vaccination_date: new Date(immunization.vaccination_date),
      next_vaccination_date: immunization.next_vaccination_date 
        ? new Date(immunization.next_vaccination_date) 
        : null
    }));
  } catch (error) {
    console.error('Failed to fetch immunizations:', error);
    throw error;
  }
};