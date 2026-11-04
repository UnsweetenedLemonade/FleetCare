const roleMap = {
  driver: "Řidič",
  fleet: "Fleet manažer",
  management: "Vedení",
};

export function matchAccount(accounts, email, password) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLocaleLowerCase("en-US");
  const account = accounts.find(
    (row) =>
      String(row.email ?? "")
        .trim()
        .toLocaleLowerCase("en-US") === normalizedEmail &&
      String(row.password ?? "") === String(password ?? "") &&
      [true, 1, "TRUE", "true"].includes(row.active),
  );
  if (!account) return null;

  const role =
    roleMap[
      String(account.role ?? "")
        .trim()
        .toLowerCase()
    ];
  if (!role)
    throw Object.assign(new Error("Účet má neznámou roli."), { status: 422 });
  const driverId =
    role === "Řidič" ? String(account.driver_id ?? "").trim() : "";
  if (role === "Řidič" && !driverId)
    throw Object.assign(new Error("Řidičský účet nemá vyplněné driver_id."), {
      status: 422,
    });
  return { role, driverId: driverId || null };
}
