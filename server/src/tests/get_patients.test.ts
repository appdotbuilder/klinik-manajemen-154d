import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput } from '../schema';
import { getPatients } from '../handlers/get_patients';

// Test patient data
const testPatient1: CreatePatientInput = {
  name: 'Alice Johnson',
  date_of_birth: new Date('1990-05-15'),
  gender: 'female',
  phone: '555-0123',
  address: '123 Main St, City, State'
};

const testPatient2: CreatePatientInput = {
  name: 'Bob Smith',
  date_of_birth: new Date('1985-03-22'),
  gender: 'male',
  phone: null,
  address: null
};

const testPatient3: CreatePatientInput = {
  name: 'Carol Wilson',
  date_of_birth: new Date('1995-11-08'),
  gender: 'female',
  phone: '555-0456',
  address: '456 Oak Ave, Another City'
};

describe('getPatients', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no patients exist', async () => {
    const result = await getPatients();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return single patient', async () => {
    // Create one patient
    await db.insert(patientsTable)
      .values({
        name: testPatient1.name,
        date_of_birth: testPatient1.date_of_birth.toISOString().split('T')[0], // Convert to date string
        gender: testPatient1.gender,
        phone: testPatient1.phone,
        address: testPatient1.address
      })
      .execute();

    const result = await getPatients();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Alice Johnson');
    expect(result[0].gender).toEqual('female');
    expect(result[0].phone).toEqual('555-0123');
    expect(result[0].address).toEqual('123 Main St, City, State');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].date_of_birth).toBeInstanceOf(Date);
  });

  it('should return multiple patients', async () => {
    // Create multiple patients
    await db.insert(patientsTable)
      .values([
        {
          name: testPatient1.name,
          date_of_birth: testPatient1.date_of_birth.toISOString().split('T')[0],
          gender: testPatient1.gender,
          phone: testPatient1.phone,
          address: testPatient1.address
        },
        {
          name: testPatient2.name,
          date_of_birth: testPatient2.date_of_birth.toISOString().split('T')[0],
          gender: testPatient2.gender,
          phone: testPatient2.phone,
          address: testPatient2.address
        },
        {
          name: testPatient3.name,
          date_of_birth: testPatient3.date_of_birth.toISOString().split('T')[0],
          gender: testPatient3.gender,
          phone: testPatient3.phone,
          address: testPatient3.address
        }
      ])
      .execute();

    const result = await getPatients();

    expect(result).toHaveLength(3);
    
    // Verify all patients are returned
    const names = result.map(p => p.name).sort();
    expect(names).toEqual(['Alice Johnson', 'Bob Smith', 'Carol Wilson']);

    // Verify each patient has all required fields
    result.forEach(patient => {
      expect(patient.id).toBeDefined();
      expect(patient.name).toBeDefined();
      expect(patient.date_of_birth).toBeInstanceOf(Date);
      expect(patient.gender).toMatch(/^(male|female)$/);
      expect(patient.created_at).toBeInstanceOf(Date);
      expect(patient.updated_at).toBeInstanceOf(Date);
      // phone and address can be null, so just check they exist
      expect(patient).toHaveProperty('phone');
      expect(patient).toHaveProperty('address');
    });
  });

  it('should handle patients with null optional fields', async () => {
    // Create patient with null phone and address
    await db.insert(patientsTable)
      .values({
        name: testPatient2.name,
        date_of_birth: testPatient2.date_of_birth.toISOString().split('T')[0],
        gender: testPatient2.gender,
        phone: testPatient2.phone, // null
        address: testPatient2.address // null
      })
      .execute();

    const result = await getPatients();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Bob Smith');
    expect(result[0].phone).toBeNull();
    expect(result[0].address).toBeNull();
    expect(result[0].gender).toEqual('male');
    expect(result[0].date_of_birth).toBeInstanceOf(Date);
  });

  it('should return patients ordered by id (natural database order)', async () => {
    // Create patients in specific order
    const patient1Result = await db.insert(patientsTable)
      .values({
        name: 'First Patient',
        date_of_birth: '1990-01-01',
        gender: 'female',
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const patient2Result = await db.insert(patientsTable)
      .values({
        name: 'Second Patient',
        date_of_birth: '1991-01-01',
        gender: 'male',
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const result = await getPatients();

    expect(result).toHaveLength(2);
    // Should be returned in the natural order (by id)
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[0].name).toEqual('First Patient');
    expect(result[1].name).toEqual('Second Patient');
  });

  it('should handle date conversion correctly', async () => {
    const birthDate = new Date('1992-12-25');
    
    await db.insert(patientsTable)
      .values({
        name: 'Test Patient',
        date_of_birth: birthDate.toISOString().split('T')[0], // '1992-12-25'
        gender: 'female',
        phone: null,
        address: null
      })
      .execute();

    const result = await getPatients();

    expect(result).toHaveLength(1);
    expect(result[0].date_of_birth).toBeInstanceOf(Date);
    
    // Check the date values match (ignoring time)
    const resultDate = result[0].date_of_birth;
    expect(resultDate.getFullYear()).toEqual(1992);
    expect(resultDate.getMonth()).toEqual(11); // December is month 11 (0-indexed)
    expect(resultDate.getDate()).toEqual(25);
  });
});