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
| treehouse/treehouse-hedgehog.webp | source | 800×436 | Line-art treehouse in a vine-covered oak, hedgehog at the roots. Storefront header alternative (later phase). **No longer behind signup/login** |

## Characters
| File | Kind | Role |
|---|---|---|
| characters/hedgehog-default.avif | source | Hedgehog in orange beanie holding a maple leaf, cream background with scattered leaves |
| characters/hedgehog-default.png | derived | Transparent cut-out (background + loose leaves removed). **The only avatar base — every user is this hedgehog** (+ optional hat/sunglasses). Beanie is baked in |
| characters/hedgehog-email.png | derived | 240px copy embedded inline in the sign-in email (lib/email) |

## Woodland creatures (SPEC §9.15)
Still cartoon decorations — never animated, never avatars. Always shown **sitting openly on a patch of grass** (`<Creature>`), never peeking, perching or half-hidden. At most 1–2 on screen at once (the styleguide catalogue is the only exception).

| File | Kind | Used where |
|---|---|---|
| creatures/woodland creature animations.jpg | source | Flat-style sticker sheet (static, despite the name). Cut-outs below. Its hedgehog is skipped (avatar-only) and its bear touches a tree, so isn't cut |
| creatures/more woodland creature animations.jpg | source | Soft-style sticker sheet. Cut-outs below. Its hedgehog is skipped (avatar-only) |
| creatures/cutouts/rabbit-soft.png | derived | Empty states — sits above the message (`EmptyState`, phase placeholders) |
| creatures/cutouts/deer-soft.png | derived | Loading screens — eyes closed, resting on the grass (`LoadingState`, app/loading.tsx) |
| creatures/cutouts/fox-soft.png | derived | Sits beside "Photo check passed" (Phase 8; shown in /dev/styleguide now) |
| creatures/cutouts/bear-soft.png, moose-soft.png, wolf-soft.png, woodpecker-soft.png, raccoon-soft.png, owl-soft.png, squirrel-soft.png | derived | Not placed yet — available for later screens; catalogue in /dev/styleguide |
| creatures/cutouts/bird-flat.png, deer-flat.png, fox-flat.png, owl-flat.png, rabbit-flat.png, raccoon-flat.png, squirrel-flat.png | derived | Not placed yet (flat style kept as an alternative set); catalogue in /dev/styleguide |

Mapping lives in `lib/creatures.ts` (`CREATURE_FOR`); change a placement there, then update this table.

## Accessories
| File | Kind | Role |
|---|---|---|
| accessories/sunglasses-sheet.jpg | source | 8 wayfarers, 2 columns × 4 rows on white |
| accessories/sunglasses-01..08.png | derived | Transparent crops, numbered row by row: 01 purple palm sunset, 02 black, 03 orange palm sunset, 04 green, 05 pink palm sunset, 06 blue/pink, 07 blue palm sunset, 08 clear blue |
| accessories/hat-acorn-cap.svg, hat-flower-crown.svg, hat-straw-sunhat.svg, hat-wizard.svg | placeholder | `PLACEHOLDER-ART` hats in a flat storybook style; replace with real art when available |

## Foliage & decorations
| File | Kind | Role |
|---|---|---|
| foliage/vine-placeholder.svg | placeholder | `PLACEHOLDER-ART` heart-leaf vine matching the Shutterstock reference. Used by `VineBorder` via `VINE_SRC` — signup/login, styleguide, /market. viewBox includes every leaf so nothing clips |
| foliage/leaf-maple-orange.png, leaf-maple-red.png, leaf-yellow.png, leaf-oak.png | derived | Autumn leaves cut from "woodland creature animations.jpg"; scattered, still, over the calm page backgrounds (`LeafyBackground`: signup, login, account type). Small source — keep under ~40px |
| foliage/vine-branch.png | missing | Licensed transparent watercolor vine (preview in design/reference/). When added, change `VINE_SRC` in components/woodland/VineBorder.tsx |
| decorations/ | empty | Category decorations come in Phase 4 |

## Fonts
| File | Role |
|---|---|
| fonts/Bloom Spring.otf | `--font-display` via next/font/local: titles, short headings, treehouse names, decorative labels |
| *(Google Fonts)* National Park | `--font-body` via next/font/google: everything else |

## App icons (derived, outside this folder)
`public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `app/icon.png`, `app/apple-icon.png`: square crops of the cabin from treehouse-main.

## Reference only — never shipped (`design/reference/`)
`moods/forest animations.jpg`, `moods/forest animations 2.jpg`: painted sunlit forest scenes — **mood only** (light rays, dirt paths, mushrooms, wildflowers, hollow-tree door). Never placed, cropped, traced or imported (SPEC §9.16); they guide the warm tones and calm textured backgrounds.
vine-branch-shutterstock-preview.webp (watermarked), treehouse-envato-preview.jpg (watermarked, don't use), ref-uw-course-planner-login.png (accent-on-form reference), ref-uw-netid-login.png (what **not** to copy).
