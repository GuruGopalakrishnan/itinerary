import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

export function useTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const data = await api.getTemplates()
    setTemplates(data)
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

  return { templates, loading, addTemplate, updateTemplate, deleteTemplate, refetch }
}
