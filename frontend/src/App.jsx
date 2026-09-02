import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setApiStatus(data))
      .catch(err => setApiStatus({ error: err.message }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="App">
      <h1>Rating App</h1>
      <p>Phase 1: Basic Setup</p>
      {loading && <p>Checking API...</p>}
      {apiStatus && (
        <pre>{JSON.stringify(apiStatus, null, 2)}</pre>
      )}
    </div>
  )
}

export default App