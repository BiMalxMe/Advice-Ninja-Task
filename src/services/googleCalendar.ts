import axios from 'axios';
import type { Calendar, CalendarEvent } from '../types';

const GOOGLE_API_BASE = 'https://www.googleapis.com/calendar/v3';

export const googleCalendarService = {
  async getCalendarList(accessToken: string): Promise<Calendar[]> {
    try {
      const response = await axios.get(`${GOOGLE_API_BASE}/users/me/calendarList`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          showHidden: true,
          showDeleted: false,
        },
      });

      if (!response.data.items || response.data.items.length === 0) {
        return [];
      }

      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

      return response.data.items.map((cal: any, idx: number) => ({
        id: cal.id,
        accountId: '',
        name: cal.summaryOverride || cal.summary || `Calendar ${idx + 1}`,
        color: cal.backgroundColor || colors[idx % colors.length],
      }));
    } catch (error) {
      console.error('Error fetching calendar list:', error);
      throw error;
    }
  },

  async getEvents(accessToken: string, calendarId: string, timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
    try {
      console.log(`  📡 Calling Google Calendar API for: ${calendarId}`);
      console.log(`     Time range: ${new Date(timeMin).toLocaleDateString()} - ${new Date(timeMax).toLocaleDateString()}`);
      
      const response = await axios.get(`${GOOGLE_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 2500,
        },
      });

      console.log(`  📥 API Response received`);
      console.log(`     Status: ${response.status}`);
      console.log(`     Items in response: ${response.data.items ? response.data.items.length : 0}`);

      if (!response.data || !response.data.items) {
        console.warn(`  ⚠️  Response missing items property`);
        console.log(`     Full response structure:`, Object.keys(response.data || {}));
        return [];
      }

      if (response.data.items.length === 0) {
        console.log(`  ℹ️  No events in response`);
        return [];
      }

      console.log(`  📋 Processing ${response.data.items.length} items from response...`);

      const events = response.data.items.map((event: any, index: number) => {
        try {
          // Handle both dateTime (with time) and date (all-day events)
          const startStr = event.start.dateTime || event.start.date;
          const endStr = event.end.dateTime || event.end.date;
          
          if (!startStr || !endStr) {
            console.warn(`    ⚠️  Event ${index} missing start/end:`, event.id, event.summary);
            return null;
          }

          // Parse dates, handling timezone properly
          let startDate = new Date(startStr);
          let endDate = new Date(endStr);
          
          // For all-day events (date only, no time), adjust for timezone
          if (event.start.date && !event.start.dateTime) {
            const [year, month, day] = startStr.split('-').map(Number);
            startDate = new Date(year, month - 1, day);
          }
          
          if (event.end.date && !event.end.dateTime) {
            const [year, month, day] = endStr.split('-').map(Number);
            endDate = new Date(year, month - 1, day);
          }

          return {
            id: event.id,
            calendarId,
            title: event.summary || '(No title)',
            start: startDate,
            end: endDate,
            description: event.description,
          };
        } catch (e) {
          console.warn(`    ⚠️  Error processing event ${index}:`, e);
          return null;
        }
      }).filter((e: any) => e !== null);

      console.log(`  ✓ Successfully parsed ${events.length} events`);
      if (events.length > 0) {
        console.log(`     Sample: "${events[0].title}" on ${events[0].start.toLocaleDateString()}`);
      }
      return events;
    } catch (error: any) {
      console.error(`  ✗ Error fetching events for calendar ${calendarId}:`, error?.message || error);
      if (error?.response?.status === 401) {
        console.error('    🔴 401 Unauthorized - Token may be expired');
      } else if (error?.response?.status === 403) {
        console.error('    🔴 403 Forbidden - No permission to access calendar');
      } else if (error?.response?.status === 404) {
        console.error('    🔴 404 Not Found - Calendar does not exist');
      }
      console.error('    Response:', error?.response?.data);
      throw error;
    }
  },
};
