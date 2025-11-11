import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Trash2,
  X,
  Mail,
  Phone,
  User,
  Calendar,
  Package
} from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString('fr-FR');
  };

  // Fonction pour formater la date et l'heure
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour extraire le nom de famille
  const getNomOnly = (nomComplet) => {
    if (!nomComplet) return "";
    
    let nomSansParentheses = nomComplet.replace(/\([^)]*\)/g, '').trim();
    const parties = nomSansParentheses.split(' ');
    const nom = parties[parties.length - 1] || nomComplet;
    
    return nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase();
  };

  // Fonction pour calculer les jours de retard
  const calculerJoursRetard = (dateRetour) => {
    if (!dateRetour) return 0;
    
    const aujourdhui = new Date();
    const dateRetourObj = new Date(dateRetour);
    if (isNaN(dateRetourObj.getTime())) return 0;
    
    const aujourdhuiMidnight = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate());
    const dateRetourMidnight = new Date(dateRetourObj.getFullYear(), dateRetourObj.getMonth(), dateRetourObj.getDate());
    
    const differenceTemps = aujourdhuiMidnight - dateRetourMidnight;
    const differenceJours = Math.floor(differenceTemps / (1000 * 60 * 60 * 24));
    
    return Math.max(0, differenceJours);
  };

  // Charger les notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/alertes/alertes-actives");
      
      let notificationsData = [];
      if (res.data && Array.isArray(res.data)) {
        notificationsData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        notificationsData = res.data.data;
      }

      // Trier par date de création décroissante
      const sortedNotifications = notificationsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.dateCreation);
        const dateB = new Date(b.createdAt || b.dateCreation);
        return dateB - dateA;
      });

      setNotifications(sortedNotifications);
    } catch (err) {
      console.error("Erreur lors du chargement des notifications:", err);
      setError("Impossible de charger les notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Rafraîchir les notifications
  const refreshNotifications = async () => {
    setRefreshing(true);
    try {
      await fetchNotifications();
    } catch (err) {
      console.error("Erreur lors du rafraîchissement:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Marquer une notification comme résolue
  const markAsResolved = async (notificationId) => {
    try {
      await axios.put(`http://localhost:5000/api/alertes/resoudre/${notificationId}`);
      // Mettre à jour l'état local
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
    } catch (err) {
      console.error("Erreur lors de la résolution:", err);
      alert("Impossible de marquer comme résolu");
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette notification ?")) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/alertes/${notificationId}`);
      // Mettre à jour l'état local
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Impossible de supprimer la notification");
    }
  };

  // Vérifier manuellement les retards
  const verifierRetardsManuellement = async () => {
    try {
      await axios.get("http://localhost:5000/api/alertes/verifier-retards");
      await fetchNotifications();
      alert("Vérification des retards terminée");
    } catch (err) {
      console.error("Erreur lors de la vérification:", err);
      alert("Erreur lors de la vérification des retards");
    }
  };

  // Obtenir les informations détaillées d'une notification
  const getNotificationDetails = (notification) => {
    if (notification.emprunt) {
      const emp = notification.emprunt;
      return {
        type: "retard",
        titre: "Emprunt en retard",
        matricule: emp.matricule,
        prenoms: emp.prenoms,
        materiel: emp.materiel && emp.materiel.name ? emp.materiel.name : "N/A",
        dateEmprunt: emp.dateEmprunt || emp.date,
        dateRetourPrevue: emp.dateRetour,
        joursRetard: notification.joursRetard || calculerJoursRetard(emp.dateRetour),
        statut: "En retard",
        gravite: "haute"
      };
    } else {
      return {
        type: "retard",
        titre: "Emprunt en retard",
        matricule: notification.matricule,
        prenoms: notification.prenoms,
        materiel: notification.materiel || "N/A",
        dateEmprunt: notification.dateEmprunt,
        dateRetourPrevue: notification.dateRetourPrevue || notification.dateRetour,
        joursRetard: notification.joursRetard || calculerJoursRetard(notification.dateRetourPrevue || notification.dateRetour),
        statut: "En retard",
        gravite: "haute"
      };
    }
  };

  // Filtrer les notifications
  const filteredNotifications = notifications
    .filter(notification => {
      const details = getNotificationDetails(notification);
      const matchesSearch = 
        details.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        details.prenoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
        details.materiel.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        filterStatus === "all" ||
        (filterStatus === "non-resolu" && !notification.resolue) ||
        (filterStatus === "resolu" && notification.resolue);

      return matchesSearch && matchesStatus;
    });

  // Ouvrir le modal de détails
  const openDetailModal = (notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
  };

  // Obtenir la classe CSS selon la gravité
  const getGraviteClass = (gravite) => {
    switch (gravite) {
      case "haute":
        return "bg-red-100 border-red-300 text-red-800";
      case "moyenne":
        return "bg-orange-100 border-orange-300 text-orange-800";
      case "basse":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  // Obtenir l'icône selon le type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "retard":
        return <AlertTriangle size={20} className="text-red-500" />;
      default:
        return <Bell size={20} className="text-blue-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      {/* Modal de détails */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Détails de la notification</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {(() => {
              const details = getNotificationDetails(selectedNotification);
              return (
                <div className="space-y-4">
                  {/* En-tête */}
                  <div className={`p-4 rounded-lg border-2 ${getGraviteClass(details.gravite)}`}>
                    <div className="flex items-center gap-3">
                      {getNotificationIcon(details.type)}
                      <div>
                        <h4 className="font-bold text-lg">{details.titre}</h4>
                        <p className="text-sm opacity-80">
                          {details.joursRetard} jour(s) de retard
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Informations de l'emprunteur */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <User size={16} />
                        Informations de l'emprunteur
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Matricule:</span>
                          <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {details.matricule}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Nom:</span>
                          <span className="ml-2">{getNomOnly(details.prenoms)}</span>
                        </div>
                        <div>
                          <span className="font-medium">Nom complet:</span>
                          <span className="ml-2">{details.prenoms}</span>
                        </div>
                      </div>
                    </div>

                    {/* Informations du matériel */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Package size={16} />
                        Informations du matériel
                      </h5>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Matériel:</span>
                          <span className="ml-2">{details.materiel}</span>
                        </div>
                        <div>
                          <span className="font-medium">Statut:</span>
                          <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                            {details.statut}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dates importantes */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Calendar size={16} />
                      Dates importantes
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Date d'emprunt:</span>
                        <div className="mt-1 bg-white p-2 rounded border">
                          {formatDate(details.dateEmprunt)}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Date de retour prévue:</span>
                        <div className="mt-1 bg-white p-2 rounded border text-red-600 font-medium">
                          {formatDate(details.dateRetourPrevue)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Fermer
                    </button>
                    <button
                      onClick={() => {
                        markAsResolved(selectedNotification._id);
                        setShowDetailModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Marquer comme résolu
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Bell className="text-blue-600" size={28} />
            Centre de Notifications
          </h2>
          <p className="text-gray-500 mt-1">
            Gérez et suivez toutes les alertes et notifications du système
            {notifications.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                {notifications.filter(n => !n.resolue).length} non résolues
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={verifierRetardsManuellement}
            className="px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 transition-colors shadow-sm"
          >
            <RefreshCw size={18} />
            Vérifier les retards
          </button>
          <button
            onClick={refreshNotifications}
            disabled={refreshing}
            className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Rafraîchissement..." : "Rafraîchir"}
          </button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher par matricule, nom ou matériel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex items-center bg-gray-100 px-3 rounded-lg border border-gray-300">
            <Filter size={18} className="text-gray-500 mr-2" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent py-2.5 focus:outline-none focus:ring-0"
            >
              <option value="all">Toutes les notifications</option>
              <option value="non-resolu">Non résolues</option>
              <option value="resolu">Résolues</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucune notification</h3>
          <p className="text-gray-500">
            {notifications.length === 0 
              ? "Aucune alerte ou notification pour le moment" 
              : "Aucune notification ne correspond à vos critères de recherche"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => {
            const details = getNotificationDetails(notification);
            const joursRetard = details.joursRetard;

            return (
              <div
                key={notification._id}
                className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                  notification.resolue 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-2 rounded-full ${
                      notification.resolue ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {getNotificationIcon(details.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className={`font-semibold ${
                          notification.resolue ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {details.titre}
                        </h4>
                        {!notification.resolue && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                            {joursRetard} jour(s) de retard
                          </span>
                        )}
                        {notification.resolue && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                            Résolu
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Emprunteur:</span>
                          <span className="ml-2">
                            {details.matricule} - {getNomOnly(details.prenoms)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Matériel:</span>
                          <span className="ml-2">{details.materiel}</span>
                        </div>
                        <div>
                          <span className="font-medium">Date retour:</span>
                          <span className="ml-2">{formatDate(details.dateRetourPrevue)}</span>
                        </div>
                      </div>

                      {notification.createdAt && (
                        <div className="text-xs text-gray-500 mt-2">
                          Créée le {formatDateTime(notification.createdAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openDetailModal(notification)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                      title="Voir les détails"
                    >
                      <Search size={16} />
                    </button>
                    
                    {!notification.resolue && (
                      <button
                        onClick={() => markAsResolved(notification._id)}
                        className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50"
                        title="Marquer comme résolu"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Statistiques */}
      {notifications.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-800">{notifications.length}</div>
            <div className="text-blue-600 text-sm">Total notifications</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-800">
              {notifications.filter(n => !n.resolue).length}
            </div>
            <div className="text-red-600 text-sm">Non résolues</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-800">
              {notifications.filter(n => n.resolue).length}
            </div>
            <div className="text-green-600 text-sm">Résolues</div>
          </div>
        </div>
      )}
    </div>
  );
}