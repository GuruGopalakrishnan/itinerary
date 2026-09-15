import { useMemo, useState } from 'react'
import TemplateEditorFields from './TemplateEditorFields'
import ImportWizardModal from './ImportWizardModal'

function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
}

function base64ToBlob(base64, type) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}

export default function TemplateLibrary({ templates, onAdd, onUpdate, onDelete, fetchTemplateDetail }) {
  const [countryFilter, setCountryFilter] = useState(null)
  const [showImportWizard, setShowImportWizard] = useState(false)
  const [openId, setOpenId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [viewMode, setViewMode] = useState('edit')
  const [loadingDetail, setLoadingDetail] = useState(false)

  const byCountry = useMemo(() => {
    const groups = {}
    for (const t of templates) {
      const key = t.country?.trim() || 'Uncategorized'
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    }
    return groups
  }, [templates])

  const countryNames = Object.keys(byCountry).sort()

  async function openTemplate(t) {
    setOpenId(t.id)
    setViewMode('edit')
    setLoadingDetail(true)
    try {
      const full = await fetchTemplateDetail(t.id)
      setDetail(full)
    } finally {
      setLoadingDetail(false)
    }
  }

  function closeTemplate() {
    setOpenId(null)
    setDetail(null)
  }

  async function saveDetail() {
    await onUpdate(detail.id, detail)
    closeTemplate()
  }

  async function removeDetail() {
    if (!confirm(`Delete "${detail.destination}" template?`)) return
    await onDelete(detail.id)
    closeTemplate()
  }

  function downloadOriginal() {
    if (!detail?.raw_docx_base64) return
    const blob = base64ToBlob(
      detail.raw_docx_base64,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = detail.raw_filename || `${detail.destination}.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportSave(draft) {
    const created = await onAdd(draft)
    setCountryFilter(created.country || 'Uncategorized')
  }

  return (
    <div className="dashboard">
      <div className="hint-note" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span>
          Templates are organized by country. Click a country to see the itineraries you've uploaded for it.
        </span>
        <button type="button" className="btn-primary" style={{ flexShrink: 0 }} onClick={() => setShowImportWizard(true)}>
          Import from Word
        </button>
      </div>

      {showImportWizard && <ImportWizardModal onClose={() => setShowImportWizard(false)} onSave={handleImportSave} />}

      {openId && detail && (
        <div className="tpl-editor">
          <div className="tpl-editor-head">
            <div>
              <button type="button" className="topbar-back" onClick={closeTemplate}>
                &larr; Back to {detail.country || 'Uncategorized'}
              </button>
              <h2 style={{ marginTop: 4 }}>{detail.destination}</h2>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn-secondary" onClick={removeDetail}>
                Delete
              </button>
              <button type="button" className="btn-primary" onClick={saveDetail}>
                Save Changes
              </button>
            </div>
          </div>

          <div className="meta-row">
            <span>
              <strong>Created:</strong> {formatDateTime(detail.created_at)}
            </span>
            <span>
              <strong>Uploaded:</strong> {formatDateTime(detail.uploaded_at)}
            </span>
          </div>

          <div className="view-toggle" style={{ alignSelf: 'flex-start' }}>
            <button type="button" className={`view-toggle-btn${viewMode === 'edit' ? ' active' : ''}`} onClick={() => setViewMode('edit')}>
              Processed / Editable
            </button>
            <button type="button" className={`view-toggle-btn${viewMode === 'raw' ? ' active' : ''}`} onClick={() => setViewMode('raw')}>
              Raw Original
            </button>
          </div>

          {viewMode === 'edit' ? (
            <TemplateEditorFields draft={detail} setDraft={setDetail} />
          ) : (
            <div className="raw-view">
              {detail.raw_docx_base64 ? (
                <button type="button" className="btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={downloadOriginal}>
                  Download Original .docx
                </button>
              ) : (
                <p className="muted">No original file stored for this template (it wasn't created via Import from Word).</p>
              )}
              {detail.raw_html ? (
                <div className="raw-html-box" dangerouslySetInnerHTML={{ __html: detail.raw_html }} />
              ) : (
                <p className="muted">No raw preview available.</p>
              )}
            </div>
          )}
        </div>
      )}

      {openId && loadingDetail && <p className="muted">Loading…</p>}

      {!openId && countryFilter === null && (
        <div className="tpl-layout" style={{ gridTemplateColumns: '1fr' }}>
          <div className="country-grid">
            {countryNames.length === 0 && <p className="muted">No templates yet — click "Import from Word" to add your first one.</p>}
            {countryNames.map((name) => (
              <button type="button" key={name} className="country-folder" onClick={() => setCountryFilter(name)}>
                <span className="country-folder-name">{name}</span>
                <span className="country-folder-count">
                  {byCountry[name].length} itinerar{byCountry[name].length === 1 ? 'y' : 'ies'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!openId && countryFilter !== null && (
        <div className="tpl-layout" style={{ gridTemplateColumns: '1fr' }}>
          <button type="button" className="topbar-back" style={{ alignSelf: 'flex-start' }} onClick={() => setCountryFilter(null)}>
            &larr; All Countries
          </button>
          <h2 style={{ margin: '4px 0 0' }}>{countryFilter}</h2>
          <div className="tpl-list" style={{ flexDirection: 'column' }}>
            {(byCountry[countryFilter] || []).map((t) => (
              <button type="button" key={t.id} className="tpl-card" onClick={() => openTemplate(t)}>
                <span className="tpl-card-name">{t.destination}</span>
                <span className="tpl-card-meta">
                  {t.default_duration} · Created {formatDateTime(t.created_at)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
