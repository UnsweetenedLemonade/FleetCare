# UX dávka 2

Aktuální origin/main ověřen po fork sync: fdc4dca. Pracovní větev codex/ux-batch-2.

## A
- A1: blokuje Sheets gateway: workspace vrací services: [], execute končí 422 pro services. Správce BE musí potvrdit strukturu a existenci listu kontaktů a implementovat čtení/zápis s verzováním; správce tabulky zajistí schválený list. Bez znalosti tabulky nebyl nový list ani API vymyšlen. Lokální adaptér podporu má. Červené chyby zachovány.
- A2: X i Esc v potvrzení vracejí do formuláře bez ztráty dat; potvrzení je neutrální. ROZHODNUTÍ dle zadání.
- A3: již hotovo pro skutečné zakázky: OrderTable má Všechny stavy, Moje zakázky neomezuje stav; Přehled zahrnuje Probíhá. Sheets gateway však vrací orders: [], trips.orderId=null a order_number mapuje do purpose. ZK-2026-083 tak může být účel samostatné jízdy. Potřebné rozhodnutí vlastníka produktu/BE: skutečná zakázka s vazbou, nebo samostatná jízda. Bez něj nebyly entity směšovány.
- A4: gateway přebírá match_state bez transakcí. FE už nezobrazuje Rozdíl bez vazby a skutečné odchylky; akce již byla podmíněna odchylkami.
- A5: sdílený FilePicker přidává platné soubory, zachová předchozí výběr a vypíše jména odmítnutých s důvodem podle existujících limitů. C7: přidáno odebrání jednotlivého souboru.
