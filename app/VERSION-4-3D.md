# Potrero Rush — Edición 3D 04

The illustrated billboard characters have been replaced by an original 3D model authored in Blender, exported as a glTF binary and animated with a real 18-bone skeleton. The stadium and rule system are preserved. The visual target is the supplied character sheet, not a claim of pixel-identical reconstruction.

## Model
- `public/models/potrero-player.glb`: approximately 0.94 MB, 18 joints, skin weights, 18 player material roles, curved UV panels for `IdentityFront` and `IdentityBack`.
- Scene source: the owner's **Potrero Rush — Jugador 3D** project, committed revision 3.
- Clip timeline at 30 fps: Idle 0–60; Run 61–85; Kick 86–116; Defend 117–147. All constant transform tracks are retained when sampled into runtime clips.
- Runtime loaders ignore the delivery camera, studio lights and floor, and use the player armature subtree only.
- Characters are real meshes in the same depth-tested scene as the stadium, with a shared model and bounded actor pools. No illustrated player sheets are requested at runtime.

## Preserved features
- Mandatory empty initial jersey name, accents/Ñ, maximum 12 characters, number 1–99, local storage and kit ownership.
- Existing menu typography and locker interface.
- Hard-mode speed and procedural rows; original collisions and scoring.
- Keeper-save contact and outward rebound, goals behind the line and genuinely overpowered misses above the bar.

## Added
- True front/back model renders in the locker and **GIRAR JUGADOR 3D** button in 45-degree increments.
- Dynamic name and number textures mapped to the moving jersey.
- Idle, run, kick and defensive poses; 3D defender/keeper variants.
- Directional lighting and player shadows in the game scene.

## Verification and limits
- Existing 26 gameplay and 42 identity validation tests pass.
- GLB inspection validates joints, weights, identity material roles and complete animation timeline.
- Browser testing validates model loading, visible preview pixels, unclipped canvas silhouettes, changes under rotation, bone movement, required-name guards, scoring trajectories, local persistence and 390×844 mobile layout/touch controls.
- No browser JavaScript or shader errors were reported in the tested flows.
- Mobile checks use Chromium viewport/touch simulation, not a physical phone.
- Screenshots were rendered and numerical image/bounds checks passed. Artistic fidelity to the reference is not certified by automated checks and should be reviewed by the user.

## Build
`bun install --frozen-lockfile && bun run test && bun run build`

The web bundle is generated from `src/client3d/` with pinned Three.js and esbuild. `public/engine3d.js` is a build artifact, generated during production build and intentionally ignored by Git.
