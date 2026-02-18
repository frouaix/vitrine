// Copyright (c) 2026 François Rouaix

export const CALENDAR_DEFAULTS = {
  dayView: {
    dxColumnHeader: 80,
    dyColumnHeader: 40,
    dxColumn: 120,
    dyHour: 60,
    dxHourLabel: 60,
    duEventPadding: 2,
    duAllDayCircleRadius: 6,
    duAllDayCircleSpacing: 4,
    cMaxAllDayCircles: 8,
    duEventCornerRadius: 4,
    duEventTitlePadding: 4,
    duHourLabelOffset: 10,
    colGridLine: '#e0e0e0',
    colHeaderBg: '#f5f5f5',
    colHeaderText: '#333333',
    colHourText: '#666666',
    colEventBorder: '#ffffff',
    duFontSizeHeader: 14,
    duFontSizeHour: 12,
    duFontSizeEvent: 11
  },
  monthView: {
    dxCell: 100,
    dyCell: 80,
    dyCellHeader: 30,
    duEventIndicatorRadius: 3,
    duEventIndicatorSpacing: 6,
    cMaxEventIndicators: 5,
    cWeeksInGrid: 6,
    duMonthTitleOffset: 20,
    duMonthGridSpacing: 20,
    duDayHeaderOffset: 40,
    duDayCellPadding: 8,
    duDayIndicatorOffset: 12,
    colGridLine: '#e0e0e0',
    colHeaderBg: '#f5f5f5',
    colHeaderText: '#333333',
    colDayText: '#333333',
    colDayTextOtherMonth: '#999999',
    colWeekendBg: '#f9f9f9',
    duFontSizeHeader: 13,
    duFontSizeDay: 14,
    duFontSizeMore: 10
  }
} as const;
