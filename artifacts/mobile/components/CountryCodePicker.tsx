import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CountryCode } from '@/utils/countries';
import { getCountryOptions } from '@/utils/countries';
import type { Language } from '@/localization/preferences';

type Props = {
  visible: boolean;
  language: Language;
  isRTL: boolean;
  selected: CountryCode;
  onSelect: (country: CountryCode) => void;
  onClose: () => void;
};

export function CountryCodePicker({ visible, language, isRTL, selected, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const options = useMemo(() => getCountryOptions(language), [language]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '');
    if (!q) return options;
    return options.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.country.toLowerCase() === q ||
        o.callingCode.replace(/^\+/, '').startsWith(q),
    );
  }, [options, query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom }]}>
        <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
          <TextInput
            testID="country-search"
            style={[styles.search, isRTL && { textAlign: 'right' }]}
            value={query}
            onChangeText={setQuery}
            placeholder={language === 'ar' ? 'ابحث عن دولة' : 'Search country'}
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <Pressable onPress={onClose} hitSlop={10} testID="country-picker-close">
            <Text style={styles.close}>{language === 'ar' ? 'إغلاق' : 'Close'}</Text>
          </Pressable>
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.country}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={20}
          renderItem={({ item }) => (
            <Pressable
              testID={`country-${item.country}`}
              style={[styles.row, isRTL && { flexDirection: 'row-reverse' }, item.country === selected && styles.rowActive]}
              onPress={() => {
                onSelect(item.country);
                setQuery('');
                onClose();
              }}
            >
              <Text style={[styles.name, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.code}>{item.callingCode.startsWith('+') ? item.callingCode : `+${item.callingCode}`}</Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1026' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  search: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
  },
  close: { color: 'rgba(255,255,255,0.65)', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, paddingHorizontal: 24 },
  rowActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  name: { flex: 1, color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_500Medium' },
  code: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontFamily: 'Inter_400Regular' },
});
