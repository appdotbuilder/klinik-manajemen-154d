import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable, deliveryServicesTable } from '../db/schema';
import { type GetServicesByPatientIdInput, type CreatePatientInput } from '../schema';
import { getDeliveryServicesByPatient } from '../handlers/get_delivery_services_by_patient';

// Test patient data
const testPatient1: CreatePatientInput = {
  name: 'Jane Doe',
  date_of_birth: new Date('1990-05-15'),
  gender: 'female',
  phone: '+1234567890',
  address: '123 Main St'
};

const testPatient2: CreatePatientInput = {
  name: 'Mary Smith',
  date_of_birth: new Date('1985-08-20'),
  gender: 'female',
  phone: '+0987654321',
  address: '456 Oak Ave'
};

describe('getDeliveryServicesByPatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return delivery services for a specific patient', async () => {
    // Create test patients first
    const patient1Result = await db.insert(patientsTable)
      .values({
        name: testPatient1.name,
        date_of_birth: testPatient1.date_of_birth.toISOString().split('T')[0], // Convert Date to date string
        gender: testPatient1.gender,
        phone: testPatient1.phone,
        address: testPatient1.address
      })
      .returning()
      .execute();

    const patient1Id = patient1Result[0].id;

    // Create delivery services for patient 1
    await db.insert(deliveryServicesTable)
      .values([
        {
          patient_id: patient1Id,
          delivery_date: '2023-01-15', // Use date string format
          delivery_type: 'normal',
          baby_weight: '3.5',
          baby_gender: 'female',
          baby_name: 'Alice',
          complications: null,
          doctor_name: 'Dr. Johnson',
          notes: 'Normal delivery, healthy baby'
        },
        {
          patient_id: patient1Id,
          delivery_date: '2024-06-20', // Use date string format
          delivery_type: 'caesarean',
          baby_weight: '4.2',
          baby_gender: 'male',
          baby_name: 'Bob',
          complications: 'Breech presentation',
          doctor_name: 'Dr. Wilson',
          notes: 'Planned C-section'
        }
      ])
      .execute();

    const input: GetServicesByPatientIdInput = { patientId: patient1Id };
    const results = await getDeliveryServicesByPatient(input);

    expect(results).toHaveLength(2);

    // Verify first delivery service
    const firstDelivery = results.find(d => d.baby_name === 'Alice');
    expect(firstDelivery).toBeDefined();
    expect(firstDelivery!.patient_id).toEqual(patient1Id);
    expect(firstDelivery!.delivery_type).toEqual('normal');
    expect(firstDelivery!.baby_weight).toEqual(3.5);
    expect(typeof firstDelivery!.baby_weight).toEqual('number');
    expect(firstDelivery!.baby_gender).toEqual('female');
    expect(firstDelivery!.doctor_name).toEqual('Dr. Johnson');
    expect(firstDelivery!.complications).toBeNull();
    expect(firstDelivery!.delivery_date).toBeInstanceOf(Date);

    // Verify second delivery service
    const secondDelivery = results.find(d => d.baby_name === 'Bob');
    expect(secondDelivery).toBeDefined();
    expect(secondDelivery!.patient_id).toEqual(patient1Id);
    expect(secondDelivery!.delivery_type).toEqual('caesarean');
    expect(secondDelivery!.baby_weight).toEqual(4.2);
    expect(typeof secondDelivery!.baby_weight).toEqual('number');
    expect(secondDelivery!.baby_gender).toEqual('male');
    expect(secondDelivery!.doctor_name).toEqual('Dr. Wilson');
    expect(secondDelivery!.complications).toEqual('Breech presentation');
    expect(secondDelivery!.delivery_date).toBeInstanceOf(Date);
  });

  it('should return empty array for patient with no delivery services', async () => {
    // Create a patient without delivery services
    const patientResult = await db.insert(patientsTable)
      .values({
        name: testPatient1.name,
        date_of_birth: testPatient1.date_of_birth.toISOString().split('T')[0], // Convert Date to date string
        gender: testPatient1.gender,
        phone: testPatient1.phone,
        address: testPatient1.address
      })
      .returning()
      .execute();

    const input: GetServicesByPatientIdInput = { patientId: patientResult[0].id };
    const results = await getDeliveryServicesByPatient(input);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should only return delivery services for the specified patient', async () => {
    // Create two patients
    const patient1Result = await db.insert(patientsTable)
      .values({
        name: testPatient1.name,
        date_of_birth: testPatient1.date_of_birth.toISOString().split('T')[0], // Convert Date to date string
        gender: testPatient1.gender,
        phone: testPatient1.phone,
        address: testPatient1.address
      })
      .returning()
      .execute();

    const patient2Result = await db.insert(patientsTable)
      .values({
        name: testPatient2.name,
        date_of_birth: testPatient2.date_of_birth.toISOString().split('T')[0], // Convert Date to date string
        gender: testPatient2.gender,
        phone: testPatient2.phone,
        address: testPatient2.address
      })
      .returning()
      .execute();

    const patient1Id = patient1Result[0].id;
    const patient2Id = patient2Result[0].id;

    // Create delivery services for both patients
    await db.insert(deliveryServicesTable)
      .values([
        {
          patient_id: patient1Id,
          delivery_date: '2023-01-15', // Use date string format
          delivery_type: 'normal',
          baby_weight: '3.5',
          baby_gender: 'female',
          baby_name: 'Alice',
          complications: null,
          doctor_name: 'Dr. Johnson',
          notes: null
        },
        {
          patient_id: patient2Id,
          delivery_date: '2023-02-10', // Use date string format
          delivery_type: 'assisted',
          baby_weight: '3.8',
          baby_gender: 'male',
          baby_name: 'Charlie',
          complications: null,
          doctor_name: 'Dr. Brown',
          notes: null
        },
        {
          patient_id: patient1Id,
          delivery_date: '2024-06-20', // Use date string format
          delivery_type: 'caesarean',
          baby_weight: '4.2',
          baby_gender: 'male',
          baby_name: 'Bob',
          complications: 'Breech presentation',
          doctor_name: 'Dr. Wilson',
          notes: null
        }
      ])
      .execute();

    // Query for patient 1's delivery services only
    const input: GetServicesByPatientIdInput = { patientId: patient1Id };
    const results = await getDeliveryServicesByPatient(input);

    expect(results).toHaveLength(2);

    // Verify all results belong to patient 1
    results.forEach(delivery => {
      expect(delivery.patient_id).toEqual(patient1Id);
    });

    // Verify specific records
    const babyNames = results.map(d => d.baby_name).sort();
    expect(babyNames).toEqual(['Alice', 'Bob']);
  });

  it('should return empty array for non-existent patient ID', async () => {
    const input: GetServicesByPatientIdInput = { patientId: 99999 };
    const results = await getDeliveryServicesByPatient(input);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle all delivery types correctly', async () => {
    // Create a patient
    const patientResult = await db.insert(patientsTable)
      .values({
        name: testPatient1.name,
        date_of_birth: testPatient1.date_of_birth.toISOString().split('T')[0], // Convert Date to date string
        gender: testPatient1.gender,
        phone: testPatient1.phone,
        address: testPatient1.address
      })
      .returning()
      .execute();

    const patientId = patientResult[0].id;

    // Create delivery services with all delivery types
    await db.insert(deliveryServicesTable)
      .values([
        {
          patient_id: patientId,
          delivery_date: '2023-01-15', // Use date string format
          delivery_type: 'normal',
          baby_weight: '3.5',
          baby_gender: 'female',
          baby_name: 'Normal Baby',
          complications: null,
          doctor_name: 'Dr. A',
          notes: null
        },
        {
          patient_id: patientId,
          delivery_date: '2023-02-15', // Use date string format
          delivery_type: 'caesarean',
          baby_weight: '4.0',
          baby_gender: 'male',
          baby_name: 'Caesarean Baby',
          complications: null,
          doctor_name: 'Dr. B',
          notes: null
        },
        {
          patient_id: patientId,
          delivery_date: '2023-03-15', // Use date string format
          delivery_type: 'assisted',
          baby_weight: '3.8',
          baby_gender: 'female',
          baby_name: 'Assisted Baby',
          complications: null,
          doctor_name: 'Dr. C',
          notes: null
        }
      ])
      .execute();

    const input: GetServicesByPatientIdInput = { patientId };
    const results = await getDeliveryServicesByPatient(input);

    expect(results).toHaveLength(3);

    const deliveryTypes = results.map(d => d.delivery_type).sort();
    expect(deliveryTypes).toEqual(['assisted', 'caesarean', 'normal']);

    // Verify numeric conversion for all records
    results.forEach(delivery => {
      expect(typeof delivery.baby_weight).toEqual('number');
      expect(delivery.baby_weight).toBeGreaterThan(0);
    });
  });
});