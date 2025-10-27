import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import EditModal from "./EditEdtModal";
import { useNavigate } from "react-router-dom";

export default function ListeEDT() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dateSearch, setDateSearch] = useState("");
  const [niveauFilter, setNiveauFilter] = useState("");
  const [parcoursFilter, setParcoursFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [uniqueNiveaux, setUniqueNiveaux] = useState([]);
  const [uniqueParcours, setUniqueParcours] = useState([]);

  // Niveaux standardisés
  const standardNiveaux = ["L1", "L2", "L3", "M1", "M2"];

  // Charger les événements depuis le backend
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("http://localhost:5000/api/events");
      setEvents(res.data);

      // Extraire les valeurs uniques pour les filtres
      const niveauxFromData = [
        ...new Set(res.data.map((event) => event.niveau)),
      ];

      // Combiner les niveaux standard avec ceux des données et supprimer les doublons
      const allNiveaux = [
        ...new Set([...standardNiveaux, ...niveauxFromData]),
      ].sort();

      const parcours = [
        ...new Set(res.data.map((event) => event.parcours)),
      ].sort();

      setUniqueNiveaux(allNiveaux);
      setUniqueParcours(parcours);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const referenceDate = dateSearch ? new Date(dateSearch) : new Date();
  const semaine = [];
  const firstDay = startOfWeek(referenceDate, { weekStartsOn: 1 });
  for (let i = 0; i < 6; i++) {
    semaine.push(addDays(firstDay, i));
  }

  // Appliquer les filtres
  const filteredEvents = events.filter((e) => {
    const dateInRange = semaine.some(
      (d) => new Date(e.date).toDateString() === d.toDateString()
    );

    const matchesNiveau = !niveauFilter || e.niveau === niveauFilter;
    const matchesParcours = !parcoursFilter || e.parcours === parcoursFilter;

    return dateInRange && matchesNiveau && matchesParcours;
  });

  const creneauxParJour = {};
  semaine.forEach((jourDate) => {
    const jourStr = format(jourDate, "EEEE", { locale: fr });
    creneauxParJour[jourStr] = {
      matin: filteredEvents.filter(
        (e) =>
          new Date(e.date).toDateString() === jourDate.toDateString() &&
          e.startTime < "12:00"
      ),
      apresMidi: filteredEvents.filter(
        (e) =>
          new Date(e.date).toDateString() === jourDate.toDateString() &&
          e.startTime >= "12:00"
      ),
    };
  });

  // Fonction pour obtenir une couleur basée sur le parcours
  const getParcoursColor = (parcours) => {
    const colors = {
      Informatique: "bg-blue-100 border-blue-400 text-blue-800",
      Mathématiques: "bg-purple-100 border-purple-400 text-purple-800",
      Physique: "bg-green-100 border-green-400 text-green-800",
      Chimie: "bg-yellow-100 border-yellow-400 text-yellow-800",
      Biologie: "bg-red-100 border-red-400 text-red-800",
      Économie: "bg-indigo-100 border-indigo-400 text-indigo-800",
      Droit: "bg-pink-100 border-pink-400 text-pink-800",
      Lettres: "bg-teal-100 border-teal-400 text-teal-800",
      "Génie Civil": "bg-orange-100 border-orange-400 text-orange-800",
      "Sciences Politiques": "bg-cyan-100 border-cyan-400 text-cyan-800",
    };

    return colors[parcours] || "bg-gray-100 border-gray-400 text-gray-800";
  };

  // Fonction pour obtenir une couleur basée sur le niveau
  const getNiveauColor = (niveau) => {
    const colors = {
      L1: "bg-blue-50 text-blue-700",
      L2: "bg-green-50 text-green-700",
      L3: "bg-yellow-50 text-yellow-700",
      M1: "bg-purple-50 text-purple-700",
      M2: "bg-pink-50 text-pink-700",
    };

    return colors[niveau] || "bg-gray-50 text-gray-700";
  };

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setDateSearch("");
    setNiveauFilter("");
    setParcoursFilter("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                Emploi du Temps
              </h2>
              <p className="text-gray-600 mt-1">
                Semaine du {format(semaine[0], "dd MMMM yyyy", { locale: fr })}{" "}
                au {format(semaine[5], "dd MMMM yyyy", { locale: fr })}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
              <button
                onClick={() => {
                  const headers = [
                    "Parcours",
                    "Niveau",
                    "Groupe",
                    "Date",
                    "Début",
                    "Fin",
                  ];
                  const rows = events.map((e) => [
                    e.parcours,
                    e.niveau,
                    e.groupe || "Aucun",
                    format(new Date(e.date), "yyyy-MM-dd"),
                    e.startTime,
                    e.endTime,
                  ]);
                  let csvContent =
                    "data:text/csv;charset=utf-8," +
                    [headers, ...rows]
                      .map((r) => `"${r.join('","')}"`)
                      .join("\n");
                  const link = document.createElement("a");
                  link.href = encodeURI(csvContent);
                  link.download = "emploi_du_temps.csv";
                  link.click();
                }}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Exporter CSV
              </button>

              <button
                onClick={() => navigate("/calendrier")}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Ajouter un créneau
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrer par semaine :
                </label>
                <div className="flex items-center">
                  <input
                    type="date"
                    value={dateSearch}
                    onChange={(e) => setDateSearch(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrer par niveau :
                </label>
                <select
                  value={niveauFilter}
                  onChange={(e) => setNiveauFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                >
                  <option value="">Tous les niveaux</option>
                  {uniqueNiveaux.map((niveau) => (
                    <option
                      key={niveau}
                      value={niveau}
                      className={getNiveauColor(niveau)}
                    >
                      {niveau}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrer par parcours :
                </label>
                <select
                  value={parcoursFilter}
                  onChange={(e) => setParcoursFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                >
                  <option value="">Tous les parcours</option>
                  {uniqueParcours.map((parcours) => (
                    <option key={parcours} value={parcours}>
                      {parcours}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition shadow-sm w-full justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Réinitialiser
                </button>
              </div>
            </div>

            {/* Indicateur de filtres actifs */}
            {(dateSearch || niveauFilter || parcoursFilter) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">
                  Filtres actifs :
                  {dateSearch && (
                    <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Semaine du {format(new Date(dateSearch), "dd/MM/yyyy")}
                    </span>
                  )}
                  {niveauFilter && (
                    <span
                      className={`ml-2 ${getNiveauColor(
                        niveauFilter
                      )} px-2 py-1 rounded`}
                    >
                      Niveau: {niveauFilter}
                    </span>
                  )}
                  {parcoursFilter && (
                    <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Parcours: {parcoursFilter}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="text-sm text-gray-500">Total des créneaux</div>
            <div className="text-2xl font-bold text-blue-600">
              {filteredEvents.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="text-sm text-gray-500">Créneaux du matin</div>
            <div className="text-2xl font-bold text-green-600">
              {filteredEvents.filter((e) => e.startTime < "12:00").length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="text-sm text-gray-500">
              Créneaux de l'après-midi
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {filteredEvents.filter((e) => e.startTime >= "12:00").length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="text-sm text-gray-500">Parcours concernés</div>
            <div className="text-2xl font-bold text-purple-600">
              {[...new Set(filteredEvents.map((e) => e.parcours))].length}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {semaine.map((jourDate) => {
            const jourStr = format(jourDate, "EEEE", { locale: fr });
            const isToday =
              new Date().toDateString() === jourDate.toDateString();
            const dayEvents = filteredEvents.filter(
              (e) => new Date(e.date).toDateString() === jourDate.toDateString()
            );

            return (
              <div
                key={jourStr}
                className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg ring-1 ring-blue-100"
              >
                <div className="p-3 text-center font-semibold bg-blue-500 text-white">
                  <div className="text-sm uppercase tracking-wide">
                    {format(jourDate, "EEEE", { locale: fr })}
                  </div>
                  <div className="text-lg font-bold">
                    {format(jourDate, "dd/MM", { locale: fr })}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="text-xs mt-1 font-normal">
                      {dayEvents.length} créneau
                      {dayEvents.length > 1 ? "x" : ""}
                    </div>
                  )}
                </div>

                <div className="divide-y divide-blue-100">
                  {["matin", "apresMidi"].map((periode) => (
                    <div key={periode} className="p-3">
                      <div className="font-medium text-gray-700 mb-2 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={
                              periode === "matin"
                                ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            }
                          />
                        </svg>
                        {periode === "matin" ? "Matin" : "Après-midi"}
                      </div>

                      <div className="space-y-2">
                        {creneauxParJour[jourStr][periode].length > 0 ? (
                          creneauxParJour[jourStr][periode].map((e) => (
                            <div
                              key={e._id}
                              onClick={() => setSelectedEvent(e)}
                              className={`p-2 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${getParcoursColor(
                                e.parcours
                              )}`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="font-semibold text-xl">
                                  {e.parcours}
                                </div>
                                <span
                                  className={`text-xl px-2 py-0.5 rounded-full ${getNiveauColor(
                                    e.niveau
                                  )}`}
                                >
                                  {e.niveau}
                                </span>
                              </div>
                              {e.groupe && (
                                <div className="text-xl text-gray-600 mt-1">
                                   {e.groupe}
                                </div>
                              )}
                              <div className="text-xs mt-1 flex justify-between items-center">
                                <span>
                                  {e.startTime} - {e.endTime}
                                </span>
                              </div>
                              {e.professeur && (
                                <div className="text-xs mt-1 text-gray-600 truncate">
                                  {e.professeur}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-400 text-sm py-3 bg-gray-50 rounded-lg">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 mx-auto mb-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            Aucun cours
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      <EditModal
        isOpen={!!selectedEvent}
        eventData={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onSave={(updatedEvent) => {
          setEvents((prev) =>
            prev.map((e) => (e._id === updatedEvent._id ? updatedEvent : e))
          );
          fetchEvents(); // Recharger les données pour mettre à jour les filtres
        }}
        onDelete={(idToDelete) => {
          setEvents((prev) => prev.filter((e) => e._id !== idToDelete));
          fetchEvents(); // Recharger les données pour mettre à jour les filtres
        }}
      />
    </div>
  );
}
