import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const UpdateStockForm = () => {
  const { id } = useParams(); // récupère l'id depuis l'URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    stock: "",
    threshold: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fonction pour récupérer le stock existant
  const fetchStock = async () => {
    try {
      const res = await api.get(`/stocks/${id}`);
      setFormData({
        name: res.data.name,
        stock: res.data.stock,
        threshold: res.data.threshold,
      });
    } catch (err) {
      console.error("Erreur lors du chargement du stock :", err.response || err.message);
      alert("Impossible de charger le stock");
      navigate("/stocklist"); // redirige si erreur
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nom requis";
    if (!formData.stock || isNaN(formData.stock) || formData.stock < 0)
      newErrors.stock = "Stock doit être un nombre positif";
    if (!formData.threshold || isNaN(formData.threshold) || formData.threshold < 0)
      newErrors.threshold = "Seuil minimum doit être un nombre positif";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await api.put(`/stocks/${id}`, {
        name: formData.name,
        stock: Number(formData.stock),
        threshold: Number(formData.threshold),
      });
      alert("Stock mis à jour avec succès !");
      navigate("/stocklist");
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err.response || err.message);
      alert("Erreur lors de la mise à jour du stock");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Modifier le stock</h2>

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
            className={`w-full border p-2 rounded ${errors.name ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
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
            className={`w-full border p-2 rounded ${errors.stock ? "border-red-500" : "border-gray-300"}`}
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
            className={`w-full border p-2 rounded ${errors.threshold ? "border-red-500" : "border-gray-300"}`}
          />
          {errors.threshold && <p className="text-red-500 text-sm mt-1">{errors.threshold}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 transition-colors"
        >
          {submitting ? "Enregistrement..." : "Mettre à jour"}
        </button>
      </form>
    </div>
  );
};

export default UpdateStockForm;
