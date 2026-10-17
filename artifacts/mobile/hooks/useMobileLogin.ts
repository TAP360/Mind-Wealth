import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import {
  useValidateConsumerPhone, useRequestConsumerOtp, useVerifyConsumerOtp,
  useRequestConsumerEmailOtp,
  useLoginConsumer, useRegisterConsumer, useVerifyConsumerRegistrationOtp,
  useChallengeConsumerMfa, useRecoverConsumerMfa,
  type ConsumerTokens, type OtpRequestResult, type OtpVerificationResult,
} from "@workspace/api-client-react";
import { getCountryCallingCode } from "libphonenumber-js/min";
import { useLocalization } from "@/localization";
import { getRequestLanguage } from "@/localization/preferences";
import { useAuthStore, validateSession } from "@/stores/authStore";
import { consumerQueryOptions, IDENTITY_QUERY_ROOT, logoutSession, useConsumerSession } from "./useConsumerSession";
import { authErrorMessage, getAuthErrorCode } from "@/utils/authErrors";
import { isCallingCode, normalizeDigits, splitInternationalInput, type CountryCode } from "@/utils/countries";

const BUSINESS_CODE = process.env.EXPO_PUBLIC_IDENTITY_BUSINESS_CODE || "neurowealth";

export function useMobileLogin() {
  const { language } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useConsumerSession();
  const validate = useValidateConsumerPhone({ mutation: { retry: false } });
  const request = useRequestConsumerOtp({ mutation: { retry: false } });
  const requestEmail = useRequestConsumerEmailOtp({ mutation: { retry: false } });
  const verifyOtp = useVerifyConsumerOtp({ mutation: { retry: false, gcTime: 0 } });
  const emailLogin = useLoginConsumer({ mutation: { retry: false, gcTime: 0 } });
  const register = useRegisterConsumer({ mutation: { retry: false, gcTime: 0 } });
  const verifyRegistration = useVerifyConsumerRegistrationOtp({ mutation: { retry: false, gcTime: 0 } });
  const mfa = useChallengeConsumerMfa({ mutation: { retry: false, gcTime: 0 } });
  const recovery = useRecoverConsumerMfa({ mutation: { retry: false, gcTime: 0 } });
  const [identifier, setIdentifierState] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("EG");
  const [countryCode, setCountryCodeState] = useState("+20");
  const [phoneMode, setPhoneMode] = useState(false);
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [otp, setOtpState] = useState("");
  const [useRecoveryCode, setUseRecoveryCodeState] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [mfaId, setMfaId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [working, setWorking] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [verifiedPhoneInput, setVerifiedPhoneInput] = useState<{
    businessCode: string;
    phone: string;
    language: "ar" | "en";
  } | null>(null);
  const busy = useRef(false);
  const isEmail = identifier.includes("@");
  const isPhone = !isEmail && (phoneMode || /^[+\d٠-٩۰-۹]/.test(identifier.trim()));
  const localPhone = normalizeDigits(identifier.trim()).replace(/[\s()-]/g, "");
  const phoneReady = isPhone && /^\+[1-9]\d{0,3}$/.test(countryCode) &&
    isCallingCode(countryCode) && /^\d{6,15}$/.test(localPhone);
  const emailReady = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
  const stage = session.tokens ? "profile" : mfaId ? "mfa" : registrationId ? "registrationCode" : verifiedEmail ? "emailCode" : verifiedPhone ? "phoneCode" : "identifier";
  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const expiresIn = Math.max(0, Math.ceil((expiresAt - now) / 1000));

  useEffect(() => {
    if (!expiresAt && !resendAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt, resendAt]);

  const resetSensitiveMutations = () => {
    emailLogin.reset(); register.reset(); verifyOtp.reset(); requestEmail.reset();
    verifyRegistration.reset(); mfa.reset(); recovery.reset();
  };
  const run = async (action: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setWorking(true);
    setLocalError(null);
    try { await action(); }
    catch (error) {
      const code = getAuthErrorCode(error);
      if (["OTP_EXPIRED", "OTP_ATTEMPTS_EXHAUSTED", "NO_PENDING_OTP"].includes(code ?? "")) {
        setExpiresAt(Date.now()); setNow(Date.now());
      }
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const seconds = Number(error.response.headers?.["retry-after"]);
        setResendAt(Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 60) * 1000);
        setNow(Date.now());
      }
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const displayed = status === 401 && stage === "identifier" && isEmail ? new Error("INVALID_CREDENTIALS")
        : status === 401 && stage === "mfa" ? new Error(useRecoveryCode ? "INVALID_RECOVERY_CODE" : "INVALID_MFA")
        : status === 409 && isRegistering ? new Error("EMAIL_ALREADY_EXISTS") : error;
      setLocalError(authErrorMessage(displayed, language));
    } finally {
      resetSensitiveMutations();
      busy.current = false;
      setWorking(false);
    }
  };

  const startCode = (result: OtpRequestResult, phone: string, phoneInput: { businessCode: string; phone: string; language: "ar" | "en" }) => {
    if (!Number.isFinite(result?.expiresIn) || result.expiresIn <= 0 ||
      !Number.isFinite(result?.resendAfter) || result.resendAfter < 0) throw new Error("INVALID_API_RESPONSE");
    const timestamp = Date.now();
    setVerifiedPhone(phone); setVerifiedPhoneInput(phoneInput); setOtpState("");
    setExpiresAt(timestamp + result.expiresIn * 1000);
    setResendAt(timestamp + result.resendAfter * 1000);
    setNow(timestamp);
  };
  const loadProfile = async () => {
    const tokens = useAuthStore.getState().tokens;
    if (!tokens) throw new Error("INVALID_SESSION");
    await queryClient.fetchQuery(consumerQueryOptions(tokens));
    // The auth guard also redirects once the profile loads; Home re-checks surveyPending.
    router.replace(useAuthStore.getState().surveyPending ? "/onboarding" : "/(tabs)");
  };
  const finishSession = async (raw: ConsumerTokens, expectedId?: string, newUser = false) => {
    const tokens = validateSession(raw);
    if (expectedId && tokens.userId !== expectedId) throw new Error("INVALID_SESSION");
    setPassword(""); setOtpState(""); setRecoveryCode("");
    await queryClient.cancelQueries({ queryKey: IDENTITY_QUERY_ROOT });
    queryClient.removeQueries({ queryKey: IDENTITY_QUERY_ROOT });
    await useAuthStore.getState().saveSession(tokens, verifiedPhone ?? undefined, newUser);
    await loadProfile();
  };
  const acceptLogin = async (result: OtpVerificationResult) => {
    if (result?.mfaRequired === true) {
      if (typeof result.userId !== "string" || !result.userId.trim()) throw new Error("INVALID_API_RESPONSE");
      setPassword(""); setOtpState(""); setMfaId(result.userId); setUseRecoveryCodeState(false);
      return;
    }
    if (result?.mfaRequired !== false || !result.tokens) throw new Error("INVALID_SESSION");
    await finishSession(result.tokens, undefined, result.newUser === true);
  };
  const changeIdentifier = () => {
    if (busy.current) return;
    setVerifiedPhone(null); setVerifiedPhoneInput(null); setVerifiedEmail(null); setRegistrationId(null); setMfaId(null);
    setOtpState(""); setPassword(""); setRecoveryCode(""); setLocalError(null);
  };

  return {
    stage, identifier, isEmail, isPhone, countryCode, selectedCountry,
    requiresPassword: false,
    password, setPassword, isRegistering,
    setIsRegistering: (value: boolean) => {
      if (busy.current) return;
      setIsRegistering(value); setPassword(""); setLocalError(null);
    },
    setIdentifier: (value: string) => {
      if (busy.current) return;
      const split = splitInternationalInput(value, selectedCountry);
      setIdentifierState(split.identifier);
      if (split.countryCode && split.country) {
        setCountryCodeState(split.countryCode); setSelectedCountry(split.country); setPhoneMode(true);
      } else setPhoneMode(/^[+\d٠-٩۰-۹]/.test(value.trim()));
      if (value.includes("@") !== isEmail) setPassword("");
      setLocalError(null);
    },
    setCountryCode: (value: string) => {
      const normalized = normalizeDigits(value.trim());
      setCountryCodeState(normalized);
      const split = splitInternationalInput(normalized, selectedCountry);
      if (split.countryCode === normalized && split.country) setSelectedCountry(split.country);
      setLocalError(null);
    },
    setCountry: (country: CountryCode) => {
      setSelectedCountry(country); setCountryCodeState(`+${getCountryCallingCode(country)}`); setPhoneMode(true);
      setLocalError(null);
    },
    otp, setOtp: (value: string) => setOtpState(normalizeDigits(value).replace(/\D/g, "").slice(0, 6)),
    useRecoveryCode,
    setUseRecoveryCode: (value: boolean) => {
      setUseRecoveryCodeState(value); setOtpState(""); setRecoveryCode(""); setLocalError(null);
    },
    recoveryCode, setRecoveryCode,
    normalizedPhone: verifiedPhone ?? (phoneReady ? `${countryCode}${localPhone}` : null),
    canContinue: !working && (isEmail ? emailReady : phoneReady && resendIn === 0),
    isPending: working || (stage === "profile" && session.isFetching),
    error: localError ?? (session.error ? authErrorMessage(session.error, language) : null),
    resendIn, expiresIn,
    continueAuth: () => run(async () => {
      if (isEmail) {
        if (!emailReady) throw new Error("INVALID_EMAIL");
        const email = identifier.trim().toLowerCase();
        const result = await requestEmail.mutateAsync({ data: { businessCode: BUSINESS_CODE, email } });
        if (!Number.isFinite(result?.expiresIn) || result.expiresIn <= 0 ||
          !Number.isFinite(result?.resendAfter) || result.resendAfter < 0) throw new Error("INVALID_API_RESPONSE");
        const timestamp = Date.now();
        setVerifiedPhone(null); setVerifiedPhoneInput(null); setVerifiedEmail(email); setOtpState("");
        setExpiresAt(timestamp + result.expiresIn * 1000);
        setResendAt(timestamp + result.resendAfter * 1000);
        setNow(timestamp);
        return;
      }
      if (!phoneReady) throw new Error("INVALID_PHONE");
      if (Date.now() < resendAt) throw new Error("RATE_LIMITED");
      const validated = await validate.mutateAsync({ data: { countryCode, phone: localPhone } });
      if (!validated.valid) throw new Error("INVALID_PHONE");
      if (typeof validated.e164 !== "string" || !/^\+[1-9]\d{6,14}$/.test(validated.e164)) throw new Error("INVALID_API_RESPONSE");
      const phoneInput = {
        businessCode: BUSINESS_CODE,
        phone: validated.e164,
        language: await getRequestLanguage(),
      };
      const result = await request.mutateAsync({ data: phoneInput });
      startCode(result, validated.e164, phoneInput);
    }),
    resendCode: () => run(async () => {
      if (verifiedEmail && Date.now() >= resendAt) {
        const result = await requestEmail.mutateAsync({ data: { businessCode: BUSINESS_CODE, email: verifiedEmail } });
        if (!Number.isFinite(result?.expiresIn) || result.expiresIn <= 0 ||
          !Number.isFinite(result?.resendAfter) || result.resendAfter < 0) throw new Error("INVALID_API_RESPONSE");
        const timestamp = Date.now();
        setOtpState("");
        setExpiresAt(timestamp + result.expiresIn * 1000);
        setResendAt(timestamp + result.resendAfter * 1000);
        setNow(timestamp);
        return;
      }
      if (!verifiedPhone || !verifiedPhoneInput || Date.now() < resendAt) return;
      const phoneInput = {
        ...verifiedPhoneInput,
        language: await getRequestLanguage(),
      };
      startCode(await request.mutateAsync({ data: phoneInput }), verifiedPhone, phoneInput);
    }),
    verifyCode: () => run(async () => {
      if (mfaId) {
        if (useRecoveryCode) {
          if (!recoveryCode.trim()) throw new Error("INVALID_RECOVERY_CODE");
          await finishSession(await recovery.mutateAsync({ data: { userId: mfaId, recoveryCode: recoveryCode.trim() } }), mfaId);
        } else {
          if (!/^\d{6}$/.test(otp)) throw new Error("INVALID_MFA");
          await finishSession(await mfa.mutateAsync({ data: { userId: mfaId, totpCode: otp } }), mfaId);
        }
      } else if (registrationId) {
        if (!/^\d{6}$/.test(otp)) throw new Error("INVALID_OTP");
        await finishSession(await verifyRegistration.mutateAsync({ data: { userId: registrationId, otp } }), registrationId);
      } else if (verifiedEmail) {
        if (!/^\d{6}$/.test(otp)) throw new Error("INVALID_OTP");
        if (Date.now() >= expiresAt) throw new Error("OTP_EXPIRED");
        await acceptLogin(await verifyOtp.mutateAsync({
          data: { businessCode: BUSINESS_CODE, email: verifiedEmail, otp },
        }));
      } else {
        if (!verifiedPhone || !/^\d{6}$/.test(otp)) throw new Error("INVALID_OTP");
        if (Date.now() >= expiresAt) throw new Error("OTP_EXPIRED");
        await acceptLogin(await verifyOtp.mutateAsync({ data: { businessCode: BUSINESS_CODE, phone: verifiedPhone, otp } }));
      }
    }),
    changeIdentifier,
    retryProfile: () => run(loadProfile),
    cancelSession: () => run(async () => {
      await logoutSession(queryClient);
      setVerifiedPhone(null); setVerifiedPhoneInput(null); setRegistrationId(null); setMfaId(null);
      setIdentifierState(""); setPassword(""); setOtpState(""); setRecoveryCode("");
      router.replace("/login");
    }),
    socialNotAvailable: () => setLocalError(authErrorMessage(new Error("SOCIAL_UNAVAILABLE"), language)),
  };
}
