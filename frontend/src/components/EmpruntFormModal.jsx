import React, { useState, useEffect } from "react";
import axios from "axios";

export default function EmpruntFormModal({ isOpen, onClose, onEmpruntAdded }) {
  const [form, setForm] = useState({
    matricule: "",
    prenoms: "",
    dateEmprunt: "",
    niveau: "",
    parcours: "",
    heureSortie: "",
    materiel: "",
  });
  const [materiels, setMateriels] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [filteredEtudiants, setFilteredEtudiants] = useState([]);
  const [showEtudiantList, setShowEtudiantList] = useState(false);

  // Charger la liste des matériels et des étudiants
  useEffect(() => {
    if (isOpen) {
      axios.get("http://localhost:5000/api/stocks").then((res) => {
        setMateriels(res.data);
      });
      
      axios.get("http://localhost:5000/api/students").then((res) => {
        setEtudiants(res.data.data || res.data);
      });
    }
  }, [isOpen]);

  // Filtrer les étudiants en fonction du matricule saisi
  useEffect(() => {
    if (form.matricule.length > 0) {
      const filtered = etudiants.filter(etudiant =>
        etudiant.Matricule.toLowerCase().includes(form.matricule.toLowerCase())
      );
      setFilteredEtudiants(filtered);
      setShowEtudiantList(true);
    } else {
      setShowEtudiantList(false);
    }
  }, [form.matricule, etudiants]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Sélectionner un étudiant depuis la liste
  const handleEtudiantSelect = (etudiant) => {
    setForm({
      ...form,
      matricule: etudiant.Matricule,
      prenoms: etudiant.Nom_et_Prenoms,
      niveau: etudiant.Niveau,
      parcours: etudiant.Parcours
    });
    setShowEtudiantList(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/emprunts", form);
      onEmpruntAdded(res.data);
      setForm({
        matricule: "",
        prenoms: "",
        dateEmprunt: "",
        niveau: "",
        parcours: "",
        heureSortie: "",
        materiel: "",
      });
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'emprunt");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-4">Nouvel Emprunt</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Champ Matricule avec recherche */}
            <div className="relative">
              <label className="block mb-1 font-medium">Matricule</label>
              <input
                type="text"
                name="matricule"
                value={form.matricule}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
                placeholder="Rechercher par matricule..."
              />
              
              {/* Liste déroulante des étudiants */}
              {showEtudiantList && filteredEtudiants.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredEtudiants.map((etudiant) => (
                    <div
                      key={etudiant.Matricule}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                      onClick={() => handleEtudiantSelect(etudiant)}
                    >
                      <div className="font-medium text-gray-900">
                        {etudiant.Matricule}
                      </div>
                      <div className="text-sm text-gray-600">
                        {etudiant.Nom_et_Prenoms} - {etudiant.Niveau} {etudiant.Parcours}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prénoms (rempli automatiquement) */}
            {/* <div>
              <label className="block mb-1 font-medium">Nom et Prénoms</label>
              <input
                type="text"
                name="prenoms"
                value={form.prenoms}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full bg-gray-50"
                readOnly
              />
            </div> */}

            {/* Date */}
            <div>
              <label className="block mb-1 font-medium">Date</label>
              <input
                type="date"
                name="dateEmprunt"
                value={form.dateEmprunt}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
            </div>

            {/* Niveau (rempli automatiquement) */}
            {/* <div>
              <label className="block mb-1 font-medium">Niveau</label>
              <select
                name="niveau"
                value={form.niveau}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full bg-gray-50"
              >
                <option value="">-- Choisir un niveau --</option>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
                <option value="M1">M1</option>
                <option value="M2">M2</option>
              </select>
            </div> */}

            {/* Parcours (rempli automatiquement) */}
            {/* <div>
              <label className="block mb-1 font-medium">Parcours</label>
              <select
                name="parcours"
                value={form.parcours}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full bg-gray-50"
              >
                <option value="">-- Choisir un parcours --</option>
                <option value="GL">GL</option>
                <option value="AEII">AEII</option>
              </select>
            </div> */}

            {/* Heure de sortie */}
            <div>
              <label className="block mb-1 font-medium">Heure de sortie</label>
              <input
                type="time"
                name="heureSortie"
                value={form.heureSortie}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
            </div>

            {/* Matériel */}
            <div>
              <label className="block mb-1 font-medium">Matériel</label>
              <select
                name="materiel"
                value={form.materiel}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              >
                <option value="">-- Choisir un matériel --</option>
                {materiels.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} (Stock: {m.stock})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Informations de l'étudiant sélectionné */}
          {form.matricule && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Étudiant sélectionné :</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Matricule:</span> {form.matricule}</div>
                <div><span className="font-medium">Nom:</span> {form.prenoms}</div>
                <div><span className="font-medium">Niveau:</span> {form.niveau}</div>
                <div><span className="font-medium">Parcours:</span> {form.parcours}</div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800 transition duration-200"
          >
            Enregistrer l'emprunt
          </button>
        </form>
      </div>
    </div>
  );
}