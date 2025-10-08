import React, { useState, useEffect } from "react";
import axios from "axios";
import EmpruntFormModal from "./EmpruntFormModal";
import EmpruntUpdateModal from "./EmpruntUpdateForm";
import { Plus, Search, Filter, Edit, Save, X, Trash2, CheckCircle, Clock, Download } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function EmpruntList() {
  const [emprunts, setEmprunts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedEmprunt, setSelectedEmprunt] = useState(null);
  const [editEmpruntId, setEditEmpruntId] = useState(null);
  const [editHeureEntree, setEditHeureEntree] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [exporting, setExporting] = useState(false);

  const fetchEmprunts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/emprunts");
      
      // Vérifier la structure de la réponse
      console.log("Réponse API:", res.data);
      
      // Si res.data a une propriété data qui contient le tableau
      const empruntsData = res.data.data || res.data;
      
      // S'assurer que c'est bien un tableau avant de trier
      if (Array.isArray(empruntsData)) {
        // Trier les emprunts par date décroissante (plus récent en premier)
        const sortedEmprunts = empruntsData.sort((a, b) => new Date(b.date) - new Date(a.date));
        setEmprunts(sortedEmprunts);
      } else {
        console.error("Les données reçues ne sont pas un tableau:", empruntsData);
        setEmprunts([]);
      }
      
    } catch (err) {
      console.error("Erreur détaillée:", err);
      setError("Impossible de charger les emprunts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmprunts();
  }, []);

  // Fonction d'export PDF
  const exportToPDF = () => {
    setExporting(true);
    
    try {
      const doc = new jsPDF();
      
      // Titre principal
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('LISTE DES EMPRUNTS', 105, 15, { align: 'center' });
      
      // Date d'export
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Export du ${new Date().toLocaleDateString('fr-FR')}`, 105, 22, { align: 'center' });
      
      // Statistiques
      const empruntsRendus = emprunts.filter(e => e.heureEntree).length;
      const empruntsEnCours = emprunts.filter(e => !e.heureEntree).length;
      
      doc.setFontSize(9);
      doc.text(
        `Total: ${filteredEmprunts.length} emprunts | ` +
        `En cours: ${empruntsEnCours} | ` +
        `Rendus: ${empruntsRendus}`,
        14,
        30
      );
      
      // Préparer les données du tableau (triées par date décroissante)
      const tableData = filteredEmprunts.map(emprunt => [
        emprunt.matricule,
        emprunt.prenoms,
        new Date(emprunt.date).toLocaleDateString('fr-FR'),
        emprunt.materiel && emprunt.materiel.name ? emprunt.materiel.name : 'N/A',
        emprunt.heureSortie,
        emprunt.heureEntree || '-',
        emprunt.heureEntree ? 'Rendu' : 'En cours'
      ]);
      
      // Créer le tableau avec autoTable
      doc.autoTable({
        head: [['Matricule', 'Prénoms', 'Date', 'Matériel', 'Heure Sortie', 'Heure Entrée', 'Statut']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        styles: { 
          fontSize: 8,
          cellPadding: 2,
          textColor: [40, 40, 40]
        },
        headStyles: { 
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 35 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 }
        },
        didDrawCell: (data) => {
          // Colorer les cellules de statut
          if (data.column.index === 6 && data.cell.section === 'body') {
            const status = data.cell.raw;
            if (status === 'Rendu') {
              doc.setTextColor(5, 150, 105); // Vert
            } else {
              doc.setTextColor(217, 119, 6); // Orange
            }
          }
        }
      });
      
      // Pied de page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${i} sur ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
      
      // Sauvegarder le PDF
      doc.save(`emprunts_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleEmpruntAdded = (newEmprunt) => {
    // Ajouter le nouvel emprunt au début de la liste (le plus récent en premier)
    setEmprunts([newEmprunt, ...emprunts]);
  };

  const handleEmpruntUpdated = (updatedEmprunt) => {
    setEmprunts(emprunts.map((e) => (e._id === updatedEmprunt._id ? updatedEmprunt : e)));
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
        { heureEntree: new Date().toLocaleTimeString() }
      );
      // Utiliser res.data.data si la réponse a une structure {success, message, data}
      const updatedEmprunt = res.data.data || res.data;
      setEmprunts(emprunts.map((e) => (e._id === empruntId ? updatedEmprunt : e)));
    } catch (err) {
      alert("Impossible de marquer le matériel rendu");
    }
  };

  const handleDeleteClick = async (empruntId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet emprunt ?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/emprunts/${empruntId}`);
      setEmprunts(emprunts.filter((e) => e._id !== empruntId));
    } catch (err) {
      alert("Impossible de supprimer l'emprunt");
    }
  };

  const handleEditSave = async (empruntId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/emprunts/rendu/${empruntId}`, {
        heureEntree: editHeureEntree,
      });
      // Utiliser res.data.data si la réponse a une structure {success, message, data}
      const updatedEmprunt = res.data.data || res.data;
      setEmprunts(emprunts.map((e) => (e._id === empruntId ? updatedEmprunt : e)));
      setEditEmpruntId(null);
      setEditHeureEntree("");
    } catch (err) {
      alert("Impossible de mettre à jour l'heure d'entrée");
    }
  };

  const handleEditCancel = () => {
    setEditEmpruntId(null);
    setEditHeureEntree("");
  };

  const filteredEmprunts = emprunts
    .filter((emprunt) => {
      const matchesSearch = 
        emprunt.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emprunt.prenoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emprunt.materiel && emprunt.materiel.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = 
        filterStatus === "all" || 
        (filterStatus === "rendu" && emprunt.heureEntree) || 
        (filterStatus === "non-rendu" && !emprunt.heureEntree);
      
      return matchesSearch && matchesStatus;
    })
    // Tri supplémentaire pour s'assurer que les résultats filtrés sont aussi triés par date décroissante
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestion des Emprunts</h2>
          <p className="text-gray-500 mt-1">Suivez et gérez tous les emprunts de matériel</p>
        </div>
        <div className="flex gap-3">
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
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matricule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prénoms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matériel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heure Sortie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heure Entrée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmprunts.map((e) => (
                <tr key={e._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {e.matricule}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{e.prenoms}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(e.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {e.materiel && e.materiel.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{e.heureSortie}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editEmpruntId === e._id ? (
                      <input
                        type="text"
                        value={editHeureEntree}
                        onChange={(ev) => setEditHeureEntree(ev.target.value)}
                        className="border rounded px-2 py-1 w-24 text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="HH:MM"
                      />
                    ) : (
                      e?.heureEntree ?? "-"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {e.heureEntree ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle size={14} className="mr-1" />
                        Rendu
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock size={14} className="mr-1" />
                        En cours
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {!e?.heureEntree && (
                      <button
                        onClick={() => handleRenduClick(e._id)}
                        className="text-green-600 hover:text-green-900 p-1.5 rounded-md hover:bg-green-50"
                        title="Marquer comme rendu"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditClick(e)}
                      className="text-blue-600 hover:text-blue-900 p-1.5 rounded-md hover:bg-blue-50"
                      title="Modifier"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(e._id)}
                      className="text-red-600 hover:text-red-900 p-1.5 rounded-md hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEmprunts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun emprunt trouvé
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