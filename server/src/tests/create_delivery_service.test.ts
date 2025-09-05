import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { deliveryServicesTable, patientsTable } from '../db/schema';
import { type CreateDeliveryServiceInput } from '../schema';
import { createDeliveryService } from '../handlers/create_delivery_service';
import { eq } from 'drizzle-orm';

describe('createDeliveryService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testPatientId: number;

  beforeEach(async () => {
    // Create a test patient first since delivery service requires patient_id foreign key
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Test Mother',
        date_of_birth: '1990-01-01', // Use string format for date column
        gender: 'female',
        phone: '+1234567890',
        address: '123 Test St'
      })
      .returning()
      .execute();
    
    testPatientId = patientResult[0].id;
  });

  // Simple test input
  const createTestInput = (patientId: number): CreateDeliveryServiceInput => ({
    patient_id: patientId,
    delivery_date: new Date('2024-01-15'),
    delivery_type: 'normal',
    baby_weight: 3.5,
    baby_gender: 'female',
    baby_name: 'Baby Jane',
    complications: null,
    doctor_name: 'Dr. Smith',
    notes: 'Healthy delivery'
  });

  it('should create a delivery service', async () => {
    const testInput = createTestInput(testPatientId);
    const result = await createDeliveryService(testInput);

    // Basic field validation
    expect(result.patient_id).toEqual(testPatientId);
    expect(result.delivery_date).toEqual(testInput.delivery_date);
    expect(result.delivery_type).toEqual('normal');
    expect(result.baby_weight).toEqual(3.5);
    expect(typeof result.baby_weight).toBe('number');
    expect(result.baby_gender).toEqual('female');
    expect(result.baby_name).toEqual('Baby Jane');
    expect(result.complications).toBeNull();
    expect(result.doctor_name).toEqual('Dr. Smith');
    expect(result.notes).toEqual('Healthy delivery');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save delivery service to database', async () => {
    const testInput = createTestInput(testPatientId);
    const result = await createDeliveryService(testInput);

    // Query using proper drizzle syntax
    const deliveryServices = await db.select()
      .from(deliveryServicesTable)
      .where(eq(deliveryServicesTable.id, result.id))
      .execute();

    expect(deliveryServices).toHaveLength(1);
    const saved = deliveryServices[0];
    expect(saved.patient_id).toEqual(testPatientId);
    expect(new Date(saved.delivery_date)).toEqual(testInput.delivery_date);
    expect(saved.delivery_type).toEqual('normal');
    expect(parseFloat(saved.baby_weight)).toEqual(3.5); // Numeric conversion from stored string
    expect(saved.baby_gender).toEqual('female');
    expect(saved.baby_name).toEqual('Baby Jane');
    expect(saved.doctor_name).toEqual('Dr. Smith');
    expect(saved.notes).toEqual('Healthy delivery');
    expect(saved.created_at).toBeInstanceOf(Date);
    expect(saved.updated_at).toBeInstanceOf(Date);
  });

  it('should handle caesarean delivery type', async () => {
    const testInput: CreateDeliveryServiceInput = {
      ...createTestInput(testPatientId),
      delivery_type: 'caesarean',
      complications: 'Emergency caesarean section',
      notes: 'Mother and baby healthy post-surgery'
    };

    const result = await createDeliveryService(testInput);

    expect(result.delivery_type).toEqual('caesarean');
    expect(result.complications).toEqual('Emergency caesarean section');
    expect(result.notes).toEqual('Mother and baby healthy post-surgery');
  });

  it('should handle assisted delivery type', async () => {
    const testInput: CreateDeliveryServiceInput = {
      ...createTestInput(testPatientId),
      delivery_type: 'assisted',
      baby_gender: 'male',
      baby_name: 'Baby John'
    };

    const result = await createDeliveryService(testInput);

    expect(result.delivery_type).toEqual('assisted');
    expect(result.baby_gender).toEqual('male');
    expect(result.baby_name).toEqual('Baby John');
  });

  it('should handle null optional fields', async () => {
    const testInput: CreateDeliveryServiceInput = {
      patient_id: testPatientId,
      delivery_date: new Date('2024-01-20'),
      delivery_type: 'normal',
      baby_weight: 2.8,
      baby_gender: 'male',
      baby_name: null,
      complications: null,
      doctor_name: 'Dr. Johnson',
      notes: null
    };

    const result = await createDeliveryService(testInput);

    expect(result.baby_name).toBeNull();
    expect(result.complications).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.baby_weight).toEqual(2.8);
    expect(typeof result.baby_weight).toBe('number');
  });

  it('should handle different baby weights correctly', async () => {
    const testInput: CreateDeliveryServiceInput = {
      ...createTestInput(testPatientId),
      baby_weight: 4.25 // Test decimal precision
    };

    const result = await createDeliveryService(testInput);

    expect(result.baby_weight).toEqual(4.25);
    expect(typeof result.baby_weight).toBe('number');

    // Verify database storage and retrieval
    const saved = await db.select()
      .from(deliveryServicesTable)
      .where(eq(deliveryServicesTable.id, result.id))
      .execute();

    expect(parseFloat(saved[0].baby_weight)).toEqual(4.25);
  });

  it('should reject invalid foreign key constraint', async () => {
    const testInput: CreateDeliveryServiceInput = {
      patient_id: 99999, // Non-existent patient ID
      delivery_date: new Date('2024-01-15'),
      delivery_type: 'normal',
      baby_weight: 3.5,
      baby_gender: 'female',
      baby_name: 'Test Baby',
      complications: null,
      doctor_name: 'Dr. Test',
      notes: null
    };

    await expect(createDeliveryService(testInput)).rejects.toThrow();
  });
});