import mammoth from 'mammoth'
import { load } from 'cheerio'

const SKIP_KEYWORDS = ['booking terms', 'terms and condition', 'cancellation policy', 'important note']
const INCLUDE_KEYWORDS = ['inclusion', 'includes', 'package includes']
const EXCLUDE_KEYWORDS = ['exclusion', 'excludes', 'package excludes']

function isHeadingLike(text, keywords) {
  if (text.length > 70) return false
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw))
}

// A day line sometimes arrives as one dense run — "DAY 1 - Oct 8, 2026 : Pick Up from X
// > Y > Z | Shared Transfer | G | D | EI" — split it into a date (if present) and
// separate activity bullets on '>' and '|' instead of dumping the whole line into one field.
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

function textOf($el, $) {
  return $el.text().replace(/\s+/g, ' ').trim()
}

function listItems($el, $) {
  return $el
    .find('li')
    .map((_, li) => $(li).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter(Boolean)
}

function looksLikeCostHeader(cells) {
  const joined = cells.join(' ').toLowerCase()
  return /component|particular|description/.test(joined) && /cost|price|amount/.test(joined)
}

function parseTable($table, $) {
  const rows = []
  $table.find('tr').each((_, tr) => {
    const cells = $(tr)
      .find('td,th')
      .map((_, cell) => textOf($(cell), $))
      .get()
    if (cells.some(Boolean)) rows.push(cells)
  })
  if (rows.length === 0) return []
  let dataRows = rows
  if (looksLikeCostHeader(rows[0])) dataRows = rows.slice(1)
  return dataRows
    .filter((r) => r.some(Boolean))
    .map((r) => ({ component: r[0] || '', cost: r[1] || '', remarks: r[2] || '' }))
}

export async function parseItineraryDocx(buffer) {
  const { value: html } = await mammoth.convertToHtml({ buffer })
  const $ = load(`<div id="root">${html}</div>`)
  const root = $('#root')

  const result = {
    destination: '',
    subtitle: '',
    default_duration: '',
    package_title: '',
    tagline: '',
    days: [],
    inclusions: '',
    exclusions: '',
    cost_rows: [],
    child_policy: '',
    visa_info: '',
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

  root.children().each((_, el) => {
    const $el = $(el)
    const tag = el.tagName?.toLowerCase()

    if (tag === 'table') {
      const rows = parseTable($el, $)
      if (state !== 'skip' && rows.length > 0 && result.cost_rows.length === 0) {
        result.cost_rows = rows
      }
      return
    }

    const text = textOf($el, $)
    if (!text) return

    if (isHeadingLike(text, SKIP_KEYWORDS)) {
      state = 'skip'
      return
    }
    if (state === 'skip') return

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
      return
    }

    if (isHeadingLike(text, INCLUDE_KEYWORDS)) {
      state = 'inclusions'
      return
    }
    if (isHeadingLike(text, EXCLUDE_KEYWORDS)) {
      state = 'exclusions'
      return
    }
    if (/^child\s*policy/i.test(text)) {
      state = 'childpolicy'
      return
    }
    if (!['days', 'inclusions', 'exclusions'].includes(state) && /^visa\b/i.test(text) && text.length < 80) {
      result.visa_info = text.replace(/^visa[:\s-]*/i, '')
      return
    }
    if (/^assemble\b/i.test(text)) {
      result.assembly_point = text
      return
    }
    if (/^greetings from/i.test(text) || /^itinerary!*$/i.test(text)) {
      return
    }

    if (state === 'preamble') {
      if (!result.package_title) {
        result.package_title = text
      } else if (!result.tagline && /^["“].*["”]$/.test(text)) {
        result.tagline = text.replace(/^["“]/, '').replace(/["”]$/, '')
      }
      return
    }

    if (state === 'days' && currentDay) {
      if (/^meal\s*plan\s*:/i.test(text)) {
        currentDay.meal_plan = text.replace(/^meal\s*plan\s*:\s*/i, '')
        return
      }
      if (tag === 'ul' || tag === 'ol') {
        const items = listItems($el, $)
        currentDay.activities = [currentDay.activities, ...items].filter(Boolean).join('\n')
      } else {
        const { segments } = splitDayContent(text)
        currentDay.activities = [currentDay.activities, ...segments].filter(Boolean).join('\n')
      }
      return
    }

    if (state === 'inclusions') {
      if (tag === 'ul' || tag === 'ol') inclusionsList.push(...listItems($el, $))
      else inclusionsList.push(text)
      return
    }

    if (state === 'exclusions') {
      if (tag === 'ul' || tag === 'ol') exclusionsList.push(...listItems($el, $))
      else exclusionsList.push(text)
      return
    }

    if (state === 'childpolicy') {
      childPolicyLines.push(text)
      return
    }
  })

  pushDay()
  result.inclusions = inclusionsList.join('\n')
  result.exclusions = exclusionsList.join('\n')
  result.child_policy = childPolicyLines.join('\n')

  const durationMatch = /\((\d+)\s*nights?\s*&?\s*(\d+)\s*days?\)/i.exec(result.package_title)
  if (durationMatch) {
    result.default_duration = `${durationMatch[2]} Days / ${durationMatch[1]} Nights`
  }

  let destination = result.package_title
    .replace(/\(.*?\)\s*$/, '')
    .replace(/^[A-Z0-9&\s]+['’]S\s+/i, '')
    .trim()
  result.destination = destination || result.package_title || 'Untitled Destination'

  return { parsed: result, rawHtml: html }
}
