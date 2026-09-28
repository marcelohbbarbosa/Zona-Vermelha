import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export const API_BASE_URL = "https://zona-vermelha-backend.onrender.com";
const TOKEN_KEY = "token";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function salvarToken(token: string) {
  if (Platform.OS === "web") {
    (globalThis as any).localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function lerToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return (globalThis as any).localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function limparToken() {
  if (Platform.OS === "web") {
    (globalThis as any).localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

type Opcoes = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  autenticado?: boolean;
};

export async function api(caminho: string, opcoes: Opcoes = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (opcoes.autenticado) {
    const token = await lerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
      method: opcoes.method ?? "GET",
      headers,
      body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
      signal: controller.signal,
    });

    const dados = resposta.status === 204 ? null : await resposta.json().catch(() => null);

    if (!resposta.ok) {
      throw new ApiError(resposta.status, dados?.mensagem ?? "Erro inesperado");
    }

    return dados;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(0, "Não foi possível conectar ao servidor. Tente novamente em instantes.");
  } finally {
    clearTimeout(timeout);
  }
}