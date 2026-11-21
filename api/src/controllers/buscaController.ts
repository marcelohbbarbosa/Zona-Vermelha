import { Request, Response } from "express";

type PhotonFeature = {
  properties?: {
    osm_type?: string;
    osm_id?: number;
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    locality?: string;
    city?: string;
    state?: string;
    countrycode?: string;
  };
  geometry?: { coordinates?: unknown };
};

function nomeDoLocal(feature: PhotonFeature) {
  const endereco = feature.properties ?? {};
  const nome = endereco.name?.trim();
  const rua = [endereco.street, endereco.housenumber].filter(Boolean).join(", ");
  const bairro = endereco.district || endereco.locality;
  const cidade = endereco.city;
  const detalhes = [rua, bairro, cidade].filter((item, index, todos) =>
    Boolean(item) && todos.indexOf(item) === index && item !== nome,
  );
  return [nome, ...detalhes].filter(Boolean).join(" — ") || "Local sem nome";
}

export async function buscarLocais(req: Request, res: Response) {
  const consulta = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (consulta.length < 3) return res.status(400).json({ mensagem: "Digite pelo menos 3 caracteres." });

  // Photon suporta busca conforme a pessoa digita. Nominatim proíbe autocomplete
  // no serviço público e pode bloquear esse padrão de consultas frequentes.
  const url = new URL("https://photon.komoot.io/api/");
  url.search = new URLSearchParams({
    q: consulta,
    limit: "8",
    lat: "-23.96",
    lon: "-46.33",
    bbox: "-46.8,-24.2,-45.7,-23.7",
  }).toString();

  let resposta: globalThis.Response;
  try {
    resposta = await fetch(url, {
      headers: {
        "User-Agent": "ZonaVermelha/1.0 (zonavermelhabackend@gmail.com)",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    return res.status(502).json({ mensagem: "O serviço de busca está indisponível. Tente novamente." });
  }
  if (!resposta.ok) return res.status(502).json({ mensagem: "O serviço de busca está indisponível. Tente novamente." });

  let dados: { features?: PhotonFeature[] };
  try {
    dados = await resposta.json() as { features?: PhotonFeature[] };
  } catch {
    return res.status(502).json({ mensagem: "O serviço de busca está indisponível. Tente novamente." });
  }

  const locais = (dados.features ?? []).flatMap((feature) => {
    const endereco = feature.properties;
    const coordenadas = feature.geometry?.coordinates;
    if (endereco?.countrycode?.toLowerCase() !== "br" || !Array.isArray(coordenadas)
      || coordenadas.length < 2 || !Number.isFinite(coordenadas[0]) || !Number.isFinite(coordenadas[1])) {
      return [];
    }
    return [{
      id: `${endereco.osm_type ?? "place"}-${endereco.osm_id ?? `${coordenadas[0]}-${coordenadas[1]}`}`,
      nome: nomeDoLocal(feature),
      latitude: Number(coordenadas[1]),
      longitude: Number(coordenadas[0]),
    }];
  });
  return res.json(locais);
}
