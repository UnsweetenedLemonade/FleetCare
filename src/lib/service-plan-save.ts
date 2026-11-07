import { z } from "zod";
import { collections, meta, type Records } from "../domain/models";
import type { Command } from "../data/contracts";
import { DomainError } from "../domain/rules";

export function validatePlanItems(items: Records["plans"]["items"]) {
  const issues: z.core.$ZodIssue[] = [];
  items.forEach((item, index) => {
    if (!((item.intervalKm ?? 0) > 0 || (item.intervalMonths ?? 0) > 0))
      for (const field of ["intervalKm", "intervalMonths"])
        issues.push({
          code: "custom",
          path: ["items", index, field],
          message: "Zadejte kladný interval v km nebo měsících.",
        });
  });
  if (issues.length) throw new z.ZodError(issues);
}

/** The API has no batch save. Freeze both payloads and reuse keys across retries. */
export function individualPlanSave(input: {
  key: string;
  vehicleId: string;
  category: string;
  items: Records["plans"]["items"];
  templateName?: string;
}) {
  validatePlanItems(input.items);
  if (input.templateName !== undefined && !input.templateName.trim())
    throw new DomainError("Vyplňte název šablony.", "name");
  const template =
    input.templateName === undefined
      ? null
      : collections.templates.parse({
          ...meta(input.key + "-template"),
          name: input.templateName,
          category: input.category,
          items: structuredClone(input.items),
        });
  const plan = collections.plans.parse({
    ...meta(input.key + "-plan"),
    vehicleId: input.vehicleId,
    templateId: template?.id || null,
    items: structuredClone(input.items),
  });
  const progress = { templateAttempted: false, templateSaved: false };
  return {
    progress,
    async save(run: (command: Command, key: string) => Promise<void>) {
      if (template && !progress.templateSaved) {
        progress.templateAttempted = true;
        await run(
          { type: "save", collection: "templates", data: template },
          input.key + "-template",
        );
        progress.templateSaved = true;
      }
      await run(
        { type: "save", collection: "plans", data: plan },
        input.key + "-plan",
      );
    },
  };
}
