import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-slate-50 p-8 text-slate-900">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">bi-front</h1>
        <p className="mt-2 text-slate-500">React + Vite + TypeScript + Tailwind CSS</p>
      </div>

      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        Contador: {count}
      </button>

      <p className="text-sm text-slate-400">
        Edita <code className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-700">src/App.tsx</code> para empezar
      </p>
    </main>
  )
}

export default App
