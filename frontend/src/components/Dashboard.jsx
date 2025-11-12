import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import axios from 'axios';
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
  HelpCircle,
  Settings
} from 'lucide-react';

const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeStat, setActiveStat] = useState(0);
  const [totalStocks, setTotalStocks] = useState(null);
  const [totalEmprunts, setTotalEmprunts] = useState(null);

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

  const fetchTotals = async () => {
    try {
      const [stocksRes, empruntsRes] = await Promise.all([
        api.get('/stocks/count'),
        api.get('/emprunts/count')
      ]);
      setTotalStocks(stocksRes.data.count);
      setTotalEmprunts(empruntsRes.data.count);
    } catch (error) {
      console.error("Erreur récupération totaux :", error);
    }
  };

  useEffect(() => {
    fetchTotals();
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
    fetchTotals();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const stats = [
    {
      title: 'Produits en Stock',
      value: totalStocks != null ? totalStocks.toLocaleString() : '...',
      change: '+5%',
      isPositive: true,
      icon: <Package size={24} />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      darkBgColor: 'bg-green-900/20'
    },
    {
      title: 'Produits en Rupture',
      value: '142',
      change: '+2%',
      isPositive: false,
      icon: <AlertCircle size={24} />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      darkBgColor: 'bg-red-900/20'
    },
    {
      title: "Nombre d'Emprunts",
      value: totalEmprunts != null ? totalEmprunts.toLocaleString() : '...',
      change: '+3',
      isPositive: true,
      icon: <Users size={24} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      darkBgColor: 'bg-blue-900/20'
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
              Suivi en temps réel de vos stocks et approvisionnements.
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
        <div className={`mt-6 flex flex-wrap items-center gap-3 p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher un produit..." 
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
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className={`p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } ${activeStat === index ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setActiveStat(index)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {stat.title}
                </h2>
                <p className={`mt-2 text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <div className={`mt-2 flex items-center text-sm ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span className="ml-1">{stat.change}</span>
                  <span className="ml-1">{stat.isPositive ? 'vs mois dernier' : 'de plus que prévu'}</span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${darkMode ? stat.darkBgColor : stat.bgColor}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </section>
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
      {/* Le reste du dashboard inchangé */}
    </div>
  );
};

export default Dashboard;
