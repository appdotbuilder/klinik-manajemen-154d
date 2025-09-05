import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable, deliveryServicesTable } from '../db/schema';
import { getDeliveryServices } from '../handlers/get_delivery_services';

describe('getDeliveryServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no delivery services exist', async () => {
    const result = await getDeliveryServices();

    expect(result).toEqual([]);
  });

  it('should return all delivery services', async () => {
    // Create a test patient first (required for foreign key)
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Jane Doe',
        date_of_birth: '1990-01-15',
        gender: 'female',
        phone: '+1234567890',
        address: '123 Main St'
      })
      .returning()
      .execute();

    const patientId = patientResult[0].id;

    // Create test delivery services
    await db.insert(deliveryServicesTable)
      .values([
        {
          patient_id: patientId,
          delivery_date: '2023-12-01',
          delivery_type: 'normal',
          baby_weight: '3.45', // Store as string (numeric column)
          baby_gender: 'female',
          baby_name: 'Baby Girl Doe',
          complications: null,
          doctor_name: 'Dr. Smith',
          notes: 'Smooth delivery'
        },
        {
          patient_id: patientId,
          delivery_date: '2023-11-15',
          delivery_type: 'caesarean',
          baby_weight: '2.89', // Store as string (numeric column)
          baby_gender: 'male',
          baby_name: 'Baby Boy Doe',
          complications: 'Emergency C-section',
          doctor_name: 'Dr. Johnson',
          notes: 'Complications handled well'
        }
      ])
      .execute();

    const result = await getDeliveryServices();

    expect(result).toHaveLength(2);

    // Verify first delivery service
    const firstService = result.find(service => service.baby_gender === 'female');
    expect(firstService).toBeDefined();
    expect(firstService!.patient_id).toEqual(patientId);
    expect(firstService!.delivery_date).toBeInstanceOf(Date);
    expect(firstService!.delivery_type).toEqual('normal');
    expect(firstService!.baby_weight).toEqual(3.45); // Should be converted to number
    expect(typeof firstService!.baby_weight).toEqual('number');
    expect(firstService!.baby_gender).toEqual('female');
    expect(firstService!.baby_name).toEqual('Baby Girl Doe');
    expect(firstService!.complications).toBeNull();
    expect(firstService!.doctor_name).toEqual('Dr. Smith');
    expect(firstService!.notes).toEqual('Smooth delivery');
    expect(firstService!.id).toBeDefined();
    expect(firstService!.created_at).toBeInstanceOf(Date);
    expect(firstService!.updated_at).toBeInstanceOf(Date);

    // Verify second delivery service
    const secondService = result.find(service => service.baby_gender === 'male');
    expect(secondService).toBeDefined();
    expect(secondService!.patient_id).toEqual(patientId);
    expect(secondService!.delivery_date).toBeInstanceOf(Date);
    expect(secondService!.delivery_type).toEqual('caesarean');
    expect(secondService!.baby_weight).toEqual(2.89); // Should be converted to number
    expect(typeof secondService!.baby_weight).toEqual('number');
    expect(secondService!.baby_gender).toEqual('male');
    expect(secondService!.baby_name).toEqual('Baby Boy Doe');
    expect(secondService!.complications).toEqual('Emergency C-section');
    expect(secondService!.doctor_name).toEqual('Dr. Johnson');
    expect(secondService!.notes).toEqual('Complications handled well');
    expect(secondService!.id).toBeDefined();
    expect(secondService!.created_at).toBeInstanceOf(Date);
    expect(secondService!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle delivery services with different delivery types', async () => {
    // Create a test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Mary Johnson',
        date_of_birth: '1985-05-20',
        gender: 'female',
        phone: '+1987654321',
        address: '456 Oak Ave'
      })
      .returning()
      .execute();

    const patientId = patientResult[0].id;

    // Create delivery services with all delivery types
    await db.insert(deliveryServicesTable)
      .values([
        {
          patient_id: patientId,
          delivery_date: '2023-10-01',
          delivery_type: 'normal',
          baby_weight: '3.20',
          baby_gender: 'male',
          baby_name: null, // Test nullable field
          complications: null,
          doctor_name: 'Dr. Wilson',
          notes: null // Test nullable field
        },
        {
          patient_id: patientId,
          delivery_date: '2023-09-15',
          delivery_type: 'assisted',
          baby_weight: '4.10',
          baby_gender: 'female',
          baby_name: 'Emma Johnson',
          complications: 'Required forceps assistance',
          doctor_name: 'Dr. Brown',
          notes: 'Assisted delivery successful'
        }
      ])
      .execute();

    const result = await getDeliveryServices();

    expect(result).toHaveLength(2);

    // Verify all delivery types are handled
    const deliveryTypes = result.map(service => service.delivery_type);
    expect(deliveryTypes).toContain('normal');
    expect(deliveryTypes).toContain('assisted');

    // Verify numeric conversion for all records
    result.forEach(service => {
      expect(typeof service.baby_weight).toEqual('number');
      expect(service.baby_weight).toBeGreaterThan(0);
    });
  });

  it('should handle delivery services with minimal data', async () => {
    // Create a test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        name: 'Lisa Davis',
        date_of_birth: '1992-03-10',
        gender: 'female',
        phone: null, // Nullable field
        address: null // Nullable field
      })
      .returning()
      .execute();

    const patientId = patientResult[0].id;

    // Create delivery service with minimal required data
    await db.insert(deliveryServicesTable)
      .values({
        patient_id: patientId,
        delivery_date: '2023-08-20',
        delivery_type: 'caesarean',
        baby_weight: '2.75',
        baby_gender: 'male',
        baby_name: null, // Nullable
        complications: null, // Nullable
        doctor_name: 'Dr. Garcia',
        notes: null // Nullable
      })
      .execute();

    const result = await getDeliveryServices();

    expect(result).toHaveLength(1);

    const service = result[0];
    expect(service.patient_id).toEqual(patientId);
    expect(service.delivery_type).toEqual('caesarean');
    expect(service.baby_weight).toEqual(2.75);
    expect(typeof service.baby_weight).toEqual('number');
    expect(service.baby_gender).toEqual('male');
    expect(service.baby_name).toBeNull();
    expect(service.complications).toBeNull();
    expect(service.doctor_name).toEqual('Dr. Garcia');
    expect(service.notes).toBeNull();
  });
});