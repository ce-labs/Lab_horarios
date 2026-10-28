# 🖥️ Disponibilidad de Laboratorios – Ingeniería en Computadores (Lab_horarios)

Página web (React + Vite) que lee el Excel oficial de horarios y muestra a los estudiantes,
en formato de agenda, qué laboratorios están **Libres** u **Ocupados** por clase.
Es responsive: funciona en celular, tablet y computadora.

## Qué muestra

- Una columna por laboratorio y una fila por franja horaria (7:30 – 22:00).
- **Libre** (verde) o **Ocupado** (rojo). Las celdas ocupadas muestran solo el **código del curso**
  y el rango de horas, por ejemplo `CE1103 · 9:30 – 11:30` (el grupo no se muestra).
- Selector de día (Lun–Vie; el sábado aparece solo si algún laboratorio tiene clases ese día).
  Al abrir, selecciona el día de hoy (domingo muestra el lunes).
- Resalta la franja horaria actual cuando se ve el día de hoy.
- Interruptor **"Mostrar solo disponibles"**: oculta las franjas donde todos los labs están ocupados.

## Laboratorios públicos

El Excel trae 5 laboratorios (F2-07, F2-08, F2-09, F2-10 y F4-02), pero solo 4 se muestran.
Para cambiarlo edita `src/config.js`:

```js
export const HIDDEN_LABS = ['F4-02']   // laboratorios que NO se muestran
```

Cuando F4-02 se habilite, basta con dejar la lista vacía: `[]`.

## Instalación y uso

Requiere [Node.js](https://nodejs.org) 18 o superior.

```bash
npm install
npm run dev        # desarrollo en http://localhost:5173
npm run build      # genera la carpeta dist/ lista para publicar
```

## Períodos (semestres y verano)

Los laboratorios solo están abiertos en ciertas fechas. Se definen en `src/config.js`:

```js
export const PERIODS = [
  { name: 'II Semestre 2026', start: '2026-08-10', end: '2026-12-12', file: 'horarios.xlsx' },
  { name: 'Verano 2027',      start: '2027-01-11', end: '2027-03-06', file: 'verano.xlsx' },
]
export const CLOSED_DATES = { '2026-09-15': 'Feriado: Día de la Independencia' }
```

- La página carga automáticamente el Excel del período que incluye la fecha de hoy.
- Fuera de todos los períodos muestra "Laboratorios cerrados" y la fecha en que inicia el siguiente.
- Los días fuera del período (o en `CLOSED_DATES`) se muestran como cerrados.
- Cada período puede tener su propio Excel: súbelo a `public/` con el nombre indicado en `file`.
- Con `?admin` se ignoran las fechas, para poder probar cualquier Excel.

## Cómo cargar los horarios

**Opción A – Archivo fijo (recomendada para publicar).**
Reemplaza el Excel del período en `public/` (ej. `horarios.xlsx` o `verano.xlsx`, mismo nombre) y vuelve a publicar.
Todos los estudiantes verán ese horario automáticamente.

**Opción B – Subirlo desde el navegador (vista de administrador).**
Abre la página con `?admin` al final de la dirección (ej. `http://localhost:5173/?admin`) y
usa el botón **"Subir Excel"**. Sirve para revisar cómo se verá un archivo antes de publicarlo.
⚠️ Esto solo cambia lo que ves en *tu* navegador; los estudiantes siguen viendo `public/horarios.xlsx`.

## Formato esperado del Excel

Una hoja por laboratorio, con esta estructura (igual al archivo actual):

| Celda / zona | Contenido |
|---|---|
| `A2` | Nombre del lab, p. ej. `F2-07` o `F2-10 (Interactivo)` |
| `A4` | `Capacidad: 24 personas` (opcional) |
| Fila de encabezado | `PER`, `HORA`, `LUNES (L)`, `MARTES (K)` … `SABADO (S)` |
| Columna `HORA` | Rango como `7:30 - 8:30` |
| Celdas de clase | Ej. `CE1103 G3` (se muestra solo `CE1103`) |

Una celda vacía = laboratorio libre. Si el mismo curso ocupa franjas seguidas,
se une en un solo rango (9:30–10:30 + 10:30–11:30 → `9:30 – 11:30`).
Las hojas que no tengan la fila `PER` se ignoran.

## Estructura del proyecto

```
public/horarios.xlsx   Excel cargado por defecto
src/parser.js          Lee el Excel y calcula bloques ocupados
src/config.js          Labs ocultos y colores
src/App.jsx            Interfaz (selector de día, tabla, filtro)
src/styles.css         Estilos y diseño responsive
```

## Publicar

Sube la carpeta `dist/` (después de `npm run build`) a cualquier hosting estático:
Netlify, Vercel, GitHub Pages, o el servidor web de la universidad.
Como usa `base: './'`, funciona también dentro de subcarpetas.

## Notas

- Todo se procesa en el navegador; no hay servidor ni base de datos.
- La hora que se usa para resaltar "ahora" es la del dispositivo del estudiante.
- No incluye reservas ni feriados/cambios puntuales: refleja únicamente el horario del Excel.
