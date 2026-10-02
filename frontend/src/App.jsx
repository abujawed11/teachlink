function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-sm text-center space-y-4">
        <h1 className="text-3xl font-bold text-indigo-600">TeachLink</h1>
        <p className="text-slate-500">
          If this card has a shadow, rounded corners, and the heading is purple, Tailwind is working.
        </p>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
          Test Button
        </button>
      </div>
    </div>
  )
}

export default App
