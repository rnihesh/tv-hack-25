import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthWrapper from './components/auth/AuthWrapper'
import Dashboard from './components/Dashboard'
import WebsiteGenerator from './website-generator/WebsiteGenerator'
// import ChatInterface from './chatbot/ChatInterface'
// import MailingDashboard from './mailer/MailingDashboard'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/auth" replace />;
}

// Public Route Component (redirect to dashboard if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function AppContent() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/auth" 
        element={
          <PublicRoute>
            <AuthWrapper />
          </PublicRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/website-generator" 
        element={
          <ProtectedRoute>
            <WebsiteGenerator />
          </ProtectedRoute>
        } 
      />
      
      {/* <Route 
        path="/chatbot" 
        element={
          <ProtectedRoute>
            <ChatInterface />
          </ProtectedRoute>
        } 
      /> */}

      {/* <Route 
        path="/mailer" 
        element={
          <ProtectedRoute>
            <MailingDashboard />
          </ProtectedRoute>
        } 
      /> */}

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
