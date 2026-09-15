import { useState } from 'react'
import { api } from '../api/client'
import { MOST_TRAVELLED_COUNTRIES, MORE_SOUTHEAST_ASIA } from '../data/countries'
import TemplateEditorFields from './TemplateEditorFields'

function emptyDraft() {
  return {
    destination: '',
    subtitle: '',
    default_duration: '',
    package_title: '',
    tagline: '',
    assembly_point: '',
    days: [{ title: 'Day 1', heading: '', activities: '', highlight_place: '', meal_plan: '', photos: [] }],
    inclusions: '',
    exclusions: '',
    cost_rows: [],
    child_policy: '',
    visa_info: '',
  }
}

export default function ImportWizardModal({ onClose, onSave }) {
  const [step, setStep] = useState(1)
  const [country, setCountry] = useState('')
  const [countrySearch, setCountrySearch] = useState('')
  const [customCountry, setCustomCountry] = useState('')
  const [destinationName, setDestinationName] = useState('')
  const [file, setFile] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [draft, setDraft] = useState(null)
  const [rawHtml, setRawHtml] = useState('')
  const [rawDocxBase64, setRawDocxBase64] = useState('')
  const [saving, setSaving] = useState(false)

  const allCountries = [...MOST_TRAVELLED_COUNTRIES, ...MORE_SOUTHEAST_ASIA]
  const filteredMostTravelled = MOST_TRAVELLED_COUNTRIES.filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase()))
  const filteredMoreSea = MORE_SOUTHEAST_ASIA.filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase()))

  function pickCountry(c) {
    setCountry(c)
    setStep(2)
  }

  function confirmCustomCountry() {
    if (!customCountry.trim()) return
    setCountry(customCountry.trim())
    setStep(2)
  }

  async function handleNext() {
    if (!destinationName.trim()) return setParseError('Enter a destination name.')
    if (!file) return setParseError('Choose a Word (.docx) file to upload.')
    setParseError('')
    setParsing(true)
    try {
      const { results } = await api.parseDocxFiles([file])
      const result = results[0]
      if (!result.ok) {
        setParseError(`Could not read this file: ${result.error}`)
        return
      }
      setDraft({
        ...emptyDraft(),
        ...result.parsed,
        destination: destinationName.trim(),
        country,
      })
      setRawHtml(result.rawHtml || '')
      setRawDocxBase64(result.rawDocxBase64 || '')
      setStep(3)
    } catch (err) {
      setParseError(err.message || 'Import failed — check the terminal running the backend for details.')
    } finally {
      setParsing(false)
    }
  }

  async function handleSave() {
    if (!draft.destination.trim()) return
    setSaving(true)
    try {
      await onSave({
        ...draft,
        country,
        uploaded_at: new Date().toISOString(),
        raw_html: rawHtml,
        raw_docx_base64: rawDocxBase64,
        raw_filename: file?.name || '',
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            Import from Word{' '}
            <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>
              — Step {step} of 3
            </span>
          </h2>
          <button type="button" className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="itin-form">
          {step === 1 && (
            <>
              <label className="field-label">
                Search a country
                <input type="text" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} placeholder="Type to filter…" />
              </label>

              {filteredMostTravelled.length > 0 && (
                <div>
                  <span className="day-title" style={{ display: 'block', marginBottom: 8 }}>
                    MOST TRAVELLED COUNTRIES
                  </span>
                  <div className="country-grid">
                    {filteredMostTravelled.map((c) => (
                      <button type="button" key={c} className="country-chip" onClick={() => pickCountry(c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredMoreSea.length > 0 && (
                <div>
                  <span className="day-title" style={{ display: 'block', marginBottom: 8 }}>
                    MORE IN SOUTH EAST ASIA
                  </span>
                  <div className="country-grid">
                    {filteredMoreSea.map((c) => (
                      <button type="button" key={c} className="country-chip" onClick={() => pickCountry(c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {countrySearch && !allCountries.some((c) => c.toLowerCase() === countrySearch.toLowerCase()) && (
                <div className="form-row" style={{ alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Not listed? Type the country name"
                    value={customCountry || countrySearch}
                    onChange={(e) => setCustomCountry(e.target.value)}
                  />
                  <button type="button" className="btn-secondary" onClick={confirmCustomCountry}>
                    Use this country
                  </button>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <p className="muted" style={{ fontSize: 13 }}>
                Country: <strong style={{ color: 'var(--text-h)' }}>{country}</strong>{' '}
                <button type="button" className="btn-link" style={{ fontSize: 12 }} onClick={() => setStep(1)}>
                  change
                </button>
              </p>
              <label className="field-label">
                Destination Name
                <input
                  type="text"
                  placeholder="e.g. Bangkok & Pattaya"
                  value={destinationName}
                  onChange={(e) => setDestinationName(e.target.value)}
                />
              </label>
              <label className="field-label">
                Upload Word File (.docx)
                <input type="file" accept=".docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
              {parseError && <p className="form-error">{parseError}</p>}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="button" className="btn-primary" disabled={parsing} onClick={handleNext}>
                  {parsing ? 'Processing…' : 'Next →'}
                </button>
              </div>
            </>
          )}

          {step === 3 && draft && (
            <>
              <p className="muted" style={{ fontSize: 13 }}>
                Review what was extracted from <strong style={{ color: 'var(--text-h)' }}>{file?.name}</strong> and correct anything
                before saving.
              </p>
              <TemplateEditorFields draft={draft} setDraft={setDraft} />
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
                  Back
                </button>
                <button type="button" className="btn-primary" disabled={saving} onClick={handleSave}>
                  {saving ? 'Saving…' : 'Save Template'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
