# Solar System 3D

Interaktivní 3D model sluneční soustavy v prohlížeči (Three.js + TypeScript + Vite).

Obsahuje Slunce, 8 planet, trpasličí planetu Pluto a 20 přirozených měsíců (včetně Charonu u
Pluta) s reálnými texturami, prstence u Saturnu, Uranu a Neptunu, a ovládání simulovaného času
(pauza/play, rychlost 0,01–200 dní/s). Počáteční poloha planet a Pluta při startu odpovídá
reálnému aktuálnímu datu (výpočet z Keplerových drah, `src/scene/ephemeris.ts`). Podrobné
zadání viz [ZADANI.md](ZADANI.md).

## Vývoj

```bash
npm install
npm run dev      # dev server
npm run build    # produkční build
npm run preview  # náhled buildu
```
