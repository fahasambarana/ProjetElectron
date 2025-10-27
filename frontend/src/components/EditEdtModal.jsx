import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import axios from "axios";

function EditModal({ isOpen, eventData, onClose, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    parcours: "",
    niveau: "",
    groupe: "",
    date: "",
    startTime: "",
    endTime: "",
    salle: "",
    professeur: ""
  });

  // Options pour les sélecteurs
<<<<<<< HEAD
  const parcoursOptions = ["GL", "AEII", "tout "];
  const niveauOptions = ["L1", "L2", "L3", "M1", "M2","tout"];
  const groupeOptions = ["", "Groupe 1", "Groupe 2", "Groupe 3", "Groupe 4", "TD1", "TD2", "TP1", "TP2"];
=======
  const parcoursOptions = ["GL", "AEII"];
  const niveauOptions = ["L1", "L2", "L3", "M1", "M2"];
  const groupeOptions = ["", "Groupe 1", "Groupe 2",];
>>>>>>> 44499073903b79f3bdf056d2131b57a7c6ef640d

  useEffect(() => {
    if (eventData) {
      setFormData({
        parcours: eventData.parcours || "",
        niveau: eventData.niveau || "",
        groupe: eventData.groupe || "",
        date: eventData.date ? format(new Date(eventData.date), "yyyy-MM-dd") : "",
        startTime: eventData.startTime || "",
        endTime: eventData.endTime || "",
        salle: eventData.salle || "",
        professeur: eventData.professeur || ""
      });
    }
  }, [eventData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Sauvegarde via backend
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`http://localhost:5000/api/events/${eventData._id}`, formData);
      if (onSave) onSave(res.data); // notifier parent
      onClose();
    } catch (err) {
      console.error("Erreur lors de la modification :", err);
      alert("Impossible de modifier l'événement.");
    }
  };

  // Suppression via backend
  const handleDeleteClick = async () => {
    if (!window.confirm("Êtes-vous sûr(e) de vouloir supprimer définitivement cet événement ?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/events/${eventData._id}`);
      if (onDelete) onDelete(eventData._id); // notifier parent
      onClose();
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert("Impossible de supprimer l'événement.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white p-6 rounded-xl w-full max-w-md border-2 border-blue-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-blue-100">
          <h3 className="text-xl font-bold text-blue-800">Modifier l'événement</h3>
          <button 
            onClick={onClose}
            className="text-blue-400 hover:text-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">Parcours</label>
            <select 
              name="parcours" 
              value={formData.parcours} 
              onChange={handleChange} 
              className="w-full border border-blue-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              required
            >
              <option value="">Sélectionner un parcours</option>
              {parcoursOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">Niveau</label>
            <select 
              name="niveau" 
              value={formData.niveau} 
              onChange={handleChange} 
              className="w-full border border-blue-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              required
            >
              <option value="">Sélectionner un niveau</option>
              {niveauOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">Groupe (optionnel)</label>
            <select 
              name="groupe" 
              value={formData.groupe} 
              onChange={handleChange} 
              className="w-full border border-blue-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              {groupeOptions.map(option => (
                <option key={option} value={option}>
                  {option === "" ? "Aucun groupe" : option}
                </option>
              ))}
            </select>
          </div>
          
         
          
          
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">Date</label>
            <input 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange} 
              className="w-full border border-blue-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              required 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Heure de début</label>
              <input 
                type="time" 
                name="startTime" 
                value={formData.startTime} 
                onChange={handleChange} 
                className="w-full border border-blue-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">Heure de fin</label>
              <input 
                type="time" 
                name="endTime" 
                value={formData.endTime} 
                onChange={handleChange} 
                className="w-full border border-blue-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required 
              />
            </div>
          </div>
          
          <div className="flex justify-between pt-6 border-t border-blue-100">
            <button 
              type="button" 
              onClick={handleDeleteClick} 
              className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition border border-red-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer
            </button>
            
            <div className="flex space-x-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition border border-gray-300"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Enregistrer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditModal;