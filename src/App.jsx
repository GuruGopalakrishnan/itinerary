import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import ItineraryDashboard from './components/ItineraryDashboard'
import TemplateLibrary from './components/TemplateLibrary'
import SettingsPanel from './components/SettingsPanel'
import NewItineraryModal from './components/NewItineraryModal'
import ItineraryPreview from './components/ItineraryPreview'
import { useTemplates } from './hooks/useTemplates'
import { useItineraries } from './hooks/useItineraries'
import { useSettings } from './hooks/useSettings'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('itineraries')
  const [showNewModal, setShowNewModal] = useState(false)
  const [openItineraryId, setOpenItineraryId] = useState(null)

  const {
    templates,
    isDemo: templatesDemo,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    fetchTemplateDetail,
  } = useTemplates()
  const {
    itineraries,
    loading,
    isDemo: itinerariesDemo,
    addItinerary,
    updateItinerary,
    deleteItinerary,
  } = useItineraries()
  const { settings, isDemo: settingsDemo, saveSettings } = useSettings()
  const isDemo = templatesDemo || itinerariesDemo || settingsDemo

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

  async function handleUpdateItinerary(data) {
    const saved = await updateItinerary(openItinerary.id, data)
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
        <Topbar
          activeTab={activeTab}
          openItinerary={openItinerary}
          onNewItinerary={() => setShowNewModal(true)}
          onBack={backToItineraries}
        />

        <main className="app-main">
          {isDemo && (
            <div className="hint-note no-print" style={{ marginBottom: 20 }}>
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
              settings={settings}
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
              fetchTemplateDetail={fetchTemplateDetail}
            />
          )}

          {activeTab === 'settings' && <SettingsPanel settings={settings} onSave={saveSettings} />}

          {activeTab === 'preview' && openItinerary && (
            <ItineraryPreview
              itinerary={openItinerary}
              settings={settings}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteItinerary}
              onUpdate={handleUpdateItinerary}
            />
          )}
        </main>
      </div>

      {showNewModal && (
        <NewItineraryModal
          companyName={settings.company_name}
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateItinerary}
        />
      )}
    </div>
  )
}

export default App
