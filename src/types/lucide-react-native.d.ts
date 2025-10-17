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
  export const CandyOff: LucideIcon;
  export const MessageCircleMore: LucideIcon;
  export const QrCode: LucideIcon;
  export const Plus: LucideIcon;
  export const Trash2: LucideIcon;
  export const Pencil: LucideIcon;
  export const X: LucideIcon;
  export const CalendarDays: LucideIcon;
}
