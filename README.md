# 🖥️ Disponibilidad de Laboratorios – Ingeniería en Computadores

Página web (React + Vite) que lee el Excel oficial de horarios y muestra a los estudiantes qué laboratorios están
**Libres** u **Ocupados** por clase. Es responsive (celular, tablet y computadora).

## Qué muestra

- **Tabla por semana:** una columna por laboratorio y una fila por franja horaria. Las celdas ocupadas muestran solo
  el **código del curso** y su rango de horas (ej. `CE1103 · 9:30 – 11:30`).
- **Navegación por semanas** (Semana anterior / siguiente y botón "Hoy") dentro de todos los períodos configurados,
  más selector de día.
- **Disponibles ahora:** interruptor que oculta la tabla y muestra solo los laboratorios libres a la **hora del
  dispositivo** en el **día elegido**, con la hora hasta la que siguen libres.
- Aviso visible de que los horarios pueden cambiar y de que la página **no conoce las reservas** de laboratorios.
- Encabezado con foto, y cierre con "¡Aprovecha nuestros laboratorios al máximo!" y datos de contacto.

## Imágenes (carpeta `public/`)

| Archivo | Uso |
|---|---|
| `header.jpg` | Foto del encabezado (reemplázala por la tuya, mismo nombre). Si no existe, el espacio se oculta. |
| `logo.png` | Logo (arriba a la izquierda). Si no existe, se muestra un logo `</>` por defecto. |

## Configuración (`src/config.js`)

```js
export const HIDDEN_LABS = ['F4-02']          // labs que NO se muestran al público
export const PERIODS = [
  { name: 'II Semestre 2026 (período lectivo)', start: '2026-08-03', end: '2026-11-21', file: 'horarios.xlsx' },
  { name: 'Semanas sin clases', start: '2026-11-23', end: '2026-12-05', file: 'horarios.xlsx', allFree: true },
]
export const CLOSED_DATES = { '2026-09-15': 'Feriado: Día de la Independencia' }
export const CONTACT = { escuela: '…', correo: '…', redes: '…' }
```

- **Períodos:** la página carga el Excel que corresponde a la fecha elegida. `allFree: true` = sin clases, todos los
  laboratorios aparecen libres. Para el verano, descomenta/agrega un período con su propio Excel (`public/verano.xlsx`).
- Fuera de los períodos (o en `CLOSED_DATES`) el día se muestra como **cerrado**. Si hoy está fuera de todo período,
  aparece "Laboratorios cerrados" con la fecha del próximo.
- Con `?admin` al final de la dirección se ignoran las fechas y aparece un botón para **probar otro Excel** en tu
  navegador (no cambia lo que ven los estudiantes).
- ⚠️ Los datos de contacto y el feriado son de ejemplo: ajústalos.

## Instalación

Requiere [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dev      # desarrollo: http://localhost:5173
npm run build    # genera dist/ para publicar
```

Publica el contenido de `dist/` en Netlify, Vercel, GitHub Pages o el servidor de la universidad.
Para actualizar horarios: reemplaza el Excel en `public/` (mismo nombre) y vuelve a publicar.

## Formato esperado del Excel

Una hoja por laboratorio:

| Zona | Contenido |
|---|---|
| `A2` | Nombre del lab, ej. `F2-07` o `F2-10 (Interactivo)` |
| `A4` | `Capacidad: 24 personas` (opcional) |
| Encabezado | `PER`, `HORA`, `LUNES (L)` … `SABADO (S)` |
| Columna `HORA` | Rango como `7:30 - 8:30` |
| Celdas | Ej. `CE1103 G3` (se muestra solo `CE1103`); vacío = libre |

Períodos seguidos del mismo curso se unen en un solo rango.

## Estructura

```
public/   horarios.xlsx, header.jpg, logo.png
src/      parser.js (lee el Excel) · config.js · App.jsx · styles.css
```

## Notas

- Todo se procesa en el navegador; no hay servidor ni base de datos.
- "Ahora" usa la hora del dispositivo del estudiante.
- La página refleja solo el horario del Excel: no incluye reservas ni cambios puntuales.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub y sube el proyecto (rama `main`).
2. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Cada `git push` a `main` ejecuta `.github/workflows/deploy.yml`, que compila y publica la página.
4. La dirección queda como `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

Para cambiar el horario: reemplaza `public/horarios.xlsx` (puedes hacerlo desde la web de GitHub con *Add file → Upload files*) y haz commit; se republica solo.
