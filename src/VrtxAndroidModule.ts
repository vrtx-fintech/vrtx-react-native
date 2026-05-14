import { NativeModule, requireNativeModule } from 'expo';

import { VrtxAndroidModuleEvents } from './VrtxAndroid.types';

declare class VrtxAndroidModule extends NativeModule<VrtxAndroidModuleEvents> {
  readonly VERSION: string;
  readonly LIBRARY_NAME: string;

  /**
   * Initialize and launch the Vrtx SDK UI flow
   * 
   * @param clientId Your Vrtx client ID from the dashboard
   * @param clientSecret Your Vrtx client secret from the dashboard
   * @param environment The environment (PRODUCTION, SANDBOX, or STAGING)
   * @param language The language for the UI (ENGLISH or ARABIC)
   * @param themeMode Optional theme mode (LIGHT or DARK) - defaults to LIGHT
   */
  setup(
    clientId: string,
    clientSecret: string,
    environment: 'PRODUCTION' | 'SANDBOX' | 'STAGING',
    language: 'ENGLISH' | 'ARABIC',
    themeMode?: 'LIGHT' | 'DARK'
  ): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<VrtxAndroidModule>('VrtxAndroid');

export const enum Environment {
  PRODUCTION = 'PRODUCTION',
  SANDBOX = 'SANDBOX',
  STAGING = 'STAGING',
}

export const enum Language {
  ENGLISH = 'ENGLISH',
  ARABIC = 'ARABIC',
}

export const enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}
