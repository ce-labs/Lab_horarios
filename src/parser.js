import * as XLSX from 'xlsx'

const DAYS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
const toMin = (h, m) => +h * 60 + +m
export const fmt = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`

/** Lee el Excel (una hoja por laboratorio) y devuelve [{id, title, capacity, slots, busy}] */
export function parseWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' })
  const labs = []
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: null })
    const h = rows.findIndex((r) => norm(r[0]) === 'PER')
    if (h < 0) continue
    const head = rows.slice(0, h).map((r) => r[0]).filter(Boolean).map(String)
    const title = head[0] || name
    const id = (title.match(/F\d+-\d+/i) || [title])[0].toUpperCase()
    const capacity = (head.join(' ').match(/(\d+)\s*personas/i) || [])[1]
    const dayCols = {}
    rows[h].forEach((v, c) => {
      const d = DAYS.indexOf(norm(v).split(' ')[0])
      if (d >= 0) dayCols[c] = d
    })
    const busy = {}
    const slots = []
    for (const r of rows.slice(h + 1)) {
      const m = String(r[1] ?? '').match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/)
      if (!m) continue
      const start = toMin(m[1], m[2])
      const end = toMin(m[3], m[4])
      slots.push({ start, end })
      for (const [c, d] of Object.entries(dayCols)) {
        const v = String(r[c] ?? '').trim()
        if (!v) continue
        const code = (v.match(/[A-Za-z]{2}\d{3,4}/) || [v.split(/\s+/)[0]])[0].toUpperCase()
        ;(busy[d] ??= []).push({ code, start, end })
      }
    }
    // Une períodos seguidos del mismo curso: 9:30-10:30 + 10:30-11:30 => 9:30-11:30
    for (const d in busy) {
      busy[d].sort((a, b) => a.start - b.start)
      busy[d] = busy[d].reduce((acc, b) => {
        const l = acc[acc.length - 1]
        if (l && l.code === b.code && l.end === b.start) l.end = b.end
        else acc.push({ ...b })
        return acc
      }, [])
    }
    labs.push({ id, title, capacity, slots, busy })
  }
  return labs
}

/** Bloque que ocupa el laboratorio en ese día y franja (o undefined si está libre) */
export const blockAt = (lab, day, slot) =>
  (lab.busy[day] || []).find((b) => b.start < slot.end && b.end > slot.start)
