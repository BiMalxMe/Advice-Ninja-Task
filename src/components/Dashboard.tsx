import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useSearchParams } from 'react-router-dom';
import { dataStore } from '../dataStore';
import type { ConnectedAccount, Calendar, CalendarBoard } from '../types';
import { ConnectCalendar } from './ConnectCalendar';
import { CreateBoard } from './CreateBoard';
import { BoardList } from './BoardList';
import { Diagnostics } from './Diagnostics';
import { eventSyncService } from '../services/eventSync';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [boards, setBoards] = useState<CalendarBoard[]>([]);
  const [showConnect, setShowConnect] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
      syncEvents();
      
      // If there's a refresh parameter, remove it from the URL
      if (searchParams.get('refresh')) {
        setSearchParams({});
      }
      
      // Set up periodic sync every 5 minutes
      const syncInterval = setInterval(() => {
        console.log('Running periodic event sync...');
        syncEvents();
      }, 5 * 60 * 1000);
      
      return () => clearInterval(syncInterval);
    }
  }, [user]);

  const loadData = () => {
    if (!user) return;
    dataStore.deduplicateAccounts();
    const userAccounts = dataStore.getAccountsByUserId(user.id);
    setAccounts(userAccounts);

    const allCalendars: Calendar[] = [];
    userAccounts.forEach(account => {
      const accountCalendars = dataStore.getCalendarsByAccountId(account.id);
      allCalendars.push(...accountCalendars);
    });
    setCalendars(allCalendars);

    const userBoards = dataStore.getBoardsByUserId(user.id);
    setBoards(userBoards);
  };

  const syncEvents = async () => {
    if (!user || syncing) return;

    // Check for expired tokens before syncing
    const userAccounts = dataStore.getAccountsByUserId(user.id);
    const expiredAccounts = userAccounts.filter(
      a => !a.accessToken.startsWith('mock_token_') && a.expiresAt && a.expiresAt < Date.now()
    );

    if (expiredAccounts.length > 0) {
      alert(`Token expired for: ${expiredAccounts.map(a => a.email).join(', ')}\n\nPlease reconnect these calendars to refresh the token.`);
      return;
    }

    setSyncing(true);
    try {
      await eventSyncService.syncAllEvents(user.id);
      loadData();
    } catch (error) {
      console.error('Failed to sync events:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/CalendarX.png" alt="Calendar X" className="w-14 h-14" />
            <div>
              <h1 className="text-3xl font-bold text-black tracking-tight">Calendar X</h1>
              <p className="text-sm text-gray-500 mt-0.5">Aggregate & Share Calendars</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-black">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button 
              onClick={logout} 
              className="text-black bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-lg transition font-medium border border-gray-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-black tracking-tight">Connected Calendars</h2>
              <p className="text-gray-600 mt-1">Manage your calendar connections</p>
            </div>
            <div className="flex gap-3">
              {accounts.length > 0 && (
                <button
                  onClick={syncEvents}
                  disabled={syncing}
                  className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 disabled:bg-gray-400 transition font-semibold shadow-sm"
                >
                  {syncing ? '🔄 Syncing...' : '🔄 Sync Events'}
                </button>
              )}
              <button
                onClick={() => setShowConnect(true)}
                className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition font-semibold shadow-sm"
              >
                + Connect Calendar
              </button>
            </div>
          </div>
          
          {accounts.length === 0 ? (
            <div className="bg-linear-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-600 text-lg font-medium">No calendars connected yet</p>
              <p className="text-gray-500 text-sm mt-2">Get started by connecting your first calendar!</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {accounts.map(account => {
                const accountCalendars = calendars.filter(c => c.accountId === account.id);
                const accountEvents = dataStore.getEventsByCalendarIds(accountCalendars.map(c => c.id)).length;
                
                return (
                  <div key={account.id} className="bg-linear-to-br from-gray-50 to-white border border-gray-300 p-7 rounded-xl hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md ${
                        account.provider === 'google' ? 'bg-blue-600' : 'bg-indigo-600'
                      }`}>
                        {account.provider === 'google' ? '🔵' : '⚫'}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-black capitalize block text-xl">{account.provider === 'google' ? 'Google' : 'Microsoft 365'} Calendar</span>
                        <span className="text-gray-600 text-sm">{account.email}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="text-xs text-blue-600 font-semibold">Calendars</div>
                        <div className="text-2xl font-bold text-blue-900">{accountCalendars.length}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="text-xs text-green-600 font-semibold">Events</div>
                        <div className="text-2xl font-bold text-green-900">{accountEvents}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {accountCalendars.length > 0 ? (
                        accountCalendars.map((cal, idx) => (
                          <span
                            key={`${account.id}-${cal.id}-${idx}`}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-md inline-flex items-center gap-2"
                            style={{ backgroundColor: cal.color }}
                          >
                            <span className="w-2 h-2 rounded-full opacity-70"></span>
                            {cal.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-red-600 font-semibold">⚠️ No calendars</span>
                      )}
                    </div>

                    <div className="text-xs text-gray-400">
                      Token expires: {account.expiresAt ? new Date(account.expiresAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-black tracking-tight">Calendar Boards</h2>
              <p className="text-gray-600 mt-1">Create and manage your custom calendar views</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              disabled={calendars.length === 0}
              className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 disabled:bg-gray-400 transition font-semibold shadow-sm"
            >
              + Create Board
            </button>
          </div>
          
          <BoardList boards={boards} calendars={calendars} onUpdate={loadData} />
        </div>
      </div>

      {showConnect && (
        <ConnectCalendar
          onClose={() => setShowConnect(false)}
          onConnect={() => {
            loadData();
            setShowConnect(false);
          }}
        />
      )}

      {showCreate && (
        <CreateBoard
          calendars={calendars}
          onClose={() => setShowCreate(false)}
          onCreate={() => {
            loadData();
            setShowCreate(false);
          }}
        />
      )}

      <Diagnostics />
    </div>
  );
};
