import { db } from '../db';
import { medicalCheckupsTable } from '../db/schema';
import { type GetServicesByPatientIdInput, type MedicalCheckup } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getMedicalCheckupsByPatient = async (input: GetServicesByPatientIdInput): Promise<MedicalCheckup[]> => {
  try {
    // Query medical checkups for the specified patient, ordered by checkup date (most recent first)
    const results = await db.select()
      .from(medicalCheckupsTable)
      .where(eq(medicalCheckupsTable.patient_id, input.patientId))
      .orderBy(desc(medicalCheckupsTable.checkup_date))
      .execute();

    // Convert numeric fields from strings to numbers and date fields to Date objects
    return results.map(checkup => ({
      ...checkup,
      checkup_date: new Date(checkup.checkup_date),
      next_checkup_date: checkup.next_checkup_date ? new Date(checkup.next_checkup_date) : null,
      weight: checkup.weight ? parseFloat(checkup.weight) : null,
      height: checkup.height ? parseFloat(checkup.height) : null,
      temperature: checkup.temperature ? parseFloat(checkup.temperature) : null
    }));
  } catch (error) {
    console.error('Failed to fetch medical checkups for patient:', error);
    throw error;
  }
};