import { useState } from "react";
import SimpleCalendar from "../components/SimpleCalendar";
import QuickEventForm from "../components/QuickEventForm";

export function Edt() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);

  const handleDateClick = (date) => setSelectedDate(date);
  const handleAddEvent = (event) => {
    setEvents([...events, event]);
  };

  const handleCloseForm = () => setSelectedDate(null);

  return (
    <div>
      <SimpleCalendar
        events={events}
        onDateClick={handleDateClick}
        selectedDate={selectedDate}
      />

      {selectedDate && (
        <QuickEventForm
          selectedDate={selectedDate}
          onAddEvent={handleAddEvent}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
export default Edt;
