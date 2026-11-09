// Laboratorios que NO se muestran al público (aunque estén en el Excel).
export const HIDDEN_LABS = ['F4-02']
// Colores de los puntos de cada laboratorio (en orden de aparición).
export const LAB_COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6']

// Períodos en que los laboratorios están abiertos (fechas AAAA-MM-DD, inclusive), en orden cronológico.
// file:    Excel de ese período dentro de public/
// allFree: true = sin clases, todos los laboratorios se muestran disponibles
export const PERIODS = [
  { name: 'II Semestre 2026 (período lectivo)', start: '2026-08-03', end: '2026-11-21', file: 'horarios.xlsx' },
  { name: 'Semanas sin clases', start: '2026-11-23', end: '2026-12-05', file: 'horarios.xlsx', allFree: true },
  // { name: 'Verano 2027', start: '2027-01-11', end: '2027-03-06', file: 'verano.xlsx' },
]

// Días sueltos con laboratorios cerrados (feriados, cierres): 'AAAA-MM-DD': 'motivo'
export const CLOSED_DATES = {
  '2026-09-15': 'Feriado: Día de la Independencia',
}

// Datos de contacto que aparecen al final de la página
export const CONTACT = {
  escuela: 'Escuela de Ingeniería en Computadores',
}

export const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
