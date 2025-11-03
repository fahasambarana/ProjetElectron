import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export function QuickEventForm({ selectedDate, onClose, onEventAdded }) {
  if (!selectedDate) return null;

  const parcoursOptions = ["GL", "AEII", "tout "];
  const niveauOptions = ["L1", "L2", "L3", "M1", "M2","tout"];
  const groupeOptions = ["", "Groupe 1", "Groupe 2"]; // <-- nouveau champ
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    parcours: parcoursOptions[0],
    niveau: niveauOptions[0],
    groupe: "", // <-- initialisation
    startTime: "09:00",
    endTime: "10:00",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventData = {
        parcours: formData.parcours,
        niveau: formData.niveau,
        groupe: formData.groupe ||"", // <-- envoi au backend
        date: selectedDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
      };

      const res = await axios.post(
        "http://localhost:5000/api/events",
        eventData
      );

      if (onEventAdded) onEventAdded(res.data);

      setFormData({
        parcours: parcoursOptions[0],
        niveau: niveauOptions[0],
        groupe: groupeOptions[0],
        startTime: "09:00",
        endTime: "10:00",
      });

      onClose();
      navigate("/edt");
    } catch (err) {
      console.error("Erreur lors de l’ajout :", err);
      alert("Impossible d’ajouter l’événement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
            Nouvel événement
          </h2>
          <button
            className="text-gray-600 hover:text-gray-900"
            onClick={onClose}
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>
        <p className="mb-4 text-gray-600">
          {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Parcours */}
          <div>
            <label htmlFor="parcours" className="block font-medium mb-1">
              Parcours
            </label>
            <select
              id="parcours"
              name="parcours"
              value={formData.parcours}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              {parcoursOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Niveau */}
          <div>
            <label htmlFor="niveau" className="block font-medium mb-1">
              Niveau
            </label>
            <select
              id="niveau"
              name="niveau"
              value={formData.niveau}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              {niveauOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Groupe */}
          <div>
            <label htmlFor="groupe" className="block font-medium mb-1">
              Groupe (optionnel)
            </label>
            <select
              id="groupe"
              name="groupe"
              value={formData.groupe}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              {groupeOptions.map((opt, idx) => (
                <option key={idx} value={opt}>
                  {opt === "" ? "Aucun" : opt}
                </option>
              ))}
            </select>
          </div>

          {/* Heures */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block font-medium mb-1">
                Début
              </label>
              <input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block font-medium mb-1">
                Fin
              </label>
              <input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Ajout..." : "Ajouter"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-400 py-2 rounded hover:bg-gray-100 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickEventForm;
