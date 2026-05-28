import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import FAQsPage from './pages/FAQsPage';
import CommunityPage from './pages/CommunityPage';
import RaiseQueryPage from './pages/RaiseQueryPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import WikiPage from './pages/WikiPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<FAQsPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="ask" element={<RaiseQueryPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="wiki" element={<WikiPage />} />
          </Route>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;