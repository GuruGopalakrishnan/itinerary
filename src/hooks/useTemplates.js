import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { SAMPLE_TEMPLATES } from '../data/sampleData'

export function useTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getTemplates()
      setTemplates(data)
      setIsDemo(false)
    } catch {
      // No backend reachable (e.g. the static GitHub Pages preview) — show sample data instead.
      setTemplates(SAMPLE_TEMPLATES)
      setIsDemo(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function addTemplate(data) {
    const created = await api.createTemplate(data)
    setTemplates((prev) => [...prev, created])
    return created
  }

  async function updateTemplate(id, data) {
    const saved = await api.updateTemplate(id, data)
    setTemplates((prev) => prev.map((t) => (t.id === saved.id ? saved : t)))
    return saved
  }

  async function deleteTemplate(id) {
    await api.deleteTemplate(id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  async function fetchTemplateDetail(id) {
    if (isDemo) return templates.find((t) => t.id === id) || null
    return api.getTemplate(id)
  }

  return { templates, loading, isDemo, addTemplate, updateTemplate, deleteTemplate, fetchTemplateDetail, refetch }
}
