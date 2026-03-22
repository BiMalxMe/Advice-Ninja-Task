import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { dataStore } from '../dataStore';
import type { Calendar } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  calendars: Calendar[];
  onClose: () => void;
  onCreate: () => void;
}

export const CreateBoard: React.FC<Props> = ({ calendars, onClose, onCreate }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [maskEvents, setMaskEvents] = useState(false);
  const [dateRangeType, setDateRangeType] = useState<'current_week' | 'two_weeks' | 'custom'>('two_weeks');
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [customDaysAhead, setCustomDaysAhead] = useState(14);
  const [customDaysBehind, setCustomDaysBehind] = useState(0);

  const toggleCalendar = (calId: string) => {
    setSelectedCalendars(prev =>
      prev.includes(calId) ? prev.filter(id => id !== calId) : [...prev, calId]
    );
  };

  const handleCreate = () => {
    if (!user || !name || selectedCalendars.length === 0) {
      alert('Please fill in all fields');
      return;
    }

    const shareToken = uuidv4();
    const board = {
      id: uuidv4(),
      userId: user.id,
      name,
      calendarIds: selectedCalendars,
      maskEvents,
      dateRangeType,
      showPastEvents,
      customDaysAhead: dateRangeType === 'custom' ? customDaysAhead : undefined,
      customDaysBehind: dateRangeType === 'custom' ? customDaysBehind : undefined,
      shareToken
    };

    console.log('Creating board:', board);
    dataStore.addBoard(board);
    
    // Verify it was saved
    const savedBoard = dataStore.getBoardByShareToken(shareToken);
    console.log('Saved board verified:', savedBoard);
    console.log('Share token:', shareToken);
    console.log('Share URL:', `${window.location.origin}/share/${shareToken}`);
    
    alert(`Board created! Share token: ${shareToken}`);
    onCreate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full m-4 shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 text-black">Create Calendar Board</h3>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2 text-black">Board Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Office Calendar, Team View"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-black">Select Calendars</label>
            <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2 bg-gray-50">
              {calendars.map(cal => (
                <label key={cal.id} className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded transition">
                  <input
                    type="checkbox"
                    checked={selectedCalendars.includes(cal.id)}
                    onChange={() => toggleCalendar(cal.id)}
                    className="w-5 h-5"
                  />
                  <span
                    className="w-5 h-5 rounded shadow-sm"
                    style={{ backgroundColor: cal.color }}
                  />
                  <span className="font-medium text-black">{cal.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={maskEvents}
                onChange={(e) => setMaskEvents(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm font-bold text-black">🔒 Mask Event Titles (show as "Busy")</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-black">Date Range</label>
            <select
              value={dateRangeType}
              onChange={(e) => setDateRangeType(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none font-medium"
            >
              <option value="current_week">Current Week Only</option>
              <option value="two_weeks">Two Weeks Ahead</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRangeType === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-black">Days Ahead</label>
                <input
                  type="number"
                  value={customDaysAhead}
                  onChange={(e) => setCustomDaysAhead(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-black">Days Behind</label>
                <input
                  type="number"
                  value={customDaysBehind}
                  onChange={(e) => setCustomDaysBehind(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                  min="0"
                />
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showPastEvents}
                onChange={(e) => setShowPastEvents(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm font-bold text-black">⏮️ Show Past Events</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCreate}
              disabled={!name || selectedCalendars.length === 0}
              className="flex-1 bg-black text-white py-3.5 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 font-medium transition shadow-md"
            >
              Create Board
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-black py-3.5 rounded-lg hover:bg-gray-200 font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
