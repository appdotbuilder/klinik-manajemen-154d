import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createPatientInputSchema,
  updatePatientInputSchema,
  getPatientByIdSchema,
  createDeliveryServiceInputSchema,
  getServicesByPatientIdSchema,
  createImmunizationInputSchema,
  createMedicalCheckupInputSchema,
  updateMedicalCheckupInputSchema
} from './schema';

// Import handlers
import { createPatient } from './handlers/create_patient';
import { getPatients } from './handlers/get_patients';
import { getPatientById } from './handlers/get_patient_by_id';
import { updatePatient } from './handlers/update_patient';
import { createDeliveryService } from './handlers/create_delivery_service';
import { getDeliveryServices } from './handlers/get_delivery_services';
import { getDeliveryServicesByPatient } from './handlers/get_delivery_services_by_patient';
import { createImmunization } from './handlers/create_immunization';
import { getImmunizations } from './handlers/get_immunizations';
import { getImmunizationsByPatient } from './handlers/get_immunizations_by_patient';
import { createMedicalCheckup } from './handlers/create_medical_checkup';
import { getMedicalCheckups } from './handlers/get_medical_checkups';
import { getMedicalCheckupsByPatient } from './handlers/get_medical_checkups_by_patient';
import { updateMedicalCheckup } from './handlers/update_medical_checkup';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Patient routes
  createPatient: publicProcedure
    .input(createPatientInputSchema)
    .mutation(({ input }) => createPatient(input)),
  
  getPatients: publicProcedure
    .query(() => getPatients()),
  
  getPatientById: publicProcedure
    .input(getPatientByIdSchema)
    .query(({ input }) => getPatientById(input)),
  
  updatePatient: publicProcedure
    .input(updatePatientInputSchema)
    .mutation(({ input }) => updatePatient(input)),

  // Delivery service routes
  createDeliveryService: publicProcedure
    .input(createDeliveryServiceInputSchema)
    .mutation(({ input }) => createDeliveryService(input)),
  
  getDeliveryServices: publicProcedure
    .query(() => getDeliveryServices()),
  
  getDeliveryServicesByPatient: publicProcedure
    .input(getServicesByPatientIdSchema)
    .query(({ input }) => getDeliveryServicesByPatient(input)),

  // Immunization routes
  createImmunization: publicProcedure
    .input(createImmunizationInputSchema)
    .mutation(({ input }) => createImmunization(input)),
  
  getImmunizations: publicProcedure
    .query(() => getImmunizations()),
  
  getImmunizationsByPatient: publicProcedure
    .input(getServicesByPatientIdSchema)
    .query(({ input }) => getImmunizationsByPatient(input)),

  // Medical checkup routes
  createMedicalCheckup: publicProcedure
    .input(createMedicalCheckupInputSchema)
    .mutation(({ input }) => createMedicalCheckup(input)),
  
  getMedicalCheckups: publicProcedure
    .query(() => getMedicalCheckups()),
  
  getMedicalCheckupsByPatient: publicProcedure
    .input(getServicesByPatientIdSchema)
    .query(({ input }) => getMedicalCheckupsByPatient(input)),
  
  updateMedicalCheckup: publicProcedure
    .input(updateMedicalCheckupInputSchema)
    .mutation(({ input }) => updateMedicalCheckup(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();