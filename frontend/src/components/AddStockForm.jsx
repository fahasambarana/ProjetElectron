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
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Mise à jour générique des champs
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Pour stock et threshold, garder toujours une valeur numérique ou vide
    if (name === "stock" || name === "threshold") {
      // Autoriser vide sinon nombre positif ou zéro
      if (value === "" || (/^\d+$/.test(value) && Number(value) >= 0)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Gestion du fichier photo avec contrôle taille maxi 5MB
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          photo: "La taille maximale de l'image est de 5MB",
        }));
        return;
      }
      setPhoto(file);
      setErrors((prev) => ({ ...prev, photo: null }));

      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddSpec = () => {
    if (!newSpec.key.trim() || !newSpec.value.trim()) {
      setErrors((prev) => ({
        ...prev,
        spec: "La clé et la valeur sont requises",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [newSpec.key.trim()]: newSpec.value.trim(),
      },
    }));

    setNewSpec({ key: "", value: "" });
    setErrors((prev) => ({ ...prev, spec: null }));
  };

  const handleRemoveSpec = (key) => {
    const updated = { ...formData.specifications };
    delete updated[key];
    setFormData((prev) => ({ ...prev, specifications: updated }));
  };

  // Validation simple des champs
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Le nom du produit est requis";
    if (!formData.type.trim()) newErrors.type = "Le type d'appareil est requis";
    if (
      formData.stock === "" ||
      isNaN(Number(formData.stock)) ||
      Number(formData.stock) < 0
    )
      newErrors.stock = "Stock invalide";
    if (
      formData.threshold === "" ||
      isNaN(Number(formData.threshold)) ||
      Number(formData.threshold) < 0
    )
      newErrors.threshold = "Seuil invalide";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);

      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("type", formData.type);
      submitData.append("stock", Number(formData.stock));
      submitData.append("threshold", Number(formData.threshold));

      submitData.append(
        "specifications",
        JSON.stringify(formData.specifications ?? {})
      );

      if (photo) {
        submitData.append("photo", photo);
      }

      const response = await api.post("/stocks", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Réinitialisation du formulaire après succès
      setFormData({
        name: "",
        type: "",
        stock: "",
        threshold: "0",
        specifications: {},
      });
      setPhoto(null);
      setPhotoPreview(null);
      setNewSpec({ key: "", value: "" });
      setErrors({});

      if (onStockAdded) onStockAdded();
      onClose();
    } catch (err) {
      console.error("Erreur lors de l'envoi:", err);
      if (err.response?.data?.errors) {
        const validationErrors = {};
        Object.keys(err.response.data.errors).forEach((key) => {
          validationErrors[key] = err.response.data.errors[key].message;
        });
        setErrors(validationErrors);
      } else {
        setErrors({
          submit:
            err.response?.data?.message ||
            "Erreur lors de la création du stock, veuillez réessayer.",
        });
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
    setPhotoPreview(null);
    setNewSpec({ key: "", value: "" });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const debugSpecs = () => {
    console.log("Spécifications actuelles:", formData.specifications);
    console.log("Nombre de spécifications:", Object.keys(formData.specifications).length);
    console.log("Nouvelles spécifications en cours:", newSpec);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center p-4 z-50">
      {/* Augmentation de la largeur max de max-w-md à max-w-lg */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Nouveau matériel</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
          >
            ✖
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du matériel *
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.name ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
              }`}
              placeholder="Ex: Projecteur Epson EB-U05"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                {errors.name}
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'appareil *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`w-full border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                errors.type ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
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
            {errors.type && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                {errors.type}
              </p>
            )}
          </div>

          {/* Stock et seuil */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock *
              </label>
              <input
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleChange}
                className={`w-full border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.stock ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                }`}
                placeholder="0"
                min="0"
              />
              {errors.stock && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  {errors.stock}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seuil d'alerte
              </label>
              <input
                name="threshold"
                type="number"
                value={formData.threshold}
                onChange={handleChange}
                className={`w-full border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.threshold ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
                }`}
                placeholder="0"
                min="0"
              />
              {errors.threshold && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  {errors.threshold}
                </p>
              )}
            </div>
          </div>

          {/* Upload photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo du matériel
            </label>

            <div
              className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all ${
                photoPreview ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-gray-400 bg-gray-50"
              }`}
            >
              {photoPreview ? (
                <div className="space-y-3">
                  <img
                    src={photoPreview}
                    alt="Aperçu"
                    className="mx-auto h-32 w-32 object-cover rounded-lg border-2 border-green-200"
                  />
                  <p className="text-green-600 text-sm font-medium">✓ {photo.name}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="text-red-500 text-sm hover:text-red-700"
                  >
                    Changer l'image
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-gray-400 mb-2">
                    <svg
                      className="w-8 h-8 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Cliquez pour sélectionner une image</p>
                  <p className="text-xs text-gray-400">PNG, JPG, JPEG jusqu'à 5MB</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            {errors.photo && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                {errors.photo}
              </p>
            )}
          </div>

          {/* Spécifications - Section élargie */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Spécifications techniques
              </label>
              <div className="flex items-center gap-2">
                {Object.keys(formData.specifications).length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    {Object.keys(formData.specifications).length} ajoutée(s)
                  </span>
                )}
                <button
                  type="button"
                  onClick={debugSpecs}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  title="Debug"
                >
                  🔍
                </button>
              </div>
            </div>

            {/* Container élargi pour les inputs de spécifications */}
            <div className="flex gap-3 mb-4 bg-white p-3 rounded-lg border border-gray-200">
              {/* Input clé - largeur fixe */}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Clé (ex: Marque)"
                  value={newSpec.key}
                  onChange={(e) => setNewSpec((prev) => ({ ...prev, key: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSpec();
                    }
                  }}
                />
              </div>
              
              {/* Input valeur - largeur fixe */}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Valeur (ex: Epson)"
                  value={newSpec.value}
                  onChange={(e) => setNewSpec((prev) => ({ ...prev, value: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSpec();
                    }
                  }}
                />
              </div>
              
              {/* Bouton + plus large et visible */}
              <button
                type="button"
                onClick={handleAddSpec}
                disabled={!newSpec.key.trim() || !newSpec.value.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center min-w-[50px] font-bold text-lg shadow-sm hover:shadow-md"
                title="Ajouter la spécification"
              >
                +
              </button>
            </div>

            {errors.spec && (
              <p className="text-red-500 text-sm mb-2 flex items-center">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                {errors.spec}
              </p>
            )}

            {/* Liste des spécifications */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.entries(formData.specifications).length > 0 ? (
                Object.entries(formData.specifications).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center bg-white px-3 py-2 rounded-lg text-sm border border-gray-200 hover:border-gray-300 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-blue-600 truncate">{key}:</span>
                      <span className="text-gray-700 ml-1 truncate">{value}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(key)}
                      className="text-gray-400 hover:text-red-500 focus:outline-none ml-2 transition-colors p-1 rounded hover:bg-red-50"
                      title="Supprimer"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <svg
                    className="w-8 h-8 mx-auto mb-2 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm">Aucune spécification ajoutée</p>
                </div>
              )}
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-all font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all font-medium flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Ajout en cours...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter le matériel
                </>
              )}
            </button>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <p className="text-red-700 text-sm text-center flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.submit}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddStockForm;