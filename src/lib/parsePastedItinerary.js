const SKIP_HEADINGS = /^(booking terms|cancellation policy|important notes)/i

function splitCostRow(line) {
  let parts = line.split('|').map((p) => p.trim())
  if (parts.length < 2) parts = line.split('\t').map((p) => p.trim())
  if (parts.length < 2) parts = line.split(/ {2,}/).map((p) => p.trim())
  return parts.filter(Boolean)
}

// Parses raw text pasted from a DMC document into the same shape the Word-import
// parser produces — plain-text version of server/importParser.js's state machine
// (no AI, deterministic pattern matching on "Day N", "INCLUSIONS:", etc.).
export function parsePastedItinerary(rawText) {
  const result = {
    days: [],
    inclusions: '',
    exclusions: '',
    cost_rows: [],
    child_policy: '',
    visa_info: '',
    assembly_point: '',
  }

  const inclusionsList = []
  const exclusionsList = []
  const childPolicyLines = []

  let state = 'preamble'
  let currentDay = null

  function pushDay() {
    if (currentDay) result.days.push(currentDay)
    currentDay = null
  }

  const rawLines = (rawText || '').split('\n').map((l) => l.trim())

  for (const text of rawLines) {
    if (!text) continue

    if (SKIP_HEADINGS.test(text)) {
      state = 'skip'
      continue
    }
    if (state === 'skip') continue

    const dayMatch = /^day\s*0?(\d+)\b[:\-–]?\s*(.*)$/i.exec(text)
    if (dayMatch) {
      pushDay()
      currentDay = { title: `Day ${dayMatch[1]}`, heading: dayMatch[2] || '', activities: '', highlight_place: '', meal_plan: '', photos: [] }
      state = 'days'
      continue
    }

    if (/^inclusions?\s*:?$/i.test(text)) {
      state = 'inclusions'
      continue
    }
    if (/^exclusions?\s*:?$/i.test(text)) {
      state = 'exclusions'
      continue
    }
    if (/^child\s*policy/i.test(text)) {
      state = 'childpolicy'
      continue
    }
    if (/component.*cost|cost.*component/i.test(text)) {
      state = 'cost'
      continue
    }
    if (/^visa\b/i.test(text) && text.length < 80) {
      result.visa_info = text.replace(/^visa[:\s-]*/i, '')
      continue
    }
    if (/^assemble\b/i.test(text)) {
      result.assembly_point = text
      continue
    }
    if (/^greetings from/i.test(text) || /^itinerary!*$/i.test(text)) {
      continue
    }

    if (state === 'preamble') {
      // Freeform preamble text (e.g. a title line pasted along with the rest) is
      // ignored — destination/duration/title come from the form fields, not the paste.
      continue
    }

    if (state === 'days' && currentDay) {
      if (/^meal\s*plan\s*:/i.test(text)) {
        currentDay.meal_plan = text.replace(/^meal\s*plan\s*:\s*/i, '')
        continue
      }
      const bullet = text.replace(/^[-•*]\s*/, '')
      currentDay.activities = [currentDay.activities, bullet].filter(Boolean).join('\n')
      continue
    }

    if (state === 'inclusions') {
      inclusionsList.push(text.replace(/^[-•*]\s*/, ''))
      continue
    }

    if (state === 'exclusions') {
      exclusionsList.push(text.replace(/^[-•*]\s*/, ''))
      continue
    }

    if (state === 'childpolicy') {
      childPolicyLines.push(text)
      continue
    }

    if (state === 'cost') {
      const parts = splitCostRow(text)
      if (parts.length >= 2) {
        result.cost_rows.push({ component: parts[0] || '', cost: parts[1] || '', remarks: parts[2] || '' })
      }
      continue
    }
  }

  pushDay()
  result.inclusions = inclusionsList.join('\n')
  result.exclusions = exclusionsList.join('\n')
  result.child_policy = childPolicyLines.join('\n')

  return result
}
