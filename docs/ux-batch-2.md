# UX dávka 2

## A – chyby

- A1: externí blokátor Sheets gateway (`server/sheets-gateway.mjs`, odmítnutí `save/services`). Čtení vrací `services: []`. Lokální adaptér kolekci podporuje. Správce tabulky a vlastník gateway musí dohodnout list pro kontakty, jeho záhlaví a mapování čtení/zápisu včetně identity a verzování. Současná dokumentovaná tabulka takový list nemá. Bez dohody nevytváříme nový BE ani list; červená chyba zůstává.
- A2: X i Escape při potvrzení vracejí do formuláře bez ztráty dat. ROZHODNUTÍ: stejné jako „Pokračovat v úpravách“. Potvrzení je neutrální.
- A3: již hotovo pro skutečné zakázky: `scopedWorkspace` filtruje podle řidiče, nikoli data/stavu; Moje zakázky zobrazují všechny, výchozí filtr „Všechny stavy“. Sheets gateway však vrací `orders: []`, `trips.order_number` mapuje na `Trip.purpose`, `orderId: null`. Příklad ZK-2026-083 tak může být samostatná jízda. Rozhodnout musí produktový vlastník s integrátorem, zda zdroj doplní skutečné zakázky a vazby; nové slučování entit neimplementováno.
- A4: zdrojové `fuel.match_state` může uvést „Rozdíl“, přestože gateway vrací prázdné transakce. Detail bez transakce ukáže „Čeká na výpis“. Tlačítko řešení již bylo vázáno na skutečné rozdíly transakcí. Stav přesunut do mřížky (C8).
- A5: sdílený FilePicker přijímá platné soubory, odmítnuté jmenuje s důvodem pod dropzónou. Limity z `fileLimits`, extrakce 5 MB, úložiště 20 MB, max. 10. Přidáno odebrání souboru (C7).
- A6: kalendář má ovládání v jediném toolbaru, měsíc → předchozí → další, historie před primární akcí (také D6).

Kontroly po A: typecheck a lint prošly.

## B1 – odstraněné informační hlášky

- `src/features/operations.tsx`: Odhad není skutečný náklad. Doložený výdaj z opravy zapište v Náklady a CCS. Provedené položky plánu zaznamenejte jednotlivě u vozidla.
- `src/features/operations.tsx`: Vytvoří se požadavek na e-mail. V lokálním režimu zůstane stav „Služba není připojena“.
- `src/features/editors.tsx`: Hlášení se uloží společně s oddělenými požadavky na komunikaci. E-maily v lokálním režimu nejsou odesílány.
- `src/features/fuel-intake.tsx`: Vyberte vlastníka a skutečný čas transakce. Litry ani částku z nepřipojené extrakce nedoplňujeme. Neúplný záznam pak můžete doplnit ručně.
- `src/features/costs.tsx`: Vyberte jednoznačný podklad a částku, která bude jediným kanonickým nákladem. Samotná účtenka se znovu nepřičte.
- `src/features/reports.tsx`: {result.boundaryTrips} jízd překračuje hranici období. Jejich km bez rozděleného podkladu nejsou zahrnuty do měsíčního jmenovatele.
- `src/features/reports.tsx`: Rozdíl výnosů a vybraných provozních nákladů není čistý zisk. Nezahrnuje úplné účetní náklady firmy.
- `src/features/documents.tsx`: Soubor je uložen. Extrakční služba není připojena; žádné údaje nebyly automaticky načteny.
- `src/features/documents.tsx`: STK pro nové vozidlo: originál čeká na připojené zpracování. Vozidlo můžete založit ručně a následně dokument připojit.
- `src/app/layout.tsx`: API režim — data z nakonfigurovaného rozhraní; Lokální režim — data jsou uložena v tomto prohlížeči. Demo označení ponecháno.

## B – sdílené změny

- B1: odstranění informačních hlášek viz seznam výše. Akční upozornění na chybějící údaje, nedostupné vozidlo a opakování uploadu ponechána ve varovné variantě; červené chyby zachovány.
- B2: odstraněno „(metadata)“ ze společného upload dialogu.
- B3: sdílený Button přidává plus před „Přidat“, nahrazuje původní úvodní ikony včetně uploadu u dokumentu; chevron zůstává vpravo.
- B4: společný NumericInput blokuje neplatné psaní i vložení; celé hodnoty používají numeric, desetinné decimal, podporuje tečku i čárku. Generované formuláře i ruční pole servisních intervalů používají tutéž komponentu. Validace a její červené zprávy zachovány.
- B5: ROZHODNUTÍ počet výsledků přímo za hledáním. Sdílená tabulka řadí historii před sekundárními akcemi a primární akci nakonec, včetně dokumentů a přidělení.
- B6: sdílený Panel potlačuje redundantní nadpisy tabulek pracovního prostoru řidiče. Ostatní hlavní tabulkové stránky již nemají duplicitní nadpis karty.
- B7: zelený čtvereček odstraněn v jednom společném KPI.
- B8: Tankování/Závady v navigaci a titulku řidiče, Nahlásit závadu / Zadat tankování v dialozích, Naléhavost v popiscích. ROZHODNUTÍ: cílový název Naléhavost.
- B9: řidič má jediný ChoiceButton „Zadat tankování“ s volbami Nahrát účtenku / Zadat manuálně, stejná komponenta jako vozidla a manažerské tankování. Sdílený ChoiceButton, HistorySwitch, vlastní FilePicker a tužky „Upravit“ již existovaly; použití na požadovaných místech ještě hotové nebylo.
