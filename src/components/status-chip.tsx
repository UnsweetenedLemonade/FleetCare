import { ccsStatus, ccsStatuses } from "../lib/status";
export function StatusChip({ value }: { value: string }) {
  const status = ccsStatuses[ccsStatus(value)];
  return <span className={"badge " + status.variant}>{status.label}</span>;
}
