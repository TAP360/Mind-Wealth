import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useMobileLogin } from '@/hooks/useMobileLogin';
import { useLocalization } from '@/localization';

const COPY = {
  en: {
    brand: 'Bassera',
    phoneTitle: 'Sign in with your mobile',
    phoneSub: 'Request a 6-digit code to verify your mobile number.',
    code: 'Code',
    country: 'Country code',
    phone: 'Mobile number',
    send: 'Send code',
    sending: 'Sending...',
    codeTitle: 'Enter your code',
    codeSub: 'Code requested for',
    otp: '6-digit code',
    verify: 'Verify and continue',
    verifying: 'Verifying...',
    resend: 'Resend code',
    resendIn: 'Resend in {n}s',
    expires: 'Code expires in {n}',
    expired: 'Code expired. Request a new one.',
    change: 'Change number',
    profileTitle: 'Restoring your session',
    profileSub: 'Loading your profile securely.',
    retry: 'Try again',
    signOut: 'Sign out',
    lang: 'العربية',
  },
  ar: {
    brand: 'بصيرة',
    phoneTitle: 'سجّل الدخول برقم هاتفك',
    phoneSub: 'اطلب رمزاً من 6 أرقام للتحقق من رقم هاتفك المحمول.',
    code: 'الرمز',
    country: 'رمز الدولة',
    phone: 'رقم الهاتف المحمول',
    send: 'إرسال الرمز',
    sending: 'جارٍ الإرسال...',
    codeTitle: 'أدخل الرمز',
    codeSub: 'تم طلب رمز للرقم',
    otp: 'رمز من 6 أرقام',
    verify: 'تحقق وتابع',
    verifying: 'جارٍ التحقق...',
    resend: 'إعادة إرسال الرمز',
    resendIn: 'إعادة الإرسال خلال {n} ث',
    expires: 'ينتهي الرمز خلال {n}',
    expired: 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.',
    change: 'تغيير الرقم',
    profileTitle: 'جارٍ استعادة جلستك',
    profileSub: 'نقوم بتحميل ملفك الشخصي بأمان.',
    retry: 'حاول مرة أخرى',
    signOut: 'تسجيل الخروج',
    lang: 'English',
  },
};

const GRAD = ['#2E3192', '#92278F', '#F37021'] as const;

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={[styles.btn, disabled && { opacity: 0.45 }]}
    >
      <LinearGradient
        colors={GRAD}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.btnGrad}
      >
        {loading ? <ActivityIndicator color="#fff" style={{ marginEnd: 8 }} /> : null}
        <Text style={styles.btnText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function LinkButton({
  label,
  onPress,
  disabled,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={[styles.link, disabled && { opacity: 0.5 }]}
    >
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { language, isRTL, setLanguage } = useLocalization();
  const c = COPY[language === 'ar' ? 'ar' : 'en'];
  const login = useMobileLogin();
  const {
    stage, countryCode, phone, otp, normalizedPhone, isPending, error,
    resendIn, expiresIn,
  } = login;

  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const align = { textAlign: isRTL ? ('right' as const) : ('left' as const) };
  const row = { flexDirection: isRTL ? ('row-reverse' as const) : ('row' as const) };

  const canSend = !!normalizedPhone && !isPending && resendIn === 0;
  const canVerify = otp.length === 6 && !isPending && expiresIn > 0;

  return (
    <LinearGradient
      colors={['#0B1026', '#1A1040', '#2E1855']}
      style={[styles.fill, { paddingTop: topPad, paddingBottom: botPad }]}
    >
      <KeyboardAwareScrollViewCompat
        style={styles.fill}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
      >
        <View style={[styles.topRow, row]}>
          <Text style={styles.brand}>{c.brand}</Text>
          <Pressable
            testID="switch-language"
            accessibilityRole="button"
            disabled={isPending || stage !== 'phone'}
            onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            style={styles.langBtn}
          >
            <Text style={styles.langText}>{c.lang}</Text>
          </Pressable>
        </View>

        {stage === 'phone' && (
          <View>
            <Text style={[styles.title, align]} accessibilityRole="header">{c.phoneTitle}</Text>
            <Text style={[styles.sub, align]}>{c.phoneSub}</Text>
            <View style={[styles.phoneRow, row]}>
              <View style={styles.ccWrap}>
                <Text style={[styles.label, align]}>{c.code}</Text>
                <TextInput
                  testID="phone-country-code"
                  style={[styles.input, { textAlign: 'center' }]}
                  value={countryCode}
                  onChangeText={(v) => login.setCountryCode(v.slice(0, 5))}
                  keyboardType="phone-pad"
                  accessibilityLabel={c.country}
                  editable={!isPending}
                  placeholder="+20"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                />
              </View>
              <View style={styles.fill}>
                <Text style={[styles.label, align]}>{c.phone}</Text>
                <TextInput
                  testID="phone-number"
                  style={[styles.input, align]}
                  value={phone}
                  onChangeText={login.setPhone}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  accessibilityLabel={c.phone}
                  editable={!isPending}
                  returnKeyType="go"
                  onSubmitEditing={() => canSend && login.requestCode()}
                  placeholder="100 123 4567"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                />
              </View>
            </View>
            <PrimaryButton
              testID="request-code"
              label={isPending ? c.sending : resendIn > 0 ? c.resendIn.replace('{n}', String(resendIn)) : c.send}
              loading={isPending}
              disabled={!canSend}
              onPress={() => login.requestCode()}
            />
          </View>
        )}

        {stage === 'code' && (
          <View>
            <Text style={[styles.title, align]} accessibilityRole="header">{c.codeTitle}</Text>
            <Text style={[styles.sub, align]}>
              {c.codeSub} <Text style={styles.num}>{`\u2066${normalizedPhone ?? `${countryCode}${phone}`}\u2069`}</Text>
            </Text>
            <Text style={[styles.label, align]}>{c.otp}</Text>
            <TextInput
              testID="otp-code"
              style={[styles.input, styles.otp]}
              value={otp}
              onChangeText={login.setOtp}
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              accessibilityLabel={c.otp}
              editable={!isPending}
              returnKeyType="go"
              onSubmitEditing={() => canVerify && login.verifyCode()}
              placeholder="······"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
            <Text style={[styles.meta, align]}>
              {expiresIn > 0 ? c.expires.replace('{n}', fmt(expiresIn)) : c.expired}
            </Text>
            <PrimaryButton
              testID="verify-code"
              label={isPending ? c.verifying : c.verify}
              loading={isPending}
              disabled={!canVerify}
              onPress={() => login.verifyCode()}
            />
            <LinkButton
              testID="resend-code"
              label={resendIn > 0 ? c.resendIn.replace('{n}', String(resendIn)) : c.resend}
              disabled={resendIn > 0 || isPending}
              onPress={() => login.resendCode()}
            />
            <LinkButton
              testID="change-phone"
              label={c.change}
              disabled={isPending}
              onPress={() => login.changePhone()}
            />
          </View>
        )}

        {stage === 'profile' && (
          <View>
            <Text style={[styles.title, align]} accessibilityRole="header">{c.profileTitle}</Text>
            <Text style={[styles.sub, align]}>{c.profileSub}</Text>
            {isPending && (
              <View style={styles.loading} accessibilityLiveRegion="polite" accessibilityLabel={c.profileSub}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            {!isPending && (
              <PrimaryButton testID="retry-profile" label={c.retry} onPress={() => login.retryProfile()} />
            )}
            <LinkButton
              testID="cancel-session"
              label={c.signOut}
              disabled={isPending}
              onPress={() => login.cancelSession()}
            />
          </View>
        )}

        {error ? (
          <View
            style={styles.error}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <Text style={[styles.errorText, align]}>{error}</Text>
          </View>
        ) : null}
      </KeyboardAwareScrollViewCompat>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  topRow: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 },
  brand: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#fff' },
  langBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  langText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, color: '#fff', marginBottom: 8 },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 28,
  },
  num: { fontFamily: 'Inter_600SemiBold', color: '#fff' },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  phoneRow: { gap: 12, marginBottom: 20 },
  ccWrap: { width: 84 },
  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    color: '#fff',
    fontFamily: 'Inter_500Medium',
    fontSize: 17,
  },
  otp: { textAlign: 'center', fontSize: 28, letterSpacing: 10, height: 64 },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 10,
    marginBottom: 20,
  },
  btn: { borderRadius: 16, overflow: 'hidden' },
  btnGrad: {
    minHeight: 54,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
  link: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  linkText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#C9A6FF' },
  loading: { alignItems: 'center', paddingVertical: 24 },
  error: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.45)',
  },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#FCA5A5' },
});
