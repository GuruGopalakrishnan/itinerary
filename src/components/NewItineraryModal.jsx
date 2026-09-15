import { useState } from 'react'
import { COMMON_DESTINATIONS } from '../data/destinations'
import { parsePastedItinerary } from '../lib/parsePastedItinerary'

const DAY_OPTIONS = Array.from({ length: 14 }, (_, i) => i + 2) // 2..15 days

function formatDate(isoDate) {
  if (!isoDate) return ''
  const d = new Date(`${isoDate}T00:00:00`)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NewItineraryModal({ companyName, onClose, onCreate }) {
  const [destination, setDestination] = useState('')
  const [days, setDays] = useState(5)
  const [departureDate, setDepartureDate] = useState('')
  const [clientName, setClientName] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const nights = days - 1

  async function handleGenerate() {
    if (!destination.trim()) return setError('Destination is required.')
    if (!clientName.trim()) return setError('Client name is required.')
    setError('')
    setSaving(true)
    try {
      const parsed = parsePastedItinerary(pasteText)
      const duration = `${days} Days / ${nights} Nights`
      const packageTitle = `${companyName ? `${companyName}'S ` : ''}${destination.toUpperCase()} (${nights} NIGHT & ${days} DAYS)`

      await onCreate({
        client_name: clientName.trim(),
        destination: destination.trim(),
        subtitle: '',
        duration,
        package_title: packageTitle,
        tagline: '',
        departure_dates: formatDate(departureDate),
        assembly_point: parsed.assembly_point,
        days: parsed.days.length > 0 ? parsed.days : [{ title: 'Day 1', heading: '', activities: '', highlight_place: '', meal_plan: '', photos: [] }],
        inclusions: parsed.inclusions,
        exclusions: parsed.exclusions,
        cost_rows: parsed.cost_rows,
        child_policy: parsed.child_policy,
        visa_info: parsed.visa_info,
        status: 'draft',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Itinerary</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="itin-form">
          <div className="form-row">
            <label className="field-label">
              Destination
              <input
                type="text"
                list="destination-options"
                placeholder="e.g. Singapore, Bangkok, Langkawi…"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <datalist id="destination-options">
                {COMMON_DESTINATIONS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
              <span className="auto-hint">Not listed? Just type the destination.</span>
            </label>

            <label className="field-label" style={{ maxWidth: 170 }}>
              Duration
              <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {DAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} Days
                  </option>
                ))}
              </select>
              <span className="auto-hint">
                {days} Days / {nights} Nights
              </span>
            </label>
          </div>

          <div className="form-row">
            <label className="field-label">
              Departure Date
              <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
            </label>
            <label className="field-label">
              Client Name
              <input
                type="text"
                placeholder="e.g. Priya & Karthik"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </label>
          </div>

          <label className="field-label">
            Paste DMC / Itinerary Details
            <textarea
              rows={10}
              placeholder={
                'Paste the day-by-day details, inclusions, exclusions, pricing etc. here — e.g.\n\nDay 1: Arrival\nArrive at airport\nCheck in hotel\nMeal Plan: Dinner\n\nINCLUSIONS:\nHotel stay\n...'
              }
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <span className="auto-hint">
              This gets sorted into Day 1 / Day 2 / Inclusions / Exclusions / Cost Table automatically — you can fix
              anything after generating, in Live Edit.
            </span>
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary" disabled={saving} onClick={handleGenerate}>
              {saving ? 'Generating…' : 'Generate Itinerary →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
