// Native module
import VrtxAndroidModule from './VrtxAndroidModule';

// Re-export enums for compatibility
export { Environment, Language, ThemeMode } from './VrtxAndroidModule';
export { default as VrtxAndroid } from './VrtxAndroidModule';

// Types
export type VrtxEnvironment = 'PRODUCTION' | 'SANDBOX' | 'STAGING';
export type VrtxLanguage = 'ENGLISH' | 'ARABIC';
export type VrtxThemeMode = 'LIGHT' | 'DARK';

export interface VrtxConfig {
  clientId: string;
  clientSecret: string;
  environment: VrtxEnvironment;
  language?: VrtxLanguage;
  themeMode?: VrtxThemeMode;
}

// Promise-based setup function - resolves when SDK screen opens
export async function setup(
  clientId: string,
  clientSecret: string,
  environment: VrtxEnvironment,
  language: VrtxLanguage = 'ENGLISH',
  themeMode?: VrtxThemeMode
): Promise<void> {
  return await VrtxAndroidModule.setup(
    clientId,
    clientSecret,
    environment,
    language,
    themeMode
  );
}

// Type-safe addListener overloads
export function addListener(eventName: 'onSuccess', callback: () => void): { remove: () => void };
export function addListener(eventName: 'onError', callback: (error: { code: string; message: string }) => void): { remove: () => void };
export function addListener(eventName: string, callback: (...args: any[]) => void): { remove: () => void } {
  return VrtxAndroidModule.addListener(eventName as any, callback);
}

// Convenience wrappers
export function onSuccess(callback: () => void) {
  return addListener('onSuccess', callback);
}

export function onError(callback: (error: { code: string; message: string }) => void) {
  return addListener('onError', callback);
}

