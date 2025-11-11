import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import EmpruntFormModal from "./EmpruntFormModal";
import EmpruntUpdateModal from "./EmpruntUpdateForm";

import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Download,
  AlertTriangle,
  X,
  RefreshCw,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function EmpruntList() {
  const [emprunts, setEmprunts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedEmprunt, setSelectedEmprunt] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [showDateConfirmation, setShowDateConfirmation] = useState(null);
  const [showAlert, setShowAlert] = useState(true);
  const [empruntsEnRetard, setEmpruntsEnRetard] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fonction sécurisée pour obtenir le nom du matériel
  const getMaterielName = useCallback((materiel) => {
    if (!materiel) return "N/A";

    if (typeof materiel === "object" && materiel.name !== undefined) {
      return String(materiel.name);
    }

    if (typeof materiel === "object") {
      const possibleName =
        materiel.nom ||
        materiel.title ||
        materiel.libelle ||
        materiel.designation;
      return possibleName !== undefined ? String(possibleName) : "Matériel";
    }

    return String(materiel);
  }, []);

  // Fonction pour extraire seulement le nom de famille
  const getNomOnly = useCallback((nomComplet) => {
    if (!nomComplet) return "";
    const nomSansParentheses = nomComplet.replace(/\([^)]*\)/g, "").trim();
    const parties = nomSansParentheses.split(" ");
    const nom = parties[parties.length - 1] || nomComplet;
    return nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase();
  }, []);

  // Fonction pour formater la date
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "-";
    if (typeof dateString === "string" && dateString.includes("/")) {
      return dateString;
    }
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("fr-FR");
    } catch (error) {
      return "-";
    }
  }, []);

  // Fonction pour obtenir la date de rendu effective
  const getDateRendu = useCallback((emprunt) => {
    if (!emprunt.heureEntree) return "-";
    if (emprunt.dateRetourEffective)
      return formatDate(emprunt.dateRetourEffective);
    if (emprunt.updatedAt) return formatDate(emprunt.updatedAt);
    return "Date non enregistrée";
  }, []);

  // 🔥 CORRECTION : Fonction améliorée pour calculer les jours de retard
  const calculerJoursRetard = useCallback((dateRetour) => {
    if (!dateRetour) return 0;
    try {
      const aujourdhui = new Date();
      const dateRetourObj = new Date(dateRetour);
      if (isNaN(dateRetourObj.getTime())) return 0;

      // Remettre les deux dates à minuit pour une comparaison précise
      const aujourdhuiMidnight = new Date(
        aujourdhui.getFullYear(),
        aujourdhui.getMonth(),
        aujourdhui.getDate()
      );
      const dateRetourMidnight = new Date(
        dateRetourObj.getFullYear(),
        dateRetourObj.getMonth(),
        dateRetourObj.getDate()
      );

      const differenceTemps = aujourdhuiMidnight - dateRetourMidnight;
      const differenceJours = Math.floor(
        differenceTemps / (1000 * 60 * 60 * 24)
      );
      return Math.max(0, differenceJours);
    } catch (error) {
      return 0;
    }
  }, []);

  // Fonction pour obtenir la date et l'heure actuelles
  const getCurrentDateTime = useCallback(() => {
    const now = new Date();
    return {
      date: now.toLocaleDateString("fr-FR"),
      time: now.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      datetime: now.toISOString(),
    };
  }, []);

  // 🔥 CORRECTION : Fonction améliorée pour détecter tous les emprunts en retard
  const calculerEmpruntsEnRetardFallback = useCallback((empruntsList) => {
    const aujourdhui = new Date();
    const empruntsRetard = empruntsList.filter((emprunt) => {
      if (emprunt.heureEntree) return false; // Déjà rendu
      if (!emprunt.dateRetour) return false; // Pas de date de retour définie

      const joursRetard = calculerJoursRetard(emprunt.dateRetour);
      return joursRetard >= 10; // 10 jours ou plus de retard
    });

    console.log(`🔍 Fallback: ${empruntsRetard.length} emprunts en retard de plus de 10 jours`);
    
    // Trier par jours de retard décroissant
    empruntsRetard.sort((a, b) => {
      const retardA = calculerJoursRetard(a.dateRetour);
      const retardB = calculerJoursRetard(b.dateRetour);
      return retardB - retardA;
    });

    setEmpruntsEnRetard(empruntsRetard);
  }, [calculerJoursRetard]);

  // 🔥 CORRECTION : Fonction pour obtenir les informations d'un emprunt en retard
  const getInfosEmpruntRetard = useCallback((emprunt) => {
    return {
      _id: emprunt._id,
      matricule: emprunt.matricule,
      prenoms: emprunt.prenoms,
      materiel: getMaterielName(emprunt.materiel),
      dateRetourPrevue: emprunt.dateRetour,
      joursRetard: calculerJoursRetard(emprunt.dateRetour),
    };
  }, [getMaterielName, calculerJoursRetard]);

  const fetchEmprunts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("http://localhost:5000/api/emprunts");

      let empruntsData = [];

      if (res.data && Array.isArray(res.data)) {
        empruntsData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        empruntsData = res.data.data;
      } else if (res.data && Array.isArray(res.data.emprunts)) {
        empruntsData = res.data.emprunts;
      } else {
        console.warn("Structure de réponse inattendue:", res.data);
        empruntsData = [];
      }

      if (Array.isArray(empruntsData)) {
        const sortedEmprunts = empruntsData.sort((a, b) => {
          const dateA = new Date(a.dateEmprunt || a.createdAt);
          const dateB = new Date(b.dateEmprunt || b.createdAt);
          return dateB - dateA;
        });
        setEmprunts(sortedEmprunts);
      } else {
        setEmprunts([]);
        setError("Format de données invalide");
      }
    } catch (err) {
      console.error("Erreur chargement emprunts:", err);
      setError(
        "Impossible de charger les emprunts: " +
          (err.response?.data?.message || err.message)
      );
      setEmprunts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔥 CORRECTION : Fonction améliorée pour récupérer les alertes
  const fetchAlertesRetard = useCallback(async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/alertes/alertes-actives"
      );

      let alertesData = [];
      if (res.data && Array.isArray(res.data)) {
        alertesData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        alertesData = res.data.data;
      } else if (res.data && Array.isArray(res.data.alertes)) {
        alertesData = res.data.alertes;
      }

      console.log(`🔔 ${alertesData.length} alertes reçues du backend`);

      // Si le backend retourne des alertes, les utiliser
      if (alertesData.length > 0) {
        setEmpruntsEnRetard(alertesData);
      } else {
        // Sinon, calculer les retards localement
        console.log("🔄 Aucune alerte du backend, calcul local...");
        calculerEmpruntsEnRetardFallback(emprunts);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des alertes:", err);
      // Fallback en cas d'erreur
      console.log("🔄 Erreur backend, calcul local des retards...");
      if (emprunts.length > 0) {
        calculerEmpruntsEnRetardFallback(emprunts);
      }
    }
  }, [emprunts, calculerEmpruntsEnRetardFallback]);

  // 🔥 CORRECTION : Fonction de test améliorée
  const testerAlertes = useCallback(async () => {
    try {
      console.log("🧪 Test détaillé des alertes en cours...");

      // 1. Vérifier les emprunts en cours
      const empruntsNonRendus = emprunts.filter((e) => !e.heureEntree);
      console.log(`📊 Emprunts non rendus: ${empruntsNonRendus.length}`);

      // 2. Vérifier les emprunts avec date de retour
      const empruntsAvecDateRetour = empruntsNonRendus.filter(e => e.dateRetour);
      console.log(`📅 Emprunts avec date de retour: ${empruntsAvecDateRetour.length}`);

      // 3. Vérifier les emprunts en retard de plus de 10 jours
      const aujourdhui = new Date();
      const empruntsEnRetardTest = empruntsAvecDateRetour.filter((emprunt) => {
        const joursRetard = calculerJoursRetard(emprunt.dateRetour);
        return joursRetard >= 10;
      });

      console.log(`⚠️ Emprunts en retard (>10j): ${empruntsEnRetardTest.length}`);
      
      // Détails de chaque emprunt en retard
      empruntsEnRetardTest.forEach((emp) => {
        const joursRetard = calculerJoursRetard(emp.dateRetour);
        console.log(`   - ${emp.matricule}: ${joursRetard} jours de retard (date retour: ${formatDate(emp.dateRetour)})`);
      });

      // 4. Vérifier les alertes du backend
      const res = await axios.get(
        "http://localhost:5000/api/alertes/alertes-actives"
      );
      console.log(`🔔 Alertes actives du backend: ${res.data.count || res.data.data?.length || 0}`);

      alert(
        `🔍 TEST ALERTES TERMINÉ:\n\n` +
        `📊 Total emprunts non rendus: ${empruntsNonRendus.length}\n` +
        `📅 Avec date de retour: ${empruntsAvecDateRetour.length}\n` +
        `⚠️  En retard (>10j): ${empruntsEnRetardTest.length}\n` +
        `🔔 Alertes backend: ${res.data.count || res.data.data?.length || 0}\n\n` +
        `Vérifiez la console pour les détails.`
      );
    } catch (error) {
      console.error("❌ Erreur test alertes:", error);
      alert("Erreur lors du test des alertes");
    }
  }, [emprunts, calculerJoursRetard, formatDate]);

  useEffect(() => {
    fetchEmprunts();
  }, [fetchEmprunts]);

  useEffect(() => {
    if (emprunts.length > 0) {
      fetchAlertesRetard();
    }
  }, [emprunts, fetchAlertesRetard]);

  // Fonctions de gestion des actions
  const handleEmpruntAdded = useCallback(async (newEmprunt) => {
    try {
      const empruntData = newEmprunt.data || newEmprunt;
      setEmprunts((prev) => [empruntData, ...prev]);
      // Recharger les alertes après ajout
      setTimeout(() => fetchAlertesRetard(), 500);
      setShowModal(false);
    } catch (error) {
      console.error("Erreur handleEmpruntAdded:", error);
    }
  }, [fetchAlertesRetard]);

  const handleEmpruntUpdated = useCallback(async (updatedEmprunt) => {
    try {
      const empruntData = updatedEmprunt.data || updatedEmprunt;
      setEmprunts((prev) =>
        prev.map((e) => (e._id === empruntData._id ? empruntData : e))
      );
      // Recharger les alertes après modification
      setTimeout(() => fetchAlertesRetard(), 500);
      setShowUpdateModal(false);
      setSelectedEmprunt(null);
    } catch (error) {
      console.error("Erreur handleEmpruntUpdated:", error);
    }
  }, [fetchAlertesRetard]);

  const handleEditClick = useCallback((emprunt) => {
    setSelectedEmprunt(emprunt);
    setShowUpdateModal(true);
  }, []);

  const handleRenduClick = useCallback((empruntId) => {
    const currentDateTime = getCurrentDateTime();
    setShowDateConfirmation({
      id: empruntId,
      date: currentDateTime.date,
      time: currentDateTime.time,
      datetime: currentDateTime.datetime,
    });
  }, [getCurrentDateTime]);

  const confirmRendu = useCallback(async () => {
    if (!showDateConfirmation) return;

    try {
      const payload = {
        heureEntree: showDateConfirmation.time,
        dateRetourEffective: showDateConfirmation.datetime,
      };

      const res = await axios.put(
        `http://localhost:5000/api/emprunts/rendu/${showDateConfirmation.id}`,
        payload
      );

      const updatedEmprunt = res.data.data || res.data;

      setEmprunts((prev) =>
        prev.map((e) =>
          e._id === showDateConfirmation.id ? updatedEmprunt : e
        )
      );

      // Recharger les alertes après marquage comme rendu
      setTimeout(() => fetchAlertesRetard(), 500);
      setShowDateConfirmation(null);
    } catch (err) {
      console.error("Erreur marquage rendu:", err);
      alert(
        err.response?.data?.message || "Impossible de marquer le matériel rendu"
      );
      setShowDateConfirmation(null);
    }
  }, [showDateConfirmation, fetchAlertesRetard]);

  const cancelRendu = useCallback(() => {
    setShowDateConfirmation(null);
  }, []);

  const handleDeleteClick = useCallback(async (empruntId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet emprunt ?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/emprunts/${empruntId}`);
      setEmprunts((prev) => prev.filter((e) => e._id !== empruntId));
      // Recharger les alertes après suppression
      setTimeout(() => fetchAlertesRetard(), 500);
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert(err.response?.data?.message || "Impossible de supprimer l'emprunt");
    }
  }, [fetchAlertesRetard]);

  // 🔥 CORRECTION : Fonction améliorée pour vérifier manuellement les retards
  const verifierRetardsManuellement = useCallback(async () => {
    try {
      console.log("🔄 Vérification manuelle des retards...");
      await axios.get("http://localhost:5000/api/alertes/verifier-retards");
      await fetchAlertesRetard();
      alert("✅ Vérification des retards terminée");
    } catch (err) {
      console.error("Erreur vérification retards:", err);
      // Forcer le calcul local en cas d'erreur
      calculerEmpruntsEnRetardFallback(emprunts);
      alert("🔄 Retards vérifiés avec le calcul local");
    }
  }, [emprunts, fetchAlertesRetard, calculerEmpruntsEnRetardFallback]);

  // 🔥 CORRECTION : Fonction pour forcer la détection des retards
  const forcerDetectionRetards = useCallback(() => {
    console.log("🔍 Forçage de la détection des retards...");
    calculerEmpruntsEnRetardFallback(emprunts);
    alert(`🔍 Détection forcée terminée\n${empruntsEnRetard.length} emprunts en retard détectés`);
  }, [emprunts, calculerEmpruntsEnRetardFallback, empruntsEnRetard]);

  // Fonction pour rafraîchir les données
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchEmprunts();
      await fetchAlertesRetard();
    } catch (err) {
      console.error("Erreur lors du rafraîchissement:", err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchEmprunts, fetchAlertesRetard]);

  // 🔥 CORRECTION : Fonction améliorée pour vérifier si un emprunt est en retard
  const isEmpruntEnRetard = useCallback((emprunt) => {
    if (emprunt.heureEntree) return false;

    // Vérifier d'abord dans les alertes existantes
    const dansAlertes = empruntsEnRetard.some((alerte) => {
      if (alerte.emprunt && alerte.emprunt._id === emprunt._id) return true;
      if (alerte._id === emprunt._id) return true;
      return false;
    });

    if (dansAlertes) return true;

    // Vérifier par calcul direct si pas dans les alertes
    if (emprunt.dateRetour) {
      const joursRetard = calculerJoursRetard(emprunt.dateRetour);
      return joursRetard >= 10;
    }

    return false;
  }, [empruntsEnRetard, calculerJoursRetard]);

  // Filtrer les emprunts
  const filteredEmprunts = useMemo(() => {
    if (!emprunts || !Array.isArray(emprunts)) return [];

    return emprunts
      .filter((emprunt) => {
        const matchesSearch =
          (emprunt.matricule &&
            emprunt.matricule
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (emprunt.prenoms &&
            emprunt.prenoms.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (emprunt.materiel &&
            getMaterielName(emprunt.materiel)
              .toLowerCase()
              .includes(searchTerm.toLowerCase()));

        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "rendu" && emprunt.heureEntree) ||
          (filterStatus === "non-rendu" && !emprunt.heureEntree);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dateEmprunt || a.createdAt);
        const dateB = new Date(b.dateEmprunt || b.createdAt);
        return dateB - dateA;
      });
  }, [emprunts, searchTerm, filterStatus, getMaterielName]);

  // Fonction d'export PDF
  const exportToPDF = useCallback(() => {
    setExporting(true);

    try {
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text("LISTE DES EMPRUNTS", 105, 15, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Export du ${new Date().toLocaleDateString("fr-FR")}`, 105, 22, {
        align: "center",
      });

      const empruntsRendus = emprunts.filter((e) => e.heureEntree).length;
      const empruntsEnCours = emprunts.filter((e) => !e.heureEntree).length;
      const empruntsEnRetardCount = empruntsEnRetard.length;

      doc.setFontSize(9);
      doc.text(
        `Total: ${filteredEmprunts.length} emprunts | En cours: ${empruntsEnCours} | Rendus: ${empruntsRendus} | En retard: ${empruntsEnRetardCount}`,
        14,
        30
      );

      const tableData = filteredEmprunts.map((emprunt) => {
        const estEnRetard = isEmpruntEnRetard(emprunt);
        const dateRendu = getDateRendu(emprunt);

        return [
          emprunt.matricule || "N/A",
          getNomOnly(emprunt.prenoms),
          formatDate(emprunt.dateEmprunt),
          dateRendu,
          getMaterielName(emprunt.materiel),
          emprunt.heureSortie || "-",
          emprunt.heureEntree || "-",
          emprunt.heureEntree
            ? "Rendu"
            : estEnRetard
            ? "En retard"
            : "En cours",
        ];
      });

      doc.autoTable({
        head: [
          [
            "Matricule",
            "Nom",
            "Date Emp.",
            "Date Rendu",
            "Matériel",
            "H. Sortie",
            "H. Entrée",
            "Statut",
          ],
        ],
        body: tableData,
        startY: 35,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 18 },
          6: { cellWidth: 18 },
          7: { cellWidth: 18 },
        },
      });

      doc.save(`emprunts_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setExporting(false);
    }
  }, [
    emprunts,
    empruntsEnRetard,
    filteredEmprunts,
    isEmpruntEnRetard,
    getDateRendu,
    getNomOnly,
    getMaterielName,
    formatDate,
  ]);

  // Rendu des lignes du tableau optimisé
  const renderTableRows = useMemo(() => {
    if (!filteredEmprunts || filteredEmprunts.length === 0) return null;

    return filteredEmprunts.map((e) => {
      const estEnRetard = isEmpruntEnRetard(e);
      const dateRendu = getDateRendu(e);
      const nomAffiche = getNomOnly(e.prenoms);
      const materielAffiche = getMaterielName(e.materiel);

      return (
        <tr
          key={e._id}
          className={`hover:bg-gray-50 ${
            estEnRetard ? "bg-red-50 border-l-4 border-l-red-500" : ""
          }`}
        >
          <td className="px-2 py-2 whitespace-nowrap font-medium text-gray-900">
            {e.matricule}
            {estEnRetard && (
              <AlertTriangle
                size={12}
                className="inline ml-1 text-red-500"
                title="En retard"
              />
            )}
          </td>

          <td className="px-2 py-2 whitespace-nowrap">{nomAffiche}</td>

          <td className="px-2 py-2 whitespace-nowrap">
            {formatDate(e.dateEmprunt)}
          </td>

          <td className="px-2 py-2 whitespace-nowrap">
            {dateRendu !== "-" ? (
              <span className="text-green-600 font-medium">{dateRendu}</span>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </td>

          <td
            className="px-2 py-2 whitespace-nowrap max-w-[120px] truncate"
            title={materielAffiche}
          >
            {materielAffiche}
          </td>

          <td className="px-2 py-2 whitespace-nowrap">
            {e.heureSortie || "-"}
          </td>

          <td className="px-2 py-2 whitespace-nowrap">
            {e.heureEntree || "-"}
          </td>

          <td className="px-2 py-2 whitespace-nowrap">
            {e.heureEntree ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle size={12} className="mr-0.5" />
                Rendu
              </span>
            ) : (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  estEnRetard
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                <Clock size={12} className="mr-0.5" />
                {estEnRetard ? "En retard" : "En cours"}
              </span>
            )}
          </td>

          <td className="px-2 py-2 whitespace-nowrap text-right space-x-1">
            {!e.heureEntree && (
              <button
                onClick={() => handleRenduClick(e._id)}
                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 inline-flex items-center"
                title="Marquer comme rendu"
              >
                <CheckCircle size={14} />
              </button>
            )}
            <button
              onClick={() => handleEditClick(e)}
              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 inline-flex items-center"
              title="Modifier"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => handleDeleteClick(e._id)}
              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 inline-flex items-center"
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </td>
        </tr>
      );
    });
  }, [
    filteredEmprunts,
    isEmpruntEnRetard,
    getDateRendu,
    getNomOnly,
    getMaterielName,
    formatDate,
    handleRenduClick,
    handleEditClick,
    handleDeleteClick,
  ]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      {/* Modal de confirmation de rendu */}
      {showDateConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmer le retour
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="text-sm text-blue-800">
                <p className="font-medium">Date et heure de retour :</p>
                <p className="text-lg font-bold mt-1">
                  {showDateConfirmation.date} à {showDateConfirmation.time}
                </p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir marquer cet emprunt comme rendu avec la
              date et l'heure actuelles ?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelRendu}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200"
              >
                Annuler
              </button>
              <button
                onClick={confirmRendu}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 flex items-center"
              >
                <CheckCircle size={18} className="mr-2" />
                Confirmer le retour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 CORRECTION : Alerte améliorée pour tous les emprunts en retard */}
      {showAlert && empruntsEnRetard.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 relative">
          <button
            onClick={() => setShowAlert(false)}
            className="absolute top-3 right-3 text-red-400 hover:text-red-600"
          >
            <X size={18} />
          </button>
          <div className="flex items-start">
            <AlertTriangle
              className="text-red-500 mt-0.5 mr-3 flex-shrink-0"
              size={20}
            />
            <div className="flex-1">
              <h3 className="text-red-800 font-semibold text-lg mb-2">
                ⚠️ Alerte: Emprunts en retard
              </h3>
              <p className="text-red-700 mb-3">
                {empruntsEnRetard.length} emprunt(s) non rendu(s) depuis 10 jours ou plus :
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {empruntsEnRetard.map((emprunt, index) => {
                  const infos = getInfosEmpruntRetard(emprunt);
                  if (!infos) return null;
                  return (
                    <div
                      key={infos._id || index}
                      className="bg-red-100 border border-red-200 rounded px-3 py-2"
                    >
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-red-800">
                          {infos.matricule} - {getNomOnly(infos.prenoms)}
                        </span>
                        <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-bold">
                          {infos.joursRetard} jour(s) de retard
                        </span>
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        Matériel: {infos.materiel} • Date de retour prévue:{" "}
                        {formatDate(infos.dateRetourPrevue)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center mt-3">
                <p className="text-red-600 text-sm">
                  <strong>Action requise:</strong> Veuillez contacter les
                  personnes concernées pour le retour du matériel.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={forcerDetectionRetards}
                    className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition duration-200"
                  >
                    🔍 Forcer détection
                  </button>
                  <button
                    onClick={verifierRetardsManuellement}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition duration-200"
                  >
                    Vérifier à nouveau
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Gestion des Emprunts
          </h2>
          <p className="text-gray-500 mt-1">
            Suivez et gérez tous les emprunts de matériel
            {empruntsEnRetard.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                {empruntsEnRetard.length} en retard
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={testerAlertes}
            className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors shadow-sm"
          >
            🧪 Tester Alertes
          </button>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Rafraîchissement..." : "Rafraîchir"}
          </button>
          <button
            onClick={exportToPDF}
            disabled={exporting || filteredEmprunts.length === 0}
            className="px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Génération...
              </>
            ) : (
              <>
                <Download size={18} />
                Export PDF
              </>
            )}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Nouvel Emprunt
          </button>
        </div>
      </div>

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
              <option value="all">Tous les statuts</option>
              <option value="non-rendu">Non rendus</option>
              <option value="rendu">Rendus</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Chargement des emprunts...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="mr-2" size={20} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchEmprunts}
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition duration-200"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Matricule
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Nom
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Date Emp.
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Date Rendu
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Matériel
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    H. Sortie
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    H. Entrée
                  </th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Statut
                  </th>
                  <th className="px-2 py-2 text-right font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {renderTableRows}
              </tbody>
            </table>
          </div>
          {(!filteredEmprunts || filteredEmprunts.length === 0) && !loading && (
            <div className="text-center py-8 text-gray-500 text-sm">
              {emprunts.length === 0
                ? "Aucun emprunt trouvé"
                : "Aucun emprunt ne correspond aux critères de recherche"}
            </div>
          )}
        </div>
      )}

      <EmpruntFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onEmpruntAdded={handleEmpruntAdded}
      />
      <EmpruntUpdateModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedEmprunt(null);
        }}
        emprunt={selectedEmprunt}
        onEmpruntUpdated={handleEmpruntUpdated}
      />
    </div>
  );
}