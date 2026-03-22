import React, { useMemo } from 'react';
import type { CalendarEvent, Calendar } from '../types';
import { format, startOfWeek, addDays, isSameDay, startOfDay, isWithinInterval, endOfDay } from 'date-fns';

interface Props {
  events: CalendarEvent[];
  calendars: Calendar[];
  maskEvents: boolean;
}

export const CalendarView: React.FC<Props> = ({ events, calendars, maskEvents }) => {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today);
  const days = Array.from({ length: 14 }, (_, i) => addDays(weekStart, i));

  const getCalendarColor = (calendarId: string): string => {
    return calendars.find(c => c.id === calendarId)?.color || '#9ca3af';
  };

  const getCalendarName = (calendarId: string): string => {
    return calendars.find(c => c.id === calendarId)?.name || 'Unknown';
  };

  const getEventsForDay = useMemo(() => {
    return (day: Date): CalendarEvent[] => {
      if (!events || events.length === 0) return [];
      
      return events.filter(event => {
        try {
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          
          // Check if event overlaps with the day
          return isWithinInterval(eventStart, { start: dayStart, end: dayEnd }) ||
                 isWithinInterval(dayStart, { start: eventStart, end: eventEnd });
        } catch (e) {
          console.error('Error filtering event:', event, e);
          return false;
        }
      });
    };
  }, [events]);

  // Check if there are any events at all
  const hasEvents = events && events.length > 0;

  return (
    <div className="w-full">
      {!hasEvents && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center mb-6">
          <p className="text-yellow-800 font-semibold text-lg">📅 No events found</p>
          <p className="text-yellow-700 text-sm mt-2">
            Make sure to sync events and that calendars have events within the selected date range.
          </p>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-300">
        <div className="grid grid-cols-7 gap-0 border-collapse bg-gray-100">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="bg-gray-800 text-white p-4 text-center font-bold text-sm">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-0 bg-gray-100">
          {days.map(day => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-32 p-3 border border-gray-200 ${
                  isToday ? 'bg-blue-100 border-blue-400 border-2' : 'bg-white'
                } overflow-y-auto`}
              >
                <div className={`text-xs font-bold mb-2 ${isToday ? 'text-blue-700' : 'text-gray-600'}`}>
                  {format(day, 'd MMM')}
                </div>
                <div className="space-y-1.5">
                  {dayEvents.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">-</p>
                  ) : (
                    dayEvents.map(event => {
                      const color = getCalendarColor(event.calendarId);
                      const calendarName = getCalendarName(event.calendarId);
                      
                      return (
                        <div
                          key={`${event.id}-${event.calendarId}`}
                          className="text-xs p-2 rounded text-white shadow-sm border-l-4"
                          style={{ 
                            backgroundColor: color,
                            borderLeftColor: color,
                            opacity: 0.95
                          }}
                          title={maskEvents ? calendarName : event.title}
                        >
                          <div className="font-semibold truncate text-xs">
                            {maskEvents ? '🔒 Busy' : event.title}
                          </div>
                          <div className="opacity-75 text-xs mt-0.5">
                            {(() => {
                              try {
                                const start = new Date(event.start);
                                return format(start, 'HH:mm');
                              } catch {
                                return 'N/A';
                              }
                            })()}
                          </div>
                          {maskEvents && (
                            <div className="opacity-70 text-xs mt-0.5 truncate">
                              {calendarName}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Showing {events.length} event{events.length !== 1 ? 's' : ''} · 14-day view starting {format(weekStart, 'MMM d')}
      </div>
    </div>
  );
};
