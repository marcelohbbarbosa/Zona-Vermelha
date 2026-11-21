
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import * as Location from "expo-location";
import { File, Paths } from "expo-file-system";

import MapView, {
  Marker,
  Polyline,
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

type AlternativaRota = {
  id: string;
  distanceMeters: number;
  durationSeconds: number;
  geometry: { coordinates: [number, number][] };
  recommended: boolean;
  risk: { riskScore?: number; blocked?: boolean; penalty?: number; yellowCount?: number; redCount?: number; risks?: Array<{ category: string; level: number; zona: string }> };
};

type ResultadoRota = {
  id?: string;
  coordenadas: Coordenadas[];
  distancia: number;
  duracao: number;
  aviso?: string;
  limiteDesvio?: boolean;
  risco?: AlternativaRota["risk"];
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

export default function Rotas({ navigation, route }: any) {
  const mapaRef = useRef<MapView>(null);

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
  const [evitarAmarelas, setEvitarAmarelas] = useState(false);
  const [evitarVermelhas, setEvitarVermelhas] = useState(false);
  const [localizando, setLocalizando] = useState(false);
  const [erroBusca, setErroBusca] = useState("");
  const [avisoRota, setAvisoRota] = useState("");
  const solicitouLocalizacaoInicial = useRef(false);

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

  const selecionarAlternativa = (alternativa: AlternativaRota, aviso?: string, limiteDesvio = false) => {
    const coordenadas = alternativa.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
    setResultadoRota({
      id: alternativa.id,
      coordenadas,
      distancia: alternativa.distanceMeters,
      duracao: alternativa.durationSeconds,
      aviso,
      limiteDesvio,
      risco: alternativa.risk,
    });
    setRotaSalvaId(null);
    setRotaBaixada(false);
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
    setRotaSalvaId(null);
    setRotaBaixada(false);

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
      const arquivo = new File(Paths.document, `rota-${rotaSalvaId}.json`);
      await arquivo.write(JSON.stringify({
        id: rotaSalvaId,
        nome: `${origem} → ${destino}`,
        origem,
        destino,
        origin: origemCoordenadas,
        destination: destinoCoordenadas,
        route: resultadoRota,
        baixadaEm: new Date().toISOString(),
      }));
      await api(`/rotas/${rotaSalvaId}/baixar`, { method: "POST", autenticado: true });
      setRotaBaixada(true);
      Alert.alert("Rota baixada", "Ela foi armazenada no dispositivo para consulta offline.");
    } catch (erro: any) {
      Alert.alert("Não foi possível baixar", erro.message || "Tente novamente quando estiver conectado.");
    } finally {
      setBaixandoRota(false);
    }
  };

  const mostrarResultados =
    campoAtivo === "origem" ? resultadosOrigem : resultadosDestino;

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
                <Pressable disabled={baixandoRota || rotaBaixada} onPress={() => void baixarRota()} style={[styles.botaoBaixar, (baixandoRota || rotaBaixada) && styles.botaoDesativado]}>
                  {baixandoRota ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotaoCriar}>{rotaBaixada ? "Rota baixada para uso offline" : "Baixar rota salva"}</Text>}
                </Pressable>
              </View>
            )}
          </View>
        ) : null}

        
<View style={styles.mapaContainer}>
  
<MapView
  ref={mapaRef}
  style={styles.mapa}
  initialRegion={{
    latitude: -23.96,
    longitude: -46.33,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
  }}
  mapType="standard"
>
  {origemCoordenadas ? <Marker coordinate={origemCoordenadas} title="Origem" pinColor="green" /> : null}
  {destinoCoordenadas ? <Marker coordinate={destinoCoordenadas} title="Destino" pinColor="red" /> : null}
  {resultadoRota?.coordenadas?.length ? (
    <Polyline coordinates={resultadoRota.coordenadas} strokeColor="#8b0000" strokeWidth={5} />
  ) : null}
</MapView>

</View>


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
 mapaContainer: {
  borderRadius: 16,
  height: 300,
  marginHorizontal: 24,
  marginTop: 22,
  overflow: "hidden",
  backgroundColor: "#e5e5e5",
},
  mapa: { flex: 1 },
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
