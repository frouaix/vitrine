// Copyright (c) 2026 François Rouaix

// Calendar view controls

import type { Block } from '../core/types.ts';
import { rectangle, circle, text, group } from '../core/blocks.ts';
import type {
  CalendarEvent,
  CalendarDayViewProps,
  CalendarMonthViewProps,
  DateRange
} from './calendar-types.ts';

// Constants for calendar rendering
const CALENDAR_DEFAULTS = {
  dayView: {
    dxColumnHeader: 80,
    dyColumnHeader: 40,
    dxColumn: 120,
    hourHeight: 60,
    duEventPadding: 2,
    duAllDayCircleRadius: 6,
    duAllDayCircleSpacing: 4,
    colGridLine: '#e0e0e0',
    colHeaderBg: '#f5f5f5',
    colHeaderText: '#333333',
    colHourText: '#666666',
    colEventBorder: '#ffffff',
    fontSizeHeader: 14,
    fontSizeHour: 12,
    fontSizeEvent: 11
  },
  monthView: {
    dxCell: 100,
    dyCell: 80,
    dyCellHeader: 30,
    duEventIndicatorRadius: 3,
    duEventIndicatorSpacing: 6,
    maxEventIndicators: 5,
    colGridLine: '#e0e0e0',
    colHeaderBg: '#f5f5f5',
    colHeaderText: '#333333',
    colDayText: '#333333',
    colDayTextOtherMonth: '#999999',
    colWeekendBg: '#f9f9f9',
    fontSizeHeader: 13,
    fontSizeDay: 14
  }
};

// Helper function to format date as "Fri 20"
function stFormatDayHeader(date: Date): string {
  const rgstDayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${rgstDayName[date.getDay()]} ${date.getDate()}`;
}

// Helper function to format hour as "9:00"
function stFormatHour(hour: number): string {
  const isPM = hour >= 12;
  const hourDisplay = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hourDisplay}:00 ${isPM ? 'PM' : 'AM'}`;
}

// Helper function to get month name
function stGetMonthName(date: Date): string {
  const rgstMonthName = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return rgstMonthName[date.getMonth()];
}

// Helper function to check if dates are on the same day
function fSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// Helper function to check if event is all-day
function fIsAllDayEvent(event: CalendarEvent): boolean {
  return event.dateEnd === undefined;
}

// Helper function to get events for a specific day
function rgEventForDay(rgEvent: CalendarEvent[], date: Date): CalendarEvent[] {
  return rgEvent.filter(event => {
    if (fIsAllDayEvent(event)) {
      return fSameDay(event.dateStart, date);
    }
    // For timed events, check if they overlap with the day
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return event.dateStart < dayEnd && (event.dateEnd || event.dateStart) >= dayStart;
  });
}

// Render a single day column for multi-day view
function rsRenderDayColumn(
  date: Date,
  rgEvent: CalendarEvent[],
  xColumn: number,
  hourStart: number,
  hourEnd: number,
  dxColumn: number
): Block[] {
  const rgBlock: Block[] = [];
  const dyColumnHeader = CALENDAR_DEFAULTS.dayView.dyColumnHeader;
  const hourHeight = CALENDAR_DEFAULTS.dayView.hourHeight;
  const cHour = hourEnd - hourStart;
  const dyColumn = cHour * hourHeight;

  // Day header
  rgBlock.push(
    rectangle({
      x: xColumn,
      y: 0,
      dx: dxColumn,
      dy: dyColumnHeader,
      fill: CALENDAR_DEFAULTS.dayView.colHeaderBg,
      stroke: CALENDAR_DEFAULTS.dayView.colGridLine,
      strokeWidth: 1
    })
  );

  rgBlock.push(
    text({
      text: stFormatDayHeader(date),
      x: xColumn + dxColumn / 2,
      y: dyColumnHeader / 2,
      fill: CALENDAR_DEFAULTS.dayView.colHeaderText,
      fontSize: CALENDAR_DEFAULTS.dayView.fontSizeHeader,
      align: 'center',
      baseline: 'middle'
    })
  );

  // Column background with grid lines
  for (let iHour = 0; iHour <= cHour; iHour++) {
    const yLine = dyColumnHeader + iHour * hourHeight;
    rgBlock.push(
      rectangle({
        x: xColumn,
        y: yLine,
        dx: dxColumn,
        dy: 1,
        fill: CALENDAR_DEFAULTS.dayView.colGridLine
      })
    );
  }

  // Vertical line for column
  rgBlock.push(
    rectangle({
      x: xColumn + dxColumn,
      y: dyColumnHeader,
      dx: 1,
      dy: dyColumn,
      fill: CALENDAR_DEFAULTS.dayView.colGridLine
    })
  );

  // Get events for this day
  const rgEventDay = rgEventForDay(rgEvent, date);

  // Render all-day events as circles at top
  const rgEventAllDay = rgEventDay.filter(fIsAllDayEvent);
  let xCircle = xColumn + CALENDAR_DEFAULTS.dayView.duAllDayCircleSpacing;
  const yCircle = dyColumnHeader / 2;

  rgEventAllDay.forEach((event, iEvent) => {
    if (iEvent < 8) { // Limit to 8 circles
      rgBlock.push(
        circle({
          x: xCircle,
          y: yCircle,
          radius: CALENDAR_DEFAULTS.dayView.duAllDayCircleRadius,
          fill: event.colEvent,
          stroke: CALENDAR_DEFAULTS.dayView.colEventBorder,
          strokeWidth: 1
        })
      );
      xCircle += CALENDAR_DEFAULTS.dayView.duAllDayCircleRadius * 2 + 
                 CALENDAR_DEFAULTS.dayView.duAllDayCircleSpacing;
    }
  });

  // Render timed events
  const rgEventTimed = rgEventDay.filter(event => !fIsAllDayEvent(event));
  rgEventTimed.forEach(event => {
    const dateStart = event.dateStart;
    const dateEnd = event.dateEnd || dateStart;

    // Calculate position
    const hourEventStart = dateStart.getHours() + dateStart.getMinutes() / 60;
    const hourEventEnd = dateEnd.getHours() + dateEnd.getMinutes() / 60;

    // Clamp to visible hours
    const hourStartClamped = Math.max(hourStart, hourEventStart);
    const hourEndClamped = Math.min(hourEnd, hourEventEnd);

    if (hourStartClamped < hourEndClamped) {
      const yEvent = dyColumnHeader + (hourStartClamped - hourStart) * hourHeight;
      const dyEvent = (hourEndClamped - hourStartClamped) * hourHeight;

      rgBlock.push(
        rectangle({
          x: xColumn + CALENDAR_DEFAULTS.dayView.duEventPadding,
          y: yEvent + CALENDAR_DEFAULTS.dayView.duEventPadding,
          dx: dxColumn - 2 * CALENDAR_DEFAULTS.dayView.duEventPadding,
          dy: dyEvent - 2 * CALENDAR_DEFAULTS.dayView.duEventPadding,
          fill: event.colEvent,
          stroke: CALENDAR_DEFAULTS.dayView.colEventBorder,
          strokeWidth: 1,
          cornerRadius: 4
        })
      );

      // Event title
      rgBlock.push(
        text({
          text: event.stTitle,
          x: xColumn + CALENDAR_DEFAULTS.dayView.duEventPadding + 4,
          y: yEvent + CALENDAR_DEFAULTS.dayView.duEventPadding + 4,
          fill: '#ffffff',
          fontSize: CALENDAR_DEFAULTS.dayView.fontSizeEvent,
          baseline: 'top'
        })
      );
    }
  });

  return rgBlock;
}

// Multi-day view renderer
export function rsCalendarDayView(props: CalendarDayViewProps): Block {
  const {
    cDay,
    dateStart,
    hourStart = 0,
    hourEnd = 24,
    rgEvent,
    x: xView = 0,
    y: yView = 0
  } = props;

  const dxColumn = CALENDAR_DEFAULTS.dayView.dxColumn;
  const hourHeight = CALENDAR_DEFAULTS.dayView.hourHeight;
  const dyColumnHeader = CALENDAR_DEFAULTS.dayView.dyColumnHeader;
  const cHour = hourEnd - hourStart;
  const dyColumn = cHour * hourHeight;

  const rgBlock: Block[] = [];

  // Hour labels (left side)
  const dxHourLabel = 60;
  for (let iHour = 0; iHour <= cHour; iHour++) {
    const hour = hourStart + iHour;
    const yLabel = dyColumnHeader + iHour * hourHeight;
    rgBlock.push(
      text({
        text: stFormatHour(hour),
        x: dxHourLabel - 10,
        y: yLabel,
        fill: CALENDAR_DEFAULTS.dayView.colHourText,
        fontSize: CALENDAR_DEFAULTS.dayView.fontSizeHour,
        align: 'right',
        baseline: 'middle'
      })
    );
  }

  // Render each day column
  for (let iDay = 0; iDay < cDay; iDay++) {
    const date = new Date(dateStart);
    date.setDate(date.getDate() + iDay);

    const xColumn = dxHourLabel + iDay * dxColumn;
    const rgBlockColumn = rsRenderDayColumn(date, rgEvent, xColumn, hourStart, hourEnd, dxColumn);
    rgBlock.push(...rgBlockColumn);
  }

  return group({ x: xView, y: yView }, rgBlock);
}

// Render a single month grid
function rsRenderMonthGrid(
  date: Date,
  rgEvent: CalendarEvent[],
  xMonth: number,
  yMonth: number,
  dayStartWeek: number
): Block[] {
  const rgBlock: Block[] = [];
  const dxCell = CALENDAR_DEFAULTS.monthView.dxCell;
  const dyCell = CALENDAR_DEFAULTS.monthView.dyCell;
  const dyCellHeader = CALENDAR_DEFAULTS.monthView.dyCellHeader;

  // Month title
  const stMonthYear = `${stGetMonthName(date)} ${date.getFullYear()}`;
  rgBlock.push(
    text({
      text: stMonthYear,
      x: xMonth + (7 * dxCell) / 2,
      y: yMonth + 20,
      fill: CALENDAR_DEFAULTS.monthView.colHeaderText,
      fontSize: CALENDAR_DEFAULTS.monthView.fontSizeHeader + 4,
      align: 'center',
      baseline: 'middle'
    })
  );

  // Day of week headers
  const rgstDayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const yDayHeader = yMonth + 40;

  for (let iDay = 0; iDay < 7; iDay++) {
    const dayIndex = (dayStartWeek + iDay) % 7;
    const xCell = xMonth + iDay * dxCell;

    rgBlock.push(
      rectangle({
        x: xCell,
        y: yDayHeader,
        dx: dxCell,
        dy: dyCellHeader,
        fill: CALENDAR_DEFAULTS.monthView.colHeaderBg,
        stroke: CALENDAR_DEFAULTS.monthView.colGridLine,
        strokeWidth: 1
      })
    );

    rgBlock.push(
      text({
        text: rgstDayName[dayIndex],
        x: xCell + dxCell / 2,
        y: yDayHeader + dyCellHeader / 2,
        fill: CALENDAR_DEFAULTS.monthView.colHeaderText,
        fontSize: CALENDAR_DEFAULTS.monthView.fontSizeHeader,
        align: 'center',
        baseline: 'middle'
      })
    );
  }

  // Calculate first day of month and number of days
  const dateFirstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfWeekFirstDay = dateFirstOfMonth.getDay();
  const cDayInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  // Calculate starting position (may need to show days from previous month)
  let dayOffset = (dayOfWeekFirstDay - dayStartWeek + 7) % 7;

  // Render calendar cells (up to 6 weeks)
  const yGridStart = yDayHeader + dyCellHeader;
  let dateCell = new Date(dateFirstOfMonth);
  dateCell.setDate(dateCell.getDate() - dayOffset);

  for (let iWeek = 0; iWeek < 6; iWeek++) {
    for (let iDayOfWeek = 0; iDayOfWeek < 7; iDayOfWeek++) {
      const xCell = xMonth + iDayOfWeek * dxCell;
      const yCell = yGridStart + iWeek * dyCell;

      // Check if weekend
      const fWeekend = dateCell.getDay() === 0 || dateCell.getDay() === 6;
      const fOtherMonth = dateCell.getMonth() !== date.getMonth();

      // Cell background
      rgBlock.push(
        rectangle({
          x: xCell,
          y: yCell,
          dx: dxCell,
          dy: dyCell,
          fill: fWeekend && !fOtherMonth 
            ? CALENDAR_DEFAULTS.monthView.colWeekendBg 
            : '#ffffff',
          stroke: CALENDAR_DEFAULTS.monthView.colGridLine,
          strokeWidth: 1
        })
      );

      // Day number
      rgBlock.push(
        text({
          text: dateCell.getDate().toString(),
          x: xCell + 8,
          y: yCell + 8,
          fill: fOtherMonth 
            ? CALENDAR_DEFAULTS.monthView.colDayTextOtherMonth 
            : CALENDAR_DEFAULTS.monthView.colDayText,
          fontSize: CALENDAR_DEFAULTS.monthView.fontSizeDay,
          baseline: 'top'
        })
      );

      // Event indicators
      const rgEventDay = rgEventForDay(rgEvent, dateCell);
      const cIndicator = Math.min(
        rgEventDay.length, 
        CALENDAR_DEFAULTS.monthView.maxEventIndicators
      );

      for (let iIndicator = 0; iIndicator < cIndicator; iIndicator++) {
        const event = rgEventDay[iIndicator];
        const xIndicator = xCell + 8 + iIndicator * 
          (CALENDAR_DEFAULTS.monthView.duEventIndicatorRadius * 2 + 
           CALENDAR_DEFAULTS.monthView.duEventIndicatorSpacing);
        const yIndicator = yCell + dyCell - 12;

        rgBlock.push(
          circle({
            x: xIndicator,
            y: yIndicator,
            radius: CALENDAR_DEFAULTS.monthView.duEventIndicatorRadius,
            fill: event.colEvent
          })
        );
      }

      // More indicator if needed
      if (rgEventDay.length > CALENDAR_DEFAULTS.monthView.maxEventIndicators) {
        const xMore = xCell + 8 + cIndicator * 
          (CALENDAR_DEFAULTS.monthView.duEventIndicatorRadius * 2 + 
           CALENDAR_DEFAULTS.monthView.duEventIndicatorSpacing);
        const yMore = yCell + dyCell - 12;

        rgBlock.push(
          text({
            text: `+${rgEventDay.length - cIndicator}`,
            x: xMore,
            y: yMore,
            fill: CALENDAR_DEFAULTS.monthView.colDayText,
            fontSize: 10,
            baseline: 'middle'
          })
        );
      }

      // Move to next day
      dateCell = new Date(dateCell);
      dateCell.setDate(dateCell.getDate() + 1);
    }
  }

  return rgBlock;
}

// Multi-month view renderer
export function rsCalendarMonthView(props: CalendarMonthViewProps): Block {
  const {
    cMonth,
    dateStart,
    dayStartWeek = 0,
    rgEvent,
    x: xView = 0,
    y: yView = 0
  } = props;

  const rgBlock: Block[] = [];
  const dxMonth = 7 * CALENDAR_DEFAULTS.monthView.dxCell;
  const dyMonth = 40 + CALENDAR_DEFAULTS.monthView.dyCellHeader + 
                  6 * CALENDAR_DEFAULTS.monthView.dyCell;

  // Render each month
  for (let iMonth = 0; iMonth < cMonth; iMonth++) {
    const date = new Date(dateStart.getFullYear(), dateStart.getMonth() + iMonth, 1);
    
    // Position months in a grid (2 columns max)
    const iCol = iMonth % 2;
    const iRow = Math.floor(iMonth / 2);
    const xMonth = iCol * (dxMonth + 20);
    const yMonth = iRow * (dyMonth + 20);

    const rgBlockMonth = rsRenderMonthGrid(date, rgEvent, xMonth, yMonth, dayStartWeek);
    rgBlock.push(...rgBlockMonth);
  }

  return group({ x: xView, y: yView }, rgBlock);
}
