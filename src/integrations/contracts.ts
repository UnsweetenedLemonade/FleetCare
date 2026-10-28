import { z } from "zod";
import { orderSchema, transactionSchema } from "../domain/models";
const envelope = {
  eventId: z.string().uuid(),
  schemaVersion: z.literal(1),
  occurredAt: z.string().datetime(),
  aggregateId: z.string(),
  aggregateVersion: z.number().int().positive(),
  correlationId: z.string(),
  idempotencyKey: z.string(),
};
export const integrationEventSchema = z.discriminatedUnion("eventType", [
  z.object({
    ...envelope,
    eventType: z.literal("order.received"),
    payload: z.object({
      messageId: z.string(),
      attachmentId: z.string(),
      order: orderSchema,
      documentId: z.string(),
    }),
  }),
  z.object({
    ...envelope,
    eventType: z.literal("stk.processed"),
    payload: z.object({
      jobId: z.string(),
      documentId: z.string(),
      target: z.enum(["new", "existing"]),
      vehicleId: z.string().nullable(),
      spz: z.string(),
      vin: z.string().nullable(),
      stkUntil: z.string(),
      odometerKm: z.number().nonnegative().nullable(),
      observedAt: z.string(),
      expectedVersion: z.number().nullable(),
      fieldVersions: z.record(z.string(), z.number()),
    }),
  }),
  z.object({
    ...envelope,
    eventType: z.literal("licence.processed"),
    payload: z.object({
      jobId: z.string(),
      documentId: z.string(),
      driverId: z.string(),
      licences: z.array(
        z.object({ name: z.string(), validUntil: z.string().nullable() }),
      ),
      expectedVersion: z.number(),
    }),
  }),
  z.object({
    ...envelope,
    eventType: z.literal("fuel.processed"),
    payload: z.object({
      jobId: z.string(),
      documentId: z.string(),
      fuelId: z.string(),
      vehicleId: z.string(),
      driverId: z.string(),
      transactionAt: z.string().nullable(),
      litres: z.number().nullable(),
      amountMinor: z.number().int().nullable(),
      currency: z.string(),
      expectedVersion: z.number(),
    }),
  }),
  z.object({
    ...envelope,
    eventType: z.literal("ccs.processed"),
    payload: z.object({
      jobId: z.string(),
      statementId: z.string(),
      messageId: z.string().nullable(),
      attachmentHash: z.string(),
      transactions: z.array(transactionSchema),
      complete: z.boolean(),
    }),
  }),
  z.object({
    ...envelope,
    eventType: z.literal("service.estimate.received"),
    payload: z.object({
      faultId: z.string(),
      caseReference: z.string(),
      messageId: z.string(),
      estimateMinor: z.number().int().nonnegative(),
      currency: z.string(),
      receivedAt: z.string(),
      source: z.string(),
      serviceFrom: z.string().nullable(),
      serviceTo: z.string().nullable(),
      expectedVersion: z.number(),
    }),
  }),
  z.object({
    ...envelope,
    eventType: z.literal("document.processing.failed"),
    payload: z.object({
      documentId: z.string(),
      jobId: z.string(),
      state: z.enum(["incomplete", "failed"]),
      missingFields: z.array(z.string()),
      reason: z.string(),
    }),
  }),
  z.object({
    ...envelope,
    eventType: z.literal("notification.status.changed"),
    payload: z.object({
      notificationId: z.string(),
      providerMessageId: z.string().nullable(),
      state: z.enum(["queued", "sending", "sent", "failed"]),
      reason: z.string().nullable(),
    }),
  }),
]);
export type IntegrationEvent = z.infer<typeof integrationEventSchema>;
