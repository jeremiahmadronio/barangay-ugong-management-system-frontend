import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { WebsiteSettingsProvider } from '@/context/WebsiteSettingsContext'
import { AppRoutes } from '@/routes/AppRoutes'

function App() {
  return (
    <AuthProvider>
      <WebsiteSettingsProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </WebsiteSettingsProvider>
    </AuthProvider>
  )
}

export default App
