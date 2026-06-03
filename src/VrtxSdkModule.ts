import { NativeModule, requireNativeModule } from 'expo';

type VrtxSdkModuleEvents = {
  onSuccess: () => void;
  onError: (params: { code: string; message: string }) => void;
};

declare class VrtxSdkModule extends NativeModule<VrtxSdkModuleEvents> {
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
    fontFamily?: string,
  ): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<VrtxSdkModule>('VrtxSdk');

export enum Environment {
  Sandbox = 'SANDBOX',
  Staging = 'STAGING',
}

export enum Language {
  English = 'ENGLISH',
  Arabic = 'ARABIC',
}

export enum Mode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}
