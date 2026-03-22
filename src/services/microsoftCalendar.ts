import axios from 'axios';
import type { Calendar, CalendarEvent } from '../types';

const MS_GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

export const microsoftCalendarService = {
  async getCalendarList(accessToken: string): Promise<Calendar[]> {
    const response = await axios.get(`${MS_GRAPH_BASE}/me/calendars`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    
    return response.data.value.map((cal: any, idx: number) => ({
      id: cal.id,
      accountId: '',
      name: cal.name,
      color: cal.hexColor || colors[idx % colors.length],
    }));
  },

  async getEvents(accessToken: string, calendarId: string, startDateTime: string, endDateTime: string): Promise<CalendarEvent[]> {
    const response = await axios.get(`${MS_GRAPH_BASE}/me/calendars/${calendarId}/calendarView`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        startDateTime,
        endDateTime,
      },
    });

    return response.data.value.map((event: any) => {
      // Microsoft Graph returns ISO 8601 format with timezone info
      const startDate = new Date(event.start.dateTime);
      const endDate = new Date(event.end.dateTime);
      
      console.log('MS Event:', { 
        title: event.subject,
        rawStart: event.start.dateTime,
        parsedStart: startDate.toISOString()
      });
      
      return {
        id: event.id,
        calendarId,
        title: event.subject || 'No Title',
        start: startDate,
        end: endDate,
        description: event.bodyPreview,
      };
    });
  },
};
