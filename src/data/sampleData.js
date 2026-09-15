// Shown only when the app can't reach a live backend (e.g. the GitHub Pages
// preview, which is frontend-only) — lets the deployed link still show what
// the app looks like with data in it.

export const SAMPLE_TEMPLATES = [
  {
    id: 1,
    destination: 'Kerala Backwaters',
    subtitle: 'Munnar - Alleppey - Kumarakom',
    default_duration: '5 Days / 4 Nights',
    days: [
      { title: 'Day 1', text: 'Arrive Kochi, drive to Munnar. Check-in resort, evening tea garden walk.' },
      { title: 'Day 2', text: 'Munnar sightseeing - Eravikulam National Park, tea museum, Mattupetty dam.' },
      { title: 'Day 3', text: 'Drive to Alleppey, board houseboat, overnight backwater stay with onboard meals.' },
      { title: 'Day 4', text: 'Disembark houseboat, transfer to Kumarakom, leisure evening by the lake.' },
      { title: 'Day 5', text: 'Breakfast, drive to Kochi airport for departure.' },
    ],
    created_at: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 2,
    destination: 'Ooty - Kodaikanal',
    subtitle: 'Hill Station Escape',
    default_duration: '4 Days / 3 Nights',
    days: [
      { title: 'Day 1', text: 'Arrive Coimbatore, drive to Ooty. Check-in, evening at Ooty Lake.' },
      { title: 'Day 2', text: 'Ooty sightseeing - Botanical Garden, Doddabetta Peak, Tea Museum.' },
      { title: 'Day 3', text: 'Drive to Kodaikanal via Palani. Check-in, evening at Kodai Lake.' },
      { title: 'Day 4', text: 'Coaker\'s Walk, Pillar Rocks, drive back to Coimbatore for departure.' },
    ],
    created_at: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 3,
    destination: 'Goa Beach Holiday',
    subtitle: 'North & South Goa',
    default_duration: '3 Days / 2 Nights',
    days: [
      { title: 'Day 1', text: 'Arrive Goa, check-in North Goa resort. Evening at Baga/Calangute beach.' },
      { title: 'Day 2', text: 'South Goa day trip - Colva, Palolem beach, spice plantation visit.' },
      { title: 'Day 3', text: 'Leisure morning, Fort Aguada, departure.' },
    ],
    created_at: '2026-09-01T00:00:00.000Z',
  },
]

export const SAMPLE_ITINERARIES = [
  {
    id: 1,
    client_name: 'Priya & Karthik',
    destination: 'Kerala Backwaters',
    subtitle: 'Munnar - Alleppey - Kumarakom',
    duration: '5 Days / 4 Nights',
    days: SAMPLE_TEMPLATES[0].days,
    status: 'sent',
    created_at: '2026-09-12T00:00:00.000Z',
  },
  {
    id: 2,
    client_name: 'Suresh Family',
    destination: 'Ooty - Kodaikanal',
    subtitle: 'Hill Station Escape',
    duration: '4 Days / 3 Nights',
    days: SAMPLE_TEMPLATES[1].days,
    status: 'confirmed',
    created_at: '2026-09-10T00:00:00.000Z',
  },
  {
    id: 3,
    client_name: 'Anitha Raj',
    destination: 'Goa Beach Holiday',
    subtitle: 'North & South Goa',
    duration: '3 Days / 2 Nights',
    days: SAMPLE_TEMPLATES[2].days,
    status: 'draft',
    created_at: '2026-09-09T00:00:00.000Z',
  },
]
