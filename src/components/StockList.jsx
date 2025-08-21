import React from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StockList = ({ products = [
  { name: "Ordinateur Portable", category: "Électronique", stock: 25, threshold: 10 },
  { name: "Chaussures", category: "Vêtements", stock: 8, threshold: 15 },
  { name: "Stylo", category: "Bureautique", stock: 120, threshold: 50 },
  { name: "Café", category: "Alimentation", stock: 5, threshold: 10 },
] }) => {
  const navigate = useNavigate();

  const handleAddClick = () => {
    navigate('/addstock');  // redirige vers la page/formulaire d'ajout
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Liste des Stocks
        </h2>
        <button 
          onClick={handleAddClick}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Ajouter un nouveau stock
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-left text-sm uppercase tracking-wider">
              <th className="px-4 py-3 border">Produit</th>
              <th className="px-4 py-3 border">Catégorie</th>
              <th className="px-4 py-3 border">Stock</th>
              <th className="px-4 py-3 border">Seuil Min</th>
              <th className="px-4 py-3 border">Statut</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 transition-colors text-gray-800 text-sm"
                >
                  <td className="px-4 py-3 border font-medium">{item.name}</td>
                  <td className="px-4 py-3 border">{item.category}</td>
                  <td className="px-4 py-3 border">{item.stock}</td>
                  <td className="px-4 py-3 border">{item.threshold}</td>
                  <td className="px-4 py-3 border">
                    {item.stock <= item.threshold ? (
                      <span className="flex items-center text-red-600 font-semibold">
                        <AlertTriangle size={18} className="mr-2" />
                        Rupture
                      </span>
                    ) : (
                      <span className="flex items-center text-green-600 font-semibold">
                        <CheckCircle size={18} className="mr-2" />
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  Aucun produit trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockList;
