import React, { useState } from "react";
import api from "../services/api";

const AddStockForm = ({ isOpen, onClose, onStockAdded }) => {
  const [formData, setFormData] = useState({ name: "", stock: "", threshold: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nom requis";
    if (!formData.stock || isNaN(formData.stock) || formData.stock < 0) newErrors.stock = "Stock positif requis";
    if (!formData.threshold || isNaN(formData.threshold) || formData.threshold < 0) newErrors.threshold = "Seuil positif requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await api.post("/stocks", {
        name: formData.name,
        stock: Number(formData.stock),
        threshold: Number(formData.threshold),
      });
      // Réinitialiser le formulaire
      setFormData({ name: "", stock: "", threshold: "" });
      setErrors({});
      
      // Appeler la fonction de callback si fournie
      if (onStockAdded) {
        onStockAdded();
      }
      
      // Fermer la modale
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du stock");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", stock: "", threshold: "" });
    setErrors({});
    onClose();
  };

  // Ne rien rendre si la modale n'est pas ouverte
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Ajouter un nouveau stock</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Entrez le nom du produit"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
          
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock initial</label>
            <input
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                errors.stock ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Quantité en stock"
              min="0"
            />
            {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Seuil minimum</label>
            <input
              name="threshold"
              type="number"
              value={formData.threshold}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                errors.threshold ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Seuil d'alerte"
              min="0"
            />
            {errors.threshold && <p className="mt-1 text-sm text-red-600">{errors.threshold}</p>}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </>
              ) : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockForm;