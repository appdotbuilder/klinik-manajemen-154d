import { db } from '../db';
import { medicalCheckupsTable } from '../db/schema';
import { type CreateMedicalCheckupInput, type MedicalCheckup } from '../schema';

export const createMedicalCheckup = async (input: CreateMedicalCheckupInput): Promise<MedicalCheckup> => {
  try {
    // Insert medical checkup record
    const result = await db.insert(medicalCheckupsTable)
      .values({
        patient_id: input.patient_id,
        checkup_date: input.checkup_date.toISOString().split('T')[0], // Convert Date to string for date column
        checkup_type: input.checkup_type,
        weight: input.weight ? input.weight.toString() : null, // Convert number to string for numeric column
        height: input.height ? input.height.toString() : null, // Convert number to string for numeric column
        blood_pressure: input.blood_pressure,
        temperature: input.temperature ? input.temperature.toString() : null, // Convert number to string for numeric column
        heart_rate: input.heart_rate, // Integer column - no conversion needed
        symptoms: input.symptoms,
        diagnosis: input.diagnosis,
        treatment: input.treatment,
        medication_prescribed: input.medication_prescribed,
        doctor_name: input.doctor_name,
        next_checkup_date: input.next_checkup_date ? input.next_checkup_date.toISOString().split('T')[0] : null, // Convert Date to string for date column
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert numeric and date fields back to proper types before returning
    const checkup = result[0];
    return {
      ...checkup,
      checkup_date: new Date(checkup.checkup_date), // Convert string back to Date
      next_checkup_date: checkup.next_checkup_date ? new Date(checkup.next_checkup_date) : null, // Convert string back to Date
      weight: checkup.weight ? parseFloat(checkup.weight) : null, // Convert string back to number
      height: checkup.height ? parseFloat(checkup.height) : null, // Convert string back to number
      temperature: checkup.temperature ? parseFloat(checkup.temperature) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Medical checkup creation failed:', error);
    throw error;
  }
};