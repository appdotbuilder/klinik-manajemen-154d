import { db } from '../db';
import { deliveryServicesTable } from '../db/schema';
import { type GetServicesByPatientIdInput, type DeliveryService } from '../schema';
import { eq } from 'drizzle-orm';

export const getDeliveryServicesByPatient = async (input: GetServicesByPatientIdInput): Promise<DeliveryService[]> => {
  try {
    // Query delivery services for the specific patient
    const results = await db.select()
      .from(deliveryServicesTable)
      .where(eq(deliveryServicesTable.patient_id, input.patientId))
      .execute();

    // Convert numeric and date fields to proper types before returning
    return results.map(result => ({
      ...result,
      baby_weight: parseFloat(result.baby_weight), // Convert numeric field from string to number
      delivery_date: new Date(result.delivery_date), // Convert date string to Date object
      created_at: new Date(result.created_at),
      updated_at: new Date(result.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch delivery services:', error);
    throw error;
  }
};