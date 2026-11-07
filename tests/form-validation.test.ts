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
