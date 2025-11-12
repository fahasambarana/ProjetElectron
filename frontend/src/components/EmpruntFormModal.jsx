import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Package, Cpu, Camera, Server, Wifi, Cable, Settings, AlertCircle } from "lucide-react";

export default function EmpruntFormModal({ isOpen, onClose, onEmpruntAdded }) {
  const [form, setForm] = useState({
    matricule: "",
    prenoms: "",
    dateEmprunt: "",
    dateRetour: "",
    niveau: "",
    parcours: "",
    heureSortie: "",
    materiel: "",
  });
  const [materiels, setMateriels] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [filteredEtudiants, setFilteredEtudiants] = useState([]);
  const [selectedMateriel, setSelectedMateriel] = useState(null);
  const [showEtudiantList, setShowEtudiantList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fonction pour obtenir l'icône selon le type
  const getTypeIcon = (type) => {
    const icons = {
      PC: { icon: Cpu, color: "text-blue-600", bg: "bg-blue-100" },
      Projecteur: { icon: Camera, color: "text-purple-600", bg: "bg-purple-100" },
      Switch: { icon: Server, color: "text-green-600", bg: "bg-green-100" },
      Adaptateur: { icon: Cable, color: "text-orange-600", bg: "bg-orange-100" },
      Routeur: { icon: Wifi, color: "text-indigo-600", bg: "bg-indigo-100" },
      Autre: { icon: Settings, color: "text-gray-600", bg: "bg-gray-100" }
    };
    return icons[type] || icons.Autre;
  };

  // Fonction pour obtenir le statut du stock
  const getStockStatus = (stock, threshold) => {
    if (stock === 0) {
      return { text: "Rupture", color: "text-red-600", bg: "bg-red-100", icon: AlertCircle };
    } else if (stock <= threshold) {
      return { text: "Stock faible", color: "text-amber-600", bg: "bg-amber-100", icon: AlertCircle };
    } else {
      return { text: "En stock", color: "text-green-600", bg: "bg-green-100", icon: Package };
    }
  };

  // Charger la liste des matériels et des étudiants
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError("");
      
      // Charger les matériels
      axios.get("http://localhost:5000/api/stocks")
        .then((res) => {
          const materielsData = res.data.data || res.data;
          setMateriels(Array.isArray(materielsData) ? materielsData : []);
        })
        .catch(err => {
          console.error("Erreur chargement matériels:", err);
          setError("Erreur lors du chargement des matériels");
        });

      // Charger les étudiants
      axios.get("http://localhost:5000/api/students")
        .then((res) => {
          const etudiantsData = res.data.data || res.data;
          setEtudiants(Array.isArray(etudiantsData) ? etudiantsData : []);
        })
        .catch(err => {
          console.error("Erreur chargement étudiants:", err);
          setError("Erreur lors du chargement des étudiants");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  // Réinitialiser le formulaire quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setForm({
        matricule: "",
        prenoms: "",
        dateEmprunt: new Date().toISOString().split('T')[0],
        dateRetour: "",
        niveau: "",
        parcours: "",
        heureSortie: new Date().toTimeString().split(' ')[0].substring(0, 5),
        materiel: "",
      });
      setSelectedMateriel(null);
      setError("");
    }
  }, [isOpen]);

  // Filtrer les étudiants en fonction du matricule saisi
  useEffect(() => {
    if (form.matricule.length > 0) {
      const filtered = etudiants.filter(etudiant =>
        etudiant.Matricule?.toLowerCase().includes(form.matricule.toLowerCase()) ||
        etudiant.Nom_et_Prenoms?.toLowerCase().includes(form.matricule.toLowerCase())
      );
      setFilteredEtudiants(filtered);
      setShowEtudiantList(true);
    } else {
      setShowEtudiantList(false);
    }
  }, [form.matricule, etudiants]);

  // Mettre à jour le matériel sélectionné
  useEffect(() => {
    if (form.materiel) {
      const materiel = materiels.find(m => m._id === form.materiel);
      setSelectedMateriel(materiel || null);
    } else {
      setSelectedMateriel(null);
    }
  }, [form.materiel, materiels]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Sélectionner un étudiant depuis la liste
  const handleEtudiantSelect = (etudiant) => {
    setForm({
      ...form,
      matricule: etudiant.Matricule || "",
      prenoms: etudiant.Nom_et_Prenoms || "",
      niveau: etudiant.Niveau || "",
      parcours: etudiant.Parcours || ""
    });
    setShowEtudiantList(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        matricule: form.matricule,
        prenoms: form.prenoms,
        dateEmprunt: form.dateEmprunt,
        dateRetour: form.dateRetour || undefined,
        niveau: form.niveau,
        parcours: form.parcours,
        heureSortie: form.heureSortie,
        materiel: form.materiel,
      };

      const res = await axios.post("http://localhost:5000/api/emprunts", payload);

      if (res.data.success) {
        onEmpruntAdded(res.data.data || res.data);
        setForm({
          matricule: "",
          prenoms: "",
          dateEmprunt: "",
          dateRetour: "",
          niveau: "",
          parcours: "",
          heureSortie: "",
          materiel: "",
        });
        setSelectedMateriel(null);
        onClose();
      } else {
        setError(res.data.message || "Erreur lors de la création de l'emprunt");
      }
    } catch (err) {
      console.error("Erreur création emprunt:", err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        "Erreur lors de la création de l'emprunt"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Nouvel Emprunt</h2>
            <p className="text-gray-500 text-sm mt-1">Créer un nouvel emprunt de matériel</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <div className="flex items-center">
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne de gauche - Formulaire */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Informations de l'emprunt
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Champ Matricule avec recherche */}
                <div className="relative md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matricule <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="matricule"
                    value={form.matricule}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Rechercher par matricule ou nom..."
                    disabled={loading}
                  />
                  
                  {/* Liste déroulante des étudiants */}
                  {showEtudiantList && filteredEtudiants.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredEtudiants.map((etudiant) => (
                        <div
                          key={etudiant._id || etudiant.Matricule}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors"
                          onClick={() => handleEtudiantSelect(etudiant)}
                        >
                          <div className="font-medium text-gray-900">
                            {etudiant.Matricule}
                          </div>
                          <div className="text-sm text-gray-600">
                            {etudiant.Nom_et_Prenoms} • {etudiant.Niveau} {etudiant.Parcours}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prénoms */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom et Prénoms <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="prenoms"
                    value={form.prenoms}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Nom complet de l'étudiant"
                    disabled={loading}
                  />
                </div>

                {/* Date d'emprunt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'emprunt <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateEmprunt"
                    value={form.dateEmprunt}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loading}
                  />
                </div>

                {/* Date de retour prévue */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de retour prévue
                  </label>
                  <input
                    type="date"
                    name="dateRetour"
                    value={form.dateRetour}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loading}
                  />
                </div>

                {/* Niveau */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="niveau"
                    value={form.niveau}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loading}
                  >
                    <option value="">-- Choisir un niveau --</option>
                    <option value="L1">L1</option>
                    <option value="L2">L2</option>
                    <option value="L3">L3</option>
                    <option value="M1">M1</option>
                    <option value="M2">M2</option>
                    <option value="Doctorat">Doctorat</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                {/* Parcours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parcours <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="parcours"
                    value={form.parcours}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loading}
                  >
                    <option value="">-- Choisir un parcours --</option>
                    <option value="GL">GL</option>
                    <option value="AEII">AEII</option>
                    <option value="IIR">IIR</option>
                    <option value="IMI">IMI</option>
                    <option value="Other">Autre</option>
                  </select>
                </div>

                {/* Heure de sortie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure de sortie <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="heureSortie"
                    value={form.heureSortie}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loading}
                  />
                </div>

                {/* Matériel */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matériel <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="materiel"
                    value={form.materiel}
                    onChange={handleChange}
                    required
                    disabled={loading || materiels.length === 0}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Choisir un matériel --</option>
                    {materiels.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} - {m.type} (Stock: {m.stock})
                      </option>
                    ))}
                  </select>
                  {materiels.length === 0 && !loading && (
                    <p className="text-xs text-red-500 mt-1">Aucun matériel disponible</p>
                  )}
                  {loading && (
                    <p className="text-xs text-gray-500 mt-1">Chargement des matériels...</p>
                  )}
                </div>
              </div>

              {/* Informations de l'étudiant sélectionné */}
              {form.matricule && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2 text-sm">Étudiant sélectionné :</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="font-medium">Matricule:</span> {form.matricule}</div>
                    <div><span className="font-medium">Nom:</span> {form.prenoms}</div>
                    <div><span className="font-medium">Niveau:</span> {form.niveau}</div>
                    <div><span className="font-medium">Parcours:</span> {form.parcours}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Colonne de droite - Détails du produit */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Détails du produit
              </h3>

              {selectedMateriel ? (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  {/* En-tête du produit */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getTypeIcon(selectedMateriel.type).bg}`}>
                        {React.createElement(getTypeIcon(selectedMateriel.type).icon, {
                          className: `h-5 w-5 ${getTypeIcon(selectedMateriel.type).color}`
                        })}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {selectedMateriel.name}
                        </h4>
                        <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                          {selectedMateriel.type}
                        </span>
                      </div>
                    </div>
                    
                    {/* Statut du stock */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStockStatus(selectedMateriel.stock, selectedMateriel.threshold).bg} ${getStockStatus(selectedMateriel.stock, selectedMateriel.threshold).color}`}>
                      {getStockStatus(selectedMateriel.stock, selectedMateriel.threshold).text}
                    </div>
                  </div>

                  {/* Informations du stock */}
                  <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-white rounded-lg border">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedMateriel.stock}
                      </div>
                      <div className="text-xs text-gray-500">Stock actuel</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-700">
                        {selectedMateriel.threshold}
                      </div>
                      <div className="text-xs text-gray-500">Seuil d'alerte</div>
                    </div>
                  </div>

                  {/* Barre de progression du stock */}
                  {selectedMateriel.stock > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Niveau de stock</span>
                        <span>{Math.round((selectedMateriel.stock / (selectedMateriel.threshold * 2 || selectedMateriel.stock * 2)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            selectedMateriel.stock > selectedMateriel.threshold 
                              ? 'bg-green-500' 
                              : 'bg-amber-500'
                          }`}
                          style={{ 
                            width: `${Math.min((selectedMateriel.stock / (selectedMateriel.threshold * 2 || selectedMateriel.stock * 2)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Spécifications */}
                  {selectedMateriel.specifications && Object.keys(selectedMateriel.specifications).length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 text-sm mb-2">Spécifications :</h5>
                      <div className="space-y-1 text-xs">
                        {Object.entries(selectedMateriel.specifications).slice(0, 4).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 font-medium">{key}:</span>
                            <span className="text-gray-800">{String(value)}</span>
                          </div>
                        ))}
                        {Object.keys(selectedMateriel.specifications).length > 4 && (
                          <div className="text-blue-600 text-xs text-center mt-1">
                            +{Object.keys(selectedMateriel.specifications).length - 4} autres spécifications
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Photo du produit */}
                  {selectedMateriel.photo && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-700 text-sm mb-2">Photo :</h5>
                      <img 
                        src={`http://localhost:5000/${selectedMateriel.photo}`} 
                        alt={selectedMateriel.name}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}

                  {/* Avertissement si stock faible */}
                  {selectedMateriel.stock <= selectedMateriel.threshold && selectedMateriel.stock > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Stock faible</span>
                      </div>
                      <p className="text-xs text-amber-700 mt-1">
                        Il ne reste que {selectedMateriel.stock} unité(s) en stock.
                      </p>
                    </div>
                  )}

                  {/* Avertissement si rupture de stock */}
                  {selectedMateriel.stock === 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Rupture de stock</span>
                      </div>
                      <p className="text-xs text-red-700 mt-1">
                        Ce produit n'est plus disponible en stock.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Sélectionnez un matériel pour voir ses détails
                  </p>
                </div>
              )}

              {/* Informations importantes */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">📝 Informations importantes</h3>
                <div className="text-xs text-yellow-700 space-y-1">
                  <p>• Le stock du matériel sera automatiquement décrémenté</p>
                  <p>• La date de retour prévue est optionnelle mais recommandée</p>
                  <p>• L'heure de sortie est enregistrée automatiquement si non précisée</p>
                  {selectedMateriel && selectedMateriel.stock <= selectedMateriel.threshold && (
                    <p className="font-medium">• ⚠️ Attention: Stock faible sur ce produit</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || materiels.length === 0 || (selectedMateriel && selectedMateriel.stock === 0)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Création...
                </>
              ) : (
                "Créer l'emprunt"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}