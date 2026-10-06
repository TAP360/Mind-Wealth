import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import {
  useValidateConsumerPhone,
  useRequestConsumerOtp,
  useVerifyConsumerOtp,
  type OtpRequestResult,
} from "@workspace/api-client-react";
import { useLocalization } from "@/localization";
import { getRequestLanguage } from "@/localization/preferences";
import { sessionFromVerification, useAuthStore } from "@/stores/authStore";
import { consumerQueryOptions, IDENTITY_QUERY_ROOT, logoutSession, useConsumerSession } from "./useConsumerSession";
import { authErrorMessage, getAuthErrorCode } from "@/utils/authErrors";

const BUSINESS_CODE = process.env.EXPO_PUBLIC_IDENTITY_BUSINESS_CODE || "NW-EG";

function digits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) =>
    String(digit.charCodeAt(0) - (digit.charCodeAt(0) >= 0x06f0 ? 0x06f0 : 0x0660)));
}

export function useMobileLogin() {
  const { language } = useLocalization();
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useConsumerSession();
  const validate = useValidateConsumerPhone({ mutation: { retry: false } });
  const request = useRequestConsumerOtp({ mutation: { retry: false } });
  const verify = useVerifyConsumerOtp({ mutation: { retry: false } });
  const [countryCode, setCountryCode] = useState("+20");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [working, setWorking] = useState(false);
  const [localError, setLocalError] = useState<unknown>(null);
  const busy = useRef(false);
  const callingCode = digits(countryCode.trim());
  const localPhone = digits(phone.trim()).replace(/[\s()-]/g, "");
  const phoneReady = /^\+[1-9]\d{0,3}$/.test(callingCode) && /^\d{6,15}$/.test(localPhone);
  const normalizedPhone = verifiedPhone ?? (phoneReady ? `${callingCode}${localPhone}` : null);
  const stage = session.tokens ? "profile" : verifiedPhone ? "code" : "phone";
  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const expiresIn = Math.max(0, Math.ceil((expiresAt - now) / 1000));

  useEffect(() => {
    if (!expiresAt && !resendAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt, resendAt]);

  const run = async (action: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setWorking(true);
    setLocalError(null);
    try {
      await action();
    } catch (error) {
      const code = getAuthErrorCode(error);
      if (["OTP_EXPIRED", "OTP_ATTEMPTS_EXHAUSTED", "NO_PENDING_OTP"].includes(code ?? "")) {
        setExpiresAt(Date.now());
        setNow(Date.now());
      }
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const seconds = Number(error.response.headers?.["retry-after"]);
        setResendAt(Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 60) * 1000);
        setNow(Date.now());
      }
      setLocalError(error);
    } finally {
      busy.current = false;
      setWorking(false);
    }
  };

  const startCode = (result: OtpRequestResult, canonicalPhone: string) => {
    if (!Number.isFinite(result?.expiresIn) || result.expiresIn <= 0 ||
      !Number.isFinite(result?.resendAfter) || result.resendAfter < 0) {
      throw new Error("INVALID_API_RESPONSE");
    }
    const timestamp = Date.now();
    setVerifiedPhone(canonicalPhone);
    setOtp("");
    setExpiresAt(timestamp + result.expiresIn * 1000);
    setResendAt(timestamp + result.resendAfter * 1000);
    setNow(timestamp);
  };

  const loadProfile = async () => {
    const tokens = useAuthStore.getState().tokens;
    if (!tokens) throw new Error("INVALID_SESSION");
    await queryClient.fetchQuery(consumerQueryOptions(tokens));
    router.replace("/(tabs)");
  };

  return {
    stage,
    countryCode,
    phone,
    otp,
    setCountryCode,
    setPhone,
    setOtp: (value: string) => setOtp(digits(value).replace(/\D/g, "").slice(0, 6)),
    normalizedPhone,
    isPending: working || (stage === "profile" && session.isFetching),
    error: localError || session.error ? authErrorMessage(localError ?? session.error, language) : null,
    resendIn,
    expiresIn,
    requestCode: () => run(async () => {
      if (!phoneReady) throw new Error("INVALID_PHONE");
      if (Date.now() < resendAt) throw new Error("RATE_LIMITED");
      const validated = await validate.mutateAsync({ data: { countryCode: callingCode, phone: localPhone } });
      if (!validated.valid) throw new Error("INVALID_PHONE");
      if (typeof validated.e164 !== "string" || !/^\+[1-9]\d{6,14}$/.test(validated.e164)) {
        throw new Error("INVALID_API_RESPONSE");
      }
      const result = await request.mutateAsync({ data: {
        businessCode: BUSINESS_CODE, phone: validated.e164, language: await getRequestLanguage(),
      } });
      startCode(result, validated.e164);
    }),
    resendCode: () => run(async () => {
      if (!verifiedPhone || Date.now() < resendAt) return;
      const result = await request.mutateAsync({ data: {
        businessCode: BUSINESS_CODE, phone: verifiedPhone, language: await getRequestLanguage(),
      } });
      startCode(result, verifiedPhone);
    }),
    verifyCode: () => run(async () => {
      if (!verifiedPhone || !/^\d{6}$/.test(otp)) throw new Error("INVALID_OTP");
      if (Date.now() >= expiresAt) throw new Error("OTP_EXPIRED");
      const result = await verify.mutateAsync({ data: {
        businessCode: BUSINESS_CODE, phone: verifiedPhone, otp,
      } });
      const tokens = sessionFromVerification(result);
      await queryClient.cancelQueries({ queryKey: IDENTITY_QUERY_ROOT });
      queryClient.removeQueries({ queryKey: IDENTITY_QUERY_ROOT });
      await useAuthStore.getState().saveSession(tokens);
      await loadProfile();
    }),
    changePhone: () => {
      if (busy.current) return;
      setVerifiedPhone(null);
      setOtp("");
      setLocalError(null);
      // Keep the cooldown when changing numbers, rather than bypassing it.
    },
    retryProfile: () => run(loadProfile),
    cancelSession: () => run(async () => {
      await logoutSession(queryClient);
      setVerifiedPhone(null);
      setOtp("");
      router.replace("/login");
    }),
  };
}
