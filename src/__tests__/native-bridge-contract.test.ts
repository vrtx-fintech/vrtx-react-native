import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Contract tests for the JavaScript ↔ native bridge.
 *
 * `setup()` sends each enum *value* to the native SDKs as a bare string, and
 * both bridges fall back to a default rather than rejecting one they do not
 * recognise:
 *
 *   Swift:  (environment.uppercased() == "PRODUCTION") ? .production : .sandbox
 *   Kotlin: "PRODUCTION" -> Environment.Production; else -> Environment.Sandbox
 *
 * An unrecognised value therefore runs the caller against sandbox with no
 * error. vrtx-flutter shipped two pub.dev releases exactly that way, with
 * production unreachable, and it would be invisible here too: the iOS job's
 * only Swift compilation is gated behind signing secrets, so nothing in CI
 * compiles these bridges at all.
 *
 * The native sources are read as text rather than imported: importing the
 * module would call `requireNativeModule('VrtxSdk')`, and no amount of mocking
 * can tell us what the *Swift* file compares against. Reading both sides is the
 * only way to check agreement without a compiler, and it keeps these tests free
 * of any simulator, emulator or signing requirement.
 */

interface EnumContract {
  /** Enum exported from `src/VrtxSdkModule.ts`. */
  readonly name: string;
  /** Public union type in `src/index.ts` that must list the same values. */
  readonly union: string;
  /** Value each native bridge selects when nothing matches. */
  readonly fallback: string;
}

const CONTRACTS: readonly EnumContract[] = [
  { name: 'Environment', union: 'VrtxEnvironment', fallback: 'SANDBOX' },
  { name: 'Language', union: 'VrtxLanguage', fallback: 'ENGLISH' },
  { name: 'Mode', union: 'VrtxMode', fallback: 'LIGHT' },
];

const repoRoot = join(__dirname, '..', '..');
const read = (...segments: string[]): string =>
  readFileSync(join(repoRoot, ...segments), 'utf8');

const moduleSource = read('src', 'VrtxSdkModule.ts');
const indexSource = read('src', 'index.ts');
const swiftBridge = read('ios', 'VrtxSdkModule.swift');
const kotlinBridge = read(
  'android',
  'src',
  'main',
  'java',
  'sa',
  'vrtx',
  'reactnative',
  'VrtxSdkModule.kt',
);
const readme = read('README.md');

interface ParsedEnum {
  readonly members: string[];
  readonly values: string[];
}

/** Parses `export enum Name { Member = 'VALUE', ... }`. */
function parseEnum(name: string): ParsedEnum {
  const block = new RegExp(`export enum ${name} \\{([^}]*)\\}`).exec(
    moduleSource,
  );
  if (block === null) {
    throw new Error(`enum ${name} not found in src/VrtxSdkModule.ts`);
  }
  const entries = [...block[1].matchAll(/(\w+)\s*=\s*'([^']+)'/g)];
  return {
    members: entries.map((entry) => entry[1]),
    values: entries.map((entry) => entry[2]),
  };
}

/** Uppercase string literals a native source compares against. */
function literalsIn(source: string): Set<string> {
  return new Set(
    (source.match(/"[A-Z][A-Z_]+"/g) ?? []).map((literal) =>
      literal.slice(1, -1),
    ),
  );
}

const swiftLiterals = literalsIn(swiftBridge);
const kotlinLiterals = literalsIn(kotlinBridge);

describe.each(CONTRACTS)('$name', ({ name, union, fallback }: EnumContract) => {
  const { members, values } = parseEnum(name);
  const nonFallback = values.filter((value) => value !== fallback);

  it('declares the value the native bridges fall back to', () => {
    expect(values).toContain(fallback);
  });

  it('is selectable on iOS — every other value is matched explicitly', () => {
    expect(nonFallback.filter((value) => !swiftLiterals.has(value))).toEqual(
      [],
    );
  });

  it('is selectable on Android — every other value is matched explicitly', () => {
    expect(nonFallback.filter((value) => !kotlinLiterals.has(value))).toEqual(
      [],
    );
  });

  it(`is mirrored by the public ${union} union`, () => {
    const declaration = new RegExp(`export type ${union} =([^;]+);`).exec(
      indexSource,
    );
    expect(declaration).not.toBeNull();

    const listed = (declaration![1].match(/'([A-Z_]+)'/g) ?? []).map((quoted) =>
      quoted.slice(1, -1),
    );
    expect([...listed].sort()).toEqual([...values].sort());
  });

  it('is documented in the README, with no member that does not exist', () => {
    for (const member of members) {
      expect(readme).toContain(`${name}.${member}`);
    }

    // The iOS SDK's README documented `Environment.production` while the case
    // was named `prod`, so integrators wrote code that would not compile.
    const documented = new Set(
      readme.match(new RegExp(`${name}\\.(\\w+)`, 'g')) ?? [],
    );
    const valid = members.map((member) => `${name}.${member}`);
    for (const entry of documented) {
      expect(valid).toContain(entry);
    }
  });
});

describe('error propagation', () => {
  // ExpoModulesCore's `Promise.reject(_ code:_ description:)` builds a base
  // `Exception`: it assigns `description` but leaves `reason` at its default
  // literal "undefined reason", and `reason` is what reaches JavaScript. A
  // caller saw `VRX_ERROR: undefined reason` instead of why the SDK failed.
  // Nothing in CI compiles the Swift bridge, so this guards the source.
  it('iOS does not use the overload that drops the message', () => {
    expect(swiftBridge).not.toMatch(/promise\.reject\(\s*"[^"]+"\s*,/);
  });

  it('iOS rejects with an Exception that surfaces a reason', () => {
    expect(swiftBridge).toMatch(/override var reason: String/);
    expect(swiftBridge).toMatch(/promise\.reject\(VrtxException\(/);
  });

  it.each([
    ['iOS', () => swiftBridge],
    ['Android', () => kotlinBridge],
  ])('%s falls back rather than surfacing a blank message', (_platform, source) => {
    // Android: `error.message ?: "Unknown error"`, iOS: `.isEmpty ? ... : ...`
    expect(source()).toMatch(/isEmpty \?|\?: "Unknown error"/);
  });
});
