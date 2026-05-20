import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { Layers, MapPin } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-2xl text-xs">
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

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function DockChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="card flex items-center justify-center h-64 text-gray-600 text-sm">
        Sin datos de Dock ID
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-blue-500/20 rounded-xl">
          <Layers className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold text-base text-gray-100">Por Inbound Dock ID</h3>
          <p className="text-xs text-gray-500">Adherencia vs Pendientes por dock</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="dock" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af', paddingTop: '8px' }} iconType="circle" iconSize={8} />
          <Bar dataKey="adherencia" name="Adherencia" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={16} stackId="a" />
          <Bar dataKey="pendiente" name="Pendiente" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={16} stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ZonaChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="card flex items-center justify-center h-64 text-gray-600 text-sm">
        Sin datos de Labeling Zone
      </div>
    )
  }

  const pieData = data.slice(0, 8).map((d) => ({ name: d.zone, value: d.total }))

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-cyan-500/20 rounded-xl">
          <MapPin className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="font-bold text-base text-gray-100">Por Labeling Zone</h3>
          <p className="text-xs text-gray-500">Distribución de piezas por zona</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={<CustomPieLabel />}
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val, name) => [val.toLocaleString(), name]}
            contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '12px', fontSize: '12px' }}
            labelStyle={{ color: '#e5e7eb' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
