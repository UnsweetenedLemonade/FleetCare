# Google Sheets gateway na VPS

Gateway v `server/sheets-gateway.mjs` je záměrně samostatný Node proces. Google service-account klíč zůstává na VPS; frontend zná pouze URL gateway. Gateway pro tuto první verzi používá Google Sheets REST API a existující tabulku `FleetCare DB`.

## Mapování současné tabulky

| List | Mapování do FleetCare |
|---|---|
| `vehicles` | `vehicle_id` → ID, `spz`, `brand_model` → model, `type` → kategorie, `year`, `vin`, `purpose`, `reserve`, `state`; `odometer_km` se vystaví jako stav tachometru. |
| `drivers` | `driver_id` → ID, jméno/kontakt/stav a `licence` + `licence_valid_until` → oprávnění; `vehicle_id` vytvoří aktuální přiřazení. |
| `deadlines` | `deadline_id`, `vehicle_id`, `deadline_type`, `valid_until`, `state`. |
| `trips` | `trip_id`, `vehicle_id`, `driver_id`, `order_number`, časy, místa, tachometr a stav. |
| `fuel` | `fuel_id`, vozidlo/řidič, datum, litry, částky v CZK, stanice a stav párování. Částka se převádí na haléře. |
| `settings` | `manager_email` → e-mail manažera. |

Ostatní listy `documents`, `reports`, `errors` nejsou zatím modelovány jako provozní evidence. Zakázky a další doménové kolekce se proto vracejí prázdné. Soubory se nepřenášejí z listu `documents`: `file_ref` není stream ani autentizovaný storage. Staré hodnoty jsou načítány jako importovaná data s verzí 1. Workspace se cachuje v paměti gateway po dobu 30 sekund, aby běžné hledání nečetlo všechny listy při každém dotazu. Gateway je zatím **jen pro čtení**; změnové, uploadové a job endpointy vrátí HTTP 501. Aplikace tak nemůže změny potichu ukládat do IndexedDB.

## Nastavení procesu na VPS

1. V Google Cloud projektu zapnout **Google Sheets API** a vytvořit service account. Vygenerovat JSON klíč a uložit ho na VPS mimo checkout repozitáře, například `/etc/fleetcare/google-service-account.json`; soubor omezit na čtení uživatelem gateway procesu.
2. Sdílet cílovou tabulku s hodnotou `client_email` ze service-account JSON jako **Čtenář**. ID tabulky je už ve sdíleném odkazu: `1x9KHpZiofd-2VK1T_LwJ1wRYnW9btzYn9nS6uwHnBPQ`.
3. Spustit gateway proces s proměnnými:

   ```dotenv
   PORT=8787
   GOOGLE_SHEET_ID=1x9KHpZiofd-2VK1T_LwJ1wRYnW9btzYn9nS6uwHnBPQ
   GOOGLE_APPLICATION_CREDENTIALS=/etc/fleetcare/google-service-account.json
   CORS_ORIGIN=https://adresa-frontendu.example
   ```

   V repozitáři není potřeba instalovat další balíček; používá se vestavěný Node.js HTTP server a `fetch`. Proces poslouchá pouze na `127.0.0.1`. Reverse proxy na VPS má přeposlat `/api/v1/*` na `127.0.0.1:8787/v1/*` (tedy odstranit prefix `/api`) a frontend servírovat na stejném originu, nebo nastavit přesnou hodnotu `CORS_ORIGIN`.
4. Frontend sestavit s `VITE_DATA_ADAPTER=http` a `VITE_API_BASE_URL=https://adresa-frontendu.example/api/v1`. Tyto proměnné jsou součástí veřejného buildu; nesmějí obsahovat klíč ani token. Změna `VITE_*` vyžaduje nový frontend build.
5. Ověřit `GET /health`, potom `/api/v1/workspace` a v prohlížeči načtení vozidel/řidičů. Google API chyby gateway vypisuje do procesu logu; health endpoint ověřuje jen proces, ne přístup ke Sheets.

Tato změna připravuje mapování a read-only demonstraci; nevytváří Google Cloud projekt/service account, nepovoluje API, nesdílí tabulku, nenasazuje VPS ani neinstaluje klíč. Před zápisy je třeba rozšířit schéma Sheets o verze a stabilní sloupce pro doménové DTO, implementovat kontrolu verzí/idempotenci a úložiště pro přílohy. Když má školní demo potřebovat jen načíst současná data, stačí výše uvedený read-only režim.
