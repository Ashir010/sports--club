/* ==========================================================================
   TOSS CLUB — Mock catalogue: community, testimonials, FAQ
   Stands in for GET /groups, GET /leaderboard, GET /reviews, GET /faq.
   ========================================================================== */

window.TOSS = window.TOSS || {};

/* --------------------------------------------------------------------------
   Player pool used by the matchmaker. In production this is a query against
   player profiles filtered by sport, level, availability and proximity.
   -------------------------------------------------------------------------- */

TOSS.players = [
  { id: "p1",  name: "Rhea Nair",        sport: "pickleball",   level: "Improver",   when: "Weekday evenings", games: 62,  note: "Doubles, prefers the right side" },
  { id: "p2",  name: "Karan Bhatia",     sport: "pickleball",   level: "Beginner",   when: "Weekend mornings", games: 9,   note: "Learning, happy to be carried" },
  { id: "p3",  name: "Nikhil Sethi",     sport: "padel",        level: "Advanced",   when: "Weekday evenings", games: 148, note: "League player, looking for a regular partner" },
  { id: "p4",  name: "Meera Iyer",       sport: "padel",        level: "Improver",   when: "Weekday mornings", games: 41,  note: "Mixed doubles preferred" },
  { id: "p5",  name: "Arjun Deshpande",  sport: "badminton",    level: "Advanced",   when: "Late nights",      games: 210, note: "Singles, plays until they close" },
  { id: "p6",  name: "Fatima Sheikh",    sport: "badminton",    level: "Improver",   when: "Weekend mornings", games: 55,  note: "Doubles, ladder rung 14" },
  { id: "p7",  name: "Joel Mathew",      sport: "table-tennis", level: "Beginner",   when: "Weekday evenings", games: 16,  note: "New to the ladder, keen" },
  { id: "p8",  name: "Ishita Verma",     sport: "table-tennis", level: "Advanced",   when: "Weekday evenings", games: 132, note: "Loops everything, will tell you why" },
  { id: "p9",  name: "Rohan Pillai",     sport: "basketball",   level: "Improver",   when: "Weekday evenings", games: 74,  note: "Runs the Tuesday fives, always short two" },
  { id: "p10", name: "Tanvi Joshi",      sport: "basketball",   level: "Beginner",   when: "Weekend mornings", games: 12,  note: "Wants a shooting partner" },
  { id: "p11", name: "Sameer Qureshi",   sport: "football",     level: "Improver",   when: "Weekend evenings", games: 88,  note: "Left back, brings a ball" },
  { id: "p12", name: "Aditi Kamath",     sport: "football",     level: "Advanced",   when: "Weekday evenings", games: 119, note: "Captains a mixed side, one place open" },
  { id: "p13", name: "Dev Krishnan",     sport: "pickleball",   level: "Advanced",   when: "Weekend mornings", games: 175, note: "Ladder rung 3, coaches on Sundays" },
  { id: "p14", name: "Lena Fernandes",   sport: "padel",        level: "Beginner",   when: "Weekend mornings", games: 6,   note: "Two clinics in, ready for a real game" },
  { id: "p15", name: "Harsh Vora",       sport: "badminton",    level: "Beginner",   when: "Weekday mornings", games: 21,  note: "Early bird, 6 a.m. regular" },
  { id: "p16", name: "Zoya Ahmed",       sport: "football",     level: "Beginner",   when: "Weekend mornings", games: 8,   note: "Goalkeeper, learning fast" }
];

TOSS.leaderboard = {
  pickleball: [
    { rank: 1, name: "Dev Krishnan",   played: 48, won: 41, pts: 1284, trend: "up" },
    { rank: 2, name: "Ananya Rao",     played: 44, won: 36, pts: 1211, trend: "flat" },
    { rank: 3, name: "Rhea Nair",      played: 52, won: 34, pts: 1188, trend: "up" },
    { rank: 4, name: "Priya Menon",    played: 39, won: 30, pts: 1102, trend: "down" },
    { rank: 5, name: "Sameer Qureshi", played: 41, won: 28, pts: 1067, trend: "up" },
    { rank: 6, name: "Karan Bhatia",   played: 33, won: 21, pts: 964,  trend: "up" },
    { rank: 7, name: "Meera Iyer",     played: 36, won: 20, pts: 931,  trend: "down" },
    { rank: 8, name: "Joel Mathew",    played: 29, won: 15, pts: 878,  trend: "flat" }
  ],
  padel: [
    { rank: 1, name: "Nikhil Sethi",   played: 56, won: 47, pts: 1402, trend: "flat" },
    { rank: 2, name: "Ananya Rao",     played: 51, won: 42, pts: 1355, trend: "up" },
    { rank: 3, name: "Aditi Kamath",   played: 47, won: 35, pts: 1240, trend: "up" },
    { rank: 4, name: "Meera Iyer",     played: 44, won: 31, pts: 1176, trend: "down" },
    { rank: 5, name: "Marcus Fernandes", played: 38, won: 26, pts: 1088, trend: "flat" },
    { rank: 6, name: "Lena Fernandes", played: 22, won: 12, pts: 902,  trend: "up" },
    { rank: 7, name: "Rohan Pillai",   played: 26, won: 13, pts: 887,  trend: "down" },
    { rank: 8, name: "Harsh Vora",     played: 19, won: 8,  pts: 812,  trend: "flat" }
  ],
  badminton: [
    { rank: 1, name: "Arjun Deshpande", played: 71, won: 63, pts: 1518, trend: "flat" },
    { rank: 2, name: "Vikram Shetty",   played: 62, won: 52, pts: 1447, trend: "up" },
    { rank: 3, name: "Fatima Sheikh",   played: 66, won: 45, pts: 1330, trend: "up" },
    { rank: 4, name: "Ishita Verma",    played: 54, won: 36, pts: 1215, trend: "down" },
    { rank: 5, name: "Tanvi Joshi",     played: 48, won: 29, pts: 1120, trend: "up" },
    { rank: 6, name: "Harsh Vora",      played: 44, won: 24, pts: 1041, trend: "flat" },
    { rank: 7, name: "Zoya Ahmed",      played: 31, won: 15, pts: 940,  trend: "up" },
    { rank: 8, name: "Karan Bhatia",    played: 28, won: 11, pts: 869,  trend: "down" }
  ],
  "table-tennis": [
    { rank: 1, name: "Ishita Verma",   played: 83, won: 71, pts: 1602, trend: "flat" },
    { rank: 2, name: "Sneha Kulkarni", played: 74, won: 61, pts: 1524, trend: "up" },
    { rank: 3, name: "Dev Krishnan",   played: 58, won: 40, pts: 1289, trend: "down" },
    { rank: 4, name: "Joel Mathew",    played: 61, won: 38, pts: 1248, trend: "up" },
    { rank: 5, name: "Rhea Nair",      played: 45, won: 27, pts: 1104, trend: "up" },
    { rank: 6, name: "Nikhil Sethi",   played: 39, won: 21, pts: 1012, trend: "flat" },
    { rank: 7, name: "Zoya Ahmed",     played: 34, won: 17, pts: 954,  trend: "up" },
    { rank: 8, name: "Harsh Vora",     played: 30, won: 12, pts: 881,  trend: "down" }
  ],
  basketball: [
    { rank: 1, name: "Daniel Okoye",   played: 40, won: 33, pts: 1288, trend: "flat" },
    { rank: 2, name: "Rohan Pillai",   played: 44, won: 31, pts: 1234, trend: "up" },
    { rank: 3, name: "Marcus Fernandes", played: 36, won: 24, pts: 1140, trend: "up" },
    { rank: 4, name: "Aditi Kamath",   played: 33, won: 21, pts: 1078, trend: "down" },
    { rank: 5, name: "Sameer Qureshi", played: 38, won: 22, pts: 1055, trend: "flat" },
    { rank: 6, name: "Tanvi Joshi",    played: 27, won: 13, pts: 946,  trend: "up" },
    { rank: 7, name: "Karan Bhatia",   played: 24, won: 10, pts: 892,  trend: "down" },
    { rank: 8, name: "Zoya Ahmed",     played: 21, won: 8,  pts: 851,  trend: "flat" }
  ],
  football: [
    { rank: 1, name: "Sarjapur Strays", played: 18, won: 14, pts: 44, trend: "flat" },
    { rank: 2, name: "Kaikondrahalli FC", played: 18, won: 13, pts: 41, trend: "up" },
    { rank: 3, name: "Baseline United", played: 18, won: 11, pts: 36, trend: "up" },
    { rank: 4, name: "Late Tackle XI",  played: 18, won: 9,  pts: 30, trend: "down" },
    { rank: 5, name: "North Turf Nomads", played: 18, won: 8, pts: 27, trend: "flat" },
    { rank: 6, name: "Sunday Sevens",   played: 18, won: 6,  pts: 21, trend: "down" },
    { rank: 7, name: "Offside Rulers",  played: 18, won: 4,  pts: 15, trend: "up" },
    { rank: 8, name: "The Substitutes", played: 18, won: 2,  pts: 9,  trend: "flat" }
  ]
};

TOSS.groups = [
  { id: "gr-1", name: "6 a.m. Club",        note: "Badminton and pickleball before work. Coffee after, always.", members: 84,  meets: "Mon–Fri, 06:00" },
  { id: "gr-2", name: "Women on Court",     note: "Women-only social play across all six sports, coached once a month.", members: 152, meets: "Wed & Sat" },
  { id: "gr-3", name: "Padel Beginners",    note: "Nobody here has been playing more than a season. Ask any question.", members: 96,  meets: "Tue, 19:00" },
  { id: "gr-4", name: "Sunday Sevens",      note: "The football league squad pool. Injuries happen; spaces open.", members: 118, meets: "Sun, 18:00" },
  { id: "gr-5", name: "Ladder Regulars",    note: "Table tennis ladder challengers. Box scores posted every night.", members: 203, meets: "Daily, 20:00" },
  { id: "gr-6", name: "Juniors & Parents",  note: "Under-16 squads plus the parents who stay and play on court six.", members: 74,  meets: "Sat, 09:00" }
];

/* --------------------------------------------------------------------------
   Testimonials. Replace `text`, `name`, `sport`, `rating` with real reviews;
   `photo` accepts a path under assets/img/ and falls back to initials.
   -------------------------------------------------------------------------- */

TOSS.testimonials = [
  {
    id: "t1",
    name: "Rhea Nair",
    sport: "Pickleball, member since 2023",
    rating: 5,
    photo: "",
    text: "I came for one trial session and joined before I left the building. Six months later I know forty people by name and I have never once had to find my own fourth."
  },
  {
    id: "t2",
    name: "Nikhil Sethi",
    sport: "Padel, Premium member",
    rating: 5,
    photo: "",
    text: "The glass courts are the best I have played on in the city, and the covered pair means the monsoon stopped being an excuse. Booking takes about fifteen seconds."
  },
  {
    id: "t3",
    name: "Fatima Sheikh",
    sport: "Badminton, Regular member",
    rating: 4,
    photo: "",
    text: "Sprung floors and no draught, which sounds small until you have played somewhere with neither. Peak slots go fast, so I book the moment my window opens."
  },
  {
    id: "t4",
    name: "Marcus Fernandes",
    sport: "Football, team captain",
    rating: 5,
    photo: "",
    text: "We moved the whole side over for the sevens league. One invoice, a referee every week, and a table that our group chat argues about until Tuesday."
  },
  {
    id: "t5",
    name: "Joel Mathew",
    sport: "Table tennis, Casual player",
    rating: 5,
    photo: "",
    text: "I turned up alone on a Thursday, got put on the ladder, and lost four games in a row to people who then bought me a coffee. That is the whole club, really."
  },
  {
    id: "t6",
    name: "Tanvi Joshi",
    sport: "Basketball, junior programme parent",
    rating: 5,
    photo: "",
    text: "My daughter does the junior jam and I ended up in the Saturday shooting session. Two years ago neither of us played anything."
  }
];

/* --------------------------------------------------------------------------
   FAQ
   -------------------------------------------------------------------------- */

TOSS.faq = [
  {
    q: "How do I book a court?",
    a: "Pick a sport, a court, a date and a time in the booking section above, add your details, and pay. It takes under a minute. You will get a confirmation on WhatsApp and email with a code to show at the desk. Members can also rebook their last slot in one tap."
  },
  {
    q: "Do I need a membership to play?",
    a: "No. Anyone can book a court at the standard rate. Membership gets you a longer advance booking window, a discount on every booking, free equipment hire and unlimited open play — it pays for itself at around two sessions a week."
  },
  {
    q: "What does it cost?",
    a: "Court rates run from ₹350 an hour for a table tennis table to ₹2,800 an hour for the seven-a-side turf at peak. Peak is 18:00 to 22:00; everything else is off-peak. Live prices show in the booking flow before you pay, with your membership discount already applied."
  },
  {
    q: "Can I cancel or move a booking?",
    a: "Yes. Cancel free up to 12 hours before your slot as a casual player, 6 hours as a Regular member and 2 hours as a Premium or Team member. Inside that window the slot is charged, but you can transfer it to another player at no cost."
  },
  {
    q: "Can I hire equipment?",
    a: "Paddles, rackets, bats, balls, shuttles, bibs and match balls are all at the desk. Hire is ₹150 a session for casual players and free on every membership tier. Grip tape, overgrips and feather shuttles are on sale at the pro shop."
  },
  {
    q: "How does coaching work?",
    a: "Six programmes run from First Serve for complete beginners up to the Competition Squad, plus one-to-one sessions with any of our coaches. Book a single session to try a coach before committing to a block. Junior squads run after school and through term breaks."
  },
  {
    q: "How do I enter a tournament or league?",
    a: "Every event in the events section shows its remaining slots and its entry fee. Register there and pay online. Members get priority entry, and Premium and Team members enter club tournaments free. League sides register once per season with a squad of up to twelve."
  },
  {
    q: "Can I book for a large group or a company?",
    a: "Yes. Up to twelve people you can book directly through the site by choosing a larger court. For anything bigger — a corporate day, a birthday, a full club takeover — write to play@tossclub.in and we will build the day around you."
  },
  {
    q: "When is the club open?",
    a: "06:00 to midnight Monday to Thursday, 06:00 to 01:00 on Friday, 05:30 to 01:00 on Saturday, and 05:30 to midnight on Sunday. The kitchen closes half an hour before the courts do. Last booking starts one hour before close."
  },
  {
    q: "It is my first time. What should I bring?",
    a: "Clean indoor shoes with a non-marking sole, water, and nothing else — we lend the rest. Arrive fifteen minutes early and a host will show you the courts, the lockers and the kitchen. If you are coming alone, tell us and we will put you in a social game."
  }
];
