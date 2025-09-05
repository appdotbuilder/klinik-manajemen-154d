import { db } from '../db';
import { deliveryServicesTable } from '../db/schema';
import { type CreateDeliveryServiceInput, type DeliveryService } from '../schema';

export const createDeliveryService = async (input: CreateDeliveryServiceInput): Promise<DeliveryService> => {
  try {
    // Insert delivery service record
    const result = await db.insert(deliveryServicesTable)
      .values({
        patient_id: input.patient_id,
        delivery_date: input.delivery_date.toISOString().split('T')[0], // Convert Date to string for date column
        delivery_type: input.delivery_type,
        baby_weight: input.baby_weight.toString(), // Convert number to string for numeric column
        baby_gender: input.baby_gender,
        baby_name: input.baby_name,
        complications: input.complications,
        doctor_name: input.doctor_name,
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert fields back to proper types before returning
    const deliveryService = result[0];
    return {
      ...deliveryService,
      delivery_date: new Date(deliveryService.delivery_date), // Convert string back to Date
      baby_weight: parseFloat(deliveryService.baby_weight) // Convert string back to number
    };
  } catch (error) {
    console.error('Delivery service creation failed:', error);
    throw error;
  }
};