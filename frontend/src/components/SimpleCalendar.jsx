import { useState } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ArrowLeft, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const SimpleCalendar = ({ events = [], onDateClick, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startOfCalendar = startOfWeek(monthStart, { locale: fr });
  const endOfCalendar = endOfWeek(monthEnd, { locale: fr });

  const allDaysInMonthView = eachDayOfInterval({ start: startOfCalendar, end: endOfCalendar });

  const getEventsForDate = (date) => events.filter(event => isSameDay(event.date, date));
  const goBack = () => { window.history.back(); }
  
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 max-w-4xl mx-auto">
      {/* En-tête avec bouton retour */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={goBack}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <ArrowLeft size={18} />
          <span>Retour</span>
        </button>
        
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800 capitalize">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </h2>
          <div className="flex items-center gap-1">
            <button
              className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200 shadow-sm"
              onClick={previousMonth}
              aria-label="Mois précédent"
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <button
              className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200 shadow-sm"
              onClick={nextMonth}
              aria-label="Mois suivant"
            >
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Légende des événements */}
  

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>

      {/* Grille de jours du mois */}
      <div className="grid grid-cols-7 gap-2">
        {allDaysInMonthView.map((date) => {
          const dayEvents = getEventsForDate(date);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          const isCurrentMonth = isSameMonth(date, currentDate);

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateClick(date)}
              disabled={!isCurrentMonth}
              className={cn(
                "group p-3 rounded-xl text-sm transition-all duration-200 min-h-[80px] flex flex-col items-center justify-start relative",
                "disabled:pointer-events-none",
                isCurrentMonth
                  ? "text-gray-800 hover:bg-blue-50"
                  : "text-gray-300",
                isSelected && "bg-blue-100 border-2 border-blue-500",
                isToday && !isSelected && "bg-blue-500 text-white font-bold"
              )}
            >
              <span className={cn(
                "flex items-center justify-center h-7 w-7 rounded-full mb-2 text-sm",
                isToday && !isSelected && "bg-white text-blue-600",
                isSelected && "bg-blue-600 text-white"
              )}>
                {format(date, "d")}
              </span>
              
              {dayEvents.length > 0 && (
                <div className="flex flex-col gap-1 w-full items-center mt-1">
                  {dayEvents.slice(0, 2).map((event, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        event.type === 'course' && "bg-blue-500",
                        event.type === 'meeting' && "bg-green-500",
                        event.type === 'exam' && "bg-red-500",
                        event.type === 'other' && "bg-gray-400"
                      )}
                      title={event.type}
                    />
                  ))}
                  {dayEvents.length > 2 && (
                    <span className={cn(
                      "text-xs mt-1",
                      isToday && !isSelected ? "text-blue-100" : "text-gray-400"
                    )}>
                      +{dayEvents.length - 2}
                    </span>
                  )}
                </div>
              )}
              
              {/* Indicateur de jour du mois précédent/suivant */}
              {!isCurrentMonth && (
                <div className="absolute inset-0 bg-gray-50 opacity-50 rounded-xl"></div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Pied de page avec informations */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          Cliquez sur un jour pour voir les événements détaillés
        </p>
      </div>
    </div>
  );
}

export default SimpleCalendar;