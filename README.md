# Joices

A browser-based choice roguelike. Pick your class and weapon, then progress floor-by-floor by clicking encounter cards. Fight enemies in interactive turn-based combat using attacks and active skills.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## How to play

1. **Choose a class** — Warrior (tanky), Mage (spells), or Rogue (crit/bleed)
2. **Choose a weapon** — each class has two unique weapons
3. **Pick encounters** — fight enemies, heal, learn skills, or visit the shop
4. **Combat** — click Attack or active skills each turn; passives apply automatically
5. **Boss every 5 floors** — defeat the Lich to continue

## Architecture

Content is data-driven via registries in `src/content/`. Add new classes, weapons, skills, enemies, or events by creating a definition file and registering it. See `src/types/` for extension hooks (meta progression, custom events).

## Assets

Placeholder SVGs live in `public/assets/`. Replace any file with pixel art using the same filename to swap visuals without code changes.
