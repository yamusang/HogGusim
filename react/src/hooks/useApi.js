import { useCallback, useState } from 'react';

export default function useApi(fn){
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [data, setData]     = useState(null);

  const run = useCallback(async (...args) => {
    setLoading(true); setError(null);
    try {
      const d = await fn(...args);
      setData(d);
      return d;
    } catch(e) { setError(e); throw e; }
    finally { setLoading(false); }
  }, [fn]);

  return { loading, error, data, run, setData };
}
