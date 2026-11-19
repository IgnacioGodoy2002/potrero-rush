# Potrero Rush — Vestuario / v3

## Included
- Required jersey name, initially empty. No personal name is prefilled.
- Names: 1–12 characters, accents supported, uppercase after confirmation; a name containing only spaces or punctuation is not accepted.
- Shirt number: integer 1–99, initially 10, editable with buttons or the keyboard.
- Front and rear previews; the selected name and number are painted into the actual player art.
- Identity and kit are saved locally. Previous points, coins and unlocked shirts are preserved.
- New illustrated 2.5D player, defenders and goalkeeper. Layered animation, bounded texture atlases and reuse on customization.
- Bold cream/gold display typography, outline, relief, and beveled buttons, inspired by chunky mobile-game titles. The actual font is Lilita One via Google Fonts, not the original Clash of Clans font. No font files are bundled.
- Existing difficult-B rules and keeper rebound outcome preserved. The shot camera now also shows the kicking player.

## Asset provenance and scope
The Higgsfield image batch was rejected by the account plan and submitted no generation jobs. A native generated visual concept supplied the front/rear illustrations. Two manually constrained cutouts were prepared from it, then articulated in code with repainted, unbranded jersey panels. These are illustrated sprites on a perspective pitch, not rigged 3D meshes or a full AI-generated motion-capture sequence.

## Tests
`bun run test` runs the real shipped game rules and the shared profile validator.
`bun run build` checks logic, TypeScript and the Worker bundle.
Browser checks cover required-name guards (including Enter), live previews, accent characters, local persistence, mobile scrolling, movement and regate. `browser-verification-v3.json` records the test scope and inspection limitation.

The public preview remains the existing Potrero Rush URL. The game is client-local; there is no global leaderboard or transmission of shirt names.
