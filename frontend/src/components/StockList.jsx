import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import AddStockForm from "../components/AddStockForm";
import UpdateStockForm from "./UpdateStockForm";
import { 
  Plus, 
  Search, 
  AlertCircle, 
  Package, 
  Edit, 
  Trash2,
  RotateCw,
  Box
} from "lucide-react";

const StockList = () => {
  const [search, setSearch] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  // Récupération des stocks
  const fetchStocks = async () => {
    try {
      const res = await api.get("/stocks");
      setStocks(res.data);
    } catch (err) {
      setError("Impossible de charger les stocks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  // Ouvrir modale ajout
  const handleAddClick = () => setShowAddModal(true);

  // Ouvrir modale édition
  const handleEditClick = (stock) => setSelectedStock(stock);

  // Ouvrir modale suppression
  const handleDeleteClick = (stockId) => setDeleteConfirm(stockId);

  // Confirmer suppression
  const confirmDelete = async (stockId) => {
    try {
      console.log("Suppression stockId :", stockId);
      await api.delete(`/stocks/${stockId}`);
      setStocks(stocks.filter((s) => s._id !== stockId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer le stock");
    }
  };

  // Annuler suppression
  const cancelDelete = () => setDeleteConfirm(null);

  // Filtrage par recherche
  const filteredStocks = stocks.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Gestion des Stocks
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Suivez et gérez vos niveaux de stock
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Nouveau stock
        </button>
      </div>

      {/* Barre recherche + stats */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            {filteredStocks.length} produits
          </span>
          <span className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-green-400 mr-1"></span>
            <span className="text-gray-600">
              {stocks.filter((item) => item.stock > item.threshold).length} en
              stock
            </span>
          </span>
          <span className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-amber-400 mr-1"></span>
            <span className="text-gray-600">
              {
                stocks.filter(
                  (item) => item.stock <= item.threshold && item.stock > 0
                ).length
              }{" "}
              stock faible
            </span>
          </span>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 text-sm">Chargement des stocks...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-5 rounded-lg border border-red-200 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-500 font-medium text-sm">{error}</p>
          <button
            onClick={fetchStocks}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2 mx-auto"
          >
            <RotateCw className="h-4 w-4" />
            Réessayer
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seuil Min
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    <Box className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4">Aucun stock trouvé.</p>
                  </td>
                </tr>
              ) : (
                filteredStocks.map((item) => {
                  const status =
                    item.stock === 0
                      ? { text: "Rupture", color: "bg-red-100 text-red-800" }
                      : item.stock <= item.threshold
                      ? {
                          text: "Stock faible",
                          color: "bg-amber-100 text-amber-800",
                        }
                      : {
                          text: "En stock",
                          color: "bg-green-100 text-green-800",
                        };

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.stock} unités
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.threshold} unités
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}
                        >
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-150"
                            title="Modifier"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item._id)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-150"
                            title="Supprimer"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modale d'ajout */}
      <AddStockForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onStockAdded={fetchStocks}
      />

      {/* Modale de confirmation suppression */}
      <DeleteConfirmationModal
        isOpen={deleteConfirm !== null}
        onCancel={cancelDelete}
        onConfirm={() => confirmDelete(deleteConfirm)}
      />

      {/* Modale mise à jour */}
      <UpdateStockForm
        isOpen={!!selectedStock}
        onClose={() => setSelectedStock(null)}
        stockId={selectedStock?._id}
        onStockUpdated={fetchStocks}
      />
    </div>
  );
};

export default StockList;