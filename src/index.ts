// Native module
import VrtxAndroidModule from './VrtxAndroidModule';

// Re-export enums for the public setup contract.
export { Environment, Language, Mode } from './VrtxAndroidModule';
export { default as VrtxAndroid } from './VrtxAndroidModule';

// Types
export type VrtxEnvironment = 'SANDBOX' | 'STAGING';
export type VrtxLanguage = 'ENGLISH' | 'ARABIC';
export type VrtxMode = 'LIGHT' | 'DARK';

export interface VrtxConfig {
  clientId: string;
  clientSecret: string;
  environment: VrtxEnvironment;
  language?: VrtxLanguage;
  mode?: VrtxMode;
  fontFamily?: string;
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
): Promise<void>;
export async function setup(
  configOrClientId: VrtxConfig | string,
  clientSecret?: string,
  environment?: VrtxEnvironment,
  language: VrtxLanguage = 'ENGLISH',
  mode?: VrtxMode,
  fontFamily?: string,
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
        }
      : configOrClientId;

  return await VrtxAndroidModule.setup(
    config.clientId,
    config.clientSecret,
    config.environment,
    config.language ?? 'ENGLISH',
    config.mode,
    config.fontFamily,
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
  eventName: string,
  callback: (...args: any[]) => void,
): { remove: () => void } {
  return VrtxAndroidModule.addListener(eventName as any, callback);
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
