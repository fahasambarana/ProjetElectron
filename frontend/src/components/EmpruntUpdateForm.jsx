import React, { useState, useEffect } from "react";
import axios from "axios";
import { X } from "lucide-react";

export default function EmpruntUpdateModal({ isOpen, onClose, emprunt, onEmpruntUpdated }) {
  const [form, setForm] = useState({
    matricule: "",
    prenoms: "",
    date: "",
    niveau: "",
    parcours: "",
    heureSortie: "",
    heureEntree: "",
    materiel: "",
  });
  const [materiels, setMateriels] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les données de l'emprunt et la liste des matériels
  useEffect(() => {
    if (isOpen && emprunt) {
      setLoading(true);
      
      // Charger les données de l'emprunt
      setForm({
        matricule: emprunt.matricule || "",
        prenoms: emprunt.prenoms || "",
        date: emprunt.date ? new Date(emprunt.date).toISOString().split('T')[0] : "",
        niveau: emprunt.niveau || "",
        parcours: emprunt.parcours || "",
        heureSortie: emprunt.heureSortie || "",
        heureEntree: emprunt.heureEntree || "",
        materiel: emprunt.materiel?._id || emprunt.materiel || "",
      });

      // Charger la liste des matériels
      axios.get("http://localhost:5000/api/stocks")
        .then((res) => {
          setMateriels(res.data);
        })
        .catch(err => {
          console.error("Erreur lors du chargement des matériels:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, emprunt]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.put(`http://localhost:5000/api/emprunts/${emprunt._id}`, form);
      onEmpruntUpdated(res.data);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la modification de l'emprunt");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !emprunt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Modifier l'Emprunt</h2>
            <p className="text-gray-500 text-sm mt-1">Modifier les informations de l'emprunt</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Matricule */}
            <div>
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
                placeholder="Entrez le matricule"
              />
            </div>

            {/* Prénoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénoms <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="prenoms"
                value={form.prenoms}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Entrez les prénoms"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              >
                <option value="">-- Choisir un niveau --</option>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
                <option value="M1">M1</option>
                <option value="M2">M2</option>
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
              >
                <option value="">-- Choisir un parcours --</option>
                <option value="GL">GL</option>
                <option value="AEII">AEII</option>
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
              />
            </div>

            {/* Heure d'entrée */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure d'entrée
              </label>
              <input
                type="time"
                name="heureEntree"
                value={form.heureEntree}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="HH:MM"
              />
              <p className="text-xs text-gray-500 mt-1">
                Laissez vide si le matériel n'est pas encore rendu
              </p>
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
                disabled={loading}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Choisir un matériel --</option>
                {materiels.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} {m.stock !== undefined && `(Stock: ${m.stock})`}
                  </option>
                ))}
              </select>
              {loading && (
                <p className="text-sm text-gray-500 mt-1">Chargement des matériels...</p>
              )}
            </div>
          </div>

          {/* Statut actuel */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Statut actuel</h3>
            <div className="flex items-center gap-2">
              {emprunt.heureEntree ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Matériel rendu
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  En cours d'emprunt
                </span>
              )}
              <span className="text-xs text-gray-500">
                {emprunt.heureEntree 
                  ? `Rendu le ${new Date(emprunt.date).toLocaleDateString('fr-FR')} à ${emprunt.heureEntree}`
                  : `Emprunté le ${new Date(emprunt.date).toLocaleDateString('fr-FR')}`
                }
              </span>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Modification...
                </>
              ) : (
                "Modifier l'emprunt"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}