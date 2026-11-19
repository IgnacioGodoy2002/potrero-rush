# Potrero Rush web preview

The supplied standalone WebGL game is preserved in public/index.html. It uses localStorage for scores and kits. No login, multiplayer, or ranked server leaderboard is exposed. The single-player exception in AGENTS.md permits app.manifest.json durableObject: null; the Worker serves static files and rejects WebSocket actions. src/logic.js retains only the platform catalog contract and accepts no remote actions.

Run bun run test for the 24 original gameplay regression tests, and bun run build for the scaffold contract check, TypeScript check and Worker/static bundle. Original scaffold room tests are retained for reference only; they do not describe this single-player preview.
