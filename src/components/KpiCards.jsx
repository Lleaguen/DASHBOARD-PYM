import React from 'react'
import { Target, CheckCircle2, Clock, XCircle, TrendingUp, Package } from 'lucide-react'

function RadialProgress({ pct, color, size = 80 }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  const colorMap = {
    emerald: '#10b981',
    amber: '#f59e0b',
    red: '#ef4444',
    blue: '#3b82f6',
    violet: '#8b5cf6',
  }

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={8}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={colorMap[color] || colorMap.blue}
        strokeWidth={8}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  )
}

function KpiCard({ icon: Icon, label, value, sub, pct, color, bgColor, textColor }) {
  return (
    <div className={`stat-card relative overflow-hidden`}>
      {/* Glow background */}
      <div className={`absolute inset-0 opacity-5 ${bgColor} rounded-2xl`} />

      <div className="relative flex items-start justify-between gap-2">
        <div className={`p-2.5 rounded-xl ${bgColor} bg-opacity-20`}>
          <Icon className={`w-5 h-5 ${textColor}`} />
        </div>
        {pct !== undefined && (
          <div className="relative flex items-center justify-center">
            <RadialProgress pct={pct} color={color} size={56} />
            <span className={`absolute text-[10px] font-bold ${textColor}`}>
              {pct}%
            </span>
          </div>
        )}
      </div>

      <div className="relative mt-1">
        <p className="text-3xl font-black text-gray-50 tracking-tight">{value}</p>
        <p className="text-sm font-semibold text-gray-300 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function KpiCards({ kpis }) {
  const {
    total, adherencia, pendientes, noIngresados, ingresados,
    pctAdherencia, pctIngresados, pctPendientes,
  } = kpis

  const cards = [
    {
      icon: Target,
      label: 'Total TARGET',
      value: total.toLocaleString(),
      sub: 'Piezas en plan',
      color: 'blue',
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-400',
    },
    {
      icon: TrendingUp,
      label: 'Ingresados a Planta',
      value: ingresados.toLocaleString(),
      sub: `${pctIngresados}% del TARGET`,
      pct: Number(pctIngresados),
      color: 'violet',
      bgColor: 'bg-violet-500',
      textColor: 'text-violet-400',
    },
    {
      icon: CheckCircle2,
      label: 'Con Adherencia',
      value: adherencia.toLocaleString(),
      sub: `${pctAdherencia}% del TARGET`,
      pct: Number(pctAdherencia),
      color: 'emerald',
      bgColor: 'bg-emerald-500',
      textColor: 'text-emerald-400',
    },
    {
      icon: Clock,
      label: 'Pendientes de Proceso',
      value: pendientes.toLocaleString(),
      sub: `${pctPendientes}% del TARGET`,
      pct: Number(pctPendientes),
      color: 'amber',
      bgColor: 'bg-amber-500',
      textColor: 'text-amber-400',
    },
    {
      icon: XCircle,
      label: 'No Ingresados',
      value: noIngresados.toLocaleString(),
      sub: `${total > 0 ? ((noIngresados / total) * 100).toFixed(1) : 0}% del TARGET`,
      pct: total > 0 ? Number(((noIngresados / total) * 100).toFixed(1)) : 0,
      color: 'red',
      bgColor: 'bg-red-500',
      textColor: 'text-red-400',
    },
    {
      icon: Package,
      label: 'Piezas en TMS',
      value: (ingresados).toLocaleString(),
      sub: 'Descargadas del sistema',
      color: 'blue',
      bgColor: 'bg-sky-500',
      textColor: 'text-sky-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((c) => (
        <KpiCard key={c.label} {...c} />
      ))}
    </div>
  )
}
