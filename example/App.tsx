import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Environment,
  Language,
  Mode,
  type VrtxThemeOptions,
  onError,
  onExit,
  onSuccess,
  setup,
} from 'vrtx-react-native';

const VRTX_CLIENT_ID = process.env.EXPO_PUBLIC_VRTX_CLIENT_ID;
const VRTX_CLIENT_SECRET = process.env.EXPO_PUBLIC_VRTX_CLIENT_SECRET;
const VRTX_ENVIRONMENT =
  process.env.EXPO_PUBLIC_VRTX_ENVIRONMENT === Environment.Production
    ? Environment.Production
    : Environment.Sandbox;
const DROPDOWN_MENU_WIDTH = 196;
const DROPDOWN_VISIBLE_ROWS = 3;
const DROPDOWN_ROW_HEIGHT = 40;

// Font lookup keys differ per platform: Android resolves a JS string
// against the resource name registered in the expo-font plugin
// (sanitised, no spaces); iOS resolves against the font file's own
// internal family name (extracted from the TTF's `name` table). We
// keep the picker labels human-readable and let Platform.select
// dispatch the platform-correct identifier.
const pickFontValue = (ios: string, android: string) =>
  Platform.OS === 'ios' ? ios : android;

const englishFonts = [
  { label: 'Geom', value: pickFontValue('Geom', 'Geom') },
  { label: 'Inter', value: pickFontValue('Inter 18pt', 'Inter') },
  { label: 'Noto Sans', value: pickFontValue('Noto Sans', 'NotoSans') },
  { label: 'Jura', value: pickFontValue('Jura', 'Jura') },
  { label: 'Jockey One', value: pickFontValue('Jockey One', 'JockeyOne') },
] as const;

const arabicFonts = [
  {
    label: 'IBM Plex Sans Arabic',
    value: pickFontValue('IBM Plex Sans Arabic', 'IBMPlexSansArabic'),
  },
  {
    label: 'Noto Kufi Arabic',
    value: pickFontValue('Noto Kufi Arabic', 'NotoKufiArabic'),
  },
  {
    label: 'Noto Naskh Arabic',
    value: pickFontValue('Noto Naskh Arabic', 'NotoNaskhArabic'),
  },
  {
    label: 'Arslan Wessam B',
    value: pickFontValue('(A) Arslan Wessam B', 'ArslanWessamB'),
  },
] as const;

type EnglishFont = (typeof englishFonts)[number]['value'];
type ArabicFont = (typeof arabicFonts)[number]['value'];

const themeOptions: VrtxThemeOptions = {
  cardImage: 'https://example.com/card.png',
  brandLogo: 'https://example.com/logo.png',
  brandName: 'Atlas Pay',
  colors: {
    allBrands: { primary: '#7C3AED', buttonLabel: '#FFFFFF' },
    labels: {
      primary: '#24113F',
      secondary: '#6D5A84',
      tertiary: '#9B89B0',
      quaternary: '#C5B8D2',
    },
    fills: {
      primary: '#F0E7FF',
      secondary: '#E4D4FF',
      tertiary: '#CEB6F4',
      quaternary: '#B99BE7',
      vibrant: { secondary: '#A78BFA' },
    },
    backgrounds: { primary: '#FBF9FF', secondary: '#F6F0FF' },
    backgroundsGradient: { wb01: '#F0E7FF', wb02: '#E9DFFF' },
    accents: { red: '#D94B71', green: '#2E9B67', greenBg: '#E1F5EA' },
  },
  spacing: { x0: 0, xxs: 2, xs: 4, sm: 8, md: 12, ml: 16, lg: 20 },
  radius: { s: 6, sm: 8, md: 12, ml: 16, lg: 20, xl: 24, full: 999, huge: 64 },
};

const appTheme = createAppTheme(themeOptions);

function createAppTheme(theme: VrtxThemeOptions) {
  const colors = theme.colors ?? {};
  const labels = colors.labels ?? {};
  const fills = colors.fills ?? {};
  const backgrounds = colors.backgrounds ?? {};
  const spacing = theme.spacing ?? {};
  const radius = theme.radius ?? {};

  return {
    light: {
      background: backgrounds.primary ?? '#FBF9FF',
      surface: backgrounds.secondary ?? '#F6F0FF',
      field: backgrounds.primary ?? '#FBF9FF',
      preview: fills.primary ?? '#F0E7FF',
      border: fills.tertiary ?? '#CEB6F4',
      primary: colors.allBrands?.primary ?? '#7C3AED',
      buttonLabel: colors.allBrands?.buttonLabel ?? '#FFFFFF',
      textPrimary: labels.primary ?? '#24113F',
      textSecondary: labels.secondary ?? '#6D5A84',
      textTertiary: labels.tertiary ?? '#9B89B0',
      activeFill: fills.secondary ?? '#E4D4FF',
      vibrant: fills.vibrant?.secondary ?? '#A78BFA',
    },
    dark: {
      background: '#170B2B',
      surface: '#24113F',
      field: '#321A50',
      preview: '#3A1E5D',
      border: '#5D3A7C',
      primary: colors.allBrands?.primary ?? '#7C3AED',
      buttonLabel: colors.allBrands?.buttonLabel ?? '#FFFFFF',
      textPrimary: '#FBF9FF',
      textSecondary: '#D7C8E6',
      textTertiary: '#B9A5CC',
      activeFill: '#4A286A',
      vibrant: '#B69AFB',
    },
    spacing: {
      xs: spacing.xs ?? 4,
      sm: spacing.sm ?? 8,
      md: spacing.md ?? 12,
      ml: spacing.ml ?? 16,
      lg: spacing.lg ?? 20,
    },
    radius: {
      sm: radius.sm ?? 8,
      md: radius.md ?? 12,
      lg: radius.lg ?? 20,
      xl: radius.xl ?? 24,
      full: radius.full ?? 999,
    },
  };
}

export default function App() {
  const sdkStateRef = useRef<'idle' | 'launching' | 'open'>('idle');
  const [language, setLanguage] = useState<Language>(Language.English);
  const [englishFont, setEnglishFont] = useState<EnglishFont>(
    englishFonts[0].value,
  );
  const [arabicFont, setArabicFont] = useState<ArabicFont>(
    arabicFonts[0].value,
  );
  const [mode, setMode] = useState<Mode>(Mode.LIGHT);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [externalReference, setExternalReference] = useState('');
  const [isSdkBusy, setIsSdkBusy] = useState(false);
  const isArabic = language === Language.Arabic;
  const isDark = mode === Mode.DARK;
  const activeFontFamily = isArabic ? arabicFont : englishFont;
  const activeFonts = isArabic ? arabicFonts : englishFonts;

  useEffect(() => {
    const successSub = onSuccess(() => {
      sdkStateRef.current = 'open';
      setIsSdkBusy(false);
      console.log('Vrtx screen is open!');
    });

    const errorSub = onError((err) => {
      sdkStateRef.current = 'idle';
      setIsSdkBusy(false);
      console.error('Vrtx error:', err.code, err.message);
      Alert.alert('Vrtx Error', err.message);
    });

    const exitSub = onExit(() => {
      sdkStateRef.current = 'idle';
      setIsSdkBusy(false);
    });

    return () => {
      successSub.remove();
      errorSub.remove();
      exitSub.remove();
    };
  }, []);

  const handlePress = async () => {
    if (!VRTX_CLIENT_ID || !VRTX_CLIENT_SECRET) {
      Alert.alert(
        'Configuration Required',
        'Please set EXPO_PUBLIC_VRTX_CLIENT_ID and EXPO_PUBLIC_VRTX_CLIENT_SECRET in .env file',
      );
      return;
    }

    if (sdkStateRef.current !== 'idle') {
      return;
    }

    sdkStateRef.current = 'launching';
    setIsSdkBusy(true);

    try {
      await setup({
        clientId: VRTX_CLIENT_ID,
        clientSecret: VRTX_CLIENT_SECRET,
        environment: VRTX_ENVIRONMENT,
        language,
        mode,
        fontFamily: activeFontFamily,
        externalReference,
        theme: themeOptions,
      });
      console.log('Vrtx SDK launched successfully');
    } catch (error: any) {
      sdkStateRef.current = 'idle';
      setIsSdkBusy(false);
      console.error('Vrtx launch failed:', error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={
            isDark ? appTheme.dark.background : appTheme.light.background
          }
        />

        <View style={styles.hero}>
          <View style={[styles.preview, isDark && styles.previewDark]} />

          <View style={styles.copy}>
            <Text
              style={[
                styles.title,
                isDark && styles.titleDark,
                { fontFamily: activeFontFamily },
              ]}
            >
              {isArabic ? 'مرحبًا بك في vrtx Pay' : 'Welcome to vrtx Pay'}
            </Text>
            <Text
              style={[
                styles.subtitle,
                isDark && styles.subtitleDark,
                {
                  fontFamily: activeFontFamily,
                  textAlign: isArabic ? 'right' : 'center',
                },
              ]}
            >
              {isArabic
                ? 'محفظة React Native للمدفوعات اليومية'
                : 'React Native wallet for everyday payments'}
            </Text>
          </View>
        </View>

        <View style={[styles.controls, isDark && styles.controlsDark]}>
          <ControlRow
            isDark={isDark}
            isRtl={isArabic}
            label={isArabic ? 'اللغة' : 'Language'}
          >
            <SegmentedControl
              isDark={isDark}
              leftLabel="EN"
              rightLabel="AR"
              rightActive={language === Language.Arabic}
              onPress={() =>
                setLanguage(
                  language === Language.English
                    ? Language.Arabic
                    : Language.English,
                )
              }
            />
          </ControlRow>

          <ControlRow
            isDark={isDark}
            isRtl={isArabic}
            label={isArabic ? 'الخط' : 'Font'}
          >
            <Dropdown
              isDark={isDark}
              isOpen={isFontDropdownOpen}
              onToggle={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
              onSelect={(value) => {
                if (isArabic) {
                  setArabicFont(value as ArabicFont);
                } else {
                  setEnglishFont(value as EnglishFont);
                }
                setIsFontDropdownOpen(false);
              }}
              options={activeFonts}
              value={activeFontFamily}
            />
          </ControlRow>

          <ControlRow
            isDark={isDark}
            isRtl={isArabic}
            label={isArabic ? 'المظهر' : 'Mode'}
          >
            <SegmentedControl
              isDark={isDark}
              leftLabel={isArabic ? 'فاتح' : 'Light'}
              rightLabel={isArabic ? 'داكن' : 'Dark'}
              rightActive={mode === Mode.DARK}
              onPress={() =>
                setMode(mode === Mode.LIGHT ? Mode.DARK : Mode.LIGHT)
              }
            />
          </ControlRow>

          <ControlRow
            isDark={isDark}
            isRtl={isArabic}
            label={isArabic ? 'مرجع خارجي' : 'External ref'}
            last
          >
            <TextInput
              accessibilityLabel="External reference"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setExternalReference}
              placeholder="Reference"
              style={[
                styles.externalReferenceInput,
                isDark && styles.externalReferenceInputDark,
              ]}
              value={externalReference}
            />
          </ControlRow>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isSdkBusy}
          onPress={handlePress}
          style={({ pressed }) => [
            styles.primaryButton,
            isDark && styles.primaryButtonDark,
            isSdkBusy && styles.primaryButtonDisabled,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          {isSdkBusy && (
            <ActivityIndicator
              color={
                isDark ? appTheme.dark.buttonLabel : appTheme.light.buttonLabel
              }
              size="small"
              style={styles.primaryButtonLoader}
            />
          )}
          <Text
            style={[
              styles.primaryButtonText,
              isDark && styles.primaryButtonTextDark,
              { fontFamily: activeFontFamily },
            ]}
          >
            {isSdkBusy
              ? isArabic
                ? 'جارٍ التحميل...'
                : 'Loading...'
              : isArabic
                ? 'ابدأ الآن'
                : 'Get started'}
          </Text>
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

type ControlRowProps = {
  children: React.ReactNode;
  isDark: boolean;
  isRtl: boolean;
  label: string;
  last?: boolean;
};

function ControlRow({
  children,
  isDark,
  isRtl,
  label,
  last = false,
}: ControlRowProps) {
  return (
    <View
      style={[
        styles.controlRow,
        isDark && styles.controlRowDark,
        isRtl && styles.controlRowRtl,
        last && styles.controlRowLast,
      ]}
    >
      <Text
        style={[
          styles.controlLabel,
          isDark && styles.controlLabelDark,
          isRtl && styles.textRtl,
        ]}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

type SegmentedControlProps = {
  isDark: boolean;
  leftLabel: string;
  onPress: () => void;
  rightActive: boolean;
  rightLabel: string;
};

function SegmentedControl({
  isDark,
  leftLabel,
  onPress,
  rightActive,
  rightLabel,
}: SegmentedControlProps) {
  return (
    <View style={styles.segmentGroup}>
      <Text
        style={[
          styles.segmentLabel,
          isDark && styles.segmentLabelDark,
          !rightActive && styles.segmentLabelActive,
        ]}
      >
        {leftLabel}
      </Text>
      <Pressable
        onPress={onPress}
        style={[styles.switchTrack, isDark && styles.switchTrackDark]}
      >
        <View
          style={[styles.switchThumb, rightActive && styles.switchThumbRight]}
        />
      </Pressable>
      <Text
        style={[
          styles.segmentLabel,
          isDark && styles.segmentLabelDark,
          rightActive && styles.segmentLabelActive,
        ]}
      >
        {rightLabel}
      </Text>
    </View>
  );
}

type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = {
  isDark: boolean;
  isOpen: boolean;
  onSelect: (value: string) => void;
  onToggle: () => void;
  options: readonly DropdownOption[];
  value: string;
};

function Dropdown({
  isDark,
  isOpen,
  onSelect,
  onToggle,
  options,
  value,
}: DropdownProps) {
  const selected = options.find((option) => option.value === value);
  const isScrollable = options.length > 3;
  const triggerRef = useRef<View>(null);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const handleToggle = () => {
    if (isOpen) {
      setMenuPosition(null);
    }
    onToggle();
  };

  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPosition({
        left: x + width - DROPDOWN_MENU_WIDTH,
        top: y + height + 6,
      });
    });
  }, [isOpen]);

  return (
    <View style={styles.dropdown}>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          onPress={handleToggle}
          style={[styles.dropdownTrigger, isDark && styles.dropdownTriggerDark]}
        >
          <Text style={[styles.selectValue, isDark && styles.selectValueDark]}>
            {selected?.label}
          </Text>
          <Text style={styles.chevron}>{isOpen ? '▴' : '▾'}</Text>
        </Pressable>
      </View>

      <Modal transparent visible={isOpen} onRequestClose={handleToggle}>
        <View style={styles.dropdownModal}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleToggle} />
          {menuPosition && (
            <View style={[styles.dropdownMenu, menuPosition]}>
              <FlatList
                data={options}
                keyExtractor={(option) => option.value}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                renderItem={({ item: option }) => (
                  <Pressable
                    onPress={() => onSelect(option.value)}
                    style={[
                      styles.dropdownOption,
                      option.value === value && styles.dropdownOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        option.value === value &&
                          styles.dropdownOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                )}
                scrollEnabled={isScrollable}
                showsVerticalScrollIndicator={isScrollable}
                style={[
                  styles.dropdownScroll,
                  isScrollable && styles.dropdownScrollLimited,
                ]}
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: appTheme.light.background,
    paddingHorizontal: appTheme.spacing.lg,
    paddingBottom:
      appTheme.spacing.md + appTheme.spacing.xs + appTheme.spacing.sm,
  },
  containerDark: {
    backgroundColor: appTheme.dark.background,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: appTheme.spacing.lg,
  },
  preview: {
    width: 200,
    height: 200,
    borderRadius: appTheme.radius.xl,
    backgroundColor: appTheme.light.preview,
    marginBottom: appTheme.spacing.lg * 2 + appTheme.spacing.md,
  },
  previewDark: {
    backgroundColor: appTheme.dark.preview,
  },
  copy: {
    alignItems: 'center',
  },
  title: {
    color: appTheme.light.textPrimary,
    fontSize: 27,
    fontWeight: '700',
    lineHeight: 34,
  },
  titleDark: {
    color: appTheme.dark.textPrimary,
  },
  subtitle: {
    color: appTheme.light.textTertiary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: appTheme.spacing.sm + appTheme.spacing.xs / 2,
  },
  subtitleDark: {
    color: appTheme.dark.textSecondary,
  },
  primaryButton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    height: 46,
    borderRadius: appTheme.radius.full,
    backgroundColor: appTheme.light.primary,
    marginBottom: appTheme.spacing.sm,
    transform: [{ translateY: -(appTheme.spacing.lg * 3) }],
  },
  primaryButtonDark: {
    backgroundColor: appTheme.dark.primary,
  },
  primaryButtonPressed: {
    opacity: 0.82,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonLoader: {
    marginRight: appTheme.spacing.sm,
  },
  primaryButtonText: {
    color: appTheme.light.buttonLabel,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonTextDark: {
    color: appTheme.dark.buttonLabel,
  },
  controls: {
    backgroundColor: appTheme.light.surface,
    borderRadius: appTheme.radius.xl,
    marginBottom: appTheme.spacing.lg * 3 + appTheme.spacing.xs,
    paddingHorizontal: appTheme.spacing.ml,
  },
  controlsDark: {
    backgroundColor: appTheme.dark.surface,
  },
  controlRow: {
    minHeight: appTheme.spacing.lg * 3 + appTheme.spacing.md,
    borderBottomColor: appTheme.light.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlRowDark: {
    borderBottomColor: appTheme.dark.border,
  },
  controlRowRtl: {
    flexDirection: 'row-reverse',
  },
  controlRowLast: {
    borderBottomWidth: 0,
  },
  controlLabel: {
    color: appTheme.light.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  controlLabelDark: {
    color: appTheme.dark.textPrimary,
  },
  textRtl: {
    textAlign: 'right',
  },
  segmentGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.sm + appTheme.spacing.xs / 2,
  },
  segmentLabel: {
    color: appTheme.light.textSecondary,
    fontSize: 15,
  },
  segmentLabelDark: {
    color: appTheme.dark.textSecondary,
  },
  segmentLabelActive: {
    color: appTheme.light.textPrimary,
    fontWeight: '600',
  },
  switchTrack: {
    width: 54,
    height: 32,
    borderRadius: appTheme.radius.full,
    backgroundColor: appTheme.light.activeFill,
    padding: 4,
    justifyContent: 'center',
  },
  switchTrackDark: {
    backgroundColor: appTheme.dark.border,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.light.background,
  },
  switchThumbRight: {
    alignSelf: 'flex-end',
    backgroundColor: appTheme.light.vibrant,
  },
  selectValue: {
    color: appTheme.light.textPrimary,
    fontSize: 15,
  },
  selectValueDark: {
    color: appTheme.dark.textPrimary,
  },
  dropdown: {
    alignItems: 'flex-end',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.xs + appTheme.spacing.xs / 2,
    minHeight: 36,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.light.background,
    paddingHorizontal: appTheme.spacing.md,
  },
  dropdownTriggerDark: {
    backgroundColor: appTheme.dark.field,
  },
  externalReferenceInput: {
    width: 196,
    minHeight: 36,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.light.background,
    color: appTheme.light.textPrimary,
    fontSize: 14,
    paddingHorizontal: appTheme.spacing.md,
    textAlign: 'right',
  },
  externalReferenceInputDark: {
    backgroundColor: appTheme.dark.field,
    color: appTheme.dark.textPrimary,
  },
  chevron: {
    color: appTheme.light.textSecondary,
    fontSize: 12,
  },
  dropdownModal: {
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    width: DROPDOWN_MENU_WIDTH,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.light.background,
    paddingVertical: appTheme.spacing.xs + 2,
    borderColor: appTheme.light.border,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
    zIndex: 3,
  },
  dropdownScroll: {
    flexGrow: 0,
  },
  dropdownScrollLimited: {
    height: DROPDOWN_VISIBLE_ROWS * DROPDOWN_ROW_HEIGHT,
  },
  dropdownOption: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: appTheme.spacing.md,
    marginHorizontal: appTheme.spacing.xs + 2,
    borderRadius: appTheme.radius.sm,
  },
  dropdownOptionActive: {
    backgroundColor: appTheme.light.activeFill,
  },
  dropdownOptionText: {
    color: appTheme.light.textSecondary,
    fontSize: 14,
  },
  dropdownOptionTextActive: {
    color: appTheme.light.textPrimary,
    fontWeight: '600',
  },
});
