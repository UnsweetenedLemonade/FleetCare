# UX dávka 2

Aktuální origin/main ověřen po fork sync: fdc4dca. Pracovní větev codex/ux-batch-2-cloud.

## A
- A1: blokuje Sheets gateway: workspace vrací services: [], execute končí 422 pro services. Správce BE musí potvrdit strukturu a existenci listu kontaktů a implementovat čtení/zápis s verzováním; správce tabulky zajistí schválený list. Bez znalosti tabulky nebyl nový list ani API vymyšlen. Lokální adaptér podporu má. Červené chyby zachovány.
- A2: X i Esc v potvrzení vracejí do formuláře bez ztráty dat; potvrzení je neutrální. ROZHODNUTÍ dle zadání.
- A3: již hotovo pro skutečné zakázky: OrderTable má Všechny stavy, Moje zakázky neomezuje stav; Přehled zahrnuje Probíhá. Sheets gateway však vrací orders: [], trips.orderId=null a order_number mapuje do purpose. ZK-2026-083 tak může být účel samostatné jízdy. Potřebné rozhodnutí vlastníka produktu/BE: skutečná zakázka s vazbou, nebo samostatná jízda. Bez něj nebyly entity směšovány.
- A4: gateway přebírá match_state bez transakcí. FE už nezobrazuje Rozdíl bez vazby a skutečné odchylky; akce již byla podmíněna odchylkami.
- A5: sdílený FilePicker přidává platné soubory, zachová předchozí výběr a vypíše jména odmítnutých s důvodem podle existujících limitů. C7: přidáno odebrání jednotlivého souboru.

## B1 odstraněné informační bannery
- `src/features/operations.tsx`: Odhad není skutečný náklad. Doložený výdaj z opravy zapište v Náklady a CCS. Provedené položky plánu zaznamenejte jednotlivě u vozidla.
- `src/features/operations.tsx`: Vytvoří se požadavek na e-mail. V lokálním režimu zůstane stav „Služba není připojena“.
- `src/features/reports.tsx`: {result.boundaryTrips} jízd překračuje hranici období. Jejich km bez rozděleného podkladu nejsou zahrnuty do měsíčního jmenovatele.
- `src/features/reports.tsx`: Rozdíl výnosů a vybraných provozních nákladů není čistý zisk. Nezahrnuje úplné účetní náklady firmy.
- `src/features/fuel-intake.tsx`: Zadejte vlastníka, čas, litry a částku podle účtenky. Údaje z obrázku se bez nakonfigurovaného OCR automaticky nevytěžují.
- `src/features/fuel-intake.tsx`: Neúplné tankování je uloženo. Při chybě přílohy můžete nahrání zopakovat bez vytvoření druhého záznamu.
- `src/features/costs.tsx`: Chybí jednoznačně spojený záznam řidiče. Vyberte podklad při řešení, nebo případ ponechte otevřený.
- `src/features/costs.tsx`: Vyberte jednoznačný podklad a částku, která bude jediným kanonickým nákladem. Samotná účtenka se znovu nepřičte.
- `src/features/editors.tsx`: Hlášení se uloží společně s oddělenými požadavky na komunikaci. E-maily v lokálním režimu nejsou odesílány.
- `src/features/editors.tsx`: Výdaj je uložen. Pokud nahrání přílohy selhalo, zopakujte uložení; nový výdaj nevznikne. Údaje výdaje lze poté upravit v jeho detailu.
- `src/features/fleet.tsx`: Profil je rozpracovaný. Doplňte pracovní kontakt a oprávnění.
- `src/app/layout.tsx`: „API režim — data z nakonfigurovaného rozhraní“ i lokální informační pruh; označení případného dema zachováno.
- `src/app/context.tsx`: automatické úspěchové zprávy „Změna byla uložena.“ a „Soubor byl uložen. Stav zpracování najdete u dokumentu.“
- `src/features/documents.tsx`: „Soubor je uložen. Extrakční služba není připojena; žádné údaje nebyly automaticky načteny.“ STK instrukce nyní obyčejný text u navazující akce. Chybějící údaje jsou červené upozornění.

## Výsledek dalších bodů
- A6/D6: jeden společný řádek ovládání obou režimů nad obsahem; kalendář má měsíc → předchozí → další vlevo. Společná minimální výška brání změně horního odsazení.
- B2: odstraněno „(metadata)“ z obou popisků sdíleného UploadDialog.
- B3: Button centrálně přidává plus u textu začínajícího Přidat, nahrazuje původní úvodní ikony (zejména Upload u Přidat dokument); chevron zůstává vpravo. Plus mají i rychlé akce Přidat vozidlo/řidiče.
- B4: společné Form a Field filtrují psaní i vložení, čárka/tečka u desetinných hodnot; tachometr, km, intervaly a dny jsou celé. Existující červené chyby zůstávají. Nové testy převodu vstupu.
- B5: počet výsledků přímo za hledáním (ROZHODNUTÍ); sdílené řazení akcí přes toolbar: historie, sekundární, primární poslední. Platí i pro dokumenty a přidělení. Existující destruktivní ukončení přidělení zachováno.
- B6: odstraněny redundantní titulky karet řidičských tabulek. Přehledový blok Moje aktuální zakázky zachován, protože není opakováním nadpisu stránky.
- B7: odstraněn kpi-dot ve společném Kpi.
- B8: menu i nadpisy Tankování/Závady, Nahlásit závadu, Zadat tankování; Naléhavost ve formulářích, tabulkách a detailu (ROZHODNUTÍ dle zadání).
- B9: již existující ChoiceButton byl použit i u řidiče; stejné volby Nahrát účtenku / Zadat manuálně. Samostatné tlačítko Nahrát účtenku odstraněno.
- C1: box role přesunut ze sidebaru do uživatelského menu v topbaru. Avatar, dostupné jméno, role, zavření klikem mimo/Esc, aria-expanded/haspopup. V HTTP režimu role/driverId pochází z autentizace přes repo.authenticate, jméno řidiče z workspace. Actor neobsahuje jméno manažera/vedení: zobrazena role, nikoli vymyšlená osoba. Pro skutečné jméno musí vlastník API doplnit identitu účtu. Lokální režim ponechává testovací přepínač v menu; nemá skutečné přihlášení/odhlášení. HTTP odhlášení je pouze v menu.
- C2: startKm již byl při startu povinný. Ukončení řidičem: skrytý driverId automaticky z aktéra, startKm disabled, endKm povinný, Poznámka. Párové pořadí míst, dat a tachometrů i pro manažera. Trip.note se přebírá beze změny; Sheets do něj mapuje source, takže může obsahovat technickou hodnotu „Řidič“.
- C3: validace závady zachována, změny sdílených polí a názvů použity.
- C4: driverId skryt v manuálním i účtenkovém formuláři pro řidiče, automaticky odeslán. V detailu jízdy pole Řidič existuje a zůstalo zachováno.
- C5: filtr Všichni řidiči skryt v řidičských jízdách; další řidičské tabulky tento filtr nemají.
- C6: sloupec Zakázka / jízda s odkazem (ROZHODNUTÍ). Akce Doplnit tachometr otevírá společný dialog s kontextem a povinným koncovým km, se zachováním rozpracovaných změn. Po uložení odpadá úkol odvozený z chybějícího km.
- C7: společný picker obsahuje odebrání, chyby a existující limity 10 souborů, 20 MB úložiště, 5 MB extrakce, PDF/JPG/PNG; CCS pouze PDF.
- C8: Stav tankování v DataGrid. Jízda a závada mají volný chip nad údaji, zůstaly beze změny. Termín již měl stav v mřížce.
- D1: neúplná ukončená jízda má kromě koncového km ostatní pole disabled; hodnoty jsou při odeslání zachovány.
- D2: UploadDialog při pevně zvoleném STK neukazuje Typ dokumentu, implicitní STK zůstává.
- D3: Vytvořit individuální plán vpravo v toolbaru servisní tabulky, původní text zachován.
- D4: jedna tabulka jízd a doložených odečtů. ROZHODNUTÍ: společné sloupce Datum, Tachometr (km), Zdroj; u jízdy koncový tachometr, pokud chybí počáteční; zdroj obsahuje odkaz a trasu jízdy. Odečty používají vlastní datum/km/zdroj. Nevznikají nové datové objekty.
- D5: Typ jako text, pozastavení řidiče destruktivní tlačítko.
- D6: termín má odkaz na vozidlo/řidiče, pokud je určen ručním termínem nebo zdrojovou jízdou/odkazem. Firemní odpovědnost „Fleet manažer“ nemá driverId, proto zůstává textem. Odvozená chybějící km řeší společný dialog (ROZHODNUTÍ). Ostatní odvozené termíny zachovávají odkaz na zdroj; ruční termín editor.
- D7: select Ano/Ne pro aktivní CCS kartu s výchozím Ano, záložka Upozornění, bez pomocných textů; opakovatelné číselné řádky dnů s odebráním. Formát daysBefore zůstává number[]/null. Přidat servisní plán i navazující dialog (ROZHODNUTÍ), jiné názvy šablon nezměněny.
- E1: společný export bez poznámky o dalších stránkách a bez lokálního štítku; v dialogu dvě pole na řádek dle zadání, na mobilu jeden sloupec.
- E2: karta odstraněna z Reportů. Přehled nákladů ji již neměl (již hotovo); Dashboard ji neměl.
- F: žádná nová Moje vozidla, žádné nové podmínky zahájení jízdy.

## Rozsah, ověření a omezení
Pracovní větev je **codex/ux-batch-2-cloud**. Původní název větve již na remote existoval; nic nebylo přepsáno ani force pushnuto.
Nutná změna lokální doménové logiky: doplnění koncového km u Ukončena neúplná převede stav na K ověření. Test aktualizován podle tohoto požadavku. Backend, API a datové modely nebyly změněny. Sheets gateway stejný zápis přijímá přes existující data.state; připojení k reálné tabulce nebylo ověřeno.

Ověřeno: typecheck, lint, 50/50 testů (13 souborů), produkční build. HTTP testy vyžadovaly spuštění mimo omezení sandboxu pro lokální listen; po povolení prošly. Build upozorňuje na existující velké chunky. Browser Chromium: desktopový Přehled, mobil 390×844 bez vodorovného přetoku, X potvrzení zachová rozepsaný formulář, řidičský režim ukončení jízdy, blokování písmen, 12 souborů přijme 10 a vypíše jména odmítnutých, odebrání souboru. Nešlo o úplnou vizuální kontrolu všech stránek a rolí ani reálných Sheets/Make služeb. A1 a integrace A3 zůstávají externími blokery popsanými výše; úplné jméno účtu vedení/manažera není dostupné v současném API.

Cloud onboarding: nainstalováno npm ci s lockfile beze změny. Do draftu uloženy install_script a start_skill pro /workspace/FleetCare a lokální Vite workflow. Draft není publikovaný snapshot; uživatel zkontroluje/uloží změny v nastavení prostředí a následně prostředí publikuje. Použité dovednosti: cloud-environment-onboarding:setup a cloud-environment-runtime.
