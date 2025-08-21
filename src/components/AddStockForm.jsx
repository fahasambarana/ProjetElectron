import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddStockForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    stock: "",
    threshold: "",
  });

  const [errors, setErrors] = useState({});

  const categories = [
    "Électronique",
    "Vêtements",
    "Alimentation",
    "Bureautique",
    "Maison",
    "Autres",
  ];

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nom requis";
    if (!formData.category) newErrors.category = "Catégorie requise";
    if (!formData.stock || isNaN(formData.stock) || formData.stock < 0)
      newErrors.stock = "Stock doit être un nombre positif";
    if (!formData.threshold || isNaN(formData.threshold) || formData.threshold < 0)
      newErrors.threshold = "Seuil minimum doit être un nombre positif";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Ici tu peux envoyer les données au backend ou stocker dans le contexte global
    console.log("Nouveau stock ajouté :", formData);
    // Après soumission, rediriger vers la liste des stocks
    navigate("/stocklist");
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Ajouter un nouveau stock</h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1" htmlFor="name">
            Nom du produit
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className={`w-full border p-2 rounded ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1" htmlFor="category">
            Catégorie
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full border p-2 rounded ${
              errors.category ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">-- Choisir une catégorie --</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1" htmlFor="stock">
            Quantité en stock
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={handleChange}
            className={`w-full border p-2 rounded ${
              errors.stock ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-1" htmlFor="threshold">
            Seuil minimum de stock
          </label>
          <input
            id="threshold"
            name="threshold"
            type="number"
            min="0"
            value={formData.threshold}
            onChange={handleChange}
            className={`w-full border p-2 rounded ${
              errors.threshold ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.threshold && <p className="text-red-500 text-sm mt-1">{errors.threshold}</p>}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Ajouter
        </button>
      </form>
    </div>
  );
};

export default AddStockForm;
