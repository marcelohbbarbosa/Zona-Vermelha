import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import MapView, { Circle, Marker, type Region } from "react-native-maps";
import { ApiError, api } from "../services/api";

type Coordenadas = { latitude: number; longitude: number };
type Status = "verde" | "amarelo" | "vermelho" | "sem_dados";
type Categoria = "assalto" | "infraestrutura" | "acidente" | "iluminacao" | "outro";
type Avaliacao = {
  id: number;
  categoria: Categoria;
  avaliacao: Exclude<Status, "sem_dados">;
  comentario: string | null;
  criadaEm: string;
  atualizadaEm: string;
};
type Resumo = Coordenadas & {
  status: Status;
  total: number;
  verdes: number;
  amarelos: number;
  vermelhos: number;
  relatos: Avaliacao[];
};

const CENTRO_INICIAL: Region = {
  latitude: -23.96,
  longitude: -46.33,
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};

const CATEGORIAS: { id: Categoria; titulo: string }[] = [
  { id: "assalto", titulo: "Assalto" },
  { id: "infraestrutura", titulo: "Infraestrutura" },
  { id: "acidente", titulo: "Acidente" },
  { id: "iluminacao", titulo: "Iluminação" },
  { id: "outro", titulo: "Outro" },
];

const CORES: Record<Status, string> = {
  verde: "#2f9e44",
  amarelo: "#d69e00",
  vermelho: "#d94848",
  sem_dados: "#64748b",
};

const rotulosStatus: Record<Status, string> = {
  verde: "Região bem avaliada",
  amarelo: "Região em alerta",
  vermelho: "Região com muitos relatos de risco",
  sem_dados: "Ainda sem avaliações",
};

function formatarData(valor: string) {
  return new Date(valor).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AvaliacoesRegiao({ navigation, route }: any) {
  const mapaRef = useRef<MapView>(null);
  const coordenadasIniciais = useMemo<Coordenadas | null>(() => {
    const latitude = Number(route?.params?.latitude);
    const longitude = Number(route?.params?.longitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
  }, [route?.params?.latitude, route?.params?.longitude]);
  const [local, setLocal] = useState<Coordenadas | null>(coordenadasIniciais);
  const [permissaoNegada, setPermissaoNegada] = useState(false);
  const [categoria, setCategoria] = useState<Categoria>("infraestrutura");
  const [avaliacao, setAvaliacao] = useState<"verde" | "amarelo" | "vermelho">("amarelo");
  const [comentario, setComentario] = useState("");
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const localizar = useCallback(async () => {
    try {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (permissao.status !== "granted") {
        setPermissaoNegada(true);
        return;
      }
      setPermissaoNegada(false);
      const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocal({ latitude: posicao.coords.latitude, longitude: posicao.coords.longitude });
    } catch {
      setErro("Não foi possível obter sua localização. Toque no mapa para escolher um ponto.");
    }
  }, []);

  useEffect(() => {
    if (!coordenadasIniciais) void localizar();
  }, [coordenadasIniciais, localizar]);

  const carregarResumo = useCallback(async (ponto: Coordenadas) => {
    setCarregando(true);
    setErro("");
    try {
      const dados = await api(`/avaliacoes-regiao?latitude=${ponto.latitude}&longitude=${ponto.longitude}`) as Resumo;
      setResumo(dados);
    } catch (e: any) {
      setResumo(null);
      setErro(e.message || "Não foi possível carregar as avaliações desta região.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (local) void carregarResumo(local);
  }, [local, carregarResumo]);

  useEffect(() => {
    if (local) mapaRef.current?.animateToRegion({ ...local, latitudeDelta: 0.009, longitudeDelta: 0.009 }, 350);
  }, [local]);

  const salvar = async () => {
    if (!local) {
      Alert.alert("Escolha um local", "Use sua localização atual ou toque no mapa para escolher onde ocorreu o problema.");
      return;
    }
    setSalvando(true);
    try {
      await api("/avaliacoes-regiao", {
        method: "POST",
        autenticado: true,
        body: { ...local, categoria, avaliacao, comentario: comentario.trim() || null },
      });
      setComentario("");
      Alert.alert("Avaliação registrada", "Sua avaliação já foi incluída no resumo desta região.");
      await carregarResumo(local);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) {
        Alert.alert("Entre na sua conta", "Faça login para publicar uma avaliação.", [
          { text: "Agora não", style: "cancel" },
          { text: "Entrar", onPress: () => navigation.navigate("Login") },
        ]);
      } else {
        Alert.alert("Não foi possível publicar", e.message || "Tente novamente em instantes.");
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" onPress={() => navigation.goBack()} style={styles.back}>
          <Image source={require("../../assets/images/Return.png")} style={styles.backIcon} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Avaliações da região</Text>
          <Text style={styles.subtitle}>Relatos recentes ajudam a orientar a comunidade.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.mapHeading}>
          <Text style={styles.sectionTitle}>Onde fica?</Text>
          <Pressable onPress={() => void localizar()} style={styles.locationButton}>
            <Text style={styles.locationButtonText}>Usar minha localização</Text>
          </Pressable>
        </View>
        <Text style={styles.helper}>O mapa começa na sua posição. Toque em outro ponto para mudar. A área avaliada tem cerca de 200 m.</Text>
        <View style={styles.mapFrame}>
          <MapView
            ref={mapaRef}
            initialRegion={coordenadasIniciais ? { ...coordenadasIniciais, latitudeDelta: 0.009, longitudeDelta: 0.009 } : CENTRO_INICIAL}
            onPress={(event) => setLocal(event.nativeEvent.coordinate)}
            showsUserLocation
            style={styles.map}
          >
            {local ? <>
              <Circle center={local} radius={140} fillColor="rgba(214,158,0,0.14)" strokeColor="rgba(214,158,0,0.75)" strokeWidth={2} />
              <Marker coordinate={local} pinColor={CORES[resumo?.status ?? "sem_dados"]} title="Local selecionado" />
            </> : null}
          </MapView>
        </View>
        {permissaoNegada ? <Text style={styles.helper}>A localização foi negada. Escolha o ponto manualmente no mapa.</Text> : null}

        <View style={styles.summaryCard}>
          <View style={[styles.statusDot, { backgroundColor: CORES[resumo?.status ?? "sem_dados"] }]} />
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>{rotulosStatus[resumo?.status ?? "sem_dados"]}</Text>
            <Text style={styles.summarySubtitle}>
              {resumo ? `${resumo.total} avaliação(ões) nos últimos 90 dias` : "Sem dados recentes neste ponto"}
            </Text>
          </View>
          {carregando ? <ActivityIndicator color="#8b0000" /> : null}
        </View>
        {resumo?.total ? (
          <View style={styles.counts}>
            <Text style={[styles.count, { color: CORES.verde }]}>Verde {resumo.verdes}</Text>
            <Text style={[styles.count, { color: CORES.amarelo }]}>Alerta {resumo.amarelos}</Text>
            <Text style={[styles.count, { color: CORES.vermelho }]}>Risco {resumo.vermelhos}</Text>
          </View>
        ) : null}
        {erro ? <Text style={styles.error}>{erro}</Text> : null}

        <Text style={styles.sectionTitle}>Adicionar uma avaliação</Text>
        <Text style={styles.helper}>Escolha o tipo de ocorrência e como você avalia este local.</Text>
        <View style={styles.chips}>
          {CATEGORIAS.map((item) => (
            <Pressable key={item.id} onPress={() => setCategoria(item.id)} style={[styles.chip, categoria === item.id && styles.chipSelected]}>
              <Text style={[styles.chipText, categoria === item.id && styles.chipTextSelected]}>{item.titulo}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.ratings}>
          {([
            ["verde", "Bom", "#2f9e44"],
            ["amarelo", "Alerta", "#d69e00"],
            ["vermelho", "Perigoso", "#d94848"],
          ] as const).map(([id, titulo, cor]) => (
            <Pressable key={id} onPress={() => setAvaliacao(id)} style={[styles.ratingOption, avaliacao === id && { borderColor: cor, backgroundColor: `${cor}16` }]}>
              <View style={[styles.ratingDot, { backgroundColor: cor }]} />
              <Text style={styles.ratingText}>{titulo}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          maxLength={1000}
          multiline
          onChangeText={setComentario}
          placeholder="Conte o que aconteceu (opcional)"
          placeholderTextColor="#77808c"
          style={styles.input}
          textAlignVertical="top"
          value={comentario}
        />
        <Pressable disabled={salvando} onPress={() => void salvar()} style={[styles.submit, salvando && styles.disabled]}>
          {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Publicar avaliação</Text>}
        </Pressable>
        <Text style={styles.scoringNote}>O resumo considera os últimos 90 dias: verde melhora o resultado, amarelo indica alerta e vermelho pesa o dobro. Cada pessoa pode manter uma avaliação por área de cerca de 200 m; uma nova publicação atualiza a anterior.</Text>

        <Text style={[styles.sectionTitle, styles.reportsTitle]}>Relatos desta área</Text>
        {resumo?.relatos.length ? resumo.relatos.map((item) => (
          <View key={item.id} style={styles.reportCard}>
            <View style={styles.reportTop}>
              <Text style={styles.reportCategory}>{CATEGORIAS.find((c) => c.id === item.categoria)?.titulo ?? "Outro"}</Text>
              <Text style={[styles.reportRating, { color: CORES[item.avaliacao] }]}>{item.avaliacao === "verde" ? "Bom" : item.avaliacao === "amarelo" ? "Alerta" : "Perigoso"}</Text>
            </View>
            {item.comentario ? <Text style={styles.reportComment}>{item.comentario}</Text> : <Text style={styles.noComment}>Sem comentário</Text>}
            <Text style={styles.reportDate}>{formatarData(item.atualizadaEm)}</Text>
          </View>
        )) : <Text style={styles.empty}>Ainda não há relatos recentes. Você pode ser a primeira pessoa a avaliar este local.</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#f6f7f9", flex: 1 },
  header: { alignItems: "center", backgroundColor: "#fff", flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  back: { alignItems: "center", backgroundColor: "#f1f2f4", borderRadius: 21, height: 42, justifyContent: "center", width: 42 },
  backIcon: { height: 21, resizeMode: "contain", width: 21 },
  headerText: { flex: 1 },
  title: { color: "#20252b", fontSize: 18, fontWeight: "800" },
  subtitle: { color: "#68717c", fontSize: 12, marginTop: 2 },
  content: { padding: 16, paddingBottom: 36 },
  mapHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { color: "#252a30", fontSize: 17, fontWeight: "800", marginBottom: 6, marginTop: 12 },
  locationButton: { backgroundColor: "#fee2e2", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  locationButtonText: { color: "#8b0000", fontSize: 12, fontWeight: "700" },
  helper: { color: "#68717c", fontSize: 13, lineHeight: 19, marginBottom: 10 },
  mapFrame: { borderRadius: 18, height: 250, overflow: "hidden" },
  map: { flex: 1 },
  summaryCard: { alignItems: "center", backgroundColor: "#fff", borderRadius: 14, flexDirection: "row", marginTop: 14, padding: 14 },
  statusDot: { borderRadius: 10, height: 18, marginRight: 11, width: 18 },
  summaryText: { flex: 1 },
  summaryTitle: { color: "#23282e", fontSize: 14, fontWeight: "800" },
  summarySubtitle: { color: "#68717c", fontSize: 12, marginTop: 3 },
  counts: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 12 },
  count: { fontSize: 12, fontWeight: "800" },
  error: { color: "#b42318", fontSize: 13, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  chip: { backgroundColor: "#e9ebef", borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  chipSelected: { backgroundColor: "#8b0000" },
  chipText: { color: "#444b54", fontSize: 13, fontWeight: "600" },
  chipTextSelected: { color: "#fff" },
  ratings: { flexDirection: "row", gap: 8, marginVertical: 8 },
  ratingOption: { alignItems: "center", backgroundColor: "#fff", borderColor: "#e0e3e8", borderRadius: 12, borderWidth: 1.5, flex: 1, flexDirection: "row", justifyContent: "center", minHeight: 46 },
  ratingDot: { borderRadius: 5, height: 10, marginRight: 6, width: 10 },
  ratingText: { color: "#30363d", fontSize: 12, fontWeight: "700" },
  input: { backgroundColor: "#fff", borderColor: "#dfe3e8", borderRadius: 12, borderWidth: 1, color: "#252a30", fontSize: 14, height: 96, marginTop: 8, padding: 12 },
  submit: { alignItems: "center", backgroundColor: "#c83232", borderRadius: 12, justifyContent: "center", marginTop: 12, minHeight: 48 },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.65 },
  scoringNote: { color: "#737c86", fontSize: 11, lineHeight: 16, marginTop: 9 },
  reportsTitle: { marginTop: 24 },
  reportCard: { backgroundColor: "#fff", borderRadius: 14, marginTop: 9, padding: 14 },
  reportTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  reportCategory: { color: "#30363d", fontSize: 14, fontWeight: "800" },
  reportRating: { fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  reportComment: { color: "#48515b", fontSize: 14, lineHeight: 20, marginTop: 8 },
  noComment: { color: "#808892", fontSize: 13, fontStyle: "italic", marginTop: 8 },
  reportDate: { color: "#8a929b", fontSize: 11, marginTop: 9 },
  empty: { color: "#707984", fontSize: 13, lineHeight: 19, paddingVertical: 10 },
});
