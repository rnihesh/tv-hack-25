import { useState } from 'react'
import './App.css'
import ThemeToggle from './utils/ThemeToggle'
import MailingDashboard from './mailer/MailingDashboard'

function App() {
  const [currentView, setCurrentView] = useState('home')

  const renderView = () => {
    switch (currentView) {
      case 'mailing':
        return <MailingDashboard />
      default:
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Digital Toolkit</h1>
              <p className="text-gray-600 mb-8">Your complete AI-powered business solution</p>
              
              <div className="space-y-4">
                <button
                  onClick={() => setCurrentView('mailing')}
                  className="block w-full max-w-md mx-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  📧 Email Marketing
                </button>
                
                <button
                  disabled
                  className="block w-full max-w-md mx-auto bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
                >
                  🌐 Website Generator (Coming Soon)
                </button>
                
                <button
                  disabled
                  className="block w-full max-w-md mx-auto bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
                >
                  🤖 AI Chatbot (Coming Soon)
                </button>
              </div>
              
              <ThemeToggle />
            </div>
          </div>
        )
    }
  }

  return renderView()
}

export default App
