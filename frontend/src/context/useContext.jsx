import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api"; // Axios configuré avec baseURL
import {jwtDecode} from "jwt-decode";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // pour charger la session

  // Vérifier si token existe et est valide au montage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Décoder token pour vérifier expiration (optionnel)
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          // token expiré
          localStorage.removeItem("token");
          setUser(null);
          setLoading(false);
          return;
        }

        // Vérifier token côté backend et récupérer user
        api
          .get("/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            setUser(res.data.user);
            setLoading(false);
          })
          .catch(() => {
            localStorage.removeItem("token");
            setUser(null);
            setLoading(false);
          });
      } catch {
        localStorage.removeItem("token");
        setUser(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Fonction login
  async function login(email, password) {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  }

  // Fonction logout
  function logout() {
    setUser(null);
    localStorage.removeItem("token");
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook pour utiliser le contexte
export function useAuth() {
  return useContext(AuthContext);
}
