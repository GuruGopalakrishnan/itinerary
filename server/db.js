import { createClient } from '@libsql/client'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function localFileUrl() {
  try {
    const dir = path.dirname(fileURLToPath(import.meta.url))
    return `file:${path.join(dir, 'itinerary.db')}`
  } catch {
    return 'file:itinerary.db'
  }
}

const url = process.env.TURSO_DATABASE_URL || localFileUrl()
const authToken = process.env.TURSO_AUTH_TOKEN

const db = createClient(authToken ? { url, authToken } : { url })

let readyPromise = null

export function ready() {
  if (!readyPromise) {
    readyPromise = init()
  }
  return readyPromise
}

const THAILAND_DAYS = [
  {
    title: 'Day 1',
    heading: '14th Nov - ARRIVAL IN BANGKOK - TO PATTAYA',
    activities: [
      'Arrive in Bangkok - DON MUEANG INTL AIRPORT (DMK) at 0430hrs',
      'Clear the Immigration Process with the help of tour manager',
      'After Immigration and move to Pattaya with A/C Coach (02hrs travel)',
      'Arrival breakfast at the Tiger Topia',
      'After Breakfast, entry in Tiger Topia and take photos with the tiger',
      'Proceed to Floating Market with Boat ride',
      'Lunch at the Indian restaurant',
      'Check in at Hotel The Golden Beach or Similar (3*), check-in time 0200pm',
      'Spend some time for relaxation at the hotel',
      'Evening proceed to Alcazar show (01hr show)',
      'Dinner at the Indian Restaurant (Buffet Type)',
      'Overnight stay at the hotel - Pattaya',
    ].join('\n'),
    meal_plan: 'Breakfast, Lunch, Dinner',
    photos: [],
  },
  {
    title: 'Day 2',
    heading: '15th Nov - CORAL ISLAND TOUR - PATTAYA CITY TOUR',
    activities: [
      'Morning breakfast at the hotel (Continental food)',
      'Proceed to the Half Day Coral Island tour by speed boat',
      '(Water sport activities like Paragliding, underwater walking, jetski etc. are on own cost)',
      'Lunch at Indian Restaurant (Buffet type)',
      'Pattaya city tour with Gem Gallery and Big Buddha Temple',
      'Dinner at the Indian Restaurant (Buffet type)',
      'Overnight stay at the hotel - Pattaya',
    ].join('\n'),
    meal_plan: 'Breakfast, Lunch, Dinner',
    photos: [],
  },
  {
    title: 'Day 3',
    heading: '16th Nov - PATTAYA TO BANGKOK',
    activities: [
      'Morning breakfast at the hotel & check out (Continental food)',
      'Proceed to Nong Nooch Village show with lunch (Cultural show + Tram ride)',
      'Bangkok hotel check-in at The Ecotel or similar 3*',
      'Dinner at the Indian restaurant',
      'Overnight stay at the hotel - Bangkok',
    ].join('\n'),
    meal_plan: 'Breakfast, Lunch, Dinner',
    photos: [],
  },
  {
    title: 'Day 4',
    heading: '17th Nov - BANGKOK - MARINE PARK & SAFARI WORLD',
    activities: [
      'Morning breakfast at the hotel (Continental food)',
      'Moving towards Bangkok with Pvt Coach',
      'Proceed to Half day Marine Park & Safari World with lunch',
      'Lunch at the restaurant in Marine World (Indian Buffet type)',
      'Evening Chao Phraya Princess Cruise with dinner (Indian food)',
      'Check-in at Arawana Regency Park Sukhumvit 22 or Similar (3*)',
      'Overnight stay at the hotel - Bangkok',
    ].join('\n'),
    meal_plan: 'Breakfast, Lunch, Dinner',
    photos: [],
  },
  {
    title: 'Day 5',
    heading: '18th Nov - BANGKOK - DEPARTURE',
    activities: [
      'Morning breakfast at the hotel & check out (Continental food)',
      'City tour in Bangkok for 02hrs approx. (Golden Buddha Temple & Marble Temple with entrance)',
      'Lunch at Indian restaurant',
      'Shopping tour in Indra Market (03hrs)',
      'Moving to airport for departure',
    ].join('\n'),
    meal_plan: 'Breakfast, Lunch',
    photos: [],
  },
]

const THAILAND_INCLUSIONS = [
  '04 Nights in above mentioned hotel',
  '04 breakfasts (Continental food) in hotel',
  'Lunch and dinner as per mentioned in the itinerary',
  'Arrival day breakfast at Tiger Topia',
  'Tiger Topia Sriracha entrance ticket and photo session with tiger',
  'Pattaya Alcazar Show',
  'Coral Island Tour in Speed Boat with lunch (water activities on own cost)',
  'Pattaya Floating Market with rowing boat',
  'Pattaya City tour (Big Buddha + Pattaya view point + Gems Gallery)',
  'Nong Nooch Village show with lunch',
  'Bangkok City tour (Golden Buddha & Marble Temple)',
  'Safari World and Marine Park with lunch (does not operate on Monday)',
  'Chao Phraya dinner cruise (Cruise SIC - transfer PVT)',
  'All private transfers by air-conditioned coach',
  'Tourism tax in hotel',
  'GST & TCS',
].join('\n')

const THAILAND_EXCLUSIONS = [
  'Airfare',
  'Check-in baggage cost (purchased separately, starting from 20kg/25kg/30kg)',
  'Packed dinner on departure day (optional, inform tour coordinator in advance)',
  'Tips for guide and drivers',
  'Travel Insurance',
  'Guaranteed early check-in / late checkout charges (standard check-in 14:00 Hrs, checkout 12:00 Hrs)',
  'Unutilized services are non-refundable',
  'Meals other than mentioned in the Inclusions column',
  'Cost for services not mentioned in "Inclusions"',
  'Personal expenses - laundry, soft & hard drinks, bottled water, incidentals, porterage, bell-boy charges, tips etc.',
].join('\n')

const THAILAND_COST_ROWS = [
  { component: 'Return Airfare', cost: '₹ 15,000', remarks: 'Only 7KG hand luggage (flight fare subject to change)' },
  {
    component: 'Land Package Cost',
    cost: '₹ 29,000',
    remarks: 'Includes hotel + tours + transfers + entrances + all meals + English speaking guide + tour manager',
  },
  { component: 'Visa', cost: 'Arrival Card', remarks: 'Apply before 02 days of departure' },
  { component: 'Total Package Cost', cost: '₹ 44,000', remarks: 'Per person (all inclusive)' },
  { component: 'Single Supplement', cost: '₹ 51,000', remarks: 'Per person (all inclusive, flight fare subject to change)' },
]

const DEFAULT_BOOKING_TERMS = [
  'Booking confirmation requires a minimum advance payment of 50% of the total package cost per person.',
  'Balance payment to be made 10 days prior to departure.',
  'All bookings are subject to availability at the time of confirmation.',
  'Hotels mentioned are indicative; in case of non-availability, similar category hotels will be provided.',
  'Standard check-in time at hotels is 2:00 PM and check-out is 12:00 PM.',
  'Early check-in / late check-out is subject to hotel availability and additional charges.',
  'Any increase in airfare, visa fees, government taxes, fuel surcharges, or exchange rates will be borne by the passenger.',
  'Passport must be valid for at least 6 months from the date of travel.',
].join('\n')

const DEFAULT_CANCELLATION_POLICY = [
  '30 days or more prior to departure — 25% of the package cost will be charged',
  '15–29 days prior to departure — 50% of the package cost will be charged',
  '07–14 days prior to departure — 75% of the package cost will be charged',
  'Less than 07 days prior to departure / No show — 100% of the package cost will be charged',
].join('\n')

const DEFAULT_IMPORTANT_NOTES = [
  'Visa fees are non-refundable once applied, irrespective of the outcome.',
  'Flight tickets, once issued, are subject to airline cancellation policy.',
  'Refund (if any) will be processed within 15–20 working days after cancellation, subject to supplier approval.',
  'Itinerary may be subject to change due to climate/weather and can be rescheduled by management depending on the situation.',
].join('\n')

async function addColumn(table, ddl) {
  try {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${ddl}`)
  } catch (err) {
    if (!/duplicate column/i.test(err.message)) throw err
  }
}

async function init() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      destination TEXT NOT NULL,
      subtitle TEXT,
      default_duration TEXT,
      days TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS itineraries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      destination TEXT NOT NULL,
      subtitle TEXT,
      duration TEXT,
      days TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      company_name TEXT,
      gst_no TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      website TEXT,
      logo TEXT,
      booking_terms TEXT,
      cancellation_policy TEXT,
      important_notes TEXT
    );
  `)

  // Templates: extend with package title, tagline, inclusions/exclusions, cost table, child policy, visa info.
  await addColumn('templates', 'package_title TEXT')
  await addColumn('templates', 'tagline TEXT')
  await addColumn('templates', 'inclusions TEXT')
  await addColumn('templates', 'exclusions TEXT')
  await addColumn('templates', 'cost_rows TEXT')
  await addColumn('templates', 'child_policy TEXT')
  await addColumn('templates', 'visa_info TEXT')

  // Itineraries: same extension, plus per-trip departure date and assembly point.
  await addColumn('itineraries', 'package_title TEXT')
  await addColumn('itineraries', 'tagline TEXT')
  await addColumn('itineraries', 'departure_dates TEXT')
  await addColumn('itineraries', 'assembly_point TEXT')
  await addColumn('itineraries', 'inclusions TEXT')
  await addColumn('itineraries', 'exclusions TEXT')
  await addColumn('itineraries', 'cost_rows TEXT')
  await addColumn('itineraries', 'child_policy TEXT')
  await addColumn('itineraries', 'visa_info TEXT')

  const settingsRow = (await db.execute('SELECT id FROM settings WHERE id = 1')).rows[0]
  if (!settingsRow) {
    await db.execute({
      sql: `INSERT INTO settings
        (id, company_name, gst_no, email, phone, address, website, logo, booking_terms, cancellation_policy, important_notes)
        VALUES (1, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
      args: [
        'ABCD HOLIDAYS',
        '33ACFFA6468D2ZJ',
        'abcdholidayhome51@gmail.com',
        '+91 843 853 2888',
        '19/11, Sharan Centre, Gokhale Rd, Chinna Chokikulam, Madurai, 625002',
        'www.abcdholidays.in',
        DEFAULT_BOOKING_TERMS,
        DEFAULT_CANCELLATION_POLICY,
        DEFAULT_IMPORTANT_NOTES,
      ],
    })
  }

  const templateCount = (await db.execute('SELECT COUNT(*) AS n FROM templates')).rows[0].n
  if (templateCount === 0) {
    await db.execute({
      sql: `INSERT INTO templates
        (destination, subtitle, default_duration, package_title, tagline, days, inclusions, exclusions, cost_rows, child_policy, visa_info, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'Bangkok & Pattaya',
        'Thailand Group Tour',
        '5 Days / 4 Nights',
        "ABCD'S BANGKOK & PATTAYA (4 NIGHT & 5 DAYS)",
        'New places, new friends, unforgettable moments',
        JSON.stringify(THAILAND_DAYS),
        THAILAND_INCLUSIONS,
        THAILAND_EXCLUSIONS,
        JSON.stringify(THAILAND_COST_ROWS),
        'Infants (0-2 yrs): free of cost in land & flight ticket as per policy\nChildren 3-7 yrs: 75% of adult rate\nChildren 7-11 yrs: 85% of adult rate\nFrom 11 yrs: charged as adult',
        'Arrival visa / arrival card - apply before 02 days of departure',
        new Date().toISOString(),
      ],
    })
  }
}

export default db
