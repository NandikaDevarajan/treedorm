# Asset inventory
See SPEC.md §9.13 for roles. Update this file whenever assets are added, cropped or replaced.

**Source vs derived:** files marked *source* are the originals as supplied. Files marked *derived* are produced by
`npm run prepare-assets` (`scripts/prepare-assets.ts`) — don't hand-edit them; change the script's crop boxes and
re-run. Next `<Image>` serves everything as WebP/AVIF at the requested size, so derived files stay PNG for clean alpha.

## Treehouse
| File | Kind | Size | Role |
|---|---|---|---|
| treehouse/treehouse-main.jpg | source | 740×636 | Cartoon cabin treehouse (red roof, arched door, ladder, big trunk, pines, clear sky). Homepage entrance scene; base for tiles / storefront / category variants. *Still to confirm with the team that this is "another treehouse image".* |
| treehouse/treehouse-main.webp | derived | 740×636 | Web copy of the above — use this in pages |
| treehouse/door.png | derived | 54×78 | Door crop at box (360, 310, 54×78) of treehouse-main, for `DoorTransition` (Phase 1). Low-res: scale with care |
| treehouse/treehouse-hedgehog.webp | source | 800×436 | Line-art treehouse in a vine-covered oak, hedgehog at the roots, warm sky. Signup/login + account-creation backgrounds; vine reference |

## Characters
| File | Kind | Role |
|---|---|---|
| characters/hedgehog-default.avif | source | Hedgehog in orange beanie holding a maple leaf, cream background with scattered leaves |
| characters/hedgehog-default.png | derived | Transparent cut-out (background + loose leaves removed). **Default personal avatar.** Beanie is baked in |
| characters/woodland-spirits-sheet.jpg | source | 5×3 sheet of captioned woodland characters |
| characters/spirits/*.png | derived | 15 transparent crops, captions removed: mushroom-friends, flower-spirit, tiny-dragon, enchanted-owl, magical-fox-violet (sheet labels it "Magical Fox" but it's a lilac owl), magical-fox, fairy-rabbit, glowing-snail, fantasy-hedgehog, woodland-sprite-hedgehog, woodland-sprite, leaf-creature, acorn-friend-01, acorn-friend-02, tree-spirit. Used by `EmptyState` and decoration. **fairy-rabbit's white body partly drops out** (white-on-white) — only use it on cream/almond backgrounds or re-cut by hand |

## Accessories
| File | Kind | Role |
|---|---|---|
| accessories/sunglasses-sheet.jpg | source | 8 wayfarers, 2 columns × 4 rows on white |
| accessories/sunglasses-01..08.png | derived | Transparent crops, numbered row by row: 01 purple palm sunset, 02 black, 03 orange palm sunset, 04 green, 05 pink palm sunset, 06 blue/pink, 07 blue palm sunset, 08 clear blue |
| accessories/hat-acorn-cap.svg, hat-flower-crown.svg, hat-straw-sunhat.svg, hat-wizard.svg | placeholder | `PLACEHOLDER-ART` hats in a flat storybook style; replace with real art when available |

## Foliage & decorations
| File | Kind | Role |
|---|---|---|
| foliage/vine-placeholder.svg | placeholder | `PLACEHOLDER-ART` heart-leaf vine matching the Shutterstock reference. Used by `VineBorder` via `VINE_SRC` |
| foliage/vine-branch.png | missing | Licensed transparent watercolor vine (preview in design/reference/). When added, change `VINE_SRC` in components/woodland/VineBorder.tsx |
| decorations/, fonts/ | empty | Category decorations come in Phase 4; fonts are served by next/font (Google), so nothing lives here yet |

## App icons (derived, outside this folder)
`public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `app/icon.png`, `app/apple-icon.png`: square crops of the cabin from treehouse-main.

## Reference only — never shipped (`design/reference/`)
vine-branch-shutterstock-preview.webp (watermarked), treehouse-envato-preview.jpg (watermarked, don't use), ref-uw-course-planner-login.png (accent-on-form reference), ref-uw-netid-login.png (what **not** to copy).
