import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CountryCodePicker } from '@/components/CountryCodePicker';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import type { useMobileLogin } from '@/hooks/useMobileLogin';
import { useLocalization } from '@/localization';

type Props = { auth: ReturnType<typeof useMobileLogin> };

export function IdentityAuthForm({ auth }: Props) {
  const { t, language, isRTL } = useLocalization();
  const ar = language === 'ar';
  const tx = (en: string, arText: string) => (ar ? arText : en);
  const [pickerOpen, setPickerOpen] = useState(false);

  const rtlRow = isRTL ? { flexDirection: 'row-reverse' as const } : null;
  const align = isRTL ? { textAlign: 'right' as const } : null;
  const stage = auth.stage;
  const isEmail = auth.isEmail;
  const needsPassword = isEmail;
  const disabled = !auth.canContinue || auth.isPending;

  const GradButton = ({ label, onPress, off, id }: { label: string; onPress: () => void; off?: boolean; id: string }) => (
    <Pressable testID={id} style={[styles.assessBtn, off && styles.assessBtnDisabled]} onPress={onPress} disabled={off}>
      <LinearGradient
        colors={['#2E3192', '#92278F', '#F37021']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.assessBtnGrad}
      >
        <Text style={styles.assessBtnText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );

  const Link = ({ label, onPress, id }: { label: string; onPress: () => void; id: string }) => (
    <Pressable testID={id} onPress={onPress} hitSlop={8} style={styles.link}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );

  const ErrorLine = () =>
    auth.error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, align]}>{auth.error}</Text> : null;

  if (stage === 'phoneCode' || stage === 'registrationCode' || stage === 'mfa') {
    const mfa = stage === 'mfa';
    const recovery = mfa && auth.useRecoveryCode;
    const title = mfa ? tx('Two-step verification', 'التحقق بخطوتين') : tx('Enter your code', 'أدخل الرمز');
    const sub = mfa
      ? recovery
        ? tx('Enter one of your saved recovery codes.', 'أدخل أحد رموز الاسترداد المحفوظة لديك.')
        : tx('Enter the 6-digit code from your authenticator app, or use a recovery code instead.', 'أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة، أو استخدم رمز الاسترداد.')
      : tx(`Verification code requested for ${auth.normalizedPhone ?? auth.identifier}.`, `تم طلب رمز تحقق لـ ${auth.normalizedPhone ?? auth.identifier}.`);
    const value = recovery ? auth.recoveryCode : auth.otp;
    const ready = (recovery ? value.trim().length > 0 : auth.otp.length === 6) &&
      (stage !== 'phoneCode' || auth.expiresIn > 0);
    return (
      <KeyboardAwareScrollViewCompat
        style={styles.fill}
        contentContainerStyle={styles.authContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <Text style={styles.authTitle}>{title}</Text>
        <Text style={styles.authSubtitle}>{sub}</Text>
        <TextInput
          testID={recovery ? 'mfa-recovery-code' : 'auth-code'}
          style={[styles.authInput, !recovery && styles.codeInput]}
          value={value}
          onChangeText={recovery ? auth.setRecoveryCode : auth.setOtp}
          placeholder={recovery ? tx('Recovery code', 'رمز الاسترداد') : '000000'}
          placeholderTextColor="rgba(255,255,255,0.4)"
          keyboardType={recovery ? 'default' : 'number-pad'}
          maxLength={recovery ? undefined : 6}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          textContentType={recovery ? 'none' : 'oneTimeCode'}
          returnKeyType="go"
          onSubmitEditing={() => ready && !auth.isPending && auth.verifyCode()}
        />
        <ErrorLine />
        <GradButton
          id="auth-verify"
          label={auth.isPending ? t('common.loading') : tx('Verify', 'تحقق')}
          off={!ready || auth.isPending}
          onPress={() => auth.verifyCode()}
        />
        {mfa ? (
          <Link
            id="mfa-use-recovery"
            label={recovery ? tx('Use authenticator code', 'استخدم رمز المصادقة') : tx('Use a recovery code', 'استخدم رمز استرداد')}
            onPress={() => auth.setUseRecoveryCode(!recovery)}
          />
        ) : null}
        {stage === 'phoneCode' ? (
          auth.resendIn > 0 ? (
            <Text style={styles.hint}>
              {tx(`Resend available in ${auth.resendIn}s`, `يمكنك إعادة الإرسال بعد ${auth.resendIn} ث`)}
            </Text>
          ) : (
            <Link id="auth-resend" label={tx('Resend code', 'إعادة إرسال الرمز')} onPress={() => auth.resendCode()} />
          )
        ) : null}
        {stage === 'phoneCode' && auth.expiresIn > 0 ? (
          <Text style={styles.hint}>
            {tx(`Code expires in ${Math.floor(auth.expiresIn / 60)}:${String(auth.expiresIn % 60).padStart(2, '0')}`, `ينتهي الرمز خلال ${Math.floor(auth.expiresIn / 60)}:${String(auth.expiresIn % 60).padStart(2, '0')}`)}
          </Text>
        ) : null}
        {stage === 'phoneCode' && auth.expiresIn === 0 ? (
          <Text style={styles.hint}>{tx('Code expired. Request a new code.', 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.')}</Text>
        ) : null}
        <Link
          id="auth-change-identifier"
          label={mfa ? tx('Start over', 'ابدأ من جديد') : tx('Change email or mobile', 'تغيير البريد أو الجوال')}
          onPress={auth.changeIdentifier}
        />
      </KeyboardAwareScrollViewCompat>
    );
  }

  if (stage === 'profile') {
    return (
      <KeyboardAwareScrollViewCompat
        style={styles.fill}
        contentContainerStyle={styles.authContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.authTitle}>{tx('Almost there', 'اقتربنا')}</Text>
        <Text style={styles.authSubtitle}>
          {auth.error ?? tx('Setting up your account.', 'جارٍ إعداد حسابك.')}
        </Text>
        <GradButton
          id="retry-profile"
          label={auth.isPending ? t('common.loading') : tx('Try again', 'حاول مرة أخرى')}
          off={auth.isPending}
          onPress={() => auth.retryProfile()}
        />
        <Link id="cancel-session" label={tx('Cancel and sign out', 'إلغاء وتسجيل الخروج')} onPress={() => auth.cancelSession()} />
      </KeyboardAwareScrollViewCompat>
    );
  }

  const phoneLike = auth.isPhone;
  const callingDisplay = auth.countryCode;

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.fill}
      contentContainerStyle={styles.authContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
    >
      <Text style={styles.authTitle}>{t('onboarding.welcome')}</Text>
      <Text style={styles.authSubtitle}>{t('onboarding.emailSubtitle')}</Text>

      <View style={styles.socialStack}>
        <Pressable style={styles.socialBtn} onPress={auth.socialNotAvailable}>
          <Text style={styles.socialIcon}></Text>
          <Text style={styles.socialBtnText}>{t('Continue with Apple')}</Text>
        </Pressable>
        <Pressable style={styles.socialBtn} onPress={auth.socialNotAvailable}>
          <Text style={[styles.socialIcon, { color: '#EA4335' }]}>G</Text>
          <Text style={styles.socialBtnText}>{t('Continue with Google')}</Text>
        </Pressable>
        <Pressable style={styles.socialBtn} onPress={auth.socialNotAvailable}>
          <Text style={[styles.socialIcon, { color: '#1877F2' }]}>f</Text>
          <Text style={styles.socialBtnText}>{t('Continue with Facebook')}</Text>
        </Pressable>
      </View>

      <View style={styles.authDividerRow}>
        <View style={styles.authDivider} />
        <Text style={styles.authDividerText}>{t('or use email or mobile')}</Text>
        <View style={styles.authDivider} />
      </View>

      {phoneLike ? (
        <View style={[styles.ccRow, rtlRow]}>
          <Pressable
            testID="country-picker-open"
            onPress={() => setPickerOpen(true)}
            style={styles.ccPicker}
          >
            <Text style={styles.ccPickerText}>{auth.selectedCountry}</Text>
          </Pressable>
          <TextInput
            testID="country-code"
            style={[styles.authInput, styles.ccInput]}
            value={callingDisplay}
            onChangeText={auth.setCountryCode}
            keyboardType="phone-pad"
            placeholder="+"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>
      ) : null}

      <TextInput
        key="identifier"
        testID="auth-identifier"
        style={[styles.authInput, align]}
        value={auth.identifier}
        editable={!auth.isPending}
        onChangeText={auth.setIdentifier}
        placeholder={t('Email or Mobile')}
        placeholderTextColor="rgba(255,255,255,0.4)"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={() => !disabled && !needsPassword && auth.continueAuth()}
      />

      {needsPassword ? (
        <TextInput
          testID="auth-password"
          style={[styles.authInput, align]}
          value={auth.password}
          editable={!auth.isPending}
          onChangeText={auth.setPassword}
          placeholder={
            auth.isRegistering
              ? tx('Password (min 8 characters)', 'كلمة المرور (8 أحرف على الأقل)')
              : tx('Password', 'كلمة المرور')
          }
          placeholderTextColor="rgba(255,255,255,0.4)"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={() => !disabled && auth.continueAuth()}
        />
      ) : null}

      <ErrorLine />

      <GradButton
        id="auth-continue"
        label={auth.isPending ? t('common.loading') : t('onboarding.continue')}
        off={disabled}
        onPress={() => auth.continueAuth()}
      />

      {isEmail ? (
        <Link
          id="auth-toggle-register"
          label={auth.isRegistering ? tx('Have an account? Sign in', 'لديك حساب؟ تسجيل الدخول') : tx('New here? Create account', 'جديد هنا؟ إنشاء حساب')}
          onPress={() => auth.setIsRegistering(!auth.isRegistering)}
        />
      ) : null}

      <CountryCodePicker
        visible={pickerOpen}
        language={language}
        isRTL={isRTL}
        selected={auth.selectedCountry}
        onSelect={auth.setCountry}
        onClose={() => setPickerOpen(false)}
      />
    </KeyboardAwareScrollViewCompat>
  );
}

export default IdentityAuthForm;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  authContainer: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, justifyContent: 'center' },
  authTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  authSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: 24 },
  socialStack: { gap: 10, marginBottom: 20 },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, paddingVertical: 15, paddingHorizontal: 18,
  },
  socialIcon: {
    width: 26, height: 26, textAlign: 'center', lineHeight: 26, fontSize: 18, fontWeight: '700',
    color: '#111827', backgroundColor: '#FFFFFF', borderRadius: 13, overflow: 'hidden',
  },
  socialBtnText: { flex: 1, color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  authDividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  authDivider: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  authDividerText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.8 },
  authInput: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18, fontSize: 16, fontFamily: 'Inter_400Regular',
    color: '#FFFFFF', marginBottom: 12,
  },
  codeInput: { textAlign: 'center', letterSpacing: 8, fontSize: 22 },
  ccRow: { flexDirection: 'row', gap: 10, marginBottom: 0 },
  ccPicker: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, paddingHorizontal: 18, justifyContent: 'center', marginBottom: 12,
  },
  ccPickerText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  ccInput: { flex: 1, width: undefined },
  assessBtn: { borderRadius: 16, overflow: 'hidden', width: '100%' },
  assessBtnDisabled: { opacity: 0.45 },
  assessBtnGrad: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  assessBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  link: { alignItems: 'center', paddingVertical: 14 },
  linkText: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: 'Inter_500Medium' },
  hint: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 6 },
  error: { color: '#F87171', fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 12 },
});
