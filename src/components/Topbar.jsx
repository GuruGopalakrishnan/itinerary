const TITLES = {
  itineraries: 'Itineraries',
  templates: 'Destination Templates',
  preview: 'Itinerary',
}

export default function Topbar({ activeTab, onNewItinerary, onBack }) {
  const showBack = activeTab === 'preview'

  return (
    <div className="topbar">
      {showBack ? (
        <div className="topbar-title-group">
          <button type="button" className="topbar-back" onClick={onBack}>
            &larr; Back to Itineraries
          </button>
          <h1 className="topbar-title">{TITLES[activeTab]}</h1>
        </div>
      ) : (
        <h1 className="topbar-title">{TITLES[activeTab]}</h1>
      )}

      <div className="topbar-actions">
        {activeTab === 'itineraries' && (
          <button type="button" className="btn-primary" onClick={onNewItinerary}>
            + New Itinerary
          </button>
        )}
      </div>
    </div>
  )
}
