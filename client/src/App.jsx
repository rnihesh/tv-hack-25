import './App.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthWrapper from './components/auth/AuthWrapper'
import Dashboard from './components/Dashboard'
import WebsiteViewer from './website-generator/WebsiteGenerator'


function AppContent() {
  // const { isAuthenticated, loading } = useAuth();

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
  //         <p className="mt-4 text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // return isAuthenticated ? <Dashboard /> : <AuthWrapper />;
  <WebsiteViewer/>
}

function App() {
  return (
    <AuthProvider>
      {/* <AppContent />
       */}
        <WebsiteViewer/>
    </AuthProvider>
  )
}

export default App