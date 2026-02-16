// Copyright (c) 2026 François Rouaix

// Sample event data for calendar testing

import type { CalendarEvent } from './calendar-types.ts';

export function generateSampleEvents(): CalendarEvent[] {
  const rgEvent: CalendarEvent[] = [];
  const dateBase = new Date(2026, 1, 16); // February 16, 2026

  // All-day events
  rgEvent.push({
    id: 'evt-1',
    stTitle: 'Team Building Day',
    dateStart: new Date(2026, 1, 16),
    colEvent: '#4dabf7'
  });

  rgEvent.push({
    id: 'evt-2',
    stTitle: 'Holiday',
    dateStart: new Date(2026, 1, 17),
    colEvent: '#ff6b6b'
  });

  rgEvent.push({
    id: 'evt-3',
    stTitle: 'Conference',
    dateStart: new Date(2026, 1, 20),
    colEvent: '#51cf66'
  });

  // Timed events
  rgEvent.push({
    id: 'evt-4',
    stTitle: 'Morning Standup',
    dateStart: new Date(2026, 1, 16, 9, 0),
    dateEnd: new Date(2026, 1, 16, 9, 30),
    stLocation: 'Conference Room A',
    colEvent: '#4dabf7'
  });

  rgEvent.push({
    id: 'evt-5',
    stTitle: 'Product Review',
    dateStart: new Date(2026, 1, 16, 10, 0),
    dateEnd: new Date(2026, 1, 16, 11, 30),
    stLocation: 'Main Office',
    stNotes: 'Quarterly review of product roadmap',
    colEvent: '#845ef7'
  });

  rgEvent.push({
    id: 'evt-6',
    stTitle: 'Lunch with Client',
    dateStart: new Date(2026, 1, 16, 12, 0),
    dateEnd: new Date(2026, 1, 16, 13, 30),
    stLocation: 'Downtown Restaurant',
    colEvent: '#ff8787'
  });

  rgEvent.push({
    id: 'evt-7',
    stTitle: 'Design Workshop',
    dateStart: new Date(2026, 1, 16, 14, 0),
    dateEnd: new Date(2026, 1, 16, 16, 0),
    stLocation: 'Design Studio',
    stUrl: 'https://example.com/workshop',
    colEvent: '#ffa94d'
  });

  rgEvent.push({
    id: 'evt-8',
    stTitle: 'Team Sync',
    dateStart: new Date(2026, 1, 17, 9, 0),
    dateEnd: new Date(2026, 1, 17, 10, 0),
    colEvent: '#4dabf7'
  });

  rgEvent.push({
    id: 'evt-9',
    stTitle: 'Code Review',
    dateStart: new Date(2026, 1, 17, 11, 0),
    dateEnd: new Date(2026, 1, 17, 12, 0),
    stLocation: 'Dev Room',
    colEvent: '#20c997'
  });

  rgEvent.push({
    id: 'evt-10',
    stTitle: 'Sprint Planning',
    dateStart: new Date(2026, 1, 17, 14, 0),
    dateEnd: new Date(2026, 1, 17, 16, 0),
    stNotes: 'Planning for next sprint',
    colEvent: '#845ef7'
  });

  rgEvent.push({
    id: 'evt-11',
    stTitle: 'Coffee Chat',
    dateStart: new Date(2026, 1, 18, 10, 30),
    dateEnd: new Date(2026, 1, 18, 11, 0),
    colEvent: '#ffa94d'
  });

  rgEvent.push({
    id: 'evt-12',
    stTitle: 'Team Lunch',
    dateStart: new Date(2026, 1, 18, 12, 0),
    dateEnd: new Date(2026, 1, 18, 13, 0),
    colEvent: '#ff8787'
  });

  rgEvent.push({
    id: 'evt-13',
    stTitle: '1:1 Meeting',
    dateStart: new Date(2026, 1, 18, 15, 0),
    dateEnd: new Date(2026, 1, 18, 15, 30),
    colEvent: '#4dabf7'
  });

  rgEvent.push({
    id: 'evt-14',
    stTitle: 'Project Kickoff',
    dateStart: new Date(2026, 1, 19, 9, 30),
    dateEnd: new Date(2026, 1, 19, 11, 0),
    stLocation: 'Board Room',
    colEvent: '#51cf66'
  });

  rgEvent.push({
    id: 'evt-15',
    stTitle: 'Training Session',
    dateStart: new Date(2026, 1, 19, 13, 0),
    dateEnd: new Date(2026, 1, 19, 15, 0),
    stLocation: 'Training Center',
    stUrl: 'https://example.com/training',
    colEvent: '#845ef7'
  });

  rgEvent.push({
    id: 'evt-16',
    stTitle: 'All Hands Meeting',
    dateStart: new Date(2026, 1, 20, 10, 0),
    dateEnd: new Date(2026, 1, 20, 11, 0),
    colEvent: '#ff6b6b'
  });

  rgEvent.push({
    id: 'evt-17',
    stTitle: 'Customer Demo',
    dateStart: new Date(2026, 1, 20, 14, 0),
    dateEnd: new Date(2026, 1, 20, 15, 30),
    stLocation: 'Demo Room',
    colEvent: '#ffa94d'
  });

  // Add more events for month view testing
  for (let iDay = 1; iDay < 28; iDay++) {
    if (iDay % 3 === 0) {
      rgEvent.push({
        id: `evt-month-${iDay}`,
        stTitle: `Event ${iDay}`,
        dateStart: new Date(2026, 1, iDay, 10, 0),
        dateEnd: new Date(2026, 1, iDay, 11, 0),
        colEvent: ['#4dabf7', '#51cf66', '#845ef7', '#ffa94d'][iDay % 4]
      });
    }
  }

  return rgEvent;
}
