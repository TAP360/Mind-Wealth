import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { profile } = useApp();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email ?? '');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Egypt');
  const [currency, setCurrency] = useState('EGP');
  const [changed, setChanged] = useState(false);

  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom;

  const handleChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setChanged(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved', 'Your personal information has been updated.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0B1026', '#1A1040']}
        style={[styles.header, { paddingTop: topPad + 12 }]}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.body, { paddingBottom: botPad + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={['#2E3192', '#92278F']}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarLetter}>
              {(name || '?')[0]?.toUpperCase()}
            </Text>
          </LinearGradient>
          <Pressable
            style={[
              styles.editAvatarBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="camera" size={14} color={colors.foreground} />
            <Text style={[styles.editAvatarText, { color: colors.foreground }]}>
              Change Photo
            </Text>
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text
            style={[styles.sectionLabel, { color: colors.mutedForeground }]}
          >
            FULL NAME
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, borderBottomColor: colors.border },
            ]}
            value={name}
            onChangeText={handleChange(setName)}
            placeholder="Your full name"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="next"
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text
            style={[styles.sectionLabel, { color: colors.mutedForeground }]}
          >
            EMAIL ADDRESS
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, borderBottomColor: colors.border },
            ]}
            value={email}
            onChangeText={handleChange(setEmail)}
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text
            style={[styles.sectionLabel, { color: colors.mutedForeground }]}
          >
            PHONE NUMBER
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, borderBottomColor: colors.border },
            ]}
            value={phone}
            onChangeText={handleChange(setPhone)}
            placeholder="+20 100 000 0000"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            returnKeyType="next"
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text
            style={[styles.sectionLabel, { color: colors.mutedForeground }]}
          >
            COUNTRY
          </Text>
          <Pressable
            style={[
              styles.input,
              styles.picker,
              { borderBottomColor: colors.border },
            ]}
            onPress={() =>
              Alert.alert(
                'Country',
                'Egypt\nSaudi Arabia\nUAE\nKuwait\nQatar\nBahrain',
                [{ text: 'OK' }],
              )
            }
          >
            <Text style={[styles.pickerText, { color: colors.foreground }]}>
              {country}
            </Text>
            <Feather
              name="chevron-down"
              size={16}
              color={colors.mutedForeground}
            />
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text
            style={[styles.sectionLabel, { color: colors.mutedForeground }]}
          >
            DEFAULT CURRENCY
          </Text>
          <Pressable
            style={[
              styles.input,
              styles.picker,
              { borderBottomColor: colors.border },
            ]}
            onPress={() =>
              Alert.alert(
                'Currency',
                'EGP — Egyptian Pound\nSAR — Saudi Riyal\nAED — UAE Dirham\nKWD — Kuwaiti Dinar',
                [{ text: 'OK' }],
              )
            }
          >
            <Text style={[styles.pickerText, { color: colors.foreground }]}>
              {currency}
            </Text>
            <Feather
              name="chevron-down"
              size={16}
              color={colors.mutedForeground}
            />
          </Pressable>
        </View>

        <Pressable
          style={[styles.saveBtn, !changed && { opacity: 0.45 }]}
          onPress={handleSave}
          disabled={!changed}
        >
          <LinearGradient
            colors={['#2E3192', '#92278F', '#F37021']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGrad}
          >
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  body: { padding: 20, gap: 12 },
  avatarSection: { alignItems: 'center', paddingVertical: 16, gap: 12 },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 40, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  editAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  editAvatarText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  section: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  saveBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
});
