export type StatusZona = "segura" | "insegura" | "nao_avaliada";

export interface Zona {
  id: number;
  bairro: string;
  rua: string;
  cidade: string | null;
  latitude: number | null;
  longitude: number | null;
  status: StatusZona;
  id_usuario: number;
  criado_em: string;
}