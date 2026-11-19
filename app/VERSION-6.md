# Potrero Rush — Rivales V6

Implemented update of the existing hosted game. This release replaces the V4 opponents with a new 3D squad while retaining the V5 hero and gameplay.

## Models
The new `public/models/potrero-rivals-v6.glb` is 4,540,940 bytes and includes four distinct 18-bone humanoid variants. Editable scene: project 981cfee3-7754-4770-90f7-42a8ca87f9ca, revision 7. Its original V5 source hero remains present in the source scene; runtime hero loading still uses the unchanged V5 GLB.

- Rayo: coral kit, short swept hair, narrower torso and wrist tape.
- Muro: broader shoulders and jaw, cropped hair and sideburns, dark red kit and amber arm band.
- Finta: curls, headband, copper kit, slimmer torso and different skin color.
- El Guardián: teal goalkeeper shirt, long sleeves, elbow/knee padding, gloves with cuffs, padded fingers, thumb and latex palm surfaces.

Runtime bone names use exported `potreroBone` extras. Keeper palms have model-derived `palmLocal` anchors. Meshes, material roles and skinning are real geometry, not billboards.

## Animation and contact
`src/client3d/opponents.js` provides lateral footwork, bent defensive arms, torso motion, a beaten reaction and a goalkeeper ready/block/dive/recover pose system. Opponent appearance is deterministic from existing entity seeds and does not vary when actor pool order changes. Limb poses use two-link IK, restore base transforms before each update and remain frozen while paused.

Goalkeeper timing uses the existing V5 shot clock: launch at 0.30 s, save contact at 0.748 s. Glove palms target the same contact plane as the ball trajectory. Left/right, center/high and low cases are tested with an actual model palm-to-ball distance under the ball's 0.24 m radius for at least one glove. Contact is followed by an outward bounce, brief impact ring and synthesized save sound; the goalkeeper returns to readiness. No random outcome is added.

## What remains unchanged
The V5 protagonist GLB, `public/game-core.js` and `public/profile.js` are byte-identical to V5 and hash-checked in tests. This preserves mandatory name, number 1–99, speed/difficulty B, core collision radii, lives, goals, shot thresholds, safe-lane generation and scoring. Existing progress and kit purchases remain in the same local storage record. Rayo/Muro/Finta are visual/animation variants, not new AI difficulty classes.

## Inspection UI
The menu's RIVALES button opens the real four game models. Each can be rotated; defenders offer LISTO/LATERAL/SUPERADO and the keeper offers LISTO/BLOQUEO/IZQUIERDA/DERECHA/BAJA. The modal supports focus return, keyboard focus trapping, Escape, touch, and scrolling on small displays. Hidden stage and gallery rendering are throttled; allocation is bounded to pooled actors and shared mesh/material resources.

## Verification
`bun run test` passes the original 26 gameplay tests, 42 identity tests, V4/V5 asset checks, and V6 pack/hash checks. `bun run test:browser` exercises gallery pixels/unique silhouettes, edge clipping, motion controls, onboarding and saved identity, touch input at 390x844, save contacts, actual skinned vertex bounds, frozen pause pose, recovery and goal/save/miss paths. Details are in `browser-verification-v6.json`.

The cover is composed from an actual Eevee render of the new scene. Gallery screenshots are actual browser output. Automated geometry/pixel checks do not certify artistic likeness to the original concept; a physical phone performance benchmark has not been performed.
