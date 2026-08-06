# Zadání: Interaktivní 3D model sluneční soustavy

## 1. Cíl

Webová aplikace běžící v prohlížeči (desktop), zobrazující interaktivní 3D model sluneční
soustavy. Uživatel může scénou volně procházet (rotovat, přibližovat, oddalovat), prohlížet si
planety a jejich měsíce s reálnými texturami, a po kliknutí na název objektu zobrazit jeho
základní fyzikální a orbitální údaje.

## 2. Rozsah objektů

Zahrnuto (stav k dokončení první verze):
- **Slunce** (vlastní textura, popisek, info panel)
- **8 planet**: Merkur, Venuše, Země, Mars, Jupiter, Saturn, Uran, Neptun
- **19 přirozených měsíců** (konečný seznam):
  - Země: Měsíc
  - Mars: Phobos, Deimos
  - Jupiter: Io, Europa, Ganymed, Callisto (Galileovské měsíce)
  - Saturn: Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus
  - Uran: Miranda, Ariel, Umbriel, Titania, Oberon
  - Neptun: Triton
  - Pluto: Charon
- **Prstence** u Saturnu (výrazné, s texturou), Uranu a Neptunu (jemné, jednobarevné
  poloprůhledné - pro tyto dva není volně dostupná fotorealistická textura prstence)
- **Pluto** jako trpasličí planeta (typ `dwarfPlanet`, vizuálně odlišený popisek), s měsícem
  Charon. Zbylé čtyři drobné měsíce Pluta (Styx, Nix, Kerberos, Hydra) nejsou zahrnuté.

Mimo rozsah (v této verzi):
- Ostatní trpasličí planety (Ceres, Eris, Haumea, Makemake...)
- Pás asteroidů, kometární objekty (plánováno pro další iteraci)
- Sondy, umělé satelity

> Poznámka: Uran a Neptun často bývají v jednoduchých modelech opomíjeny nebo zjednodušeny —
> v tomto projektu musí být zahrnuty se stejnou úrovní detailu (textura, prstenec, měsíce,
> info panel) jako ostatní planety.

## 3. Měřítko a pohyb

**Měřítko** (implementováno v `src/scene/scale.ts`) je záměrně nerealistické, protože jedno
jediné lineární měřítko nedokáže zobrazit najednou reálný poměr velikostí i vzdáleností (Slunce
je ~10× větší než Jupiter, ale Jupiterova dráha je ~1050× větší než poloměr Slunce):

- **Velikosti planet a měsíců**: lineární měřítko, reálné poměry mezi sebou jsou zachovány
  přesně (Měsíc je stejně jako ve skutečnosti ~27 % poloměru Země atd.).
- **Slunce**: záměrně vyňato z lineárního měřítka a nastaveno pevnou konstantou tak, aby
  zůstalo viditelně největší těleso (větší než Jupiter/Saturn), ale nezasahovalo do Merkurovy
  dráhy.
- **Vzdálenosti planet od Slunce**: mocninná komprese reálné vzdálenosti v AU (exponent 0.6),
  aby byly všechny dráhy v jedné scéně rozumně dostupné.
- **Vzdálenosti měsíců od planety**: vychází ze skutečného poměru (vzdálenost měsíce / poloměr
  planety), mocninně zkomprimovaného a přeškálovaného do bezpečného rozsahu na planetu (aby se
  např. Saturnův vzdálený Iapetus nedostal až k dráze Jupiteru). Pořadí a přibližný relativní
  odstup měsíců od sebe odpovídá realitě, absolutní vzdálenosti ne.

**Pohyb:**
- Planety a měsíce animovaně obíhají (kolem Slunce, resp. kolem planety) i rotují kolem vlastní
  osy; rychlosti navzájem odpovídají reálným poměrům (při libovolném zrychlení/zpomalení).
- **Počáteční poloha při spuštění aplikace odpovídá reálnému aktuálnímu datu** — natočení drah
  planet se při startu spočítá z Keplerových dráhových elementů (`src/scene/ephemeris.ts`,
  platnost přibližně 1800–2050). Měsíce mají počáteční fázi náhodnou (u nich by přesný výpočet
  vyžadoval další sadu dráhových elementů, které nejsou součástí této verze).
- **Ovládací prvky času** (dole uprostřed): Pauza/Play, posuvník rychlosti (logaritmický rozsah
  0,01–200 simulovaných dní za sekundu, výchozí hodnota 0,05 dne/s).
- Sklon osy planety zůstává pevný v prostoru nezávisle na poloze na dráze (technika
  proti-rotace v `tiltGroup`, viz `src/scene/sceneBuilder.ts`) - stejně tak se prstenec netočí
  spolu s (mnohem rychlejší) denní rotací planety.
- Vázaně rotující měsíce (což je v aktuálním datasetu naprostá většina, realisticky) na 3D síti
  nemají samostatnou animaci rotace - "otočení k planetě" vyplývá automaticky z toho, že jsou
  součástí otáčející se hierarchie kolem planety. V info panelu je doba rotace uvedena správně.

## 4. Interakce a UI

- **Volná kamera**: rotace pohledu, zoom kolečkem myši / touchpadem, posun (pan) - `OrbitControls`
  napojené na canvas (ne na vrstvu popisků, viz poznámka v sekci 9).
- **Zoom až na úroveň textury planety** — při přiblížení na konkrétní planetu/měsíc jsou patrné
  detaily povrchové textury. Klik na název/těleso navíc automaticky přesune a přiblíží kameru
  k danému tělesu (kamera dál sleduje jeho pohyb po dráze, dokud uživatel nevybere jiné těleso
  nebo nestiskne Home).
- **Popisky názvů** (name labels) u každé planety a každého zobrazeného měsíce, přes
  `CSS2DRenderer` — vizuálně odlišené podle typu (hvězda/planeta/měsíc velikostí a barvou textu).
- **Klik na název objektu** (nebo přímo na těleso) → zobrazí info panel s údaji o objektu (viz
  níže) a přiblíží na něj kameru. Panel lze zavřít křížkem nebo klávesou Escape.
- Měsíce jsou u planety zobrazeny vždy (obíhají planetu), nezávisle na tom, zda je uživatel
  přiblížen.
- **Navigační panel vlevo nahoře**:
  - tlačítko **Home (⌂)** — resetuje kameru na výchozí pohled a zruší zaměření na těleso (pro
    případ, že se uživatel "ztratí" v zoomu)
  - zobrazení aktuálního simulovaného data
  - políčko pro skok na libovolné datum + tlačítko **Dnes** (návrat k reálnému aktuálnímu datu)

## 5. Informace o objektu (info panel)

Pro každou planetu/měsíc/Slunce zobrazit minimálně:
- Název (česky i případně anglicky)
- Hmotnost
- Poloměr / průměr
- Oběžná doba kolem Slunce (u měsíců: kolem planety)
- Doba rotace kolem vlastní osy (délka dne)
- Vzdálenost od Slunce (u měsíců: od planety) — reálná hodnota, i když ve scéně zobrazeno
  zkráceně
- Počet měsíců (u planet)
- Krátký popis / zajímavost

Zdroj dat: reálná astronomická data (NASA/JPL, popř. nineplanets.org a podobné důvěryhodné
zdroje). Data se **sestaví jednou předem do statického datového souboru** (JSON) v rámci
implementace — aplikace netahá data z internetu za běhu.

## 6. Technologie

- **Renderer**: Three.js (WebGL), čistý JS/TypeScript bez React wrapperu
- **Build nástroj**: Vite + TypeScript
- **Popisky (name labels)**: `CSS2DRenderer` (součást Three.js)
- **Info panel**: HTML/CSS overlay nad canvasem, plněný z lokálního JSON datasetu
- **Ovládání kamery**: `OrbitControls` (Three.js)
- **Textury** (`public/textures/`), dva zdroje:
  - Slunce, 8 planet, Zemský Měsíc, prstenec Saturnu, hvězdné pozadí: solarsystemscope.com
    (CC licence), rozlišení 2K.
  - Ostatních 18 měsíců (bez Charonu): globální mapy z Wikimedia Commons pocházející z misí
    NASA Voyager/Cassini (public domain, díla NASA), sjednocené na 2048×1024 px. U map, jejichž
    zdrojový poměr stran nebyl přesně 2:1 (např. Tethys, Enceladus, Phobos), došlo při
    sjednocení rozlišení k mírnému natažení textury u pólů - kosmeticky přijatelné, ale je to
    známé zjednodušení, ne chyba.
  - Pluto a Charon: globální mozaiky z mise New Horizons (NASA/JPL/SwRI), staženo z Wikimedia
    Commons a sjednoceno na 2048×1024 px. Pluto (`2k_pluto.jpg`) - kompozitní mapa CC BY-SA 4.0
    (autor Renerpho, NASA/Hubble data). Charon (`moon_charon.jpg`) - public domain mapa NASA;
    New Horizons nezobrazil jižní polokouli Charonu (byla v té době ve stínu), chybějící pás
    proto byl dopočítán zrcadlením podle nejbližší zmapované oblasti (postup ve stejném duchu
    jako jiná zde uvedená kosmetická zjednodušení, ne skutečná data).
- **Hosting**: statická aplikace (žádný backend); zatím běží jen lokálně, nasazení na GitHub
  Pages / Netlify / Vercel zatím neproběhlo (projekt zatím není ani v gitu).

## 7. Cílová platforma

Primárně **desktop** prohlížeče (Chrome/Firefox/Edge, aktuální verze). Mobilní/tablet podpora
není v této verzi vyžadována — nemusí se řešit adaptivní kvalita textur ani touch ovládání nad
rámec toho, co Three.js `OrbitControls` nabízí ve výchozím stavu.

## 8. Otevřené otázky / nápady pro další iteraci (mimo tuto verzi)

- Případné budoucí rozšíření o trpasličí planety / pás asteroidů / mobilní podporu
- Reálná (ne náhodná) počáteční fáze měsíců na oběžné dráze kolem planety
- Nasazení na veřejný hosting (git repozitář zatím nezaložen)
- Sklon oběžné dráhy měsíců kolem planety není modelován (všechny měsíce obíhají v rovníkové
  rovině planety, i když ve skutečnosti mají různý sklon)
- Fotorealistická textura prstenců Uranu a Neptunu (aktuálně jen jednobarevná, poloprůhledná)

## 9. Poznámky k implementaci (pro budoucí navázání)

- **Klíčové soubory**: `src/data/celestialBodies.ts` (data), `src/scene/scale.ts` (měřítko),
  `src/scene/ephemeris.ts` (reálná počáteční poloha planet), `src/scene/sceneBuilder.ts`
  (sestavení 3D scény), `src/main.ts` (kamera, animační smyčka, propojení UI).
- `OrbitControls` musí být napojené na `renderer.domElement` (canvas), ne na vrstvu popisků
  (`labelRenderer.domElement`) - ta má schválně `pointer-events: none`, aby propouštěla klikání
  na scénu pod sebou; napojení na ni jednou způsobilo nefunkční zoom i klikání na popisky.
- Animace rotace/oběhu vždy nastavuje **absolutní** úhel z celkového uplynulého simulovaného
  času (`simDays`), ne přírůstkově - díky tomu jde čas i "přetáčet" zpět a nehrozí kumulace
  chyby.
