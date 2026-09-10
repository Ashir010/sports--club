/* ==========================================================================
   TOSS CLUB — Mock catalogue: memberships, events, coaching
   Stands in for GET /memberships, GET /events, GET /programs, GET /coaches.
   ========================================================================== */

window.TOSS = window.TOSS || {};

/* --------------------------------------------------------------------------
   Memberships
   -------------------------------------------------------------------------- */

TOSS.memberships = [
  {
    id: "casual",
    name: "Casual Player",
    price: 0,
    cycle: "free to join",
    for: "You play when the mood takes you and want the club rate without a commitment.",
    featured: false,
    perks: [
      "Book any court up to 3 days ahead",
      "Standard court rates",
      "Equipment hire at ₹150 a session",
      "Open play sessions at ₹200 a drop-in",
      "Entry to community games"
    ],
    compare: {
      window: "3 days",
      discount: "—",
      guests: "1 guest",
      openPlay: "₹200 / drop-in",
      events: "Public entry",
      coaching: "Standard rate",
      hire: "₹150 / session",
      lockers: false,
      cancel: "12 hours"
    }
  },
  {
    id: "regular",
    name: "Regular Player",
    price: 2900,
    cycle: "per month",
    for: "Two or three sessions a week, usually the same sport, usually the same people.",
    featured: false,
    perks: [
      "Book up to 10 days ahead",
      "10% off every court booking",
      "Unlimited open play, all sports",
      "Free equipment hire",
      "Priority entry to club tournaments",
      "Day locker and towel service"
    ],
    compare: {
      window: "10 days",
      discount: "10%",
      guests: "2 guests",
      openPlay: "Unlimited",
      events: "Priority entry",
      coaching: "10% off",
      hire: "Free",
      lockers: true,
      cancel: "6 hours"
    }
  },
  {
    id: "premium",
    name: "Premium Member",
    price: 5900,
    cycle: "per month",
    for: "The club is your second home. You are on court most days and you want the peak slots.",
    featured: true,
    flag: "Most chosen",
    perks: [
      "Book up to 21 days ahead, including peak",
      "20% off every court booking",
      "Four peak-hour slots held for you each month",
      "Unlimited open play and ladder entry",
      "Two free coaching sessions a month",
      "Free entry to all club tournaments",
      "Permanent locker and guest passes"
    ],
    compare: {
      window: "21 days",
      discount: "20%",
      guests: "4 guests",
      openPlay: "Unlimited",
      events: "Free entry",
      coaching: "2 free / month",
      hire: "Free",
      lockers: true,
      cancel: "2 hours"
    }
  },
  {
    id: "team",
    name: "Team & Corporate",
    price: 18500,
    cycle: "per month, up to 12",
    for: "A squad, an office side, or a group that books the same slot every week.",
    featured: false,
    perks: [
      "One recurring slot locked for the season",
      "Up to 12 named players on one account",
      "25% off additional bookings",
      "A league place held for your side",
      "Two corporate event days a year",
      "One invoice, one point of contact"
    ],
    compare: {
      window: "Season slot",
      discount: "25%",
      guests: "Unlimited",
      openPlay: "Unlimited",
      events: "Free + 2 hosted days",
      coaching: "15% off",
      hire: "Free",
      lockers: true,
      cancel: "2 hours"
    }
  }
];

TOSS.compareRows = [
  { key: "window",   label: "Advance booking window" },
  { key: "discount", label: "Court discount" },
  { key: "guests",   label: "Guests per booking" },
  { key: "openPlay", label: "Open play sessions" },
  { key: "events",   label: "Tournaments and leagues" },
  { key: "coaching", label: "Coaching" },
  { key: "hire",     label: "Equipment hire" },
  { key: "lockers",  label: "Locker and towel service" },
  { key: "cancel",   label: "Free cancellation up to" }
];

/* --------------------------------------------------------------------------
   Events. `date` is an offset in days from today so the list never goes stale.
   -------------------------------------------------------------------------- */

TOSS.events = [
  {
    id: "ev-1",
    name: "Toss Club Padel Open",
    type: "Tournament",
    sport: "padel",
    sportName: "Padel",
    inDays: 6,
    time: "08:00 – 20:00",
    venue: "Glass house, courts 1–4",
    fee: 3500,
    feeNote: "per pair",
    slots: 32,
    slotsLeft: 7,
    note: "Men's, women's and mixed draws across one long Saturday. Group stage into knockouts, with the final played under lights."
  },
  {
    id: "ev-2",
    name: "Wednesday Pickleball Social",
    type: "Community game",
    sport: "pickleball",
    sportName: "Pickleball",
    inDays: 2,
    time: "19:00 – 21:30",
    venue: "Roof deck, courts 3–6",
    fee: 400,
    feeNote: "per player",
    slots: 48,
    slotsLeft: 22,
    note: "Rotating doubles, new partner every eight minutes. Turn up alone — you will not stay alone."
  },
  {
    id: "ev-3",
    name: "Sarjapur Sevens, Season 4",
    type: "League",
    sport: "football",
    sportName: "Football",
    inDays: 11,
    time: "Sundays, 18:00 – 22:00",
    venue: "South turf",
    fee: 24000,
    feeNote: "per team, 10 weeks",
    slots: 12,
    slotsLeft: 3,
    note: "Ten weeks of sevens, a referee every match, and a table that means something. Squad of up to twelve."
  },
  {
    id: "ev-4",
    name: "Badminton Ladder Night",
    type: "Friendly match",
    sport: "badminton",
    sportName: "Badminton",
    inDays: 4,
    time: "20:00 – 22:30",
    venue: "Maple hall",
    fee: 300,
    feeNote: "per player",
    slots: 36,
    slotsLeft: 14,
    note: "Challenge the player one rung above you. Win and you take their place on the board until someone takes yours."
  },
  {
    id: "ev-5",
    name: "Beginner Padel Clinic",
    type: "Coaching",
    sport: "padel",
    sportName: "Padel",
    inDays: 3,
    time: "07:00 – 08:30",
    venue: "Panorama 2",
    fee: 900,
    feeNote: "per player",
    slots: 8,
    slotsLeft: 2,
    note: "Ninety minutes on the three shots that matter first: the serve, the wall, and knowing when to leave it."
  },
  {
    id: "ev-6",
    name: "Corporate Sports Day",
    type: "Corporate",
    sport: "all",
    sportName: "All sports",
    inDays: 19,
    time: "09:00 – 17:00",
    venue: "Whole club",
    fee: 85000,
    feeNote: "up to 60 people",
    slots: 4,
    slotsLeft: 4,
    note: "The club taken over for a day: six sports, a running scoreboard, catering on the terrace, and a trophy nobody expected to care about."
  },
  {
    id: "ev-7",
    name: "Junior Basketball Jam",
    type: "Competition",
    sport: "basketball",
    sportName: "Basketball",
    inDays: 9,
    time: "10:00 – 14:00",
    venue: "The hardwood",
    fee: 500,
    feeNote: "per player",
    slots: 40,
    slotsLeft: 0,
    note: "Three-on-three for under-16s, running clock, everybody gets four games. Coaches on the sideline all morning."
  },
  {
    id: "ev-8",
    name: "Table Tennis Handicap Cup",
    type: "Tournament",
    sport: "table-tennis",
    sportName: "Table Tennis",
    inDays: 14,
    time: "17:00 – 22:00",
    venue: "Table tennis room",
    fee: 600,
    feeNote: "per player",
    slots: 24,
    slotsLeft: 11,
    note: "Handicapped from the ladder, so a first-timer can knock out a regular. It has happened twice already."
  }
];

/* --------------------------------------------------------------------------
   Coaching programmes and coaches
   -------------------------------------------------------------------------- */

TOSS.programs = [
  {
    id: "pr-beginner",
    name: "First Serve",
    level: 1,
    note: "Six weeks from never-played to holding your own in a social game. Any of the six sports.",
    format: "Group of 6",
    price: 4800,
    cycle: "for 6 sessions"
  },
  {
    id: "pr-intermediate",
    name: "Match Ready",
    level: 2,
    note: "You rally fine and lose anyway. This is about shot selection, court position and finishing points.",
    format: "Group of 4",
    price: 6900,
    cycle: "for 6 sessions"
  },
  {
    id: "pr-advanced",
    name: "Competition Squad",
    level: 3,
    note: "Twice-weekly squad training for players entering leagues and open draws. Entry by assessment.",
    format: "Squad of 8",
    price: 9500,
    cycle: "per month"
  },
  {
    id: "pr-personal",
    name: "One to One",
    level: 3,
    note: "A single coach, your video, and one thing fixed properly per session.",
    format: "Private",
    price: 2200,
    cycle: "per hour"
  },
  {
    id: "pr-group",
    name: "Bring Your Four",
    level: 2,
    note: "Book a coach with your own group. Same session, split four ways.",
    format: "Your group of 4",
    price: 3200,
    cycle: "per session"
  },
  {
    id: "pr-juniors",
    name: "Juniors & Teens",
    level: 1,
    note: "After-school squads for ages 7–16, with a holiday camp every term break.",
    format: "Age groups of 10",
    price: 5400,
    cycle: "per month"
  }
];

TOSS.coaches = [
  {
    id: "co-1",
    name: "Ananya Rao",
    sport: "Padel & Pickleball",
    years: 9,
    badge: "Head of Racket Sports",
    bio: "Former national tennis circuit player who moved to padel in 2018. Coaches the competition squad and runs the Tuesday beginner clinics."
  },
  {
    id: "co-2",
    name: "Vikram Shetty",
    sport: "Badminton",
    years: 14,
    badge: "BWF Level 2",
    bio: "Trained at the Prakash Padukone Academy. Specialises in footwork and the deception that makes a drop shot land twice."
  },
  {
    id: "co-3",
    name: "Marcus Fernandes",
    sport: "Football",
    years: 11,
    badge: "AFC B Licence",
    bio: "Ran youth development at two I-League academies. Now coaches the club sides and the Sunday sevens league."
  },
  {
    id: "co-4",
    name: "Sneha Kulkarni",
    sport: "Table Tennis",
    years: 7,
    badge: "State champion, 2019",
    bio: "Built the club ladder from twelve players to two hundred. Teaches service variation before anything else."
  },
  {
    id: "co-5",
    name: "Daniel Okoye",
    sport: "Basketball",
    years: 12,
    badge: "FIBA Level 1",
    bio: "Played professionally in Lagos and Chennai. Runs the junior jam and the Thursday shooting sessions."
  },
  {
    id: "co-6",
    name: "Priya Menon",
    sport: "Pickleball",
    years: 5,
    badge: "IPA Certified",
    bio: "Came to the sport at 41 and now coaches four squads. Best in the club at explaining the kitchen line in one sentence."
  }
];
