import { withTimeout } from '@/lib/async';

type SupabaseLikeResponse<T> = {
  data?: T;
  error?: { message?: string } | null;
  count?: number | null;
};

export async function runSupabaseQuery<T extends SupabaseLikeResponse<any>>(
  promise: Promise<T>,
  label: string,
  timeoutMs = 10000
) {
  const response = await withTimeout(promise, timeoutMs, label);

  if (response.error) {
    throw new Error(response.error.message || `${label} failed`);
  }

  return response;
}
