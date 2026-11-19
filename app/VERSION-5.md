# Potrero Rush — Jugador V5

Implemented on the existing public game, not a mockup or image-only delivery.

## Hero asset
The main player uses `public/models/potrero-player-v5.glb` (1,213,352 bytes), scene project 981cfee3-7754-4770-90f7-42a8ca87f9ca, committed revision 6. It contains a rebuilt continuous cranium/jaw, visible layered eyes and lids, curved smile, swept hair locks, short hems, sock cuffs and boot laces. Source mesh: 17,712 vertices / 15,751 faces before triangulation, 18 material roles and 18 deform bones. Both curved identity UV panels are retained. Opponents retain their V4 asset and balancing.

## Motion
New 30 fps sampled timeline: Idle 0–60; Run 61–85 (0.8 s loop); Kick 86–116 (contact at 0.30 s); Defend 117–147. Two-link limb solving preserves limb lengths. Run uses planted and swing phases, pelvis motion, torso counter-rotation and bent-arm motion. Runtime stride rate scales with speed. Hero transitions blend over 0.14 s. Lane-change lean and joint counterbalance are additive and reset before each sample, including paused frames.

## Shot presentation
No scoring, power thresholds or life rules were changed. The ball waits through the 0.30 s backswing and departs at the contact pose; flight then fits inside the same one-second presentation. Keeper contact and outward rebound use that same remapped clock. The kick sound triggers at contact. Measured toe-to-ball-center distance at the strike fixture is 0.209 m for a ball radius of 0.24 m.

## UI / compatibility
The existing menu, mandatory empty initial name, 1–99 number, kit economy, saved records and difficulty B remain intact. The locker adds QUIETO / CORRER / REMATAR previews alongside rotation. Preview rendering is bounded to 20 fps; the hidden main stage is throttled while the locker is open. Lighting is rebalanced and the 1024-pixel shadow map now follows the visible hero.

## Verification
`bun run test` covers the existing 26 game tests, 42 name/number tests, V4 model contract and V5 model contract. `bun run test:browser` covers model loading, no default name, whitespace rejection, accents, identity persistence, true front/back pixels, clip loop closure, transition weights, ball contact and save/goal trajectories, paused pose stability and 390×844 touch emulation. Browser results are in browser-verification-v5.json. GLB/Eevee and actual browser screenshots were rendered; visual image retrieval for the agent was limited, so pixel/bounds checks and geometric contact checks are not a certification of likeness to the design sheet. No physical-phone benchmark was performed.
