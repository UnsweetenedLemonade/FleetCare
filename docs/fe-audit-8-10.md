# Dávky 8–10

## A — hotovo

Příčina: Back přepisoval pevný `to` z `location.state.returnTo`, který tabulky přidávají pro kontext. Nešlo o history.back (žádný výskyt). Nyní společný Back vykresluje skutečný Link pouze na předaný pevný cíl. Původní umístění i popisky zachovány.

| Umístění | Před | Po |
| --- | --- | --- |
| VehiclePage | returnTo nebo /vehicles | /vehicles |
| DriverPage | returnTo nebo /drivers | /drivers |
| OrderPage | returnTo nebo /orders (/my/orders) | /orders (/my/orders pro řidiče) |
| TripPage | returnTo nebo /trips (/my/trips) | /trips (/my/trips) |
| FaultPage | returnTo nebo /faults (/my/requests) | /faults (/my/requests) |
| DeadlinePage | returnTo nebo /deadlines | /deadlines |
| FuelPage | returnTo nebo /costs/fuel (/my/fuel) | /costs/fuel (/my/fuel) |
| StatementPage | returnTo nebo /costs/statements | /costs/statements |
| TransactionPage | returnTo nebo /statements/:id | /statements/:id |
| ExpensePage | returnTo nebo /costs/expenses | /costs/expenses |
| DocumentPage | návrat z location.state nebo vlastník | ověřený parametr from v URL nebo vlastník |

Dokumenty: DocumentLink a proklik sdílené tabulky předávají zdrojovou cestu i query v URL. Bez kontextu je cílem detail vlastníka (vozidlo/řidič → Dokumenty, ostatní jejich detail, intake → Vozidla). Nepovolené/external/self adresy se nepoužijí. Název cíle se odvozuje z cesty a dostupné entity, nikoli z pomíjivého returnLabel.

Prokliky tabulek a odkazy mezi entitami již používaly push — již hotovo. Tabs používá Link/push (jedna položka na změnu záložky), filtry/sort/stránkování používají replace aktuálního query, aby nezaplnily historii. Další replace: main.tsx přihlášení/odhlášení/změna role a redirect řidiče; documents.tsx odchod po úspěšném smazání; reports.tsx a useHistory změny filtrů. Žádný entity drill-down nepoužívá replace.

Přes aplikační šipku se zachování filtrů/stránky nově neimplementuje. Browser Back uchovává URL záložky a query filtrů/stránky; textové hledání je lokální stav tabulky a jeho obnovení po remountu není zaručené. Aplikace nemá vlastní správu scroll restoration, takže ani scroll nelze garantovat. Toto chování není rozšiřováno.

Typecheck, lint a navigační testy prošly.
