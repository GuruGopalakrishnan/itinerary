import { useEffect, useState } from 'react'

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function SettingsPanel({ settings, onSave }) {
  const [draft, setDraft] = useState(settings)
  const [saved, setSaved] = useState(false)

  useEffect(() => setDraft(settings), [settings])

  function set(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleLogoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    set('logo', dataUrl)
  }

  async function handleSave() {
    await onSave(draft)
    setSaved(true)
  }

  return (
    <div className="dashboard">
      <div className="hint-note">
        Set this up once — your logo, contact details, and standard booking terms are stored here and
        automatically added to every itinerary you generate.
      </div>

      <div className="tpl-editor" style={{ maxWidth: 720 }}>
        <div className="tpl-editor-head">
          <h2>Company Details</h2>
          <button type="button" className="btn-primary" onClick={handleSave}>
            {saved ? 'Saved ✓' : 'Save Settings'}
          </button>
        </div>

        <label className="field-label">
          Logo
          <input type="file" accept="image/*" onChange={handleLogoChange} />
        </label>
        {draft.logo && (
          <img src={draft.logo} alt="Logo preview" style={{ height: 64, objectFit: 'contain', alignSelf: 'flex-start' }} />
        )}

        <div className="form-row">
          <label className="field-label">
            Company Name
            <input type="text" value={draft.company_name || ''} onChange={(e) => set('company_name', e.target.value)} />
          </label>
          <label className="field-label">
            GST No
            <input type="text" value={draft.gst_no || ''} onChange={(e) => set('gst_no', e.target.value)} />
          </label>
        </div>

        <div className="form-row">
          <label className="field-label">
            Email
            <input type="text" value={draft.email || ''} onChange={(e) => set('email', e.target.value)} />
          </label>
          <label className="field-label">
            Phone
            <input type="text" value={draft.phone || ''} onChange={(e) => set('phone', e.target.value)} />
          </label>
        </div>

        <div className="form-row">
          <label className="field-label">
            Address
            <input type="text" value={draft.address || ''} onChange={(e) => set('address', e.target.value)} />
          </label>
          <label className="field-label" style={{ maxWidth: 220 }}>
            Website
            <input type="text" value={draft.website || ''} onChange={(e) => set('website', e.target.value)} />
          </label>
        </div>

        <label className="field-label">
          Booking Terms &amp; Conditions <span className="muted">(one line each)</span>
          <textarea rows={5} value={draft.booking_terms || ''} onChange={(e) => set('booking_terms', e.target.value)} />
        </label>

        <label className="field-label">
          Cancellation Policy <span className="muted">(one line each)</span>
          <textarea
            rows={4}
            value={draft.cancellation_policy || ''}
            onChange={(e) => set('cancellation_policy', e.target.value)}
          />
        </label>

        <label className="field-label">
          Important Notes <span className="muted">(one line each)</span>
          <textarea rows={4} value={draft.important_notes || ''} onChange={(e) => set('important_notes', e.target.value)} />
        </label>
      </div>
    </div>
  )
}
