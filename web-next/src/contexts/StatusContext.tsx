import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { API } from '@/api/client';

interface StatusData {
  [key: string]: unknown;
}

interface StatusContextValue {
  status: StatusData | null;
  loading: boolean;
}

const StatusContext = createContext<StatusContextValue>({
  status: null,
  loading: true,
});

export function StatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusData | null>(() => {
    try {
      const cached = localStorage.getItem('status');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/api/status')
      .then((res) => {
        if (res.data?.success) {
          const data = res.data.data;
          setStatus(data);
          localStorage.setItem('status', JSON.stringify(data));
        }
      })
      .catch((err) => {
        console.error('[StatusContext] Failed to fetch status:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <StatusContext.Provider value={{ status, loading }}>
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus() {
  return useContext(StatusContext);
}
