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
  Image as ImageIcon,
  Camera,
  Cpu,
  Server,
  Wifi,
  Cable,
  Settings,
  Calendar,
  Clock,
  Hash,
  TrendingDown,
  Zap,
  Eye
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
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: "" });
  const navigate = useNavigate();

  const fetchStocks = async () => {
    try {
      const res = await api.get("/stocks");
      
      // ✅ CORRECTION : S'assurer que stocks est toujours un tableau
      let stocksData = [];
      
      if (Array.isArray(res.data)) {
        // Si la réponse est directement un tableau
        stocksData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        // Si la réponse a une propriété data qui est un tableau
        stocksData = res.data.data;
      } else if (res.data && Array.isArray(res.data.stocks)) {
        // Si la réponse a une propriété stocks qui est un tableau
        stocksData = res.data.stocks;
      } else {
        // Si la structure est inattendue, logger pour debug
        console.warn("Structure de réponse inattendue:", res.data);
        stocksData = [];
      }
      
      setStocks(stocksData);
      
    } catch (err) {
      console.error("Erreur chargement stocks:", err);
      setError("Impossible de charger les stocks");
      setStocks([]); // ✅ S'assurer que stocks reste un tableau même en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const exportToPDF = () => {
    setExporting(true);
    
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Rapport des Stocks", 105, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le ${new Date().toLocaleDateString()}`, 105, 22, { align: "center" });
    
    // Préparation des données du tableau
    const tableData = filteredStocks.map(stock => [
      stock.name,
      stock.type,
      stock.stock.toString(),
      stock.threshold.toString(),
      getStockStatus(stock).text,
      Object.keys(stock.specifications || {}).length > 0 
        ? Object.entries(stock.specifications).map(([k, v]) => `${k}: ${v}`).join(', ')
        : 'Aucune',
      new Date(stock.createdAt).toLocaleDateString()
    ]);
    
    // Tableau
    doc.autoTable({
      startY: 30,
      head: [['Nom', 'Type', 'Stock', 'Seuil', 'Statut', 'Spécifications', 'Date Création']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        4: { cellWidth: 15 },
        5: { cellWidth: 25 }
      }
    });
    
    doc.save(`stocks_${new Date().toISOString().split('T')[0]}.pdf`);
    setExporting(false);
  };

  const exportToXLSXAdvanced = () => {
    setExportingXLSX(true);
    
    const data = filteredStocks.map(stock => ({
      'Nom': stock.name,
      'Type': stock.type,
      'Stock': stock.stock,
      'Seuil': stock.threshold,
      'Statut': getStockStatus(stock).text,
      'Spécifications': Object.entries(stock.specifications || {}).map(([k, v]) => `${k}: ${v}`).join('; '),
      'Photo': stock.photo ? 'Oui' : 'Non',
      'Date création': new Date(stock.createdAt).toLocaleDateString(),
      'Dernière modification': new Date(stock.updatedAt).toLocaleDateString()
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stocks");
    
    // Style automatique des colonnes
    const colWidths = [
      { wch: 25 }, // Nom
      { wch: 12 }, // Type
      { wch: 8 },  // Stock
      { wch: 8 },  // Seuil
      { wch: 12 }, // Statut
      { wch: 30 }, // Spécifications
      { wch: 8 },  // Photo
      { wch: 12 }, // Date création
      { wch: 18 }  // Dernière modification
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, `stocks_detaille_${new Date().toISOString().split('T')[0]}.xlsx`);
    setExportingXLSX(false);
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

  const openImageModal = (imageUrl) => {
    setImageModal({ isOpen: true, imageUrl });
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: "" });
  };

  // Fonction pour obtenir l'URL complète de la photo
  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    // Si le chemin commence déjà par http, le retourner tel quel
    if (photoPath.startsWith('http')) return photoPath;
    // Sinon, construire l'URL complète
    return `http://localhost:5000/${photoPath}`;
  };

  // Fonction pour obtenir le statut du stock
  const getStockStatus = (item) => {
    if (item.stock === 0) {
      return { text: "Rupture", color: "red", icon: AlertCircle };
    } else if (item.stock <= item.threshold) {
      return { text: "Stock faible", color: "amber", icon: TrendingDown };
    } else {
      return { text: "En stock", color: "green", icon: Package };
    }
  };

  // Fonction pour obtenir l'icône selon le type (pour les cas sans photo)
  const getTypeIcon = (type) => {
    const icons = {
      PC: { icon: Cpu, color: "blue", bg: "bg-blue-100", text: "text-blue-600" },
      Projecteur: { icon: Camera, color: "purple", bg: "bg-purple-100", text: "text-purple-600" },
      Switch: { icon: Server, color: "green", bg: "bg-green-100", text: "text-green-600" },
      Adaptateur: { icon: Cable, color: "orange", bg: "bg-orange-100", text: "text-orange-600" },
      Routeur: { icon: Wifi, color: "indigo", bg: "bg-indigo-100", text: "text-indigo-600" },
      Autre: { icon: Settings, color: "gray", bg: "bg-gray-100", text: "text-gray-600" }
    };
    return icons[type] || icons.Autre;
  };

  // ✅ CORRECTION : S'assurer que filteredStocks est toujours un tableau
  const filteredStocks = Array.isArray(stocks) ? stocks.filter((item) => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.type?.toLowerCase().includes(search.toLowerCase()) ||
      (item.specifications && Object.values(item.specifications).some(spec => 
        String(spec).toLowerCase().includes(search.toLowerCase())
      ));
    
    const matchesType = filterType === "all" || item.type === filterType;
    
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "out" && item.stock === 0) ||
      (filterStatus === "low" && item.stock <= item.threshold && item.stock > 0) ||
      (filterStatus === "in" && item.stock > item.threshold);
    
    return matchesSearch && matchesType && matchesStatus;
  }) : [];

  // ✅ CORRECTION : S'assurer que les statistiques fonctionnent même si stocks n'est pas un tableau
  const stats = {
    total: Array.isArray(stocks) ? stocks.length : 0,
    inStock: Array.isArray(stocks) ? stocks.filter((item) => item.stock > item.threshold).length : 0,
    lowStock: Array.isArray(stocks) ? stocks.filter((item) => item.stock <= item.threshold && item.stock > 0).length : 0,
    outOfStock: Array.isArray(stocks) ? stocks.filter((item) => item.stock === 0).length : 0,
    byType: {
      PC: Array.isArray(stocks) ? stocks.filter(item => item.type === "PC").length : 0,
      Projecteur: Array.isArray(stocks) ? stocks.filter(item => item.type === "Projecteur").length : 0,
      Switch: Array.isArray(stocks) ? stocks.filter(item => item.type === "Switch").length : 0,
      Adaptateur: Array.isArray(stocks) ? stocks.filter(item => item.type === "Adaptateur").length : 0,
      Routeur: Array.isArray(stocks) ? stocks.filter(item => item.type === "Routeur").length : 0,
      Autre: Array.isArray(stocks) ? stocks.filter(item => item.type === "Autre").length : 0
    },
    withPhotos: Array.isArray(stocks) ? stocks.filter(item => item.photo).length : 0
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Gestion des Stocks
                </h1>
              </div>
              <p className="text-gray-600 text-sm lg:text-base">
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
                Nouveau Stock
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

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* Total Products */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Produits</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                <div className="flex gap-2 mt-3">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                    📸 {stats.withPhotos} avec photo
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* In Stock */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Stock</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.inStock}</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {stats.total > 0 ? `${((stats.inStock / stats.total) * 100).toFixed(1)}% du total` : '0% du total'}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Low Stock */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Faible</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">{stats.lowStock}</p>
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Attention nécessaire
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-sm">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Out of Stock */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rupture</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.outOfStock}</p>
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Réapprovisionnement urgent
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-sm">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/20 mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="relative flex-1 max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher par nom, type ou spécifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">Tous les types</option>
                <option value="PC">PC</option>
                <option value="Projecteur">Projecteur</option>
                <option value="Switch">Switch</option>
                <option value="Adaptateur">Adaptateur</option>
                <option value="Routeur">Routeur</option>
                <option value="Autre">Autre</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="in">En stock</option>
                <option value="low">Stock faible</option>
                <option value="out">Rupture</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enhanced Table Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 overflow-hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500">Chargement des stocks...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-8 rounded-lg border border-red-200 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-500 font-medium mb-4">{error}</p>
              <button
                onClick={fetchStocks}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <RotateCw className="h-4 w-4" />
                Réessayer
              </button>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Inventaire des Stocks
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {filteredStocks.length} produit(s) trouvé(s)
                      {filterType !== "all" && ` • Type: ${filterType}`}
                      {filterStatus !== "all" && ` • Statut: ${
                        filterStatus === "in" ? "En stock" : 
                        filterStatus === "low" ? "Stock faible" : "Rupture"
                      }`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    Mis à jour: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Produit
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Spécifications
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStocks.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <Box className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                          <p className="text-gray-500 text-lg mb-2">Aucun stock trouvé</p>
                          <p className="text-gray-400 text-sm">
                            {search || filterType !== "all" || filterStatus !== "all" 
                              ? "Aucun résultat pour vos critères de recherche" 
                              : "Commencez par ajouter votre premier stock"}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredStocks.map((item) => {
                        const status = getStockStatus(item);
                        const typeConfig = getTypeIcon(item.type);
                        const TypeIcon = typeConfig.icon;
                        const hasSpecifications = Object.keys(item.specifications || {}).length > 0;
                        const photoUrl = getPhotoUrl(item.photo);
                        
                        return (
                          <tr key={item._id} className="hover:bg-blue-50/30 transition-all duration-200 group">
                            {/* Product Column with Photo */}
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="relative group/photo">
                                  {photoUrl ? (
                                    <>
                                      <img
                                        src={photoUrl}
                                        alt={item.name}
                                        className="h-14 w-14 rounded-xl object-cover border-2 border-gray-200 group-hover:border-blue-300 transition-all duration-200 cursor-pointer shadow-sm"
                                        onClick={() => openImageModal(photoUrl)}
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/photo:bg-opacity-20 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer">
                                        <Eye className="h-5 w-5 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity duration-200" />
                                      </div>
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                                    </>
                                  ) : (
                                    <div className={`h-14 w-14 flex-shrink-0 ${typeConfig.bg} rounded-xl flex items-center justify-center border-2 border-gray-200 group-hover:border-blue-300 transition-all duration-200`}>
                                      <TypeIcon className={`h-6 w-6 ${typeConfig.text}`} />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {item.name}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                    <Hash className="h-3 w-3" />
                                    ID: {item._id?.slice(-8) || 'N/A'}
                                  </div>
                                  {!photoUrl && (
                                    <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                      <Camera className="h-3 w-3" />
                                      Aucune photo
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Type Column */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 ${typeConfig.bg} rounded-lg`}>
                                  <TypeIcon className={`h-4 w-4 ${typeConfig.text}`} />
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {item.type}
                                </span>
                              </div>
                            </td>

                            {/* Stock Column */}
                            <td className="px-6 py-4">
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">
                                  {item.stock}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Seuil: {item.threshold}
                                </div>
                                {item.stock > 0 && (
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                    <div 
                                      className={`h-1.5 rounded-full ${
                                        item.stock > item.threshold ? 'bg-green-500' : 'bg-amber-500'
                                      }`}
                                      style={{ 
                                        width: `${Math.min((item.stock / (item.threshold * 2)) * 100, 100)}%` 
                                      }}
                                    ></div>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Specifications Column */}
                            <td className="px-6 py-4">
                              {hasSpecifications ? (
                                <div className="space-y-1 max-w-xs">
                                  {Object.entries(item.specifications).slice(0, 3).map(([key, value]) => (
                                    <div key={key} className="text-xs text-gray-600 flex items-center gap-1">
                                      <span className="font-medium text-gray-700">{key}:</span> 
                                      <span className="truncate">{String(value)}</span>
                                    </div>
                                  ))}
                                  {Object.keys(item.specifications).length > 3 && (
                                    <div className="text-blue-600 text-xs font-medium mt-1">
                                      +{Object.keys(item.specifications).length - 3} autres
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Aucune spécification</span>
                              )}
                            </td>

                            {/* Date Column */}
                            <td className="px-6 py-4">
                              <div className="text-xs text-gray-600 space-y-1">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Créé: {formatDate(item.createdAt)}
                                </div>
                                {item.updatedAt !== item.createdAt && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Modifié: {formatDate(item.updatedAt)}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Status Column */}
                            <td className="px-6 py-4">
                              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${
                                status.color === 'red' ? 'bg-red-50 text-red-700 border-red-200' :
                                status.color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-green-50 text-green-700 border-green-200'
                              }`}>
                                <status.icon className="h-3 w-3 mr-1.5" />
                                {status.text}
                              </div>
                            </td>

                            {/* Actions Column */}
                            <td className="px-6 py-4">
                              <div className="flex justify-end space-x-1">
                                <button
                                  onClick={() => handleEditClick(item)}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 transform hover:scale-110"
                                  title="Modifier"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(item._id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 transform hover:scale-110"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
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

      {/* Image Preview Modal */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={imageModal.imageUrl}
              alt="Aperçu"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={closeImageModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <div className="bg-gray-800 rounded-full p-2">
                <Trash2 className="h-6 w-6" />
              </div>
            </button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <button
                onClick={closeImageModal}
                className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

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