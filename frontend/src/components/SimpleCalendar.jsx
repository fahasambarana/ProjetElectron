import { useState } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";


/**
 * @param {Object} props
 * @param {Array} props.events - chaque élément : { date: Date, type: string }
 * @param {function} props.onDateClick
 * @param {Date} [props.selectedDate]
 */
const SimpleCalendar = ({ events = [], onDateClick, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  // Calcul du mois complet affiché (incl. les jours du mois précédent/suivant)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startOfCalendar = startOfWeek(monthStart, { locale: fr });
  const endOfCalendar = endOfWeek(monthEnd, { locale: fr });

  const allDaysInMonthView = eachDayOfInterval({ start: startOfCalendar, end: endOfCalendar });

  const getEventsForDate = (date) => events.filter(event => isSameDay(event.date, date));
  const goBack = () => {window.history.back();}
  
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <div className="bg-white rounded-xl shadow border p-6">
      <button className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-md text-white" onClick={goBack}>
        <ChevronLeft className="inline"/>
        Retour  
        </button>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {format(currentDate, "MMMM yyyy", { locale: fr })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            className="p-2 border rounded hover:bg-gray-100"
            onClick={previousMonth}
            aria-label="Mois précédent"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="p-2 border rounded hover:bg-gray-100"
            onClick={nextMonth}
            aria-label="Mois suivant"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
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
                "p-3 rounded-lg text-sm transition-all duration-300 min-h-[60px] flex flex-col items-center justify-start",
                "disabled:pointer-events-none",
                isCurrentMonth
                  ? "text-black hover:bg-gray-100"
                  : "text-gray-300",
                isSelected && "bg-blue-200 border-2 border-blue-400",
                isToday && !isSelected && "bg-gray-200 border border-blue-300 font-bold text-blue-600"
              )}
            >
              <span className="mb-1">{format(date, "d")}</span>
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap gap-1 w-full justify-center">
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
                    />
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-xs text-gray-400">+{dayEvents.length - 2}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default SimpleCalendar;
