import { db } from '../db';
import { medicalCheckupsTable } from '../db/schema';
import { type MedicalCheckup } from '../schema';

export const getMedicalCheckups = async (): Promise<MedicalCheckup[]> => {
  try {
    // Fetch all medical checkup records from the database
    const results = await db.select()
      .from(medicalCheckupsTable)
      .execute();

    // Convert numeric fields back to numbers and date fields to Date objects
    return results.map(checkup => ({
      ...checkup,
      checkup_date: new Date(checkup.checkup_date),
      next_checkup_date: checkup.next_checkup_date ? new Date(checkup.next_checkup_date) : null,
      weight: checkup.weight ? parseFloat(checkup.weight) : null,
      height: checkup.height ? parseFloat(checkup.height) : null,
      temperature: checkup.temperature ? parseFloat(checkup.temperature) : null
    }));
  } catch (error) {
    console.error('Fetching medical checkups failed:', error);
    throw error;
  }
};