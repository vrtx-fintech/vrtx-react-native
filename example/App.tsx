import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
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
  process.env.EXPO_PUBLIC_VRTX_ENVIRONMENT === Environment.Staging
    ? Environment.Staging
    : Environment.Sandbox;
const DROPDOWN_MENU_WIDTH = 196;
const DROPDOWN_VISIBLE_ROWS = 3;
const DROPDOWN_ROW_HEIGHT = 40;

const englishFonts = [
  { label: 'Geom', value: 'Geom' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Noto Sans', value: 'NotoSans' },
  { label: 'Jura', value: 'Jura' },
  { label: 'Jockey One', value: 'JockeyOne' },
] as const;

const arabicFonts = [
  { label: 'IBM Plex Sans Arabic', value: 'IBMPlexSansArabic' },
  { label: 'Noto Kufi Arabic', value: 'NotoKufiArabic' },
  { label: 'Noto Naskh Arabic', value: 'NotoNaskhArabic' },
  { label: 'Arslan Wessam B', value: 'ArslanWessamB' },
] as const;

type EnglishFont = (typeof englishFonts)[number]['value'];
type ArabicFont = (typeof arabicFonts)[number]['value'];

export default function App() {
  const [language, setLanguage] = useState<Language>(Language.English);
  const [englishFont, setEnglishFont] = useState<EnglishFont>('Geom');
  const [arabicFont, setArabicFont] = useState<ArabicFont>('IBMPlexSansArabic');
  const [openDropdown, setOpenDropdown] = useState<'english' | 'arabic' | null>(null);
  const isArabic = language === Language.Arabic;
  const activeFontFamily = isArabic ? arabicFont : englishFont;

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
        'Please set EXPO_PUBLIC_VRTX_CLIENT_ID and EXPO_PUBLIC_VRTX_CLIENT_SECRET in .env file'
      );
      return;
    }

    try {
      await setup({
        clientId: VRTX_CLIENT_ID,
        clientSecret: VRTX_CLIENT_SECRET,
        environment: VRTX_ENVIRONMENT,
        language: language as Language,
        mode: Mode.LIGHT,
        fontFamily: language === Language.English ? englishFont : arabicFont,
      });
      console.log('Vrtx SDK launched successfully');
    } catch (error: any) {
      console.error('Vrtx launch failed:', error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.hero}>
        <View style={styles.preview} />

        <View style={styles.copy}>
          <Text style={[styles.title, { fontFamily: activeFontFamily }]}>
            {isArabic ? 'مرحبًا بك في vrtx Pay' : 'Welcome to vrtx Pay'}
          </Text>
          <Text
            style={[
              styles.subtitle,
              { fontFamily: activeFontFamily, textAlign: isArabic ? 'right' : 'center' },
            ]}
          >
            {isArabic
              ? 'محفظة React Native للمدفوعات اليومية'
              : 'React Native wallet for everyday payments'}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <ControlRow isRtl={isArabic} label={isArabic ? 'اللغة' : 'Language'}>
          <SegmentedControl
            leftLabel="EN"
            rightLabel="AR"
            rightActive={language === Language.Arabic}
            onPress={() =>
              setLanguage(
                language === Language.English ? Language.Arabic : Language.English
              )
            }
          />
        </ControlRow>

        <ControlRow isRtl={isArabic} label={isArabic ? 'خط الإنجليزية' : 'English Font'}>
          <Dropdown
            isOpen={openDropdown === 'english'}
            onToggle={() =>
              setOpenDropdown(openDropdown === 'english' ? null : 'english')
            }
            onSelect={(value) => {
              setEnglishFont(value as EnglishFont);
              setOpenDropdown(null);
            }}
            options={englishFonts}
            value={englishFont}
          />
        </ControlRow>

        <ControlRow isRtl={isArabic} label={isArabic ? 'خط العربية' : 'Arabic Font'} last>
          <Dropdown
            isOpen={openDropdown === 'arabic'}
            onToggle={() =>
              setOpenDropdown(openDropdown === 'arabic' ? null : 'arabic')
            }
            onSelect={(value) => {
              setArabicFont(value as ArabicFont);
              setOpenDropdown(null);
            }}
            options={arabicFonts}
            value={arabicFont}
          />
        </ControlRow>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={handlePress}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
        ]}
      >
        <Text style={[styles.primaryButtonText, { fontFamily: activeFontFamily }]}>
          {isArabic ? 'ابدأ الآن' : 'Get started'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

type ControlRowProps = {
  children: React.ReactNode;
  isRtl: boolean;
  label: string;
  last?: boolean;
};

function ControlRow({ children, isRtl, label, last = false }: ControlRowProps) {
  return (
    <View
      style={[
        styles.controlRow,
        isRtl && styles.controlRowRtl,
        last && styles.controlRowLast,
      ]}
    >
      <Text style={[styles.controlLabel, isRtl && styles.textRtl]}>{label}</Text>
      {children}
    </View>
  );
}

type SegmentedControlProps = {
  leftLabel: string;
  onPress: () => void;
  rightActive: boolean;
  rightLabel: string;
};

function SegmentedControl({
  leftLabel,
  onPress,
  rightActive,
  rightLabel,
}: SegmentedControlProps) {
  return (
    <View style={styles.segmentGroup}>
      <Text style={[styles.segmentLabel, !rightActive && styles.segmentLabelActive]}>
        {leftLabel}
      </Text>
      <Pressable onPress={onPress} style={styles.switchTrack}>
        <View style={[styles.switchThumb, rightActive && styles.switchThumbRight]} />
      </Pressable>
      <Text style={[styles.segmentLabel, rightActive && styles.segmentLabelActive]}>
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
  isOpen: boolean;
  onSelect: (value: string) => void;
  onToggle: () => void;
  options: readonly DropdownOption[];
  value: string;
};

function Dropdown({ isOpen, onSelect, onToggle, options, value }: DropdownProps) {
  const selected = options.find((option) => option.value === value);
  const isScrollable = options.length > 3;
  const triggerRef = useRef<View>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(
    null
  );

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
        <Pressable onPress={onToggle} style={styles.dropdownTrigger}>
          <Text style={styles.selectValue}>{selected?.label}</Text>
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
                        option.value === value && styles.dropdownOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                )}
                scrollEnabled={isScrollable}
                showsVerticalScrollIndicator={isScrollable}
                style={[styles.dropdownScroll, isScrollable && styles.dropdownScrollLimited]}
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingBottom: 18,
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
  copy: {
    alignItems: 'center',
  },
  title: {
    color: '#0c0c0f',
    fontSize: 27,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    color: '#8b8d95',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
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
  primaryButtonPressed: {
    opacity: 0.82,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    backgroundColor: '#f7f7fb',
    borderRadius: 20,
    marginBottom: 76,
    paddingHorizontal: 18,
  },
  controlRow: {
    minHeight: 64,
    borderBottomColor: '#e5e6ec',
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
