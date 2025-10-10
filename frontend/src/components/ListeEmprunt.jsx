import React, { useState, useEffect } from "react";
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
  Users,
  BarChart3,
  Package,
  RotateCw,
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

  const fetchEmprunts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/emprunts");

      const empruntsData = res.data.data || res.data;

      if (Array.isArray(empruntsData)) {
        const sortedEmprunts = empruntsData.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setEmprunts(sortedEmprunts);
      } else {
        setEmprunts([]);
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError("Impossible de charger les emprunts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmprunts();
  }, []);

  // Fonctions de gestion des actions
  const handleEmpruntAdded = (newEmprunt) => {
    const empruntData = newEmprunt.data || newEmprunt;
    setEmprunts(prev => [empruntData, ...prev]);
    setShowModal(false);
  };

  const handleEmpruntUpdated = (updatedEmprunt) => {
    const empruntData = updatedEmprunt.data || updatedEmprunt;
    setEmprunts(prev => prev.map(e => e._id === empruntData._id ? empruntData : e));
    setShowUpdateModal(false);
    setSelectedEmprunt(null);
  };

  const handleEditClick = (emprunt) => {
    setSelectedEmprunt(emprunt);
    setShowUpdateModal(true);
  };

  const handleRenduClick = async (empruntId) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/emprunts/rendu/${empruntId}`,
        { heureEntree: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
      );
      
      const updatedEmprunt = res.data.data || res.data;
      setEmprunts(prev => prev.map(e => e._id === empruntId ? updatedEmprunt : e));
      
    } catch (err) {
      console.error("Erreur:", err);
      alert(err.response?.data?.message || "Impossible de marquer le matériel rendu");
    }
  };

  const handleDeleteClick = async (empruntId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet emprunt ?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/emprunts/${empruntId}`);
      setEmprunts(prev => prev.filter(e => e._id !== empruntId));
    } catch (err) {
      console.error("Erreur:", err);
      alert(err.response?.data?.message || "Impossible de supprimer l'emprunt");
    }
  };

  // Fonction d'export PDF
  const exportToPDF = () => {
    setExporting(true);
    setTimeout(() => setExporting(false), 1500);
  };

  const filteredEmprunts = emprunts
    .filter((emprunt) => {
      const matchesSearch =
        emprunt.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emprunt.prenoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emprunt.materiel &&
          emprunt.materiel.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "rendu" && emprunt.heureEntree) ||
        (filterStatus === "non-rendu" && !emprunt.heureEntree);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Statistiques
  const stats = {
    total: filteredEmprunts.length,
    enCours: filteredEmprunts.filter(e => !e.heureEntree).length,
    rendus: filteredEmprunts.filter(e => e.heureEntree).length,
    aujourdhui: filteredEmprunts.filter(e => 
      new Date(e.date).toDateString() === new Date().toDateString()
    ).length
  };

  return (
    <div className="min-h-screen bg-gray-50/30 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Gestion des Emprunts
              </h1>
              <p className="text-gray-600 mt-1 lg:mt-2 text-sm lg:text-base">
                Suivez et gérez tous les emprunts de matériel en temps réel
              </p>
            </div>
            
            {/* Actions Desktop */}
            <div className="hidden lg:flex gap-3">
              <button
                onClick={exportToPDF}
                disabled={exporting || filteredEmprunts.length === 0}
                className="px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export PDF
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Nouvel Emprunt
              </button>
            </div>

            {/* Actions Mobile */}
            <div className="flex lg:hidden gap-2 w-full">
              <button
                onClick={exportToPDF}
                disabled={exporting || filteredEmprunts.length === 0}
                className="flex-1 px-3 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {exporting ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm lg:text-base text-gray-600">Total Emprunts</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm lg:text-base text-gray-600">En Cours</p>
                <p className="text-2xl lg:text-3xl font-bold text-amber-600 mt-1">{stats.enCours}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="h-5 w-5 lg:h-6 lg:w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm lg:text-base text-gray-600">Rendus</p>
                <p className="text-2xl lg:text-3xl font-bold text-green-600 mt-1">{stats.rendus}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm lg:text-base text-gray-600">Aujourd'hui</p>
                <p className="text-2xl lg:text-3xl font-bold text-purple-600 mt-1">{stats.aujourdhui}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="relative flex-1 max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher par matricule, nom ou matériel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base transition-all duration-200"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200">
                <Filter className="h-4 w-4 text-gray-500 mr-2" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent py-1 focus:outline-none focus:ring-0 text-sm lg:text-base border-none"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="non-rendu">Non rendus</option>
                  <option value="rendu">Rendus</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500 text-sm lg:text-base">Chargement des emprunts...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 lg:p-8 rounded-lg border border-red-200 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-red-500 font-medium text-sm lg:text-base mb-4">{error}</p>
              <button
                onClick={fetchEmprunts}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm lg:text-base flex items-center gap-2 mx-auto"
              >
                <RotateCw className="h-4 w-4" />
                Réessayer
              </button>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="px-4 lg:px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900">
                    Liste des Emprunts ({filteredEmprunts.length})
                  </h3>
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Matricule
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prénoms
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Matériel
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Heure Sortie
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Heure Entrée
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEmprunts.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 lg:px-6 py-12 text-center">
                          <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                          <p className="text-gray-500 text-sm lg:text-base mb-2">Aucun emprunt trouvé</p>
                          <p className="text-gray-400 text-xs lg:text-sm">
                            {searchTerm || filterStatus !== "all" 
                              ? "Essayez de modifier vos critères de recherche" 
                              : "Commencez par ajouter un nouvel emprunt"
                            }
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredEmprunts.map((e) => (
                        <tr key={e._id} className="hover:bg-gray-50/50 transition-colors duration-150">
                          <td className="px-4 lg:px-6 py-4">
                            <div className="text-sm lg:text-base font-medium text-gray-900">
                              {e.matricule}
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="text-sm lg:text-base text-gray-900">
                              {e.prenoms}
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="text-sm lg:text-base text-gray-900">
                              {new Date(e.date).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="text-sm lg:text-base text-gray-900">
                              {e.materiel && e.materiel.name}
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="text-sm lg:text-base font-medium text-gray-900">
                              {e.heureSortie}
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className={`text-sm lg:text-base ${e.heureEntree ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                              {e.heureEntree || "-"}
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            {e.heureEntree ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Rendu
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="h-3 w-3 mr-1" />
                                En cours
                              </span>
                            )}
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex justify-end space-x-1">
                              {!e.heureEntree && (
                                <button
                                  onClick={() => handleRenduClick(e._id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-150"
                                  title="Marquer comme rendu"
                                >
                                  <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleEditClick(e)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4 lg:h-5 lg:w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(e._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
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