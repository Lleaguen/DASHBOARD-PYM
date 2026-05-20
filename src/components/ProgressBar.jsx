import React from 'react'

export default function ProgressBar({ kpis }) {
  const { total, adherencia, pendientes, noIngresados } = kpis
  if (total === 0) return null

  const pctAdh = (adherencia / total) * 100
  const pctPend = (pendientes / total) * 100
  const pctNoIng = (noIngresados / total) * 100

  const segments = [
    { pct: pctAdh, color: 'bg-emerald-500', label: 'Adherencia', value: adherencia },
    { pct: pctPend, color: 'bg-amber-500', label: 'Pendiente', value: pendientes },
    { pct: pctNoIng, color: 'bg-red-500/70', label: 'No Ingresado', value: noIngresados },
  ]

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-sm text-gray-100">Avance General del TARGET</h3>
          <p className="text-xs text-gray-500">
            {adherencia.toLocaleString()} de {total.toLocaleString()} piezas con adherencia
          </p>
        </div>
        <span className="text-2xl font-black text-emerald-400">
          {((adherencia / total) * 100).toFixed(1)}%
        </span>
      </div>

      {/* Barra segmentada */}
      <div className="flex h-4 rounded-full overflow-hidden gap-0.5 bg-gray-800">
        {segments.map((s) =>
          s.pct > 0 ? (
            <div
              key={s.label}
              className={`${s.color} transition-all duration-700 ease-out`}
              style={{ width: `${s.pct}%` }}
              title={`${s.label}: ${s.value.toLocaleString()} (${s.pct.toFixed(1)}%)`}
            />
          ) : null
        )}
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 mt-3 flex-wrap">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
            <span>{s.label}</span>
            <span className="font-semibold text-gray-300">{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
