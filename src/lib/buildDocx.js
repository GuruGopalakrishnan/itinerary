import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Header,
  Footer,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  LevelFormat,
  PageBreak,
  VerticalAlign,
} from 'docx'

const RED = 'A41E28'
const BLUE = '1E4D8F'
const PINK = 'F6D6D6'
const PINK_DARK = 'E8B7B7'
const FONT = 'Cambria'

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

function lines(text) {
  return (text || '').split('\n').map((l) => l.trim()).filter(Boolean)
}

function dataUrlToImage(dataUrl) {
  const match = /^data:image\/(\w+);base64,(.*)$/.exec(dataUrl || '')
  if (!match) return null
  let ext = match[1].toLowerCase()
  if (ext === 'jpeg') ext = 'jpg'
  if (!['jpg', 'png', 'gif', 'bmp'].includes(ext)) ext = 'png'
  const binary = atob(match[2])
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return { type: ext, data: bytes }
}

function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth || 400, height: img.naturalHeight || 300 })
    img.onerror = () => resolve({ width: 400, height: 300 })
    img.src = dataUrl
  })
}

function fitSize({ width, height }, maxW, maxH) {
  const ratio = Math.min(maxW / width, maxH / height, 1)
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

async function imageRun(dataUrl, maxW, maxH) {
  const parsed = dataUrlToImage(dataUrl)
  if (!parsed) return null
  const dims = await getImageDimensions(dataUrl)
  const size = fitSize(dims, maxW, maxH)
  return new ImageRun({ type: parsed.type, data: parsed.data, transformation: size })
}

function bulletParagraph(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 60 } })
}

function numberedParagraph(text, reference) {
  return new Paragraph({ text, numbering: { reference, level: 0 }, spacing: { after: 60 } })
}

// Splits `text` into runs, bolding + yellow-highlighting every occurrence of `highlightPlace`
// (case-insensitive) — matches how the real sample itineraries bold the main attraction inline.
function highlightRuns(text, highlightPlace) {
  const needle = (highlightPlace || '').trim()
  if (!needle) return [new TextRun(text)]
  const lower = text.toLowerCase()
  const needleLower = needle.toLowerCase()
  const runs = []
  let cursor = 0
  let idx = lower.indexOf(needleLower, cursor)
  if (idx === -1) return [new TextRun(text)]
  while (idx !== -1) {
    if (idx > cursor) runs.push(new TextRun(text.slice(cursor, idx)))
    runs.push(new TextRun({ text: text.slice(idx, idx + needle.length), bold: true, highlight: 'yellow' }))
    cursor = idx + needle.length
    idx = lower.indexOf(needleLower, cursor)
  }
  if (cursor < text.length) runs.push(new TextRun(text.slice(cursor)))
  return runs
}

function dayBulletParagraph(text, highlightPlace) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: highlightRuns(text, highlightPlace) })
}

async function buildHeader(settings) {
  const logoCellChildren = []
  const logoRun = settings.logo ? await imageRun(settings.logo, 130, 60) : null
  if (logoRun) {
    logoCellChildren.push(new Paragraph({ children: [logoRun] }))
  } else {
    logoCellChildren.push(
      new Paragraph({
        children: [new TextRun({ text: (settings.company_name || 'CO').slice(0, 4), bold: true, color: RED })],
      }),
    )
  }

  const companyChildren = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: settings.company_name || '', bold: true, color: RED, size: 32 })],
    }),
  ]
  if (settings.gst_no) {
    companyChildren.push(
      new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `GST No: ${settings.gst_no}`, size: 16 })] }),
    )
  }
  if (settings.email) {
    companyChildren.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: settings.email, size: 16 })] }))
  }

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, verticalAlign: VerticalAlign.CENTER, children: logoCellChildren }),
          new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: companyChildren }),
        ],
      }),
    ],
  })

  const divider = new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: RED } },
    spacing: { after: 40 },
  })

  return new Header({ children: [table, divider] })
}

function buildFooter(settings) {
  const leftChildren = []
  if (settings.phone) leftChildren.push(new Paragraph({ children: [new TextRun({ text: settings.phone, size: 16 })] }))
  if (settings.website) leftChildren.push(new Paragraph({ children: [new TextRun({ text: settings.website, size: 16 })] }))
  if (leftChildren.length === 0) leftChildren.push(new Paragraph(''))

  const rightChildren = [
    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: settings.address || '', size: 16 })] }),
  ]

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: leftChildren }),
          new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: rightChildren }),
        ],
      }),
    ],
  })

  const divider = new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: RED } },
    spacing: { after: 80 },
  })

  return new Footer({ children: [divider, table] })
}

async function photosTable(photos) {
  const cells = []
  for (const photo of photos.slice(0, 4)) {
    const run = await imageRun(photo, 230, 160)
    cells.push(
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: run ? [run] : [] })],
      }),
    )
  }
  const rows = []
  for (let i = 0; i < cells.length; i += 2) {
    const rowCells = cells.slice(i, i + 2)
    while (rowCells.length < 2) rowCells.push(new TableCell({ children: [new Paragraph('')] }))
    rows.push(new TableRow({ children: rowCells }))
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: NO_BORDERS, rows })
}

async function buildBody(itinerary, settings) {
  const body = []

  body.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: itinerary.destination.toUpperCase(), bold: true, size: 32, color: RED })],
      spacing: { after: 60 },
    }),
  )
  body.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: itinerary.duration || '', bold: true, italics: true, highlight: 'yellow', size: 24 })],
      spacing: { after: 100 },
    }),
  )
  if (itinerary.package_title) {
    body.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: itinerary.package_title, bold: true, italics: true, size: 22 })],
        spacing: { after: 200 },
      }),
    )
  }

  const coverPhoto = itinerary.days.find((d) => d.photos?.length > 0)?.photos?.[0]
  if (coverPhoto) {
    const run = await imageRun(coverPhoto, 420, 300)
    if (run) body.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [run], spacing: { after: 160 } }))
  }

  body.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `${settings.company_name} — ${itinerary.destination}`, bold: true, italics: true })],
    }),
  )
  if (itinerary.tagline) {
    body.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `"${itinerary.tagline}"`, italics: true, size: 20 })],
        spacing: { after: 200 },
      }),
    )
  }

  if (itinerary.departure_dates) {
    body.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `Departure Date(s): ${itinerary.departure_dates}`, bold: true, italics: true, highlight: 'yellow' })],
        spacing: { after: 200 },
      }),
    )
  }

  body.push(new Paragraph({ children: [new PageBreak()] }))

  body.push(
    new Paragraph({
      children: [new TextRun({ text: `GREETINGS FROM ${settings.company_name}…!!!!`, bold: true, color: BLUE })],
    }),
  )
  body.push(new Paragraph({ children: [new TextRun({ text: 'ITINERARY!!!', bold: true, color: BLUE })], spacing: { after: 100 } }))
  if (itinerary.assembly_point) {
    body.push(new Paragraph({ children: [new TextRun({ text: itinerary.assembly_point, bold: true })], spacing: { after: 160 } }))
  }

  for (const day of itinerary.days) {
    const headingText = `${(day.title || '').toUpperCase()}${day.heading ? `: ${day.heading}` : ''}`
    body.push(
      new Paragraph({
        children: [new TextRun({ text: headingText, bold: true, color: RED, size: 24 })],
        spacing: { before: 160, after: 100 },
      }),
    )

    for (const line of lines(day.activities)) {
      body.push(dayBulletParagraph(line, day.highlight_place))
    }

    if (day.photos?.length > 0) {
      body.push(await photosTable(day.photos))
    }

    if (day.meal_plan) {
      body.push(
        new Paragraph({
          children: [new TextRun({ text: `Meal Plan: ${day.meal_plan}`, bold: true, italics: true, highlight: 'yellow' })],
          spacing: { before: 100, after: 160 },
        }),
      )
    }
  }

  const inclusions = lines(itinerary.inclusions)
  const exclusions = lines(itinerary.exclusions)
  if (inclusions.length || exclusions.length) {
    body.push(new Paragraph({ children: [new PageBreak()] }))
    if (inclusions.length) {
      body.push(new Paragraph({ children: [new TextRun({ text: 'INCLUSIONS:', bold: true, color: RED, size: 24 })], spacing: { after: 100 } }))
      inclusions.forEach((l) => body.push(bulletParagraph(l)))
    }
    if (exclusions.length) {
      body.push(
        new Paragraph({ children: [new TextRun({ text: 'EXCLUSIONS:', bold: true, color: RED, size: 24 })], spacing: { before: 200, after: 100 } }),
      )
      exclusions.forEach((l) => body.push(bulletParagraph(l)))
    }
  }

  const costRows = itinerary.cost_rows || []
  if (costRows.length > 0 || itinerary.child_policy || itinerary.visa_info) {
    body.push(new Paragraph({ children: [new PageBreak()] }))
    if (costRows.length > 0) {
      const headerRow = new TableRow({
        tableHeader: true,
        children: ['Component', 'Cost', 'Remarks'].map(
          (t) =>
            new TableCell({
              shading: { fill: PINK_DARK, type: ShadingType.CLEAR, color: 'auto' },
              children: [new Paragraph({ children: [new TextRun({ text: t, bold: true })] })],
            }),
        ),
      })
      const dataRows = costRows.map(
        (row) =>
          new TableRow({
            children: [row.component, row.cost, row.remarks].map(
              (t) =>
                new TableCell({
                  shading: { fill: PINK, type: ShadingType.CLEAR, color: 'auto' },
                  children: [new Paragraph(t || '')],
                }),
            ),
          }),
      )
      body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] }))
    }
    if (itinerary.child_policy) {
      body.push(new Paragraph({ children: [new TextRun({ text: 'CHILD POLICY', bold: true })], spacing: { before: 200 } }))
      lines(itinerary.child_policy).forEach((l) => body.push(new Paragraph(l)))
    }
    if (itinerary.visa_info) {
      body.push(
        new Paragraph({
          children: [new TextRun({ text: 'Visa: ', bold: true }), new TextRun(itinerary.visa_info)],
          spacing: { before: 120 },
        }),
      )
    }
  }

  const bookingTerms = lines(settings.booking_terms)
  const cancellationPolicy = lines(settings.cancellation_policy)
  const importantNotes = lines(settings.important_notes)
  if (bookingTerms.length || cancellationPolicy.length || importantNotes.length) {
    body.push(new Paragraph({ children: [new PageBreak()] }))
    if (bookingTerms.length) {
      body.push(
        new Paragraph({ children: [new TextRun({ text: 'Booking Terms & Conditions', bold: true, color: RED, size: 24 })], spacing: { after: 100 } }),
      )
      bookingTerms.forEach((l) => body.push(numberedParagraph(l, 'booking-terms')))
    }
    if (cancellationPolicy.length) {
      body.push(
        new Paragraph({
          children: [new TextRun({ text: 'Cancellation Policy', bold: true, color: RED, size: 24 })],
          spacing: { before: 200, after: 100 },
        }),
      )
      cancellationPolicy.forEach((l) => body.push(bulletParagraph(l)))
    }
    if (importantNotes.length) {
      body.push(
        new Paragraph({
          children: [new TextRun({ text: 'Important Notes', bold: true, color: RED, size: 24 })],
          spacing: { before: 200, after: 100 },
        }),
      )
      importantNotes.forEach((l) => body.push(bulletParagraph(l)))
    }
  }

  return body
}

export async function buildItineraryDocx(itinerary, settings) {
  const header = await buildHeader(settings)
  const footer = buildFooter(settings)
  const body = await buildBody(itinerary, settings)

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT } },
      },
    },
    numbering: {
      config: [
        {
          reference: 'booking-terms',
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START }],
        },
      ],
    },
    sections: [
      {
        properties: {},
        headers: { default: header },
        footers: { default: footer },
        children: body,
      },
    ],
  })

  return Packer.toBlob(doc)
}
