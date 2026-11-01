export type AccountActor = {
  role: "Řidič" | "Fleet manažer" | "Vedení";
  driverId: string | null;
};

export function matchAccount(
  accounts: Record<string, unknown>[],
  email: string,
  password: string,
): AccountActor | null;
