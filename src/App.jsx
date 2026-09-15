import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import ItineraryDashboard from './components/ItineraryDashboard'
import TemplateLibrary from './components/TemplateLibrary'
import NewItineraryModal from './components/NewItineraryModal'
import ItineraryPreview from './components/ItineraryPreview'
import { useTemplates } from './hooks/useTemplates'
import { useItineraries } from './hooks/useItineraries'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('itineraries')
  const [showNewModal, setShowNewModal] = useState(false)
  const [openItineraryId, setOpenItineraryId] = useState(null)

  const { templates, isDemo: templatesDemo, addTemplate, updateTemplate, deleteTemplate } = useTemplates()
  const {
    itineraries,
    loading,
    isDemo: itinerariesDemo,
    addItinerary,
    updateItinerary,
    deleteItinerary,
  } = useItineraries()
  const isDemo = templatesDemo || itinerariesDemo

  const openItinerary = itineraries.find((it) => it.id === openItineraryId) || null

  function handleTabChange(tab) {
    setOpenItineraryId(null)
    setActiveTab(tab)
  }

  function openPreview(itinerary) {
    setOpenItineraryId(itinerary.id)
    setActiveTab('preview')
  }

  function backToItineraries() {
    setOpenItineraryId(null)
    setActiveTab('itineraries')
  }

  async function handleCreateItinerary(data) {
    const created = await addItinerary(data)
    setShowNewModal(false)
    openPreview(created)
  }

  async function handleStatusChange(status) {
    const saved = await updateItinerary(openItinerary.id, { ...openItinerary, status })
    setOpenItineraryId(saved.id)
  }

  async function handleDeleteItinerary() {
    if (!confirm('Delete this itinerary?')) return
    await deleteItinerary(openItinerary.id)
    backToItineraries()
  }

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab === 'preview' ? 'itineraries' : activeTab} onTabChange={handleTabChange} />

      <div className="app-content">
        <Topbar activeTab={activeTab} onNewItinerary={() => setShowNewModal(true)} onBack={backToItineraries} />

        <main className="app-main">
          {isDemo && (
            <div className="hint-note" style={{ marginBottom: 20 }}>
              Live preview with sample data — no backend is connected here, so changes won't be saved. Run{' '}
              <span style={{ fontFamily: 'monospace', background: 'var(--code-bg)', padding: '1px 5px', borderRadius: 4 }}>
                npm run dev
              </span>{' '}
              locally for the full app.
            </div>
          )}

          {activeTab === 'itineraries' && (
            <ItineraryDashboard
              itineraries={itineraries}
              templateCount={templates.length}
              loading={loading}
              onOpen={openPreview}
              onNew={() => setShowNewModal(true)}
            />
          )}

          {activeTab === 'templates' && (
            <TemplateLibrary
              templates={templates}
              onAdd={addTemplate}
              onUpdate={updateTemplate}
              onDelete={deleteTemplate}
            />
          )}

          {activeTab === 'preview' && openItinerary && (
            <ItineraryPreview
              itinerary={openItinerary}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteItinerary}
            />
          )}
        </main>
      </div>

      {showNewModal && (
        <NewItineraryModal
          templates={templates}
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateItinerary}
        />
      )}
    </div>
  )
}

export default App
