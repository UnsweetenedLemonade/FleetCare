# Dávka 11

## 1 — hotovo

Před úpravou měla tabulka CCS výpisů pouze proklik řádku; PDF odkaz byl jen v detailu. Nový poslední sloupec bez hlavičky používá sdílený StatementPdfLink s existujícím DocumentLink, FileText ikonou a stejnou stránkou `/documents/:id` jako detail. Detail i tabulka sdílejí také filtr nesmazaných dokumentů vlastníka statement. Nová implementace náhledu/stažení nevzniká. DocumentLink vloží návratovou cestu do URL: z tabulky na seznam CCS výpisů, i po reloadu. Odkaz zastavuje propagaci; funguje klávesnice i standardní otevření odkazu v novém panelu. Bez dokumentu je disabled s title Soubor není k dispozici.

Detail dříve nabízel všechny nesmazané dokumenty, neoznačoval jeden jako hlavní. Zachováno: detail nabízí všechny ve stejném pořadí; tabulka otevírá první z nich. Žádná nová definice historických verzí. Akce by se mohla hodit v jiných tabulkách s přílohou, například u výdajů; ty se nemění. Typecheck, lint a související testy prošly.
