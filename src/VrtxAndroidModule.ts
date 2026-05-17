import { NativeModule, requireNativeModule } from 'expo';

type VrtxAndroidModuleEvents = {
  onSuccess: () => void;
  onError: (params: { code: string; message: string }) => void;
};

declare class VrtxAndroidModule extends NativeModule<VrtxAndroidModuleEvents> {
  readonly VERSION: string;
  readonly LIBRARY_NAME: string;

  /**
   * Initialize and launch the Vrtx SDK UI flow
   * 
   * @param clientId Your Vrtx client ID from the dashboard
   * @param clientSecret Your Vrtx client secret from the dashboard
   * @param environment The environment (SANDBOX or STAGING)
   * @param language The language for the UI (ENGLISH or ARABIC)
   * @param mode Optional display mode (LIGHT or DARK) - defaults to LIGHT
   * @param fontFamily Optional React Native font family name - defaults to the system font
   */
  setup(
    clientId: string,
    clientSecret: string,
    environment: 'SANDBOX' | 'STAGING',
    language: 'ENGLISH' | 'ARABIC',
    mode?: 'LIGHT' | 'DARK',
    fontFamily?: string
  ): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<VrtxAndroidModule>('VrtxAndroid');

export const enum Environment {
  Sandbox = 'SANDBOX',
  Staging = 'STAGING',
}

export const enum Language {
  English = 'ENGLISH',
  Arabic = 'ARABIC',
}

export const enum Mode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}

/** @deprecated Use Mode instead. */
export const enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}
