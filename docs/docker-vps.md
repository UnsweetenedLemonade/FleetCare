# Přenos a spuštění FleetCare na VPS přes Docker

Postup předpokládá Debian/Ubuntu, doménu směrovanou na VPS a přístup přes SSH. Nasazení spouští dvě služby: Nginx pro frontend/API proxy a Node gateway pro Google Sheets. Gateway není publikovaná na internet; obě služby komunikují v Docker síti. Google service-account JSON se mountuje jako Compose secret a není součástí image.

## 1. Připravte Google přístup

V Google Cloud zapněte Google Sheets API, vytvořte service account a stáhněte jeho JSON klíč. Tabulku sdílejte s jeho `client_email` jako Editor. Tento gateway ukládá pouze do sloupců existujících listů; podporované zápisy a omezení jsou v [sheets-vps.md](sheets-vps.md).

## 2. Nainstalujte Docker Engine a Compose

Postupujte podle oficiálního návodu pro [Debian](https://docs.docker.com/engine/install/debian/) nebo [Ubuntu](https://docs.docker.com/engine/install/ubuntu/). Nainstalujte také Compose plugin (balíček `docker-compose-plugin`) a ověřte:

```sh
sudo docker version
sudo docker compose version
```

## 3. Přeneste aktuální zdrojové soubory

Přenos proveďte z počítače, kde máte tento upravený pracovní strom. Změny zatím nejsou na GitHubu, proto samotný `git clone` nestačí. Na VPS nejprve připravte adresář a přidělte ho svému uživateli:

```sh
sudo mkdir -p /opt/fleetcare/app /opt/fleetcare/secrets
sudo chown -R "$USER":"$USER" /opt/fleetcare
```

Z místního počítače zkopírujte projekt bez `.git`, závislostí, buildu a lokálních env souborů. Nahraďte `uzivatel` a `vps.example.com` svými hodnotami:

```sh
rsync -av --exclude=.git --exclude=node_modules --exclude=dist --exclude='.env*' \
  /home/vojta/FleetCare/ uzivatel@vps.example.com:/opt/fleetcare/app/
```

## 4. Umístěte service-account klíč a vytvořte konfiguraci

Zkopírujte klíč samostatně mimo checkout, například:

```sh
scp /cesta/lokalni/google-service-account.json uzivatel@vps.example.com:/opt/fleetcare/secrets/google-service-account.json
```

Na VPS omezte přístup k souboru a připravte Compose env soubor:

```sh
chmod 600 /opt/fleetcare/secrets/google-service-account.json
cd /opt/fleetcare/app
cp deploy/fleetcare.env.example .env.docker
```

Upravte `/opt/fleetcare/app/.env.docker`, pokud je cesta ke klíči jiná. Má obsahovat:

```dotenv
GOOGLE_SHEET_ID=1x9KHpZiofd-2VK1T_LwJ1wRYnW9btzYn9nS6uwHnBPQ
GOOGLE_SERVICE_ACCOUNT_FILE=/opt/fleetcare/secrets/google-service-account.json
```

Nedávejte service-account JSON do `/opt/fleetcare/app` ani do Git repozitáře.

## 5. Sestavte a spusťte

Na VPS:

```sh
cd /opt/fleetcare/app
sudo docker compose --env-file .env.docker config
sudo docker compose --env-file .env.docker up --build -d
sudo docker compose ps
sudo docker compose logs --tail=100 gateway web
```

Nginx v kontejneru servíruje frontend a předává `/api/v1/*` gateway. Frontend používá relativní `/api/v1`, takže není třeba měnit build pro každou doménu. Compose vystavuje web jen na `127.0.0.1:8080`; port gateway 8787 není publikován.

## 6. Připojte doménu přes HTTPS reverzní proxy

Nasměrujte DNS `A` (případně `AAAA`) záznam domény na VPS. Pokud na hostu používáte Caddy, může jeho webový blok vypadat takto:

```caddyfile
fleetcare.example.cz {
    reverse_proxy 127.0.0.1:8080
}
```

Povolte z internetu porty 80 a 443 pro TLS proxy; porty 8080 a 8787 ponechte neveřejné. Pokud už VPS provozuje Nginx/Traefik, předejte požadavky pro doménu na `127.0.0.1:8080` a zachovejte běžné HTTP hlavičky. API zůstává na stejném originu jako frontend, takže CORS není potřeba.

Po úpravě Caddyfile načtěte konfiguraci:

```sh
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## 7. Ověřte propojení a aktualizujte aplikaci

Na VPS ověřte proxy lokálně:

```sh
curl -fsS http://127.0.0.1:8080/api/health
curl -fsS http://127.0.0.1:8080/api/v1/workspace
```

Pak otevřete `https://fleetcare.example.cz`, zkuste načtení evidence a vytvořte testovací změnu v podporované části. Změny se ukládají přímo do odpovídajícího listu. Chyba 403 obvykle znamená, že tabulka není sdílená s service accountem jako Editor; 501/422 značí akci nebo pole bez odpovídajícího listu/sloupce.

Při další změně zdrojů přeneste upravené soubory znovu přes `rsync` a spusťte:

```sh
cd /opt/fleetcare/app
sudo docker compose --env-file .env.docker up --build -d
```

Sestavení frontendového image proběhne na VPS. Tabulka je jediné datové úložiště této integrace; Docker volumes pro aplikační data nejsou potřeba. Pro návrat k předchozímu buildu zatím použijte Git/backup zdrojů a sestavte předchozí verzi; Compose konfigurace automatické verzování image nezavádí.
