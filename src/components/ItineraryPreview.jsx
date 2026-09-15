import { useState } from 'react'
import { buildItineraryDocx } from '../lib/buildDocx'

function lines(text) {
  return (text || '').split('\n').map((l) => l.trim()).filter(Boolean)
}

function Letterhead({ settings }) {
  return (
    <>
      <div className="doc-page-header">
        <div>
          {settings.logo ? (
            <img src={settings.logo} alt="Logo" className="doc-logo" />
          ) : (
            <div className="doc-logo-placeholder">{(settings.company_name || 'CO').slice(0, 4)}</div>
          )}
        </div>
        <div className="doc-company-block">
          <div className="doc-company-name">{settings.company_name}</div>
          {settings.gst_no && <div className="doc-company-meta">GST No: {settings.gst_no}</div>}
          {settings.email && <div className="doc-company-meta">{settings.email}</div>}
        </div>
      </div>
      <div className="doc-page-divider" />
    </>
  )
}

function Footer({ settings }) {
  return (
    <>
      <div className="doc-page-divider" />
      <div className="doc-page-footer">
        <div>
          {settings.phone && <div>{settings.phone}</div>}
          {settings.website && <div>{settings.website}</div>}
        </div>
        <div className="doc-footer-right">{settings.address}</div>
      </div>
    </>
  )
}

function DocPage({ settings, children }) {
  return (
    <div className="doc-page">
      <Letterhead settings={settings} />
      <div className="doc-page-body">{children}</div>
      <Footer settings={settings} />
    </div>
  )
}

const STATUSES = ['draft', 'sent', 'confirmed']

export default function ItineraryPreview({ itinerary, settings, onStatusChange, onDelete }) {
  const coverPhoto = itinerary.days.find((d) => d.photos?.length > 0)?.photos?.[0]
  const bookingTerms = lines(settings.booking_terms)
  const cancellationPolicy = lines(settings.cancellation_policy)
  const importantNotes = lines(settings.important_notes)
  const hasInclusionsPage = lines(itinerary.inclusions).length > 0 || lines(itinerary.exclusions).length > 0
  const hasCostPage = (itinerary.cost_rows || []).length > 0 || itinerary.child_policy
  const hasTermsPage = bookingTerms.length > 0 || cancellationPolicy.length > 0 || importantNotes.length > 0
  const [downloading, setDownloading] = useState(false)

  async function handleDownloadWord() {
    setDownloading(true)
    try {
      const blob = await buildItineraryDocx(itinerary, settings)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${itinerary.client_name} - ${itinerary.destination}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="dashboard">
      <div className="doc-actions-bar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`status-badge status-${itinerary.status}`}>
            {itinerary.status.charAt(0).toUpperCase() + itinerary.status.slice(1)}
          </span>
          <div className="view-toggle">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={`view-toggle-btn${itinerary.status === s ? ' active' : ''}`}
                onClick={() => onStatusChange(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn-secondary" onClick={onDelete}>
            Delete
          </button>
          <button type="button" className="btn-secondary" onClick={() => window.print()}>
            Print / PDF
          </button>
          <button type="button" className="btn-primary" disabled={downloading} onClick={handleDownloadWord}>
            {downloading ? 'Preparing…' : 'Download Word Doc'}
          </button>
        </div>
      </div>

      <div className="doc-shell">
        <DocPage settings={settings}>
          <div className="doc-title-band">{itinerary.package_title || `${itinerary.destination} (${itinerary.duration})`}</div>

          {coverPhoto && (
            <div className="doc-hero-wrap">
              <img src={coverPhoto} alt="" className="doc-hero" />
            </div>
          )}

          <div className="doc-cover-caption">
            <p>
              {settings.company_name} — {itinerary.destination}
            </p>
            {itinerary.tagline && <p className="doc-cover-quote">&ldquo;{itinerary.tagline}&rdquo;</p>}
          </div>

          {itinerary.departure_dates && (
            <div className="doc-highlight" style={{ alignSelf: 'flex-start' }}>
              Departure Date{itinerary.departure_dates.includes(',') ? 's' : ''}: {itinerary.departure_dates}
            </div>
          )}
        </DocPage>

        {itinerary.days.map((day, i) => (
          <DocPage settings={settings} key={i}>
            {i === 0 && (
              <>
                <div className="doc-greeting">GREETINGS FROM {settings.company_name}…!!!!</div>
                <div className="doc-itinerary-label">ITINERARY!!!</div>
                {itinerary.assembly_point && <p className="doc-assembly">{itinerary.assembly_point}</p>}
              </>
            )}

            <h2 className="doc-day-heading">
              {day.title?.toUpperCase()}
              {day.heading ? `: ${day.heading}` : ''}
            </h2>

            <ul className="doc-bullet-list">
              {lines(day.activities).map((line, li) => (
                <li key={li}>{line}</li>
              ))}
            </ul>

            {day.photos?.length > 0 && (
              <div className="doc-photo-grid">
                {day.photos.map((photo, pi) => (
                  <img key={pi} src={photo} alt="" className="doc-photo" />
                ))}
              </div>
            )}

            {day.meal_plan && <div className="doc-highlight doc-meal-plan">Meal Plan: {day.meal_plan}</div>}
          </DocPage>
        ))}

        {hasInclusionsPage && (
          <DocPage settings={settings}>
            <h2 className="doc-section-heading">INCLUSIONS:</h2>
            <ul className="doc-bullet-list">
              {lines(itinerary.inclusions).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            <h2 className="doc-section-heading">EXCLUSIONS:</h2>
            <ul className="doc-bullet-list">
              {lines(itinerary.exclusions).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </DocPage>
        )}

        {hasCostPage && (
          <DocPage settings={settings}>
            {(itinerary.cost_rows || []).length > 0 && (
              <table className="doc-cost-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Cost</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {itinerary.cost_rows.map((row, i) => (
                    <tr key={i}>
                      <td>{row.component}</td>
                      <td>{row.cost}</td>
                      <td>{row.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {itinerary.child_policy && (
              <div className="doc-child-policy">
                <strong>CHILD POLICY</strong>
                <p style={{ whiteSpace: 'pre-line', marginTop: 6 }}>{itinerary.child_policy}</p>
              </div>
            )}
            {itinerary.visa_info && (
              <p style={{ marginTop: 14, fontSize: 13 }}>
                <strong>Visa:</strong> {itinerary.visa_info}
              </p>
            )}
          </DocPage>
        )}

        {hasTermsPage && (
          <DocPage settings={settings}>
            {bookingTerms.length > 0 && (
              <>
                <h2 className="doc-section-heading">Booking Terms &amp; Conditions</h2>
                <ol className="doc-numbered-list">
                  {bookingTerms.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ol>
              </>
            )}
            {cancellationPolicy.length > 0 && (
              <>
                <h2 className="doc-section-heading">Cancellation Policy</h2>
                <ul className="doc-bullet-list">
                  {cancellationPolicy.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </>
            )}
            {importantNotes.length > 0 && (
              <>
                <h2 className="doc-section-heading">Important Notes</h2>
                <ul className="doc-bullet-list">
                  {importantNotes.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </>
            )}
          </DocPage>
        )}
      </div>
    </div>
  )
}
