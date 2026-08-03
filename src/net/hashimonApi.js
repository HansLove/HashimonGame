const SESSION_KEY = "hashimon:session";

function apiBaseUrl() {
  return (import.meta.env.VITE_HASHIMON_API || "http://127.0.0.1:4000").replace(/\/$/, "");
}

function getToken() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw).token : null;
  } catch {
    return null;
  }
}

function setSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function headers(extra = {}) {
  const h = { ...extra };
  const token = getToken();
  if (token) { h.Authorization = `Bearer ${token}`; }
  return h;
}

async function parseError(res) {
  const body = await res.json().catch(() => ({}));
  return body.error || body.code || `HTTP ${res.status}`;
}

export function mapServerToLocal(server, localId) {
  const speciesKey = server.speciesKey;
  const species = globalThis.Hashimons?.[speciesKey];
  const hashimon = globalThis.HashimonSystem.createInstance(speciesKey, {
    id: localId || `srv_${server.id.slice(0, 8)}`,
    birthNonce: server.birthNonce,
    templateId: server.templateId,
    name: server.name || undefined,
  });

  hashimon.serverId = server.id;
  hashimon.dna = server.dna;
  hashimon.pow.templateId = server.templateId;
  hashimon.pow.birthNonce = server.birthNonce;
  hashimon.pow.extranonce2 = server.pow?.extranonce2 ?? 0;
  hashimon.pow.bestShareBits = server.pow?.bestShareBits ?? 0;
  hashimon.pow.bestShareHash = server.pow?.bestShareHash ?? null;
  hashimon.pow.bestShareNonce = server.pow?.bestShareNonce ?? null;
  hashimon.pow.bestShareExtranonce2 = server.pow?.bestShareExtranonce2 ?? null;
  hashimon.pow.validShares = server.pow?.validShares ?? 0;
  hashimon.pow.totalHashes = server.pow?.totalHashes ?? 0;
  hashimon.pow.foundBlock = server.pow?.foundBlock ?? false;
  if (species) {
    hashimon.speciesLabel = species.name;
  }
  globalThis.HashimonSystem.refreshEvolution(hashimon);
  return hashimon;
}

export async function ensureSession() {
  if (getToken()) { return getToken(); }
  const res = await fetch(`${apiBaseUrl()}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) { throw new Error(await parseError(res)); }
  const data = await res.json();
  setSession({ token: data.token, expiresAt: data.expiresAt, playerId: data.player?.id });
  return data.token;
}

export async function emitHashimon(speciesKey, provenance = "wild", name) {
  await ensureSession();
  const res = await fetch(`${apiBaseUrl()}/hashimons`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ speciesKey, provenance, name }),
  });
  if (!res.ok) { throw new Error(await parseError(res)); }
  return res.json();
}

export async function fetchJob(serverId) {
  await ensureSession();
  const res = await fetch(`${apiBaseUrl()}/hashimons/${serverId}/job`, {
    headers: headers(),
  });
  if (!res.ok) { throw new Error(await parseError(res)); }
  return res.json();
}

export async function submitShare(serverId, payload) {
  await ensureSession();
  const res = await fetch(`${apiBaseUrl()}/hashimons/${serverId}/shares`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || body.code || `HTTP ${res.status}`);
    err.code = body.error || body.code;
    err.status = res.status;
    throw err;
  }
  return body;
}

window.HashimonApi = {
  apiBaseUrl,
  ensureSession,
  emitHashimon,
  fetchJob,
  submitShare,
  mapServerToLocal,
  getToken,
};

export default window.HashimonApi;
