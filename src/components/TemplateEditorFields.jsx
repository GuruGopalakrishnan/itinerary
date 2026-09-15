function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function TemplateEditorFields({ draft, setDraft }) {
  function set(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  function updateDay(index, field, value) {
    setDraft((prev) => ({ ...prev, days: prev.days.map((d, i) => (i === index ? { ...d, [field]: value } : d)) }))
  }

  function addDay() {
    setDraft((prev) => ({
      ...prev,
      days: [
        ...prev.days,
        { title: `Day ${prev.days.length + 1}`, heading: '', activities: '', highlight_place: '', meal_plan: '', photos: [] },
      ],
    }))
  }

  function removeDay(index) {
    setDraft((prev) => ({ ...prev, days: prev.days.filter((_, i) => i !== index) }))
  }

  async function addDayPhotos(index, fileList) {
    const files = Array.from(fileList || [])
    if (files.length === 0) return
    const dataUrls = await Promise.all(files.map(fileToDataUrl))
    setDraft((prev) => ({
      ...prev,
      days: prev.days.map((d, i) => (i === index ? { ...d, photos: [...(d.photos || []), ...dataUrls] } : d)),
    }))
  }

  function removeDayPhoto(dayIndex, photoIndex) {
    setDraft((prev) => ({
      ...prev,
      days: prev.days.map((d, i) => (i === dayIndex ? { ...d, photos: d.photos.filter((_, pi) => pi !== photoIndex) } : d)),
    }))
  }

  function updateCostRow(index, field, value) {
    setDraft((prev) => ({ ...prev, cost_rows: prev.cost_rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)) }))
  }

  function addCostRow() {
    setDraft((prev) => ({ ...prev, cost_rows: [...prev.cost_rows, { component: '', cost: '', remarks: '' }] }))
  }

  function removeCostRow(index) {
    setDraft((prev) => ({ ...prev, cost_rows: prev.cost_rows.filter((_, i) => i !== index) }))
  }

  return (
    <>
      <div className="form-row">
        <label className="field-label">
          Destination Name
          <input type="text" value={draft.destination} onChange={(e) => set('destination', e.target.value)} />
        </label>
        <label className="field-label" style={{ maxWidth: 200 }}>
          Default Duration
          <input
            type="text"
            placeholder="e.g. 5 Days / 4 Nights"
            value={draft.default_duration}
            onChange={(e) => set('default_duration', e.target.value)}
          />
        </label>
      </div>
      <label className="field-label">
        Route / Sub-title
        <input
          type="text"
          placeholder="e.g. Munnar - Alleppey - Kumarakom"
          value={draft.subtitle}
          onChange={(e) => set('subtitle', e.target.value)}
        />
      </label>
      <label className="field-label">
        Package Title <span className="muted">(shown on the document header)</span>
        <input type="text" value={draft.package_title} onChange={(e) => set('package_title', e.target.value)} />
      </label>
      <label className="field-label">
        Tagline <span className="muted">(optional quote under the title)</span>
        <input type="text" value={draft.tagline} onChange={(e) => set('tagline', e.target.value)} />
      </label>
      <label className="field-label">
        Assembly Point <span className="muted">(e.g. Assemble at Chennai International Airport at 0800pm)</span>
        <input type="text" value={draft.assembly_point} onChange={(e) => set('assembly_point', e.target.value)} />
      </label>

      {draft.days.map((day, i) => (
        <div className="day-block" key={i}>
          <div className="day-block-head">
            <span className="day-title">{day.title?.toUpperCase()}</span>
            {draft.days.length > 1 && (
              <button type="button" className="icon-btn-sm" onClick={() => removeDay(i)} title="Remove day">
                ×
              </button>
            )}
          </div>
          <input
            type="text"
            placeholder="Day heading, e.g. ARRIVAL IN BANGKOK - TO PATTAYA"
            value={day.heading}
            onChange={(e) => updateDay(i, 'heading', e.target.value)}
          />
          <textarea
            rows={4}
            placeholder={'One activity per line, e.g.\nArrive Kochi, drive to Munnar\nCheck-in resort, evening tea garden walk'}
            value={day.activities}
            onChange={(e) => updateDay(i, 'activities', e.target.value)}
          />
          <div className="form-row">
            <input
              type="text"
              placeholder="Highlighted place, e.g. Tiger Topia"
              value={day.highlight_place || ''}
              onChange={(e) => updateDay(i, 'highlight_place', e.target.value)}
            />
            <input
              type="text"
              placeholder="Meal plan, e.g. Breakfast, Lunch, Dinner"
              value={day.meal_plan}
              onChange={(e) => updateDay(i, 'meal_plan', e.target.value)}
            />
          </div>
          <span className="muted" style={{ fontSize: 12 }}>
            If the highlighted place's name appears in the activities above, it'll be bolded and yellow-highlighted
            automatically.
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="file" accept="image/*" multiple onChange={(e) => addDayPhotos(i, e.target.files)} />
            <button
              type="button"
              className="btn-secondary"
              disabled
              title="Coming soon"
              style={{ opacity: 0.6, cursor: 'default' }}
            >
              Generate Image (Coming Soon)
            </button>
          </div>
          {day.photos?.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {day.photos.map((photo, pi) => (
                <div key={pi} style={{ position: 'relative' }}>
                  <img src={photo} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                  <button
                    type="button"
                    className="icon-btn-sm"
                    style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, fontSize: 10 }}
                    onClick={() => removeDayPhoto(i, pi)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={addDay}>
        + Add Day
      </button>

      <label className="field-label">
        Inclusions <span className="muted">(one line each)</span>
        <textarea rows={4} value={draft.inclusions} onChange={(e) => set('inclusions', e.target.value)} />
      </label>
      <label className="field-label">
        Exclusions <span className="muted">(one line each)</span>
        <textarea rows={4} value={draft.exclusions} onChange={(e) => set('exclusions', e.target.value)} />
      </label>

      <div className="field-label">
        Cost Table
        {draft.cost_rows.map((row, i) => (
          <div className="form-row" key={i} style={{ alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Component (e.g. Land Package Cost)"
              value={row.component}
              onChange={(e) => updateCostRow(i, 'component', e.target.value)}
            />
            <input
              type="text"
              placeholder="Cost (e.g. ₹ 29,000)"
              style={{ maxWidth: 130 }}
              value={row.cost}
              onChange={(e) => updateCostRow(i, 'cost', e.target.value)}
            />
            <input type="text" placeholder="Remarks" value={row.remarks} onChange={(e) => updateCostRow(i, 'remarks', e.target.value)} />
            <button type="button" className="icon-btn-sm" onClick={() => removeCostRow(i)}>
              ×
            </button>
          </div>
        ))}
        <button type="button" className="btn-secondary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onClick={addCostRow}>
          + Add Cost Row
        </button>
      </div>

      <label className="field-label">
        Child Policy
        <textarea rows={3} value={draft.child_policy} onChange={(e) => set('child_policy', e.target.value)} />
      </label>
      <label className="field-label">
        Visa Info
        <input type="text" value={draft.visa_info} onChange={(e) => set('visa_info', e.target.value)} />
      </label>
    </>
  )
}
