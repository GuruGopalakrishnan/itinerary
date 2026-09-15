import { useMemo, useState } from 'react'
import { EditIcon, DownloadIcon } from './icons'
import { buildItineraryDocx } from '../lib/buildDocx'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ItineraryDashboard({ itineraries, templateCount, loading, settings, onOpen, onNew }) {
  const [downloadingId, setDownloadingId] = useState(null)

  async function handleDownload(it) {
    setDownloadingId(it.id)
    try {
      const blob = await buildItineraryDocx(it, settings)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${it.client_name} - ${it.destination}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloadingId(null)
    }
  }

  const stats = useMemo(() => {
    const now = new Date()
    const sentThisMonth = itineraries.filter((it) => {
      if (it.status !== 'sent' && it.status !== 'confirmed') return false
      const d = new Date(it.created_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    const drafts = itineraries.filter((it) => it.status === 'draft').length
    return { total: itineraries.length, sentThisMonth, drafts }
  }, [itineraries])

  return (
    <div className="dashboard">
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Itineraries</div>
        </div>
        <div className="stat-card stat-card-highlight">
          <div className="stat-value">{stats.sentThisMonth}</div>
          <div className="stat-label">Sent This Month</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.drafts}</div>
          <div className="stat-label">Drafts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{templateCount}</div>
          <div className="stat-label">Destination Templates</div>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : itineraries.length === 0 ? (
        <div className="empty-state">
          <p>No itineraries yet.</p>
          <button type="button" className="btn-primary" onClick={onNew}>
            + New Itinerary
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="itin-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Destination</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {itineraries.map((it) => (
                <tr key={it.id} onClick={() => onOpen(it)}>
                  <td className="client-cell">{it.client_name}</td>
                  <td>
                    <div className="dest-cell">
                      <span className="dest-name">{it.destination}</span>
                      {it.subtitle && <span className="dest-sub">{it.subtitle}</span>}
                    </div>
                  </td>
                  <td>{it.duration}</td>
                  <td>
                    <span className={`status-badge status-${it.status}`}>
                      {it.status.charAt(0).toUpperCase() + it.status.slice(1)}
                    </span>
                  </td>
                  <td>{formatDate(it.created_at)}</td>
                  <td>
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="icon-btn-sm" title="Open" onClick={() => onOpen(it)}>
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="icon-btn-sm"
                        title="Download DOCX"
                        disabled={downloadingId === it.id}
                        onClick={() => handleDownload(it)}
                      >
                        <DownloadIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
