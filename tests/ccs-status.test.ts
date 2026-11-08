import { createElement } from "react";
import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ccsOptions, ccsStatus, ccsStatuses } from "../src/lib/status";
import { matchStates, collections, meta } from "../src/domain/models";
import { StatusChip } from "../src/components/status-chip";
import { fuelState } from "../src/domain/ccs";
import { fixture } from "./factories";
it("nabídka i chip používají šest dohodnutých stavů a bezpečně mapují staré hodnoty", () => {
  expect(ccsOptions.map(([v]) => v)).toEqual([
    "Čeká na výpis",
    "Spárováno",
    "Rozdíl",
    "Chybí záznam řidiče",
    "Neúplný podklad",
    "Vyřešeno",
  ]);
  const legacy = matchStates.filter((v) => !Object.hasOwn(ccsStatuses, v));
  expect(legacy).toHaveLength(1);
  for (const value of [...legacy, "unknown"]) {
    expect(ccsStatus(value)).toBe("Neúplný podklad");
    expect(
      renderToStaticMarkup(createElement(StatusChip, { value })),
    ).toContain("Neúplný podklad");
  }
});
it("samotný uložený rozdíl bez propojení nezobrazuje finanční neshodu", () => {
  const s = fixture();
  const f = collections.fuels.parse({
    ...meta("f"),
    vehicleId: "v1",
    driverId: "d1",
    at: "2026-10-28T10:00:00Z",
    full: "Ano",
    state: "Rozdíl",
  });
  expect(fuelState(s, f)).toBe("Čeká na výpis");
});
