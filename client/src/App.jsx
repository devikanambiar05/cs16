import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import FAQsPage from './pages/FAQsPage';
import CommunityPage from './pages/CommunityPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import LeaderboardPage from './pages/LeaderboardPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProtectedRoute from './components/ProtectedRoute';
import RaiseQueryPage from './pages/RaiseQueryPage';
import RAGChatWidget from './components/RAGChatWidget';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<FAQsPage />} />
              <Route path="community" element={<CommunityPage />} />
              <Route path="ask" element={
                <ProtectedRoute>
                  <RaiseQueryPage />
                </ProtectedRoute>
              } />
              <Route path="login" element={<LoginPage />} />
              <Route path="admin" element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="leaderboard" element={
                <ProtectedRoute>
                  <LeaderboardPage />
                </ProtectedRoute>
              } />
            </Route>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Routes>
          <RAGChatWidget />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;