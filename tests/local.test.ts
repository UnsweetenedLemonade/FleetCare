import { afterEach, describe, it, expect, vi } from "vitest";
import { LocalRepository, FleetDatabase } from "../src/data/local";
import { fixture, manager } from "./factories";
import { validateUpload } from "../src/data/uploads";
const databases: FleetDatabase[] = [];
function repository() {
  const db = new FleetDatabase("fleetcare-test-" + crypto.randomUUID());
  databases.push(db);
  return new LocalRepository(db);
}
afterEach(async () => {
  for (const db of databases) await db.delete();
  databases.length = 0;
});
describe("IndexedDB", () => {
  it("selhání zápisu neuloží závadu ani outbox", async () => {
    const repo = repository();
    await repo.db.state.put({ id: "workspace", data: fixture() });
    const write = vi
      .spyOn(repo.db.state, "put")
      .mockRejectedValueOnce(
        new DOMException("Test kvóty", "QuotaExceededError"),
      );
    await expect(
      repo.execute(manager, {
        idempotencyKey: "quota-test",
        command: {
          type: "save",
          collection: "faults",
          data: {
            vehicleId: "v1",
            description: "Test kvóty",
            category: "Jiné",
            at: new Date().toISOString(),
            urgency: "Nízká",
            state: "Nahlášena",
            caseReference: "quota",
          },
        },
      }),
    ).rejects.toThrow("Test kvóty");
    write.mockRestore();
    const s = await repo.read(manager);
    expect(s.faults).toHaveLength(0);
    expect(s.notifications).toHaveLength(0);
  });
  it("čistý start nemá provozní data", async () => {
    const repo = repository();
    const s = await repo.read(manager);
    expect(s.vehicles).toHaveLength(0);
    expect(s.drivers).toHaveLength(0);
    expect(s.orders).toHaveLength(0);
    expect(s.documents).toHaveLength(0);
  });
  it("zápis je persistentní a duplicita SPZ neprojde", async () => {
    const repo = repository();
    await repo.execute(manager, {
      idempotencyKey: "1",
      command: {
        type: "save",
        collection: "vehicles",
        data: { spz: "1QA 0001", model: "Test", category: "Dodávka" },
      },
    });
    expect(
      (await new LocalRepository(new FleetDatabase(repo.db.name)).read(manager))
        .vehicles,
    ).toHaveLength(1);
    await expect(
      repo.execute(manager, {
        idempotencyKey: "2",
        command: {
          type: "save",
          collection: "vehicles",
          data: { spz: "1qa0001", model: "Test", category: "Dodávka" },
        },
      }),
    ).rejects.toThrow("SPZ");
    expect((await repo.read(manager)).vehicles).toHaveLength(1);
  });
  it("opakování závady je idempotentní včetně outboxu", async () => {
    const repo = repository();
    await repo.db.state.put({ id: "workspace", data: fixture() });
    const input = {
      idempotencyKey: "fault1",
      command: {
        type: "save" as const,
        collection: "faults" as const,
        data: {
          vehicleId: "v1",
          description: "Testovací závada",
          category: "Jiné",
          at: new Date().toISOString(),
          urgency: "Nízká",
          state: "Nahlášena",
          caseReference: "test",
        },
      },
    };
    await repo.execute(manager, input);
    await repo.execute(manager, input);
    const s = await repo.read(manager);
    expect(s.faults).toHaveLength(1);
    expect(s.notifications).toHaveLength(3);
  });
  it("blob přežije nové připojení, hash zabrání duplicitě a smazání znepřístupní soubor", async () => {
    const repo = repository();
    await repo.db.state.put({ id: "workspace", data: fixture() });
    const input = {
      ownerType: "driver" as const,
      ownerId: "d1",
      type: "Pracovní smlouva" as const,
      files: [
        new File(["%PDF-1.7\nsynthetic"], "synthetic.pdf", {
          type: "application/pdf",
        }),
      ],
      idempotencyKey: "doc1",
    };
    await repo.upload(manager, input);
    await repo.upload(manager, { ...input, idempotencyKey: "doc2" });
    const docs = (await repo.read(manager)).documents;
    expect(docs).toHaveLength(1);
    const reopened = new LocalRepository(new FleetDatabase(repo.db.name));
    expect(await (await reopened.file(manager, docs[0].id)).text()).toContain(
      "synthetic",
    );
    await expect(
      repo.file({ role: "Řidič", driverId: "d2" }, docs[0].id),
    ).rejects.toThrow("dostupný");
    await repo.execute(
      { role: "Řidič", driverId: "d1" },
      {
        idempotencyKey: "delete1",
        command: { type: "document.delete", id: docs[0].id },
      },
    );
    await expect(repo.file(manager, docs[0].id)).rejects.toThrow("dostupný");
    expect((await repo.read(manager)).drivers).toHaveLength(1);
  });
  it("upload STK nevytvoří prázdné provozní auto a extrakce není předstírána", async () => {
    const repo = repository();
    await repo.upload(manager, {
      ownerType: "intake",
      ownerId: "new",
      type: "STK",
      files: [
        new File(["%PDF-1.7\nTEST"], "stk.pdf", { type: "application/pdf" }),
      ],
      idempotencyKey: "stk",
    });
    const s = await repo.read(manager);
    expect(s.vehicles).toHaveLength(0);
    expect(s.documents[0].extraction).toBe("not_configured");
    expect(s.documents[0].fileState).toBe("stored");
  });
  it("zakáže cizí typ dokumentu a nepodporovaný aktivní obsah", () => {
    expect(() =>
      validateUpload({
        ownerType: "driver",
        ownerId: "d1",
        type: "Příloha",
        files: [new File(["x"], "x.svg", { type: "image/svg+xml" })],
        idempotencyKey: "x",
      }),
    ).toThrow("Nepovolený");
  });
});
