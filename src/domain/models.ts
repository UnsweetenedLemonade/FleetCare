import { z } from "zod";

export const roles = ["Fleet manažer", "Řidič", "Vedení"] as const;
export type Actor = { role: (typeof roles)[number]; driverId: string | null };
const nullableNumber = z
  .number()
  .finite()
  .nonnegative()
  .nullable()
  .default(null);
const nullableText = z.string().nullable().default(null);
const nullableDate = z.iso.date().nullable().default(null);
const timestamp = z.iso.datetime({ offset: true });
const nullableTimestamp = timestamp.nullable().default(null);
const nullableMinor = z.number().int().nonnegative().nullable().default(null);
const base = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  createdAt: timestamp,
  updatedAt: timestamp,
  source: z.enum(["manual", "import", "document"]).default("manual"),
});
export const vehicleSchema = base.extend({
  spz: z.string().trim().min(1, "Vyplňte SPZ"),
  vin: z.string().default(""),
  model: z.string().trim().min(1, "Vyplňte značku / model"),
  year: nullableNumber,
  category: z.enum(["Kamion", "Nákladní vozidlo", "Dodávka", "Osobní auto"]),
  purpose: z.string().default(""),
  reserve: z.boolean().default(false),
  state: z.enum(["V provozu", "V servisu", "Odstaveno"]).default("V provozu"),
  fuel: z.string().default(""),
  engine: z.string().default(""),
  licence: z.string().default(""),
  capacityKg: nullableNumber,
  volumeM3: nullableNumber,
  pallets: nullableNumber,
  dimensions: z.string().default(""),
  equipment: z.array(z.string()).default([]),
  configuration: z.string().default(""),
  stkUntil: nullableDate,
  serviceId: nullableText,
});
const entitlement = z.object({ name: z.string(), validUntil: nullableDate });
export const driverSchema = base.extend({
  name: z.string().trim().min(1, "Vyplňte jméno"),
  phone: z.string().default(""),
  email: z.union([z.literal(""), z.email()]).default(""),
  suspended: z.boolean().default(false),
  licences: z.array(entitlement).default([]),
  qualifications: z.array(entitlement).default([]),
  medicalState: z
    .enum(["Není doloženo", "Způsobilý", "Nezpůsobilý"])
    .default("Není doloženo"),
  medicalUntil: nullableDate,
});
export const assignmentSchema = base.extend({
  vehicleId: z.string(),
  driverId: z.string(),
  from: z.string(),
  to: nullableText,
  reason: z.string().min(1),
  odometer: nullableNumber,
});
export const readingSchema = base.extend({
  vehicleId: z.string(),
  at: timestamp,
  km: z.number().nonnegative(),
  referenceId: nullableText,
});
export const orderStates = [
  "Přijatá",
  "K doplnění",
  "K přiřazení",
  "Přiřazená",
  "Probíhá",
  "Dokončená",
  "Uzavřená",
  "Zrušená",
] as const;
export const stopSchema = z.object({
  id: z.string(),
  type: z.enum(["Nakládka", "Vykládka", "Zastávka"]),
  place: z.string(),
  from: nullableText,
  to: nullableText,
  contact: z.string().default(""),
  instructions: z.string().default(""),
});
export const orderSchema = base.extend({
  number: z.string(),
  customer: z.string(),
  reference: z.string().default(""),
  contact: z.string().default(""),
  stops: z.array(stopSchema),
  cargo: z.string().default(""),
  category: nullableText,
  weightKg: nullableNumber,
  volumeM3: nullableNumber,
  pallets: nullableNumber,
  dimensions: z.string().default(""),
  equipment: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  licence: z.string().default(""),
  priceMinor: nullableMinor,
  currency: z.string().default("CZK"),
  vat: nullableNumber,
  vehicleId: nullableText,
  driverId: nullableText,
  state: z.enum(orderStates),
  internalNote: z.string().default(""),
  externalId: z.string(),
});
export const tripStates = [
  "Probíhá",
  "Ukončena neúplná",
  "K ověření",
  "Potvrzena",
  "Uzavřena",
] as const;
export const tripSchema = base.extend({
  vehicleId: z.string(),
  driverId: z.string(),
  orderId: nullableText,
  purpose: z.string().default(""),
  from: z.string().min(1),
  to: z.string().default(""),
  startAt: timestamp,
  endAt: nullableTimestamp,
  startKm: z.number().nonnegative(),
  endKm: nullableNumber,
  state: z.enum(tripStates),
  note: z.string().default(""),
});
export const faultStates = [
  "Nahlášena",
  "Řeší se",
  "Naplánován servis",
  "V servisu",
  "Vyřešena",
  "Uzavřena",
] as const;
export const faultSchema = base.extend({
  vehicleId: z.string(),
  driverId: nullableText,
  category: z.string(),
  description: z.string().min(3, "Popište závadu"),
  at: timestamp,
  km: nullableNumber,
  urgency: z.enum(["Nízká", "Střední", "Vysoká"]),
  state: z.enum(faultStates),
  serviceId: nullableText,
  serviceFrom: nullableTimestamp,
  serviceTo: nullableTimestamp,
  unavailable: z.boolean().default(false),
  repair: z.string().default(""),
  estimateMinor: nullableMinor,
  estimateAt: nullableTimestamp,
  estimateSource: nullableText,
  actualMinor: nullableMinor,
  currency: z.string().default("CZK"),
  caseReference: z.string(),
});
export const matchStates = [
  "Čeká na výpis",
  "Spárováno",
  "Rozdíl",
  "Více kandidátů",
  "Chybí záznam řidiče",
  "Neúplný podklad",
  "Vyřešeno",
] as const;
export const fuelSchema = base.extend({
  vehicleId: z.string(),
  driverId: z.string(),
  at: timestamp,
  litres: nullableNumber,
  amountMinor: nullableMinor,
  currency: z.string().default("CZK"),
  fuel: z.string().default(""),
  cardId: nullableText,
  station: z.string().default(""),
  km: nullableNumber,
  full: z.enum(["Ano", "Ne", "Není doloženo"]),
  state: z.enum(matchStates).default("Čeká na výpis"),
  correctionReason: z.string().default(""),
});
export const statementSchema = base.extend({
  name: z.string(),
  periodFrom: nullableDate,
  periodTo: nullableDate,
  receivedAt: timestamp,
  complete: z.boolean().default(false),
  processing: z.enum([
    "not_configured",
    "queued",
    "processing",
    "completed",
    "incomplete",
    "failed",
  ]),
  error: z.string().default(""),
  externalId: nullableText,
});
export const transactionSchema = base.extend({
  statementId: z.string(),
  externalId: z.string(),
  vehicleId: nullableText,
  cardId: nullableText,
  at: timestamp,
  amountMinor: z.number().int(),
  currency: z.string(),
  litres: nullableNumber,
  fuelId: nullableText,
  state: z.enum(matchStates),
  resolvedMinor: nullableMinor,
  resolution: z.string().default(""),
});
export const expenseSchema = base.extend({
  vehicleId: z.string(),
  category: z.enum([
    "Servis",
    "Pneumatiky",
    "Pojištění",
    "Mýto",
    "Poplatky",
    "Jiné",
  ]),
  date: z.string(),
  amountMinor: z.number().int(),
  currency: z.string(),
  vat: nullableNumber,
  description: z.string().min(1),
  paidAt: nullableDate,
  kind: z.enum(["Výdaj", "Storno", "Korekce"]),
  originalId: nullableText,
});
export const deadlineSchema = base.extend({
  title: z.string().min(1),
  type: z.enum(["STK", "Pojištění", "Servis", "Oprávnění"]),
  vehicleId: nullableText,
  driverId: nullableText,
  date: nullableDate,
  km: nullableNumber,
  responsible: z.string().min(1),
  priority: z.enum(["Nízká", "Střední", "Vysoká"]),
  state: z.enum(["Plánováno", "Vyžaduje řešení", "Splněno"]),
  documentId: nullableText,
});
export const planItemSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  intervalKm: nullableNumber,
  intervalMonths: nullableNumber,
  lastKm: nullableNumber,
  lastDate: nullableDate,
  nextKm: nullableNumber,
  nextDate: nullableDate,
});
export const templateSchema = base.extend({
  name: z.string().trim().min(1),
  category: z.string(),
  items: z.array(planItemSchema),
});
export const planSchema = base.extend({
  vehicleId: z.string(),
  templateId: nullableText,
  items: z.array(planItemSchema),
  completions: z
    .array(
      z.object({
        itemId: z.string(),
        date: z.string(),
        km: z.number(),
        id: z.string(),
      }),
    )
    .default([]),
});
export const serviceSchema = base.extend({
  name: z.string().trim().min(1),
  email: z.union([z.literal(""), z.email()]),
  phone: z.string(),
  address: z.string(),
});
export const cardSchema = base.extend({
  number: z.string().min(1),
  active: z.boolean(),
  toleranceMinor: nullableMinor,
  bindings: z.array(
    z.object({ vehicleId: z.string(), from: z.string(), to: nullableText }),
  ),
});
export const notificationSchema = base.extend({
  aggregateId: z.string(),
  recipientRole: z.enum(["driver", "manager", "service"]),
  recipientId: nullableText,
  email: nullableText,
  subject: z.string(),
  message: z.string(),
  serviceAt: nullableTimestamp,
  place: z.string().default(""),
  state: z.enum([
    "not_configured",
    "queued",
    "sending",
    "sent",
    "failed",
    "skipped_no_recipient",
  ]),
  reason: z.string().default(""),
});
export const eventSchema = base.extend({
  eventType: z.string(),
  aggregateId: z.string(),
  correlationId: z.string(),
  idempotencyKey: z.string(),
  schemaVersion: z.literal(1),
  payload: z.record(z.string(), z.unknown()).default({}),
});
export const documentTypes = [
  "STK",
  "Pojištění",
  "Servisní doklad",
  "Příloha",
  "Řidičský průkaz",
  "Pracovní smlouva",
  "Objednávka",
  "Dodací list",
  "Účtenka",
  "CCS výpis",
] as const;
export const documentSchema = base.extend({
  ownerType: z.enum([
    "vehicle",
    "driver",
    "order",
    "fault",
    "fuel",
    "statement",
    "intake",
    "expense",
  ]),
  ownerId: z.string(),
  vehicleId: nullableText,
  type: z.enum(documentTypes),
  name: z.string(),
  mime: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  size: z.number(),
  storageKey: z.string(),
  hash: z.string(),
  uploadedAt: timestamp,
  validUntil: nullableDate,
  dueAt: nullableDate,
  fileState: z.enum(["uploading", "stored", "upload_failed"]),
  extraction: z.enum([
    "not_required",
    "not_configured",
    "queued",
    "processing",
    "completed",
    "incomplete",
    "failed",
  ]),
  jobId: nullableText,
  error: z.string().default(""),
  deletedAt: nullableTimestamp,
});
export const settingsSchema = z.object({
  managerEmail: z.union([z.literal(""), z.email()]),
  daysBefore: z.array(z.number().int().nonnegative()).nullable(),
  kmBefore: nullableNumber,
});
export const collections = {
  vehicles: vehicleSchema,
  drivers: driverSchema,
  assignments: assignmentSchema,
  readings: readingSchema,
  orders: orderSchema,
  trips: tripSchema,
  faults: faultSchema,
  fuels: fuelSchema,
  statements: statementSchema,
  transactions: transactionSchema,
  expenses: expenseSchema,
  deadlines: deadlineSchema,
  templates: templateSchema,
  plans: planSchema,
  services: serviceSchema,
  cards: cardSchema,
  notifications: notificationSchema,
  events: eventSchema,
  documents: documentSchema,
};
export type Collection = keyof typeof collections;
export type Records = { [K in Collection]: z.infer<(typeof collections)[K]> };
export type Entity = Records[Collection];
export type Workspace = { [K in Collection]: Records[K][] } & {
  settings: z.infer<typeof settingsSchema>;
};
export type Vehicle = Records["vehicles"];
export type Driver = Records["drivers"];
export type Order = Records["orders"];
export type Trip = Records["trips"];
export type Fault = Records["faults"];
export type Document = Records["documents"];
export function emptyWorkspace(): Workspace {
  return {
    vehicles: [],
    drivers: [],
    assignments: [],
    readings: [],
    orders: [],
    trips: [],
    faults: [],
    fuels: [],
    statements: [],
    transactions: [],
    expenses: [],
    deadlines: [],
    templates: [],
    plans: [],
    services: [],
    cards: [],
    notifications: [],
    events: [],
    documents: [],
    settings: { managerEmail: "", daysBefore: null, kmBefore: null },
  };
}
export function parseWorkspace(input: unknown): Workspace {
  const object = z.record(z.string(), z.unknown()).parse(input);
  const result = emptyWorkspace();
  for (const key of Object.keys(collections) as Collection[])
    (result[key] as Entity[]) = z.array(collections[key]).parse(object[key]);
  result.settings = settingsSchema.parse(object.settings);
  return result;
}
export function meta(id: string = crypto.randomUUID()) {
  const now = new Date().toISOString();
  return {
    id,
    version: 1,
    createdAt: now,
    updatedAt: now,
    source: "manual" as const,
  };
}
