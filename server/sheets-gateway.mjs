import { createServer } from "node:http";
import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";

const port = Number(process.env.PORT || 8787);
const sheetId = process.env.GOOGLE_SHEET_ID;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!sheetId || !credentialsPath) {
  console.error("Set GOOGLE_SHEET_ID and GOOGLE_APPLICATION_CREDENTIALS.");
  process.exit(1);
}

let credentials;
let cachedToken;
async function accessToken() {
  if (!credentials) credentials = JSON.parse(await readFile(credentialsPath, "utf8"));
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const enc = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const unsigned = `${enc({ alg: "RS256", typ: "JWT" })}.${enc({
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(credentials.private_key, "base64url")}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`Google OAuth ${response.status}`);
  const body = await response.json();
  cachedToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return cachedToken.value;
}

async function rows(tab) {
  const token = await accessToken();
  const range = `${encodeURIComponent(tab)}!A:ZZ`;
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error(`Sheets API ${response.status} (${tab})`);
  const values = (await response.json()).values || [];
  const headers = (values.shift() || []).map((x) => String(x).trim());
  return values.filter((row) => row.some((x) => x !== "" && x != null)).map((row) =>
    Object.fromEntries(headers.map((key, i) => [key, row[i] ?? ""])),
  );
}
const val = (row, key, fallback = "") => row[key] === "" || row[key] == null ? fallback : row[key];
const text = (row, key, fallback = "") => String(val(row, key, fallback));
const number = (row, key) => {
  const value = Number(val(row, key, NaN));
  return Number.isFinite(value) ? value : null;
};
const bool = (row, key) => [true, 1, "TRUE", "Ano", "ANO", "true"].includes(val(row, key));
const stamp = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "2000-01-01T00:00:00.000Z" : date.toISOString();
};
const dateOnly = (value) => {
  if (!value) return null;
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString().slice(0, 10);
};
const meta = (id, updatedAt = "2000-01-01T00:00:00.000Z") => ({
  id: String(id), version: 1, createdAt: updatedAt, updatedAt, source: "import",
});
const split = (value) => String(value || "").split(/[,;]/).map((x) => x.trim()).filter(Boolean);

let workspaceCache;
let workspaceCacheUntil = 0;
async function workspace() {
  if (workspaceCache && workspaceCacheUntil > Date.now()) return workspaceCache;
  const [vehiclesRaw, driversRaw, deadlinesRaw, tripsRaw, fuelRaw, settingsRaw] = await Promise.all([
    rows("vehicles"), rows("drivers"), rows("deadlines"), rows("trips"), rows("fuel"), rows("settings"),
  ]);
  const settings = Object.fromEntries(settingsRaw.map((r) => [r.key, r.value]));
  const vehicles = vehiclesRaw.map((r) => ({
    ...meta(text(r, "vehicle_id")), spz: text(r, "spz"), vin: text(r, "vin"),
    model: text(r, "brand_model"), year: number(r, "year"),
    category: ["Kamion", "Nákladní vozidlo", "Dodávka", "Osobní auto"].includes(text(r, "type")) ? text(r, "type") : "Nákladní vozidlo",
    purpose: text(r, "purpose"), reserve: bool(r, "reserve"), state: ["V provozu", "V servisu", "Odstaveno"].includes(text(r, "state")) ? text(r, "state") : "V provozu",
    fuel: "", engine: "", licence: "", capacityKg: null, volumeM3: null, pallets: null, dimensions: "", equipment: [], configuration: "", stkUntil: null, serviceId: null,
  }));
  const drivers = driversRaw.map((r) => ({
    ...meta(text(r, "driver_id")), name: text(r, "name"), phone: text(r, "phone"), email: text(r, "email"),
    suspended: text(r, "state") !== "Aktivní", licences: split(r.licence).map((name) => ({ name, validUntil: dateOnly(r.licence_valid_until) })),
    qualifications: [], medicalState: "Není doloženo", medicalUntil: null,
  }));
  const assignments = driversRaw.filter((r) => r.vehicle_id).map((r, i) => ({
    ...meta(`sheet-assignment-${i}`), vehicleId: text(r, "vehicle_id"), driverId: text(r, "driver_id"),
    from: "2000-01-01T00:00:00.000Z", to: null, reason: "Přiřazení importované z tabulky", odometer: null,
  }));
  const readings = vehiclesRaw.filter((r) => number(r, "odometer_km") !== null).map((r) => ({
    ...meta(`sheet-reading-${text(r, "vehicle_id")}`), vehicleId: text(r, "vehicle_id"), at: "2000-01-01T00:00:00.000Z",
    km: number(r, "odometer_km"), referenceId: `sheet-odometer-${text(r, "vehicle_id")}`,
  }));
  const deadlines = deadlinesRaw.map((r) => ({
    ...meta(text(r, "deadline_id")), title: text(r, "deadline_type"),
    type: /stk/i.test(text(r, "deadline_type")) ? "STK" : /pojištění/i.test(text(r, "deadline_type")) ? "Pojištění" : "Servis",
    vehicleId: text(r, "vehicle_id") || null, driverId: null, date: dateOnly(r.valid_until), km: number(r, "valid_until_km"),
    responsible: "Fleet manažer", priority: "Střední", state: text(r, "state") === "Splněno" ? "Splněno" : "Plánováno", documentId: null,
  }));
  const trips = tripsRaw.filter((r) => r.start_at).map((r) => ({
    ...meta(text(r, "trip_id"), stamp(r.start_at)), vehicleId: text(r, "vehicle_id"), driverId: text(r, "driver_id"), orderId: null,
    purpose: text(r, "order_number"), from: text(r, "from"), to: text(r, "to"), startAt: stamp(r.start_at),
    endAt: r.actual_end_at ? stamp(r.actual_end_at) : null, startKm: number(r, "odometer_start") ?? 0,
    endKm: number(r, "odometer_end"), state: ["Probíhá", "Ukončena neúplná", "K ověření", "Potvrzena", "Uzavřena"].includes(text(r, "state")) ? text(r, "state") : "K ověření", note: text(r, "source"),
  }));
  const fuels = fuelRaw.filter((r) => r.vehicle_id && r.driver_id && r.date).map((r) => ({
    ...meta(text(r, "fuel_id"), stamp(r.date)), vehicleId: text(r, "vehicle_id"), driverId: text(r, "driver_id"), at: stamp(r.date),
    litres: number(r, "litres"), amountMinor: number(r, "ccs_amount_czk") !== null ? Math.round(number(r, "ccs_amount_czk") * 100) : number(r, "amount_czk") === null ? null : Math.round(number(r, "amount_czk") * 100),
    currency: "CZK", fuel: "", cardId: null, station: text(r, "station"), km: null,
    full: bool(r, "full_tank") ? "Ano" : "Není doloženo",
    state: ["Čeká na výpis", "Spárováno", "Rozdíl", "Více kandidátů", "Chybí záznam řidiče", "Neúplný podklad", "Vyřešeno"].includes(text(r, "match_state")) ? text(r, "match_state") : "Čeká na výpis",
    correctionReason: "",
  }));
  workspaceCache = {
    vehicles, drivers, assignments, readings, deadlines, trips, fuels,
    orders: [], faults: [], statements: [], transactions: [], expenses: [], templates: [], plans: [], services: [], cards: [], notifications: [], events: [], documents: [],
    settings: { managerEmail: String(settings.manager_email || ""), daysBefore: null, kmBefore: null },
  };
  workspaceCacheUntil = Date.now() + 30_000;
  return workspaceCache;
}

const server = createServer(async (req, res) => {
  const cors = process.env.CORS_ORIGIN;
  if (cors && req.headers.origin === cors) {
    res.setHeader("Access-Control-Allow-Origin", cors);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key, X-Actor-Context");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") { res.writeHead(204).end(); return; }
  try {
    if (req.method === "GET" && req.url === "/health") { res.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}'); return; }
    if (req.method === "GET" && req.url === "/v1/workspace") {
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(await workspace())); return;
    }
    if (req.method === "GET" && req.url === "/v1/actor-options") {
      const data = await rows("drivers");
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(data.map((r) => ({ id: text(r, "driver_id"), name: text(r, "name") })))); return;
    }
    if (req.method === "POST" && req.url === "/v1/search") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const query = String(JSON.parse(body || "{}").query || "").trim().toLocaleLowerCase("cs-CZ");
      const data = await workspace();
      const results = [
        ...data.vehicles.map((x) => ({ id: x.id, type: "Vozidlo", title: x.spz, subtitle: x.model, path: `/vehicles/${x.id}` })),
        ...data.drivers.map((x) => ({ id: x.id, type: "Řidič", title: x.name, subtitle: x.phone, path: `/drivers/${x.id}` })),
        ...data.trips.map((x) => ({ id: x.id, type: "Jízda", title: x.purpose || "Jízda", subtitle: x.from, path: `/trips/${x.id}` })),
        ...data.deadlines.map((x) => ({ id: x.id, type: "Termín", title: x.title, subtitle: x.date || "", path: "/deadlines" })),
      ].filter((x) => `${x.title} ${x.subtitle}`.toLocaleLowerCase("cs-CZ").includes(query));
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(results.slice(0, 50))); return;
    }
    if (req.url?.startsWith("/v1/") && req.method !== "GET") {
      res.writeHead(501, { "content-type": "application/json" }).end(JSON.stringify({ code: "read_only_gateway", message: "Tato školní tabulka je připojena pouze pro čtení; změny a soubory se zatím neukládají." })); return;
    }
    res.writeHead(404, { "content-type": "application/json" }).end('{"message":"Not found"}');
  } catch (error) {
    console.error(error);
    res.writeHead(502, { "content-type": "application/json" }).end(JSON.stringify({ message: "Nepodařilo se načíst Google Sheets." }));
  }
});
server.listen(port, "127.0.0.1", () => console.log(`FleetCare Sheets gateway listening on 127.0.0.1:${port}`));
