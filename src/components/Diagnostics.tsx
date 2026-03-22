import React from 'react';
import { dataStore } from '../dataStore';

export const Diagnostics: React.FC = () => {
  const diagnosticsData = {
    users: dataStore.getUsers().length,
    accounts: dataStore.getAccounts().map(a => ({
      id: a.id,
      provider: a.provider,
      email: a.email,
      token: a.accessToken.substring(0, 20) + '...',
    })),
    calendars: dataStore.getCalendars().map(c => ({
      id: c.id,
      name: c.name,
      accountId: c.accountId,
      color: c.color,
    })),
    events: dataStore.getEvents().map(e => ({
      id: e.id,
      title: e.title,
      calendarId: e.calendarId,
      start: new Date(e.start).toLocaleString(),
      end: new Date(e.end).toLocaleString(),
    })),
    boards: dataStore.getBoards().map(b => ({
      id: b.id,
      name: b.name,
      calendarIds: b.calendarIds,
      shareToken: b.shareToken,
    })),
  };

  const handleClearAll = () => {
    if (confirm('Clear all data? This cannot be undone!')) {
      localStorage.clear();
      alert('All data cleared. Refresh the page.');
    }
  };

  const handleExportData = () => {
    const json = JSON.stringify(diagnosticsData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calendar-x-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-lg">
      <details className="bg-black text-white rounded-lg shadow-lg p-4">
        <summary className="cursor-pointer font-bold text-sm hover:bg-gray-800 p-2 rounded">
          🔧 Diagnostics
        </summary>
        
        <div className="mt-4 space-y-4 max-h-96 overflow-y-auto text-xs">
          <div>
            <h3 className="font-bold text-yellow-300">Summary</h3>
            <p>Users: {diagnosticsData.users}</p>
            <p>Accounts: {diagnosticsData.accounts.length}</p>
            <p>Calendars: {diagnosticsData.calendars.length}</p>
            <p>Events: {diagnosticsData.events.length}</p>
            <p>Boards: {diagnosticsData.boards.length}</p>
          </div>

          <div>
            <h3 className="font-bold text-blue-300">Accounts</h3>
            {diagnosticsData.accounts.length === 0 ? (
              <p className="text-gray-400">No accounts</p>
            ) : (
              diagnosticsData.accounts.map((a, i) => (
                <div key={i} className="text-gray-300 ml-2 mt-1">
                  <p>📧 {a.email} ({a.provider})</p>
                  <p className="text-gray-500">ID: {a.id.substring(0, 8)}...</p>
                </div>
              ))
            )}
          </div>

          <div>
            <h3 className="font-bold text-green-300">Calendars</h3>
            {diagnosticsData.calendars.length === 0 ? (
              <p className="text-gray-400">No calendars</p>
            ) : (
              diagnosticsData.calendars.map((c, i) => (
                <div key={i} className="text-gray-300 ml-2 mt-1">
                  <p>📅 {c.name}</p>
                  <p className="text-gray-500">ID: {c.id.substring(0, 8)}...</p>
                </div>
              ))
            )}
          </div>

          <div>
            <h3 className="font-bold text-red-300">Events ({diagnosticsData.events.length})</h3>
            {diagnosticsData.events.length === 0 ? (
              <p className="text-gray-400">No events synced</p>
            ) : (
              diagnosticsData.events.slice(0, 3).map((e, i) => (
                <div key={i} className="text-gray-300 ml-2 mt-1 border-l border-gray-500 pl-2">
                  <p>📌 {e.title}</p>
                  <p className="text-gray-500">{e.start}</p>
                </div>
              ))
            )}
            {diagnosticsData.events.length > 3 && (
              <p className="text-gray-400 ml-2">+ {diagnosticsData.events.length - 3} more</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleExportData}
              className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs font-bold flex-1"
            >
              📥 Export
            </button>
            <button
              onClick={handleClearAll}
              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs font-bold flex-1"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      </details>
    </div>
  );
};
