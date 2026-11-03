# UX dávka 2

## A – chyby

- A1: externí blokátor Sheets gateway (`server/sheets-gateway.mjs`, odmítnutí `save/services`). Čtení vrací `services: []`. Lokální adaptér kolekci podporuje. Správce tabulky a vlastník gateway musí dohodnout list pro kontakty, jeho záhlaví a mapování čtení/zápisu včetně identity a verzování. Současná dokumentovaná tabulka takový list nemá. Bez dohody nevytváříme nový BE ani list; červená chyba zůstává.
- A2: X i Escape při potvrzení vracejí do formuláře bez ztráty dat. ROZHODNUTÍ: stejné jako „Pokračovat v úpravách“. Potvrzení je neutrální.
- A3: již hotovo pro skutečné zakázky: `scopedWorkspace` filtruje podle řidiče, nikoli data/stavu; Moje zakázky zobrazují všechny, výchozí filtr „Všechny stavy“. Sheets gateway však vrací `orders: []`, `trips.order_number` mapuje na `Trip.purpose`, `orderId: null`. Příklad ZK-2026-083 tak může být samostatná jízda. Rozhodnout musí produktový vlastník s integrátorem, zda zdroj doplní skutečné zakázky a vazby; nové slučování entit neimplementováno.
- A4: zdrojové `fuel.match_state` může uvést „Rozdíl“, přestože gateway vrací prázdné transakce. Detail bez transakce ukáže „Čeká na výpis“. Tlačítko řešení již bylo vázáno na skutečné rozdíly transakcí. Stav přesunut do mřížky (C8).
- A5: sdílený FilePicker přijímá platné soubory, odmítnuté jmenuje s důvodem pod dropzónou. Limity z `fileLimits`, extrakce 5 MB, úložiště 20 MB, max. 10. Přidáno odebrání souboru (C7).
- A6: kalendář má ovládání v jediném toolbaru, měsíc → předchozí → další, historie před primární akcí (také D6).

Kontroly po A: typecheck a lint prošly.
