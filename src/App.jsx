import { useEffect, useMemo, useRef, useState } from 'react'
import { parseWorkbook, blockAt, fmt } from './parser'
import { HIDDEN_LABS, LAB_COLORS, PERIODS, CLOSED_DATES, CONTACT, iso } from './config'

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAY_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const isAdmin = new URLSearchParams(window.location.search).has('admin')
const BASE = import.meta.env.BASE_URL
const BOUNDS = { min: PERIODS[0].start, max: PERIODS[PERIODS.length - 1].end }
const clamp = (k) => (k < BOUNDS.min ? BOUNDS.min : k > BOUNDS.max ? BOUNDS.max : k)
const toDate = (s) => new Date(s + 'T00:00:00')
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7))
const fmtDate = (s) => toDate(s).toLocaleDateString('es-CR', { day: 'numeric', month: 'long' })
const shortDate = (d) => d.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })
const inPeriod = (k) => PERIODS.find((p) => k >= p.start && k <= p.end)

export default function App() {
  const [now, setNow] = useState(new Date())
  const [date, setDate] = useState(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0)
    if (t.getDay() === 0) t.setDate(t.getDate() + 1)
    return toDate(clamp(iso(t)))
  })
  const [raw, setRaw] = useState(null)
  const [override, setOverride] = useState(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [freeNow, setFreeNow] = useState(false)
  const cache = useRef({})

  const k = iso(date)
  const todayK = iso(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const period = inPeriod(k) || (isAdmin ? PERIODS[0] : undefined)
  const todayOut = !isAdmin && !inPeriod(todayK)
  const next = PERIODS.find((p) => p.start > todayK)

  // Carga el Excel del período de la fecha elegida (con caché)
  useEffect(() => {
    const file = period?.file
    if (!file) return
    if (cache.current[file]) { setRaw(cache.current[file]); return }
    fetch(BASE + file)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((b) => { const p = parseWorkbook(b); cache.current[file] = p; setRaw(p); setError('') })
      .catch(() => setError('No se pudo cargar el horario de este período.'))
  }, [period?.file])
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t) }, [])

  const onFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    try {
      const p = parseWorkbook(await f.arrayBuffer())
      if (!p.length) throw new Error('No se encontraron hojas con horarios.')
      setOverride(p); setFileName(f.name); setError('')
    } catch (err) { setError('No se pudo leer el archivo: ' + err.message) }
    e.target.value = ''
  }

  const base = override || raw
  const labs = useMemo(
    () => (base && period?.allFree ? base.map((l) => ({ ...l, busy: {} })) : base),
    [base, period?.allFree]
  )
  const visible = useMemo(() => (labs || []).filter((l) => !HIDDEN_LABS.includes(l.id)), [labs])
  const slots = useMemo(() => {
    const m = new Map()
    visible.forEach((l) => l.slots.forEach((s) => m.set(s.start, s)))
    return [...m.values()].sort((a, b) => a.start - b.start)
  }, [visible])

  const days = period?.allFree || visible.some((l) => l.busy[5]) ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4]
  const monday = mondayOf(date)
  const day = Math.min((date.getDay() + 6) % 7, 5)
  const closedDay = (dt) => {
    if (isAdmin) return ''
    const key = iso(dt)
    if (CLOSED_DATES[key]) return CLOSED_DATES[key]
    return inPeriod(key) ? '' : 'Fuera del período de laboratorios'
  }
  const closed = closedDay(date)

  const canPrev = monday > mondayOf(toDate(BOUNDS.min))
  const canNext = addDays(monday, 7) <= toDate(BOUNDS.max)
  const shiftWeek = (n) => setDate(toDate(clamp(iso(addDays(date, 7 * n)))))
  const goToday = () => setDate(toDate(clamp(iso(todayK && new Date(now.getFullYear(), now.getMonth(), now.getDate() + (now.getDay() === 0 ? 1 : 0))))))
  const weekLabel = `${shortDate(monday)} – ${shortDate(addDays(monday, days.length - 1))}`
  const isNow = (s) => k === todayK && nowMin >= s.start && nowMin < s.end

  // "Disponibles ahora": labs libres a la hora del dispositivo, en el día elegido
  const open = slots.length ? slots[0].start : 0
  const close = slots.length ? slots[slots.length - 1].end : 0
  const freeList = visible
    .map((l, i) => ({ l, i, blocks: l.busy[day] || [] }))
    .filter(({ blocks }) => !blocks.some((b) => b.start <= nowMin && b.end > nowMin))
    .map((x) => ({ ...x, until: (x.blocks.find((b) => b.start > nowMin) || { start: close }).start }))

  return (
    <div className="page">
      <header className="top">
        <Logo />
        <div>
          <h1>Laboratorios</h1>
          <p>Ingeniería en Computadores</p>
        </div>
      </header>

      <section className="hero">
        <div className="hero-text">
          <h2>Disponibilidad de Laboratorios en Ingeniería en Computadores</h2>
          <p>Consulta la disponibilidad de los laboratorios para <b>optimizar tu tiempo</b> y evitar inconvenientes al trasladarte a ellos.</p>
        </div>
        <HeroImg />
      </section>

      {isAdmin && (
        <label className="upload">
          <input type="file" accept=".xlsx,.xls" onChange={onFile} />
          <span> {override ? `Cambiar archivo (actual: ${fileName})` : 'Probar otro Excel de horarios (.xlsx)'}</span>
        </label>
      )}
      {error && <p className="error">{error}</p>}

      {todayOut && (
        <div className="closed">
           Laboratorios cerrados por el momento
          <small>{next ? `Próximo período: ${next.name}, inicia el ${fmtDate(next.start)}.` : 'Consulta las fechas con la escuela.'}</small>
        </div>
      )}

      <div className="notice" role="note">
         <span><b>Los horarios pueden estar sujetos a cambios.</b> Esta página se basa únicamente en el horario de clases y
        <b> no conoce las reservas</b> de laboratorios: un laboratorio “libre” podría estar reservado.</span>
      </div>

      {period && <p className="period">{period.name} · hasta el {fmtDate(period.end)}{period.allFree && ' · sin clases: todos los laboratorios libres'}</p>}

      <div className="bar">
        <div className="weekbar">
          <button className="nav" disabled={!canPrev} onClick={() => shiftWeek(-1)} aria-label="Semana anterior">‹<span> Semana anterior</span></button>
          <div className="weeklabel">Semana del {weekLabel}<button className="today" onClick={goToday}>Hoy</button></div>
          <button className="nav" disabled={!canNext} onClick={() => shiftWeek(1)} aria-label="Semana siguiente"><span>Semana siguiente </span>›</button>
        </div>
        <div className="days">
          {days.map((d) => (
            <button key={d} className={'day' + (d === day ? ' on' : '') + (closedDay(addDays(monday, d)) ? ' off' : '')}
              onClick={() => setDate(addDays(monday, d))}>
              {DAY_NAMES[d]}<small>{addDays(monday, d).getDate()}</small>
            </button>
          ))}
        </div>
      </div>

      {closed ? (
        <div className="closed"> Laboratorios cerrados este día<small>{closed}</small></div>
      ) : !labs ? (
        !error && <p className="empty">Cargando horarios…</p>
      ) : (
        <>
          <label className="toggle">
            <span>Disponibles ahora</span>
            <input type="checkbox" checked={freeNow} onChange={(e) => setFreeNow(e.target.checked)} />
            <i />
          </label>

          {freeNow ? (
            <section className="freenow">
              <h3>Libres a las {fmt(nowMin)} · {DAY_FULL[day]} {date.getDate()}</h3>
              <small>Según la hora de tu dispositivo.</small>
              {nowMin < open || nowMin >= close ? (
                <p className="empty">Fuera del horario de laboratorios ({fmt(open)} – {fmt(close)}).</p>
              ) : !freeList.length ? (
                <p className="empty">No hay laboratorios libres a esta hora.</p>
              ) : (
                <div className="cards">
                  {freeList.map(({ l, i, until }) => (
                    <div key={l.id} className="card free">
                      <b><span className="dot" style={{ background: LAB_COLORS[i % LAB_COLORS.length] }} />{l.id}</b>
                      <strong>Libre hasta las {fmt(until)}</strong>
                      {l.capacity && <small>{l.capacity} personas</small>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <div className="grid" style={{ '--cols': visible.length }}>
              <div className="cell head hora"> Hora</div>
              {visible.map((l, i) => (
                <div key={l.id} className="cell head">
                  <b><span className="dot" style={{ background: LAB_COLORS[i % LAB_COLORS.length] }} />{l.id}</b>
                  <small>{l.capacity ? `${l.capacity} personas` : `Lab ${i + 1}`}{/interactivo/i.test(l.title) ? ' · Interactivo' : ''}</small>
                </div>
              ))}
              {slots.map((s) => <Row key={s.start} s={s} labs={visible} day={day} now={isNow(s)} />)}
            </div>
          )}

          <footer className="legend">
            <span><i className="dot free" /> Libre · disponible para estudiantes</span>
            <span><i className="dot busy" /> Ocupado · clase en curso</span>
          </footer>
        </>
      )}

      <section className="cta">
        <h2>¡Aprovecha nuestros laboratorios al máximo!</h2>
        <h3>Contáctanos para más información</h3>
        <p>Para más información, comunícate con la escuela.</p>
        <p>{CONTACT.escuela} </p>
      </section>
    </div>
  )
}

function Logo() {
  const [ok, setOk] = useState(true)
  return ok
    ? <img className="logo-img" src={BASE + 'logo.png'} alt="Logo" onError={() => setOk(false)} />
    : <div className="logo">&lt;/&gt;</div>
}

function HeroImg() {
  const [ok, setOk] = useState(true)
  return ok ? <img className="hero-img" src={BASE + 'header.jpeg'} alt="Laboratorio de computadores" onError={() => setOk(false)} /> : null
}

function Row({ s, labs, day, now }) {
  return (
    <>
      <div className={'cell hora' + (now ? ' now' : '')}>{fmt(s.start)} – {fmt(s.end)}</div>
      {labs.map((l) => {
        const b = blockAt(l, day, s)
        return b ? (
          <div key={l.id} className={'cell busy' + (now ? ' now' : '')}>
            <b><i className="dot busy" />Ocupado</b>
            <strong>{b.code}</strong>
            <small>{fmt(b.start)} – {fmt(b.end)}</small>
          </div>
        ) : (
          <div key={l.id} className={'cell free' + (now ? ' now' : '')}><b><i className="dot free" />Libre</b></div>
        )
      })}
    </>
  )
}
