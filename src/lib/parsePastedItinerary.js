const SKIP_KEYWORDS = ['booking terms', 'terms and condition', 'cancellation policy', 'important note']
const INCLUDE_KEYWORDS = ['inclusion', 'includes', 'package includes']
const EXCLUDE_KEYWORDS = ['exclusion', 'excludes', 'package excludes']

function isHeadingLike(text, keywords) {
  if (text.length > 70) return false
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw))
}

function splitCostRow(line) {
  let parts = line.split('|').map((p) => p.trim())
  if (parts.length < 2) parts = line.split('\t').map((p) => p.trim())
  if (parts.length < 2) parts = line.split(/ {2,}/).map((p) => p.trim())
  return parts.filter(Boolean)
}

// A day line often arrives as one dense run — "DAY 1 - Oct 8, 2026 : Pick Up from X
// > Y > Z | Shared Transfer | G | D | EI" — split it into a date (if present) and
// separate activity bullets on '>' and '|', instead of dumping the whole line into
// one field.
function splitDayContent(rest) {
  let content = rest.replace(/^[-–—:]\s*/, '').trim()
  let date = ''

  const dateMatch = /^([A-Za-z]+\s+\d{1,2},?\s+\d{4})\s*:\s*(.*)$/.exec(content)
  if (dateMatch) {
    date = dateMatch[1]
    content = dateMatch[2].trim()
  }

  const segments = content
    .split(/\s*[>|]\s*/)
    .map((s) => s.trim())
    .filter(Boolean)

  return { date, segments }
}

// Parses raw text pasted from a DMC document into the same shape the Word-import
// parser produces — plain-text version of server/importParser.js's state machine
// (no AI, deterministic pattern matching on "Day N", "Includes:", etc.).
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

    if (isHeadingLike(text, SKIP_KEYWORDS)) {
      state = 'skip'
      continue
    }
    if (state === 'skip') continue

    const dayMatch = (state === 'preamble' || state === 'days') && /^day\s*0?(\d+)\b\s*(.*)$/i.exec(text)
    if (dayMatch) {
      pushDay()
      const { date, segments } = splitDayContent(dayMatch[2] || '')
      currentDay = {
        title: `Day ${dayMatch[1]}`,
        heading: date,
        activities: segments.join('\n'),
        highlight_place: '',
        meal_plan: '',
        photos: [],
      }
      state = 'days'
      continue
    }

    if (isHeadingLike(text, INCLUDE_KEYWORDS)) {
      state = 'inclusions'
      continue
    }
    if (isHeadingLike(text, EXCLUDE_KEYWORDS)) {
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
    if (!['days', 'inclusions', 'exclusions'].includes(state) && /^visa\b/i.test(text) && text.length < 80) {
      result.visa_info = text.replace(/^visa[:\s-]*/i, '')
      continue
    }
    if (/^assemble\b|^pick\s*-?\s*up\b/i.test(text) && state === 'preamble') {
      result.assembly_point = text
      continue
    }
    if (/^greetings from/i.test(text) || /^itinerary!*$/i.test(text) || /^tentative itinerary/i.test(text)) {
      continue
    }

    if (state === 'preamble') {
      continue
    }

    if (state === 'days' && currentDay) {
      if (/^meal\s*plan\s*:/i.test(text)) {
        currentDay.meal_plan = text.replace(/^meal\s*plan\s*:\s*/i, '')
        continue
      }
      const bullet = text.replace(/^[-•*]\s*/, '')
      const { segments } = splitDayContent(bullet)
      currentDay.activities = [currentDay.activities, ...segments].filter(Boolean).join('\n')
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
