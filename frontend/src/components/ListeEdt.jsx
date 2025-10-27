import React, { useState, useEffect, useRef } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import html2canvas from "html2canvas";
import EditModal from "./EditEdtModal";

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
  const [isExporting, setIsExporting] = useState(false);

  const edtRef = useRef(null); // Référence pour la capture d'écran

  const standardNiveaux = ["L1", "L2", "L3", "M1", "M2"];

  // Charger les événements depuis le backend
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/events");
      setEvents(res.data);

      const niveauxFromData = [
        ...new Set(res.data.map((event) => event.niveau)),
      ];

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

  // Fonction pour exporter en PNG avec cadrage optimisé
  const exportToPNG = async () => {
    if (!edtRef.current) return;

    setIsExporting(true);

    // Masquer temporairement les éléments .no-export
    const elementsToHide = edtRef.current.querySelectorAll(".no-export");
    const originalStyles = [];

    elementsToHide.forEach((el) => {
      originalStyles.push({
        element: el,
        display: el.style.display,
      });
      el.style.display = "none";
    });

    // Sauvegarder les styles originaux
    const originalContainerStyle = {
      margin: edtRef.current.style.margin,
      padding: edtRef.current.style.padding,
      borderRadius: edtRef.current.style.borderRadius,
      backgroundColor: edtRef.current.style.backgroundColor,
      maxWidth: edtRef.current.style.maxWidth,
      marginLeft: edtRef.current.style.marginLeft,
      marginRight: edtRef.current.style.marginRight,
    };

    // Appliquer des styles optimisés pour l'export
    edtRef.current.style.margin = "0";
    edtRef.current.style.padding = "10px";
    edtRef.current.style.borderRadius = "0";
    edtRef.current.style.backgroundColor = "#ffffff";
    edtRef.current.style.maxWidth = "fit-content";
    edtRef.current.style.marginLeft = "block";
    edtRef.current.style.marginRight = "center";

    try {
      const canvas = await html2canvas(edtRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: edtRef.current.scrollWidth,
        windowHeight: edtRef.current.scrollHeight,
        width: edtRef.current.scrollWidth,
        height: edtRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedNoExport = clonedDoc.querySelectorAll(".no-export");
          clonedNoExport.forEach((el) => (el.style.display = "none"));

          const clonedContainer =
            clonedDoc.querySelector('[ref="edtRef"]') ||
            clonedDoc.querySelector(".export-container");
          if (clonedContainer) {
            clonedContainer.style.margin = "0 auto"; // centre l'export
            clonedContainer.style.padding = "10px";
            clonedContainer.style.borderRadius = "0";
            clonedContainer.style.backgroundColor = "#ffffff";
            clonedContainer.style.maxWidth = "fit-content";
            clonedContainer.style.display = "block";
            clonedContainer.style.textAlign = "center";
          }
        },
        });

      // Restaurer les styles originaux
      elementsToHide.forEach((el, index) => {
        if (originalStyles[index]) {
          el.style.display = originalStyles[index].display || "";
        }
      });

      Object.keys(originalContainerStyle).forEach((key) => {
        edtRef.current.style[key] = originalContainerStyle[key];
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `emploi_du_temps_${format(new Date(), "yyyy-MM-dd")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erreur lors de l'export PNG:", error);
      alert("Erreur lors de l'export en image");
    } finally {
      setIsExporting(false);
    }
  };

  const referenceDate = dateSearch ? new Date(dateSearch) : new Date();
  const semaine = [];
  const firstDay = startOfWeek(referenceDate, { weekStartsOn: 1 });
  for (let i = 0; i < 6; i++) {
    semaine.push(addDays(firstDay, i));
  }

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

  const getParcoursColor = (parcours) => {
    const colors = {
      GL: "bg-gray-100 border-blue-400 text-gray-800",
      AEII: "bg-gray-100 border-purple-400 text-gray-800",
     
    };
    return colors[parcours] || "bg-gray-100 border-gray-400 text-gray-800";
  };

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
      {/* Conteneur principal pour l'export - avec ref */}
      <div
        className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm"
        ref={edtRef}
      >
        {/* Section des boutons d'action - à masquer lors de l'export */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 no-export">
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
                onClick={exportToPNG}
                disabled={isExporting}
                className="flex items-center px-4 py-2 bg-teal-900 text-white rounded-lg hover:bg-teal-800 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Export en cours...
                  </>
                ) : (
                  <>
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Exporter PNG
                  </>
                )}
              </button>

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
                className="flex items-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition shadow-sm"
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
                className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition shadow-sm"
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
          <div className="bg-gray-100 p-4 rounded-lg mb-6 no-export">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrer par semaine :
                </label>
                <input
                  type="date"
                  value={dateSearch}
                  onChange={(e) => setDateSearch(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                />
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
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition shadow-sm w-full justify-center"
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

            {(dateSearch || niveauFilter || parcoursFilter) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">
                  Filtres actifs :
                  {dateSearch && (
                    <span className="ml-2 bg-gray-100 text-blue-800 px-2 py-1 rounded">
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

        {/* Statistiques rapides - à masquer lors de l'export */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-export">
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

        {/* En-tête de la grille - visible dans l'export */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 text-center">
            Emploi du Temps - Semaine du {format(semaine[0], "dd/MM/yyyy")} au{" "}
            {format(semaine[5], "dd/MM/yyyy")}
          </h3>
        </div>

        {/* Grille de l'emploi du temps - visible dans l'export */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {semaine.map((jourDate) => {
              const jourStr = format(jourDate, "EEEE", { locale: fr });
              const dayEvents = filteredEvents.filter(
                (e) =>
                  new Date(e.date).toDateString() === jourDate.toDateString()
              );

              return (
                <div
                  key={jourStr}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-transform hover:shadow-lg"
                >
                  <div className="p-3 text-center font-semibold bg-gray-600 text-white">
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

<<<<<<< HEAD
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
=======
                  <div className="divide-y divide-gray-100">
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
                                onClick={() => setSelectedEvent(e)} // RÉTABLI ICI - pour rendre les cours modifiables
                                className={`p-2 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${getParcoursColor(
                                  e.parcours
                                )}`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="font-semibold text-sm">
                                    {e.parcours}
                                  </div>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${getNiveauColor(
                                      e.niveau
                                    )}`}
                                  >
                                    {e.niveau}
                                  </span>
                                </div>
                                {e.groupe && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    Groupe {e.groupe}
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
>>>>>>> 44499073903b79f3bdf056d2131b57a7c6ef640d
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
          fetchEvents();
        }}
        onDelete={(idToDelete) => {
          setEvents((prev) => prev.filter((e) => e._id !== idToDelete));
          fetchEvents();
        }}
      />
    </div>
  );
}
