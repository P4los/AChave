import { storage } from './storage';

const API_BASE = "http://127.0.0.1:8000";

// ─────────────────────────────────────────────
// Tipos de datos que devuelve el backend
// ─────────────────────────────────────────────

export interface UserResponse {
    user_id: string;
    email: string;
    is_verified: boolean;
    timestamp: string;
    token_type?: string;
    access_token?: string;
}

export interface LoginResponse {
    user_id: string;
    email: string;
    is_verified: boolean;
    token_type: string;
    access_token: string;
    validador_cifrado: string | null;
    llave_privada_cifrada: string | null;
}

export interface UserMeResponse {
    user_id: string;
    email: string;
    is_verified: boolean;
    timestamp: string;
    validador_cifrado: string | null;
    llave_publica: string | null;
    llave_privada_cifrada: string | null;
}

// ─────────────────────────────────────────────
// Helper para peticiones autenticadas
// ─────────────────────────────────────────────

export async function getAuthToken(): Promise<string | null> {
    return storage.get("achave_token");
}

export async function setAuthToken(token: string): Promise<void> {
    return storage.set("achave_token", token);
}

export async function clearAuthToken(): Promise<void> {
    return storage.remove("achave_token");
}

async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getAuthToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: "Error de conexión con el servidor." }));
        throw new Error(error.detail || `Error ${res.status}`);
    }

    if (res.status === 204) return {} as T;

    return res.json();
}

// ─────────────────────────────────────────────
// Funciones de autenticación
// ─────────────────────────────────────────────

export async function register(email: string, password: string): Promise<UserResponse> {
    return apiFetch<UserResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
    return apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

export async function getMe(token?: string): Promise<UserMeResponse> {
    const headers: Record<string, string> = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return apiFetch<UserMeResponse>("/auth/me", { headers });
}

export async function verifyEmail(token: string): Promise<{ message: string; is_verified: boolean; user_id: string; access_token?: string }> {
    return apiFetch(`/auth/verify/${token}`);
}

export async function setupCrypto(data: {
    password: string;
    validador_cifrado: string;
    llave_publica: string;
    llave_privada_cifrada: string;
}, authToken: string): Promise<UserMeResponse> {
    return apiFetch<UserMeResponse>("/auth/setup-crypto", {
        method: "POST",
        headers: { "Authorization": `Bearer ${authToken}` },
        body: JSON.stringify(data),
    });
}

// ─────────────────────────────────────────────
// Funciones de cofres
// ─────────────────────────────────────────────

export interface Vault {
    vault_id: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    is_default: boolean;
    user_id?: string;
    timestamp?: string;
}

export async function getVaults(): Promise<Vault[]> {
    return apiFetch<Vault[]>("/vaults/");
}

export async function createVault(data: { name: string; description?: string; icon?: string; color?: string }): Promise<Vault> {
    return apiFetch<Vault>("/vaults/", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function deleteVaultApi(vaultId: string): Promise<void> {
    return apiFetch<void>(`/vaults/${vaultId}`, { method: "DELETE" });
}

// ─────────────────────────────────────────────
// Funciones de contraseñas
// ─────────────────────────────────────────────

export interface Password {
    passwords_id: number;
    web: string;
    user_email: string;
    password: string;
    compromised: boolean;
    vault_id: string;
}

export async function getVaultPasswords(vaultId: string): Promise<Password[]> {
    return apiFetch<Password[]>(`/passwords/vault/${vaultId}`);
}

export async function createPassword(data: {
    web: string;
    user_email: string;
    password: string;
    compromised?: boolean;
    vault_id?: string | null;
}): Promise<Password> {
    return apiFetch<Password>("/passwords/", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function deletePassword(passwordId: number): Promise<void> {
    return apiFetch<void>(`/passwords/${passwordId}`, { method: "DELETE" });
}
