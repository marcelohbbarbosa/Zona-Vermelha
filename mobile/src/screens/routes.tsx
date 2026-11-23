
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import * as Location from "expo-location";
import { File, Paths } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import MapView, {
  Marker,
  Polyline,
  Polygon,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";

import { api } from "../services/api";

type Coordenadas = {
  latitude: number;
  longitude: number;
};

type Local = Coordenadas & {
  id: number | string;
  nome: string;
};

type DestinoRecente = Coordenadas & { nome: string };
type RotaSalva = { id: number; nome: string; origem: string; destino: string; disponivelOffline: boolean };

type RiscoRota = { riskScore?: number; blocked?: boolean; penalty?: number; yellowCount?: number; redCount?: number; risks?: Array<{ commentId?: number; category: string; level: number; zona: string; latitude?: number; longitude?: number }> };

type AlternativaRota = {
  id: string;
  distanceMeters: number;
  durationSeconds: number;
  geometry: { coordinates: [number, number][] };
  recommended: boolean;
  risk: RiscoRota;
};

type ResultadoRota = {
  id?: string;
  coordenadas: Coordenadas[];
  distancia: number;
  duracao: number;
  aviso?: string;
  limiteDesvio?: boolean;
  risco?: AlternativaRota["risk"];
  calculadaEm?: string;
};

const imagens = {
  busca: require("../../assets/images/Search.png"),
  microfone: require("../../assets/images/Mic.png"),
  voltar: require("../../assets/images/Return.png"),
  recente: require("../../assets/images/Recent.png"),
};

const regiaoInicial: Region = {
  latitude: -23.96,
  longitude: -46.33,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const formatarData = (valor?: string | null) => {
  if (!valor) return "—";
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "—" : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

const escaparHtml = (valor: string) => valor.replace(/[&<>"']/g, (caractere) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[caractere] ?? caractere);

const nomeArquivoSeguro = (valor: string) => valor
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9-]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 48) || "rota";

function celulasDeRisco(riscos: RiscoRota["risks"] = []) {
  const celulas = new Map<string, { latitude: number; longitude: number; level: number; count: number; label: string }>();
  for (const risco of riscos ?? []) {
    if (!Number.isFinite(risco.latitude) || !Number.isFinite(risco.longitude)) continue;
    const latitude = Math.floor(Number(risco.latitude) / 0.004) * 0.004;
    const longitude = Math.floor(Number(risco.longitude) / 0.004) * 0.004;
    const key = `${latitude}:${longitude}`;
    const atual = celulas.get(key);
    const level = Number(risco.level) === 3 ? 3 : 2;
    if (atual) {
      atual.count++;
      atual.level = Math.max(atual.level, level);
      atual.label = `${atual.count} ocorrência(s) · ${atual.level === 3 ? "vermelho" : "amarelo"}`;
    } else celulas.set(key, { latitude, longitude, level, count: 1, label: `${level === 3 ? "Vermelho" : "Amarelo"} · ${risco.zona || risco.category}` });
  }
  return [...celulas.values()];
}

export default function Rotas({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const mapaRef = useRef<MapView>(null);
  const mapaExpandidoRef = useRef<MapView>(null);

  const destinoInicial = route?.params?.destino ?? "";
  const latitudeInicial = route?.params?.latitude;
  const longitudeInicial = route?.params?.longitude;

  const [origem, setOrigem] = useState("Localização atual");
  const [origemCoordenadas, setOrigemCoordenadas] =
    useState<Coordenadas | null>(null);

  const [destino, setDestino] = useState(destinoInicial);
  const [destinoCoordenadas, setDestinoCoordenadas] =
    useState<Coordenadas | null>(
      latitudeInicial != null && longitudeInicial != null
        ? {
            latitude: Number(latitudeInicial),
            longitude: Number(longitudeInicial),
          }
        : null,
    );

  const [resultadosOrigem, setResultadosOrigem] = useState<Local[]>([]);
  const [resultadosDestino, setResultadosDestino] = useState<Local[]>([]);
  const [destinosRecentes, setDestinosRecentes] = useState<DestinoRecente[]>([]);
  const [recentesCarregados, setRecentesCarregados] = useState(false);
  const [rotasSalvas, setRotasSalvas] = useState<RotaSalva[]>([]);
  const [carregandoRotasSalvas, setCarregandoRotasSalvas] = useState(true);
  const [erroRotasSalvas, setErroRotasSalvas] = useState("");
  const [rotasSalvasExpandidas, setRotasSalvasExpandidas] = useState(false);
  const [apagandoRotaId, setApagandoRotaId] = useState<number | null>(null);
  const [recalculandoRotaId, setRecalculandoRotaId] = useState<number | null>(null);
  const [campoAtivo, setCampoAtivo] = useState<"origem" | "destino" | null>(
    null,
  );

  const [resultadoRota, setResultadoRota] =
    useState<ResultadoRota | null>(null);
  const [alternativasRota, setAlternativasRota] = useState<AlternativaRota[]>([]);
  const [carregandoRota, setCarregandoRota] = useState(false);
  const [salvandoRota, setSalvandoRota] = useState(false);
  const [baixandoRota, setBaixandoRota] = useState(false);
  const [rotaSalvaId, setRotaSalvaId] = useState<number | null>(null);
  const [rotaBaixada, setRotaBaixada] = useState(false);
  const [baixadaEm, setBaixadaEm] = useState<string | null>(null);
  const [mapaExpandido, setMapaExpandido] = useState(false);
  const [evitarAmarelas, setEvitarAmarelas] = useState(false);
  const [evitarVermelhas, setEvitarVermelhas] = useState(false);
  const [localizando, setLocalizando] = useState(false);
  const [erroBusca, setErroBusca] = useState("");
  const [avisoRota, setAvisoRota] = useState("");
  const solicitouLocalizacaoInicial = useRef(false);

  const carregarRotasSalvas = async () => {
    setCarregandoRotasSalvas(true);
    try {
      const dados = await api("/rotas/salvas", { autenticado: true }) as RotaSalva[];
      setRotasSalvas(Array.isArray(dados) ? dados : []);
      setErroRotasSalvas("");
    } catch (erro: any) {
      setRotasSalvas([]);
      setErroRotasSalvas(erro.status === 401 ? "Entre na sua conta para ver suas rotas salvas." : "Não foi possível carregar suas rotas salvas.");
    } finally {
      setCarregandoRotasSalvas(false);
    }
  };

  const confirmarExclusaoRotaSalva = (rotaSalva: RotaSalva) => {
    Alert.alert("Apagar rota salva?", `A rota “${rotaSalva.nome}” será removida da sua conta.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: () => void (async () => {
          setApagandoRotaId(rotaSalva.id);
          try {
            await api(`/rotas/salvas/${rotaSalva.id}`, { method: "DELETE", autenticado: true });
            setRotasSalvas((atuais) => atuais.filter((item) => item.id !== rotaSalva.id));
            if (rotaSalvaId === rotaSalva.id) {
              setRotaSalvaId(null);
              setRotaBaixada(false);
              setBaixadaEm(null);
            }
          } catch (erro: any) {
            Alert.alert("Não foi possível apagar", erro.message || "Tente novamente em instantes.");
          } finally {
            setApagandoRotaId(null);
          }
        })(),
      },
    ]);
  };

  useEffect(() => { void carregarRotasSalvas(); }, []);

  useEffect(() => {
    let cancelado = false;
    const arquivo = new File(Paths.document, "destinos-recentes.json");
    void (async () => {
      try {
        if (!arquivo.exists) return;
        const dados = JSON.parse(await arquivo.text());
        if (!cancelado && Array.isArray(dados)) {
          setDestinosRecentes(dados.filter((item: any) =>
            typeof item?.nome === "string" && Number.isFinite(item.latitude) && Number.isFinite(item.longitude),
          ).slice(0, 8));
        }
      } catch {
        // Um arquivo local inválido não deve impedir o planejamento de rotas.
      } finally {
        if (!cancelado) setRecentesCarregados(true);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  useEffect(() => {
    if (!recentesCarregados) return;
    void new File(Paths.document, "destinos-recentes.json")
      .write(JSON.stringify(destinosRecentes))
      .catch(() => {
        // O histórico continua disponível durante esta sessão mesmo se não puder ser gravado.
      });
  }, [destinosRecentes, recentesCarregados]);

  useEffect(() => {
    if (!destinoInicial) return;

    setDestino(destinoInicial);
    setDestinoCoordenadas(
      latitudeInicial != null && longitudeInicial != null
        ? {
            latitude: Number(latitudeInicial),
            longitude: Number(longitudeInicial),
          }
        : null,
    );
    setResultadoRota(null);
  }, [destinoInicial, latitudeInicial, longitudeInicial]);

  // Pesquisa endereços para a origem digitada.
  useEffect(() => {
    if (
      campoAtivo !== "origem" ||
      origem.trim().length < 3 ||
      origemCoordenadas ||
      origem.toLowerCase().includes("localização atual")
    ) {
      setResultadosOrigem([]);
      return;
    }

    let cancelado = false;
    const controller = new AbortController();

    const temporizador = setTimeout(async () => {
      try {
        const locais = (await api(
          `/locais/buscar?q=${encodeURIComponent(origem.trim())}`,
          { signal: controller.signal },
        )) as Local[];

        if (!cancelado) setResultadosOrigem(locais);
      } catch {
        if (!cancelado) setResultadosOrigem([]);
      }
    }, 850);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
      controller.abort();
    };
  }, [origem, origemCoordenadas, campoAtivo]);

  // Pesquisa endereços para o destino digitado.
  useEffect(() => {
    if (
      campoAtivo !== "destino" ||
      destino.trim().length < 3 ||
      destinoCoordenadas
    ) {
      setResultadosDestino([]);
      return;
    }

    let cancelado = false;
    const controller = new AbortController();

    const temporizador = setTimeout(async () => {
      try {
        const locais = (await api(
          `/locais/buscar?q=${encodeURIComponent(destino.trim())}`,
          { signal: controller.signal },
        )) as Local[];

        if (!cancelado) setResultadosDestino(locais);
      } catch {
        if (!cancelado) setResultadosDestino([]);
      }
    }, 850);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
      controller.abort();
    };
  }, [destino, destinoCoordenadas, campoAtivo]);

  const invalidarRota = () => {
    setResultadoRota(null);
    setAlternativasRota([]);
    setRotaSalvaId(null);
    setRotaBaixada(false);
    setErroBusca("");
    setAvisoRota("");
  };

  const exportarRotaPdf = async (rota: ResultadoRota, id: number) => {
    const nomeRota = `${origem} → ${destino}`;
    const nomeBase = `Zona-Vermelha-${nomeArquivoSeguro(origem)}-para-${nomeArquivoSeguro(destino)}-${new Date().toISOString().slice(0, 10)}`;
    const risco = rota.risco;
    const html = `<!doctype html><html><head><meta charset="utf-8"/><style>
      body{font-family:Arial,sans-serif;color:#252932;padding:28px;line-height:1.5}
      h1{color:#920000;font-size:24px;margin-bottom:4px}h2{font-size:16px;margin:24px 0 6px}
      .muted{color:#667085}.card{background:#f3f4f6;padding:14px 16px;border-radius:10px;margin:12px 0}
      .risk{color:#920000;font-weight:bold}.footer{margin-top:32px;font-size:11px;color:#667085}
    </style></head><body>
      <h1>Zona Vermelha · Rota</h1><div class="muted">${escaparHtml(formatarData(rota.calculadaEm))}</div>
      <div class="card"><strong>Origem</strong><br/>${escaparHtml(origem)}<br/><br/><strong>Destino</strong><br/>${escaparHtml(destino)}</div>
      <h2>Resumo do trajeto</h2><div class="card">Distância: ${(rota.distancia / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km<br/>Duração estimada: ${Math.max(1, Math.round(rota.duracao / 60))} min<br/>Pontos do trajeto: ${rota.coordenadas.length}</div>
      ${risco ? `<h2>Avaliação de risco</h2><div class="card">Pontuação: ${Number(risco.riskScore ?? 0)} · ${Number(risco.redCount ?? 0)} área(s) de risco e ${Number(risco.yellowCount ?? 0)} alerta(s)</div>` : ""}
      ${rota.aviso ? `<div class="card risk">${escaparHtml(rota.aviso)}</div>` : ""}
      <div class="footer">Rota para consulta. Condições e estimativas podem mudar durante o deslocamento.</div>
    </body></html>`;
    const pdf = await Print.printToFileAsync({ html });

    if (Platform.OS === "android") {
      const { StorageAccessFramework, EncodingType } = FileSystemLegacy;
      const permissao = await StorageAccessFramework.requestDirectoryPermissionsAsync(
        StorageAccessFramework.getUriForDirectoryInRoot("Download"),
      );
      if (!permissao.granted) return false;
      const destinoPdf = await StorageAccessFramework.createFileAsync(
        permissao.directoryUri,
        `${nomeBase}-rota-${id}`,
        "application/pdf",
      );
      const conteudo = await FileSystemLegacy.readAsStringAsync(pdf.uri, { encoding: EncodingType.Base64 });
      await StorageAccessFramework.writeAsStringAsync(destinoPdf, conteudo, { encoding: EncodingType.Base64 });
    } else {
      await Sharing.shareAsync(pdf.uri, {
        mimeType: "application/pdf",
        dialogTitle: `Salvar ${nomeRota}`,
        UTI: "com.adobe.pdf",
      });
    }
    return true;
  };

  const selecionarAlternativa = (alternativa: AlternativaRota, aviso?: string, limiteDesvio = false, manterRotaSalva = false, calculadaEm = new Date().toISOString()) => {
    const coordenadas = alternativa.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
    setResultadoRota({
      id: alternativa.id,
      coordenadas,
      distancia: alternativa.distanceMeters,
      duracao: alternativa.durationSeconds,
      aviso,
      limiteDesvio,
      risco: alternativa.risk,
      calculadaEm,
    });
    if (!manterRotaSalva) {
      setRotaSalvaId(null);
      setRotaBaixada(false);
      setBaixadaEm(null);
    }
    setTimeout(() => mapaRef.current?.fitToCoordinates(coordenadas, {
      edgePadding: { top: 55, right: 45, bottom: 55, left: 45 },
      animated: true,
    }), 250);
  };

  const usarLocalizacao = async () => {
    setLocalizando(true);
    invalidarRota();

    try {
      const permissao =
        await Location.requestForegroundPermissionsAsync();

      if (permissao.status !== "granted") {
        Alert.alert(
          "Localização necessária",
          "Permita o acesso à localização para usar sua posição como origem.",
        );
        return;
      }

      const posicao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordenadas = {
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude,
      };

      setOrigemCoordenadas(coordenadas);
      setOrigem("Minha localização atual");
      setCampoAtivo(null);
      setResultadosOrigem([]);

      mapaRef.current?.animateToRegion(
        {
          ...coordenadas,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        },
        500,
      );
    } catch {
      Alert.alert(
        "Não foi possível obter a localização",
        "Confira se o GPS está ativo e tente novamente.",
      );
    } finally {
      setLocalizando(false);
    }
  };

  useEffect(() => {
    if (solicitouLocalizacaoInicial.current) return;
    solicitouLocalizacaoInicial.current = true;
    void usarLocalizacao();
  }, []);

  const selecionarOrigem = (local: Local) => {
    setOrigem(local.nome);
    setOrigemCoordenadas({
      latitude: local.latitude,
      longitude: local.longitude,
    });
    setResultadosOrigem([]);
    setCampoAtivo(null);
    invalidarRota();
  };

  const selecionarDestino = (local: Local) => {
    setDestino(local.nome);
    setDestinoCoordenadas({
      latitude: local.latitude,
      longitude: local.longitude,
    });
    setResultadosDestino([]);
    setCampoAtivo(null);
    invalidarRota();
  };

  const resolverOrigemSalva = async (valor: string): Promise<Coordenadas | null> => {
    if (/localiza[cç][aã]o atual/i.test(valor)) {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (permissao.status !== "granted") return null;
      const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude };
    }
    const locais = await api(`/locais/buscar?q=${encodeURIComponent(valor)}`) as Local[];
    return locais[0] ? { latitude: locais[0].latitude, longitude: locais[0].longitude } : null;
  };

  const recalcularRotaSalva = async (rota: RotaSalva) => {
    setRecalculandoRotaId(rota.id);
    invalidarRota();
    setRotaSalvaId(rota.id);
    setRotaBaixada(rota.disponivelOffline);
    if (rota.disponivelOffline) {
      try {
        const arquivo = new File(Paths.document, `rota-${rota.id}.json`);
        if (arquivo.exists) setBaixadaEm(JSON.parse(await arquivo.text()).baixadaEm || null);
        else setBaixadaEm(null);
      } catch { setBaixadaEm(null); }
    }
    try {
      const [novaOrigem, novoDestino] = await Promise.all([
        resolverOrigemSalva(rota.origem),
        resolverOrigemSalva(rota.destino),
      ]);
      setOrigem(rota.origem);
      setDestino(rota.destino);
      setOrigemCoordenadas(novaOrigem);
      setDestinoCoordenadas(novoDestino);
      if (!novaOrigem || !novoDestino) {
        setCampoAtivo(novaOrigem ? "destino" : "origem");
        Alert.alert("Rota carregada", "Não localizamos automaticamente um dos endereços. Toque no campo destacado e escolha uma sugestão da busca.");
      } else {
        setCampoAtivo(null);
        Alert.alert("Rota carregada", "Origem e destino preenchidos. Toque em Calcular rota para atualizar o trajeto.");
      }
    } catch (erro: any) {
      setOrigem(rota.origem);
      setDestino(rota.destino);
      setOrigemCoordenadas(null);
      setDestinoCoordenadas(null);
      setCampoAtivo("origem");
      Alert.alert("Rota carregada", erro.message || "Escolha novamente os endereços nas sugestões de busca.");
    } finally {
      setRecalculandoRotaId(null);
    }
  };

  const atualizarRotaSalva = async () => {
    if (!rotaSalvaId) return;
    setCarregandoRota(true);
    setBaixandoRota(true);
    try {
      let origemAtual = origemCoordenadas;
      let destinoAtual = destinoCoordenadas;
      if (!origemAtual || !destinoAtual) {
        [origemAtual, destinoAtual] = await Promise.all([resolverOrigemSalva(origem), resolverOrigemSalva(destino)]);
      }
      if (!origemAtual || !destinoAtual) throw new Error("Escolha novamente a origem e o destino nas sugestões.");
      const dados = await api("/rotas/calcular", {
        method: "POST",
        body: { origin: origemAtual, destination: destinoAtual, alternatives: 3, avoidYellow: evitarAmarelas, avoidRed: evitarVermelhas },
      }) as any;
      const escolhida = (dados.routes ?? []).find((item: AlternativaRota) => item.id === dados.recommendedRouteId);
      if (!escolhida) throw new Error(dados.warning || "Não foi possível atualizar o trajeto.");
      setOrigemCoordenadas(origemAtual);
      setDestinoCoordenadas(destinoAtual);
      setAlternativasRota(dados.routes ?? []);
      setAvisoRota(dados.warning ?? "");
      const atualizada: ResultadoRota = {
        id: escolhida.id,
        coordenadas: escolhida.geometry.coordinates.map(([longitude, latitude]: [number, number]) => ({ latitude, longitude })),
        distancia: escolhida.distanceMeters,
        duracao: escolhida.durationSeconds,
        aviso: dados.warning,
        limiteDesvio: dados.avoidanceFallback === true,
        risco: escolhida.risk,
        calculadaEm: dados.generatedAt || new Date().toISOString(),
      };
      setResultadoRota(atualizada);
      const pdfSalvo = await exportarRotaPdf(atualizada, rotaSalvaId);
      if (!pdfSalvo) {
        Alert.alert("Download cancelado", "A rota atualizada não foi exportada. A versão offline anterior foi mantida.");
        return;
      }
      const agora = new Date().toISOString();
      const arquivo = new File(Paths.document, `rota-${rotaSalvaId}.json`);
      await arquivo.write(JSON.stringify({ id: rotaSalvaId, nome: `${origem} → ${destino}`, origem, destino, origin: origemAtual, destination: destinoAtual, route: { ...atualizada, baixadaEm: agora }, calculadaEm: atualizada.calculadaEm, baixadaEm: agora, avoidYellow: evitarAmarelas, avoidRed: evitarVermelhas }));
      await api(`/rotas/${rotaSalvaId}/baixar`, { method: "POST", autenticado: true });
      setRotaBaixada(true);
      setBaixadaEm(agora);
      setRotasSalvas((rotas) => rotas.map((rota) => rota.id === rotaSalvaId ? { ...rota, disponivelOffline: true } : rota));
      setTimeout(() => mapaRef.current?.fitToCoordinates(atualizada.coordenadas, { edgePadding: { top: 55, right: 45, bottom: 55, left: 45 }, animated: true }), 250);
      Alert.alert("Rota atualizada", "O PDF atualizado foi exportado e a rota também está disponível offline no app.");
    } catch (erro: any) {
      Alert.alert("Não foi possível atualizar", erro.message || "Confira sua conexão e tente novamente.");
    } finally {
      setCarregandoRota(false);
      setBaixandoRota(false);
    }
  };

  const visualizarRotaBaixada = async (rota: RotaSalva) => {
    try {
      const arquivo = new File(Paths.document, `rota-${rota.id}.json`);
      if (!arquivo.exists) {
        Alert.alert("Arquivo não encontrado", "Esta rota foi marcada como baixada em outro aparelho ou o arquivo foi removido. Recalcule e baixe novamente neste dispositivo.");
        return;
      }
      const dados = JSON.parse(await arquivo.text());
      if (!dados?.route?.coordenadas?.length) throw new Error("O arquivo da rota está incompleto.");
      setOrigem(dados.origem);
      setDestino(dados.destino);
      setOrigemCoordenadas(dados.origin);
      setDestinoCoordenadas(dados.destination);
      setResultadoRota(dados.route);
      setAlternativasRota([]);
      setRotaSalvaId(rota.id);
      setRotaBaixada(true);
      setBaixadaEm(dados.baixadaEm || null);
      setCampoAtivo(null);
      setTimeout(() => mapaRef.current?.fitToCoordinates(dados.route.coordenadas, { edgePadding: { top: 55, right: 45, bottom: 55, left: 45 }, animated: true }), 300);
    } catch (erro: any) {
      Alert.alert("Não foi possível abrir a rota", erro.message || "O arquivo baixado não pôde ser lido.");
    }
  };

  const criarRota = async () => {
    if (!origemCoordenadas || !destinoCoordenadas) {
      Alert.alert(
        "Selecione os endereços",
        "Digite o endereço e escolha uma das sugestões exibidas. Você também pode usar sua localização atual como origem.",
      );
      return;
    }

    setCarregandoRota(true);
    setErroBusca("");
    setResultadoRota(null);
    setRotaBaixada(false);
    setBaixadaEm(null);

    try {
      const dados = await api("/rotas/calcular", {
        method: "POST",
        body: {
          origin: origemCoordenadas,
          destination: destinoCoordenadas,
          alternatives: 3,
          avoidYellow: evitarAmarelas,
          avoidRed: evitarVermelhas,
        },
      }) as any;

      setAlternativasRota(dados.routes ?? []);
      setAvisoRota(dados.warning ?? "");
      const rotaCalculada = (dados.routes ?? []).find((item: AlternativaRota) => item.id === dados.recommendedRouteId);
      if (rotaCalculada?.geometry?.coordinates?.length) {
        const destinoRecente = { nome: destino.trim(), ...destinoCoordenadas };
        setDestinosRecentes((atuais) => [
          destinoRecente,
          ...atuais.filter((item) =>
            item.nome.trim().toLocaleLowerCase() !== destinoRecente.nome.toLocaleLowerCase()
            && (Math.abs(item.latitude - destinoRecente.latitude) > 0.0001
              || Math.abs(item.longitude - destinoRecente.longitude) > 0.0001),
          ),
        ].slice(0, 8));
        selecionarAlternativa(rotaCalculada, dados.warning, dados.avoidanceFallback === true);
      } else {
        setErroBusca(dados.warning || "Não foi possível encontrar uma rota entre esses endereços.");
      }

      setCampoAtivo(null);
      setResultadosOrigem([]);
      setResultadosDestino([]);

    } catch (erro: any) {
      setErroBusca(
        erro.message ||
          "Não foi possível calcular a rota. Tente novamente.",
      );
    } finally {
      setCarregandoRota(false);
    }
  };

  const salvarRota = async () => {
    if (!resultadoRota || !origemCoordenadas || !destinoCoordenadas) return;
    setSalvandoRota(true);
    try {
      const dados = await api("/rotas/salvar", {
        method: "POST",
        autenticado: true,
        body: {
          nome: `${origem} → ${destino}`,
          origem,
          destino,
          origin: origemCoordenadas,
          destination: destinoCoordenadas,
          avoidYellow: evitarAmarelas,
          avoidRed: evitarVermelhas,
          route: {
            geometry: {
              type: "LineString",
              coordinates: resultadoRota.coordenadas.map((ponto) => [ponto.longitude, ponto.latitude]),
            },
            distanceMeters: resultadoRota.distancia,
            durationSeconds: resultadoRota.duracao,
            risk: resultadoRota.risco,
          },
        },
      }) as { rota: { id: number } };
      setRotaSalvaId(dados.rota.id);
      await carregarRotasSalvas();
      setRotaBaixada(false);
      Alert.alert("Rota salva", "Agora você pode baixá-la para usar offline.");
    } catch (erro: any) {
      Alert.alert("Não foi possível salvar", erro.message || "Entre na sua conta e tente novamente.");
    } finally {
      setSalvandoRota(false);
    }
  };

  const baixarRota = async () => {
    if (!rotaSalvaId || !resultadoRota) {
      Alert.alert("Salve a rota primeiro", "O download só fica disponível depois que a rota for salva.");
      return;
    }
    setBaixandoRota(true);
    try {
      const agora = new Date().toISOString();
      const pdfSalvo = await exportarRotaPdf(resultadoRota, rotaSalvaId);
      if (!pdfSalvo) {
        Alert.alert("Download cancelado", "Escolha uma pasta para salvar o PDF da rota.");
        return;
      }
      const arquivo = new File(Paths.document, `rota-${rotaSalvaId}.json`);
      await arquivo.write(JSON.stringify({
        id: rotaSalvaId,
        nome: `${origem} → ${destino}`,
        origem,
        destino,
        origin: origemCoordenadas,
        destination: destinoCoordenadas,
        route: { ...resultadoRota, baixadaEm: agora },
        calculadaEm: resultadoRota.calculadaEm || agora,
        baixadaEm: agora,
        avoidYellow: evitarAmarelas,
        avoidRed: evitarVermelhas,
      }));
      await api(`/rotas/${rotaSalvaId}/baixar`, { method: "POST", autenticado: true });
      setRotaBaixada(true);
      setBaixadaEm(agora);
      setRotasSalvas((rotas) => rotas.map((rota) => rota.id === rotaSalvaId ? { ...rota, disponivelOffline: true } : rota));
      Alert.alert("Rota baixada", "O PDF foi salvo na pasta escolhida e a rota também está disponível offline no app.");
    } catch (erro: any) {
      Alert.alert("Não foi possível baixar", erro.message || "Tente novamente quando estiver conectado.");
    } finally {
      setBaixandoRota(false);
    }
  };

  const mostrarResultados =
    campoAtivo === "origem" ? resultadosOrigem : resultadosDestino;

  const renderMapa = (expandido = false) => (
    <View style={expandido ? styles.mapaTelaCheia : styles.mapaContainer}>
      <MapView
        ref={expandido ? mapaExpandidoRef : mapaRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        style={styles.mapa}
        initialRegion={regiaoInicial}
        onMapReady={() => {
          if (!expandido && resultadoRota?.coordenadas?.length) {
            mapaRef.current?.fitToCoordinates(resultadoRota.coordenadas, { edgePadding: { top: 55, right: 45, bottom: 55, left: 45 }, animated: true });
          }
        }}
        mapType="standard"
      >
        {origemCoordenadas ? <Marker coordinate={origemCoordenadas} title="Origem" pinColor="green" /> : null}
        {destinoCoordenadas ? <Marker coordinate={destinoCoordenadas} title="Destino" pinColor="red" /> : null}
        {resultadoRota?.coordenadas?.length ? <Polyline coordinates={resultadoRota.coordenadas} strokeColor="#8b0000" strokeWidth={5} /> : null}
        {celulasDeRisco(resultadoRota?.risco?.risks).map((celula) => (
          <Polygon
            key={`${celula.latitude}:${celula.longitude}`}
            coordinates={[
              { latitude: celula.latitude, longitude: celula.longitude },
              { latitude: celula.latitude + 0.004, longitude: celula.longitude },
              { latitude: celula.latitude + 0.004, longitude: celula.longitude + 0.004 },
              { latitude: celula.latitude, longitude: celula.longitude + 0.004 },
            ]}
            fillColor={celula.level === 3 ? "rgba(205, 35, 43, 0.28)" : "rgba(230, 170, 20, 0.30)"}
            strokeColor={celula.level === 3 ? "#cd232b" : "#d49a00"}
            strokeWidth={1}
          />
        ))}
      </MapView>
      <View style={[styles.legendaMapa, expandido && styles.legendaMapaExpandida]}>
        <Text style={styles.textoLegendaMapa}>🟥 Zona vermelha</Text>
        <Text style={styles.textoLegendaMapa}>🟨 Zona amarela</Text>
      </View>
      <Pressable style={[styles.botaoExpandirMapa, expandido && { bottom: insets.bottom + 16 }]} onPress={() => setMapaExpandido(!expandido)}>
        <Text style={styles.textoBotaoExpandir}>{expandido ? "Voltar ao tamanho normal" : "Ampliar mapa"}</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cabecalho}>
        <Pressable
          accessibilityLabel="Voltar"
          hitSlop={10}
          onPress={() => navigation.goBack()}
          style={styles.voltar}
        >
          <Image source={imagens.voltar} style={styles.iconeVoltar} />
        </Pressable>

        <View style={styles.busca}>
          <Image source={imagens.busca} style={styles.iconeBusca} />
          <Text style={styles.textoBusca}>Planeje sua rota</Text>
          <Image source={imagens.microfone} style={styles.iconeMicrofone} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.titulo}>Criar rota</Text>
        <Text style={styles.descricao}>
          Escolha a origem e o destino para calcular seu trajeto.
        </Text>

        <View style={styles.rotasSalvasPainel}>
          <View style={styles.rotasSalvasCabecalho}>
            <Text style={styles.tituloResumo}>Rotas salvas</Text>
            <Pressable accessibilityRole="button" onPress={() => void carregarRotasSalvas()}>
              <Text style={styles.atualizarRotas}>Atualizar</Text>
            </Pressable>
          </View>
          {carregandoRotasSalvas ? <ActivityIndicator color="#8b0000" style={styles.carregandoSalvas} /> : null}
          {erroRotasSalvas ? (
            <View>
              <Text style={styles.aviso}>{erroRotasSalvas}</Text>
              {erroRotasSalvas.startsWith("Entre na sua conta") ? (
                <Pressable onPress={() => navigation.navigate("Login")} style={styles.entrarSalvas}>
                  <Text style={styles.textoBotaoRota}>Entrar</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {!carregandoRotasSalvas && !erroRotasSalvas && !rotasSalvas.length ? (
            <Text style={styles.aviso}>As rotas que você salvar aparecerão aqui.</Text>
          ) : null}
          {rotasSalvas.slice(0, rotasSalvasExpandidas ? 50 : 4).map((rotaSalva) => (
            <View key={rotaSalva.id} style={styles.rotaSalvaItem}>
              <View style={styles.rotaSalvaInfo}>
                <Text numberOfLines={1} style={styles.rotaSalvaNome}>{rotaSalva.nome}</Text>
                <Text numberOfLines={2} style={styles.rotaSalvaEndereco}>{rotaSalva.origem} → {rotaSalva.destino}</Text>
                {rotaSalva.disponivelOffline ? <Text style={styles.rotaOffline}>Download registrado na conta</Text> : null}
              </View>
              <View style={styles.acoesRotaSalva}>
                {rotaSalva.disponivelOffline ? <Pressable onPress={() => void visualizarRotaBaixada(rotaSalva)} style={styles.recalcularSalva}><Text style={styles.textoBotaoRota}>Ver baixada</Text></Pressable> : null}
                <Pressable disabled={recalculandoRotaId !== null} onPress={() => void recalcularRotaSalva(rotaSalva)} style={styles.recalcularSalva}>
                  {recalculandoRotaId === rotaSalva.id ? <ActivityIndicator color="#8b0000" size="small" /> : <Text style={styles.textoBotaoRota}>Recalcular</Text>}
                </Pressable>
                <Pressable accessibilityRole="button" disabled={apagandoRotaId !== null} onPress={() => confirmarExclusaoRotaSalva(rotaSalva)} style={[styles.apagarRotaSalva, apagandoRotaId === rotaSalva.id && styles.botaoDesativado]}>
                  {apagandoRotaId === rotaSalva.id ? <ActivityIndicator color="#b42318" size="small" /> : <Text style={styles.textoApagarRota}>Apagar</Text>}
                </Pressable>
              </View>
            </View>
          ))}
          {rotasSalvas.length > 4 ? (
            <Pressable onPress={() => setRotasSalvasExpandidas((aberta) => !aberta)} style={styles.verMaisRotas}>
              <Text style={styles.atualizarRotas}>{rotasSalvasExpandidas ? "Mostrar menos" : `Ver todas (${rotasSalvas.length})`}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.formulario}>
          <TextInput
            value={origem}
            onFocus={() => {
              setCampoAtivo("origem");
              if (origem.toLowerCase().includes("localização atual")) {
                setOrigem("");
                setOrigemCoordenadas(null);
              }
            }}
            onChangeText={(valor) => {
              setOrigem(valor);
              setOrigemCoordenadas(null);
              invalidarRota();
            }}
            placeholder="Endereço de origem"
            placeholderTextColor="#6b7280"
            style={styles.campo}
            autoCorrect={false}
          />

          {campoAtivo === "origem" &&
            resultadosOrigem.map((local) => (
              <Pressable
                key={local.id}
                onPress={() => selecionarOrigem(local)}
                style={styles.itemBusca}
              >
                <Text style={styles.nomeLocal}>{local.nome}</Text>
              </Pressable>
            ))}

          <Pressable
            accessibilityRole="button"
            disabled={localizando}
            onPress={usarLocalizacao}
            style={styles.botaoLocalizacao}
          >
            <Text style={styles.textoLocalizacao}>
              {localizando
                ? "Obtendo localização..."
                : "Usar minha localização atual"}
            </Text>
          </Pressable>

          <TextInput
            value={destino}
            onFocus={() => setCampoAtivo("destino")}
            onChangeText={(valor) => {
              setDestino(valor);
              setDestinoCoordenadas(null);
              invalidarRota();
            }}
            placeholder="Endereço de destino"
            placeholderTextColor="#6b7280"
            style={styles.campo}
            autoCorrect={false}
          />

          {campoAtivo === "destino" &&
            resultadosDestino.map((local) => (
              <Pressable
                key={local.id}
                onPress={() => selecionarDestino(local)}
                style={styles.itemBusca}
              >
                <Text style={styles.nomeLocal}>{local.nome}</Text>
              </Pressable>
            ))}

          <View style={styles.preferenciasSeguranca}>
            <Text style={styles.rotuloPreferencias}>Preferências para o trajeto</Text>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: evitarAmarelas }}
              onPress={() => {
                setEvitarAmarelas((valor) => !valor);
                invalidarRota();
              }}
              style={styles.opcaoPreferencia}
            >
              <View style={[styles.checkbox, evitarAmarelas && styles.checkboxSelecionado]}>
                {evitarAmarelas ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.textoPreferencia}>Evitar zonas amarelas (alerta)</Text>
            </Pressable>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: evitarVermelhas }}
              onPress={() => {
                setEvitarVermelhas((valor) => !valor);
                invalidarRota();
              }}
              style={styles.opcaoPreferencia}
            >
              <View style={[styles.checkbox, evitarVermelhas && styles.checkboxSelecionado]}>
                {evitarVermelhas ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.textoPreferencia}>Evitar zonas vermelhas (risco)</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={carregandoRota}
            onPress={criarRota}
            style={[
              styles.botaoCriar,
              carregandoRota && styles.botaoDesativado,
            ]}
          >
            {carregandoRota ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.textoBotaoCriar}>Calcular rota</Text>
            )}
          </Pressable>
        </View>

        {erroBusca ? (
          <Text style={styles.erro}>{erroBusca}</Text>
        ) : null}

        {alternativasRota.length ? (
          <View style={styles.resumo}>
            <Text style={styles.tituloResumo}>Alternativas de rota</Text>
            {alternativasRota.map((alternativa, index) => (
              <Pressable
                key={alternativa.id}
                onPress={() => selecionarAlternativa(alternativa, avisoRota)}
                style={[
                  styles.alternativa,
                  resultadoRota?.id === alternativa.id && styles.alternativaSelecionada,
                  alternativa.risk?.blocked && styles.alternativaEvitada,
                ]}
              >
                <Text style={styles.dadosRota}>
                  {alternativa.recommended ? "Recomendada" : `Alternativa ${index + 1}`}
                  {alternativa.risk?.blocked ? " · cruza zona que você escolheu evitar" : ""}
                </Text>
                <Text style={styles.aviso}>
                  {(alternativa.distanceMeters / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km · {Math.max(1, Math.round(alternativa.durationSeconds / 60))} min · risco {alternativa.risk?.riskScore ?? 0}/100
                </Text>
                <Text style={styles.aviso}>
                  {alternativa.risk?.yellowCount ?? 0} ocorrência(s) amarela(s) · {alternativa.risk?.redCount ?? 0} vermelha(s)
                </Text>
              </Pressable>
            ))}
            {!resultadoRota ? <Text style={styles.aviso}>{avisoRota}</Text> : null}
          </View>
        ) : null}

        {resultadoRota ? (
          <View style={styles.resumo}>
            <Text style={styles.tituloResumo}>Rota selecionada</Text>
            <Text style={styles.dadosRota}>
              Distância:{" "}
              {(resultadoRota.distancia / 1000).toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
              })}{" "}
              km
            </Text>
            <Text style={styles.dadosRota}>
              Tempo estimado:{" "}
              {Math.max(1, Math.round(resultadoRota.duracao / 60))} min
            </Text>
            {resultadoRota.risco ? (
              <Text style={styles.dadosRota}>
                Risco das avaliações próximas: {resultadoRota.risco.riskScore ?? 0}/100
              </Text>
            ) : null}
            {resultadoRota.risco?.blocked ? (
              <Text style={styles.avisoRisco}>Esta alternativa cruza uma zona marcada para evitar.</Text>
            ) : null}
            <Text style={styles.aviso}>Calculada em: {formatarData(resultadoRota.calculadaEm)}</Text>
            {rotaBaixada ? <Text style={styles.aviso}>Baixada/atualizada em: {formatarData(baixadaEm)}</Text> : null}
            <Text style={resultadoRota.limiteDesvio ? styles.avisoRisco : styles.aviso}>
              {resultadoRota.aviso || "Estimativa para deslocamento de carro. Não é garantia de segurança nem considera necessariamente o trânsito em tempo real."}
            </Text>
            {!rotaSalvaId ? (
              <Pressable disabled={salvandoRota} onPress={() => void salvarRota()} style={[styles.botaoCriar, salvandoRota && styles.botaoDesativado]}>
                {salvandoRota ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotaoCriar}>Salvar rota</Text>}
              </Pressable>
            ) : (
              <View>
                <Text style={styles.salvoInfo}>Rota salva na sua conta.</Text>
                <Pressable disabled={baixandoRota} onPress={() => rotaBaixada ? void atualizarRotaSalva() : void baixarRota()} style={[styles.botaoBaixar, baixandoRota && styles.botaoDesativado]}>
                  {baixandoRota ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotaoCriar}>{rotaBaixada ? "Exportar PDF atualizado" : "Baixar rota em PDF"}</Text>}
                </Pressable>
                {rotaBaixada ? <Pressable onPress={() => setMapaExpandido(true)} style={styles.botaoExpandirInline}><Text style={styles.textoBotaoRota}>Visualizar rota ampliada</Text></Pressable> : null}
              </View>
            )}
          </View>
        ) : null}

        {renderMapa()}


        <Text style={styles.tituloLista}>Destinos recentes</Text>
        <View style={styles.lista}>
          {destinosRecentes.map((local) => (
            <Pressable
              accessibilityRole="button"
              key={`${local.nome}-${local.latitude}-${local.longitude}`}
              onPress={() => {
                setDestino(local.nome);
                setDestinoCoordenadas({ latitude: local.latitude, longitude: local.longitude });
                setResultadosDestino([]);
                setCampoAtivo(null);
                invalidarRota();
              }}
              style={styles.itemLocal}
            >
              <View style={styles.iconeLocal}>
                <Image source={imagens.recente} style={styles.iconeItem} />
              </View>
              <Text numberOfLines={1} style={styles.nomeLocal}>
                {local.nome}
              </Text>
            </Pressable>
          ))}
          {!destinosRecentes.length && recentesCarregados ? (
            <Text style={styles.vazioRecentes}>Os destinos que você usar em uma rota aparecerão aqui.</Text>
          ) : null}
        </View>
      </ScrollView>
      <Modal
        visible={mapaExpandido}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onShow={() => {
          if (resultadoRota?.coordenadas?.length) {
            setTimeout(() => mapaExpandidoRef.current?.fitToCoordinates(resultadoRota.coordenadas, {
              edgePadding: { top: 90, right: 55, bottom: 110, left: 55 },
              animated: true,
            }), 450);
          }
        }}
        onRequestClose={() => setMapaExpandido(false)}
      >
        <View style={styles.modalMapa}>
          {renderMapa(true)}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  
  container: { backgroundColor: "#f8f8ff", flex: 1 },
  cabecalho: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  voltar: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 21,
    elevation: 7,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  iconeVoltar: { height: 22, resizeMode: "contain", width: 22 },
  busca: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 26,
    elevation: 8,
    flex: 1,
    flexDirection: "row",
    minHeight: 54,
    paddingHorizontal: 14,
  },
  iconeBusca: { height: 20, resizeMode: "contain", width: 20 },
  textoBusca: { color: "#6b7280", flex: 1, fontSize: 16, paddingLeft: 8 },
  iconeMicrofone: { height: 22, resizeMode: "contain", width: 17 },
  conteudo: { paddingBottom: 32, paddingTop: 24 },
  titulo: {
    color: "#1f2937",
    fontSize: 24,
    fontWeight: "800",
    paddingHorizontal: 24,
  },
  descricao: {
    color: "#6b7280",
    fontSize: 15,
    lineHeight: 21,
    paddingHorizontal: 24,
    paddingTop: 6,
  },
  rotasSalvasPainel: { backgroundColor: "#fff", borderColor: "#e5e7eb", borderRadius: 14, borderWidth: 1, marginHorizontal: 24, marginTop: 16, padding: 12 },
  rotasSalvasCabecalho: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  atualizarRotas: { color: "#8b0000", fontSize: 13, fontWeight: "800" },
  carregandoSalvas: { paddingVertical: 12 },
  rotaSalvaItem: { alignItems: "center", borderTopColor: "#e5e7eb", borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 8, paddingVertical: 11 },
  rotaSalvaInfo: { flex: 1 },
  rotaSalvaNome: { color: "#1f2937", fontSize: 13, fontWeight: "800" },
  rotaSalvaEndereco: { color: "#626b75", fontSize: 11, lineHeight: 16, marginTop: 3 },
  rotaOffline: { color: "#24823b", fontSize: 11, fontWeight: "700", marginTop: 3 },
  acoesRotaSalva: { alignItems: "flex-end", gap: 6 },
  recalcularSalva: { alignItems: "center", borderColor: "#8b0000", borderRadius: 16, borderWidth: 1, justifyContent: "center", minHeight: 34, minWidth: 82, paddingHorizontal: 8 },
  apagarRotaSalva: { alignItems: "center", borderColor: "#b42318", borderRadius: 16, borderWidth: 1, justifyContent: "center", minHeight: 34, minWidth: 82, paddingHorizontal: 8 },
  textoApagarRota: { color: "#b42318", fontSize: 11, fontWeight: "800" },
  textoBotaoRota: { color: "#8b0000", fontSize: 11, fontWeight: "800" },
  entrarSalvas: { alignSelf: "flex-start", borderColor: "#8b0000", borderRadius: 16, borderWidth: 1, marginTop: 8, paddingHorizontal: 14, paddingVertical: 7 },
  verMaisRotas: { alignItems: "center", borderTopColor: "#e5e7eb", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 11 },
  formulario: { gap: 10, paddingHorizontal: 24, paddingTop: 20 },
  campo: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 14,
    borderWidth: 1,
    color: "#1f2937",
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  botaoLocalizacao: { alignSelf: "flex-start", paddingVertical: 5 },
  textoLocalizacao: { color: "#8b0000", fontSize: 14, fontWeight: "700" },
  preferenciasSeguranca: { backgroundColor: "#fff", borderColor: "#e5e7eb", borderRadius: 12, borderWidth: 1, gap: 10, marginTop: 4, padding: 12 },
  rotuloPreferencias: { color: "#1f2937", fontSize: 14, fontWeight: "800", marginBottom: 2 },
  opcaoPreferencia: { alignItems: "center", flexDirection: "row", gap: 9, minHeight: 30 },
  checkbox: { alignItems: "center", borderColor: "#9ca3af", borderRadius: 5, borderWidth: 1.5, height: 21, justifyContent: "center", width: 21 },
  checkboxSelecionado: { backgroundColor: "#8b0000", borderColor: "#8b0000" },
  checkmark: { color: "#fff", fontSize: 14, fontWeight: "800", lineHeight: 17 },
  textoPreferencia: { color: "#374151", flex: 1, fontSize: 13 },
  botaoCriar: {
    alignItems: "center",
    backgroundColor: "#8b0000",
    borderRadius: 26,
    elevation: 6,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 52,
  },
  botaoDesativado: { opacity: 0.6 },
  textoBotaoCriar: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  itemBusca: {
    backgroundColor: "#ffffff",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  nomeLocal: { color: "#1f2937", flex: 1, fontSize: 14 },
  erro: {
    color: "#b91c1c",
    fontSize: 14,
    marginHorizontal: 24,
    marginTop: 14,
  },
  resumo: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 24,
    marginTop: 18,
    padding: 16,
  },
  tituloResumo: { color: "#8b0000", fontSize: 17, fontWeight: "800" },
  alternativa: { backgroundColor: "#fff", borderColor: "#e5e7eb", borderRadius: 10, borderWidth: 1, marginTop: 10, padding: 10 },
  alternativaSelecionada: { backgroundColor: "#fff1f2", borderColor: "#8b0000", borderWidth: 2 },
  alternativaEvitada: { borderColor: "#d94848" },
  dadosRota: {
    color: "#1f2937",
    fontSize: 15,
    marginTop: 8,
    fontWeight: "600",
  },
  aviso: { color: "#6b7280", fontSize: 12, lineHeight: 17, marginTop: 10 },
  avisoRisco: { color: "#b42318", fontSize: 13, fontWeight: "700", lineHeight: 18, marginTop: 8 },
  salvoInfo: { color: "#24823b", fontSize: 13, fontWeight: "700", marginTop: 12 },
  botaoBaixar: { alignItems: "center", backgroundColor: "#31445b", borderRadius: 26, elevation: 4, justifyContent: "center", marginTop: 9, minHeight: 50 },
  botaoExpandirInline: { alignSelf: "center", paddingHorizontal: 14, paddingVertical: 10 },
 mapaContainer: {
  position: "relative",
  borderRadius: 16,
  height: 300,
  marginHorizontal: 24,
  marginTop: 22,
  overflow: "hidden",
  backgroundColor: "#e5e5e5",
},
  mapaTelaCheia: { alignSelf: "stretch", backgroundColor: "#e5e5e5", borderRadius: 0, flex: 1, height: "100%", marginBottom: 0, marginHorizontal: 0, marginTop: 0, overflow: "hidden", padding: 0, position: "relative", width: "100%" },
  mapa: { flex: 1 },
  legendaMapa: { backgroundColor: "rgba(255,255,255,0.93)", borderRadius: 9, left: 10, paddingHorizontal: 9, paddingVertical: 6, position: "absolute", top: 10 },
  legendaMapaExpandida: { top: 58 },
  textoLegendaMapa: { color: "#273142", fontSize: 11, fontWeight: "700", lineHeight: 17 },
  botaoExpandirMapa: { backgroundColor: "#fff", borderColor: "#d1d5db", borderRadius: 18, borderWidth: 1, bottom: 10, paddingHorizontal: 13, paddingVertical: 9, position: "absolute", right: 10 },
  textoBotaoExpandir: { color: "#8b0000", fontSize: 12, fontWeight: "800" },
  modalMapa: { backgroundColor: "#e5e5e5", flex: 1, margin: 0, padding: 0, width: "100%" },
  tituloLista: {
    color: "#1f2937",
    fontSize: 17,
    fontWeight: "700",
    paddingBottom: 10,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  lista: {
    backgroundColor: "#ffffff",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  vazioRecentes: { color: "#6b7280", fontSize: 14, padding: 18 },
  itemLocal: {
    alignItems: "center",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: 20,
  },
  iconeLocal: {
    alignItems: "center",
    backgroundColor: "#d1d5db",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    marginRight: 12,
    width: 32,
  },
  iconeItem: { height: 18, resizeMode: "contain", width: 18 },
});
