import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useContext";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>; // Ou un spinner personnalisé
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
