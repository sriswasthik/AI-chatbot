import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "./components/ProtectedRoute";


export default function App() {
  return (
    <Routes>

      {/* Authentication Routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />
      </Route>

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Chat />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<NotFound />}
      />

    </Routes>
  );
}