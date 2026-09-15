function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUSES = ['draft', 'sent', 'confirmed']

export default function ItineraryPreview({ itinerary, onStatusChange, onDelete }) {
  return (
    <div className="dashboard">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
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
          <button type="button" className="btn-primary">
            Download PDF
          </button>
        </div>
      </div>
      <div className="doc-shell">
      <div className="doc">
        <div className="doc-header">
          <div>
            <div className="doc-brand">Itinerary Studio</div>
            <div className="doc-brand-sub">Travel Itinerary</div>
          </div>
          <div className="doc-title">
            <h1>{itinerary.destination}</h1>
            {itinerary.subtitle && <p>{itinerary.subtitle}</p>}
          </div>
        </div>

        <div className="doc-meta">
          <div className="doc-meta-item">
            <div className="doc-meta-label">Prepared For</div>
            <div className="doc-meta-value">{itinerary.client_name}</div>
          </div>
          <div className="doc-meta-item">
            <div className="doc-meta-label">Duration</div>
            <div className="doc-meta-value">{itinerary.duration}</div>
          </div>
          <div className="doc-meta-item">
            <div className="doc-meta-label">Prepared On</div>
            <div className="doc-meta-value">{formatDate(itinerary.created_at)}</div>
          </div>
        </div>

        <h2 className="doc-section-title">Day-by-Day Itinerary</h2>

        {itinerary.days.map((day, i) => (
          <div className="day-item" key={i}>
            <span className="day-item-label">{day.title?.toUpperCase() || `DAY ${i + 1}`}</span>
            <div className="day-item-text">
              <p>{day.text}</p>
            </div>
          </div>
        ))}

        <div className="doc-divider" />
        <p className="doc-signoff">Prepared with care — for questions, reply to this itinerary anytime.</p>
      </div>
      </div>
    </div>
  )
}
