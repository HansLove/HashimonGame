window.HashimonApi = (function () {
  const SESSION_KEY = "hashimon:session";
  const DEFAULT_BASE = "http://127.0.0.1:4000";

  function apiBaseUrl() {
    return (window.HASHIMON_API_URL || DEFAULT_BASE).replace(/\/$/, "");
  }

  function readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getToken() {
    return readSession()?.token ?? null;
  }

  function saveSession(data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }

  function authHeaders(extra = {}) {
    const headers = { ...extra };
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  async function parseError(res) {
    const body = await res.json().catch(() => ({}));
    return body.error || body.code || `HTTP ${res.status}`;
  }

  async function ensureSession() {
    const existing = getToken();
    if (existing) {
      return existing;
    }
    const res = await fetch(`${apiBaseUrl()}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      throw new Error(await parseError(res));
    }
    const data = await res.json();
    saveSession({
      token: data.token,
      expiresAt: data.expiresAt,
      playerId: data.player?.id,
    });
    return data.token;
  }

  async function listHashimons() {
    await ensureSession();
    const res = await fetch(`${apiBaseUrl()}/hashimons`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      throw new Error(await parseError(res));
    }
    return res.json();
  }

  async function emitHashimon(speciesKey, provenance = "wild", name) {
    await ensureSession();
    const res = await fetch(`${apiBaseUrl()}/hashimons`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ speciesKey, provenance, name }),
    });
    if (!res.ok) {
      throw new Error(await parseError(res));
    }
    return res.json();
  }

  async function fetchJob(serverId) {
    await ensureSession();
    const res = await fetch(`${apiBaseUrl()}/hashimons/${serverId}/job`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      throw new Error(await parseError(res));
    }
    return res.json();
  }

  async function submitShare(serverId, body) {
    await ensureSession();
    const res = await fetch(`${apiBaseUrl()}/hashimons/${serverId}/shares`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || data.code || `HTTP ${res.status}`);
      err.code = data.error || data.code;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function mapServerToLocal(row, localId) {
    const speciesKey = row.speciesKey;
    const catalog = window.Hashimons?.[speciesKey];
    const instance = window.HashimonSystem.createInstance(speciesKey, {
      id: localId || `srv_${row.id.slice(0, 8)}`,
      birthNonce: row.birthNonce,
      templateId: row.templateId,
      name: row.name || undefined,
    });
    instance.serverId = row.id;
    instance.dna = row.dna;
    instance.pow.templateId = row.templateId;
    instance.pow.birthNonce = row.birthNonce;
    instance.pow.extranonce2 = row.pow?.extranonce2 ?? 0;
    instance.pow.bestShareBits = row.pow?.bestShareBits ?? 0;
    instance.pow.bestShareHash = row.pow?.bestShareHash ?? null;
    instance.pow.bestShareNonce = row.pow?.bestShareNonce ?? null;
    instance.pow.bestShareExtranonce2 = row.pow?.bestShareExtranonce2 ?? null;
    instance.pow.validShares = row.pow?.validShares ?? 0;
    instance.pow.totalHashes = row.pow?.totalHashes ?? 0;
    instance.pow.foundBlock = row.pow?.foundBlock ?? false;
    if (instance.pow.bestShareBits != null) {
      instance.pow.bestShareDifficulty = Math.pow(2, instance.pow.bestShareBits);
    }
    instance.verified = row.verified === true;
    window.HashimonSystem.refreshEvolution(instance);
    if (catalog && !instance.speciesLabel) {
      instance.speciesLabel = catalog.name;
    }
    return instance;
  }

  async function downloadTokenFileFor3D() {
    const token = await ensureSession();
    const blob = new Blob([token + "\n"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hashimon_token.txt";
    a.click();
    URL.revokeObjectURL(url);
    return { ok: true, token };
  }

  async function copyTokenFor3D() {
    const token = await ensureSession();
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(token);
      return { ok: true, token, copied: true };
    }
    return { ok: true, token, copied: false };
  }

  return {
    apiBaseUrl,
    ensureSession,
    getToken,
    listHashimons,
    emitHashimon,
    fetchJob,
    submitShare,
    mapServerToLocal,
    copyTokenFor3D,
    downloadTokenFileFor3D,
  };
})();
