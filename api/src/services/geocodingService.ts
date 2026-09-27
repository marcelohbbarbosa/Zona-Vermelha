interface ResultadoGeocoding {
  latitude: number;
  longitude: number;
}

export async function buscarCoordenadas(rua: string, bairro: string, cidade?: string): Promise<ResultadoGeocoding | null> {
  const endereco = [rua, bairro, cidade, "Brasil"].filter(Boolean).join(", ");
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`;

  const resposta = await fetch(url, {
    headers: {
      "User-Agent": "ZonaVermelha-TCC/1.0 (zonavermelhabackend@gmail.com)",
    },
  });

  if (!resposta.ok) {
    return null;
  }

  const dados = await resposta.json();

  if (!Array.isArray(dados) || dados.length === 0) {
    return null;
  }

  return {
    latitude: parseFloat(dados[0].lat),
    longitude: parseFloat(dados[0].lon),
  };
}