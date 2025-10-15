declare module 'expo-av' {
  export namespace Audio {
    type AVPlaybackSource = number | string | { uri: string };

    interface Sound {
      stopAsync(): Promise<void>;
      unloadAsync(): Promise<void>;
      playAsync(): Promise<void>;
      setIsLoopingAsync(isLooping: boolean): Promise<void>;
    }

    const Sound: {
      createAsync(
        source: AVPlaybackSource,
        initialStatus?: { isLooping?: boolean; shouldPlay?: boolean },
        onPlaybackStatusUpdate?: ((status: unknown) => void) | null,
        downloadFirst?: boolean
      ): Promise<{ sound: Sound }>;
    };
  }
}
