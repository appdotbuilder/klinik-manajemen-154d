import { db } from '../db';
import { immunizationsTable, patientsTable } from '../db/schema';
import { type CreateImmunizationInput, type Immunization } from '../schema';
import { eq } from 'drizzle-orm';

export const createImmunization = async (input: CreateImmunizationInput): Promise<Immunization> => {
  try {
    // Verify patient exists
    const patient = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, input.patient_id))
      .execute();

    if (patient.length === 0) {
      throw new Error(`Patient with id ${input.patient_id} not found`);
    }

    // Insert immunization record
    const result = await db.insert(immunizationsTable)
      .values({
        patient_id: input.patient_id,
        vaccine_name: input.vaccine_name,
        vaccine_type: input.vaccine_type,
        vaccination_date: input.vaccination_date.toISOString().split('T')[0],
        next_vaccination_date: input.next_vaccination_date ? input.next_vaccination_date.toISOString().split('T')[0] : null,
        batch_number: input.batch_number,
        administered_by: input.administered_by,
        side_effects: input.side_effects,
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert date strings back to Date objects for return
    const immunization = result[0];
    return {
      ...immunization,
      vaccination_date: new Date(immunization.vaccination_date),
      next_vaccination_date: immunization.next_vaccination_date ? new Date(immunization.next_vaccination_date) : null
    };
  } catch (error) {
    console.error('Immunization creation failed:', error);
    throw error;
  }
};