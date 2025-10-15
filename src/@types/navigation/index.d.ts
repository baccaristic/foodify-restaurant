declare module '@react-navigation/native' {
  import * as React from 'react';

  export type NavigationContainerRef<T> = {
    reset: (state: { index: number; routes: Array<{ name: keyof T; params?: any }> }) => void;
    getCurrentRoute: () => { name: keyof T } | undefined;
    isReady: () => boolean;
  };

  export interface NavigationContainerProps {
    children?: React.ReactNode;
    onReady?: () => void;
  }

  export const NavigationContainer: React.ComponentType<
    NavigationContainerProps & { ref?: any }
  >;
  export function createNavigationContainerRef<T>(): NavigationContainerRef<T>;
  export function useNavigation<T = any>(): T;
  export function useRoute<T = any>(): T;
  export const useFocusEffect: (effect: () => void | (() => void)) => void;
}

declare module '@react-navigation/stack' {
  import * as React from 'react';

  export type StackNavigationOptions = Record<string, unknown>;

  export function createStackNavigator<T>(): {
    Navigator: React.ComponentType<React.PropsWithChildren<{ screenOptions?: StackNavigationOptions }>>;
    Screen: React.ComponentType<React.PropsWithChildren<{ name: keyof T; component: React.ComponentType<any> }>>;
  };
}
