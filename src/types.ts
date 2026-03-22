export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ConnectedAccount {
  id: string;
  userId: string;
  provider: 'google' | 'microsoft';
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface Calendar {
  id: string;
  accountId: string;
  name: string;
  color: string;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
}

export interface CalendarBoard {
  id: string;
  userId: string;
  name: string;
  calendarIds: string[];
  maskEvents: boolean;
  dateRangeType: 'current_week' | 'two_weeks' | 'custom';
  showPastEvents: boolean;
  customDaysAhead?: number;
  customDaysBehind?: number;
  shareToken: string;
}

export interface DateRangeConfig {
  start: Date;
  end: Date;
}
