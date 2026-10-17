import type { AxiosError, AxiosRequestConfig } from 'axios';

// External identity endpoints use an injected transport, independently of the
// existing /api AI service. The mobile app injects its configured Axios client.
export type IdentityTransport = <T>(config: AxiosRequestConfig) => Promise<T>;
let transport: IdentityTransport | undefined;

export function setIdentityTransport(next: IdentityTransport): void {
  transport = next;
}

export function identityRequest<T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> {
  if (!transport) {
    return Promise.reject(
      new Error('The identity API transport is not configured.'),
    );
  }
  return transport<T>({ ...config, ...options });
}

export type ErrorType<T> = AxiosError<T>;
export type BodyType<T> = T;
