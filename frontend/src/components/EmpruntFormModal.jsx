import React, { useState, useEffect } from "react";
import axios from "axios";

export default function EmpruntFormModal({ isOpen, onClose, onEmpruntAdded }) {
  const [form, setForm] = useState({
    matricule: "",
    prenoms: "",
    date: "",
    niveau: "",
    parcours: "",
    heureSortie: "",
    materiel: "",
  });
  const [materiels, setMateriels] = useState([]);

  // Charger la liste des matériels
  useEffect(() => {
    if (isOpen) {
      axios.get("http://localhost:5000/api/stocks").then((res) => {
        setMateriels(res.data);
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/emprunts", form);
      onEmpruntAdded(res.data);
      setForm({
        matricule: "",
        prenoms: "",
        date: "",
        niveau: "",
        parcours: "",
        heureSortie: "",
        materiel: "",
      });
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l’emprunt");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl relative">
        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-4">Nouvel Emprunt</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-medium">Matricule</label>
              <input
                type="text"
                name="matricule"
                value={form.matricule}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Prénoms</label>
              <input
                type="text"
                name="prenoms"
                value={form.prenoms}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Niveau</label>
              <select
                name="niveau"
                value={form.niveau}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              >
                <option value="">-- Choisir un niveau --</option>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
                <option value="M1">M1</option>
                <option value="M2">M2</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Parcours</label>
              <select
                name="parcours"
                value={form.parcours}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              >
                <option value="">-- Choisir un parcours --</option>
                <option value="GL">GL</option>
                <option value="AEII">AEII</option>
              </select>
            </div>

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

          <button
            type="submit"
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800"
          >
            Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
}
