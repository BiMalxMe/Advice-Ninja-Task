import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { dataStore } from '../dataStore';
import type { CalendarBoard, Calendar, CalendarEvent } from '../types';
import { CalendarView } from './CalendarView';
import { startOfDay, addDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export const SharedBoard: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [board, setBoard] = useState<CalendarBoard | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadBoard();
      const interval = setInterval(loadBoard, 2 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const filterEventsByDateRange = (evts: CalendarEvent[], b: CalendarBoard): CalendarEvent[] => {
    const now = startOfDay(new Date());
    let startDate: Date;
    let endDate: Date;

    switch (b.dateRangeType) {
      case 'current_week':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'two_weeks':
        startDate = b.showPastEvents ? addDays(now, -30) : now;
        endDate = addDays(now, 30);
        break;
      case 'custom':
        startDate = b.showPastEvents ? addDays(now, -(b.customDaysBehind || 0)) : now;
        endDate = addDays(now, b.customDaysAhead || 30);
        break;
      default:
        startDate = now;
        endDate = addDays(now, 30);
    }

    return evts.filter(event => {
      try {
        return isWithinInterval(new Date(event.start), { start: startDate, end: endDate });
      } catch {
        return false;
      }
    });
  };

  const loadBoard = () => {
    if (!token) return;

    const foundBoard = dataStore.getBoardByShareToken(token);
    if (!foundBoard) {
      setLoading(false);
      return;
    }

    setBoard(foundBoard);

    const boardCalendars = dataStore.getCalendarsByIds(foundBoard.calendarIds);
    const uniqueCalendars = boardCalendars.filter(
      (cal, idx, arr) => arr.findIndex(c => c.id === cal.id) === idx
    );
    setCalendars(uniqueCalendars);

    const allEvents = dataStore.getEventsByCalendarIds(foundBoard.calendarIds);
    const uniqueEvents = allEvents.filter(
      (e, idx, arr) => arr.findIndex(x => x.id === e.id && x.calendarId === e.calendarId) === idx
    );

    setEvents(filterEventsByDateRange(uniqueEvents, foundBoard));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-gray-600 text-lg">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2 text-black">Board Not Found</h2>
          <p className="text-gray-600">This calendar board does not exist or has been deleted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/CalendarX.png" alt="Calendar X" className="w-14 h-14" />
              <div>
                <h1 className="text-3xl font-bold text-black tracking-tight">Calendar X</h1>
                <p className="text-sm text-gray-600 mt-1">{board.name}</p>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
              {board.maskEvents ? '🔒 Events Masked' : '👁️ Events Visible'}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 items-center mb-6">
            {calendars.length > 0 ? calendars.map((cal, idx) => (
              <span
                key={`${cal.id}-${idx}`}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-md inline-flex items-center gap-2"
                style={{ backgroundColor: cal.color }}
              >
                <span className="w-2 h-2 rounded-full opacity-70"></span>
                {cal.name}
              </span>
            )) : (
              <div className="text-red-600 font-semibold">⚠️ No calendars found</div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-semibold">Total Events</div>
              <div className="text-3xl font-bold text-blue-900">{events.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-semibold">Calendars</div>
              <div className="text-3xl font-bold text-green-900">{calendars.length}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600 font-semibold">View Mode</div>
              <div className="text-lg font-bold text-purple-900">
                {board.maskEvents ? '🔒 Masked' : '👁️ Visible'}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-600 font-semibold">Date Range</div>
              <div className="text-lg font-bold text-orange-900">
                {board.dateRangeType === 'current_week' && 'This Week'}
                {board.dateRangeType === 'two_weeks' && '2 Weeks'}
                {board.dateRangeType === 'custom' && 'Custom'}
              </div>
            </div>
          </div>
        </div>

        <CalendarView events={events} calendars={calendars} maskEvents={board.maskEvents} />
      </div>
    </div>
  );
};
