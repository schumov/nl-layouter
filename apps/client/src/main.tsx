// apps/client/src/main.tsx
//
// React app entry point — QueryClientProvider wraps the entire tree,
// RouterProvider handles all navigation.
//
// react-router v7 LIBRARY MODE: createBrowserRouter + RouterProvider
// Do NOT use <BrowserRouter> (v5 API) or framework mode (@react-router/dev/vite).
// See: 01-RESEARCH.md Pattern 12 — library mode is correct for this ~5-route SPA.

import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import DashboardPage from './pages/DashboardPage';
import BuilderPage from './pages/BuilderPage';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,  // 1 minute default stale time
      retry: 1,
    },
  },
})

// Routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardPage />,
  },
  {
    path: '/newsletters',
    element: <DashboardPage />,
  },
  {
    path: '/newsletters/:id',
    element: <BuilderPage />,
  },
])

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found in index.html')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  </React.StrictMode>
)

