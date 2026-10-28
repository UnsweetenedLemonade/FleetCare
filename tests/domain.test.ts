import { describe, it, expect } from "vitest";
import { collections, meta } from "../src/domain/models";
import { applyCommand } from "../src/domain/commands";
import {
  a6Due,
  odometer,
  scopedWorkspace,
  suitability,
  validateTrip,
} from "../src/domain/rules";
import { canonicalCosts, consumption, report } from "../src/domain/analytics";
import { toUtc } from "../src/lib/format";
import { fixture, manager } from "./factories";
describe("Provozní pravidla", () => {
  it("rezerva je vhodná, neznámá kapacita nikoli", () => {
    const s = fixture();
    expect(suitability(s, s.orders[0], s.vehicles[0], s.drivers[0]).state).toBe(
      "Vhodné",
    );
    s.vehicles[0].capacityKg = null;
    expect(suitability(s, s.orders[0], s.vehicles[0], null)).toMatchObject({
      state: "Nelze vyhodnotit",
    });
  });
  it("pozastavení a servisní blokace tvoří konflikt bez smazání zakázky", () => {
    const s = fixture();
    applyCommand(s, manager, {
      type: "order.assign",
      id: "o1",
      version: 1,
      vehicleId: "v1",
      driverId: "d1",
    });
    applyCommand(s, manager, { type: "driver.toggle", id: "d1", version: 1 });
    expect(s.orders).toHaveLength(1);
    expect(
      suitability(s, s.orders[0], s.vehicles[0], s.drivers[0]).reasons.join(),
    ).toContain("pozastaven");
    s.faults.push(
      collections.faults.parse({
        ...meta(),
        vehicleId: "v1",
        description: "Test závady",
        category: "Jiné",
        at: "2026-10-28T10:00:00Z",
        urgency: "Nízká",
        state: "Naplánován servis",
        caseReference: "case1",
        serviceFrom: "2026-11-02T09:00:00Z",
        serviceTo: "2026-11-02T12:00:00Z",
        unavailable: true,
      }),
    );
    expect(
      suitability(s, s.orders[0], s.vehicles[0], null).reasons.join(),
    ).toContain("Servisní");
  });
  it("svěření nepřepisuje řidiče zakázky a verze chrání souběh", () => {
    const s = fixture();
    applyCommand(s, manager, {
      type: "vehicle.assign",
      vehicleId: "v1",
      driverId: "d1",
      from: "2026-10-28T10:00:00Z",
      reason: "Test",
      odometer: 100,
    });
    expect(s.orders[0].driverId).toBeNull();
    expect(() =>
      applyCommand(s, manager, { type: "driver.toggle", id: "d1", version: 9 }),
    ).toThrow("mezitím");
  });
  it("A6 respektuje přesnou hranici 72 hodin od skutečného konce", () => {
    const t = collections.trips.parse({
      ...meta(),
      vehicleId: "v1",
      driverId: "d1",
      purpose: "Test",
      from: "A",
      startAt: "2026-10-20T10:00:00Z",
      endAt: "2026-10-20T12:00:00Z",
      startKm: 100,
      endKm: null,
      state: "Ukončena neúplná",
    });
    expect(a6Due(t, new Date("2026-10-23T11:59:59Z"))).toBe(false);
    expect(a6Due(t, new Date("2026-10-23T12:00:00Z"))).toBe(true);
    expect(a6Due({ ...t, endAt: null }, new Date("2026-11-01"))).toBe(false);
  });
  it("jízdu bez koncového km uloží neúplnou a doplnění přepočte stav", () => {
    const s = fixture();
    applyCommand(s, manager, {
      type: "trip.start",
      data: {
        vehicleId: "v1",
        driverId: "d1",
        purpose: "Cesta do servisu",
        from: "A",
        startAt: "2026-10-27T10:00:00Z",
        startKm: 100,
      },
    });
    const t = s.trips[0];
    applyCommand(s, manager, {
      type: "save",
      collection: "trips",
      id: t.id,
      version: 1,
      data: { endAt: "2026-10-27T11:00:00Z", to: "B" },
    });
    expect(s.trips[0].state).toBe("Ukončena neúplná");
    applyCommand(s, manager, {
      type: "save",
      collection: "trips",
      id: t.id,
      version: 2,
      data: { endKm: 150 },
    });
    expect(s.trips[0].state).toBe("K ověření");
    expect(odometer(s, "v1")).toBe(150);
    s.readings.push({
      ...meta(),
      vehicleId: "v1",
      at: "2026-10-28T10:00:00Z",
      km: 200,
      referenceId: null,
    });
    applyCommand(s, manager, {
      type: "save",
      collection: "trips",
      id: t.id,
      version: 3,
      data: { endKm: 140 },
    });
    expect(odometer(s, "v1")).toBe(200);
  });
  it("blokuje překryv a zpětný tachometr", () => {
    const s = fixture();
    const t = collections.trips.parse({
      ...meta(),
      vehicleId: "v1",
      driverId: "d1",
      purpose: "Test",
      from: "A",
      to: "B",
      startAt: "2026-10-27T10:00:00Z",
      endAt: "2026-10-27T11:00:00Z",
      startKm: 100,
      endKm: 150,
      state: "K ověření",
    });
    expect(() => validateTrip(s, { ...t, endKm: 90 })).toThrow("nižší");
    s.trips.push(t);
    expect(() => validateTrip(s, { ...t, id: "other" })).toThrow("překrývá");
  });
  it("e-mailové požadavky jsou tři, nepřidělený řidič je vynechán", () => {
    const s = fixture();
    applyCommand(s, manager, {
      type: "save",
      collection: "faults",
      data: {
        vehicleId: "v1",
        category: "Jiné",
        description: "Syntetická závada",
        at: "2026-10-28T10:00:00Z",
        urgency: "Nízká",
        state: "Nahlášena",
        caseReference: "CASE",
      },
    });
    expect(s.notifications).toHaveLength(3);
    expect(
      s.notifications.find((n) => n.recipientRole === "driver")?.state,
    ).toBe("skipped_no_recipient");
    expect(s.notifications.some((n) => n.state === "sent")).toBe(false);
    expect(s.vehicles[0].state).toBe("V provozu");
  });
  it("řidič nedostane cizí dokument ani interní cenu", () => {
    const s = fixture();
    s.orders[0].driverId = "d1";
    s.documents.push(
      collections.documents.parse({
        ...meta(),
        ownerType: "driver",
        ownerId: "d2",
        type: "Pracovní smlouva",
        name: "cizí.pdf",
        mime: "application/pdf",
        size: 123,
        storageKey: "key",
        hash: "hash",
        uploadedAt: new Date().toISOString(),
        fileState: "stored",
        extraction: "not_required",
      }),
    );
    const scope = scopedWorkspace(s, { role: "Řidič", driverId: "d1" });
    expect(scope.documents).toHaveLength(0);
    expect(scope.orders[0].priceMinor).toBeNull();
    expect(() =>
      applyCommand(
        s,
        { role: "Řidič", driverId: "d1" },
        {
          type: "ccs.resolve",
          transactionId: "none",
          version: 1,
          fuelId: null,
          amountMinor: 1,
          reason: "Test",
        },
      ),
    ).toThrow("oprávnění");
  });
  it("změna šablony nemění individuální plán", () => {
    const s = fixture();
    s.templates.push(
      collections.templates.parse({
        ...meta("template"),
        name: "Vlastní interval",
        category: "Dodávka",
        items: [{ id: "item", name: "Test úkonu", intervalKm: 1000 }],
      }),
    );
    applyCommand(s, manager, {
      type: "plan.apply",
      vehicleId: "v1",
      templateId: "template",
      replace: false,
    });
    s.templates[0].items[0].intervalKm = 2000;
    expect(s.plans[0].items[0].intervalKm).toBe(1000);
    applyCommand(s, manager, {
      type: "plan.complete",
      planId: s.plans[0].id,
      itemId: s.plans[0].items[0].id,
      date: "2026-10-28",
      km: 100,
      version: 1,
    });
    expect(s.plans[0].items[0].nextKm).toBe(1100);
  });
  it("převod Europe/Prague zvládne letní čas a odmítne neexistující čas", () => {
    expect(toUtc("2026-07-01T10:00")).toBe("2026-07-01T08:00:00.000Z");
    expect(toUtc("2026-12-01T10:00")).toBe("2026-12-01T09:00:00.000Z");
    expect(() => toUtc("2026-03-29T02:30")).toThrow("neexistuje");
  });
});
describe("Ekonomika", () => {
  it("účtenka + CCS jsou jediný náklad, rozdíl je předběžný", () => {
    const s = fixture();
    s.fuels.push(
      collections.fuels.parse({
        ...meta("fuel"),
        vehicleId: "v1",
        driverId: "d1",
        at: "2026-10-28T10:00:00Z",
        amountMinor: 10000,
        litres: 10,
        full: "Ano",
        cardId: "card",
      }),
    );
    s.transactions.push(
      collections.transactions.parse({
        ...meta("ccs"),
        statementId: "statement",
        externalId: "tx",
        vehicleId: "v1",
        fuelId: "fuel",
        at: "2026-10-28T10:00:00Z",
        amountMinor: 10100,
        currency: "CZK",
        state: "Rozdíl",
      }),
    );
    expect(canonicalCosts(s)).toHaveLength(1);
    expect(canonicalCosts(s)[0].provisional).toBe(true);
    applyCommand(s, manager, {
      type: "ccs.resolve",
      transactionId: "ccs",
      fuelId: "fuel",
      version: 1,
      amountMinor: 10000,
      reason: "Ověřeno vůči podkladům",
    });
    expect(canonicalCosts(s)).toMatchObject([
      { amountMinor: 10000, provisional: false },
    ]);
  });
  it("spotřeba zahrne dílčí tankování mezi dvěma plnými", () => {
    const s = fixture();
    for (const [i, km, litres, full] of [
      [1, 100, 10, "Ano"],
      [2, 150, 5, "Ne"],
      [3, 200, 5, "Ano"],
    ] as const)
      s.fuels.push(
        collections.fuels.parse({
          ...meta("f" + i),
          vehicleId: "v1",
          driverId: "d1",
          at: `2026-10-${20 + i}T10:00:00Z`,
          km,
          litres,
          full,
        }),
      );
    expect(consumption(s, "v1", "2026-10-01", "2026-10-31")).toBe(10);
    expect(consumption(s, "v1", "2026-10-22", "2026-10-31")).toBeNull();
  });
  it("různé měny se nesčítají a při nulových km nelze vyhodnotit cenu/km", () => {
    const s = fixture();
    for (const currency of ["CZK", "EUR"])
      s.expenses.push(
        collections.expenses.parse({
          ...meta(currency),
          vehicleId: "v1",
          date: "2026-10-28",
          amountMinor: 10000,
          currency,
          description: "Test",
          category: "Jiné",
          kind: "Výdaj",
        }),
      );
    const r = report(s, {
      from: "2026-10-01",
      to: "2026-10-31",
      vehicleId: "",
      category: "",
      currency: "CZK",
      costType: "all",
    });
    expect(r.actualMinor).toBe(10000);
    expect(r.rows[0].costPerKm).toBeNull();
    expect(
      report(s, {
        from: "2026-09-01",
        to: "2026-09-30",
        vehicleId: "",
        category: "",
        currency: "CZK",
        costType: "all",
      }).actualMinor,
    ).toBe(0);
  });
});
