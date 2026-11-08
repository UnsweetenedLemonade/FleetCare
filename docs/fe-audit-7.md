# FE audit 7

## 1. CCS — hotovo

Před úpravou: seznam/detail tankování již používaly `fuelState`, položka Stav v detailu již hotovo; nabídky byly duplikované, bez centrálních metadat.

Seznam doložen v `FleetCare_zadani_oficialni_FE.md`, §5.7 (původně ř. 322). Aktuální nabídka podle této dávky: Čeká na výpis, Spárováno, Rozdíl, Chybí záznam řidiče, Neúplný podklad, Vyřešeno. Jediný zdroj FE popisků, barev a selectů/filtrů: `src/lib/status.ts`; společný `StatusChip` používají tankování i transakce. Stejný FuelTable/FuelPage slouží všem rolím.

Historický nejednoznačný stav a neznámé hodnoty se v UI zobrazí i filtrují jako Neúplný podklad. Týká se starých tankování a CCS transakcí, včetně přehledu priorit. Automatické párování při nejednoznačné shodě již ukládá Neúplný podklad, nikdy svévolně nepřiřadí kandidáta. Žádná migrace dat.

Kompatibilní výjimka z odstranění textu: starý literál zůstává výhradně v existujícím `matchStates` datovém schématu, kompatibilním čtení `match_state` v `server/sheets-store.ts` a generovaných API/event schématech. Odstranění by porušilo výslovný požadavek neměnit model/API a znemožnilo načtení starých záznamů. Není v nabídce, filtru, chipu ani nové hodnotě párování. Závazný seznam v zadání aktualizován podle této dávky.

Rozdíl se zobrazuje pouze při existující spojené transakci s nevyřešenými rozdíly. Samotná stará uložená hodnota Rozdíl bez důkazu se zobrazí jako Čeká na výpis (bez spojení) / Spárováno (se spojením). Rozhodnutí o rozdílu nemění kanonický náklad.

Kontroly: typecheck, lint a související CCS/UX testy.

## 2. Editace tankování — hotovo

Před úpravou: správní dialog neměl CCS select. Nyní Upravit údaje otevře společný editor s předvyplněným efektivním CCS stavem a nabídkou z bodu 1. Pole je pouze pro Fleet manažera a Vedení; Řidič stav již viděl v seznamu/detailu, ale neupravoval ho, proto mu nové správní pole nepřidáváme. Při založení tankování se chování nemění.

Ruční změna používá existující `FuelRecord.state` a příkaz `save`, ne nové pole. Uložená hodnota je výchozí; existující nevyřešený rozdíl spojené transakce má v UI vždy přednost. Zvolit Rozdíl bez odpovídajícího spojení/neshody editor odmítne červenou chybou pole. Ruční volba nemění stav transakce, neřeší finanční neshodu a neobchází samostatné CCS rozhodnutí. Existující invalidace workspace po `run` již hotovo; detail i tabulka čtou stejný zdroj. Bez změny API/modelu/serveru. Kontroly: typecheck, lint, 8 souvisejících testů.
