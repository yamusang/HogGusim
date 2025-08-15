import { useCallback, useState } from 'react'

export default function useApi(fn) {
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const run = useCallback(async (...args) => {
    try {
      setLoading(true)
      setError(null)
      return await fn(...args)
    } catch (e) {
      setError(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [fn]);

  return { run, loading, error }
}
//.
