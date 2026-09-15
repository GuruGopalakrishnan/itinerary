import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

export function useItineraries() {
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const data = await api.getItineraries()
    setItineraries(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function addItinerary(data) {
    const created = await api.createItinerary(data)
    setItineraries((prev) => [created, ...prev])
    return created
  }

  async function updateItinerary(id, data) {
    const saved = await api.updateItinerary(id, data)
    setItineraries((prev) => prev.map((it) => (it.id === saved.id ? saved : it)))
    return saved
  }

  async function deleteItinerary(id) {
    await api.deleteItinerary(id)
    setItineraries((prev) => prev.filter((it) => it.id !== id))
  }

  return { itineraries, loading, addItinerary, updateItinerary, deleteItinerary, refetch }
}
