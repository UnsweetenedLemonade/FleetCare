# FleetCare · statický klikací prototyp

**Otevři `index.html` v prohlížeči.** Nic se neinstaluje. Není potřeba server, internet, build, přihlášení ani přístupové klíče. Soubor `index.html` ponech ve stejné složce jako `styles.css`, `mock-data.js` a `app.js`.

## Orientace

Levý panel obsahuje všech 11 hlavních sekcí. Záznamy v tabulkách vedou na související detaily. Detaily mají vlastní záložky; fungují také tlačítka Zpět/Vpřed v prohlížeči a adresy s `#`. Na mobilu otevře navigaci tlačítko vlevo nahoře. Široké tabulky a záložky lze posouvat vodorovně.

V horní liště lze přepnout šest ukázkových rolí. **Řidič má samostatný pohled Jana Nováka** s vlastním vozidlem, zakázkami, jízdami, formuláři a požadavky. Neobsahuje cizí osobní dokumenty, ceny zakázek, interní schvalování ani ekonomické reporty. Přepínač není zabezpečení; ostatní role používají společný prezentační pracovní prostor.

Hledání a filtry v seznamech mění zobrazené demo záznamy. Globální hledání otevře výsledky po Enteru. Vozidla a dokumenty umožňují přepnout i prázdný stav. Dialogy lze zavřít křížkem, klávesou Escape nebo kliknutím na pozadí. Tabulátor zůstává uvnitř otevřeného dialogu.

## Připravené prezentační cesty

1. **STK → vozidlo:** Přehled → Nahrát STK → čtyři kroky průvodce → Otevřít ukázku kontroly → originál a předpřipravené údaje → Potvrdit údaje → náhled následného kroku → Otevřít vozidlo a servisní plán. V záložce STK jsou oddělené stávající potvrzené datum a nový neověřený návrh.
2. **Zakázka → přiřazení:** Zakázky → ZK-2026-084 → Přiřadit vozidlo a řidiče. Je vidět vhodný Actros, samostatný výběr řidiče, časová dostupnost i pět nevhodných vozidel s důvody. Tlačítko Přiřadit otevře návrh rozhodnutí.
3. **Řidič → provoz:** Zobrazit jako: Řidič → Moje vozidlo / Moje zakázky / Moje jízdy. Otevři Zahájit jízdu, Ukončit jízdu, Nahlásit závadu a Zadat tankování. Formuláře zobrazí náhled zadaných údajů.
4. **Servis → schválení:** Servis a závady → Vibrace při brzdění → Otevřít servis → Schválení dražší opravy A10. Odhad 42 800 Kč patří demo opravě; schvalovací limit zůstává Nutno nastavit. Z detailu servisu lze otevřít konfliktní zakázku ZK-2026-082.
5. **CCS → neshoda:** Náklady a CCS → CCS výpisy → Otevřít transakce → Párovací výjimka. Porovnej řidičských 2 433,60 Kč s CCS 2 483,60 Kč. Další případy ukazují shodu 1:1, dvě možné shody, neúplný podklad, chybějící účtenku a pozdní výpis.
6. **Manažerský dohled:** Přehled → prioritní úkol → zpět → M2 v monitoringu → detail chyby → Reporty → Měsíční report A8 → Zobrazit podklady.

## Obsažené oblasti

| Oblast | Obsah |
|---|---|
| Přehled | KPI ze šesti demo vozidel, prioritní úkoly, termíny, dokumenty, monitoring, rychlé akce a profil firmy |
| Vozidla | Seznam, deset záložek detailu, kapacity a jednotky, STK, pojištění, servisní plán, přidělení, nájezdy, jízdy, náklady a historie |
| Řidiči | Čtyři profily, oprávnění a jejich platnosti, kvalifikace, stav zdravotního ověření bez diagnóz, dokumenty a historie |
| Zakázky | Šest zakázek, formulář, ruční příjem / dokument / ukázka e-mailu, zastávky, časová okna, realizace, doručení, rozdělení výnosů a přiřazení |
| Kniha jízd | Skutečné časy a tachometry, neúplná jízda, pracovní cesta bez zakázky, import / export a správná časová podmínka A6 |
| Servis | Oddělené závady a objednávky, opakované případy, externí partneři, blokace vozidla, priority, cenové odhady, stavy a schválení |
| Náklady | Tankování, CCS výpisy, porovnání podkladů, výjimky, ostatní výdaje, úhrady a storna / korekce |
| Dokumenty | Fronta, typy a stavy, vícestránkové přílohy, průvodce, ilustrační originál, editovatelná pole a nejisté / chybějící hodnoty |
| Termíny | Seznam, říjnový / listopadový kalendář, příjemci, kanály a ilustrační historie upozornění |
| Reporty | Náklady, km, spotřeba, náklady/km, výnosy, využití, servisy, monitoring a měsíční report s omezeními podkladů |
| Nastavení | Katalog a rozdíly verzí plánů, návrhové prahy, A9/A10 k nastavení, CCS karty, role, číselníky a nenastavené integrace |

Automatizace A1–A6 a A8–A10 mají konkrétní ukázku výsledku i lidského rozhodnutí. Volitelně je přidán předávací checklist A7. Monitoring M1 a M2 je pouze ukázkový. M2 má denní běh v 06:00 času ČR, příjem po tomto běhu čeká do dalšího dne.

## Demo data a hranice prototypu

- Provozní evidence obsahuje **6 vozidel, 4 řidiče, 6 zakázek, 5 jízd, 3 závady včetně historie, 3 servisní požadavky a 4 tankování**. Jde o fiktivní údaje k demonstraci. Náhledy osobních dokumentů nejsou imitace skutečných průkazů.
- Počty 70 vozidel a 65 zaměstnanců jsou pouze kontext plánovaného rozsahu firmy, oddělený od evidence. Rezervní DAF je připraven k provozu; není odstaven.
- Všechny formuláře pracují pouze s právě zobrazeným návrhem. **Ukládání, skutečné schválení, import, export, OCR, výpočty vhodnosti, rezervace, odesílání a integrace nejsou implementovány.** Potvrzovací akce zobrazují náhled nebo výslovnou informaci o budoucí dostupnosti, nikoli falešný úspěch.
- Výběr souboru soubor neodesílá ani neanalyzuje. Následná kontrola otevírá předpřipravený ilustrační vzor pro vybraný typ. Žádný původní soubor se nepřevádí do náhledu. Pracovní smlouvy a provozní přílohy mají náhled ruční kontroly.
- Změny formulářů ani role nepřežijí obnovení stránky. Nepoužívá se localStorage, cookies, síťové API, databáze ani účty.
- Grafy a měsíční souhrny jsou předem připravené ukázky, nikoli účetní výpočty z knihy jízd. Reportové filtry mění tabulkový výřez; horní karty a grafy jsou výslovně označený říjnový souhrn. Jiné období nemá demo podklady. Neúplné palivové úseky nelze vydávat za doloženou spotřebu.
- Jedna spárovaná účtenka a CCS transakce představují jeden náklad. Odhady budoucích oprav nejsou součástí skutečných provozních výdajů. Výnosy v různých stavech jsou oddělené; rozdíl výnosů a vybraných nákladů není čistý zisk.
- Návrhové prahy 30/14/7 dnů, 500 km a tolerance 0,99 Kč včetně nejsou potvrzené. Pravidla A9 a limity A10 zůstávají Nutno nastavit. Přínosy projektu neobsahují vymyšlené úspory, ROI ani návratnost.

## Soubory

- `index.html` – lokální vstupní stránka a načtení zdrojů.
- `styles.css` – vizuální systém, responzivní rozvržení a dialogy.
- `mock-data.js` – fiktivní provázané záznamy.
- `app.js` – obrazovky, hash navigace, záložky, filtry, formuláře a náhledy.

Všechny ikony jsou vložené SVG bez externích knihoven. Pro desktop, tablet a mobil jsou připravené odlišné šířky rozvržení. Případný lokální HTTP server je pouze pomůcka pro kontrolu a není podmínkou spuštění.

## Ověření

Prototyp byl prokliknut v prohlížeči přes lokální HTTP náhled, včetně hlavní navigace, záložek, šesti prezentačních scénářů a mobilního pohledu řidiče. Dále prošla kontrola syntaxe JavaScriptu a 216 kombinací vykreslení obrazovek, detailů, formulářů a rolí. Přímé otevření `file://` nebylo možné automaticky ověřit, protože tento protokol kontrolní prohlížeč blokuje. Implementace používá klasické lokální skripty a nevyžaduje síťové požadavky ani moduly.
