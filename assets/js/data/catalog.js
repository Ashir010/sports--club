/* ==========================================================================
   TOSS CLUB — Mock catalogue: sports, courts, facilities
   --------------------------------------------------------------------------
   This file stands in for GET /sports, GET /courts and GET /facilities.
   Shapes here match what services/api.js promises, so swapping the mock
   adapter for a real fetch requires no changes above the service layer.
   ========================================================================== */

window.TOSS = window.TOSS || {};

TOSS.club = {
  name: "Toss Club",
  tagline: "Six sports. One club.",
  currency: "₹",
  locale: "en-IN",
  address: {
    line1: "Survey No. 42, Sarjapur Main Road",
    line2: "Kaikondrahalli, Bengaluru 560035",
    country: "India"
  },
  geo: { lat: 12.9081, lng: 77.6839 },
  phone: "+91 80 4718 2200",
  whatsapp: "+91 98450 22110",
  email: "play@tossclub.in",
  hours: [
    { day: "Monday",    open: "06:00", close: "00:00" },
    { day: "Tuesday",   open: "06:00", close: "00:00" },
    { day: "Wednesday", open: "06:00", close: "00:00" },
    { day: "Thursday",  open: "06:00", close: "00:00" },
    { day: "Friday",    open: "06:00", close: "01:00" },
    { day: "Saturday",  open: "05:30", close: "01:00" },
    { day: "Sunday",    open: "05:30", close: "00:00" }
  ],
  parking: "120 covered bays on level B1, free for the first three hours with any booking. Two-wheeler parking at the north gate.",
  access: "Step-free from the street to every court. Lift to all levels, accessible changing rooms on the ground floor, and reserved seating courtside. Tell us when you book and a host will meet you at the entrance.",
  directions: "Off Sarjapur Main Road, 400 m past the Kaikondrahalli lake gate. Nearest metro: Bellandur (6 km). Ride-share drop-off at the west gate."
};

/* --------------------------------------------------------------------------
   Sports. `plan` selects the court drawing in lib/courts.js.
   `rate` is the off-peak hourly rate; `peakRate` applies 18:00–22:00.
   -------------------------------------------------------------------------- */

TOSS.sports = [
  {
    id: "pickleball",
    name: "Pickleball",
    plan: "pickleball",
    surface: "#0E5C63",
    blurb: "The fastest-growing game in the club, and the easiest to start. Rallies begin within a minute of picking up a paddle, and the kitchen line does the rest.",
    facilities: ["6 cushioned outdoor-spec courts", "4 under floodlights until midnight", "Paddle and ball hire at the desk", "Two courts kept free for open play"],
    courts: [
      { id: "pb-1", name: "Court 1", note: "Championship court, tiered seating" },
      { id: "pb-2", name: "Court 2", note: "Floodlit" },
      { id: "pb-3", name: "Court 3", note: "Floodlit" },
      { id: "pb-4", name: "Court 4", note: "Floodlit" },
      { id: "pb-5", name: "Court 5", note: "Open play, shared" },
      { id: "pb-6", name: "Court 6", note: "Open play, shared" }
    ],
    rate: 700,
    peakRate: 900,
    unit: "court / hour",
    players: "2–4 players",
    duration: "60–120 min",
    level: "Anyone, from first paddle up"
  },
  {
    id: "padel",
    name: "Padel",
    plan: "padel",
    surface: "#12435E",
    blurb: "Glass-walled, doubles only, and relentlessly social. The back wall keeps points alive long past the moment they should have ended.",
    facilities: ["4 panoramic glass courts", "2 fully covered for monsoon play", "Racket hire included with peak bookings", "Match video replay on courts 1 and 2"],
    courts: [
      { id: "pd-1", name: "Panorama 1", note: "Covered, video replay" },
      { id: "pd-2", name: "Panorama 2", note: "Covered, video replay" },
      { id: "pd-3", name: "Court 3", note: "Open air" },
      { id: "pd-4", name: "Court 4", note: "Open air" }
    ],
    rate: 1600,
    peakRate: 2100,
    unit: "court / hour",
    players: "4 players",
    duration: "60–90 min",
    level: "Beginner clinics every Tuesday"
  },
  {
    id: "badminton",
    name: "Badminton",
    plan: "badminton",
    surface: "#8A5A2B",
    blurb: "Six sprung wooden courts with 12-metre clearance and no draught. Built for the drop shot that dies on the net cord.",
    facilities: ["6 sprung maple courts", "12 m ceiling clearance, draught-free", "BWF-approved mats on courts 1–2", "Feather shuttles stocked at the desk"],
    courts: [
      { id: "bd-1", name: "Court 1", note: "BWF mat, match court" },
      { id: "bd-2", name: "Court 2", note: "BWF mat, match court" },
      { id: "bd-3", name: "Court 3", note: "Sprung maple" },
      { id: "bd-4", name: "Court 4", note: "Sprung maple" },
      { id: "bd-5", name: "Court 5", note: "Sprung maple" },
      { id: "bd-6", name: "Court 6", note: "Coaching court" }
    ],
    rate: 550,
    peakRate: 750,
    unit: "court / hour",
    players: "2–4 players",
    duration: "60–120 min",
    level: "All levels, coached squads on weeknights"
  },
  {
    id: "table-tennis",
    name: "Table Tennis",
    plan: "tabletennis",
    surface: "#14406B",
    blurb: "Four match tables in a room built for it — matte floor, no glare, and enough space behind the baseline to actually step back.",
    facilities: ["4 ITTF-spec match tables", "Robot trainer on table 4", "Bats and 3-star balls on loan", "Ladder box scores updated nightly"],
    courts: [
      { id: "tt-1", name: "Table 1", note: "Match table, barriers" },
      { id: "tt-2", name: "Table 2", note: "Match table" },
      { id: "tt-3", name: "Table 3", note: "Practice" },
      { id: "tt-4", name: "Table 4", note: "Robot trainer" }
    ],
    rate: 350,
    peakRate: 450,
    unit: "table / hour",
    players: "2–4 players",
    duration: "30–90 min",
    level: "Drop in and join the ladder"
  },
  {
    id: "basketball",
    name: "Basketball",
    plan: "basketball",
    surface: "#9A6224",
    blurb: "A full hardwood court with breakaway rims, split into two half courts when the run gets busy. Open runs every evening from seven.",
    facilities: ["Full maple court with breakaway rims", "Splits into two half courts", "Shot clock and scoreboard", "Open run 19:00–22:00, no booking needed"],
    courts: [
      { id: "bb-full", name: "Full court", note: "Scoreboard and shot clock" },
      { id: "bb-half-a", name: "Half court A", note: "North basket" },
      { id: "bb-half-b", name: "Half court B", note: "South basket" }
    ],
    rate: 1800,
    peakRate: 2400,
    unit: "court / hour",
    players: "6–10 players",
    duration: "60–120 min",
    level: "Open runs and organised fives"
  },
  {
    id: "football",
    name: "Football",
    plan: "football",
    surface: "#1E5B2E",
    blurb: "Two FIFA-quality turfs under lights. Fives on the north pitch, sevens on the south, and a league that runs all year.",
    facilities: ["FIFA Quality Pro turf, laid 2024", "5-a-side and 7-a-side pitches", "Floodlit to 500 lux", "Bibs, balls and a match referee on request"],
    courts: [
      { id: "fb-north", name: "North turf", note: "5-a-side" },
      { id: "fb-south", name: "South turf", note: "7-a-side" }
    ],
    rate: 2200,
    peakRate: 2800,
    unit: "pitch / hour",
    players: "10–14 players",
    duration: "60–90 min",
    level: "Casual fives to league sides"
  }
];

/* --------------------------------------------------------------------------
   Facilities. `size` drives the bento layout; `plan` picks the drawing.
   -------------------------------------------------------------------------- */

TOSS.facilities = [
  {
    id: "fac-padel",
    name: "The glass house",
    kind: "Padel",
    plan: "padel",
    surface: "#12435E",
    size: "xl",
    note: "Four panoramic courts under a 10-metre canopy, two of them fully covered so the monsoon never cancels a match.",
    specs: ["4 courts", "Covered play", "Video replay"]
  },
  {
    id: "fac-pickle",
    name: "Pickleball deck",
    kind: "Pickleball",
    plan: "pickleball",
    surface: "#0E5C63",
    size: "lg",
    note: "Six cushioned courts on the roof deck, floodlit to midnight, with two always left open for whoever turns up.",
    specs: ["6 courts", "Floodlit", "Open play"]
  },
  {
    id: "fac-badminton",
    name: "Maple hall",
    kind: "Badminton",
    plan: "badminton",
    surface: "#8A5A2B",
    size: "md",
    note: "Six sprung courts, sealed against draught, with the ceiling height a clear serve deserves.",
    specs: ["6 courts", "12 m clearance"]
  },
  {
    id: "fac-tt",
    name: "Table tennis room",
    kind: "Table tennis",
    plan: "tabletennis",
    surface: "#14406B",
    size: "sm",
    note: "Four match tables, matte floor, zero glare, and a robot on table four.",
    specs: ["4 tables", "Robot trainer"]
  },
  {
    id: "fac-basket",
    name: "The hardwood",
    kind: "Basketball",
    plan: "basketball",
    surface: "#9A6224",
    size: "wide",
    note: "A full maple court with breakaway rims and a live scoreboard, splitting into halves for the evening run.",
    specs: ["Full court", "Shot clock", "Open runs"]
  },
  {
    id: "fac-turf",
    name: "North and south turf",
    kind: "Football",
    plan: "football",
    surface: "#1E5B2E",
    size: "tall",
    note: "FIFA Quality Pro surface across two pitches, floodlit to 500 lux, with dugouts and a referee on call.",
    specs: ["2 pitches", "500 lux", "Dugouts"]
  },
  {
    id: "fac-lounge",
    name: "Players' lounge",
    kind: "Rest",
    plan: "lounge",
    surface: "#1B3B33",
    size: "md",
    note: "Deep seating, cold towels, live scores on the wall, and enough plug points for a whole squad.",
    specs: ["Seats 60", "Live scores"]
  },
  {
    id: "fac-change",
    name: "Changing rooms",
    kind: "Rest",
    plan: "rooms",
    surface: "#254038",
    size: "sm",
    note: "Rain showers, day lockers, towel service, and a boot wash by the turf entrance.",
    specs: ["Day lockers", "Towel service"]
  },
  {
    id: "fac-social",
    name: "The terrace",
    kind: "Social",
    plan: "terrace",
    surface: "#2A3E2A",
    size: "md",
    note: "Courtside seating above the pickleball deck — where the match gets replayed properly, with commentary.",
    specs: ["Courtside", "Seats 80"]
  },
  {
    id: "fac-food",
    name: "Baseline kitchen",
    kind: "Food & drink",
    plan: "kitchen",
    surface: "#3A3324",
    size: "sm",
    note: "All-day counter: cold-pressed juice, protein bowls, filter coffee, and a proper post-match plate.",
    specs: ["06:00–23:30", "Members save 15%"]
  }
];

/* Gallery uses the same drawings, cropped and captioned. */
TOSS.gallery = [
  { id: "g1", caption: "Friday night doubles on Panorama 1", plan: "padel",       surface: "#12435E", size: "wide" },
  { id: "g2", caption: "Open play, roof deck",                plan: "pickleball",  surface: "#0E5C63", size: "tall" },
  { id: "g3", caption: "Squad session, Maple Hall",           plan: "badminton",   surface: "#8A5A2B", size: "" },
  { id: "g4", caption: "The evening run",                     plan: "basketball",  surface: "#9A6224", size: "" },
  { id: "g5", caption: "Sevens, south turf",                  plan: "football",    surface: "#1E5B2E", size: "wide" },
  { id: "g6", caption: "Ladder night, table three",           plan: "tabletennis", surface: "#14406B", size: "" },
  { id: "g7", caption: "Between games on the terrace",        plan: "terrace",     surface: "#2A3E2A", size: "" },
  { id: "g8", caption: "The lounge after a long rally",       plan: "lounge",      surface: "#1B3B33", size: "" },
  { id: "g9", caption: "Baseline Kitchen, first coffee",      plan: "kitchen",     surface: "#3A3324", size: "" },
  { id: "g10", caption: "Club championship finals day",       plan: "pickleball",  surface: "#0E5C63", size: "" }
];
