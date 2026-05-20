import React, { useRef, useState } from 'react'
import { Upload, FileSpreadsheet, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

const FILE_CONFIG = [
  {
    key: 'priorizacion',
    label: 'Priorizacion PYM',
    description: 'Hoja "Ciudad" → TARGET_ID',
    accept: '.xlsx,.xls',
    icon: FileSpreadsheet,
    color: 'blue',
  },
  {
    key: 'tms',
    label: 'TMS',
    description: 'Shipment ID, Dock ID, Labeling Zone, Inbound Date, Position',
    accept: '.csv',
    icon: FileText,
    color: 'violet',
  },
  {
    key: 'registro',
    label: 'Registro',
    description: 'Hoja "REGISTRO" → columna PYM',
    accept: '.xlsx,.xls',
    icon: FileSpreadsheet,
    color: 'cyan',
  },
]

const colorMap = {
  blue: {
    border: 'border-blue-500/40 hover:border-blue-400',
    bg: 'bg-blue-500/10',
    icon: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300',
  },
  violet: {
    border: 'border-violet-500/40 hover:border-violet-400',
    bg: 'bg-violet-500/10',
    icon: 'text-violet-400',
    badge: 'bg-violet-500/20 text-violet-300',
  },
  cyan: {
    border: 'border-cyan-500/40 hover:border-cyan-400',
    bg: 'bg-cyan-500/10',
    icon: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300',
  },
}

function FileCard({ config, status, onFile }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState(null)
  const colors = colorMap[config.color]
  const Icon = config.icon

  const handleFile = (file) => {
    if (!file) return
    setFileName(file.name)
    onFile(config.key, file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-2xl border-2 border-dashed p-5 cursor-pointer transition-all duration-200
        ${dragging ? 'scale-[1.02] border-white/40 bg-white/5' : colors.border}
        ${status ? 'border-solid border-emerald-500/50 bg-emerald-500/5' : colors.bg}
      `}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={config.accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${status ? 'bg-emerald-500/20' : colors.bg}`}>
          {status
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            : <Icon className={`w-5 h-5 ${colors.icon}`} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-100">{config.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
          {config.accept}
        </span>
      </div>

      {fileName ? (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{fileName}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Upload className="w-3.5 h-3.5" />
          <span>Arrastra o haz clic para seleccionar</span>
        </div>
      )}
    </div>
  )
}

export default function FileUploader({ fileStatus, onFileChange, errors }) {
  const allReady = Object.values(fileStatus).every(Boolean)

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-brand-500/20 rounded-xl">
          <Upload className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h2 className="font-bold text-base text-gray-100">Carga de Archivos</h2>
          <p className="text-xs text-gray-500">Sube los 3 archivos para generar el dashboard</p>
        </div>
        {allReady && (
          <span className="ml-auto badge-green">
            <CheckCircle2 className="w-3 h-3" /> Listo
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FILE_CONFIG.map((cfg) => (
          <FileCard
            key={cfg.key}
            config={cfg}
            status={fileStatus[cfg.key]}
            onFile={onFileChange}
          />
        ))}
      </div>

      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
