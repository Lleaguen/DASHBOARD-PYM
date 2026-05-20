import React from 'react'
import { Activity, RefreshCw, BarChart3 } from 'lucide-react'
import { useFileProcessor } from './hooks/useFileProcessor'
import FileUploader from './components/FileUploader'
import KpiCards from './components/KpiCards'
import ProgressBar from './components/ProgressBar'
import IngresosCurva from './components/IngresosCurva'
import { DockChart, ZonaChart } from './components/DistribucionCharts'
import PiezasTable from './components/PiezasTable'

function Header({ onReset, hasData }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-gray-50 tracking-tight leading-none">
              Monitor Dashboard PYM
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">{dateStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasData && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Dashboard activo
            </div>
          )}
          {hasData && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl px-3 py-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Nuevo análisis
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="card flex flex-col items-center gap-4 px-10 py-8">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-700" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-100">Procesando archivos...</p>
          <p className="text-xs text-gray-500 mt-1">Analizando TARGET, TMS y Registro</p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { data, loading, errors, fileStatus, handleFileChange, reset } = useFileProcessor()

  return (
    <div className="min-h-screen bg-gray-950">
      <Header onReset={reset} hasData={!!data} />

      {loading && <LoadingOverlay />}

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">

        {/* Carga de archivos — siempre visible si no hay datos */}
        {!data && (
          <div className="max-w-4xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-8 mt-4">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-xs text-blue-400 font-semibold mb-4">
                <BarChart3 className="w-3.5 h-3.5" />
                Sistema de Monitoreo Logístico
              </div>
              <h2 className="text-3xl font-black text-gray-50 mb-2">
                Control de Adherencia PYM
              </h2>
              <p className="text-gray-500 text-sm max-w-lg mx-auto">
                Carga los 3 archivos para analizar el estado de tus piezas TARGET:
                adherencia al proceso, pendientes e ingresos a planta.
              </p>
            </div>

            <FileUploader
              fileStatus={fileStatus}
              onFileChange={handleFileChange}
              errors={errors}
            />

            {/* Instrucciones */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
              {[
                {
                  num: '01',
                  title: 'Priorizacion PYM',
                  desc: 'Archivo .xlsx con la hoja "Ciudad". Se leerá la columna TARGET_ID con todas las piezas del plan.',
                  color: 'text-blue-400',
                },
                {
                  num: '02',
                  title: 'TMS',
                  desc: 'Archivo .csv con los ingresos del sistema: Shipment ID, Dock ID, Labeling Zone, Inbound Date y Position.',
                  color: 'text-violet-400',
                },
                {
                  num: '03',
                  title: 'Registro',
                  desc: 'Archivo .xlsx con la hoja "REGISTRO". La columna B (pym) contiene las piezas que pasaron por proceso.',
                  color: 'text-cyan-400',
                },
              ].map((item) => (
                <div key={item.num} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                  <span className={`text-2xl font-black ${item.color} opacity-40`}>{item.num}</span>
                  <p className="font-semibold text-gray-300 mt-1 mb-1">{item.title}</p>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard — visible cuando hay datos */}
        {data && (
          <>
            {/* Uploader compacto en la parte superior */}
            <details className="group">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1.5 select-none w-fit">
                <RefreshCw className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                Cambiar archivos
              </summary>
              <div className="mt-3">
                <FileUploader
                  fileStatus={fileStatus}
                  onFileChange={handleFileChange}
                  errors={errors}
                />
              </div>
            </details>

            {/* KPIs */}
            <KpiCards kpis={data.kpis} />

            {/* Barra de progreso general */}
            <ProgressBar kpis={data.kpis} />

            {/* Curva de ingresos */}
            <IngresosCurva dataHora={data.ingresosPorHora} dataRendimiento={data.rendimientoPorHora} />

            {/* Distribuciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DockChart data={data.porDock} />
              <ZonaChart data={data.porZona} />
            </div>

            {/* Tabla detalle */}
            <PiezasTable pieces={data.pieces} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-4 text-center text-xs text-gray-700">
        Monitor Dashboard PYM · Procesamiento local en el navegador · Sin envío de datos externos
      </footer>
    </div>
  )
}
