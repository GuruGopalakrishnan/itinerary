import { useState } from 'react'

export default function NewItineraryModal({ templates, onClose, onCreate }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? null)
  const [duration, setDuration] = useState(templates[0]?.default_duration ?? '')
  const [clientName, setClientName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const selected = templates.find((t) => t.id === templateId)

  function pickTemplate(t) {
    setTemplateId(t.id)
    setDuration(t.default_duration)
  }

  async function handleGenerate() {
    if (!selected) return setError('Add a destination template first.')
    if (!clientName.trim()) return setError('Client name is required.')
    setError('')
    setSaving(true)
    try {
      await onCreate({
        client_name: clientName.trim(),
        destination: selected.destination,
        subtitle: selected.subtitle,
        duration,
        days: selected.days,
        status: 'draft',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Itinerary</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="itin-form">
          {templates.length === 0 ? (
            <p className="muted">No destination templates yet — add one under "Templates" first.</p>
          ) : (
            <>
              <label className="field-label">
                Destination Template
                <div className="dest-picker">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`dest-pick-card${templateId === t.id ? ' selected' : ''}`}
                      onClick={() => pickTemplate(t)}
                    >
                      <span className="dest-pick-name">{t.destination}</span>
                      <span className="dest-pick-meta">{t.subtitle}</span>
                    </button>
                  ))}
                </div>
              </label>

              <div className="form-row">
                <label className="field-label">
                  Duration
                  <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} />
                  <span className="auto-hint">Auto-filled from template — edit if the trip is shorter or longer</span>
                </label>
              </div>

              <label className="field-label">
                Client Name
                <input
                  type="text"
                  placeholder="e.g. Priya & Karthik"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
