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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,  // 1 minute default stale time
      retry: 1,
    },
  },
})

// Placeholder routes — replaced in Phase 2 (dashboard) and Phase 3 (builder)
const router = createBrowserRouter([
  {
    path: '/',
    element: <div style={{ padding: '2rem' }}>NL Layouter — Home (Phase 2 replaces this)</div>,
  },
  {
    path: '/newsletters',
    element: <div style={{ padding: '2rem' }}>Newsletter List (Phase 2 replaces this)</div>,
  },
  {
    path: '/newsletters/:id',
    element: <div style={{ padding: '2rem' }}>Builder (Phase 3 replaces this)</div>,
  },
])

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found in index.html')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)

