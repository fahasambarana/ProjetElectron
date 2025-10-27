import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api/students';

// Import des bibliothèques pour l'export PDF
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function StudentList() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ 
    N_Order: '', 
    Matricule: '', 
    Nom_et_Prenoms: '', 
    Telephone: '', 
    Niveau: '', 
    Parcours: '' 
  });
  const [editingMatricule, setEditingMatricule] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    niveau: '',
    parcours: '',
    search: ''
  });

  // Ordre personnalisé des niveaux
  const niveauOrder = ['L1', 'L2', 'L3', 'M1', 'M2'];

  // --- READ: Récupérer tous les étudiants ---
  useEffect(() => {
    fetchStudents();
  }, []);

  // Appliquer les filtres quand les étudiants ou les filtres changent
  useEffect(() => {
    applyFilters();
  }, [students, filters]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }
      const result = await response.json();
      setStudents(result.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Fonction de tri personnalisé par niveau
  const sortStudentsByNiveau = (studentsList) => {
    return [...studentsList].sort((a, b) => {
      const indexA = niveauOrder.indexOf(a.Niveau);
      const indexB = niveauOrder.indexOf(b.Niveau);
      
      // Si les deux niveaux sont dans l'ordre défini, trier selon cet ordre
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // Si un niveau n'est pas dans l'ordre défini, le mettre à la fin
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      // Tri alphabétique par défaut pour les niveaux non définis
      return a.Niveau.localeCompare(b.Niveau);
    });
  };

  // --- EXPORT PDF ---
  const exportToPDF = () => {
    // Créer un nouveau document PDF
    const doc = new jsPDF();

    // Titre du document
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Liste des Étudiants', 14, 15);

    // Sous-titre avec informations de filtrage
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    
    let subtitle = `Total: ${filteredStudents.length} étudiant${filteredStudents.length !== 1 ? 's' : ''}`;
    if (filters.niveau || filters.parcours || filters.search) {
      subtitle += ' (Résultats filtrés)';
    }
    doc.text(subtitle, 14, 22);

    // Date d'export
    const date = new Date().toLocaleDateString('fr-FR');
    doc.text(`Exporté le: ${date}`, 14, 29);

    // Préparer les données pour le tableau
    const tableData = filteredStudents.map(student => [
      student.N_Order,
      student.Matricule,
      student.Nom_et_Prenoms,
      student.Telephone,
      student.Niveau,
      student.Parcours
    ]);

    // Créer le tableau avec AutoTable
    doc.autoTable({
      startY: 35,
      head: [['N°', 'Matricule', 'Nom et Prénoms', 'Téléphone', 'Niveau', 'Parcours']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      columnStyles: {
        0: { cellWidth: 15 }, // N°
        1: { cellWidth: 30 }, // Matricule
        2: { cellWidth: 50 }, // Nom et Prénoms
        3: { cellWidth: 30 }, // Téléphone
        4: { cellWidth: 20 }, // Niveau
        5: { cellWidth: 35 }  // Parcours
      },
      margin: { top: 35 }
    });

    // Sauvegarder le PDF
    const fileName = `liste_etudiants_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // --- FILTRES ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    let filtered = students;

    // Filtre par niveau
    if (filters.niveau) {
      filtered = filtered.filter(student => 
        student.Niveau.toLowerCase().includes(filters.niveau.toLowerCase())
      );
    }

    // Filtre par parcours
    if (filters.parcours) {
      filtered = filtered.filter(student => 
        student.Parcours.toLowerCase().includes(filters.parcours.toLowerCase())
      );
    }

    // Filtre de recherche globale
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(student => 
        student.Matricule.toLowerCase().includes(searchTerm) ||
        student.Nom_et_Prenoms.toLowerCase().includes(searchTerm) ||
        student.Telephone.toLowerCase().includes(searchTerm)
      );
    }

    // Trier les étudiants filtrés par niveau
    const sortedFilteredStudents = sortStudentsByNiveau(filtered);
    setFilteredStudents(sortedFilteredStudents);
  };

  const clearFilters = () => {
    setFilters({
      niveau: '',
      parcours: '',
      search: ''
    });
  };

  // Obtenir les valeurs uniques pour les options de filtre avec ordre personnalisé
  const getUniqueValues = (field) => {
    if (field === 'Niveau') {
      const uniqueNiveaux = [...new Set(students.map(student => student[field]))].filter(Boolean);
      // Trier selon l'ordre personnalisé
      return uniqueNiveaux.sort((a, b) => {
        const indexA = niveauOrder.indexOf(a);
        const indexB = niveauOrder.indexOf(b);
        return indexA - indexB;
      });
    }
    return [...new Set(students.map(student => student[field]))].filter(Boolean).sort();
  };

  // --- CREATE/UPDATE: Gérer la soumission du formulaire ---
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isUpdating = !!editingMatricule;
    const method = isUpdating ? 'PUT' : 'POST';
    const url = isUpdating ? `${API_URL}/${editingMatricule}` : API_URL;

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de ${isUpdating ? 'la modification' : 'l\'ajout'}`);
      }

      // Réinitialiser le formulaire et fermer la modal
      setFormData({ 
        N_Order: '', 
        Matricule: '', 
        Nom_et_Prenoms: '', 
        Telephone: '', 
        Niveau: '', 
        Parcours: '' 
      });
      setEditingMatricule(null);
      setShowModal(false);
      fetchStudents(); // Recharger la liste
    } catch (err) {
      alert(err.message);
    }
  };

  // --- DELETE: Supprimer un étudiant ---
  const handleDelete = async (matricule) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'étudiant ${matricule} ?`)) {
      try {
        const response = await fetch(`${API_URL}/${matricule}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la suppression');
        }

        fetchStudents(); // Recharger la liste
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // --- EDIT: Ouvrir la modal pour la modification ---
  const handleEdit = (student) => {
    setEditingMatricule(student.Matricule);
    setFormData({
      N_Order: student.N_Order,
      Matricule: student.Matricule,
      Nom_et_Prenoms: student.Nom_et_Prenoms,
      Telephone: student.Telephone,
      Niveau: student.Niveau,
      Parcours: student.Parcours,
    });
    setShowModal(true);
  };

  // --- ADD: Ouvrir la modal pour l'ajout ---
  const handleAdd = () => {
    setEditingMatricule(null);
    setFormData({ 
      N_Order: '', 
      Matricule: '', 
      Nom_et_Prenoms: '', 
      Telephone: '', 
      Niveau: '', 
      Parcours: '' 
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setEditingMatricule(null);
    setFormData({ 
      N_Order: '', 
      Matricule: '', 
      Nom_et_Prenoms: '', 
      Telephone: '', 
      Niveau: '', 
      Parcours: '' 
    });
    setShowModal(false);
  };

  // Fermer la modal en cliquant à l'extérieur
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto mt-8">
      <strong>Erreur: </strong> {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="mx-auto px-4">
        {/* En-tête compact */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Gestion des Étudiants</h1>
          <p className="text-sm text-gray-600">Interface d'administration des étudiants - Tri par niveau: L1, L2, L3, M1, M2</p>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* En-tête de la carte avec boutons */}
          <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Liste des Étudiants</h2>
              <p className="text-xs text-gray-500 mt-1">
                {filteredStudents.length} étudiant{filteredStudents.length !== 1 ? 's' : ''} sur {students.length} enregistré{students.length !== 1 ? 's' : ''}
                <span className="ml-2 text-blue-600">• Tri par niveau</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={exportToPDF}
                disabled={filteredStudents.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg flex items-center transition duration-200 text-sm w-full sm:w-auto justify-center order-2 sm:order-1"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exporter PDF
              </button>
              <button
                onClick={handleAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center transition duration-200 text-sm w-full sm:w-auto justify-center order-1 sm:order-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter
              </button>
            </div>
          </div>

          {/* Filtres compacts */}
          <div className="px-4 py-3 bg-white border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Recherche globale */}
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Recherche</label>
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Matricule, nom, téléphone..."
                    className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <svg className="absolute left-3 top-2.5 h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Filtre par niveau */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Niveau</label>
                <select
                  name="niveau"
                  value={filters.niveau}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Tous les niveaux</option>
                  {niveauOrder.map(niveau => (
                    <option key={niveau} value={niveau}>{niveau}</option>
                  ))}
                </select>
              </div>
              
              {/* Filtre par parcours */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Parcours</label>
                <select
                  name="parcours"
                  value={filters.parcours}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Tous les parcours</option>
                  {getUniqueValues('Parcours').map(parcours => (
                    <option key={parcours} value={parcours}>{parcours}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Bouton réinitialiser les filtres */}
            {(filters.niveau || filters.parcours || filters.search) && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Réinitialiser
                </button>
              </div>
            )}
          </div>

          {/* Tableau trié par niveau */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Nom et Prénoms</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Téléphone</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Niveau</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Parcours</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student, index) => (
                  <tr key={student.Matricule} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{student.N_Order}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">{student.Matricule}</td>
                    <td className="px-3 py-3 text-sm text-gray-900 whitespace-normal break-words min-w-[200px]">
                      {student.Nom_et_Prenoms}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">{student.Telephone}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        student.Niveau === 'L1' ? 'bg-green-100 text-green-800' :
                        student.Niveau === 'L2' ? 'bg-blue-100 text-blue-800' :
                        student.Niveau === 'L3' ? 'bg-purple-100 text-purple-800' :
                        student.Niveau === 'M1' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.Niveau}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                      {student.Parcours}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-1 justify-start">
                        <button
                          onClick={() => handleEdit(student)}
                          className="text-blue-600 hover:text-blue-900 transition duration-200 p-1 rounded hover:bg-blue-50"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(student.Matricule)}
                          className="text-red-600 hover:text-red-900 transition duration-200 p-1 rounded hover:bg-red-50"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Messages d'état */}
          {filteredStudents.length === 0 && students.length > 0 && (
            <div className="text-center py-8">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun étudiant trouvé</h3>
              <p className="mt-1 text-xs text-gray-500">Essayez de modifier vos critères de recherche.</p>
              <button
                onClick={clearFilters}
                className="mt-3 text-blue-600 hover:text-blue-800 text-xs"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {students.length === 0 && (
            <div className="text-center py-8">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun étudiant</h3>
              <p className="mt-1 text-xs text-gray-500">Commencez par ajouter un nouvel étudiant.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal pour l'ajout et la modification */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* En-tête de la modal */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingMatricule ? 'Modifier l\'étudiant' : 'Ajouter un étudiant'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Ordre</label>
                <input
                  type="text"
                  name="N_Order"
                  value={formData.N_Order}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matricule</label>
                <input
                  type="text"
                  name="Matricule"
                  value={formData.Matricule}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                  disabled={!!editingMatricule}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom et Prénoms</label>
                <input
                  type="text"
                  name="Nom_et_Prenoms"
                  value={formData.Nom_et_Prenoms}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  name="Telephone"
                  value={formData.Telephone}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                <select
                  name="Niveau"
                  value={formData.Niveau}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Sélectionner un niveau</option>
                  {niveauOrder.map(niveau => (
                    <option key={niveau} value={niveau}>{niveau}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parcours</label>
                <select
                  name="Parcours"
                  value={formData.Parcours}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Sélectionner un parcours</option>
                  {getUniqueValues('Parcours').map(parcours => (
                    <option key={parcours} value={parcours}>{parcours}</option>
                  ))}
                </select>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200 text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 flex items-center text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editingMatricule ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentList;