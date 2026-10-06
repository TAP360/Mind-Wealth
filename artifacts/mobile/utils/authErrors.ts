import axios from "axios";
import type { Language } from "@/localization/preferences";

const errors = {
  en: {
    INVALID_PHONE: "Enter a valid mobile number and country calling code.",
    UNSUPPORTED_COUNTRY_CODE: "This country calling code is not supported.",
    INVALID_OTP: "That code is incorrect. Please try again.",
    OTP_EXPIRED: "This code has expired. Request a new code.",
    OTP_ATTEMPTS_EXHAUSTED: "No attempts remain. Request a new code.",
    NO_PENDING_OTP: "There is no active code for this number. Request a new code.",
    MFA_REQUIRED: "This account requires additional verification. MFA is not supported by this login flow yet.",
    INVALID_SESSION: "The server did not return a valid login session.",
    INVALID_PROFILE: "The server did not return your user profile.",
    INVALID_API_RESPONSE: "The server returned an unexpected response. Please try again.",
    SESSION_STORAGE_FAILED: "Unable to save or restore your session on this device. Please try again.",
    RATE_LIMITED: "Too many requests. Please wait before requesting another code.",
    UNAUTHORIZED: "Your session has expired. Sign out and sign in again.",
    NETWORK: "Could not reach the login service. Check your connection and the configured API URL.",
    UNKNOWN: "Unable to complete this request. Please try again.",
  },
  ar: {
    INVALID_PHONE: "أدخل رقم هاتف محمول ورمز دولة صالحين.",
    UNSUPPORTED_COUNTRY_CODE: "رمز الدولة هذا غير مدعوم.",
    INVALID_OTP: "الرمز غير صحيح. حاول مرة أخرى.",
    OTP_EXPIRED: "انتهت صلاحية الرمز. اطلب رمزاً جديداً.",
    OTP_ATTEMPTS_EXHAUSTED: "نفدت محاولات التحقق. اطلب رمزاً جديداً.",
    NO_PENDING_OTP: "لا يوجد رمز نشط لهذا الرقم. اطلب رمزاً جديداً.",
    MFA_REQUIRED: "يتطلب هذا الحساب تحققاً إضافياً. هذا التدفق لا يدعم المصادقة متعددة العوامل بعد.",
    INVALID_SESSION: "لم يُرجع الخادم جلسة تسجيل دخول صالحة.",
    INVALID_PROFILE: "لم يُرجع الخادم ملفك الشخصي.",
    INVALID_API_RESPONSE: "أرجع الخادم استجابة غير متوقعة. حاول مرة أخرى.",
    SESSION_STORAGE_FAILED: "تعذر حفظ أو استعادة جلستك على هذا الجهاز. حاول مرة أخرى.",
    RATE_LIMITED: "طلبات كثيرة جداً. انتظر قبل طلب رمز آخر.",
    UNAUTHORIZED: "انتهت جلستك. سجّل الخروج ثم سجّل الدخول مرة أخرى.",
    NETWORK: "تعذر الاتصال بخدمة تسجيل الدخول. تحقق من اتصالك ورابط الخدمة.",
    UNKNOWN: "تعذر إكمال هذا الطلب. حاول مرة أخرى.",
  },
};

export function getAuthErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data;
    return body && typeof body === "object" && typeof body.code === "string" ? body.code : undefined;
  }
  return error instanceof Error ? error.message : undefined;
}

export function authErrorMessage(error: unknown, language: Language): string {
  const copy = errors[language];
  const code = getAuthErrorCode(error);
  let message = code && code in copy ? copy[code as keyof typeof copy] : copy.UNKNOWN;
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) message = copy.RATE_LIMITED;
    else if (error.response?.status === 401) message = copy.UNAUTHORIZED;
    else if (!error.response) message = copy.NETWORK;
    const remaining = error.response?.data?.remainingAttempts;
    if (code === "INVALID_OTP" && Number.isInteger(remaining) && remaining >= 0) {
      message += language === "ar" ? ` المحاولات المتبقية: ${remaining}.` : ` Attempts remaining: ${remaining}.`;
    }
  }
  return message;
}
