const SERVER_URL = import.meta.env.VITE_SERVER_URL || undefined;

export async function api(path, opts) {
  const base = SERVER_URL || '';
  const res = await fetch(`${base}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

export { SERVER_URL };
