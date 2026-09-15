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
  `)

  const templateCount = (await db.execute('SELECT COUNT(*) AS n FROM templates')).rows[0].n
  if (templateCount === 0) {
    await db.execute({
      sql: 'INSERT INTO templates (destination, subtitle, default_duration, days, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [
        'Kerala Backwaters',
        'Munnar - Alleppey - Kumarakom',
        '5 Days / 4 Nights',
        JSON.stringify([
          { title: 'Day 1', text: 'Arrive Kochi, drive to Munnar. Check-in resort, evening tea garden walk.' },
          { title: 'Day 2', text: 'Munnar sightseeing - Eravikulam National Park, tea museum, Mattupetty dam.' },
          {
            title: 'Day 3',
            text: 'Drive to Alleppey, board houseboat, overnight backwater stay with onboard meals.',
          },
          { title: 'Day 4', text: 'Disembark houseboat, transfer to Kumarakom, leisure evening by the lake.' },
          { title: 'Day 5', text: 'Breakfast, drive to Kochi airport for departure.' },
        ]),
        new Date().toISOString(),
      ],
    })
  }
}

export default db
