import React from 'react';
import type { CalendarBoard, Calendar } from '../types';
import { dataStore } from '../dataStore';
import { startOfDay, addDays } from 'date-fns';

interface Props {
  boards: CalendarBoard[];
  calendars: Calendar[];
  onUpdate: () => void;
}

export const BoardList: React.FC<Props> = ({ boards, calendars, onUpdate }) => {
  const getShareUrl = (token: string) => {
    return `${window.location.origin}/share/${token}`;
  };

  const copyShareLink = (token: string) => {
    navigator.clipboard.writeText(getShareUrl(token));
    alert('Share link copied to clipboard!');
  };

  const deleteBoard = (boardId: string) => {
    if (confirm('Delete this board?')) {
      dataStore.deleteBoard(boardId);
      onUpdate();
    }
  };

  const getEventsForBoard = (board: CalendarBoard) => {
    const allEvents = dataStore.getEventsByCalendarIds(board.calendarIds);
    const now = startOfDay(new Date());
    
    // Filter by date range
    let startDate = now;
    let endDate = addDays(now, 14);
    
    switch (board.dateRangeType) {
      case 'current_week':
        endDate = addDays(now, 7);
        break;
      case 'two_weeks':
        endDate = addDays(now, 14);
        break;
      case 'custom':
        startDate = board.showPastEvents ? addDays(now, -(board.customDaysBehind || 0)) : now;
        endDate = addDays(now, board.customDaysAhead || 14);
        break;
    }
    
    return allEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= startDate && eventDate <= endDate;
    }).length;
  };

  if (boards.length === 0) {
    return (
      <div className="bg-linear-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-gray-600 text-lg font-medium">No boards created yet</p>
        <p className="text-gray-500 text-sm mt-2">Create your first board to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {boards.map(board => {
        const boardCalendars = calendars.filter(c => board.calendarIds.includes(c.id));
        const eventCount = getEventsForBoard(board);
        
        return (
          <div key={board.id} className="bg-linear-to-br from-gray-50 to-white border border-gray-300 p-7 rounded-xl hover:shadow-xl transition-all duration-300 group">
            <div className="flex justify-between items-start mb-5">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-black tracking-tight group-hover:text-blue-600 transition">{board.name}</h3>
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full text-blue-700 font-medium">
                    {board.maskEvents ? '🔒 Masked' : '👁️ Visible'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="inline-flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full text-green-700 font-medium">
                    📅 {board.dateRangeType === 'current_week' && 'This Week'}
                    {board.dateRangeType === 'two_weeks' && '2 Weeks'}
                    {board.dateRangeType === 'custom' && `Custom`}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="inline-flex items-center gap-1 bg-purple-50 px-3 py-1 rounded-full text-purple-700 font-medium">
                    📊 {eventCount} event{eventCount !== 1 ? 's' : ''}
                  </span>
                  {board.showPastEvents && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="inline-flex items-center gap-1 bg-orange-50 px-3 py-1 rounded-full text-orange-700 font-medium">
                        ⏮️ Past Events
                      </span>
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => deleteBoard(board.id)}
                className="text-red-600 hover:text-white hover:bg-red-600 font-semibold px-4 py-2 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-600 ml-4"
              >
                🗑️ Delete
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {boardCalendars.length > 0 ? (
                boardCalendars.map(cal => (
                  <span
                    key={cal.id}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-md inline-flex items-center gap-2"
                    style={{ backgroundColor: cal.color }}
                  >
                    <span className="w-2 h-2 rounded-full opacity-70"></span>
                    {cal.name}
                  </span>
                ))
              ) : (
                <span className="text-red-600 font-semibold">⚠️ No calendars selected</span>
              )}
            </div>

            <div className="flex gap-3">
              <a
                href={`/share/${board.shareToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-black text-white py-3 px-5 rounded-lg hover:bg-gray-800 text-center font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                👁️ View Board
              </a>
              <button
                onClick={() => copyShareLink(board.shareToken)}
                className="bg-gray-100 hover:bg-gray-200 py-3 px-6 rounded-lg font-semibold transition-all duration-200 border border-gray-300 hover:border-gray-400 active:scale-95"
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
