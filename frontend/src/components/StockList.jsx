import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import AddStockForm from "../components/AddStockForm";
import UpdateStockForm from "./UpdateStockForm";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

import {
  Plus,
  Search,
  AlertCircle,
  Package,
  Edit,
  Trash2,
  RotateCw,
  Box,
  Download,
  FileSpreadsheet,
  Filter,
  BarChart3,
} from "lucide-react";

const StockList = () => {
  const [search, setSearch] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportingXLSX, setExportingXLSX] = useState(false);
  const navigate = useNavigate();

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

  const exportToPDF = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
    }, 1500);
  };

  const exportToXLSXAdvanced = () => {
    setExportingXLSX(true);
    setTimeout(() => {
      setExportingXLSX(false);
    }, 1500);
  };

  const handleAddClick = () => setShowAddModal(true);
  const handleEditClick = (stock) => setSelectedStock(stock);
  const handleDeleteClick = (stockId) => setDeleteConfirm(stockId);

  const confirmDelete = async (stockId) => {
    try {
      await api.delete(`/stocks/${stockId}`);
      await fetchStocks();
      setDeleteConfirm(null);
    } catch (err) {
      setError("Impossible de supprimer le stock");
    }
  };

  const cancelDelete = () => setDeleteConfirm(null);

  const filteredStocks = stocks.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Statistiques pour les badges
  const stats = {
    total: filteredStocks.length,
    inStock: stocks.filter((item) => item.stock > item.threshold).length,
    lowStock: stocks.filter((item) => item.stock <= item.threshold && item.stock > 0).length,
    outOfStock: stocks.filter((item) => item.stock === 0).length
  };

  return (
    <div className="min-h-screen bg-gray-50/30 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Gestion des Stocks
              </h1>
              <p className="text-gray-600 mt-1 lg:mt-2 text-sm lg:text-base">
                Surveillez et gérez vos niveaux de stock en temps réel
              </p>
            </div>
            
            {/* Actions Desktop */}
            <div className="hidden lg:flex gap-3">
              <button
                onClick={exportToXLSXAdvanced}
                disabled={exportingXLSX || filteredStocks.length === 0}
                className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingXLSX ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                Excel
              </button>
              <button
                onClick={exportToPDF}
                disabled={exporting || filteredStocks.length === 0}
                className="px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                PDF
              </button>
              <button
                onClick={handleAddClick}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Nouveau
              </button>
            </div>

            {/* Actions Mobile */}
            <div className="flex lg:hidden gap-2 w-full">
              <button
                onClick={exportToXLSXAdvanced}
                disabled={exportingXLSX || filteredStocks.length === 0}
                className="flex-1 px-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {exportingXLSX ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={exportToPDF}
                disabled={exporting || filteredStocks.length === 0}
                className="flex-1 px-3 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {exporting ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={handleAddClick}
                className="flex-1 px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm lg:text-base text-gray-600">Total Produits</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm lg:text-base text-gray-600">En Stock</p>
                <p className="text-2xl lg:text-3xl font-bold text-green-600 mt-1">{stats.inStock}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm lg:text-base text-gray-600">Stock Faible</p>
                <p className="text-2xl lg:text-3xl font-bold text-amber-600 mt-1">{stats.lowStock}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-5 w-5 lg:h-6 lg:w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm lg:text-base text-gray-600">Rupture</p>
                <p className="text-2xl lg:text-3xl font-bold text-red-600 mt-1">{stats.outOfStock}</p>
              </div>
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-5 w-5 lg:h-6 lg:w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="relative flex-1 max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un produit…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base transition-all duration-200"
              />
            </div>

            <div className="flex items-center gap-4 text-sm">
              <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtrer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500 text-sm lg:text-base">Chargement des stocks...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-6 lg:p-8 rounded-lg border border-red-200 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-500 font-medium text-sm lg:text-base mb-4">{error}</p>
              <button
                onClick={fetchStocks}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm lg:text-base flex items-center gap-2 mx-auto"
              >
                <RotateCw className="h-4 w-4" />
                Réessayer
              </button>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="px-4 lg:px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900">
                    Liste des Produits ({filteredStocks.length})
                  </h3>
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produit
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Actuel
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStocks.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 lg:px-6 py-12 text-center">
                          <Box className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                          <p className="text-gray-500 text-sm lg:text-base mb-2">Aucun stock trouvé</p>
                          <p className="text-gray-400 text-xs lg:text-sm">
                            {search ? "Essayez de modifier vos critères de recherche" : "Commencez par ajouter un nouveau stock"}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredStocks.map((item) => {
                        const status =
                          item.stock === 0
                            ? { text: "Rupture", color: "bg-red-100 text-red-800 border-red-200" }
                            : item.stock <= item.threshold
                            ? { text: "Stock faible", color: "bg-amber-100 text-amber-800 border-amber-200" }
                            : { text: "En stock", color: "bg-green-100 text-green-800 border-green-200" };
                        
                        return (
                          <tr key={item._id} className="hover:bg-gray-50/50 transition-colors duration-150">
                            <td className="px-4 lg:px-6 py-4">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Package className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3 lg:ml-4">
                                  <div className="text-sm lg:text-base font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                  <div className="text-xs lg:text-sm text-gray-500 mt-0.5">
                                    Réf: {item._id?.slice(-8) || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 lg:px-6 py-4">
                              <div className="text-sm lg:text-base font-semibold text-gray-900">
                                {item.stock} unités
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                Seuil: {item.threshold} unités
                              </div>
                            </td>
                            <td className="px-4 lg:px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                                {status.text}
                              </span>
                            </td>
                            <td className="px-4 lg:px-6 py-4">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleEditClick(item)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                                  title="Modifier"
                                >
                                  <Edit className="h-4 w-4 lg:h-5 lg:w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(item._id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
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
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddStockForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onStockAdded={fetchStocks}
      />
      <DeleteConfirmationModal
        isOpen={deleteConfirm !== null}
        onCancel={cancelDelete}
        onConfirm={() => confirmDelete(deleteConfirm)}
      />
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