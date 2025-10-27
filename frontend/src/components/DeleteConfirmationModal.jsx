import React from "react";
import { AlertTriangle, X, Trash2, Ban } from "lucide-react";

const DeleteConfirmationModal = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-100">
        {/* Header avec icône d'avertissement */}
        <div className="bg-red-50 p-5 flex items-center gap-3 border-b border-red-100">
          <div className="flex-shrink-0 bg-red-100 p-3 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800">Confirmer la suppression</h3>
            <p className="text-sm text-red-600 mt-1">Action irréversible</p>
          </div>
          <button
            onClick={onCancel}
            className="ml-auto p-1 rounded-full hover:bg-red-100 transition-colors"
          >
            <X className="h-5 w-5 text-red-600" />
          </button>
        </div>
        
        {/* Contenu */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="bg-amber-100 p-2 rounded-full flex-shrink-0">
              <Trash2 className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-gray-700">
              Êtes-vous sûr de vouloir supprimer ce produit ?<br />
              <span className="text-sm text-gray-500 mt-1 block">
                Cette action ne peut pas être annulée et toutes les données associées seront définitivement perdues.
              </span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              <Ban className="h-4 w-4" />
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-sm hover:shadow-md"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer définitivement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;