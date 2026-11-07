import { describe, expect, it } from "vitest";
import { matchAccount } from "../server/account-auth.mjs";

describe("Sheets account authentication", () => {
  it("maps active spreadsheet accounts to application roles", () => {
    expect(
      matchAccount(
        [
          {
            email: "driver@example.cz",
            password: "plain",
            role: "driver",
            driver_id: "drv-7",
            active: "TRUE",
          },
        ],
        " DRIVER@example.cz ",
        "plain",
      ),
    ).toEqual({ role: "Řidič", driverId: "drv-7" });
    expect(
      matchAccount(
        [
          { email: "fleet@example.cz", password: "pw", role: "fleet", active: true },
          { email: "boss@example.cz", password: "pw", role: "management", active: 1 },
        ],
        "fleet@example.cz",
        "pw",
      ),
    ).toEqual({ role: "Fleet manažer", driverId: null });
    expect(
      matchAccount(
        [{ email: "boss@example.cz", password: "pw", role: "management", active: "TRUE" }],
        "boss@example.cz",
        "pw",
      ),
    ).toEqual({ role: "Vedení", driverId: null });
  });

  it("rejects mismatched passwords and invalid driver accounts", () => {
    expect(matchAccount([{ email: "fleet@example.cz", password: "pw", role: "fleet", active: false }], "fleet@example.cz", "pw")).toBeNull();
    expect(
      matchAccount(
        [{ email: "fleet@example.cz", password: "pw", role: "fleet" }],
        "fleet@example.cz",
        "wrong",
      ),
    ).toBeNull();
    expect(() =>
      matchAccount(
        [{ email: "driver@example.cz", password: "pw", role: "driver", active: true }],
        "driver@example.cz",
        "pw",
      ),
    ).toThrow("Řidičský účet nemá vyplněné driver_id.");
  });
});
