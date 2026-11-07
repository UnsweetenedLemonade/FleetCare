import { expect, it } from "vitest";
import { documentDateField } from "../src/lib/form-validation";

it("selects one date field from the existing document types", () => {
  expect(documentDateField("STK")).toEqual({
    key: "validUntil",
    label: "Platnost STK do",
  });
  for (const type of [
    "Pojištění",
    "Řidičský průkaz",
    "Pracovní smlouva",
    "Příloha",
    "Dodací list",
  ] as const)
    expect(documentDateField(type).key).toBe("validUntil");
  for (const type of [
    "Účtenka",
    "CCS výpis",
    "Servisní doklad",
    "Objednávka",
  ] as const)
    expect(documentDateField(type).key).toBe("dueAt");
});

import { editorFields } from "../src/features/editors";
import { fixture, manager } from "./factories";
it("requires VIN and STK for manual vehicle creation using the existing vehicle fields", () => {
  const fields = editorFields("vehicles", fixture(), manager);
  for (const key of ["spz", "vin", "model", "category", "state", "stkUntil"])
    expect(fields.find((f) => f.key === key)?.required).toBe(true);
  expect(
    editorFields("vehicles", fixture(), manager, true).find(
      (f) => f.key === "vin",
    )?.required,
  ).toBe(false);
});
