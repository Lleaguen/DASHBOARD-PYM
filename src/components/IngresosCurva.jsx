import React, { useMemo } from 'react'
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, BarChart2 } from 'lucide-react'

// ── Tooltip compartido ────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-2xl text-xs min-w-[200px]">
      <p className="font-bold text-gray-200 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="font-semibold text-gray-100">{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ── Formatea "19/05/2026 14:00" → "19/05 14:00" para el eje X ────────────────
const fmtTick = (val) => {
  const s = String(val)
  // "DD/MM/YYYY HH:00" → "DD/MM HH:00"
  const m = s.match(/^(\d{2}\/\d{2})\/\d{4}\s+(\d{2}:\d{2})$/)
  return m ? `${m[1]} ${m[2]}` : s
}

function StatPill({ label, value, sub, color }) {
  const cls = {
    cyan:    'bg-cyan-500/10   border-cyan-500/20   text-cyan-300',
    amber:   'bg-amber-500/10  border-amber-500/20  text-amber-300',
    violet:  'bg-violet-500/10 border-violet-500/20 text-violet-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
  }
  return (
    <div className={`border rounded-xl px-4 py-2 text-xs ${cls[color] || cls.violet}`}>
      <p className="text-gray-500">{label}</p>
      <p className="font-bold text-sm">{value}</p>
      {sub && <p className="text-gray-500">{sub}</p>}
    </div>
  )
}

// ── Props comunes de ejes ─────────────────────────────────────────────────────
const axisBase = { tick: { fill: '#6b7280', fontSize: 10 }, tickLine: false, axisLine: false }
const xProps = (data) => ({
  dataKey: 'fecha',
  tickFormatter: fmtTick,
  ...axisBase,
  angle: -40,
  textAnchor: 'end',
  interval: data.length > 20 ? Math.ceil(data.length / 20) : 0,
  height: 55,
})
const legendStyle = { fontSize: '11px', color: '#9ca3af', paddingTop: '8px' }

// ─────────────────────────────────────────────────────────────────────────────

export default function IngresosCurva({ dataHora, dataRendimiento }) {
  // Combina ambos datasets por franja horaria
  const combined = useMemo(() => {
    const map = new Map()

    ;(dataHora || []).forEach((r) => {
      map.set(r.fecha, {
        fecha: r.fecha,
        ingresos: r.ingresos,
        procesadas: 0,
      })
    })
    ;(dataRendimiento || []).forEach((r) => {
      if (map.has(r.fecha)) {
        map.get(r.fecha).procesadas = r.piezasProcesadas
      } else {
        map.set(r.fecha, { fecha: r.fecha, ingresos: 0, procesadas: r.piezasProcesadas })
      }
    })

    return Array.from(map.values()).sort((a, b) => a.fecha.localeCompare(b.fecha))
  }, [dataHora, dataRendimiento])

  const stats = useMemo(() => {
    if (!combined.length) return null
    const topIng  = [...combined].sort((a, b) => b.ingresos  - a.ingresos)[0]
    const topProc = [...combined].sort((a, b) => b.procesadas - a.procesadas)[0]
    const totIng  = combined.reduce((s, x) => s + x.ingresos,   0)
    const totProc = combined.reduce((s, x) => s + x.procesadas, 0)
    return { topIng, topProc, totIng, totProc }
  }, [combined])

  if (!combined.length) {
    return (
      <div className="card flex items-center justify-center h-48 text-gray-600 text-sm">
        Sin datos de hora disponibles
      </div>
    )
  }

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-500/20 rounded-xl">
          <TrendingUp className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="font-bold text-base text-gray-100">Ingreso vs Procesado por Hora</h3>
          <p className="text-xs text-gray-500">Piezas del TARGET: ingresadas a planta (TMS) vs procesadas (PYM) por franja fecha-hora</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex gap-3 flex-wrap">
          <StatPill label="Hora pico ingreso"        value={stats.topIng?.fecha  ? fmtTick(stats.topIng.fecha)  : '—'} sub={`${stats.topIng?.ingresos ?? 0} piezas TARGET ingresadas`}  color="cyan"    />
          <StatPill label="Hora pico procesado"      value={stats.topProc?.fecha ? fmtTick(stats.topProc.fecha) : '—'} sub={`${stats.topProc?.procesadas ?? 0} piezas TARGET procesadas`} color="amber"   />
          <StatPill label="Total TARGET ingresado"   value={stats.totIng.toLocaleString()}  sub="piezas en TMS"      color="violet"  />
          <StatPill label="Total TARGET procesado"   value={stats.totProc.toLocaleString()} sub="piezas en PYM"      color="emerald" />
        </div>
      )}

      {/* ── Dos gráficas lado a lado ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Curva (líneas) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-gray-300">Curva comparativa</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={combined} margin={{ top: 5, right: 10, left: 0, bottom: 55 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis {...xProps(combined)} />
              <YAxis {...axisBase} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
              <Line
                type="monotone"
                dataKey="ingresos"
                name="TARGET ingresado (TMS)"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#06b6d4', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="procesadas"
                name="Procesado PYM"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Barras agrupadas */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-gray-300">Barras comparativas</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={combined} margin={{ top: 5, right: 10, left: 0, bottom: 55 }} barCategoryGap="30%">
              <defs>
                <linearGradient id="gArribo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="gProc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis {...xProps(combined)} />
              <YAxis {...axisBase} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
              <Bar dataKey="ingresos"   name="TARGET ingresado (TMS)" fill="url(#gArribo)" radius={[3,3,0,0]} maxBarSize={18} />
              <Bar dataKey="procesadas" name="Procesado PYM" fill="url(#gProc)"   radius={[3,3,0,0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}
