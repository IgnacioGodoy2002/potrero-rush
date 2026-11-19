// Catalog contract for a client-local single-player game. No server rooms are deployed.
// The original simulation and input validation are preserved in public/index.html.
export const meta = { game: "Potrero Rush", minPlayers: 1, maxPlayers: 1 };
export function setup(players) { return { players: [...players], localOnly: true }; }
export function validateAction() { return { ok: false, error: "This preview has no remote game actions." }; }
export function applyAction(state) { return { ...state }; }
export function isGameOver() { return { over: false }; }
export function viewFor() { return { localOnly: true }; }
