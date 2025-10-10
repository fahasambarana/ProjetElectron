import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import EmploiDuTemps from "./components/Edt";
import Dashboard from "./components/Dashboard";
import Layout from "./components/Layout";
import ListeEdt from "./components/ListeEdt";
import StockList from "./components/StockList";
import AddStockForm from "./components/AddStockForm";
import UpdateStockForm from "./components/UpdateStockForm";
import { useAuth, AuthProvider } from "./context/useContext";
import ListeEmprunts from "./components/ListeEmprunt";
import PrivateRoute from "./components/PrivateRoutes";

// Composant PrivateRoute vérifie l'authentification


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          {/* Routes privées protégées */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/stocklist"
            element={
              <PrivateRoute>
                <Layout>
                  <StockList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/addstock"
            element={
              <PrivateRoute>
                <Layout>
                  <AddStockForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/calendrier"
            element={
              <PrivateRoute>
                <Layout>
                  <EmploiDuTemps />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/edt"
            element={
              <PrivateRoute>
                <Layout>
                  <ListeEdt />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/emprunt"
            element={
              <PrivateRoute>
                <Layout>
                  <ListeEmprunts />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/editstock/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <UpdateStockForm />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Route par défaut */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
