# Architektura

FleetCare používá React 19, strict TypeScript, Vite, React Router 7, TanStack Query, Zod 4, Dexie, Lucide, ExcelJS a pdfmake. Závislosti jsou zamčené v package-lock.json. Nevyžaduje se placená knihovna ani externí účet. React Router používá BrowserRouter; hosting musí vracet index.html pro aplikační cesty.

Tok zápisu: komponenta → typovaný doménový příkaz → runtime schéma a oprávnění → repository → IndexedDB nebo HTTP gateway. `src/domain/commands.ts` obsahuje lokální provedení příkazů a je zároveň referenční specifikací pro backend. `rules.ts` řeší dostupnost, překryvy, A6 a rozsah řidiče. `analytics.ts` sjednocuje souhrny a exportní podklady. `ccs.ts` obsahuje konzervativní párování.

## Lokální režim

Dexie schéma verze 1 má tři object stores: `state` (konzistentní doménový snapshot), `files` (originální Blob dle storageKey) a `operations` (idempotentní klíče). Pro velikost 70 vozidel je atomický snapshot jednoduché a přezkoumatelné řešení. Nejde o návrh fyzického relačního schématu DB. Další migrace musí použít novou Dexie verzi a zachovat cizí ID. Binární soubory nejsou uvnitř snapshotu.

Každý příkaz načte snapshot a provede změnu v jedné IndexedDB transakci. Závada, její outbox a idempotentní klíč se zapíší společně. Při selhání zápisu transakce neohlásí úspěch. Přílohy mají vlastní metadata a Blob ve stejné transakci. Fyzické lokální smazání je podporováno pouze pro osobní dokumenty; metadata se znepřístupní přes deletedAt.

## API režim

Výběr adaptéru je výhradně v `src/app/config.ts`. Chybějící URL či neznámý adaptér způsobí chybu konfigurace. HTTP chyba nečte lokální DB. `/workspace` je jeden konzistentní, oprávněními omezený snapshot metadat pro pracovní prostor, bez souborů. Musí obsahovat celý rozsah, ze kterého FE počítá KPI a exporty; nikdy první stránku vydávanou za celek. Gateway má snapshot sestavit dávkově a cachovat podle identity, kontextu a verze dat. Komponenty ho čtou z Query cache; při navigaci se nevolá celé Sheets API znovu.

Toto rozhodnutí zjednodušuje konzistenci FE. Pro výrazně větší historii jízd doporučujeme další verzi portu s projekcemi seznamů a serverovými reporty/exporty, nikoli nepozorované oříznutí existující smlouvy. Globální hledání už má samostatný serverový endpoint `/search` a nezávisí na viditelné stránce. Stránkování a řazení běžných seznamů jsou nyní nad úplnou projekcí v klientu.

## Kontext, cache a soubory

ActorContext obsahuje právě jednu ze tří rolí a případné driverId. Při změně se zruší dotazy, odstraní workspace/search/file cache, zavřou dialogy a přejde se na povolenou cestu. Preference role v localStorage není přihlášení. Samotné provozní záznamy jsou pouze v IndexedDB. HTTP cookie má v budoucnu nést ověřenou identitu; `X-Actor-Context` je pouze požadovaný kontext, URL-encoded JSON.

Cache žije v paměti jednoho nakonfigurovaného adaptéru a je rozdělená podle režimu/role/řidiče. Změna prostředí vyžaduje nové spuštění konfigurace. Budoucí změna ověřené identity musí rovněž vyprázdnit QueryClient. Řidičův snapshot je omezen v repository a interní ceny/poznámky jsou odstraněny. FE omezení nenahrazují serverové oprávnění.

Náhled používá skutečný Blob a dočasnou ObjectURL. URL se uvolňuje při změně souboru nebo odchodu. Po smazání se invaliduje cache souborů. HTTP content endpoint vždy obnovuje oprávněný přístup podle stabilního documentId/storageKey; expirované podepsané URL se neukládají do modelu. Probíhající úloha se kontroluje nejvýše několika dotazy s backoffem; polling je na neaktivní záložce pozastaven a může se ručně obnovit.

## UI

Sdílené formulářové pole a validace patří do `components/ui.tsx`, definice formulářů do `features/editors.tsx`. Strukturovaná oprávnění, položky plánů, zastávky a časové vazby karet mají editovatelné řádky. Nativní dialog zajišťuje modalitu a fokus, kliknutí mimo ho nezavírá. Při neuložených změnách Escape vyžádá rozhodnutí a zachová připojený formulář. Tabulky mají sémantické odkazy, celoplošné kliknutí řádku a samostatné vnořené akce. Filtry jsou v URL; text hledání se uchovává v navigačním stavu, aby se osobní dotazy nepřenášely do URL.
