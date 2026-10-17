# Tree Dorm — Product & Build Spec

> **For Claude Code:** This is the source of truth for the project. Build in the phases in §16, in order. The visual layer is defined in §9 — follow it for every screen. After each phase, run the app, check the acceptance criteria, and commit. If something here is ambiguous, pick the simplest option that keeps the demo working and leave a `// SPEC-NOTE:` comment explaining the choice. Never commit secrets. All data is fake (seeded shops, Stripe test cards).

---

## 1. What we're building

**Tree Dorm** is a campus marketplace where verified students run small shops ("**treehouses**") — haircuts, nails, grad photos, baked goods, tutoring, personal training — and other students find and book them.

Three things make it different:

1. **Students only.** Sign-up requires a `.edu` email plus a one-time code.
2. **Talk, don't browse.** Buyers can describe what they need in plain words ("I need someone to take my grad photos Saturday") and the AI returns the top 3 matching treehouses.
3. **AI-verified payment release.** Payment is held when you book. After the service, the buyer snaps a photo; a vision model compares it to the listing. If it matches, money is released and the shop's **AI-verified** count goes up. If not, the buyer chooses: accept anyway, partial refund, or cancel.

Built for **DubHacks '26** — Generative AI commerce track.

**Vocabulary**
- *Treehouse* = a seller's shop page.
- *Listing* = one product or service inside a treehouse.
- *Proof photo* = the photo a buyer takes after the service.
- *Check* = the AI comparison of proof photo vs listing photos.

---

## 2. Hackathon targets (design decisions follow from these)

| Target | What it means for the build |
|---|---|
| Judging: Innovation 25%, UX 25%, Tech 20%, Commerce 15%, Trust 15% | Polished mobile UI, real AI in 3 places, visible trust features |
| **Perceptron** | Proof-photo check uses Perceptron vision + OCR (e.g. reading cake text "Happy Birthday Maya") |
| **VEYZL** | Public GitHub repo; VEYZL audits every PR. Keep the money-release logic in one small, well-tested file (`lib/release-decision.ts`) so the audit is meaningful. Keep a `AUDIT.md` log of findings and fixes |
| **Gemini** | Shopping chat/search + listing writer from seller photos + shop onboarding |
| **MongoDB Atlas** | Shops, listings, orders, payment status, messages, buyer memory |
| **Backboard** | Buyer order memory for rebook reminders. Implement behind an interface; MongoDB fallback if no key |
| **GoDaddy** | Custom domain pointed at Vercel (manual step, not code) |
| **SideShift (Best Startup Idea)** | No build. Include `/about` page with business model (see §15) |
| Best Freshman Beginner's Project, DubHacks NEXT, Commit Fellowship | No extra build |

---

## 3. User journeys

There are two account types (§9.7): **Personal** (buyer) and **Business** (seller). Internally these map to `roles: ["buyer"]` and `roles: ["buyer","seller"]` — a business owner can still buy.

### 3.1 Business (seller)

1. **Homepage** → secondary CTA "Open your treehouse" (not the marketplace door) → **signup**.
2. **Signup**: pick your **university** (autocomplete) → page re-themes to that school (§9.6) → enter `.edu` email (must match the chosen school's domain) → 6-digit code (MFA).
3. **Account type** → choose **Business** (Carmel page, §9.7).
4. **Business survey** (one question per screen):
   - Business name
   - Category: Beauty, Food, Fitness, Photography, Tutoring, Crafts, Reselling, Other — **treehouse preview updates live** as they pick (§9.8)
   - What you offer (1–2 sentences)
   - Typical price range
   - Where you work (dorm / building name — *not* room number) and availability (days + time windows)
5. Gemini uses the survey to generate tagline, short bio, suggested listing titles and tags. Seller edits, previews their category treehouse, confirms and saves.
6. **Add listings**: upload 1–5 photos → Gemini writes title, description, suggested price, tags and "what the buyer should see" checkpoints (used by the photo check). Seller edits and publishes.
7. **Storefront** (their treehouse page, §9.10) shows:
   - 🌳 **AI-verified**: orders that passed the photo check
   - ⭐ **Buyer reviews**: count + average rating
   - Listing photo grid, about, availability, location area
8. Seller sees bookings, chats with buyers, marks service done.

### 3.2 Personal (buyer)

1. **Homepage** → tap the treehouse door / "Enter the village" → signup or login (themed to their university).
2. `.edu` email + 6-digit code.
3. **Account type** → **Personal** → short survey (name, what you're usually looking for) → **optional hedgehog avatar** with hats and sunglasses (§9.9) — can skip.
4. **Door-entrance animation** into the marketplace (§9.4).
5. **Find a treehouse**, two ways:
   - **Search & filter** on the Almond marketplace page (§9.10), only their school's treehouses.
   - **Ask Tree Dorm AI**: "I'm looking for somebody to take my grad photos" → top 3 matches with one-line reasons.
6. **Enter a treehouse** (click → open-door/zoom into the storefront) → pick a listing → time slot → **Book**. Stripe **authorizes** (holds) the payment; nothing is charged yet.
7. **Private chat** with the seller opens for details (room number, exact time, custom requests). Room numbers live only in chat.
8. **Service happens.**
9. Buyer opens the order → **"Snap proof photo"**.
10. **AI check**:
    - **Pass** → payment captured, seller's AI-verified +1, buyer asked for a review.
    - **Mismatch** → buyer sees the reasons and chooses **Accept anyway**, **Partial refund**, or **Cancel**.
11. Proof photo deleted after the order settles.
12. Later, **rebook reminder** ("It's been 4 weeks since your haircut at Fade Lab — rebook?").
13. Avatar can be changed any time from **Profile → Edit avatar**.

> Note: the original notes said buyer pays after service. We **authorize at booking, capture after the check** — no money moves until verified, but the seller knows the buyer is good for it.

---

## 4. Screens (mobile-first)

| Route | Screen |
|---|---|
| `/` | **Homepage — treehouse entrance** (§9.5): close-up treehouse, brand title, short intro, primary CTA "Enter the village" (door), secondary CTA "Open your treehouse" (business), login / signup links |
| `/signup` | University picker → themed signup (§9.6) → `.edu` email → code |
| `/login` | Same theme as signup: university context, `.edu` email → code |
| `/onboarding/account-type` | Personal vs Business cards on Carmel (§9.7) |
| `/onboarding/personal` | Short survey → optional avatar step |
| `/onboarding/avatar` | Hedgehog + hats + sunglasses, skippable (§9.9) |
| `/onboarding/business` | Business survey → live category treehouse preview → AI preview → confirm (§9.8) |
| `/market` | **Marketplace search & filter** (§9.10): Almond background, vine border, search, category chips, Ask AI, Rebook strip, treehouse results (only the user's school) |
| `/ask` | Full AI chat view with match cards |
| `/t/[shopSlug]` | **Storefront** — the business's treehouse |
| `/t/[shopSlug]/[listingId]` | Listing detail + slot picker + Book |
| `/checkout/[orderId]` | Stripe Payment Element (test card) |
| `/orders`, `/orders/[id]`, `/orders/[id]/review` | Orders list, order detail (chat, proof photo, check result, resolve), review |
| `/messages`, `/messages/[threadId]` | Chat list and thread |
| `/profile`, `/profile/avatar` | Profile and avatar editing (always available) |
| `/seller`, `/seller/listings/new`, `/seller/shop` | Seller dashboard, new listing (photos → AI draft → publish), edit treehouse (category/treehouse variant kept) |
| `/about` | Business model page (SideShift pitch) |
| `/trust` | How AI checks work, what data is kept, how to dispute |

**Bottom tab bar** (logged in, phone): Village · Ask · Orders · Messages · Profile (+ Seller, if business). Styled per §9.3.

**Content rules**
- Every AI output carries a small "✨ AI" label and is editable by the seller.
- Skeleton / loading states on every AI call (styled per §9.10 empty & loading states).

### 4.1 Mobile-first behaviour (demo videos are recorded on a phone)

Build and test every screen at **390×844 (iPhone 14/15)** first, then tablet and desktop per §9.12.

- **Installable PWA:** `manifest.json` (name, icons, `display: "standalone"`, `theme_color` Almond `#EADDCA`) + Apple meta tags, so it records full-screen with no browser bar.
- **Thumb-friendly:** bottom tab bar, sticky bottom actions ("Book", "Snap proof photo", "Publish"), tap targets ≥ 44px, no hover-only actions (hover effects in §9 are desktop extras; tap must do the same job).
- **Bottom sheets** for slot picker, filters, accessory picker and resolve options.
- **Safe areas:** `viewport-fit=cover` + `env(safe-area-inset-*)`.
- **Native inputs:** `<input type="file" accept="image/*" capture="environment">` for proof photos; correct `inputmode`; `autocomplete="one-time-code"` on the code field.
- **No layout jumps:** fixed aspect ratios, skeletons sized like final content.
- **Fast:** Next `<Image>` + Cloudinary resizing for user photos; design art pre-sized to WebP/AVIF; light first load.

**Acceptance:** every screen works at 390px with no horizontal scroll; installs to an iPhone home screen; camera opens from "Snap proof photo"; door entrance runs smoothly on a phone.

---

## 5. Tech stack

- **App:** Next.js 14+ (App Router) + TypeScript + Tailwind. Screens and API routes in one project.
- **Animation:** CSS transforms/opacity first; `framer-motion` for the door entrance, page transitions and avatar/treehouse previews. No video, no 3D.
- **Hosting:** Vercel, auto-deploy on push to GitHub `main`.
- **AI text + chat + listing writer + fallback vision:** Gemini via `@google/genai`. Default model `gemini-2.5-flash` (make it an env var).
- **Proof-photo check:** Perceptron API (vision + OCR).
- **Payments:** Stripe test mode (`stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`), PaymentIntents with `capture_method: "manual"`.
- **Database:** MongoDB Atlas (`mongodb` driver, no ORM). Validate inputs with `zod`.
- **Photos:** Cloudinary (`cloudinary`). Mongo stores URLs + public IDs only.
- **Buyer memory:** Backboard (behind `lib/memory.ts`), Mongo fallback.
- **Auth:** custom email OTP + signed session cookie (`jose`). The 6-digit code is sent by **real email via Resend** (`RESEND_API_KEY`) in the woodland style: cream card, the hedgehog (embedded inline), the code shown big and clear; subject **"Your Tree Dorm code"**. Without a key — or if a send fails outside production — the code is logged to the server console and shown in a dev-only toast. The dev-only demo login (§12) stays as a backup in case email is slow during the demo.
- **Fonts:** `next/font/local` (Bloom Spring) and `next/font/google` (National Park), §9.3.
- **Code + audit:** public GitHub repo, VEYZL runs on every PR.

**Architecture rule:** phones only talk to our Next.js app. Only API routes call Gemini, Perceptron, Stripe, MongoDB, Cloudinary, Backboard. No API key is ever sent to the client except Stripe's publishable key.

---

## 6. Data model (MongoDB collections)

```ts
// users
{
  _id: ObjectId,
  email: string,              // lowercase, must end in .edu
  schoolDomain: string,       // e.g. "uw.edu"
  name: string,
  accountType: "personal" | "business",
  roles: ("buyer" | "seller")[],      // personal → ["buyer"], business → ["buyer","seller"]
  shopId?: ObjectId,
  avatar: { base: "hedgehog", hat: string | null, sunglasses: string | null },  // base is ALWAYS "hedgehog" (§9.9); hat/sunglasses are accessory ids from the asset manifest; default null
  lookingFor?: string,                // personal survey answer
  createdAt: Date
}

// otp_codes  (TTL index on expiresAt)
{ email: string, codeHash: string, attempts: number, expiresAt: Date }

// schools  (seeded)
{ domain: "uw.edu", name: "University of Washington", short: "UW",
  primary: "#4B2E83", secondary: "#B7A57A", accentBg?: string,
  logoUrl?: string }   // logo only if an appropriate, permitted asset exists — none by default

// shops  (treehouses)
{
  _id, ownerId: ObjectId, schoolDomain: string,
  slug: string, name: string,
  category: "beauty"|"food"|"fitness"|"photography"|"tutoring"|"crafts"|"reselling"|"other",
  treehouseVariant: string,     // = category by default; kept when the profile is edited (§9.8)
  tagline: string, bio: string, tags: string[],
  priceRange: { min: number, max: number },   // dollars
  area: string,                                // "McMahon Hall" — no room numbers
  availability: { day: 0|1|2|3|4|5|6, start: "HH:mm", end: "HH:mm" }[],
  stats: { aiVerified: number, reviewCount: number, ratingAvg: number },
  coverImage?: { url: string, publicId: string },
  createdAt: Date
}

// listings
{
  _id, shopId, title, description,
  priceCents: number, durationMin?: number,
  photos: { url: string, publicId: string }[],
  checkpoints: string[],   // e.g. ["round two-tier cake", "text reads the custom message", "pink frosting"]
  customTextAllowed: boolean,  // e.g. cake text, embroidery
  tags: string[],
  embedding?: number[],    // Gemini embedding of title+description+tags, for search
  active: boolean, createdAt: Date
}

// orders
{
  _id, buyerId, sellerId, shopId, listingId,
  slot: { start: Date, end: Date },
  customText?: string,        // what the buyer asked to be written, if any
  amountCents: number,
  status: "pending_payment" | "authorized" | "service_done" | "checking"
        | "passed" | "mismatch" | "captured" | "partially_refunded"
        | "canceled" | "expired",
  stripe: { paymentIntentId: string, capturedCents?: number },
  check?: {
    provider: "perceptron" | "gemini",
    verdict: "pass" | "mismatch" | "unsure",
    confidence: number,       // 0..1
    reasons: string[],        // human-readable
    ocrText?: string,
    checkedAt: Date
  },
  proofPhoto?: { url: string, publicId: string },   // deleted after settle
  resolution?: { action: "auto_capture"|"accept"|"partial"|"cancel", byUserId, at: Date },
  createdAt: Date, settledAt?: Date
}

// threads + messages
{ _id, orderId?, buyerId, sellerId, lastMessageAt: Date }
{ _id, threadId, senderId, body: string, createdAt: Date }

// reviews
{ _id, orderId, shopId, buyerId, rating: 1|2|3|4|5, body: string, createdAt: Date }

// buyer_memory  (Mongo fallback for Backboard)
{ buyerId, events: { type: "order_settled", category, shopId, listingId, at: Date }[] }

// audit_log  (every money decision)
{ orderId, actor: "ai"|"buyer"|"system", action, inputs: object, outcome, at: Date }
```

**Indexes:** `users.email` unique; `shops.slug` unique; `shops.schoolDomain`; `listings.shopId`; `orders.buyerId`, `orders.sellerId`; `otp_codes.expiresAt` TTL; Atlas Vector Search index on `listings.embedding` (if Atlas tier allows; otherwise compute cosine similarity in app code over the school's listings — fine for demo size).

---

## 7. API routes

All routes: JSON in/out, `zod` validation, require session except `/api/auth/*`. Errors as `{ error: { code, message } }`.

### Auth
- `POST /api/auth/start` `{ email }` → reject non-`.edu`; create OTP (6 digits, hashed, 10-min expiry, max 5 attempts); send email. → `{ ok: true }`
- `POST /api/auth/verify` `{ email, code }` → create user if new, set httpOnly session cookie. → `{ user }`
- `POST /api/auth/logout`

### Shops & listings
- `POST /api/shops` `{ survey }` → calls Gemini **Shop Builder** (§8.1) → saves shop → `{ shop }`
- `POST /api/shops/preview` `{ survey }` → same AI call, doesn't save (for the preview step)
- `GET /api/shops/[slug]` → shop + active listings + recent reviews
- `PATCH /api/shops/[id]` → owner edits
- `POST /api/uploads/sign` → Cloudinary signed upload params (client uploads directly to Cloudinary)
- `POST /api/listings` `{ shopId, photos[] , sellerNotes? }` → Gemini **Listing Writer** (§8.2) → returns draft (not yet active)
- `PATCH /api/listings/[id]` → edit + `active: true` to publish; recompute embedding on publish

### Discovery
- `POST /api/search` `{ query, category? }` → Gemini **Matchmaker** (§8.3) → `{ matches: [{ shop, listing, reason }] }` (top 3)
- `GET /api/shops?school=&category=&q=` → plain keyword browse

### Orders & payments
- `POST /api/orders` `{ listingId, slotStart, customText? }` → check slot free → create Stripe PaymentIntent (`capture_method: "manual"`, amount from listing, metadata orderId) → create order `pending_payment` → create chat thread → `{ order, clientSecret }`
- `POST /api/stripe/webhook` → on `payment_intent.amount_capturable_updated` set order `authorized`; on `payment_intent.canceled` set `canceled`/`expired`. Verify signature.
- `POST /api/orders/[id]/done` → seller marks `service_done`
- `POST /api/orders/[id]/check` `{ proofPhoto }` (buyer only, status `authorized` or `service_done`) → vision check (§8.4) → `lib/release-decision.ts` → if auto-pass: capture, status `captured`, `shop.stats.aiVerified += 1`; else status `mismatch` → `{ order, check }`
- `POST /api/orders/[id]/resolve` `{ action: "accept" | "partial" | "cancel", partialCents? }` (buyer only, status `mismatch`) →
  - `accept` → capture full
  - `partial` → capture `partialCents` (must be > 0 and < amount; Stripe releases the rest automatically when you capture less)
  - `cancel` → cancel PaymentIntent
  - Then delete proof photo from Cloudinary, write audit_log, set `settledAt`.
- `GET /api/orders?role=buyer|seller` → list
- `GET /api/orders?buyer=[id]&rebook=true` → past settled orders due for rebook (§10)

### Messages & reviews
- `GET /api/threads`, `GET /api/threads/[id]/messages?after=`, `POST /api/threads/[id]/messages` `{ body }` — client polls every 3s on open thread. Only the two participants can read.
- `POST /api/reviews` `{ orderId, rating, body }` → only buyer, only once, only settled orders → update shop `reviewCount`/`ratingAvg`.

---

## 8. AI features

Put all prompts in `lib/ai/prompts.ts`. Always request **JSON output** with a schema (`responseMimeType: "application/json"` + `responseSchema`), validate with `zod`, retry once on bad JSON, then fall back to a safe default. Never send emails, names, or room numbers to the model — only shop/listing content and the buyer's request.

### 8.1 Shop Builder (Gemini)
Input: survey answers + school name. Output:
```json
{ "tagline": "...", "bio": "...(<= 300 chars)", "tags": ["..."],
  "suggestedListings": [{ "title": "...", "priceCents": 2500 }], "accentEmoji": "✂️" }
```
Tone: friendly, student-to-student, no hype words, no claims the seller didn't make.

### 8.2 Listing Writer (Gemini, multimodal)
Input: 1–5 listing photos + category + optional seller notes. Output:
```json
{ "title": "...", "description": "...(<= 500 chars)", "suggestedPriceCents": 3000,
  "tags": ["..."], "checkpoints": ["visible, checkable features of the result"],
  "customTextAllowed": false }
```
`checkpoints` must be things a photo can actually show (shape, color, count, text). These are shown to the seller for edit and later passed to the photo check.

### 8.3 Matchmaker / Ask Tree Dorm (Gemini)
1. Embed the buyer's query (`text-embedding-004` or current Gemini embedding model).
2. Retrieve top ~15 listings at the buyer's school by cosine similarity (+ category filter if obvious).
3. Send query + those 15 (title, description, tags, price, shop rating, aiVerified, availability) to Gemini → choose top 3 with a one-sentence `reason` each, and a short friendly reply.
```json
{ "reply": "Here are three photographers free this weekend:",
  "matches": [{ "listingId": "...", "reason": "Does outdoor grad shoots on campus, $40/hr, 12 AI-verified orders" }] }
```
4. If the query is vague, return `{ "reply": "<one clarifying question>", "matches": [] }`.
5. Use buyer memory (§10) to slightly prefer shops they've rated well before.
Chat keeps the last 6 turns in client state and sends them each call.

### 8.4 Proof-photo check (Perceptron, Gemini fallback)
Interface in `lib/vision/index.ts`:
```ts
interface VisionChecker {
  check(input: {
    listingPhotoUrls: string[];
    proofPhotoUrl: string;
    checkpoints: string[];
    expectedText?: string;   // order.customText
  }): Promise<{ verdict: "pass"|"mismatch"|"unsure"; confidence: number;
                reasons: string[]; ocrText?: string }>;
}
```
- `lib/vision/perceptron.ts` — uses Perceptron API. **Claude Code: read Perceptron's current API docs before implementing; do not guess endpoints.** Use their OCR when `expectedText` is set and compare case-insensitively with light fuzzy match (ignore punctuation, ≤2 char edits).
- `lib/vision/gemini.ts` — same contract via Gemini multimodal; used when `PERCEPTRON_API_KEY` is missing or Perceptron errors.
- Reasons must be plain language: "Cake text reads 'Happy Birthday Maya' ✓", "Expected pink frosting, photo shows white".

### 8.5 Release decision (the code VEYZL audits)
`lib/release-decision.ts` — **pure function, no I/O, fully unit-tested.**
```ts
decide(check, order) => { action: "auto_capture" | "ask_buyer", why: string }
```
Rules:
- `verdict === "pass"` AND `confidence >= 0.80` AND (no `expectedText` OR OCR matched) → `auto_capture`
- Everything else → `ask_buyer`. **The AI can release money but can never take it away**: a mismatch never auto-refunds or auto-cancels; the buyer always decides.
- Order must be in a valid status; amount captured can never exceed authorized amount; partial capture must be > 0.
- Every decision is written to `audit_log` with inputs and outcome.
Tests in `lib/__tests__/release-decision.test.ts` (Vitest) covering: pass high-conf, pass low-conf, mismatch, unsure, OCR mismatch, missing checkpoints, invalid status, partial bounds.

---

## 9. Design — Woodland Treehouse Marketplace

> **For Claude Code:** this section is the source of truth for the visual layer. It replaces any generic UI defaults. Before building any screen, inspect `public/assets/` and `design/reference/` and read §9.13 (asset inventory). Build the homepage scene and entrance animation first (Phase 1 in §16) — it sets the visual language for everything else.

### 9.1 Direction

A **whimsical, cozy, woodland-fantasy marketplace**. Each business has its own personalized treehouse, and users explore by entering a magical forest world — an illustrated storybook brought to life: hand-drawn woodland scenery, warm natural colors, playful animation and cute fantasy characters. Treehouses should feel like little spaces you can *enter*, not decorative images behind a normal ecommerce UI.

**Keywords:** cozy woodland fantasy · storybook illustration · warm, earthy, natural · whimsical but polished · soft, organic shapes · handmade, creative, community-oriented · subtle animation and interactive details.

**Avoid:** generic SaaS dashboards, overly minimal layouts, corporate gradients, neon, standard ecommerce templates, plain white ecommerce pages, dark crowded dashboards.

The whole site is one continuous world; each page is a different part of it (§9.11).

**Mood references** (`design/reference/moods/`) set the vibe — see §9.16. They are for reference only and never appear in the app.

**Asset-first:** the supplied images (§9.13) are the primary source of truth. Inspect all of them before designing. Reuse them rather than generating unrelated replacements. Some are meant to be layered, cropped, masked or animated — not used as full-page backgrounds. Preserve their style, proportions, colors and character designs; never stretch them or swap in unrelated stock art. If an exact asset or font is missing, build the closest faithful approximation and keep it easy to replace.

### 9.2 Colors

| Token | Hex | Use |
|---|---|---|
| `almond` | `#EADDCA` | Main background of the marketplace search/filter page |
| `carmel` | `#C19A6B` | Account-creation page background, warm accent surfaces |
| `bark` | `#6B4226` | Primary brown: treehouses, doors, wood details, headings, important controls *(starting point — adjust to match the treehouse art)* |
| `walnut` | `#3E2B20` | Dark text, outlines, strong contrast |
| `leaf` | `#64764B` | Foliage, vines, nature accents, selected filter fill |
| `sage` | `#A8B58A` | Secondary green surfaces, soft decorative details |
| `cream` | `#FFF8EC` | Form fields, cards, light surfaces |
| `gold` | `#D9B56D` | Small highlights, magical details, hover accents |

Use them with restraint: almond and cream give breathing room, browns anchor, greens mostly in foliage and decoration. Don't make every page uniformly brown — each page has its own background treatment but belongs to the same world. Define these as Tailwind theme tokens + CSS variables; never hard-code hexes in components.

### 9.3 Typography, shapes, components

**Fonts**
- **Display: Bloom Spring Regular** by Keithzo — loaded from `public/assets/fonts/Bloom Spring.otf` with `next/font/local` as **`--font-display`**. **Only for big headings** — page titles, section headings, treehouse names. License: free for personal use (see `CREDITS.md`).
- **Body: National Park** — loaded from Google Fonts with `next/font/google` as **`--font-body`**. For all body text, labels, inputs, buttons, navigation, search and filters. It runs slightly tight on a phone, so body text is set at 17px with 1.6 line spacing.
- **Everything that isn't a big heading is National Park**: subtitles and the line under a heading, labels, inputs, placeholders, buttons, links, helper and validation text, chips, navigation, footers. Never use the display font for paragraphs, small labels or wordmark pills. Check National Park actually loads (not a system fallback) on every page.
- **How it's enforced:** National Park is the default font on `<body>` (`next/font` class + `font-sans`) and Tailwind's `--default-font-family`, and is named explicitly on inputs, buttons, selects, textareas, links, labels, dialogs and placeholders (they don't reliably inherit). Only elements with the `font-display` utility use Bloom Spring. No `font-mono` or other system font anywhere — codes use National Park with `tabular-nums`. The app has its own `not-found` page so Next's default (system-font) 404 never shows.
- **No eyebrow text, ever.** Never put a small label, kicker or tagline above a heading (e.g. "WELCOME BACK" over "Sign in"). Headings stand alone; any supporting label (like the school context on signup) goes *below* the heading.

**Shapes & components**
- Softly rounded corners, not sharp rectangles. Organic, irregular silhouettes for illustrated elements where it fits.
- **Buttons feel tactile** — little wooden signs, illustrated labels, rounded storybook controls (`bark` fill / `cream` text for primary; `cream` with `bark` border for secondary).
- Subtle borders, gentle shadows, layered illustrations for depth. No heavy glassmorphism, glossy gradients or heavy drop shadows.
- Text over illustrations always sits on cream or translucent light panels for readability.
- Build shared components: `WoodButton`, `CreamCard`, `LeafChip`, `SearchField`, `VineBorder`, `TreehouseScene`, `DoorTransition`, `TreehouseTile`, `HedgehogAvatar`, `AccessoryPicker`, `UniversityPicker`, `AccountTypeCard`, `AITag`, `EmptyState`.

### 9.4 Animation principles

Animation is a defining feature — it should feel like entering and exploring a woodland world — but must never make the site slow, disorienting or hard to use.

- Smooth, purposeful transitions, not constant movement everywhere. Gentle easing, organic motion, sense of physical depth.
- Buttons and form controls stay responsive during transitions.
- Don't replay the full entrance animation when returning to a page or changing a filter.
- Simplify complex animations on mobile when needed.
- Respect `prefers-reduced-motion` with a reduced experience (fades/highlights instead of spatial movement).
- CSS transforms + opacity and lightweight techniques; no large video or expensive 3D when layered illustrations can do it.

**Signature interaction — the door entrance:** the user approaches a treehouse, sees its door, and is visually transported inside. It should feel like entering an illustrated world, not changing web pages. Build it once as a reusable `DoorTransition` component (used on the homepage → marketplace, and in a lighter form for entering a storefront).

### 9.5 Homepage — main treehouse entrance (`/`)

**Composition**
- Use the **main treehouse image** (§9.13 — "another treehouse image") as the primary visual, framed **closer** than the source: the treehouse dominates; enough trunk to show it's built into a tree; branches and leafy foliage around the edges and top; **much less sky**; don't fit the whole tree; door and entrance clearly visible. Preserve colors, textures and proportions — a close, inviting view, not a distant landscape.

**Content (minimal, never covering the door or treehouse)**
- Whimsical brand title / logo area ("Tree Dorm" in the display font)
- One short line explaining the marketplace
- **Primary CTA:** "Enter the village" → marketplace (triggers the door entrance)
- **Secondary CTA:** "Open your treehouse" → business signup/onboarding — clearly different from the marketplace entrance
- Login / signup links

**Entrance sequence**
1. **Initial scene:** close-up treehouse, fully composed, door visible, foliage framing the edges.
2. **Idle:** restrained movement on selected leaves / small branches.
3. **Trigger:** clicking the primary CTA or the interactive door (door is a real, keyboard-focusable button with an accessible label).
4. **Door opens** inward if the art supports it; otherwise approximate with a separate door overlay layer or a carefully timed transition.
5. **Enter:** camera moves toward and through the doorway — scale and reposition the scene for forward motion.
6. **Interior bridge:** short darkening / warm glow / layered transition.
7. **Destination:** marketplace (or the next page) revealed with a smooth fade or zoom.

It must feel continuous. **Don't just enlarge the whole image until it blurs.** Inspect whether the art can be separated into: background foliage + sky, trunk, treehouse structure, door, foreground branches/leaves. If flattened, approximate with CSS transforms, clipping, scaling and layered overlays (e.g. a cropped door layer positioned over the door, foreground leaf layer at a different scale for parallax). Don't invent a different illustration. Target total length ~1.2–1.8s; skippable by tapping again.

**As built (Phase 1):**
- `TreehouseScene` frames `treehouse-main` tight: a portrait crop on phones, landscape from `md` (`lib/treehouse-scene.ts` holds the crops and door geometry). Phones: scene across the top, title/intro/CTAs below. Desktop: text left, large rounded scene right. Calm Almond `LeafyBackground` behind.
- Layers cut from the art by `prepare-assets`: `door-panel.png` (door with the railing painted out) swings open on its left hinge in 3D; `door-railing.png` stays in front; a warm doorway (gold → bark → walnut) shows behind.
- Sequence (~1.5s): door opens (0–420ms) → the whole frame zooms into the door (420–1220ms; 14× phone, 24× desktop) while a warm vignette centred on the door darkens the edges → warm light covers the screen (from 1000ms) → navigate at 1300ms. `EntranceGlow` (in the root layout) keeps the light up across the route change and fades it out only once the destination has rendered (not its loading screen). Tapping again skips straight there.
- Idle: two small leaves drift down past the treehouse. No characters on the homepage.
- Reduced motion: no door swing, zoom or drifting leaves — just a short warm fade, then navigate.
- The door is a real `<button>` ("Open the door and enter the village"), first in tab order, with a visible focus ring; "Enter the village" plays the same entrance. Signed-out visitors land on `/login?next=/market`.

If a user lands on `/market` directly or returns in an existing session, show the destination immediately or a much shorter transition.

### 9.6 Signup & login — university-themed

The account-access area of the woodland marketplace, with a **university-specific edition** that changes colors, accents and small decorative details — *not* the core brand identity.

**University selection (signup)**
- Searchable autocomplete of supported universities (from the `schools` collection). Selecting one re-themes the page immediately.
- The `.edu` email entered must match the chosen university's domain; if a user types an email first, pre-select the matching school.
- Apply the school's colors to **buttons, accent borders, selected states and small decorative details** only. Keep the warm woodland background, rounded components and illustrations.
- **Show the university only through the accent colors and the university picker.** No school label, pill or badge (e.g. no "Tree Dorm · UW signup" chip).
- **Background:** calm and warm — Almond (or Carmel) with a soft paper texture and a few scattered, still leaves (`LeafyBackground`), with the whole vine visible across the top (`VineBorder`). No busy illustrated scene, no characters on these pages.

**Example — University of Washington:** UW purple `#4B2E83` and gold `#B7A57A` on buttons, accent borders, selected states and small details; the picker shows University of Washington; the woodland background stays. It should feel like *the woodland marketplace's UW edition*, not a UW website with a treehouse logo pasted on.

**Reusable config, not per-school pages.** `lib/schools.ts` → `getUniversityTheme(domain)` returns `{ name, short, primary, secondary, accentBg?, logoUrl? }`. Logos only when an appropriate, permitted asset exists (none by default). Unknown university or unreliable colors → **default woodland theme** (no guessing).

Seed schools:

| Domain | Name | Primary | Secondary |
|---|---|---|---|
| uw.edu | University of Washington | #4B2E83 | #B7A57A |
| wsu.edu | Washington State | #981E32 | #5E6A71 |
| seattleu.edu | Seattle University | #AA0000 | #000000 |
| stanford.edu | Stanford | #8C1515 | #FFFFFF |
| berkeley.edu | UC Berkeley | #002676 | #FDB515 |

**Do not impersonate official university login portals.** Never copy an official sign-in screen's layout, logo lockup or wording (see `design/reference/ref-uw-netid-login.png` — what *not* to copy), and never imply the university operates Tree Dorm. Small footer: "Not affiliated with [University]."

**Login page** follows the same theme as the matching signup page: university context (picker, or remembered school), `.edu` email, then the 6-digit code, a "Log in" button, and "Create an account" link.
> SPEC-NOTE: the design brief lists a password field and "forgot password" link. This app uses `.edu` email + one-time code (that *is* the MFA), so the login form is **email → code** with "Resend code" in place of "Forgot password". Keep the same visual design.

Forms stay readable: cream fields, walnut text, visible focus rings in the school color, contrast AA or better.

### 9.7 Account creation — Personal vs Business (`/onboarding/account-type`)

- Page background **Carmel `#C19A6B`** with the same soft texture and scattered leaves (`LeafyBackground tone="carmel"`); the form lives on **cream cards** with dark brown text and green accents.
- Two clearly distinct, selectable **AccountTypeCard**s:
  - **Personal** — cute character-centered illustration / hedgehog avatar preview; copy about browsing, discovering businesses and personalizing your character.
  - **Business** — treehouse-centered illustration / storefront preview; copy about creating a business identity and customizing your treehouse.
- Selected state is obvious: border + slight lift + color change (and `aria-pressed`/radio semantics).
- After selection, show that type's survey and fields.

### 9.8 Business onboarding & treehouse personalization (`/onboarding/business`)

Flow: select Business → business info survey → choose category → **preview the category treehouse** → remaining details → confirm & save.

The preview is prominent and **updates when the category changes**. Each category uses the **same base treehouse** with small, relevant differences so they still look like one family:

| Category | Customization (use supplied assets where possible) |
|---|---|
| Beauty | Floral accents, soft decorative leaves, gentle pastel details |
| Food | Small fruit, herb or food-inspired decorations |
| Fitness | Energetic foliage or a small fitness sign |
| Photography | Tiny camera detail or photography sign |
| Tutoring | Books, a pencil, or a small learning detail |
| Crafts | Handmade decorations, colorful details, craft objects |
| Reselling | Small market sign, package or shop decoration |
| Other | Default, unmodified treehouse |

- Don't invent elaborate accessories or different building structures if the assets don't support them. If no decorative asset exists, use a subtle color variation, a small sign, or an existing illustration detail.
- Implement as a **variant config** (`lib/treehouse-variants.ts`: `{ id, label, overlays[], tint?, signText? }`) so new categories are easy to add. "Other" = fallback.
- The chosen variant is saved on the shop (`treehouseVariant`) and preserved when the profile is edited.
- Keep it light: owners shouldn't configure lots of decorative settings.

### 9.9 Personal onboarding & hedgehog avatar (`/onboarding/avatar`, `/profile/avatar`)

- Personal users complete their short survey, then may customize an avatar. **Customization is optional — "Skip for now" is always visible**, and finishing with the default is fine.
- **Every user's avatar is the default hedgehog** (`hedgehog-default`, §9.13) — the only avatar base. Users can add a hat and/or sunglasses; nothing else changes. **No other creature or character (woodland creatures §9.15, woodland spirits, emoji, generated art) is ever a user avatar.** Preserve the hedgehog's facial features, proportions, colors, style and expression.
- **Accessories:** hats and sunglasses from the supplied images.
- Interface: live **avatar preview** + accessory browser. Users can view the default hedgehog, browse hats and sunglasses, select / deselect, preview on the hedgehog, change before saving, skip, or finish.
- One hat and one pair of sunglasses at a time.
- **Accessories must align to the head and face** — store per-accessory anchor/scale/rotation in `public/assets/accessories/manifest.json` (e.g. `{ id, type, src, x, y, width, rotate }` as % of the hedgehog image) rather than placing them arbitrarily.
- Layer transparent PNGs over the hedgehog. If source images need cropping or background removal, preserve the artwork while fitting it.
- The saved avatar shows consistently: profile, header, chat bubbles, reviews.
- **Always editable later** from Profile → Edit avatar.
- Desktop: preview beside the controls. Mobile: preview stays visible (sticky top) while accessories scroll in a bottom sheet.

### 9.10 Marketplace search & filter (`/market`)

Should feel like you've successfully entered the woodland village — different from the homepage, same illustrated style.

- **Background Almond `#EADDCA`** — a warm, softly lit woodland interior / parchment marketplace. Cream for cards, search and filter panels; Bark for headings and key controls; Leaf/Sage accents; Gold for subtle interactive highlights.
- **Top decorative border (`VineBorder`):** vines and foliage along the top edge with organic curves and leaves, using the **watercolor vine** (`foliage/vine-branch.png`, §9.13) — repeat, flip and rotate copies along the top edge; the hedgehog-treehouse vines can fill gaps. Frames the page, never covers content. **The whole vine is always fully inside the screen on phone and desktop** — never cropped by the top or side edges, including mid-sway (mirror copies flip about their centre). Gentle sway only — the whole border must not keep waving. Simplify/reduce on small screens.
- **Entrance:** arriving from the homepage plays the door entrance (§9.5). Don't replay it on filter changes, opening a listing, or returning from a result. Direct URL / existing session → immediate or very short transition.
- **Search bar:** wide, rounded, cream background, clear search icon, inviting placeholder ("Find a treehouse — haircuts, cakes, grad photos…"), visible focus state, real submit. It's functional, not decorative. Next to it: the **Ask Tree Dorm AI** entry (§8.3), styled as part of the same world.
- **Filters:** rounded scrollable category chips (same eight categories as onboarding), compact dropdowns or a collapsible panel (bottom sheet on mobile). Selected = leaf-green or bark fill with contrasting text. Decorative foliage never overlaps inputs, filters, names or controls.
- **Results as small destinations in a woodland village**, not identical rectangular ecommerce cards: each `TreehouseTile` shows business name, category, a small treehouse illustration (its variant), short description, 🌳 AI-verified · ⭐ rating, and a clear "Enter" interaction. Keep the underlying layout consistent enough to scan and compare.
- **Treehouse tile animation:** idle — subtle leaf sway or light movement; hover/focus — lifts or grows slightly, foliage moves, doorway becomes inviting; click — transitions toward an open-door / zoom into the storefront; reduced-motion — simple highlight/color change. Stagger and restrain idle motion when many are visible; never have every tile bouncing.
- **Rebook strip** sits below search when the buyer has due rebooks (§10).
- **Empty & loading states** with a woodland creature (§9.15): initial loading, search in progress, no matching results, no filters selected, filtered results. Never delay access to results with animation.

**Storefront (`/t/[shopSlug]`):** the business's personalized treehouse identity (variant) at the top with matching woodland details, then stats, listings, about, availability. Entering it from a tile uses the lighter door/zoom transition.

### 9.11 Page-to-page consistency

| Page | Primary visual identity |
|---|---|
| Homepage | Close-up treehouse illustration + cinematic entrance |
| Signup / login | Calm Almond background (soft texture, a few leaves, whole vine at top) + university accent colors; no characters |
| Account creation | Carmel background with soft texture and leaves, cream form surfaces, hedgehog / treehouse previews |
| Personal profile customization | Default woodland hedgehog + accessory selection |
| Business onboarding | Category-specific treehouse preview |
| Marketplace search / filter | Almond background, vines, foliage, organized search controls |
| Storefront | Personalized treehouse identity + matching woodland details |
| Orders, chat, checkout, seller dashboard | Almond/cream surfaces, same buttons, chips, borders and fonts; light leaf accents only |

Same typography, button styles, borders, icon language and animation principles everywhere — shared components and tokens, not pages designed independently.

### 9.12 Responsive & accessibility

**Mobile (priority — §4.1):** treehouse stays the focal point, reframed/cropped (`object-position`), never stretched; door entrance easy to tap; fewer vines/foliage if they compete with content; account-type cards and onboarding sections stacked; hedgehog preview visible while choosing accessories; scrollable chips or accessible filter sheet; all controls easy to use.
**Tablet/Desktop:** large, immersive treehouse scene on the homepage; marketplace breathes with clear spacing between vines, search, filters and results; avatar preview beside its controls.

**Accessibility**
- Contrast AA on every background (text on illustrations sits on cream panels).
- Visible keyboard focus states everywhere.
- Doors, buttons, account types, university picker and accessory choices are keyboard-accessible with descriptive labels.
- Decorative images `alt=""` / `aria-hidden`; essential controls remain usable with animations off.
- Reduced-motion alternatives for the entrance and all idle effects.
- Clear selected states for account types, university themes and accessories; usable validation states on forms.

### 9.13 Assets & fonts

All design art lives in `public/assets/` (shipped) and `design/reference/` (reference only, never shipped). **Inspect every file before using it; don't invent filenames.** Keep `public/assets/INVENTORY.md` up to date mapping each file to its role.

Starting inventory (from the images supplied with this spec):

| File | What it is | Role |
|---|---|---|
| `public/assets/treehouse/treehouse-main.jpg` | Wooden cabin treehouse with red roof, arched door, ladder, big trunk, forest background | **"Another treehouse image" — homepage entrance scene** and base treehouse for tiles / storefront / category variants. *Confirm with the team this is the intended one.* |
| `public/assets/treehouse/treehouse-hedgehog.webp` | Treehouse in a big oak with hanging vines and a hedgehog at the roots, warm sky | Storefront header alternative. **Not** used behind signup/login (those use the calm `LeafyBackground`) |
| `public/assets/characters/hedgehog-default.avif` | Hedgehog in an orange knit beanie holding a maple leaf, autumn leaves around | **Default personal avatar** ("animated hedgehog"). Needs a transparent cut-out (`hedgehog-default.png`) — background is solid. The beanie is part of the art: treat it as the default look and also extract it as the first hat accessory if feasible |
| `public/assets/creatures/woodland creature animations.jpg` | Flat cartoon sticker sheet: owl, rabbit, hedgehog, bear, deer, bird, raccoon, squirrel, fox + trees, leaves, mushrooms (still drawings — "animations" is just the file name) | Crop animals into `creatures/cutouts/*-flat.png` (§9.15) and four autumn leaves into `foliage/leaf-*.png` for `LeafyBackground` |
| `public/assets/creatures/more woodland creature animations.jpg` | Soft cartoon sticker sheet: wolf, rabbit, owl, woodpecker, raccoon, hedgehog, fox, deer, bear, squirrel, moose | Crop into `creatures/cutouts/*-soft.png` for ambient decoration (§9.15) |
| `public/assets/fonts/Bloom Spring.otf` | Display font by Keithzo | `--font-display` (§9.3) |
| `design/reference/moods/*` | Painted forest scenes: sunlit paths, light rays, mushrooms, wildflowers, hollow-tree door | **Mood only** (§9.16). Never placed, cropped, traced or shipped |
| `public/assets/accessories/sunglasses-sheet.jpg` | 8 pairs of wayfarer sunglasses (sunset palm reflections, black, green, blue/pink, clear blue) on white | Crop into 8 transparent PNGs `sunglasses-01..08.png` for the accessory picker |
| `design/reference/vine-branch-shutterstock-preview.webp` | Watercolor vine: thin curving stem with heart-shaped green leaves tinged pink at the edges, on white — **watermarked Shutterstock preview** | **The intended vine for `VineBorder`** on the marketplace (and light leaf accents elsewhere). Don't ship the preview: license it, then save the clean file as `public/assets/foliage/vine-branch.png` (transparent background). Until then, use a placeholder SVG vine matching its shape and colors, marked `// PLACEHOLDER-ART` |
| `design/reference/treehouse-envato-preview.jpg` | Treehouse with red flag on a hill — **watermarked stock preview** | Reference only. **Do not ship** (watermark, unlicensed) |
| `design/reference/ref-uw-course-planner-login.png` | Clean dark login card with a purple button | Reference for how a school accent sits on a form |
| `design/reference/ref-uw-netid-login.png` | Official UW NetID sign-in page | **What not to copy** (impersonation rule, §9.6) |

**Missing assets — approximate faithfully and keep swappable:**
- **Hats:** only the hedgehog's beanie exists. Add 3–4 simple hats drawn in the same flat storybook style as SVG (`hat-*.svg`), clearly marked `// PLACEHOLDER-ART` so real art can replace them.
- **Category decorations** (camera, books, sign, package, flowers…): small SVG overlays in the same style. (The woodland spirits are not used.)
- **Creatures:** only the animals on the two supplied sheets. Never invent new characters.
- **Separate door layers** for the entrance: hand-cut from `treehouse-main.jpg` (`door-panel.png`, `door-railing.png`; geometry in `lib/treehouse-scene.ts`) — don't redraw the scene.

**Handling rules:** use supplied images directly; preserve transparency; keep aspect ratios; position/crop deliberately; no duplicate files; consistent paths; convert to WebP/AVIF at sensible sizes for phones; for animation, use the original illustrations as layers. **Licensing:** this is a public repo — confirm each image's license allows use (stock sites like Freepik/Envato often require attribution or a paid license); list sources and attribution in `public/assets/CREDITS.md`. Same for fonts (Bloom Spring: free for personal use, by Keithzo; National Park: Open Font License, Google Fonts).

### 9.14 Design acceptance

**Homepage** — main treehouse image used, framed close with less sky; door-opening + enter-the-treehouse animation; marketplace and business-signup clearly reachable.
**Signup/login** — calm Almond background with texture and a few leaves; whole vine visible on phone and desktop; no characters; no school pill — university shown only via accent colors and the picker; UW uses purple/gold accents; no impersonation of an official university page.
**Account creation** — Personal and Business distinct and selectable; correct onboarding after selection; Carmel textured background; default avatar matches the supplied hedgehog; optional hats/sunglasses; skippable and editable later.
**Business** — all 8 categories; restrained variant each; "Other" = default; preview updates live.
**Marketplace** — Almond background; vines/foliage at top with subtle motion; themed search and filters; listings keep a treehouse identity; door entrance reused only for the right navigation.
**Global** — Bloom Spring for big headings only, National Park for all other text (verified loading on every page); no eyebrow text anywhere; every avatar is the hedgehog; creatures still, small, sitting openly and grounded — never peeking, perching or half-hidden (≤2 on screen); no woodland spirits/sprites; mood references not shipped; supplied assets used (no unrelated replacements); consistent identity across pages; smooth, non-blocking animation; works on phone and desktop; reduced motion respected; text, forms and controls accessible.

**Scope boundary:** this section is visual and frontend interaction. Don't rewrite backend, auth, database or API design to achieve it. Doors, account-type selection, university theming, avatar accessories and treehouse previews must actually work — not static mockups.


### 9.15 Woodland creatures (ambient decoration)

Small creatures sprinkled through the app for a cute, warm, homey feel. They are **still cartoon drawings: no movement, no idle animation, no entrance effects.**

- **Source:** only the animals cut from the two sheets in `public/assets/creatures/` (`creatures/cutouts/*.png`). No invented characters. The hedgehogs on those sheets are not used — the hedgehog is reserved for user avatars (§9.9).
- **Placement rule:** a creature never peeks, perches, lurks behind things or stares at the user from an edge — that feels creepy. When one appears it **sits openly, clearly visible, small, friendly and grounded**: sitting on a little patch of grass (built into `<Creature>`), in a bottom corner or next to a message. Never half-hidden, never cut off by an edge or another element.
- **Placements** (`lib/creatures.ts` → `CREATURE_FOR`):
  - Empty states: a rabbit sitting above the message (`EmptyState`).
  - Loading screens: an eyes-closed deer resting on the grass (`LoadingState`, `app/loading.tsx`).
  - Photo check passed: a fox sitting beside the success message (Phase 8).
  - Not on signup/login or the marketplace vines.
- **Restraint:** small and occasional — **at most 1–2 visible at once**; never covering buttons, text or forms; decorative only (`alt=""`, `aria-hidden`, not interactive).
- **Reduced motion:** they don't move, so nothing changes — they stay visible.
- Every file and where it's used is listed in `public/assets/INVENTORY.md`; every source file is in `CREDITS.md`.

### 9.16 Mood references (`design/reference/moods/`)

Painted forest scenes for vibe only: **sunlit forest, soft light rays, winding dirt paths, red-and-white mushrooms, wildflowers, hollow-tree doors — cozy and warm.** Use them to guide colors, lighting, textures, decorative details and how the illustrated parts of the UI feel (e.g. warm earthy tones, soft paper texture, scattered leaves). Backgrounds stay calm — never a busy scene. **Never place, crop, trace or ship these images**, and never import them from app code.

---

## 10. Rebook reminders (Backboard)

`lib/memory.ts`:
```ts
recordSettled(buyerId, { category, shopId, listingId, at })
getDueRebooks(buyerId): { shopId, listingId, lastAt, dueAt }[]
```
- Backboard implementation when `BACKBOARD_API_KEY` exists (**read their docs first**); else Mongo `buyer_memory`.
- Default cadences: Beauty (hair) 28 days, Beauty (nails) 21, Fitness 7, Tutoring 7, Food 14, Crafts / Reselling / Photography / Other — none.
- Shown as a "Time to rebook?" strip on `/market`. One tap pre-fills the same listing.
- Demo seed: one buyer with a haircut settled 30 days ago so the strip shows.

---

## 11. Trust & responsibility (15% of judging — make it visible)

- `.edu` only + one-time code; rate-limit OTP (5/hour per email, 20/hour per IP).
- Room numbers and contact details only in private chat; public pages show building/area only.
- Proof photos deleted from Cloudinary when the order settles; listing photos kept.
- AI outputs labeled "✨ AI"; sellers edit everything the AI writes.
- Check result screen shows *why* (reasons list) and the confidence, and links to `/trust`.
- Mismatch → buyer decides. AI never refunds or cancels on its own.
- Every money action in `audit_log`.
- No personal data in prompts. API keys server-only in `.env.local` (git-ignored). Stripe webhook signature verified.
- Server-side authorization on every order/thread route (only participants).
- Basic content filter: Gemini safety settings on; block listings flagged as unsafe.
- `AUDIT.md` records VEYZL findings and fixes per PR.

---

## 12. Seed data

`scripts/seed.ts` (run with `npm run seed`) creates, for `uw.edu`:
- 2 personal users, 8 business users, each with a treehouse:
  1. "Fade Lab" — barber, Beauty, $15–25
  2. "Polished by Priya" — nails, Beauty, $20–40
  3. "Golden Hour Grads" — photography, $40–80
  4. "Sweet Dorm Bakes" — custom cakes, Food, $25–45, `customTextAllowed: true`
  5. "IMA Coach Sam" — personal training, Fitness, $10–20
  6. "CSE 142 Help" — tutoring, $15–25
  7. "Knot & Needle" — handmade crochet, Crafts, $10–35
  8. "Dorm Drop Resale" — thrifted clothes and textbooks, Reselling, $5–40
- Each shop has its category `treehouseVariant`; demo buyers have avatars (one default hedgehog, one with sunglasses + hat).
- 2–3 listings each with placeholder photos (upload a few royalty-free images to Cloudinary in the script, or use stable Unsplash URLs for seed only).
- A mix of AI-verified counts and reviews so pages look alive.
- Past orders for the demo buyer, including one haircut 30 days ago (rebook demo).
- For `berkeley.edu`: 1 demo buyer + 2 shops ("Bear Bites Bakery" — Food, "Sather Snaps" — Photography) so the university-theme switch shows on signup/login in the demo.

Login shortcut: in dev only (`NODE_ENV !== "production"`), `/login` shows "Demo buyer / Demo seller" buttons that skip OTP — kept as a backup in case email is slow during the demo.

---

## 13. Project structure

```
app/
  page.tsx                      (homepage treehouse entrance)
  signup/, login/
  onboarding/account-type/, onboarding/personal/, onboarding/avatar/, onboarding/business/
  market/, ask/
  t/[shopSlug]/page.tsx, t/[shopSlug]/[listingId]/page.tsx
  checkout/[orderId]/
  orders/, orders/[id]/, orders/[id]/review/
  messages/, messages/[threadId]/
  profile/, profile/avatar/
  seller/, seller/listings/new/, seller/shop/
  about/, trust/
  api/... (see §7)
components/
  woodland/  (WoodButton, CreamCard, LeafChip, SearchField, VineBorder, TreehouseScene,
              DoorTransition, TreehouseTile, TreehousePreview, HedgehogAvatar, AccessoryPicker,
              UniversityPicker, AccountTypeCard, EmptyState, AITag)
  app/       (MatchCard, StatBadge, ChatBox, PhotoUploader, SlotPicker, CheckResult, TabBar, BottomSheet)
lib/
  db.ts, session.ts, schools.ts, treehouse-variants.ts, stripe.ts, cloudinary.ts, memory.ts,
  release-decision.ts, rate-limit.ts, validators.ts
  ai/gemini.ts, ai/prompts.ts, ai/embeddings.ts
  vision/index.ts, vision/perceptron.ts, vision/gemini.ts
  __tests__/
styles/tokens.css               (colors §9.2, fonts §9.3)
public/assets/
  treehouse/, characters/, accessories/ (+ manifest.json), foliage/, decorations/, fonts/
  INVENTORY.md, CREDITS.md
design/reference/               (reference images — never shipped)
scripts/seed.ts, scripts/prepare-assets.ts  (crops sheets, removes backgrounds, converts to WebP)
AUDIT.md, README.md, .env.example
```

---

## 14. Environment variables (`.env.example`, real values in `.env.local`)

```
MONGODB_URI=
MONGODB_DB=treedorm
SESSION_SECRET=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
PERCEPTRON_API_KEY=
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
BACKBOARD_API_KEY=
RESEND_API_KEY=
RESEND_FROM=Tree Dorm <onboarding@resend.dev>   # use an address on a verified domain to email any student
APP_URL=http://localhost:3000
```
App must boot and the demo must work with only `MONGODB_URI`, `SESSION_SECRET`, `GEMINI_API_KEY`, Stripe test keys, and Cloudinary. Everything else degrades gracefully.

---

## 15. `/about` page (SideShift pitch content)

- **Problem:** campus side-hustles run on Instagram DMs and Venmo — no trust, no discovery, no protection for either side.
- **Solution:** verified-student treehouses, AI matchmaking, and payments that release only when the result matches.
- **Business model:** 8% platform fee on captured payments (seller side), optional $4/mo "Featured Treehouse" boost. Start at UW, expand school by school via `.edu` domains.
- **Why now:** students already buy from each other; gen-AI makes discovery conversational and verification cheap.
- Show 3 numbers from seed data (shops, AI-verified orders, average rating) as a mock traction strip, clearly labeled "demo data".

---

## 16. Build phases (do in order)

**Phase 0 — Scaffold + design system**
Next.js + TS + Tailwind, ESLint/Prettier, Vitest, `.env.example`, `.gitignore` includes `.env*.local`, Mongo helper, PWA manifest + safe areas (§4.1). Inspect `public/assets/` and `design/reference/`, write `INVENTORY.md`, run `prepare-assets` (crop sprite sheets, cut out hedgehog, convert formats). Color/font tokens (§9.2–9.3) and base woodland components. Deploy to Vercel.
✅ App loads on Vercel and a phone; tokens and components render on a `/dev/styleguide` page; `npm test` runs.

**Phase 1 — Homepage + door entrance** (§9.4–9.5)
Close-up treehouse scene, idle leaf motion, interactive door, `DoorTransition` into a placeholder `/market`, reduced-motion version, both CTAs.
✅ Door opens and the camera moves through it smoothly on a phone; doesn't just blur-zoom; keyboard and reduced-motion work.

**Phase 2 — Auth + university theming + account types** (§9.6–9.7)
OTP flow, session cookie, route middleware, schools seed, `UniversityPicker`, theme config, login/signup, Carmel account-type page.
✅ Picking UW turns accents purple/gold while woodland styling stays; unknown school → woodland default; non-`.edu` rejected; nothing resembles an official UW login.

**Phase 3 — Personal onboarding + hedgehog avatar** (§9.9)
Survey, `HedgehogAvatar`, `AccessoryPicker` with aligned hats/sunglasses, skip, save, `/profile/avatar`.
✅ Accessories sit correctly on the head/face; skip works; avatar shows in header and can be changed later.

**Phase 4 — Business onboarding + shops & listings** (§9.8)
Survey with live category treehouse preview (8 variants), Gemini Shop Builder, Cloudinary uploads, Listing Writer, storefront page with stats.
✅ A new business goes from signup to a published treehouse with one AI-written listing in under 2 minutes; preview changes with category.

**Phase 5 — Seed + marketplace** (§9.10)
Seed script, Almond `/market` with `VineBorder`, search, category chips/filter sheet, `TreehouseTile`s with animations, storefront entry transition, empty/loading states.
✅ UW village looks alive; entrance plays from the homepage only, not on filter changes.

**Phase 6 — Ask Tree Dorm AI**
Embeddings, Matchmaker route, chat UI with match cards styled in the woodland system.
✅ "I need someone to take my grad photos Saturday" returns Golden Hour Grads first with a sensible reason.

**Phase 7 — Booking + payments + chat**
Slot picker sheet, `POST /api/orders`, Stripe Payment Element, webhook, chat thread with polling.
✅ Book with `4242 4242 4242 4242`; Stripe shows an uncaptured PaymentIntent; buyer and seller can chat.

**Phase 8 — Proof check + release**
Camera upload, VisionChecker (Gemini first, then Perceptron), `release-decision.ts` + tests, capture/partial/cancel, photo deletion, audit_log, reviews, AI-verified counter.
✅ Matching cake + correct text → captured, counter +1. Wrong photo → reasons; partial refund captures the smaller amount.

**Phase 9 — Rebook + trust + polish**
Memory layer + rebook strip, `/trust`, `/about`, design acceptance pass (§9.14) on a real phone and desktop, Lighthouse mobile pass, accessibility pass.
✅ Demo buyer sees "Time to rebook Fade Lab?"; every item in §9.14 checks out.

**Phase 10 — Audit + ship**
VEYZL on PRs, fix findings, fill `AUDIT.md`, `CREDITS.md` complete, README with setup + architecture diagram, GoDaddy domain.

---

## 17. Demo script (3 minutes)

Record on a real iPhone with the app installed to the home screen (full-screen, no browser bar), using iOS screen recording. Use two phones (buyer and seller) for the chat and booking parts if possible.

1. Open the app → close-up treehouse → tap **"Open your treehouse"** → pick UW (page turns purple/gold, woodland stays) → code → **Business** on Carmel → choose Food and watch the treehouse preview change → AI writes the bio → upload cake photos → AI writes the listing.
2. Switch to the demo buyer → tap the **door** → it opens and you're carried inside to the Almond village with vines → hedgehog-in-sunglasses avatar in the header → "Rebook Fade Lab?" strip → ask AI "I need a birthday cake that says Happy Birthday Maya by Friday" → top 3 with reasons.
3. Tap Sweet Dorm Bakes' treehouse → enter the storefront → book → Stripe test card → hold placed → quick chat ("I'm in McMahon 712").
4. Snap proof photo of a matching cake → Perceptron reads the text → ✅ pass → payment captured, AI-verified 13 → 14.
5. Show a mismatch with a wrong photo → reasons → partial refund.
6. Quick Berkeley login → university theme switches to navy/gold; Berkeley-only treehouses.
7. Flash `/trust` and `AUDIT.md` (VEYZL fixes).

---

## 18. Out of scope (don't build)

Real seller payouts (Stripe Connect), push notifications, native apps, real-time websockets, admin dashboard, cross-school marketplace, dispute escalation beyond buyer choice, real payment cards, Stripe holds past 7 days (show "expired" if it happens).
