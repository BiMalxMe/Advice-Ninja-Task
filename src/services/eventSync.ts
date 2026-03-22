import { dataStore } from '../dataStore';
import { googleCalendarService } from './googleCalendar';
import { microsoftCalendarService } from './microsoftCalendar';
import type { CalendarEvent } from '../types';
import { addDays, startOfDay } from 'date-fns';

export const eventSyncService = {
  async syncEventsForAccount(accountId: string): Promise<void> {
    const accounts = dataStore.getAccounts();
    const account = accounts.find(a => a.id === accountId);
    
    if (!account) {
      console.warn(`Account ${accountId} not found`);
      return;
    }

    console.log(`\n=== STARTING SYNC FOR ${account.provider.toUpperCase()} ===`);
    console.log(`Account: ${account.email} (${accountId})`);

    const calendars = dataStore.getCalendarsByAccountId(accountId);
    console.log(`Found ${calendars.length} calendars for account`);

    if (calendars.length === 0) {
      console.warn(`⚠️ No calendars found for account ${accountId}`);
      return;
    }

    // Skip real sync for mock accounts - they already have events
    if (account.accessToken.startsWith('mock_token_')) {
      console.log('✓ Mock account - events already generated during connection');
      return;
    }

    // Real account - sync from provider
    const now = new Date();
    const timeMin = addDays(startOfDay(now), -90).toISOString();
    const timeMax = addDays(startOfDay(now), 365).toISOString();

    console.log(`📅 Sync time range: ${new Date(timeMin).toLocaleDateString()} to ${new Date(timeMax).toLocaleDateString()}`);

    let totalEventsSynced = 0;

    for (const calendar of calendars) {
      try {
        let events: CalendarEvent[] = [];
        const calendarDisplayName = calendar.name || calendar.id;

        if (account.provider === 'google') {
          console.log(`\n📕 Syncing Google calendar: ${calendarDisplayName}`);
          events = await googleCalendarService.getEvents(
            account.accessToken,
            calendar.id,
            timeMin,
            timeMax
          );
        } else if (account.provider === 'microsoft') {
          console.log(`\n📘 Syncing Microsoft calendar: ${calendarDisplayName}`);
          events = await microsoftCalendarService.getEvents(
            account.accessToken,
            calendar.id,
            timeMin,
            timeMax
          );
        }

        console.log(`Retrieved ${events.length} events from API`);

        if (events.length === 0) {
          console.log(`⚠️ No events found for calendar ${calendarDisplayName}`);
          continue;
        }

        // Clear old events for this calendar before syncing new ones
        const allEvents = dataStore.getEvents();
        const beforeCount = allEvents.length;
        const filteredEvents = allEvents.filter(e => e.calendarId !== calendar.id);
        localStorage.setItem('events', JSON.stringify(filteredEvents));
        console.log(`Cleared ${beforeCount - filteredEvents.length} old events for this calendar`);

        // Add new events with deduplication
        const addedCount = events.filter(event => {
          // Check if event would be added
          const exists = filteredEvents.some(e => e.id === event.id && e.calendarId === event.calendarId);
          return !exists;
        }).length;

        dataStore.addEvents(events);
        console.log(`✓ Added ${addedCount} new events to calendar ${calendarDisplayName}`);
        totalEventsSynced += addedCount;

      } catch (error: any) {
        console.error(`✗ ERROR syncing calendar ${calendar.id}:`, error?.message || error);
        if (error?.response?.status === 401) {
          console.error('🔴 401 Unauthorized - Token is invalid or expired');
          console.error('   → Reconnect the calendar to get a new token');
        } else if (error?.response?.status === 403) {
          console.error('🔴 403 Forbidden - No permission to access this calendar');
        } else if (error?.response?.status === 404) {
          console.error('🔴 404 Not Found - Calendar does not exist');
        }
      }
    }

    console.log(`\n✅ SYNC COMPLETE: ${totalEventsSynced} events synced`);
    console.log('='.repeat(50));
  },

  async syncAllEvents(userId: string): Promise<void> {
    const accounts = dataStore.getAccountsByUserId(userId);
    
    for (const account of accounts) {
      await this.syncEventsForAccount(account.id);
    }
  },
};
