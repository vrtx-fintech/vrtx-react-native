import React, { useEffect, useRef, useState } from 'react';
import {
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
  onError,
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

export default function App() {
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
  const isArabic = language === Language.Arabic;
  const isDark = mode === Mode.DARK;
  const activeFontFamily = isArabic ? arabicFont : englishFont;
  const activeFonts = isArabic ? arabicFonts : englishFonts;

  useEffect(() => {
    const successSub = onSuccess(() => {
      console.log('Vrtx screen is open!');
    });

    const errorSub = onError((err) => {
      console.error('Vrtx error:', err.code, err.message);
      Alert.alert('Vrtx Error', err.message);
    });

    return () => {
      successSub.remove();
      errorSub.remove();
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

    try {
      await setup({
        clientId: VRTX_CLIENT_ID,
        clientSecret: VRTX_CLIENT_SECRET,
        environment: VRTX_ENVIRONMENT,
        language,
        mode,
        fontFamily: activeFontFamily,
        externalReference,
      });
      console.log('Vrtx SDK launched successfully');
    } catch (error: any) {
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
          backgroundColor={isDark ? '#111217' : '#ffffff'}
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
          onPress={handlePress}
          style={({ pressed }) => [
            styles.primaryButton,
            isDark && styles.primaryButtonDark,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text
            style={[
              styles.primaryButtonText,
              isDark && styles.primaryButtonTextDark,
              { fontFamily: activeFontFamily },
            ]}
          >
            {isArabic ? 'ابدأ الآن' : 'Get started'}
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

  useEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }

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
          onPress={onToggle}
          style={[styles.dropdownTrigger, isDark && styles.dropdownTriggerDark]}
        >
          <Text style={[styles.selectValue, isDark && styles.selectValueDark]}>
            {selected?.label}
          </Text>
          <Text style={styles.chevron}>{isOpen ? '▴' : '▾'}</Text>
        </Pressable>
      </View>

      <Modal transparent visible={isOpen} onRequestClose={onToggle}>
        <View style={styles.dropdownModal}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onToggle} />
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  containerDark: {
    backgroundColor: '#111217',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
  },
  preview: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: '#f3f4f8',
    marginBottom: 52,
  },
  previewDark: {
    backgroundColor: '#25272f',
  },
  copy: {
    alignItems: 'center',
  },
  title: {
    color: '#0c0c0f',
    fontSize: 27,
    fontWeight: '700',
    lineHeight: 34,
  },
  titleDark: {
    color: '#ffffff',
  },
  subtitle: {
    color: '#8b8d95',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
  },
  subtitleDark: {
    color: '#b8bac3',
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 23,
    backgroundColor: '#050505',
    marginBottom: 8,
    transform: [{ translateY: -60 }],
  },
  primaryButtonDark: {
    backgroundColor: '#ffffff',
  },
  primaryButtonPressed: {
    opacity: 0.82,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonTextDark: {
    color: '#111217',
  },
  controls: {
    backgroundColor: '#f7f7fb',
    borderRadius: 20,
    marginBottom: 76,
    paddingHorizontal: 18,
  },
  controlsDark: {
    backgroundColor: '#1c1e25',
  },
  controlRow: {
    minHeight: 64,
    borderBottomColor: '#e5e6ec',
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlRowDark: {
    borderBottomColor: '#343741',
  },
  controlRowRtl: {
    flexDirection: 'row-reverse',
  },
  controlRowLast: {
    borderBottomWidth: 0,
  },
  controlLabel: {
    color: '#111217',
    fontSize: 16,
    fontWeight: '600',
  },
  controlLabelDark: {
    color: '#ffffff',
  },
  textRtl: {
    textAlign: 'right',
  },
  segmentGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  segmentLabel: {
    color: '#7b7d87',
    fontSize: 15,
  },
  segmentLabelDark: {
    color: '#b8bac3',
  },
  segmentLabelActive: {
    color: '#111217',
    fontWeight: '600',
  },
  switchTrack: {
    width: 54,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e1e2e7',
    padding: 4,
    justifyContent: 'center',
  },
  switchTrackDark: {
    backgroundColor: '#343741',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  switchThumbRight: {
    alignSelf: 'flex-end',
  },
  selectValue: {
    color: '#111217',
    fontSize: 15,
  },
  selectValueDark: {
    color: '#ffffff',
  },
  dropdown: {
    alignItems: 'flex-end',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  dropdownTriggerDark: {
    backgroundColor: '#292c35',
  },
  externalReferenceInput: {
    width: 196,
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    color: '#111217',
    fontSize: 14,
    paddingHorizontal: 12,
    textAlign: 'right',
  },
  externalReferenceInputDark: {
    backgroundColor: '#292c35',
    color: '#ffffff',
  },
  chevron: {
    color: '#7b7d87',
    fontSize: 12,
  },
  dropdownModal: {
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    width: DROPDOWN_MENU_WIDTH,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    borderColor: '#e5e6ec',
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
    paddingHorizontal: 12,
    marginHorizontal: 6,
    borderRadius: 8,
  },
  dropdownOptionActive: {
    backgroundColor: '#f1f2f6',
  },
  dropdownOptionText: {
    color: '#7b7d87',
    fontSize: 14,
  },
  dropdownOptionTextActive: {
    color: '#111217',
    fontWeight: '600',
  },
});
