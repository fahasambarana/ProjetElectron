import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import AddStockForm from "../components/AddStockForm";
import UpdateStockForm from "./UpdateStockForm";
import jsPDF  from "jspdf";
import "jspdf-autotable";

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

    try {
      // Créer une nouvelle instance de jsPDF
      const doc = new jsPDF();

      // Titre principal
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text("LISTE DES STOCKS", 105, 15, { align: "center" });

      // Date d'export
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Export du ${new Date().toLocaleDateString("fr-FR")}`, 105, 22, {
        align: "center",
      });

      // Statistiques
      doc.setFontSize(9);
      doc.text(
        `Total: ${filteredStocks.length} produits | ` +
          `En stock: ${
            stocks.filter((item) => item.stock > item.threshold).length
          } | ` +
          `Stock faible: ${
            stocks.filter(
              (item) => item.stock <= item.threshold && item.stock > 0
            ).length
          } | ` +
          `Rupture: ${stocks.filter((item) => item.stock === 0).length}`,
        14,
        30
      );

      // Préparer les données du tableau
      const tableData = filteredStocks.map((item) => [
        item.name,
        `${item.stock} unités`,
        `${item.threshold} unités`,
        item.stock === 0
          ? "Rupture"
          : item.stock <= item.threshold
          ? "Stock faible"
          : "En stock",
      ]);

      // Créer le tableau avec autoTable
      doc.autoTable({
        head: [["Produit", "Stock Actuel", "Seuil Minimum", "Statut"]],
        body: tableData,
        startY: 35,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [40, 40, 40],
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: 30 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25 },
        },
        didDrawCell: (data) => {
          // Colorer les cellules de statut
          if (data.column.index === 3 && data.cell.section === "body") {
            const status = data.cell.raw;
            if (status === "Rupture") {
              doc.setTextColor(220, 38, 38);
            } else if (status === "Stock faible") {
              doc.setTextColor(217, 119, 6);
            } else {
              doc.setTextColor(5, 150, 105);
            }
          }
        },
      });

      // Pied de page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${i} sur ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Sauvegarder le PDF
      doc.save(`stocks_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      setError("Erreur lors de l'export PDF");
    } finally {
      setExporting(false);
    }
  };

  // Option alternative simplifiée (sans autoTable)
  const exportToPDFSimple = () => {
    setExporting(true);

    try {
      const doc = new jsPDF();

      // Titre
      doc.setFontSize(16);
      doc.text("Liste des Stocks", 20, 20);
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 20, 30);

      let yPosition = 50;
      const lineHeight = 10;

      // En-tête du tableau
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Produit", 20, yPosition);
      doc.text("Stock", 80, yPosition);
      doc.text("Seuil", 110, yPosition);
      doc.text("Statut", 140, yPosition);

      yPosition += lineHeight;
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);

      // Ligne séparatrice
      doc.line(20, yPosition - 2, 190, yPosition - 2);
      yPosition += 5;

      // Données
      filteredStocks.forEach((item, index) => {
        if (yPosition > 280) {
          // Nouvelle page si nécessaire
          doc.addPage();
          yPosition = 20;
        }

        const status =
          item.stock === 0
            ? "Rupture"
            : item.stock <= item.threshold
            ? "Stock faible"
            : "En stock";

        // Couleur selon le statut
        if (status === "Rupture") {
          doc.setTextColor(220, 38, 38);
        } else if (status === "Stock faible") {
          doc.setTextColor(217, 119, 6);
        } else {
          doc.setTextColor(5, 150, 105);
        }

        doc.text(item.name, 20, yPosition);
        doc.setTextColor(0, 0, 0); // Réinitialiser la couleur
        doc.text(`${item.stock} unités`, 80, yPosition);
        doc.text(`${item.threshold} unités`, 110, yPosition);
        doc.text(status, 140, yPosition);

        yPosition += lineHeight;
      });

      // Statistiques en bas
      yPosition += 10;
      doc.setFontSize(9);
      doc.text(
        `Total: ${filteredStocks.length} produits | ` +
          `En stock: ${
            stocks.filter((item) => item.stock > item.threshold).length
          } | ` +
          `Stock faible: ${
            stocks.filter(
              (item) => item.stock <= item.threshold && item.stock > 0
            ).length
          } | ` +
          `Rupture: ${stocks.filter((item) => item.stock === 0).length}`,
        20,
        yPosition
      );

      doc.save(`stocks_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      setError("Erreur lors de l'export PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleAddClick = () => setShowAddModal(true);
  const handleEditClick = (stock) => setSelectedStock(stock);
  const handleDeleteClick = (stockId) => setDeleteConfirm(stockId);

  const confirmDelete = async (stockId) => {
    try {
      await api.delete(`/stocks/${stockId}`);
      await fetchStocks(); // recharger la liste après suppression
      setDeleteConfirm(null);
    } catch (err) {
      setError("Impossible de supprimer le stock");
    }
  };

  const cancelDelete = () => setDeleteConfirm(null);

  // Filtrage par recherche
  const filteredStocks = stocks.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Gestion des Stocks
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Suivez et gérez vos niveaux de stock
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToPDF}
            className="px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button
            onClick={handleAddClick}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Nouveau stock
          </button>
        </div>
      </div>

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

      {/* Modale ajout */}
      <AddStockForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onStockAdded={fetchStocks} // recharge la liste après ajout
      />
      {/* Modale suppression */}
      <DeleteConfirmationModal
        isOpen={deleteConfirm !== null}
        onCancel={cancelDelete}
        onConfirm={() => confirmDelete(deleteConfirm)}
      />
      {/* Modale modif */}
      <UpdateStockForm
        isOpen={!!selectedStock}
        onClose={() => setSelectedStock(null)}
        stockId={selectedStock?._id}
        onStockUpdated={fetchStocks} // recharge la liste après édition
      />
    </div>
  );
};

export default StockList;
