import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { SAMPLE_SETTINGS } from '../data/sampleData'

export function useSettings() {
  const [settings, setSettings] = useState(SAMPLE_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getSettings()
      setSettings(data)
      setIsDemo(false)
    } catch {
      setSettings(SAMPLE_SETTINGS)
      setIsDemo(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function saveSettings(data) {
    const saved = await api.updateSettings(data)
    setSettings(saved)
    return saved
  }

  return { settings, loading, isDemo, saveSettings, refetch }
}
