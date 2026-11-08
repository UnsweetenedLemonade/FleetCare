/** Product specification §5.7, excluding the retired ambiguous-match state. */
export const ccsStatuses = {
  "Čeká na výpis": { label: "Čeká na výpis", variant: "amber" },
  Spárováno: { label: "Spárováno", variant: "green" },
  Rozdíl: { label: "Rozdíl", variant: "red" },
  "Chybí záznam řidiče": { label: "Chybí záznam řidiče", variant: "amber" },
  "Neúplný podklad": { label: "Neúplný podklad", variant: "amber" },
  Vyřešeno: { label: "Vyřešeno", variant: "green" },
} as const;
export type CCSStatus = keyof typeof ccsStatuses;
export const ccsOptions: [CCSStatus, string][] = Object.entries(
  ccsStatuses,
).map(([value, { label }]) => [value as CCSStatus, label]);
/** Ambiguous legacy matches and unknown values require completion, never a guessed link. */
export function ccsStatus(value: string): CCSStatus {
  return Object.hasOwn(ccsStatuses, value)
    ? (value as CCSStatus)
    : "Neúplný podklad";
}
