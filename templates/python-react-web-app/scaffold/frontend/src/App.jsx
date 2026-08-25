import { useEffect, useState } from 'react'

function App() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'error' }))
  }, [])

  return (
    <div>
      <h1>App</h1>
      <p>API status: {health ? health.status : 'checking...'}</p>
    </div>
  )
}

export default App
