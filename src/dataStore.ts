import type { User, ConnectedAccount, Calendar, CalendarEvent, CalendarBoard } from './types';
import { v4 as uuidv4 } from 'uuid';
import { addDays, startOfDay } from 'date-fns';

class DataStore {
  private getItem<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setItem<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Users
  getUsers(): User[] {
    return this.getItem<User>('users');
  }

  addUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    this.setItem('users', users);
  }

  getUserByEmail(email: string): User | undefined {
    return this.getUsers().find(u => u.email === email);
  }

  // Connected Accounts
  getAccounts(): ConnectedAccount[] {
    return this.getItem<ConnectedAccount>('accounts');
  }

  addAccount(account: ConnectedAccount): void {
    const accounts = this.getAccounts();
    // Check if account with same email and provider already exists for this user
    const existingAccount = accounts.find(
      a => a.userId === account.userId && 
           a.email === account.email && 
           a.provider === account.provider
    );
    
    if (existingAccount) {
      console.warn(`Account already exists for ${account.email} (${account.provider})`);
      return;
    }
    
    accounts.push(account);
    this.setItem('accounts', accounts);
  }

  getAccountsByUserId(userId: string): ConnectedAccount[] {
    return this.getAccounts().filter(a => a.userId === userId);
  }

  accountExists(userId: string, email: string, provider: 'google' | 'microsoft'): boolean {
    return this.getAccounts().some(
      a => a.userId === userId && a.email === email && a.provider === provider
    );
  }

  // Calendars
  getCalendars(): Calendar[] {
    return this.getItem<Calendar>('calendars');
  }

  addCalendar(calendar: Calendar): void {
    const calendars = this.getCalendars();
    calendars.push(calendar);
    this.setItem('calendars', calendars);
  }

  getCalendarsByAccountId(accountId: string): Calendar[] {
    return this.getCalendars().filter(c => c.accountId === accountId);
  }

  getCalendarsByIds(ids: string[]): Calendar[] {
    return this.getCalendars().filter(c => ids.includes(c.id));
  }

  // Events
  getEvents(): CalendarEvent[] {
    const events = this.getItem<CalendarEvent>('events');
    return events.map(e => ({ ...e, start: new Date(e.start), end: new Date(e.end) }));
  }

  addEvent(event: CalendarEvent): void {
    const events = this.getEvents();
    // Check if event already exists by checking eventId and calendarId
    const eventExists = events.some(
      e => e.id === event.id && e.calendarId === event.calendarId
    );
    
    if (eventExists) {
      console.log(`Event ${event.id} already exists in calendar ${event.calendarId}`);
      return;
    }
    
    events.push(event);
    this.setItem('events', events);
  }

  addEvents(newEvents: CalendarEvent[]): void {
    const events = this.getEvents();
    newEvents.forEach(event => {
      const eventExists = events.some(
        e => e.id === event.id && e.calendarId === event.calendarId
      );
      if (!eventExists) {
        events.push(event);
      }
    });
    this.setItem('events', events);
  }

  getEventsByCalendarIds(calendarIds: string[]): CalendarEvent[] {
    return this.getEvents().filter(e => calendarIds.includes(e.calendarId));
  }

  // Boards
  getBoards(): CalendarBoard[] {
    return this.getItem<CalendarBoard>('boards');
  }

  addBoard(board: CalendarBoard): void {
    const boards = this.getBoards();
    boards.push(board);
    this.setItem('boards', boards);
  }

  updateBoard(board: CalendarBoard): void {
    const boards = this.getBoards();
    const index = boards.findIndex(b => b.id === board.id);
    if (index !== -1) {
      boards[index] = board;
      this.setItem('boards', boards);
    }
  }

  getBoardsByUserId(userId: string): CalendarBoard[] {
    return this.getBoards().filter(b => b.userId === userId);
  }

  getBoardByShareToken(token: string): CalendarBoard | undefined {
    return this.getBoards().find(b => b.shareToken === token);
  }

  deleteBoard(boardId: string): void {
    const boards = this.getBoards().filter(b => b.id !== boardId);
    this.setItem('boards', boards);
  }

  // Remove duplicate accounts (same userId + email + provider), keep the latest
  deduplicateAccounts(): void {
    const accounts = this.getAccounts();
    const seen = new Map<string, ConnectedAccount>();
    accounts.forEach(a => {
      const key = `${a.userId}-${a.email}-${a.provider}`;
      const existing = seen.get(key);
      // Keep the one with the latest expiresAt
      if (!existing || (a.expiresAt || 0) > (existing.expiresAt || 0)) {
        seen.set(key, a);
      }
    });
    this.setItem('accounts', Array.from(seen.values()));
  }

  // Mock calendar connection - simulates OAuth
  mockConnectCalendar(userId: string, provider: 'google' | 'microsoft', email: string): void {
    const accountId = uuidv4();
    const account: ConnectedAccount = {
      id: accountId,
      userId,
      provider,
      email,
      accessToken: `mock_token_${accountId}`,
      refreshToken: `mock_refresh_${accountId}`,
      expiresAt: Date.now() + 3600000
    };
    this.addAccount(account);

    // Create mock calendars
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const calendarNames = provider === 'google' 
      ? ['Primary', 'Work', 'Personal']
      : ['Calendar', 'Work Calendar', 'Team Calendar'];

    calendarNames.forEach((name, idx) => {
      const calendarId = uuidv4();
      this.addCalendar({
        id: calendarId,
        accountId,
        name: `${email} - ${name}`,
        color: colors[idx % colors.length]
      });

      // Add mock events
      this.generateMockEvents(calendarId);
    });
  }

  connectRealCalendar(userId: string, provider: 'google' | 'microsoft', email: string, accessToken: string, refreshToken: string, expiresAt: number, calendars: Calendar[]): string {
    // If account already exists, update the token instead of creating duplicate
    const existing = this.getAccounts().find(
      a => a.userId === userId && a.email === email && a.provider === provider
    );

    if (existing) {
      this.updateAccountToken(existing.id, accessToken, expiresAt);
      return existing.id;
    }

    const accountId = uuidv4();
    const account: ConnectedAccount = {
      id: accountId,
      userId,
      provider,
      email,
      accessToken,
      refreshToken,
      expiresAt
    };
    this.addAccount(account);

    calendars.forEach(cal => {
      this.addCalendar({ ...cal, accountId });
    });

    return accountId;
  }

  updateAccountToken(accountId: string, accessToken: string, expiresAt: number): void {
    const accounts = this.getAccounts();
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      account.accessToken = accessToken;
      account.expiresAt = expiresAt;
      this.setItem('accounts', accounts);
    }
  }

  private generateMockEvents(calendarId: string): void {
    const today = startOfDay(new Date());
    const events = [
      { title: 'Team Meeting', daysOffset: -2, duration: 1 },
      { title: 'Client Call', daysOffset: 0, duration: 2 },
      { title: 'Project Review', daysOffset: 1, duration: 1.5 },
      { title: 'Lunch with Team', daysOffset: 2, duration: 1 },
      { title: 'Sprint Planning', daysOffset: 3, duration: 2 },
      { title: 'One-on-One', daysOffset: 5, duration: 0.5 },
      { title: 'Workshop', daysOffset: 7, duration: 3 },
      { title: 'Conference', daysOffset: 10, duration: 4 },
    ];

    events.forEach(({ title, daysOffset, duration }) => {
      const start = addDays(today, daysOffset);
      start.setHours(10, 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + Math.floor(duration), (duration % 1) * 60, 0, 0);

      this.addEvent({
        id: uuidv4(),
        calendarId,
        title,
        start,
        end,
        description: `Description for ${title}`
      });
    });
  }
}

export const dataStore = new DataStore();
