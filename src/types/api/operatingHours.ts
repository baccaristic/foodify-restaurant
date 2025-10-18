export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface LocalTimeDTO {
  hour: number;
  minute: number;
  second: number;
  nano: number;
}

export interface DayScheduleDTO {
  day: DayOfWeek;
  open: boolean;
  opensAt: LocalTimeDTO;
  closesAt: LocalTimeDTO;
}

export interface SpecialDayDTO {
  id: number;
  name: string;
  date: string; // ISO date string (YYYY-MM-DD)
  open: boolean;
  opensAt: LocalTimeDTO;
  closesAt: LocalTimeDTO;
}

export interface OperatingHoursResponseDTO {
  weeklySchedule: DayScheduleDTO[];
  specialDays: SpecialDayDTO[];
}

export interface UpdateWeeklyScheduleRequestDTO {
  days: DayScheduleDTO[];
}

export interface SpecialDayRequestDTO {
  name: string;
  date: string;
  open: boolean;
  opensAt: LocalTimeDTO;
  closesAt: LocalTimeDTO;
}
