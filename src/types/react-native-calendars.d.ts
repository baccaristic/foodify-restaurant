declare module 'react-native-calendars' {
  import type { ComponentType } from 'react';
  import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

  export interface DateObject {
    dateString: string;
    day: number;
    month: number;
    year: number;
    timestamp: number;
  }

  export type MarkingType = 'simple' | 'multi-dot' | 'multi-period' | 'period' | 'custom';

  export interface MarkingProps {
    selected?: boolean;
    startingDay?: boolean;
    endingDay?: boolean;
    color?: string;
    textColor?: string;
    disabled?: boolean;
  }

  export type MarkedDates = Record<string, MarkingProps>;

  export interface CalendarTheme {
    arrowColor?: string;
    todayTextColor?: string;
    selectedDayBackgroundColor?: string;
    selectedDayTextColor?: string;
    textDayFontFamily?: string;
    textMonthFontFamily?: string;
    textDayHeaderFontFamily?: string;
    textDayFontWeight?: TextStyle['fontWeight'];
    textMonthFontWeight?: TextStyle['fontWeight'];
    textDayHeaderFontWeight?: TextStyle['fontWeight'];
  }

  export interface CalendarProps {
    current?: string;
    onDayPress?: (day: DateObject) => void;
    markedDates?: MarkedDates;
    markingType?: MarkingType;
    enableSwipeMonths?: boolean;
    style?: StyleProp<ViewStyle>;
    theme?: CalendarTheme;
    firstDay?: number;
  }

  export const Calendar: ComponentType<CalendarProps>;
}
