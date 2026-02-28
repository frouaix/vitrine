// Copyright (c) 2026 François Rouaix

import type { GUIBaseProps } from '../types.ts';

export interface CalendarEvent {
  id: string;
  stTitle: string;
  dateStart: Date;
  dateEnd?: Date;
  stLocation?: string;
  stNotes?: string;
  stUrl?: string;
  colEvent: string;
}

export interface DateRange {
  dateStart: Date;
  dateEnd: Date;
}

export enum CalendarViewType {
  Day = 'day',
  MultiDay = 'multiday',
  Week = 'week',
  Month = 'month',
  MultiMonth = 'multimonth'
}

export interface CalendarViewBaseProps extends GUIBaseProps {
  rgEvent: CalendarEvent[];
  onNavigate?: (dateRange: DateRange) => void;
}

export interface CalendarDayViewProps extends CalendarViewBaseProps {
  cDay: number;
  dateStart: Date;
  hourStart?: number;
  hourEnd?: number;
}

export interface CalendarMonthViewProps extends CalendarViewBaseProps {
  cMonth: number;
  dateStart: Date;
  dayStartWeek?: number;
}

export interface CalendarNavProps {
  direction: 'prev' | 'next';
  onClick?: () => void;
}
