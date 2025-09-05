import { db } from '../db';
import { deliveryServicesTable } from '../db/schema';
import { type DeliveryService } from '../schema';

export const getDeliveryServices = async (): Promise<DeliveryService[]> => {
  try {
    const results = await db.select()
      .from(deliveryServicesTable)
      .execute();

    // Convert numeric and date fields for proper typing
    return results.map(deliveryService => ({
      ...deliveryService,
      baby_weight: parseFloat(deliveryService.baby_weight),
      delivery_date: new Date(deliveryService.delivery_date)
    }));
  } catch (error) {
    console.error('Failed to fetch delivery services:', error);
    throw error;
  }
};