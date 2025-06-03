import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import EmployeeManager from './pages/EmployeeManager';
import EmployeeView from './pages/EmployeeView';
import { clearSession, getTokenOrNull } from "./util/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getTokenOrNull();

  if (!token) {
    clearSession();
    // replace to prevent going back to protected page after logout
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <EmployeeManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/:id"
        element={
          <ProtectedRoute>
            <EmployeeView />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
