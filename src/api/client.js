const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  getTemplates: () => request('/templates'),
  getTemplate: (id) => request(`/templates/${id}`),
  createTemplate: (data) => request('/templates', { method: 'POST', body: JSON.stringify(data) }),
  updateTemplate: (id, data) => request(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTemplate: (id) => request(`/templates/${id}`, { method: 'DELETE' }),

  getItineraries: () => request('/itineraries'),
  getItinerary: (id) => request(`/itineraries/${id}`),
  createItinerary: (data) => request('/itineraries', { method: 'POST', body: JSON.stringify(data) }),
  updateItinerary: (id, data) => request(`/itineraries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteItinerary: (id) => request(`/itineraries/${id}`, { method: 'DELETE' }),

  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  parseDocxFiles: async (files) => {
    const form = new FormData()
    for (const file of files) form.append('files', file)
    const res = await fetch(`${API_BASE}/import/parse`, { method: 'POST', body: form })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Request failed: ${res.status}`)
    }
    return res.json()
  },
}
