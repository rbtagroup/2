# RB TAXI – Výčetka (FIXED v9)

## Co je opraveno / vylepšeno
- **Kritická oprava JavaScriptu**: chybné složené závorky v části přepínání motivu způsobovaly padání skriptu („nefunguje“). Blok byl přepsán, doplněny konstanty `THEME_MODE_KEY` a `THEME_KEY` a sjednoceno ukládání do `localStorage`.
- **Doplněna funkce `updateThemeChrome()`**: správně aktualizuje `<meta name="theme-color">` pro světly/tmavý režim (lepší vzhled na iOS/Android).
- **PWA aktualizace**: změna `CACHE_NAME` na `rb-taxi-cache-v5` a verzování assetů na `?v=9`. Přidán „toast“ s informací o nové verzi a automatické `SKIP_WAITING` → zajištěn spolehlivý update bez zaseknuté cache.
- **UX drobnosti**: `inputmode="decimal"` u číselných polí pro rychlejší zadávání na mobilu.
- **Výpočet**: výpočetní logika zůstává podle vašeho popisu – vyplata = fix (plná/1/2) nebo 30 % z netto nad limitem; „K odevzdání“ = tržba – náklady – (kartou + faktura + jiné). Zobrazení **doplatku** pokud `tržba < (km × 15 Kč)`.

## Poznámka k instalaci/aktualizaci
Po nahrání nové verze do hostingu **obnovte stránku**. Pokud máte aplikaci nainstalovanou jako PWA, nová verze se nabídne přes černý proužek „K dispozici je nová verze…“. Klepnutím ji načtete.

— Build v9 (2025‑08‑19)
