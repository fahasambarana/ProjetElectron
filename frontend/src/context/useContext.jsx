import React, { createContext, useContext, useState, useEffect } from 'react';

// Création du contexte
const AuthContext = createContext(null);

// Provider pour englober l’app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Charger l'utilisateur au démarrage si token stocké
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Exemple simple : décoder token ou appeler API pour récupérer user
      setUser({ token, name: 'Utilisateur' }); // Données simulées
    }
  }, []);

  // Fonction pour "se connecter"
  const login = (email, password) => {
    // Simuler appel API login + récupération token
    const fakeToken = '123456fakeToken';
    localStorage.setItem('authToken', fakeToken);
    setUser({ token: fakeToken, name: email });
    return true; // Indiquer succès
  };

  // Fonction pour "se déconnecter"
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser auth
export const useAuth = () => useContext(AuthContext);
