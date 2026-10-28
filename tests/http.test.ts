import { afterAll, beforeAll, describe, it, expect } from "vitest";
import { createServer, type Server } from "node:http";
import { HttpRepository } from "../src/data/http";
import { fixture, manager } from "./factories";
import { integrationEventSchema } from "../src/integrations/contracts";
let server: Server,
  base = "",
  status = 200,
  invalid = false;
const requests: { method: string; url: string; key: string; body: string }[] =
  [];
beforeAll(async () => {
  server = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    requests.push({
      method: req.method || "",
      url: req.url || "",
      key: String(req.headers["idempotency-key"] || ""),
      body,
    });
    res.setHeader("Content-Type", "application/json");
    if (status !== 200) {
      res.writeHead(status);
      res.end(JSON.stringify({ message: "Testovaná chyba" }));
      return;
    }
    if (req.url === "/workspace")
      res.end(JSON.stringify(invalid ? { vehicles: "invalid" } : fixture()));
    else if (req.url === "/search")
      res.end(
        JSON.stringify([
          {
            id: "v1",
            type: "Vozidla",
            title: "1QA 0001",
            subtitle: "Test",
            path: "/vehicles/v1",
          },
        ]),
      );
    else if (req.url === "/actor-options")
      res.end(JSON.stringify([{ id: "d1", name: "Testovací řidič" }]));
    else if (req.url === "/uploads")
      res.end(JSON.stringify({ uploadId: "up1" }));
    else if (req.url?.endsWith("/complete") || req.url === "/jobs/job1")
      res.end(JSON.stringify({ jobId: "job1", state: "queued" }));
    else if (req.url?.endsWith("/content") && req.method === "GET") {
      res.setHeader("Content-Type", "application/pdf");
      res.end("%PDF-1.7\nTEST");
    } else {
      res.writeHead(204);
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address && typeof address === "object")
    base = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});
describe("HTTP kontrakt proti izolovanému serveru", () => {
  it("ověří konfiguraci a runtime DTO", async () => {
    expect(() => new HttpRepository("")).toThrow("VITE_API_BASE_URL");
    const repo = new HttpRepository(base);
    expect((await repo.read(manager)).vehicles[0].id).toBe("v1");
    invalid = true;
    await expect(repo.read(manager)).rejects.toThrow();
    invalid = false;
  });
  it("přenese idempotenci příkazu a nepovolí řidiči CCS operaci", async () => {
    const repo = new HttpRepository(base);
    await repo.execute(manager, {
      idempotencyKey: "stable-key",
      command: { type: "driver.toggle", id: "d1", version: 1 },
    });
    expect(requests.at(-1)).toMatchObject({
      method: "POST",
      url: "/commands",
      key: "stable-key",
    });
    expect(JSON.parse(requests.at(-1)!.body)).toMatchObject({
      type: "driver.toggle",
      version: 1,
    });
    await expect(
      repo.execute(
        { role: "Řidič", driverId: "d1" },
        {
          idempotencyKey: "denied",
          command: {
            type: "ccs.resolve",
            transactionId: "tx",
            fuelId: null,
            amountMinor: 1,
            reason: "Test",
            version: 1,
          },
        },
      ),
    ).rejects.toThrow("oprávnění");
  });
  it("obslouží vyhledávání, identity, upload/content/complete, job i soubor", async () => {
    const repo = new HttpRepository(base);
    expect(await repo.search(manager, "1qa0001")).toHaveLength(1);
    expect(await repo.identities()).toHaveLength(1);
    const before = requests.length;
    await repo.upload(manager, {
      ownerType: "driver",
      ownerId: "d1",
      type: "Řidičský průkaz",
      files: [new File(["%PDF-1.7"], "test.pdf", { type: "application/pdf" })],
      idempotencyKey: "upload-stable",
    });
    expect(requests.slice(before).map((x) => x.url)).toEqual([
      "/uploads",
      "/uploads/up1/content",
      "/uploads/up1/complete",
    ]);
    expect(await repo.job(manager, "job1")).toMatchObject({ state: "queued" });
    expect((await repo.file(manager, "doc1")).type).toBe("application/pdf");
  });
  it("zpracuje 409 a 429 bez opakování zápisu a bez lokálního fallbacku", async () => {
    const repo = new HttpRepository(base);
    for (const code of [409, 429]) {
      status = code;
      const before = requests.length;
      await expect(
        repo.execute(manager, {
          idempotencyKey: "key-" + code,
          command: { type: "driver.toggle", id: "d1", version: 1 },
        }),
      ).rejects.toMatchObject({ status: code });
      expect(requests.length - before).toBe(1);
    }
    status = 200;
  });
  it("síťová chyba nevrací stará lokální data", async () => {
    const repo = new HttpRepository(base, async () => {
      throw new TypeError("Test network failure");
    });
    await expect(repo.read(manager)).rejects.toThrow(
      "Lokální data nebyla použita",
    );
  });
  it("odpověď API je i ve FE omezena podle řidiče", async () => {
    const repo = new HttpRepository(base);
    const s = await repo.read({ role: "Řidič", driverId: "unknown" });
    expect(s.drivers).toHaveLength(0);
    expect(s.orders).toHaveLength(0);
  });
  it("událost odhadu servisu validuje vazbu případu a zachovává odhad", () => {
    const e = integrationEventSchema.parse({
      eventId: crypto.randomUUID(),
      schemaVersion: 1,
      occurredAt: new Date().toISOString(),
      aggregateId: "f1",
      aggregateVersion: 2,
      correlationId: "request",
      idempotencyKey: "email-1",
      eventType: "service.estimate.received",
      payload: {
        faultId: "f1",
        caseReference: "FC-f1",
        messageId: "m1",
        estimateMinor: 100000,
        currency: "CZK",
        receivedAt: new Date().toISOString(),
        source: "service-email",
        serviceFrom: null,
        serviceTo: null,
        expectedVersion: 1,
      },
    });
    expect(e.eventType).toBe("service.estimate.received");
    expect("actualMinor" in e.payload).toBe(false);
  });
});
