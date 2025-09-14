import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./components/Login";
import EmploiDuTemps from "./components/Edt";
import Dashboard from "./components/Dashboard";
import Layout from "./components/Layout";
import ListeEdt from "./components/ListeEdt"; // ✅ Import du ListeEdt
import StockList from "./components/StockList"; // ✅ Import du StockList
import AddStockForm from "./components/AddStockForm"; // ✅ Import du AddStockForm
import UpdateStockForm from "./components/UpdateStockForm";
import { useAuth, AuthProvider } from "./context/useContext"; // Vérifie que ce chemin est correct

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Page Login */}
          <Route path="/login" element={<Login />} />
          {/* Tableau de bord */}
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
          {/* StockList */}
          <Route
            path="/stocklist"
            element={
              <PrivateRoute>
                <Layout>
                  <StockList />
                </Layout>
              </PrivateRoute>
            }
          />{" "}
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
          /> <Route
            path="/edt"
            element={
              <PrivateRoute>
                <Layout>
                  <ListeEdt />
                </Layout>
              </PrivateRoute>
            }
          /><Route
            path="/editstock/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <UpdateStockForm />
                </Layout>
              </PrivateRoute>
            }
          />
          {/* Route par défaut -> redirige vers dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
