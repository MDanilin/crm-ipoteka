const BASE = '/api';

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('crm_token') ?? '';
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const hasBody = body != null;
  const res = await fetch(BASE + path, {
    method,
    headers: {
      // Content-Type only when there's an actual body — Fastify's JSON
      // body parser rejects requests that declare 'application/json' but
      // send no body (e.g. api.delete()) with FST_ERR_CTP_EMPTY_JSON_BODY.
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      Authorization: 'Bearer ' + getToken(),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw data as { error: string };
  return data as T;
}

export const api = {
  get:    <T>(path: string)              => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown) => request<T>('POST',   path, body),
  put:    <T>(path: string, body: unknown) => request<T>('PUT',    path, body),
  patch:  <T>(path: string, body: unknown) => request<T>('PATCH',  path, body),
  delete: <T>(path: string)              => request<T>('DELETE', path),
};
