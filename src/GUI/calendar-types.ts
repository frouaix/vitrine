// Copyright (c) 2026 François Rouaix

// Calendar view type definitions

import type { GUIBaseProps } from './types.ts';

// Calendar event model
export interface CalendarEvent {
  id: string;
  stTitle: string;
  // Either a single date (all-day event) or a time range
  dateStart: Date;
  dateEnd?: Date; // If undefined, it's an all-day event
  stLocation?: string;
  stNotes?: string;
  stUrl?: string;
  colEvent: string; // CSS color
}

// Date range for view bounds
export interface DateRange {
  dateStart: Date;
  dateEnd: Date;
}

// Calendar view types
export enum CalendarViewType {
  Day = 'day',
  MultiDay = 'multiday',
  Week = 'week',
  Month = 'month',
  MultiMonth = 'multimonth'
}

// Base calendar view props
export interface CalendarViewBaseProps extends GUIBaseProps {
  rgEvent: CalendarEvent[];
  onNavigate?: (dateRange: DateRange) => void;
}

// Multi-day view props (1-10 days)
export interface CalendarDayViewProps extends CalendarViewBaseProps {
  cDay: number; // Number of days to display (1-10)
  dateStart: Date; // Starting date
  hourStart?: number; // Start hour (0-23), default 0
  hourEnd?: number; // End hour (0-23), default 24
}

// Multi-month view props (1-N months)
export interface CalendarMonthViewProps extends CalendarViewBaseProps {
  cMonth: number; // Number of months to display
  dateStart: Date; // Starting month (use first day of month)
  dayStartWeek?: number; // 0=Sunday, 1=Monday, default 0
}

// Navigation button props
export interface CalendarNavProps {
  direction: 'prev' | 'next';
  onClick?: () => void;
}
