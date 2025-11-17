import React, { useState, useEffect } from 'react';
import api from '../services/api'
import { 
  Package, 
  Users, 
  Clock,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Cpu,
  Camera,
  Server,
  Wifi,
  Cable,
  Settings
} from 'lucide-react';

const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState({
    stocks: true,
    emprunts: true,
    retard: true,
    dernierEmprunts: true,
    recentStocks: true,
    alertes: true
  });
  const [errors, setErrors] = useState({
    stocks: null,
    emprunts: null,
    retard: null,
    dernierEmprunts: null,
    recentStocks: null,
    alertes: null
  });
  const [data, setData] = useState({
    totalStocks: 0,
    totalEmprunts: 0,
    retardEmprunts: 0,
    dernierEmprunts: [],
    recentStocks: [],
    alertes: []
  });

  // Fonction pour obtenir l'icône selon le type de matériel
  const getMaterielIcon = (type) => {
    const icons = {
      PC: { icon: Cpu, color: "text-blue-600", bg: "bg-blue-100" },
      Projecteur: { icon: Camera, color: "text-purple-600", bg: "bg-purple-100" },
      Switch: { icon: Server, color: "text-green-600", bg: "bg-green-100" },
      Adaptateur: { icon: Cable, color: "text-orange-600", bg: "bg-orange-100" },
      Routeur: { icon: Wifi, color: "text-indigo-600", bg: "bg-indigo-100" },
      Autre: { icon: Settings, color: "text-gray-600", bg: "bg-gray-100" }
    };
    return icons[type] || icons.Autre;
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fonction pour calculer les jours de retard
  const calculerJoursRetard = (dateRetour) => {
    if (!dateRetour) return 0;
    const dateRetourObj = new Date(dateRetour);
    const aujourdHui = new Date();
    const diffTime = aujourdHui - dateRetourObj;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Charger toutes les données
  const fetchAllData = async () => {
    setLoading({
      stocks: true,
      emprunts: true,
      retard: true,
      dernierEmprunts: true,
      recentStocks: true,
      alertes: true
    });

    try {
      // Récupération des données en parallèle
      const [
        stocksRes,
        empruntsRes,
        retardRes,
        empruntsListRes,
        stocksListRes,
        alertesRes
      ] = await Promise.allSettled([
        api.get('/stocks/count'),
        api.get('/emprunts/count'),
        api.get('/emprunts/retard'),
        api.get('/emprunts?limit=3'),
        api.get('/stocks?limit=3'),
        api.get('/alertes/alertes-actives?limit=3')
      ]);

      // Traitement des résultats - limiter à 3 éléments maximum
      setData(prev => ({
        ...prev,
        totalStocks: stocksRes.status === 'fulfilled' ? 
          (stocksRes.value.data.count || stocksRes.value.data.total || 0) : 0,
        totalEmprunts: empruntsRes.status === 'fulfilled' ? 
          (empruntsRes.value.data.count || empruntsRes.value.data.total || 0) : 0,
        retardEmprunts: retardRes.status === 'fulfilled' ? 
          (retardRes.value.data.count || 0) : 0,
        dernierEmprunts: empruntsListRes.status === 'fulfilled' ? 
          (empruntsListRes.value.data.data || empruntsListRes.value.data || []).slice(0, 3) : [],
        recentStocks: stocksListRes.status === 'fulfilled' ? 
          (stocksListRes.value.data.data || stocksListRes.value.data || []).slice(0, 3) : [],
        alertes: alertesRes.status === 'fulfilled' ? 
          (alertesRes.value.data.data || alertesRes.value.data || []).slice(0, 3) : []
      }));

      // Gestion des erreurs
      setErrors({
        stocks: stocksRes.status === 'rejected' ? 'Erreur chargement stocks' : null,
        emprunts: empruntsRes.status === 'rejected' ? 'Erreur chargement emprunts' : null,
        retard: retardRes.status === 'rejected' ? 'Erreur chargement retards' : null,
        dernierEmprunts: empruntsListRes.status === 'rejected' ? 'Erreur chargement derniers emprunts' : null,
        recentStocks: stocksListRes.status === 'rejected' ? 'Erreur chargement stocks récents' : null,
        alertes: alertesRes.status === 'rejected' ? 'Erreur chargement alertes' : null
      });

    } catch (error) {
      console.error('Erreur générale:', error);
    } finally {
      setLoading({
        stocks: false,
        emprunts: false,
        retard: false,
        dernierEmprunts: false,
        recentStocks: false,
        alertes: false
      });
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const stats = [
    {
      title: 'Produits en Stock',
      value: loading.stocks ? '...' : data.totalStocks.toLocaleString(),
      icon: <Package size={24} />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      darkBgColor: 'bg-green-900/20',
      error: errors.stocks
    },
    {
      title: "Total d'Emprunts",
      value: loading.emprunts ? '...' : data.totalEmprunts.toLocaleString(),
      icon: <Users size={24} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      darkBgColor: 'bg-blue-900/20',
      error: errors.emprunts
    },
    {
      title: 'Emprunts en Retard',
      value: loading.retard ? '...' : data.retardEmprunts.toLocaleString(),
      icon: <Clock size={24} />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      darkBgColor: 'bg-red-900/20',
      error: errors.retard
    }
  ];

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tableau de Bord Inventaire</h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Vue d'ensemble de votre gestion de stock et emprunts
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-lg transition-all ${
                darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
              } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Messages d'erreur */}
      {Object.values(errors).some(error => error) && (
        <div className={`mb-6 p-4 rounded-lg border ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle size={20} />
            <span className="font-semibold">Erreurs de chargement</span>
          </div>
          <div className="text-sm space-y-1">
            {Object.entries(errors).map(([key, error]) => 
              error && <div key={key}>• {error}</div>
            )}
          </div>
        </div>
      )}

      {/* Cartes de statistiques */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className={`p-6 rounded-xl shadow-lg transition-all duration-300 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } ${stat.error ? 'border border-red-300' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {stat.title}
                  </h2>
                  {stat.error && (
                    <AlertTriangle size={16} className="text-red-500" />
                  )}
                </div>
                <p className={`text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? stat.darkBgColor : stat.bgColor}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Grille des listes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Derniers emprunts */}
        <section className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users size={20} />
              Derniers Emprunts
            </h2>
            <span className={`text-sm px-2 py-1 rounded-full ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {loading.dernierEmprunts ? '...' : data.dernierEmprunts.length}/3
            </span>
          </div>
          
          <div className="space-y-4">
            {loading.dernierEmprunts ? (
              <div className="text-center py-8">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chargement...</p>
              </div>
            ) : data.dernierEmprunts.length === 0 ? (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Aucun emprunt récent</p>
              </div>
            ) : (
              data.dernierEmprunts.map((emprunt) => {
                const IconComponent = getMaterielIcon(emprunt.materiel?.type).icon;
                const joursRetard = calculerJoursRetard(emprunt.dateRetour);
                const estEnRetard = joursRetard > 0 && !emprunt.heureEntree;

                return (
                  <div 
                    key={emprunt._id}
                    className={`p-4 rounded-lg border transition-all ${
                      darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                    } ${estEnRetard ? 'border-red-300 bg-red-50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          darkMode ? 'bg-gray-600' : 'bg-white'
                        }`}>
                          <IconComponent size={16} className={
                            estEnRetard ? 'text-red-500' : 'text-blue-500'
                          } />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">
                            {emprunt.materiel?.name || 'Matériel inconnu'}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {emprunt.prenoms} • {emprunt.matricule}
                          </p>
                        </div>
                      </div>
                      {estEnRetard && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                          +{joursRetard}j
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Sorti: {formatDate(emprunt.dateEmprunt)}</span>
                      <div className="flex items-center gap-1">
                        {emprunt.heureEntree ? (
                          <CheckCircle size={12} className="text-green-500" />
                        ) : (
                          <Clock size={12} className="text-amber-500" />
                        )}
                        <span>{emprunt.heureEntree ? 'Rendu' : 'En cours'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Matériels récemment ajoutés */}
        <section className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Package size={20} />
              Matériels Récents
            </h2>
            <span className={`text-sm px-2 py-1 rounded-full ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {loading.recentStocks ? '...' : data.recentStocks.length}/3
            </span>
          </div>
          
          <div className="space-y-4">
            {loading.recentStocks ? (
              <div className="text-center py-8">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chargement...</p>
              </div>
            ) : data.recentStocks.length === 0 ? (
              <div className="text-center py-8">
                <Package size={48} className="mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Aucun matériel récent</p>
              </div>
            ) : (
              data.recentStocks.map((stock) => {
                const IconComponent = getMaterielIcon(stock.type).icon;
                const statutStock = stock.stock === 0 ? 
                  { text: 'Rupture', color: 'text-red-600', bg: 'bg-red-100' } :
                  stock.stock <= stock.threshold ? 
                  { text: 'Stock faible', color: 'text-amber-600', bg: 'bg-amber-100' } :
                  { text: 'En stock', color: 'text-green-600', bg: 'bg-green-100' };

                return (
                  <div 
                    key={stock._id}
                    className={`p-4 rounded-lg border transition-all ${
                      darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          darkMode ? getMaterielIcon(stock.type).bg.replace('bg-', 'bg-').replace('100', '900/20') : 
                          getMaterielIcon(stock.type).bg
                        }`}>
                          <IconComponent size={16} className={
                            darkMode ? getMaterielIcon(stock.type).color.replace('text-', 'text-').replace('600', '300') : 
                            getMaterielIcon(stock.type).color
                          } />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{stock.name}</h3>
                          <p className="text-xs text-gray-500">{stock.type}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        darkMode ? 
                        statutStock.bg.replace('bg-', 'bg-').replace('100', '900/20') + ' ' + statutStock.color.replace('text-', 'text-').replace('600', '300') :
                        statutStock.bg + ' ' + statutStock.color
                      }`}>
                        {statutStock.text}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="font-semibold">{stock.stock}</span>
                        <span className="text-gray-500"> unités</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Seuil: {stock.threshold}
                      </div>
                    </div>

                    {stock.specifications && Object.keys(stock.specifications).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {Object.entries(stock.specifications).slice(0, 2).map(([key]) => (
                          <span key={key} className="mr-2">• {key}</span>
                        ))}
                        {Object.keys(stock.specifications).length > 2 && (
                          <span>+{Object.keys(stock.specifications).length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Alertes des emprunts */}
        <section className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AlertTriangle size={20} />
              Alertes Actives
            </h2>
            <span className={`text-sm px-2 py-1 rounded-full ${
              darkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-100 text-red-600'
            }`}>
              {loading.alertes ? '...' : data.alertes.length}/3
            </span>
          </div>
          
          <div className="space-y-4">
            {loading.alertes ? (
              <div className="text-center py-8">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chargement...</p>
              </div>
            ) : data.alertes.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto mb-2 text-green-400" />
                <p className="text-gray-500">Aucune alerte active</p>
                <p className="text-sm text-gray-400 mt-1">Tout est sous contrôle</p>
              </div>
            ) : (
              data.alertes.map((alerte) => {
                const joursRetard = calculerJoursRetard(alerte.dateRetourPrevue);
                
                return (
                  <div 
                    key={alerte._id}
                    className="p-4 rounded-lg border border-red-200 bg-red-50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-100">
                          <AlertTriangle size={16} className="text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-red-800">
                            Retard de retour
                          </h3>
                          <p className="text-xs text-red-600">
                            {alerte.empruntId?.prenoms} • {alerte.empruntId?.matricule}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">
                        +{joursRetard}j
                      </span>
                    </div>
                    
                    <div className="text-xs text-red-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Matériel:</span>
                        <span className="font-medium">{alerte.empruntId?.materiel?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date de retour prévue:</span>
                        <span>{formatDate(alerte.dateRetourPrevue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dépassement:</span>
                        <span>{joursRetard} jour(s)</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;