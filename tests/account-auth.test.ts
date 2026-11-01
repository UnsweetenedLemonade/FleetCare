import { describe, expect, it } from "vitest";
import { matchAccount } from "../server/account-auth.mjs";

describe("Sheets account authentication", () => {
  it("maps spreadsheet roles to application roles and ignores active", () => {
    expect(
      matchAccount(
        [
          {
            email: "driver@example.cz",
            password: "plain",
            role: "driver",
            driver_id: "drv-7",
            active: false,
          },
        ],
        " DRIVER@example.cz ",
        "plain",
      ),
    ).toEqual({ role: "Řidič", driverId: "drv-7" });
    expect(
      matchAccount(
        [
          { email: "fleet@example.cz", password: "pw", role: "fleet" },
          { email: "boss@example.cz", password: "pw", role: "management" },
        ],
        "fleet@example.cz",
        "pw",
      ),
    ).toEqual({ role: "Fleet manažer", driverId: null });
    expect(
      matchAccount(
        [{ email: "boss@example.cz", password: "pw", role: "management" }],
        "boss@example.cz",
        "pw",
      ),
    ).toEqual({ role: "Vedení", driverId: null });
  });

  it("rejects mismatched passwords and invalid driver accounts", () => {
    expect(
      matchAccount(
        [{ email: "fleet@example.cz", password: "pw", role: "fleet" }],
        "fleet@example.cz",
        "wrong",
      ),
    ).toBeNull();
    expect(() =>
      matchAccount(
        [{ email: "driver@example.cz", password: "pw", role: "driver" }],
        "driver@example.cz",
        "pw",
      ),
    ).toThrow("Řidičský účet nemá vyplněné driver_id.");
  });
});
