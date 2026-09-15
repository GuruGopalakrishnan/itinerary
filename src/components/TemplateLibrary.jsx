import { useEffect, useState } from 'react'

function emptyDraft() {
  return { destination: '', subtitle: '', default_duration: '', days: [{ title: 'Day 1', text: '' }] }
}

export default function TemplateLibrary({ templates, onAdd, onUpdate, onDelete }) {
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? null)
  const [draft, setDraft] = useState(null)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    if (isNew) return
    if (selectedId == null && templates.length > 0) {
      setSelectedId(templates[0].id)
      return
    }
    const selected = templates.find((t) => t.id === selectedId)
    if (selected) setDraft({ ...selected, days: selected.days.map((d) => ({ ...d })) })
  }, [selectedId, templates, isNew])

  function selectTemplate(t) {
    setIsNew(false)
    setSelectedId(t.id)
  }

  function startNew() {
    setIsNew(true)
    setSelectedId(null)
    setDraft(emptyDraft())
  }

  function updateDay(index, field, value) {
    setDraft((prev) => {
      const days = prev.days.map((d, i) => (i === index ? { ...d, [field]: value } : d))
      return { ...prev, days }
    })
  }

  function addDay() {
    setDraft((prev) => ({ ...prev, days: [...prev.days, { title: `Day ${prev.days.length + 1}`, text: '' }] }))
  }

  function removeDay(index) {
    setDraft((prev) => ({ ...prev, days: prev.days.filter((_, i) => i !== index) }))
  }

  async function save() {
    if (!draft.destination.trim()) return
    if (isNew) {
      const created = await onAdd(draft)
      setIsNew(false)
      setSelectedId(created.id)
    } else {
      await onUpdate(draft.id, draft)
    }
  }

  async function remove() {
    if (!draft?.id) return
    if (!confirm(`Delete "${draft.destination}" template?`)) return
    await onDelete(draft.id)
    setSelectedId(null)
    setDraft(null)
  }

  return (
    <div className="dashboard">
      <div className="hint-note">
        This is your library — paste a short day-by-day itinerary once per destination. Every new itinerary you
        generate reuses this as the starting content.
      </div>
      <div className="tpl-layout">
        <div className="tpl-list">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tpl-card${!isNew && selectedId === t.id ? ' active' : ''}`}
              onClick={() => selectTemplate(t)}
            >
              <span className="tpl-card-name">{t.destination}</span>
              <span className="tpl-card-meta">
                {t.subtitle}
                {t.subtitle ? ' · ' : ''}
                {t.default_duration}
              </span>
            </button>
          ))}
          <button type="button" className="tpl-add" onClick={startNew}>
            + Add Destination Template
          </button>
        </div>

        {draft && (
          <div className="tpl-editor">
            <div className="tpl-editor-head">
              <h2>{isNew ? 'New Destination Template' : draft.destination || 'Untitled'}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {!isNew && (
                  <button type="button" className="btn-secondary" onClick={remove}>
                    Delete
                  </button>
                )}
                <button type="button" className="btn-primary" onClick={save}>
                  {isNew ? 'Create Template' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="form-row">
              <label className="field-label">
                Destination Name
                <input
                  type="text"
                  value={draft.destination}
                  onChange={(e) => setDraft({ ...draft, destination: e.target.value })}
                />
              </label>
              <label className="field-label" style={{ maxWidth: 200 }}>
                Default Duration
                <input
                  type="text"
                  placeholder="e.g. 5 Days / 4 Nights"
                  value={draft.default_duration}
                  onChange={(e) => setDraft({ ...draft, default_duration: e.target.value })}
                />
              </label>
            </div>
            <label className="field-label">
              Route / Sub-title
              <input
                type="text"
                placeholder="e.g. Munnar - Alleppey - Kumarakom"
                value={draft.subtitle}
                onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              />
            </label>

            {draft.days.map((day, i) => (
              <div className="day-block" key={i}>
                <div className="day-block-head">
                  <span className="day-title">{day.title.toUpperCase()}</span>
                  {draft.days.length > 1 && (
                    <button type="button" className="icon-btn-sm" onClick={() => removeDay(i)} title="Remove day">
                      ×
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  placeholder="Short itinerary notes for this day…"
                  value={day.text}
                  onChange={(e) => updateDay(i, 'text', e.target.value)}
                />
              </div>
            ))}
            <button type="button" className="btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={addDay}>
              + Add Day
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
