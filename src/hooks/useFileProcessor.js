import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

// ─── Utilidades ───────────────────────────────────────────────────────────────

const normalize = (val) => String(val ?? '').trim().toUpperCase()

/**
 * Parsea fecha/hora desde string o número serial Excel.
 * Soporta:
 *   "20/5/2026 18:25:34"  → DD/M/YYYY HH:MM:SS
 *   "19/5/2026 00:35"     → DD/M/YYYY HH:MM
 *   "2026-05-19T00:35"    → ISO
 *   número serial Excel
 */
const parseDate = (val) => {
  if (!val) return null

  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val)
    if (d) return new Date(d.y, d.m - 1, d.d, d.H || 0, d.M || 0, d.S || 0)
  }

  const str = String(val).trim()

  // DD/M/YYYY HH:MM[:SS]
  const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
  if (dmy) {
    const [, day, month, year, h = '0', m = '0', s = '0'] = dmy
    return new Date(+year, +month - 1, +day, +h, +m, +s)
  }

  // YYYY-MM-DD[T ]HH:MM[:SS]
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/)
  if (iso) {
    const [, year, month, day, h = '0', m = '0', s = '0'] = iso
    return new Date(+year, +month - 1, +day, +h, +m, +s)
  }

  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

const formatDate = (date) =>
  date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })

const pad2 = (n) => String(n).padStart(2, '0')

// Clave "YYYY-MM-DD HH" para agrupar por hora
const hourKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:00`

// Label legible para el eje X
const hourLabel = (date) =>
  `${formatDate(date)} ${pad2(date.getHours())}:00`

// ─── Lectores ─────────────────────────────────────────────────────────────────

const readXlsx = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try { resolve(XLSX.read(e.target.result, { type: 'array', cellDates: false })) }
      catch (err) { reject(err) }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })

const readCsv = (file) =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => resolve(r.data),
      error: reject,
    })
  })

// ─── Búsqueda flexible de columna ────────────────────────────────────────────

const findColValue = (row, keys) => {
  const upperKeys = keys.map(normalize)
  const key = Object.keys(row).find((k) => upperKeys.includes(normalize(k)))
  return key ? String(row[key] ?? '').trim() : ''
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useFileProcessor() {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(false)
  const [errors, setErrors]       = useState([])
  const [fileStatus, setFileStatus] = useState({ priorizacion: false, tms: false, registro: false })
  const [rawFiles, setRawFiles]   = useState({ priorizacion: null, tms: null, registro: null })

  const processAll = useCallback(async (files) => {
    setLoading(true)
    setErrors([])
    const errs = []

    try {
      // ── 1. Priorizacion PYM → hoja "Ciudad" → TARGET_ID ──────────────────
      let targetIds = []
      if (files.priorizacion) {
        try {
          const wb = await readXlsx(files.priorizacion)
          const sheetName = wb.SheetNames.find((n) => n.trim().toLowerCase() === 'ciudad')
          if (!sheetName) {
            errs.push('No se encontró la hoja "Ciudad" en Priorizacion PYM.')
          } else {
            const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })
            const header = rows[0] || []
            let colIdx = header.findIndex((h) => normalize(h) === 'TARGET_ID' || normalize(h) === 'TARGET ID')
            if (colIdx < 0) colIdx = 0
            targetIds = rows.slice(1).map((r) => normalize(r[colIdx])).filter(Boolean)
          }
        } catch (e) { errs.push(`Error leyendo Priorizacion PYM: ${e.message}`) }
      }

      // ── 2. TMS CSV ────────────────────────────────────────────────────────
      let tmsRows = []
      if (files.tms) {
        try {
          const parsed = await readCsv(files.tms)
          tmsRows = parsed.map((row) => {
            const rawDate = findColValue(row, ['Inbound Date Included'])
            const inboundDate = parseDate(rawDate)
            return {
              shipmentId:     normalize(findColValue(row, ['Shipment ID', 'ShipmentID'])),
              dockId:         findColValue(row, ['Inbound Dock ID', 'Dock ID', 'DockID']),
              labelingZone:   findColValue(row, ['Labeling Zone', 'LabelingZone']),
              inboundDate,
              inboundDateRaw: rawDate,
              position:       findColValue(row, ['Outbound Position', 'Position']),
              hubStatus:      findColValue(row, ['Hub Status']),
              truckId:        findColValue(row, ['Truck ID']),
              labelingCarrier:findColValue(row, ['Labeling Carrier Name']),
              labelingService:findColValue(row, ['Labeling Service Name']),
              trackingNumber: findColValue(row, ['Tracking Number']),
              priority:       findColValue(row, ['Priority']),
              processType:    findColValue(row, ['Process Type']),
              statusDesc:     findColValue(row, ['Status Description']),
              inboundCarrier: findColValue(row, ['Inbound Carrier Name']),
              dispatchDockId: findColValue(row, ['Dispatch Dock ID']),
              inboundUserId:  findColValue(row, ['Inbound User ID', 'INBOUND USER ID']),
              outboundAddedBy:findColValue(row, ['Outbound Added By', 'OUTBOUND ADDED BY']),
            }
          }).filter((r) => r.shipmentId)
        } catch (e) { errs.push(`Error leyendo TMS: ${e.message}`) }
      }

      // ── 3. Registro xlsx → hoja "REGISTRO" → col B (pym) + "Columna 1" (timestamp) ──
      let pymIds = []
      let registroTimestamps = [] // [{ shipmentId, date }]
      if (files.registro) {
        try {
          const wb = await readXlsx(files.registro)
          const sheetName = wb.SheetNames.find((n) => n.trim().toUpperCase() === 'REGISTRO')
          if (!sheetName) {
            errs.push('No se encontró la hoja "REGISTRO" en el archivo de Registro.')
          } else {
            const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })

            // Detectar fila de header: buscar la que tenga "COLUMNA", "PYM" o "SHIPMENT"
            let headerRowIdx = 0
            for (let i = 0; i < Math.min(5, rows.length); i++) {
              const rowNorm = rows[i].map((c) => normalize(c))
              if (rowNorm.some((c) => c.includes('COLUMNA') || c === 'PYM' || c === 'SHIPMENT')) {
                headerRowIdx = i
                break
              }
            }

            const header = rows[headerRowIdx] || []
            console.log('[REGISTRO] headerRowIdx:', headerRowIdx, '| header:', header)

            // Columna PYM (col B = índice 1 por defecto)
            let pymColIdx = header.findIndex((h) => normalize(h) === 'PYM' || normalize(h) === 'SHIPMENT')
            if (pymColIdx < 0) pymColIdx = 1

            // Columna timestamp → buscar "Columna 1" por nombre
            let tsColIdx = header.findIndex((h) => {
              const n = normalize(h)
              return n === 'COLUMNA 1' || n === 'COLUMNA1' || n === 'COLUMNA_1'
            })

            // Fallback 1: buscar cualquier columna cuyo header contenga "COLUMNA"
            if (tsColIdx < 0) {
              tsColIdx = header.findIndex((h) => normalize(h).startsWith('COLUMNA'))
            }

            // Fallback 2: buscar por contenido — escanear varias filas de datos
            if (tsColIdx < 0) {
              const dataRows = rows.slice(headerRowIdx + 1).filter(r => r.some(c => c !== '' && c != null))
              // Revisar hasta 10 filas para encontrar una columna con fecha
              outer: for (const sampleRow of dataRows.slice(0, 10)) {
                for (let ci = 0; ci < sampleRow.length; ci++) {
                  const cell = sampleRow[ci]
                  if (typeof cell === 'number' && cell > 40000 && cell < 60000) { tsColIdx = ci; break outer }
                  const s = String(cell).trim()
                  if (/\d{1,2}\/\d{1,2}\/\d{4}.*\d{1,2}:\d{2}/.test(s)) { tsColIdx = ci; break outer }
                }
              }
            }

            console.log('[REGISTRO] pymColIdx:', pymColIdx, '| tsColIdx:', tsColIdx)
            if (tsColIdx >= 0) {
              const sample = rows[headerRowIdx + 1]?.[tsColIdx]
              console.log('[REGISTRO] muestra timestamp col', tsColIdx, ':', sample)
            }

            rows.slice(headerRowIdx + 1).forEach((r) => {
              const id = normalize(r[pymColIdx])
              if (!id) return
              pymIds.push(id)
              if (tsColIdx >= 0 && r[tsColIdx] !== '' && r[tsColIdx] != null) {
                const d = parseDate(r[tsColIdx])
                if (d) registroTimestamps.push({ shipmentId: id, date: d })
              }
            })

            console.log('[REGISTRO] pymIds:', pymIds.length, '| timestamps:', registroTimestamps.length)
          }
        } catch (e) { errs.push(`Error leyendo Registro: ${e.message}`) }
      }

      // ── Clasificación ─────────────────────────────────────────────────────

      const targetSet = new Set(targetIds)
      const pymSet = new Set(pymIds)

      // tmsMap: shipmentId → primera fila TMS
      const tmsMap = new Map()
      for (const r of tmsRows) {
        if (!tmsMap.has(r.shipmentId)) tmsMap.set(r.shipmentId, r)
      }
      const tmsSet = new Set(tmsMap.keys())

      const pieces = targetIds.map((id) => {
        const inPym = pymSet.has(id)
        const inTms = tmsSet.has(id)
        let status = inPym ? 'adherencia' : inTms ? 'pendiente' : 'no_ingresado'
        return { targetId: id, status, inPym, inTms, tmsInfo: tmsMap.get(id) || null }
      })

      // ── KPIs ──────────────────────────────────────────────────────────────

      const total       = pieces.length
      const adherencia  = pieces.filter((p) => p.status === 'adherencia').length
      const pendientes  = pieces.filter((p) => p.status === 'pendiente').length
      const noIngresados= pieces.filter((p) => p.status === 'no_ingresado').length
      const ingresados  = adherencia + pendientes

      const pct = (n) => total > 0 ? Number(((n / total) * 100).toFixed(1)) : 0

      // ── Curva de ingresos por DÍA (TMS) ──────────────────────────────────

      const dateMap = new Map()
      for (const r of tmsRows) {
        if (!r.inboundDate) continue
        const key = formatDate(r.inboundDate)
        if (!dateMap.has(key)) dateMap.set(key, { date: r.inboundDate, count: 0, adherencia: 0 })
        const e = dateMap.get(key)
        e.count++
        if (pymSet.has(r.shipmentId)) e.adherencia++
      }
      const ingresosCurva = Array.from(dateMap.values())
        .sort((a, b) => a.date - b.date)
        .map((e, idx, arr) => ({
          fecha: formatDate(e.date),
          ingresos: e.count,
          acumulado: arr.slice(0, idx + 1).reduce((s, x) => s + x.count, 0),
          adherenciaDia: e.adherencia,
        }))

      // ── Curva de ingresos por HORA (TMS) ─────────────────────────────────
      // Solo piezas del TARGET que ya ingresaron a planta (están en TMS)
      // La hora viene de Inbound Date Included del TMS

      const hourMapTms = new Map()
      for (const r of tmsRows) {
        if (!r.inboundDate) continue
        if (!targetSet.has(r.shipmentId)) continue   // solo TARGET

        const key = hourKey(r.inboundDate)
        if (!hourMapTms.has(key)) {
          const d = r.inboundDate
          hourMapTms.set(key, {
            dateObj: new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()),
            label: hourLabel(r.inboundDate),
            hora: `${pad2(r.inboundDate.getHours())}:00`,
            count: 0,
          })
        }
        hourMapTms.get(key).count++
      }
      const ingresosPorHora = Array.from(hourMapTms.values())
        .sort((a, b) => a.dateObj - b.dateObj)
        .map((e, idx, arr) => ({
          fecha: e.label,
          hora: e.hora,
          ingresos: e.count,
          acumulado: arr.slice(0, idx + 1).reduce((s, x) => s + x.count, 0),
        }))

      // ── Rendimiento por HORA del REGISTRO (Columna 1) ────────────────────
      // Piezas del TARGET procesadas (en PYM), agrupadas por hora del timestamp del Registro

      const rendHourMap = new Map()
      for (const { shipmentId, date } of registroTimestamps) {
        // El shipmentId viene de la col "pym" del Registro
        // Comparamos contra pymSet (que también viene de la col "pym") — siempre coincide
        // Y además verificamos que esté en TARGET
        const inTarget = targetSet.has(shipmentId)
        const inPym    = pymSet.has(shipmentId)

        // Si no coincide con TARGET, puede ser diferencia de formato — intentar match parcial
        // Usamos pymSet como fuente de verdad para "procesado del TARGET"
        if (!inPym) continue

        const key = hourKey(date)
        if (!rendHourMap.has(key)) {
          rendHourMap.set(key, {
            dateObj: new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()),
            label: hourLabel(date),
            hora: `${pad2(date.getHours())}:00`,
            count: 0,
          })
        }
        rendHourMap.get(key).count++
      }
      const rendimientoPorHora = Array.from(rendHourMap.values())
        .sort((a, b) => a.dateObj - b.dateObj)
        .map((e, idx, arr) => ({
          fecha: e.label,
          hora: e.hora,
          piezasProcesadas: e.count,
          acumulado: arr.slice(0, idx + 1).reduce((s, x) => s + x.count, 0),
        }))

      console.log('[RENDIMIENTO] registroTimestamps total:', registroTimestamps.length,
        '| en TARGET:', registroTimestamps.filter(r => targetSet.has(r.shipmentId)).length,
        '| rendimientoPorHora puntos:', rendimientoPorHora.length)
      // Muestra de IDs para comparar formatos
      console.log('[DEBUG] muestra TARGET IDs:', targetIds.slice(0, 3))
      console.log('[DEBUG] muestra pymIds:', pymIds.slice(0, 3))
      console.log('[DEBUG] muestra registroTimestamps IDs:', registroTimestamps.slice(0, 3).map(r => r.shipmentId))

      // ── Distribución por Dock y Zona ──────────────────────────────────────

      const dockMap = new Map()
      const zoneMap = new Map()
      for (const p of pieces) {
        if (!p.tmsInfo) continue
        const dock = p.tmsInfo.dockId || 'Sin Dock'
        const zone = p.tmsInfo.labelingZone || 'Sin Zona'

        if (!dockMap.has(dock)) dockMap.set(dock, { dock, total: 0, adherencia: 0, pendiente: 0 })
        const de = dockMap.get(dock)
        de.total++
        if (p.status === 'adherencia') de.adherencia++
        if (p.status === 'pendiente')  de.pendiente++

        if (!zoneMap.has(zone)) zoneMap.set(zone, { zone, total: 0, adherencia: 0, pendiente: 0 })
        const ze = zoneMap.get(zone)
        ze.total++
        if (p.status === 'adherencia') ze.adherencia++
        if (p.status === 'pendiente')  ze.pendiente++
      }

      setErrors(errs)
      setData({
        kpis: {
          total, adherencia, pendientes, noIngresados, ingresados,
          pctAdherencia:  pct(adherencia),
          pctIngresados:  pct(ingresados),
          pctPendientes:  pct(pendientes),
        },
        pieces,
        ingresosCurva,
        ingresosPorHora,
        rendimientoPorHora,
        porDock: Array.from(dockMap.values()).sort((a, b) => b.total - a.total),
        porZona: Array.from(zoneMap.values()).sort((a, b) => b.total - a.total),
        pymIds,
        tmsRows,
        targetIds,
      })
    } catch (e) {
      errs.push(`Error general: ${e.message}`)
      setErrors(errs)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFileChange = useCallback(
    (key, file) => {
      const updated = { ...rawFiles, [key]: file }
      setRawFiles(updated)
      setFileStatus((prev) => ({ ...prev, [key]: !!file }))
      if (Object.values(updated).every(Boolean)) processAll(updated)
    },
    [rawFiles, processAll]
  )

  const reset = useCallback(() => {
    setData(null)
    setErrors([])
    setFileStatus({ priorizacion: false, tms: false, registro: false })
    setRawFiles({ priorizacion: null, tms: null, registro: null })
  }, [])

  return { data, loading, errors, fileStatus, handleFileChange, reset }
}
