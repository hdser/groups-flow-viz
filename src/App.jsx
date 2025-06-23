import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import Dashboard from './components/Dashboard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Never consider data stale
      gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
      retry: 3,
      refetchOnWindowFocus: false, // Disable refetch on window focus
      refetchOnReconnect: false, // Disable refetch on reconnect
      refetchInterval: false, // Disable interval refetching
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1F2937',
            color: '#F3F4F6',
          },
        }}
      />
    </QueryClientProvider>
  )
}

export default App