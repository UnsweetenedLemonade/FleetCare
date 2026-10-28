import { it, expect } from "vitest";
import ExcelJS from "exceljs";
import { buildXlsx } from "../src/lib/export";
it("XLSX zachová české hlavičky, datum, číslo a prázdné chybějící km", async () => {
  const blob = await buildXlsx({
    title: "Kniha jízd",
    subtitle: "Test",
    columns: ["Datum", "Km", "Chybějící"],
    rows: [[new Date("2026-10-28T10:00:00Z"), 45, null]],
    footer: "Součet 45 km",
  });
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await blob.arrayBuffer());
  const sheet = book.worksheets[0];
  expect(sheet.getCell("A5").value).toBeInstanceOf(Date);
  expect(sheet.getCell("B5").value).toBe(45);
  expect(sheet.getCell("C5").value).toBeNull();
  expect(sheet.getCell("C4").value).toBe("Chybějící");
});
