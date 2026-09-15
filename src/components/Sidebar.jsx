import { DashboardIcon, SuitcaseIcon } from './icons'

const NAV_ITEMS = [
  { id: 'itineraries', label: 'Itineraries', Icon: DashboardIcon },
  { id: 'templates', label: 'Templates', Icon: SuitcaseIcon },
]

export default function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-wordmark">Itinerary Studio</span>
        <span className="brand-tagline">Trip Planner</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`sidebar-link${activeTab === id ? ' active' : ''}`}
            onClick={() => onTabChange(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
