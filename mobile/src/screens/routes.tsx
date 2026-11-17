
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
  id: number;
  nome: string;
};

type AlternativaRota = {
  id: string;
  distanceMeters: number;
  durationSeconds: number;
  geometry: { coordinates: [number, number][] };
  recommended: boolean;
  risk: { riskScore?: number; blocked?: boolean; penalty?: number; risks?: Array<{ category: string; severity: string }> };
};

type ResultadoRota = {
  id?: string;
  coordenadas: Coordenadas[];
  distancia: number;
  duracao: number;
  aviso?: string;
  risco?: AlternativaRota["risk"];
};

const sugestoesRecentes = [
  "Rua Almeida, 523",
  "Rua Anchieta, 212",
  "Rua Anchieta, 215",
  "Rua Augusta",
  "Rua Afonso Bovero",
  "Rua Argentina",
];

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
  const [campoAtivo, setCampoAtivo] = useState<"origem" | "destino" | null>(
    null,
  );

  const [resultadoRota, setResultadoRota] =
    useState<ResultadoRota | null>(null);
  const [alternativasRota, setAlternativasRota] = useState<AlternativaRota[]>([]);
  const [solicitacaoRotaId, setSolicitacaoRotaId] = useState<string | number | null>(null);
  const [carregandoRota, setCarregandoRota] = useState(false);
  const [localizando, setLocalizando] = useState(false);
  const [erroBusca, setErroBusca] = useState("");

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

    const temporizador = setTimeout(async () => {
      try {
        const locais = (await api(
          `/locais/buscar?q=${encodeURIComponent(origem.trim())}`,
        )) as Local[];

        if (!cancelado) setResultadosOrigem(locais);
      } catch {
        if (!cancelado) setResultadosOrigem([]);
      }
    }, 450);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
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

    const temporizador = setTimeout(async () => {
      try {
        const locais = (await api(
          `/locais/buscar?q=${encodeURIComponent(destino.trim())}`,
        )) as Local[];

        if (!cancelado) setResultadosDestino(locais);
      } catch {
        if (!cancelado) setResultadosDestino([]);
      }
    }, 450);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [destino, destinoCoordenadas, campoAtivo]);

  const invalidarRota = () => {
    setResultadoRota(null);
    setAlternativasRota([]);
    setSolicitacaoRotaId(null);
    setErroBusca("");
  };

  const selecionarAlternativa = (alternativa: AlternativaRota, aviso?: string) => {
    const coordenadas = alternativa.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
    setResultadoRota({
      id: alternativa.id,
      coordenadas,
      distancia: alternativa.distanceMeters,
      duracao: alternativa.durationSeconds,
      aviso,
      risco: alternativa.risk,
    });
    setTimeout(() => mapaRef.current?.fitToCoordinates(coordenadas, {
      edgePadding: { top: 55, right: 45, bottom: 55, left: 45 },
      animated: true,
    }), 250);
  };

  const recalcularRota = async () => {
    if (!solicitacaoRotaId) return;
    setCarregandoRota(true);
    setErroBusca("");
    try {
      const dados = await api(`/rotas/${solicitacaoRotaId}/recalcular`, { method: "POST" }) as any;
      setSolicitacaoRotaId(dados.requestId);
      setAlternativasRota(dados.routes ?? []);
      const recomendada = (dados.routes ?? []).find((item: AlternativaRota) => item.id === dados.recommendedRouteId) ?? dados.routes?.[0];
      if (!recomendada) throw new Error(dados.warning || "Não foi possível recalcular a rota.");
      selecionarAlternativa(recomendada, dados.warning);
    } catch (erro: any) {
      setErroBusca(erro.message || "Não foi possível recalcular a rota.");
    } finally {
      setCarregandoRota(false);
    }
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

    try {
      const dados = await api("/rotas/calcular", {
        method: "POST",
        body: {
          origin: origemCoordenadas,
          destination: destinoCoordenadas,
          alternatives: 3,
        },
      }) as any;

      const rotaCalculada =
        dados.routes?.find((item: any) => item.id === dados.recommendedRouteId) ??
        dados.routes?.[0];

      if (!rotaCalculada?.geometry?.coordinates?.length) {
        throw new Error(
          dados.warning || "Não foi possível encontrar uma rota entre esses endereços.",
        );
      }

      setSolicitacaoRotaId(dados.requestId);
      setAlternativasRota(dados.routes ?? []);
      selecionarAlternativa(rotaCalculada, dados.warning);

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

        {resultadoRota ? (
          <View style={styles.resumo}>
            <Text style={styles.tituloResumo}>Rota calculada</Text>
            {alternativasRota.length > 1 ? (
              <View style={{ gap: 8, marginTop: 10 }}>
                <Text style={styles.dadosRota}>Alternativas disponíveis</Text>
                {alternativasRota.map((alternativa, index) => (
                  <Pressable
                    key={alternativa.id}
                    onPress={() => selecionarAlternativa(alternativa, resultadoRota.aviso)}
                    style={{
                      borderWidth: 1,
                      borderColor: resultadoRota.id === alternativa.id ? "#8b0000" : "#e5e7eb",
                      borderRadius: 10,
                      padding: 10,
                      backgroundColor: resultadoRota.id === alternativa.id ? "#fff1f2" : "#ffffff",
                    }}
                  >
                    <Text style={styles.dadosRota}>
                      {alternativa.recommended ? "Recomendada" : `Alternativa ${index + 1}`}
                      {alternativa.risk?.blocked ? " • bloqueio identificado" : ""}
                    </Text>
                    <Text style={styles.aviso}>
                      {(alternativa.distanceMeters / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km • {Math.max(1, Math.round(alternativa.durationSeconds / 60))} min • risco {alternativa.risk?.riskScore ?? 0}/100
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Pressable
              onPress={recalcularRota}
              disabled={carregandoRota || !solicitacaoRotaId}
              style={[styles.botaoCriar, { marginTop: 12 }, carregandoRota && styles.botaoDesativado]}
            >
              <Text style={styles.textoBotaoCriar}>Recalcular com dados atuais</Text>
            </Pressable>
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
                Risco cadastrado: {resultadoRota.risco.blocked ? "bloqueio identificado" : `${resultadoRota.risco.riskScore ?? 0}/100`}
              </Text>
            ) : null}
            <Text style={styles.aviso}>
              {resultadoRota.aviso || "Estimativa para deslocamento de carro. Não é garantia de segurança nem considera necessariamente o trânsito em tempo real."}
            </Text>
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
          {sugestoesRecentes.map((local) => (
            <Pressable
              accessibilityRole="button"
              key={local}
              onPress={() => {
                setDestino(local);
                setDestinoCoordenadas(null);
                setCampoAtivo("destino");
                invalidarRota();
              }}
              style={styles.itemLocal}
            >
              <View style={styles.iconeLocal}>
                <Image source={imagens.recente} style={styles.iconeItem} />
              </View>
              <Text numberOfLines={1} style={styles.nomeLocal}>
                {local}
              </Text>
            </Pressable>
          ))}
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
  dadosRota: {
    color: "#1f2937",
    fontSize: 15,
    marginTop: 8,
    fontWeight: "600",
  },
  aviso: { color: "#6b7280", fontSize: 12, lineHeight: 17, marginTop: 10 },
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
