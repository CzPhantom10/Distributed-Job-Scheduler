import React from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AppLayout from './layouts/AppLayout'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import ProjectsPage from './pages/ProjectsPage'
import QueuesPage from './pages/QueuesPage'
import QueueDetailPage from './pages/QueueDetailPage'
import JobDetailPage from './pages/JobDetailPage'
import WorkersPage from './pages/WorkersPage'
import MetricsPage from './pages/MetricsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Protected Route Guard
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null // let app context restore token first
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <OverviewPage /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/projects/:projectId/queues', element: <QueuesPage /> },
          { path: '/queues/:queueId', element: <QueueDetailPage /> },
          { path: '/jobs/:jobId', element: <JobDetailPage /> },
          { path: '/workers', element: <WorkersPage /> },
          { path: '/metrics', element: <MetricsPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
