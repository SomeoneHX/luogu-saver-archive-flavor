const API_BASE = import.meta.env.VITE_API_URL || "";

interface ApiEnvelope<T> {
  code: number;
  message?: string;
  data: T;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
    ...options,
  });
  let json: ApiEnvelope<T> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error(`请求失败（${res.status}）`);
  }
  if (json.code !== 200 || !json.data) {
    throw new Error(json.message || `请求失败（${res.status}）`);
  }
  return json.data;
}

export { fetchApi };
