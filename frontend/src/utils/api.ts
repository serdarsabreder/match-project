/**
 * Small wrapper around fetch for the Match API.
 * Throws an Error with the server-provided message on HTTP errors.
 */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = extraDetail(data);
    throw new Error(message);
  }
  return data as T;
}

function extraDetail(data: unknown): string {
  if (!data) return 'Unexpected server error.';
  const d = data as { detail?: unknown };
  if (typeof d.detail === 'string') return d.detail;
  if (Array.isArray(d.detail)) {
    // Pydantic validation errors: detail is an array of {loc, msg}.
    const first = d.detail[0] as { msg?: string; loc?: unknown[] } | undefined;
    if (first?.msg) {
      const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : '';
      return `${field}: ${first.msg}`;
    }
  }
  return 'Unknown server error.';
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export function postJSON<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

export function getJSON<T>(url: string): Promise<T> {
  return request<T>(url);
}

export function postForm<T>(url: string, formData: FormData): Promise<T> {
  return request<T>(url, { method: 'POST', body: formData });
}