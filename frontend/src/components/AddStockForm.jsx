import React, { useState } from "react";
import api from "../services/api";

const AddStockForm = ({ isOpen, onClose, onStockAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    stock: "",
    threshold: "0",
    specifications: {},
  });
  const [newSpec, setNewSpec] = useState({ key: "", value: "" });
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => 
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleAddSpec = () => {
    if (!newSpec.key.trim() || !newSpec.value.trim()) {
      setErrors(prev => ({ ...prev, spec: "La clé et la valeur sont requises" }));
      return;
    }
    
    // ✅ CORRECTION : S'assurer que les spécifications sont bien mises à jour
    setFormData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [newSpec.key.trim()]: newSpec.value.trim(),
      },
    }));
    
    setNewSpec({ key: "", value: "" });
    setErrors(prev => ({ ...prev, spec: "" }));
  };

  const handleRemoveSpec = (key) => {
    const updated = { ...formData.specifications };
    delete updated[key];
    setFormData({ ...formData, specifications: updated });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Le nom du produit est requis";
    if (!formData.type.trim()) newErrors.type = "Le type d'appareil est requis";
    if (!formData.stock || isNaN(formData.stock) || formData.stock < 0)
      newErrors.stock = "Stock invalide";
    if (!formData.threshold || isNaN(formData.threshold) || formData.threshold < 0)
      newErrors.threshold = "Seuil invalide";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      
      // Création FormData pour envoyer les fichiers
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("type", formData.type);
      submitData.append("stock", Number(formData.stock));
      submitData.append("threshold", Number(formData.threshold));
      
      // ✅ CORRECTION : Toujours envoyer les spécifications, même si vides
      const specsToSend = Object.keys(formData.specifications).length > 0 
        ? formData.specifications 
        : {};
      
      submitData.append("specifications", JSON.stringify(specsToSend));
      
      // Ajouter la photo si elle existe
      if (photo) {
        submitData.append("photo", photo);
      }

      console.log("✅ Données soumises:", {
        ...formData,
        specifications: formData.specifications,
        specsCount: Object.keys(formData.specifications).length
      });

      // ✅ DEBUG: Afficher le contenu du FormData
      console.log("📦 Contenu FormData:");
      for (let [key, value] of submitData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const response = await api.post("/stocks", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Réponse du serveur:", response.data);

      // Réinitialiser le formulaire
      setFormData({
        name: "",
        type: "",
        stock: "",
        threshold: "0",
        specifications: {},
      });
      setPhoto(null);
      setNewSpec({ key: "", value: "" });
      setErrors({});
      
      if (onStockAdded) onStockAdded();
      onClose();
    } catch (err) {
      console.error("❌ Erreur détaillée:", err);
      console.error("❌ Erreur response:", err.response?.data);
      
      if (err.response?.data?.errors) {
        // Gérer les erreurs de validation spécifiques
        const validationErrors = {};
        Object.keys(err.response.data.errors).forEach(key => {
          validationErrors[key] = err.response.data.errors[key].message;
        });
        setErrors(validationErrors);
      } else {
        setErrors({ submit: err.response?.data?.message || "Erreur lors de la création du stock" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      stock: "",
      threshold: "0",
      specifications: {},
    });
    setPhoto(null);
    setNewSpec({ key: "", value: "" });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ✅ Fonction pour tester l'état des spécifications
  const debugSpecs = () => {
    console.log("🔍 État actuel des spécifications:", formData.specifications);
    console.log("🔍 Nombre de spécifications:", Object.keys(formData.specifications).length);
    console.log("🔍 Nouvelles spécifications en cours:", newSpec);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Nouveau matériel</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ✖
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du matériel *
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Projecteur Epson EB-U05"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type d'appareil *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">-- Choisir un type --</option>
              <option value="PC">PC</option>
              <option value="Projecteur">Projecteur</option>
              <option value="Switch">Switch</option>
              <option value="Adaptateur">Adaptateur</option>
              <option value="Routeur">Routeur</option>
              <option value="Autre">Autre</option>
            </select>
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
          </div>

          {/* Stock et seuil */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock *
              </label>
              <input
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleChange}
                className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.stock ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
              />
              {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seuil d'alerte
              </label>
              <input
                name="threshold"
                type="number"
                value={formData.threshold}
                onChange={handleChange}
                className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.threshold ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
              />
              {errors.threshold && <p className="text-red-500 text-sm mt-1">{errors.threshold}</p>}
            </div>
          </div>

          {/* Upload de photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo du matériel
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {photo && (
              <p className="text-green-600 text-sm mt-1">
                ✓ {photo.name} sélectionné
              </p>
            )}
          </div>

          {/* Spécifications dynamiques */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Spécifications techniques
              </label>
              <button
                type="button"
                onClick={debugSpecs}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                🔍 Debug
              </button>
            </div>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Clé (ex: Marque)"
                value={newSpec.key}
                onChange={(e) => setNewSpec({ ...newSpec, key: e.target.value })}
                className="flex-1 border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSpec();
                  }
                }}
              />
              <input
                type="text"
                placeholder="Valeur (ex: Epson)"
                value={newSpec.value}
                onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
                className="flex-1 border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSpec();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSpec}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={!newSpec.key.trim() || !newSpec.value.trim()}
              >
                +
              </button>
            </div>
            
            {errors.spec && (
              <p className="text-red-500 text-sm mb-2">{errors.spec}</p>
            )}
            
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              {Object.entries(formData.specifications).length > 0 ? (
                Object.entries(formData.specifications).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center bg-white px-3 py-2 rounded-lg text-sm border border-gray-200"
                  >
                    <span className="text-gray-700">
                      <strong className="text-blue-600">{key}:</strong> {String(value)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(key)}
                      className="text-red-500 hover:text-red-700 focus:outline-none ml-2"
                    >
                      ✖
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-2">
                  Aucune spécification ajoutée
                </p>
              )}
            </div>
            
            {Object.keys(formData.specifications).length > 0 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                {Object.keys(formData.specifications).length} spécification(s) ajoutée(s)
              </p>
            )}
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ajout...
                </>
              ) : (
                "Ajouter le matériel"
              )}
            </button>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm text-center">{errors.submit}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddStockForm;