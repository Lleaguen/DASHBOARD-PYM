import React, { useState, useMemo } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Filter } from 'lucide-react'

const STATUS_CONFIG = {
  adherencia: {
    label: 'Adherencia',
    badge: 'badge-green',
    dot: 'bg-emerald-400',
  },
  pendiente: {
    label: 'Pendiente',
    badge: 'badge-yellow',
    dot: 'bg-amber-400',
  },
  no_ingresado: {
    label: 'No Ingresado',
    badge: 'badge-red',
    dot: 'bg-red-400',
  },
}

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'adherencia', label: 'Adherencia' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'no_ingresado', label: 'No Ingresados' },
]

const PAGE_SIZE = 50

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-600" />
  return sortDir === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
    : <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
}

export default function PiezasTable({ pieces }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortCol, setSortCol] = useState('targetId')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
    setPage(1)
  }

  const filtered = useMemo(() => {
    let rows = pieces
    if (filter !== 'all') rows = rows.filter((p) => p.status === filter)
    if (search.trim()) {
      const q = search.trim().toUpperCase()
      rows = rows.filter(
        (p) =>
          p.targetId.includes(q) ||
          (p.tmsInfo?.dockId || '').toUpperCase().includes(q) ||
          (p.tmsInfo?.labelingZone || '').toUpperCase().includes(q) ||
          (p.tmsInfo?.position || '').toUpperCase().includes(q) ||
          (p.tmsInfo?.hubStatus || '').toUpperCase().includes(q) ||
          (p.tmsInfo?.inboundUserId || '').toUpperCase().includes(q) ||
          (p.tmsInfo?.outboundAddedBy || '').toUpperCase().includes(q) ||
          (p.tmsInfo?.truckId || '').toUpperCase().includes(q)
      )
    }
    // Sort
    rows = [...rows].sort((a, b) => {
      let va, vb
      switch (sortCol) {
        case 'targetId':      va = a.targetId;                        vb = b.targetId; break
        case 'status':        va = a.status;                          vb = b.status; break
        case 'dockId':        va = a.tmsInfo?.dockId || '';           vb = b.tmsInfo?.dockId || ''; break
        case 'labelingZone':  va = a.tmsInfo?.labelingZone || '';     vb = b.tmsInfo?.labelingZone || ''; break
        case 'inboundDate':   va = a.tmsInfo?.inboundDate || new Date(0); vb = b.tmsInfo?.inboundDate || new Date(0); break
        case 'position':      va = a.tmsInfo?.position || '';         vb = b.tmsInfo?.position || ''; break
        case 'hubStatus':     va = a.tmsInfo?.hubStatus || '';        vb = b.tmsInfo?.hubStatus || ''; break
        case 'inboundUserId':  va = a.tmsInfo?.inboundUserId || '';   vb = b.tmsInfo?.inboundUserId || ''; break
        case 'outboundAddedBy':va = a.tmsInfo?.outboundAddedBy || ''; vb = b.tmsInfo?.outboundAddedBy || ''; break
        default:              va = a.targetId;                        vb = b.targetId
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [pieces, filter, search, sortCol, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const cols = [
    { key: 'targetId',        label: 'TARGET ID' },
    { key: 'status',          label: 'Estado' },
    { key: 'dockId',          label: 'Inbound Dock ID' },
    { key: 'labelingZone',    label: 'Labeling Zone' },
    { key: 'inboundDate',     label: 'Inbound Date Included' },
    { key: 'position',        label: 'Outbound Position' },
    { key: 'hubStatus',       label: 'Hub Status' },
    { key: 'inboundUserId',   label: 'Inbound User ID' },
    { key: 'outboundAddedBy', label: 'Outbound Added By' },
  ]

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-base text-gray-100">Detalle de Piezas</h3>
          <p className="text-xs text-gray-500">{filtered.length.toLocaleString()} piezas encontradas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtros de estado */}
          <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === f.key
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar ID, dock, zona, tracking..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 w-56"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-800/80">
              {cols.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-left font-semibold text-gray-400 cursor-pointer select-none whitespace-nowrap hover:text-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="px-4 py-10 text-center text-gray-600">
                  No hay piezas que coincidan con los filtros
                </td>
              </tr>
            ) : (
              paginated.map((p, i) => {
                const cfg = STATUS_CONFIG[p.status]
                return (
                  <tr key={`${p.targetId}-${i}`} className="table-row-hover">
                    <td className="px-4 py-2.5 font-mono font-semibold text-gray-200 whitespace-nowrap">
                      {p.targetId}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cfg.badge}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{p.tmsInfo?.dockId || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{p.tmsInfo?.labelingZone || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
                      {p.tmsInfo?.inboundDate
                        ? p.tmsInfo.inboundDate.toLocaleString('es-MX', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: false,
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{p.tmsInfo?.position || '—'}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {p.tmsInfo?.hubStatus
                        ? <span className="badge-blue">{p.tmsInfo.hubStatus}</span>
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{p.tmsInfo?.inboundUserId  || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{p.tmsInfo?.outboundAddedBy || '—'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <span>
            Mostrando {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length.toLocaleString()}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
