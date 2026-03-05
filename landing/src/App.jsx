import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import LoginPage from './pages/LoginPage';
import Home from './pages/Home';

function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <Navigate to="/login" />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
