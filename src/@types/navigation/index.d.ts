declare module '@react-navigation/native' {
  import * as React from 'react';

  export const NavigationContainer: React.ComponentType<React.PropsWithChildren<unknown>>;
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
