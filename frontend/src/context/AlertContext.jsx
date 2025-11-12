import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AlerteContext = createContext();

export const useAlertes = () => {
  const context = useContext(AlerteContext);
  if (!context) {
    throw new Error('useAlertes must be used within an AlerteProvider');
  }
  return context;
};

export const AlerteProvider = ({ children }) => {
  const [empruntsEnRetard, setEmpruntsEnRetard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fonction pour récupérer les alertes
  const fetchAlertesRetard = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/alertes/alertes-actives");
      setEmpruntsEnRetard(res.data.data || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Erreur lors du chargement des alertes:", err);
      // Fallback si le backend n'est pas disponible
      setEmpruntsEnRetard([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour vérifier manuellement les retards
  const verifierRetardsManuellement = async () => {
    try {
      setLoading(true);
      await axios.get("http://localhost:5000/api/alertes/verifier-retards");
      await fetchAlertesRetard();
      return { success: true, message: "Vérification des retards terminée" };
    } catch (err) {
      console.error("Erreur lors de la vérification des retards:", err);
      return { success: false, message: "Erreur lors de la vérification des retards" };
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour marquer un emprunt comme rendu
  const marquerCommeRendu = async (empruntId) => {
    try {
      const currentDateTime = new Date().toISOString();
      await axios.put(
        `http://localhost:5000/api/emprunts/rendu/${empruntId}`,
        { 
          heureEntree: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          dateRetourEffective: currentDateTime
        }
      );
      // Recharger les alertes après modification
      await fetchAlertesRetard();
      return { success: true, message: "Emprunt marqué comme rendu" };
    } catch (err) {
      console.error("Erreur:", err);
      return { 
        success: false, 
        message: err.response?.data?.message || "Impossible de marquer le matériel rendu" 
      };
    }
  };

  // Charger les alertes au démarrage
  useEffect(() => {
    fetchAlertesRetard();
    
    // Rafraîchir les alertes toutes les 5 minutes
    const interval = setInterval(fetchAlertesRetard, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const value = {
    empruntsEnRetard,
    loading,
    lastUpdate,
    fetchAlertesRetard,
    verifierRetardsManuellement,
    marquerCommeRendu,
    totalAlertes: empruntsEnRetard.length
  };

  return (
    <AlerteContext.Provider value={value}>
      {children}
    </AlerteContext.Provider>
  );
};