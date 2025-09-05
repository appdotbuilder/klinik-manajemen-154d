import { db } from '../db';
import { medicalCheckupsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateMedicalCheckupInput, type MedicalCheckup } from '../schema';

export const updateMedicalCheckup = async (input: UpdateMedicalCheckupInput): Promise<MedicalCheckup> => {
  try {
    // Build update object only with provided fields (excluding id)
    const updateData: Record<string, any> = {};
    
    if (input.patient_id !== undefined) updateData['patient_id'] = input.patient_id;
    if (input.checkup_date !== undefined) updateData['checkup_date'] = input.checkup_date;
    if (input.checkup_type !== undefined) updateData['checkup_type'] = input.checkup_type;
    if (input.weight !== undefined) updateData['weight'] = input.weight !== null ? input.weight.toString() : null;
    if (input.height !== undefined) updateData['height'] = input.height !== null ? input.height.toString() : null;
    if (input.blood_pressure !== undefined) updateData['blood_pressure'] = input.blood_pressure;
    if (input.temperature !== undefined) updateData['temperature'] = input.temperature !== null ? input.temperature.toString() : null;
    if (input.heart_rate !== undefined) updateData['heart_rate'] = input.heart_rate;
    if (input.symptoms !== undefined) updateData['symptoms'] = input.symptoms;
    if (input.diagnosis !== undefined) updateData['diagnosis'] = input.diagnosis;
    if (input.treatment !== undefined) updateData['treatment'] = input.treatment;
    if (input.medication_prescribed !== undefined) updateData['medication_prescribed'] = input.medication_prescribed;
    if (input.doctor_name !== undefined) updateData['doctor_name'] = input.doctor_name;
    if (input.next_checkup_date !== undefined) updateData['next_checkup_date'] = input.next_checkup_date;
    if (input.notes !== undefined) updateData['notes'] = input.notes;

    // Always update the updated_at timestamp
    updateData['updated_at'] = new Date();

    // Update the medical checkup record
    const result = await db.update(medicalCheckupsTable)
      .set(updateData)
      .where(eq(medicalCheckupsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Medical checkup with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers and handle date fields
    const checkup = result[0];
    return {
      ...checkup,
      checkup_date: new Date(checkup.checkup_date),
      weight: checkup.weight ? parseFloat(checkup.weight) : null,
      height: checkup.height ? parseFloat(checkup.height) : null,
      temperature: checkup.temperature ? parseFloat(checkup.temperature) : null,
      next_checkup_date: checkup.next_checkup_date ? new Date(checkup.next_checkup_date) : null,
      created_at: new Date(checkup.created_at),
      updated_at: new Date(checkup.updated_at)
    };
  } catch (error) {
    console.error('Medical checkup update failed:', error);
    throw error;
  }
};