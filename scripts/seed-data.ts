/**
 * Demo data for `npm run seed` (SPEC §12). Everything here is fake. Listing photos are stable
 * Unsplash images (Unsplash License; credited in public/assets/CREDITS.md), each checked to match
 * its listing.
 */
import type { CategoryId } from "@/lib/categories";

const unsplash = (id: string, extra = "") => ({
  url: `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop${extra}`,
  publicId: `unsplash:${id}`,
});

export interface SeedListing {
  title: string;
  description: string;
  priceCents: number;
  durationMin?: number;
  photo: { url: string; publicId: string };
  checkpoints: string[];
  tags: string[];
  customTextAllowed?: boolean;
}

export interface SeedShop {
  slug: string;
  school: string;
  owner: { email: string; name: string };
  name: string;
  category: CategoryId;
  tagline: string;
  bio: string;
  offer: string;
  tags: string[];
  priceRange: { min: number; max: number };
  area: string;
  availability: { day: 0 | 1 | 2 | 3 | 4 | 5 | 6; start: string; end: string }[];
  stats: { aiVerified: number; reviewCount: number; ratingAvg: number };
  listings: SeedListing[];
}

const days = (list: number[], start: string, end: string) =>
  list.map((day) => ({ day: day as 0 | 1 | 2 | 3 | 4 | 5 | 6, start, end }));

export const SEED_SHOPS: SeedShop[] = [
  {
    slug: "fade-lab",
    school: "uw.edu",
    owner: { email: "seed.fadelab@uw.edu", name: "Marcus" },
    name: "Fade Lab",
    category: "beauty",
    tagline: "Clean fades without leaving your building",
    bio: "I've been cutting hair for friends since high school. Fades, lineups and beard trims in the Lander lounge — bring a reference photo and I'll match it.",
    offer: "Fades, lineups and beard trims. I bring my own clippers.",
    tags: ["haircut", "fade", "barber", "lineup", "beard"],
    priceRange: { min: 15, max: 25 },
    area: "Lander Hall lounge",
    availability: [...days([1, 3], "17:00", "21:00"), ...days([6], "11:00", "16:00")],
    stats: { aiVerified: 21, reviewCount: 18, ratingAvg: 4.9 },
    listings: [
      {
        title: "Skin fade + lineup",
        description:
          "A skin fade blended up to your length on top, with a sharp lineup. About 40 minutes. Show me a photo of what you want.",
        priceCents: 2000,
        durationMin: 40,
        photo: unsplash("1622286342621-4bd786c2447c"),
        checkpoints: [
          "hair faded short at the sides and back",
          "smooth blend into longer hair on top",
          "clean, straight neckline",
        ],
        tags: ["fade", "haircut", "lineup"],
      },
      {
        title: "Beard trim & shape-up",
        description: "Beard trimmed to an even length with crisp cheek and neck lines. About 20 minutes.",
        priceCents: 1500,
        durationMin: 20,
        photo: unsplash("1599351431202-1e0f0137899a"),
        checkpoints: [
          "beard an even length all over",
          "sharp line along the cheeks",
          "clean neckline under the jaw",
        ],
        tags: ["beard", "trim", "shape-up"],
      },
      {
        title: "Fresh shave & edge-up",
        description: "Straight-razor finish on the neck and sideburns plus an edge-up at the hairline.",
        priceCents: 1800,
        durationMin: 25,
        photo: unsplash("1503951914875-452162b0f3f1"),
        checkpoints: ["smooth shaved neck", "sharp edge at the hairline", "even sideburns"],
        tags: ["shave", "edge-up", "barber"],
      },
    ],
  },
  {
    slug: "polished-by-priya",
    school: "uw.edu",
    owner: { email: "seed.polished@uw.edu", name: "Priya" },
    name: "Polished by Priya",
    category: "beauty",
    tagline: "Gel nails and nail art, two floors up",
    bio: "Gel manicures, simple nail art and classic polish in McCarty Hall. I keep a tidy kit and sanitize everything between appointments.",
    offer: "Gel manicures, nail art and classic polish.",
    tags: ["nails", "gel", "manicure", "nail art"],
    priceRange: { min: 20, max: 40 },
    area: "McCarty Hall",
    availability: [...days([2, 4], "18:00", "21:00"), ...days([0], "12:00", "17:00")],
    stats: { aiVerified: 14, reviewCount: 11, ratingAvg: 4.8 },
    listings: [
      {
        title: "Gel manicure",
        description: "Shape, cuticle tidy and a long-lasting gel colour of your choice. Lasts 2–3 weeks.",
        priceCents: 3000,
        durationMin: 60,
        photo: unsplash("1604654894610-df63bc536371"),
        checkpoints: ["all ten nails painted", "glossy, even gel finish", "nails filed to a matching shape"],
        tags: ["gel", "manicure"],
      },
      {
        title: "Custom nail art set",
        description:
          "Gel base plus your choice of design — tortoiseshell, florals, french tips or something from your camera roll.",
        priceCents: 4000,
        durationMin: 90,
        photo: unsplash("1632345031435-8727f6897d53"),
        checkpoints: [
          "design matches the reference photo",
          "pattern repeated neatly across nails",
          "glossy top coat",
        ],
        tags: ["nail art", "design", "gel"],
      },
      {
        title: "Classic polish refresh",
        description:
          "Quick shape and a regular polish in a neutral or bold colour. Good before an interview.",
        priceCents: 2000,
        durationMin: 30,
        photo: unsplash("1610992015732-2449b76344bc"),
        checkpoints: [
          "even colour on every nail",
          "no polish on the skin around nails",
          "rounded, even nail shape",
        ],
        tags: ["polish", "manicure"],
      },
    ],
  },
  {
    slug: "golden-hour-grads",
    school: "uw.edu",
    owner: { email: "seed.goldenhour@uw.edu", name: "Elena" },
    name: "Golden Hour Grads",
    category: "photography",
    tagline: "Grad photos around campus at golden hour",
    bio: "Grad and portrait photos around the Quad, Drumheller Fountain and Suzzallo. I shoot outdoors in the evening light and send edited photos within a week.",
    offer: "Outdoor grad and portrait photos on campus, edited within a week.",
    tags: ["grad photos", "portraits", "photography", "graduation", "outdoor"],
    priceRange: { min: 40, max: 80 },
    area: "The Quad and Drumheller Fountain",
    availability: [...days([5], "17:00", "20:00"), ...days([6, 0], "16:00", "20:00")],
    stats: { aiVerified: 12, reviewCount: 10, ratingAvg: 4.9 },
    listings: [
      {
        title: "Grad portraits (45 minutes)",
        description:
          "45-minute outdoor shoot at two campus spots of your choice. 25+ edited photos sent within a week. Bring your cap and gown.",
        priceCents: 6000,
        durationMin: 45,
        photo: unsplash("1627556704302-624286467c65"),
        checkpoints: ["graduate in cap and gown", "outdoor campus setting", "warm evening light"],
        tags: ["grad photos", "portraits", "cap and gown"],
      },
      {
        title: "Friend group cap-toss shoot",
        description:
          "Up to 6 friends, an hour of group and solo shots, including the classic cap toss. Edited gallery within a week.",
        priceCents: 8000,
        durationMin: 60,
        photo: unsplash("1541339907198-e08756dedf3f"),
        checkpoints: ["group of graduates in gowns", "caps in the air", "outdoor setting with open sky"],
        tags: ["group photos", "graduation", "cap toss"],
      },
    ],
  },
  {
    slug: "sweet-dorm-bakes",
    school: "uw.edu",
    owner: { email: "demo.seller@uw.edu", name: "Jordan (demo seller)" },
    name: "Sweet Dorm Bakes",
    category: "food",
    tagline: "Custom cakes with your words on top",
    bio: "I bake custom birthday cakes and treats in the McMahon kitchen. Tell me the flavour and the message — I'll pipe it on top and have it ready for pickup.",
    offer: "Custom birthday cakes with your message piped on top, plus slices and treats.",
    tags: ["cake", "birthday", "custom", "bakery", "dessert"],
    priceRange: { min: 25, max: 45 },
    area: "McMahon Hall",
    availability: [...days([4, 5], "16:00", "21:00"), ...days([6], "10:00", "15:00")],
    stats: { aiVerified: 13, reviewCount: 12, ratingAvg: 4.8 },
    listings: [
      {
        title: "Custom birthday cake (serves 10)",
        description:
          "A 6-inch layer cake with drip icing and sprinkles, your message piped on top. Pick vanilla, chocolate or funfetti. Order 3 days ahead.",
        priceCents: 4000,
        photo: unsplash("1558301211-0d8c8ddee6ec"),
        checkpoints: [
          "round layer cake",
          "pink drip icing over white frosting",
          "sprinkles around the side",
          "custom message piped on top",
        ],
        tags: ["birthday cake", "custom", "sprinkles"],
        customTextAllowed: true,
      },
      {
        title: "Chocolate drip cake",
        description:
          "Rich chocolate cake with ganache drip and piped chocolate swirls. Add a short message if you like.",
        priceCents: 3500,
        photo: unsplash("1578985545062-69928b1d9587"),
        checkpoints: [
          "round chocolate cake",
          "chocolate ganache drip down the sides",
          "piped chocolate swirls on top",
        ],
        tags: ["chocolate", "cake", "drip"],
        customTextAllowed: true,
      },
      {
        title: "Red velvet slices (box of 4)",
        description: "Four thick slices of red velvet with cream cheese frosting. Good for study groups.",
        priceCents: 2500,
        photo: unsplash("1586788680434-30d324b2d46f"),
        checkpoints: [
          "four separate slices",
          "dark red sponge layers",
          "white cream cheese frosting between layers",
        ],
        tags: ["red velvet", "slices", "dessert"],
      },
    ],
  },
  {
    slug: "ima-coach-sam",
    school: "uw.edu",
    owner: { email: "seed.coachsam@uw.edu", name: "Sam" },
    name: "IMA Coach Sam",
    category: "fitness",
    tagline: "Beginner-friendly strength sessions at the IMA",
    bio: "I'm a kinesiology student who loves helping people get comfortable in the weight room. 1-on-1 sessions, core classes and gym intros at the IMA.",
    offer: "1-on-1 strength sessions, core classes and gym intros at the IMA.",
    tags: ["personal training", "gym", "strength", "fitness", "ima"],
    priceRange: { min: 10, max: 20 },
    area: "IMA",
    availability: [...days([1, 2, 3, 4], "07:00", "09:00"), ...days([0], "10:00", "13:00")],
    stats: { aiVerified: 9, reviewCount: 8, ratingAvg: 4.7 },
    listings: [
      {
        title: "1-on-1 strength session",
        description:
          "An hour on form for squats, deadlifts and presses, with a simple plan to keep going on your own.",
        priceCents: 2000,
        durationMin: 60,
        photo: unsplash("1517836357463-d25dfeac3438"),
        checkpoints: [
          "barbell with weight plates",
          "gym floor setting",
          "athletic shoes and workout clothes",
        ],
        tags: ["strength", "deadlift", "form"],
      },
      {
        title: "Core & mobility class",
        description: "30-minute small group class: core work, stretching and mobility. Mats provided.",
        priceCents: 1000,
        durationMin: 30,
        photo: unsplash("1571019613454-1cb2f99b2d8b"),
        checkpoints: ["exercise mat on the floor", "core exercise like crunches", "bright studio space"],
        tags: ["core", "mobility", "class"],
      },
      {
        title: "Gym intro tour",
        description:
          "Never been to the IMA weight room? I'll show you the machines, free weights and how to build a first workout.",
        priceCents: 1500,
        durationMin: 45,
        photo: unsplash("1534438327276-14e5300c3a48"),
        checkpoints: ["rows of dumbbells on racks", "weight room with machines", "indoor gym lighting"],
        tags: ["beginner", "gym intro", "weights"],
      },
    ],
  },
  {
    slug: "cse-142-help",
    school: "uw.edu",
    owner: { email: "seed.cse142@uw.edu", name: "Arjun" },
    name: "CSE 142 Help",
    category: "tutoring",
    tagline: "Java homework and exam prep from a former TA",
    bio: "I TA'd CSE 142 last year. Homework walkthroughs, debugging help and exam prep in Odegaard — I explain the why, not just the answer.",
    offer: "CSE 142 help: Java basics, homework walkthroughs and exam prep.",
    tags: ["tutoring", "cse 142", "java", "programming", "exam prep"],
    priceRange: { min: 15, max: 25 },
    area: "Odegaard Library",
    availability: [...days([0, 1, 2, 3], "19:00", "22:00")],
    stats: { aiVerified: 17, reviewCount: 15, ratingAvg: 4.9 },
    listings: [
      {
        title: "Homework walkthrough (1 hour)",
        description:
          "We go through your current assignment together until you understand every part. Bring your laptop.",
        priceCents: 2000,
        durationMin: 60,
        photo: unsplash("1517694712202-14dd9538aa97"),
        checkpoints: ["laptop open with code on screen", "code editor visible", "desk study setting"],
        tags: ["homework", "java"],
      },
      {
        title: "Exam prep session",
        description:
          "90 minutes of practice problems in the style of the midterm and final, in a small group of up to 4.",
        priceCents: 2500,
        durationMin: 90,
        photo: unsplash("1523240795612-9a054b0db644"),
        checkpoints: [
          "small group studying together",
          "laptop on the table",
          "library or study room setting",
        ],
        tags: ["exam prep", "midterm", "final"],
      },
      {
        title: "Debugging help (30 minutes)",
        description: "Stuck on an error? Send me the assignment and we'll find the bug together.",
        priceCents: 1500,
        durationMin: 30,
        photo: unsplash("1516321318423-f06f85e504b3"),
        checkpoints: [
          "laptop screen in view",
          "pointing at the code together",
          "two people working side by side",
        ],
        tags: ["debugging", "java", "quick help"],
      },
    ],
  },
  {
    slug: "knot-and-needle",
    school: "uw.edu",
    owner: { email: "seed.knotneedle@uw.edu", name: "Hana" },
    name: "Knot & Needle",
    category: "crafts",
    tagline: "Handmade crochet in your colours",
    bio: "I crochet bucket hats, scarves and little gifts in Hansee Hall. Pick your yarn colours and I'll make it to order.",
    offer: "Handmade crochet bucket hats and scarves in your choice of colours.",
    tags: ["crochet", "handmade", "bucket hat", "scarf", "gifts"],
    priceRange: { min: 10, max: 35 },
    area: "Hansee Hall",
    availability: [...days([2, 4], "19:00", "21:00"), ...days([6], "13:00", "17:00")],
    stats: { aiVerified: 7, reviewCount: 6, ratingAvg: 5.0 },
    listings: [
      {
        title: "Crochet bucket hat in your colours",
        description:
          "A soft crochet bucket hat made to your head size. Pick up to three yarn colours from my stash. Ready in about a week.",
        priceCents: 3500,
        photo: unsplash("1584992236310-6edddc08acff", "&crop=focalpoint&fp-x=0.3&fp-y=0.4&fp-z=1.6"),
        checkpoints: [
          "crochet bucket hat shape",
          "uses the chosen yarn colours",
          "even stitches around the brim",
        ],
        tags: ["bucket hat", "crochet", "custom"],
      },
      {
        title: "Pick-your-colours scarf",
        description:
          "A long, chunky crochet scarf in two or three colours of your choice. Cosy for Seattle winters.",
        priceCents: 3000,
        photo: unsplash("1584992236310-6edddc08acff", "&crop=focalpoint&fp-x=0.75&fp-y=0.6&fp-z=1.8"),
        checkpoints: ["long crochet scarf", "stripes in the chosen colours", "even edges along the length"],
        tags: ["scarf", "crochet", "winter"],
      },
    ],
  },
  {
    slug: "dorm-drop-resale",
    school: "uw.edu",
    owner: { email: "seed.dormdrop@uw.edu", name: "Kai" },
    name: "Dorm Drop Resale",
    category: "reselling",
    tagline: "Thrifted jackets and cheap textbooks",
    bio: "I thrift jackets and collect used textbooks at the end of every quarter. Everything's cleaned and checked — pick up from Willow Hall.",
    offer: "Thrifted jackets, scarves and used textbooks, picked up from my building.",
    tags: ["thrift", "resale", "textbooks", "jackets", "vintage"],
    priceRange: { min: 5, max: 40 },
    area: "Willow Hall",
    availability: [...days([1, 3, 5], "15:00", "19:00")],
    stats: { aiVerified: 11, reviewCount: 9, ratingAvg: 4.6 },
    listings: [
      {
        title: "Thrifted jackets",
        description:
          "Denim, corduroy and wool jackets, sizes S–XL. Tell me your size and style and I'll send photos of what I have.",
        priceCents: 2500,
        photo: unsplash("1551232864-3f0890e580d9"),
        checkpoints: ["jacket matches the photos sent", "size label as agreed", "no visible stains or tears"],
        tags: ["jacket", "denim", "thrift"],
      },
      {
        title: "Used textbooks",
        description:
          "Intro textbooks for CSE, MATH, CHEM and more, way under bookstore prices. Ask for the edition you need.",
        priceCents: 1500,
        photo: unsplash("1497633762265-9d179a990aa6"),
        checkpoints: ["title and edition as agreed", "cover intact", "pages not torn"],
        tags: ["textbooks", "used", "cheap"],
      },
      {
        title: "Vintage silk scarf",
        description:
          "One-of-a-kind patterned scarves from estate sales. Great as a headscarf or bag accessory.",
        priceCents: 1000,
        photo: unsplash("1617331721458-bd3bd3f9c7f8"),
        checkpoints: ["patterned scarf as pictured", "colours match the listing photo", "no holes or pulls"],
        tags: ["scarf", "vintage", "accessory"],
      },
    ],
  },
  {
    slug: "bear-bites-bakery",
    school: "berkeley.edu",
    owner: { email: "seed.bearbites@berkeley.edu", name: "Lucia" },
    name: "Bear Bites Bakery",
    category: "food",
    tagline: "Sourdough and pastries from Unit 2",
    bio: "Weekend sourdough, butter croissants and celebration cakes, baked in the Unit 2 kitchen. Order by Thursday for Saturday pickup.",
    offer: "Sourdough loaves, croissants and celebration cakes.",
    tags: ["bakery", "sourdough", "croissants", "cake"],
    priceRange: { min: 8, max: 30 },
    area: "Unit 2",
    availability: [...days([6], "09:00", "13:00")],
    stats: { aiVerified: 8, reviewCount: 7, ratingAvg: 4.8 },
    listings: [
      {
        title: "Sourdough loaf",
        description: "A crusty seeded sourdough loaf, baked fresh Saturday morning.",
        priceCents: 1200,
        photo: unsplash("1509440159596-0249088772ff"),
        checkpoints: ["round crusty loaf", "seeds on the crust", "golden brown colour"],
        tags: ["sourdough", "bread"],
      },
      {
        title: "Butter croissants (box of 4)",
        description: "Flaky all-butter croissants, laminated over two days.",
        priceCents: 1000,
        photo: unsplash("1555507036-ab1f4038808a"),
        checkpoints: ["four croissants", "flaky golden layers", "crescent shape"],
        tags: ["croissants", "pastry"],
      },
      {
        title: "Berry celebration cake",
        description: "White frosted cake topped with fresh strawberries and blueberries. Message on request.",
        priceCents: 3000,
        photo: unsplash("1535141192574-5d4897c12636"),
        checkpoints: [
          "white frosted cake",
          "fresh strawberries and blueberries on top",
          "message piped if requested",
        ],
        tags: ["cake", "berries", "celebration"],
        customTextAllowed: true,
      },
    ],
  },
  {
    slug: "sather-snaps",
    school: "berkeley.edu",
    owner: { email: "seed.sathersnaps@berkeley.edu", name: "Noah" },
    name: "Sather Snaps",
    category: "photography",
    tagline: "Film-style portraits around Sather Tower",
    bio: "Portraits and grad photos around Sather Tower and Memorial Glade, edited in a warm film style.",
    offer: "Film-style portraits and grad photos on campus.",
    tags: ["photography", "portraits", "grad photos", "film"],
    priceRange: { min: 30, max: 70 },
    area: "Memorial Glade",
    availability: [...days([5, 6], "16:00", "19:00")],
    stats: { aiVerified: 6, reviewCount: 5, ratingAvg: 4.8 },
    listings: [
      {
        title: "Film-style portraits",
        description: "30-minute portrait session with a warm film edit. 15 edited photos.",
        priceCents: 4500,
        durationMin: 30,
        photo: unsplash("1452587925148-ce544e77e70d"),
        checkpoints: ["portrait framing of one person", "warm film-style colours", "outdoor campus backdrop"],
        tags: ["portraits", "film"],
      },
      {
        title: "Grad photos at Sather Tower",
        description: "An hour around Sather Tower and the Glade in your cap and gown. 30 edited photos.",
        priceCents: 7000,
        durationMin: 60,
        photo: unsplash("1516035069371-29a1b244cc32"),
        checkpoints: ["graduate in cap and gown", "Sather Tower in the background", "outdoor daylight"],
        tags: ["grad photos", "graduation"],
      },
    ],
  },
];

/** Demo buyers (SPEC §12). Maya is the demo-script buyer: hedgehog in a hat and sunglasses. */
export const SEED_BUYERS = [
  {
    email: "demo.buyer@uw.edu",
    name: "Maya (demo buyer)",
    school: "uw.edu",
    avatar: { hat: "acorn-cap", sunglasses: "sunglasses-02" },
    lookingFor: "Beauty, Food, Photography",
  },
  {
    email: "seed.theo@uw.edu",
    name: "Theo",
    school: "uw.edu",
    avatar: { hat: null, sunglasses: null },
    lookingFor: "Tutoring, Fitness",
  },
  {
    email: "demo.buyer@berkeley.edu",
    name: "Ava (Berkeley demo)",
    school: "berkeley.edu",
    avatar: { hat: null, sunglasses: null },
    lookingFor: "Food",
  },
] as const;

/** Past orders. `daysAgo` sets when it settled; the Fade Lab haircut 30 days ago drives the rebook demo (§10). */
export const SEED_ORDERS = [
  {
    key: "maya-fade",
    buyer: "demo.buyer@uw.edu",
    shop: "fade-lab",
    listing: "Skin fade + lineup",
    daysAgo: 30,
    review: {
      rating: 5,
      body: "Exactly the fade I showed him. Took 35 minutes and the lineup is super clean.",
    },
  },
  {
    key: "maya-cake",
    buyer: "demo.buyer@uw.edu",
    shop: "sweet-dorm-bakes",
    listing: "Custom birthday cake (serves 10)",
    daysAgo: 58,
    customText: "Happy 20th Lena",
    review: { rating: 5, body: "Message was piped perfectly and it tasted even better than it looked." },
  },
  {
    key: "maya-nails",
    buyer: "demo.buyer@uw.edu",
    shop: "polished-by-priya",
    listing: "Gel manicure",
    daysAgo: 44,
    review: { rating: 4, body: "Really neat work and a cosy setup. Lasted almost three weeks." },
  },
  {
    key: "theo-cse",
    buyer: "seed.theo@uw.edu",
    shop: "cse-142-help",
    listing: "Homework walkthrough (1 hour)",
    daysAgo: 9,
    review: { rating: 5, body: "Finally understood loops. Patient and explains everything." },
  },
  {
    key: "theo-gym",
    buyer: "seed.theo@uw.edu",
    shop: "ima-coach-sam",
    listing: "Gym intro tour",
    daysAgo: 20,
    review: { rating: 5, body: "Made the weight room way less intimidating." },
  },
  {
    key: "ava-bread",
    buyer: "demo.buyer@berkeley.edu",
    shop: "bear-bites-bakery",
    listing: "Sourdough loaf",
    daysAgo: 12,
    review: { rating: 5, body: "Best sourdough I've had in Berkeley, and I've tried a lot." },
  },
] as const;
