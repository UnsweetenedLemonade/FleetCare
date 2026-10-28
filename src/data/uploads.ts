import type { UploadInput } from "./contracts";
import { DomainError } from "../domain/rules";
export const fileLimits = {
  maxFiles: 10,
  storageBytes: 20 * 1024 * 1024,
  extractionBytes: 5 * 1024 * 1024,
  mimes: ["application/pdf", "image/jpeg", "image/png"],
};
export function validateUpload(input: UploadInput) {
  if (!input.files.length || input.files.length > fileLimits.maxFiles)
    throw new DomainError("Vyberte 1 až 10 souborů.");
  const allowed: Record<UploadInput["ownerType"], UploadInput["type"][]> = {
    vehicle: ["STK", "Pojištění", "Servisní doklad", "Příloha"],
    driver: ["Řidičský průkaz", "Pracovní smlouva"],
    order: ["Dodací list"],
    fault: ["Servisní doklad"],
    fuel: ["Účtenka"],
    statement: ["CCS výpis"],
    intake: ["STK"],
    expense: ["Příloha", "Servisní doklad"],
  };
  if (!allowed[input.ownerType].includes(input.type))
    throw new DomainError("Nepovolený typ dokumentu pro tuto evidenci.");
  for (const f of input.files) {
    if (!fileLimits.mimes.includes(f.type))
      throw new DomainError("Povolené jsou pouze PDF, JPG a PNG.");
    if (!f.size) throw new DomainError("Soubor je prázdný.");
    if (f.size > fileLimits.storageBytes)
      throw new DomainError("Soubor překračuje limit úložiště 20 MB.");
    if (
      ["STK", "Řidičský průkaz", "Účtenka", "CCS výpis"].includes(input.type) &&
      f.size > fileLimits.extractionBytes
    )
      throw new DomainError(
        "Soubor pro extrakci překračuje 5 MB. Dodejte menší podklad.",
      );
    if (input.type === "CCS výpis" && f.type !== "application/pdf")
      throw new DomainError("CCS výpis musí být PDF.");
  }
}
