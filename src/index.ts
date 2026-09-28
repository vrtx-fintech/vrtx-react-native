// Native module
import VrtxSdkModule, {
  type VrtxDesignOption,
  type VrtxThemeOptions,
} from './VrtxSdkModule';
import { Platform } from 'react-native';

// Re-export enums for the public setup contract.
export { DesignOption, Environment, Language, Mode } from './VrtxSdkModule';
export type { VrtxDesignOption, VrtxThemeOptions } from './VrtxSdkModule';
export { default as VrtxSdk } from './VrtxSdkModule';

// Types
export type VrtxEnvironment = 'SANDBOX' | 'PRODUCTION';
export type VrtxLanguage = 'ENGLISH' | 'ARABIC';
export type VrtxMode = 'LIGHT' | 'DARK';

export interface VrtxConfig {
  clientId: string;
  clientSecret: string;
  environment: VrtxEnvironment;
  language?: VrtxLanguage;
  mode?: VrtxMode;
  fontFamily?: string;
  externalReference?: string;
  designOption?: VrtxDesignOption;
  theme?: VrtxThemeOptions;
}

// Promise-based setup function - resolves when SDK screen opens
export function setup(config: VrtxConfig): Promise<void>;
export function setup(
  clientId: string,
  clientSecret: string,
  environment: VrtxEnvironment,
  language?: VrtxLanguage,
  mode?: VrtxMode,
  fontFamily?: string,
  externalReference?: string,
  designOption?: VrtxDesignOption,
  theme?: VrtxThemeOptions,
): Promise<void>;
export async function setup(
  configOrClientId: VrtxConfig | string,
  clientSecret?: string,
  environment?: VrtxEnvironment,
  language: VrtxLanguage = 'ENGLISH',
  mode?: VrtxMode,
  fontFamily?: string,
  externalReference?: string,
  designOption: VrtxDesignOption = 'OPTION_C',
  theme?: VrtxThemeOptions,
): Promise<void> {
  const config =
    typeof configOrClientId === 'string'
      ? {
          clientId: configOrClientId,
          clientSecret: clientSecret!,
          environment: environment!,
          language,
          mode,
          fontFamily,
          externalReference,
          designOption,
          theme,
        }
      : configOrClientId;

  const normalizedLanguage = config.language ?? 'ENGLISH';
  const normalizedDesignOption = config.designOption ?? 'OPTION_C';
  const themeJson =
    config.theme === undefined ? undefined : JSON.stringify(config.theme);

  if (Platform.OS === 'android') {
    const optionsJson = JSON.stringify({
      language: normalizedLanguage,
      mode: config.mode,
      fontFamily: config.fontFamily,
      externalReference: config.externalReference,
      designOption: normalizedDesignOption,
      theme: themeJson,
    });

    const androidSetup = VrtxSdkModule.setup as unknown as (
      clientId: string,
      clientSecret: string,
      environment: VrtxEnvironment,
      optionsJson?: string,
    ) => Promise<void>;

    return androidSetup(
      config.clientId,
      config.clientSecret,
      config.environment,
      optionsJson,
    );
  }

  return VrtxSdkModule.setup(
    config.clientId,
    config.clientSecret,
    config.environment,
    normalizedLanguage,
    config.mode,
    config.fontFamily,
    config.externalReference,
    normalizedDesignOption,
    themeJson,
  );
}

// Type-safe addListener overloads
export function addListener(
  eventName: 'onSuccess',
  callback: () => void,
): { remove: () => void };
export function addListener(
  eventName: 'onError',
  callback: (error: { code: string; message: string }) => void,
): { remove: () => void };
export function addListener(
  eventName: 'onExit',
  callback: () => void,
): { remove: () => void };
export function addListener(
  eventName: string,
  callback: (...args: any[]) => void,
): { remove: () => void } {
  return VrtxSdkModule.addListener(eventName as any, callback);
}

// Convenience wrappers
export function onSuccess(callback: () => void) {
  return addListener('onSuccess', callback);
}

export function onError(
  callback: (error: { code: string; message: string }) => void,
) {
  return addListener('onError', callback);
}

export function onExit(callback: () => void) {
  return addListener('onExit', callback);
}
