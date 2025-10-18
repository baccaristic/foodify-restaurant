declare module 'lucide-react-native' {
  import type { FC } from 'react';
  import type { SvgProps } from 'react-native-svg';

  export interface LucideProps extends SvgProps {
    color?: string;
    size?: number;
    strokeWidth?: number;
  }

  export type LucideIcon = FC<LucideProps>;

  export const Home: LucideIcon;
  export const ShoppingBag: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Settings: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const CandyOff: LucideIcon;
  export const MessageCircleMore: LucideIcon;
  export const QrCode: LucideIcon;
  export const Plus: LucideIcon;
  export const Trash2: LucideIcon;
  export const Pencil: LucideIcon;
  export const X: LucideIcon;
  export const CalendarDays: LucideIcon;
  export const CalendarClock: LucideIcon;
  export const LogOut: LucideIcon;
  export const ScrollText: LucideIcon;
  export const Clock3: LucideIcon;
  export const Edit3: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ChevronDown: LucideIcon;
}
