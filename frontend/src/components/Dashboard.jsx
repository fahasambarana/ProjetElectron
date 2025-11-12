import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import api from '../services/api'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Package, 
  Users, 
  RefreshCw,
  MoreVertical,
  Download,
  Filter,
  Search,
  Bell,
  Settings,
  AlertTriangle
} from 'lucide-react';

const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeStat, setActiveStat] = useState(0);
  const [totalStocks, setTotalStocks] = useState(null);
  const [totalEmprunts, setTotalEmprunts] = useState(null);
  const [retardEmprunts, setRetardEmprunts] = useState(null);
  const [loading, setLoading] = useState({
    stocks: true,
    emprunts: true,
    retard: true
  });
  const [errors, setErrors] = useState({
    stocks: null,
    emprunts: null,
    retard: null
  });
  const [debugInfo, setDebugInfo] = useState([]);

  const addDebugInfo = (message, data = null) => {
    console.log(`🔍 DEBUG: ${message}`, data);
    setDebugInfo(prev => [...prev.slice(-9), { 
      timestamp: new Date().toLocaleTimeString(), 
      message, 
      data 
    }]);
  };

  const [chartData, setChartData] = useState({
    series: [{
      name: 'Produits en stock',
      data: [120, 140, 115, 160, 149, 180, 200, 220, 210, 230, 245, 260]
    }],
    options: {
      chart: {
        height: 350,
        type: 'line',
        zoom: { enabled: false },
        toolbar: { show: true },
        foreColor: darkMode ? '#CBD5E1' : '#64748B',
        fontFamily: 'Inter, sans-serif',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        }
      },
      dataLabels: { enabled: false },
      stroke: { 
        curve: 'smooth', 
        width: 3,
        lineCap: 'round'
      },
      colors: ['#10b981'],
      grid: {
        borderColor: darkMode ? '#334155' : '#E2E8F0',
        row: { 
          colors: [darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', 'transparent'], 
          opacity: 0.5 
        },
      },
      xaxis: {
        categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'],
        axisBorder: {
          color: darkMode ? '#334155' : '#E2E8F0',
        },
        axisTicks: {
          color: darkMode ? '#334155' : '#E2E8F0',
        },
      },
      yaxis: {
        min: 50,
        max: 300,
        labels: {
          formatter: function(val) {
            return Math.round(val);
          }
        }
      },
      title: {
        text: 'Évolution des stocks disponibles',
        align: 'left',
        style: { 
          fontSize: '18px', 
          fontWeight: 'bold',
          color: darkMode ? '#F1F5F9' : '#0F172A'
        }
      },
      tooltip: {
        theme: darkMode ? 'dark' : 'light',
        x: {
          show: true,
          formatter: function(val) {
            return `Mois: ${val}`;
          }
        }
      },
    },
  });

  const testApiConnection = async () => {
    addDebugInfo('Test de connexion API démarré');
    
    try {
      // Test de base de l'API
      const testResponse = await api.get('/');
      addDebugInfo('Test API racine', testResponse.data);
      return true;
    } catch (error) {
      addDebugInfo('Erreur test API racine', error.response?.data || error.message);
      return false;
    }
  };

  const fetchTotals = async () => {
    addDebugInfo('Début récupération des totaux');
    setLoading({ stocks: true, emprunts: true, retard: true });
    setErrors({ stocks: null, emprunts: null, retard: null });

    try {
      // Test d'abord la connexion API
      const apiConnected = await testApiConnection();
      if (!apiConnected) {
        throw new Error('API non accessible');
      }

      // Récupération des données en parallèle avec gestion d'erreur individuelle
      const promises = [
        api.get('/stocks/count').catch(err => { 
          setErrors(prev => ({ ...prev, stocks: err.response?.data?.message || 'Erreur stocks' }));
          addDebugInfo('Erreur stocks/count', err.response?.data);
          return null;
        }),
        api.get('/emprunts/count').catch(err => { 
          setErrors(prev => ({ ...prev, emprunts: err.response?.data?.message || 'Erreur emprunts' }));
          addDebugInfo('Erreur emprunts/count', err.response?.data);
          return null;
        }),
        api.get('/emprunts/retard').catch(err => { 
          setErrors(prev => ({ ...prev, retard: err.response?.data?.message || 'Erreur retard' }));
          addDebugInfo('Erreur emprunts/retard', err.response?.data);
          return null;
        })
      ];

      const [stocksRes, empruntsRes, retardRes] = await Promise.all(promises);

      addDebugInfo('Réponses API reçues', {
        stocks: stocksRes?.data,
        emprunts: empruntsRes?.data,
        retard: retardRes?.data
      });

      // Traitement des réponses avec fallback
      if (stocksRes?.data) {
        setTotalStocks(stocksRes.data.count || stocksRes.data.total || 0);
      } else {
        setTotalStocks(0);
      }

      if (empruntsRes?.data) {
        setTotalEmprunts(empruntsRes.data.count || empruntsRes.data.total || 0);
      } else {
        setTotalEmprunts(0);
      }

      if (retardRes?.data) {
        setRetardEmprunts(retardRes.data.count || 0);
      } else {
        setRetardEmprunts(0);
      }

    } catch (error) {
      console.error("Erreur générale récupération totaux:", error);
      addDebugInfo('Erreur générale', error.message);
      
      // Valeurs par défaut en cas d'erreur générale
      setTotalStocks(0);
      setTotalEmprunts(0);
      setRetardEmprunts(0);
    } finally {
      setLoading({ stocks: false, emprunts: false, retard: false });
      addDebugInfo('Récupération terminée');
    }
  };

  // Version alternative avec requêtes séquentielles pour debug
  const fetchTotalsSequential = async () => {
    addDebugInfo('Début récupération séquentielle');
    setLoading({ stocks: true, emprunts: true, retard: true });
    
    try {
      // Stocks
      try {
        addDebugInfo('Tentative stocks/count');
        const stocksRes = await api.get('/stocks/count');
        addDebugInfo('Stocks response', stocksRes.data);
        setTotalStocks(stocksRes.data.count || stocksRes.data.total || 0);
      } catch (error) {
        addDebugInfo('Erreur stocks', error.response?.data);
        setErrors(prev => ({ ...prev, stocks: error.response?.data?.message || 'Erreur stocks' }));
        setTotalStocks(0);
      }

      // Emprunts
      try {
        addDebugInfo('Tentative emprunts/count');
        const empruntsRes = await api.get('/emprunts/count');
        addDebugInfo('Emprunts response', empruntsRes.data);
        setTotalEmprunts(empruntsRes.data.count || empruntsRes.data.total || 0);
      } catch (error) {
        addDebugInfo('Erreur emprunts', error.response?.data);
        setErrors(prev => ({ ...prev, emprunts: error.response?.data?.message || 'Erreur emprunts' }));
        setTotalEmprunts(0);
      }

      // Retard
      try {
        addDebugInfo('Tentative emprunts/retard');
        const retardRes = await api.get('/emprunts/retard');
        addDebugInfo('Retard response', retardRes.data);
        setRetardEmprunts(retardRes.data.count || 0);
      } catch (error) {
        addDebugInfo('Erreur retard', error.response?.data);
        setErrors(prev => ({ ...prev, retard: error.response?.data?.message || 'Erreur retard' }));
        setRetardEmprunts(0);
      }

    } finally {
      setLoading({ stocks: false, emprunts: false, retard: false });
    }
  };

  useEffect(() => {
    // Utiliser la version séquentielle pour mieux debugger
    fetchTotalsSequential();
  }, []);

  useEffect(() => {
    setChartData(prevData => ({
      ...prevData,
      options: {
        ...prevData.options,
        chart: {
          ...prevData.options.chart,
          foreColor: darkMode ? '#CBD5E1' : '#64748B',
        },
        grid: {
          ...prevData.options.grid,
          borderColor: darkMode ? '#334155' : '#E2E8F0',
          row: { 
            colors: [darkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc', 'transparent'], 
            opacity: 0.5 
          },
        },
        xaxis: {
          ...prevData.options.xaxis,
          axisBorder: {
            color: darkMode ? '#334155' : '#E2E8F0',
          },
          axisTicks: {
            color: darkMode ? '#334155' : '#E2E8F0',
          },
        },
        title: {
          ...prevData.options.title,
          style: { 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: darkMode ? '#F1F5F9' : '#0F172A'
          }
        },
        tooltip: {
          ...prevData.options.tooltip,
          theme: darkMode ? 'dark' : 'light',
        },
      }
    }));
  }, [darkMode]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTotalsSequential();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const stats = [
    {
      title: 'Produits en Stock',
      value: loading.stocks ? '...' : (totalStocks != null ? totalStocks.toLocaleString() : '0'),
      change: '+5%',
      isPositive: true,
      icon: <Package size={24} />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      darkBgColor: 'bg-green-900/20',
      error: errors.stocks
    },
    {
      title: 'Retard des Emprunts',
      value: loading.retard ? '...' : (retardEmprunts != null ? retardEmprunts.toLocaleString() : '0'),
      change: '+2%',
      isPositive: false,
      icon: <AlertCircle size={24} />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      darkBgColor: 'bg-red-900/20',
      description: 'emprunts en retard de retour',
      error: errors.retard
    },
    {
      title: "Total d'Emprunts",
      value: loading.emprunts ? '...' : (totalEmprunts != null ? totalEmprunts.toLocaleString() : '0'),
      change: '+3',
      isPositive: true,
      icon: <Users size={24} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      darkBgColor: 'bg-blue-900/20',
      error: errors.emprunts
    }
  ];

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Inventaire</h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Suivi en temps réel de vos stocks et emprunts.
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <button 
              onClick={handleRefresh}
              className={`p-2 rounded-lg flex items-center ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-sm ${isRefreshing ? 'animate-spin' : ''}`}
              disabled={isRefreshing}
            >
              <RefreshCw size={18} />
            </button>
            <button className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
              <Bell size={18} />
            </button>
            <button className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
              <Settings size={18} />
            </button>
          </div>
        </div>
        
        {/* Barre de recherche et actions */}
        <div className={`mt-6 flex flex-wrap items-center gap-3 p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher un produit ou emprunt..." 
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
          <button className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50'} shadow-sm`}>
            <Filter size={16} />
            <span>Filtrer</span>
          </button>
          <button className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50'} shadow-sm`}>
            <Download size={16} />
            <span>Exporter</span>
          </button>
        </div>
      </header>

      {/* Messages d'erreur */}
      {(errors.stocks || errors.emprunts || errors.retard) && (
        <div className={`mb-6 p-4 rounded-lg border ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle size={20} />
            <span className="font-semibold">Erreurs de connexion</span>
          </div>
          <div className="text-sm space-y-1">
            {errors.stocks && <div>• Stocks: {errors.stocks}</div>}
            {errors.emprunts && <div>• Emprunts: {errors.emprunts}</div>}
            {errors.retard && <div>• Retard: {errors.retard}</div>}
          </div>
        </div>
      )}

      {/* Cartes de statistiques */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className={`p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } ${activeStat === index ? 'ring-2 ring-blue-500' : ''} ${
              stat.error ? 'border border-red-300' : ''
            }`}
            onClick={() => setActiveStat(index)}
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
                <p className={`mt-2 text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <div className={`mt-2 flex items-center text-sm ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span className="ml-1">{stat.change}</span>
                  <span className="ml-1">{stat.isPositive ? 'vs mois dernier' : 'de plus que prévu'}</span>
                </div>
                {stat.description && (
                  <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {stat.description}
                  </p>
                )}
                {stat.error && (
                  <p className={`mt-2 text-xs ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                    {stat.error}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-full ${darkMode ? stat.darkBgColor : stat.bgColor} ${
                stat.error ? 'opacity-50' : ''
              }`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Graphique des tendances */}
      <section className={`p-6 rounded-xl shadow-lg mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Tendance des Stocks</h2>
          <div className="flex items-center space-x-2">
            <button className={`px-3 py-1 rounded-lg text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
              Mensuel
            </button>
            <button className={`px-3 py-1 rounded-lg text-sm ${darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
              Trimestriel
            </button>
            <button className={`px-3 py-1 rounded-lg text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
              Annuel
            </button>
            <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
        <div className="h-80">
          <Chart
            options={chartData.options}
            series={chartData.series}
            type="line"
            height="100%"
          />
        </div>
      </section>

      {/* Panel de debug (visible seulement en développement) */}
      {process.env.NODE_ENV === 'development' && (
        <details className={`mt-8 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <summary className="cursor-pointer font-mono text-sm">Debug Info</summary>
          <div className="mt-2 font-mono text-xs max-h-40 overflow-y-auto">
            {debugInfo.map((info, index) => (
              <div key={index} className="border-b border-gray-300 py-1">
                <span className="text-gray-500">[{info.timestamp}]</span> {info.message}
                {info.data && (
                  <pre className="mt-1 whitespace-pre-wrap">
                    {JSON.stringify(info.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default Dashboard;