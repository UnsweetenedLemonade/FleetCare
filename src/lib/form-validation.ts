import type { Document } from "../domain/models";

/** Generic attachments/delivery notes have no billing semantics; use optional validity. */
export function documentDateField(type: Document["type"]): {
  key: "validUntil" | "dueAt";
  label: string;
} {
  if (["Účtenka", "CCS výpis", "Servisní doklad", "Objednávka"].includes(type))
    return { key: "dueAt", label: "Splatnost" };
  return {
    key: "validUntil",
    label: type === "STK" ? "Platnost STK do" : "Platnost do",
  };
}
