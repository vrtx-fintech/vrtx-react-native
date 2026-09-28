import { NativeModule, requireNativeModule } from 'expo';

type VrtxSdkModuleEvents = {
  onSuccess: () => void;
  onError: (params: { code: string; message: string }) => void;
  onExit: () => void;
};

export type VrtxDesignOption = 'OPTION_A' | 'OPTION_B' | 'OPTION_C';

export interface VrtxThemeOptions {
  cardImage?: string;
  brandLogo?: string;
  brandName?: string;
  colors?: {
    allBrands?: { primary?: string; buttonLabel?: string };
    labels?: {
      primary?: string;
      secondary?: string;
      tertiary?: string;
      quaternary?: string;
    };
    fills?: {
      primary?: string;
      secondary?: string;
      tertiary?: string;
      quaternary?: string;
      vibrant?: { secondary?: string };
    };
    backgrounds?: { primary?: string; secondary?: string };
    backgroundsGradient?: { wb01?: string; wb02?: string };
    accents?: { red?: string; green?: string; greenBg?: string };
  };
  spacing?: {
    x0?: number;
    xxs?: number;
    xs?: number;
    sm?: number;
    md?: number;
    ml?: number;
    lg?: number;
  };
  radius?: {
    s?: number;
    sm?: number;
    md?: number;
    ml?: number;
    lg?: number;
    xl?: number;
    full?: number;
    huge?: number;
  };
}

declare class VrtxSdkModule extends NativeModule<VrtxSdkModuleEvents> {
  readonly LIBRARY_NAME: string;

  /**
   * Initialize and launch the Vrtx SDK UI flow
   *
   * @param clientId Your Vrtx client ID from the dashboard
   * @param clientSecret Your Vrtx client secret from the dashboard
   * @param environment The environment (SANDBOX or PRODUCTION)
   * @param language The language for the UI (ENGLISH or ARABIC)
   * @param mode Optional display mode (LIGHT or DARK) - defaults to LIGHT
   * @param fontFamily Optional React Native font family name - defaults to the system font
   * @param externalReference Optional app-provided reference attached to the SDK session
   */
  setup(
    clientId: string,
    clientSecret: string,
    environment: 'SANDBOX' | 'PRODUCTION',
    language: 'ENGLISH' | 'ARABIC',
    mode?: 'LIGHT' | 'DARK',
    fontFamily?: string,
    externalReference?: string,
    designOption?: VrtxDesignOption,
    theme?: string,
  ): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<VrtxSdkModule>('VrtxSdk');

export enum Environment {
  Sandbox = 'SANDBOX',
  Production = 'PRODUCTION',
}

export enum Language {
  English = 'ENGLISH',
  Arabic = 'ARABIC',
}

export enum Mode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}

export enum DesignOption {
  OptionA = 'OPTION_A',
  OptionB = 'OPTION_B',
  OptionC = 'OPTION_C',
}
