import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Package, 
  Users, 
  BarChart3,
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

  // Toggle dark mode
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

  // Simulation de mise à jour des stocks
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = chartData.series[0].data.map(value =>
        Math.max(50, value + Math.floor(Math.random() * 30) - 15)
      );

      setChartData({
        ...chartData,
        series: [{ name: 'Produits en stock', data: newData }]
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [chartData]);

  // Simulate refresh action
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  // Stats data
  const stats = [
    {
      title: 'Produits en Stock',
      value: '8,245',
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
      title: 'Fournisseurs Actifs',
      value: '32',
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
            {/* <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button> */}
            
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
        
        {/* Quick Actions */}
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

      {/* Statistiques principales avec animation */}
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
            
            {/* Mini chart for each stat */}
            <div className="mt-4 h-[60px]">
              <Chart
                options={{
                  chart: {
                    type: 'area',
                    sparkline: { enabled: true },
                    animations: { enabled: false }
                  },
                  stroke: {
                    curve: 'smooth',
                    width: 2,
                    colors: [stat.isPositive ? '#10b981' : '#ef4444']
                  },
                  fill: {
                    type: 'gradient',
                    gradient: {
                      shadeIntensity: 1,
                      opacityFrom: 0.7,
                      opacityTo: 0.1,
                      stops: [0, 90, 100]
                    }
                  },
                  tooltip: { enabled: false },
                  colors: [stat.isPositive ? '#10b981' : '#ef4444'],
                }}
                series={[{
                  name: stat.title,
                  data: stat.isPositive 
                    ? [30, 40, 35, 50, 49, 60, 70, 91, 85, 110, 120, 138]
                    : [142, 135, 140, 138, 145, 143, 142, 148, 145, 142, 140, 142]
                }]}
                type="area"
                height="100%"
              />
            </div>
          </div>
        ))}
      </section>

      {/* Graph d'évolution */}
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

      {/* Graphique + Objectifs */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Donut */}
        <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Répartition par Catégories</h2>
            <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="h-64">
            <Chart
              options={{
                chart: { 
                  type: 'donut',
                  foreColor: darkMode ? '#CBD5E1' : '#64748B',
                },
                labels: ['Électronique', 'Alimentation', 'Vêtements', 'Bureautique', 'Autres'],
                colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                legend: { 
                  position: 'bottom',
                  labels: {
                    colors: darkMode ? '#CBD5E1' : undefined
                  }
                },
                dataLabels: {
                  enabled: true,
                  formatter: function (val) {
                    return Math.round(val) + "%";
                  },
                  style: {
                    fontSize: '12px',
                    fontWeight: 'bold',
                    colors: ['#fff']
                  },
                  dropShadow: {
                    enabled: true,
                    top: 1,
                    left: 1,
                    blur: 1,
                    opacity: 0.45
                  }
                },
                plotOptions: {
                  pie: { 
                    donut: { 
                      size: '45%',
                      labels: {
                        show: true,
                        total: {
                          show: true,
                          label: 'Total',
                          color: darkMode ? '#CBD5E1' : '#64748B',
                          formatter: function (w) {
                            return w.globals.seriesTotals.reduce((a, b) => a + b, 0).toFixed(0) + '%';
                          }
                        }
                      }
                    } 
                  }
                },
                responsive: [{
                  breakpoint: 480,
                  options: {
                    chart: { width: 200 },
                    legend: { position: 'bottom' }
                  }
                }]
              }}
              series={[35, 25, 20, 10, 10]}
              type="donut"
              height="100%"
            />
          </div>
        </div>

        {/* Objectifs */}
        <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Objectifs Inventaire</h2>
            <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <MoreVertical size={16} />
            </button>
          </div>
          <div className="space-y-6">
            {[
              { label: 'Réduction des ruptures', value: 70, color: 'bg-red-500' },
              { label: 'Rotation du stock', value: 55, color: 'bg-green-500' },
              { label: 'Commandes Fournisseurs', value: 80, color: 'bg-blue-500' },
              { label: 'Taux d’Occupation Entrepôt', value: 65, color: 'bg-purple-500' }
            ].map((goal, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{goal.label}</span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{goal.value}%</span>
                </div>
                <div className={`w-full bg-gray-200 rounded-full h-2.5 ${darkMode ? 'bg-gray-700' : ''}`}>
                  <div 
                    className={`h-2.5 rounded-full ${goal.color} transition-all duration-1000 ease-out`} 
                    style={{ width: `${goal.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className={`mt-8 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} border ${darkMode ? 'border-gray-600' : 'border-blue-100'}`}>
            <div className="flex items-start">
              <HelpCircle size={20} className={`mt-0.5 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                Votre objectif de rotation du stock est en dessous de la cible. 
                <span className="font-medium"> Planifiez des promotions pour augmenter la vente des produits lents.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Alertes et Notifications */}
     
    </div>
  );
};

export default Dashboard;