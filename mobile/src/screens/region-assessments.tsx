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
type Categoria =
  | "assalto" | "infraestrutura" | "acidente" | "iluminacao" | "outro"
  | "boa_iluminacao" | "policiamento_presente" | "via_conservada" | "local_movimentado" | "ambiente_tranquilo"
  | "iluminacao_ruim" | "buracos_na_via" | "calcada_danificada" | "alagamento" | "sinalizacao_danificada" | "lixo_acumulado"
  | "furto" | "ameaca_agressao" | "assedio" | "comercio_drogas";
type Avaliacao = {
  id: number;
  zona: string | null;
  tags: { id: number; nome: string; nivel: number; cor: "verde" | "amarelo" | "vermelho" }[];
  comentario: string | null;
  criadaEm: string;
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

const TAGS: Record<"verde" | "amarelo" | "vermelho", { id: Categoria; titulo: string }[]> = {
  verde: [
    { id: "boa_iluminacao", titulo: "Boa iluminação" },
    { id: "policiamento_presente", titulo: "Policiamento presente" },
    { id: "via_conservada", titulo: "Rua bem conservada" },
    { id: "local_movimentado", titulo: "Local movimentado" },
    { id: "ambiente_tranquilo", titulo: "Ambiente tranquilo" },
  ],
  amarelo: [
    { id: "iluminacao_ruim", titulo: "Iluminação ruim" },
    { id: "buracos_na_via", titulo: "Buracos na via" },
    { id: "calcada_danificada", titulo: "Calçada danificada" },
    { id: "alagamento", titulo: "Alagamento" },
    { id: "sinalizacao_danificada", titulo: "Sinalização danificada" },
    { id: "lixo_acumulado", titulo: "Lixo acumulado" },
  ],
  vermelho: [
    { id: "assalto", titulo: "Assalto ou roubo" },
    { id: "furto", titulo: "Furto" },
    { id: "ameaca_agressao", titulo: "Ameaça ou agressão" },
    { id: "assedio", titulo: "Assédio" },
    { id: "comercio_drogas", titulo: "Comércio de drogas" },
  ],
};

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
  const [zona, setZona] = useState("");
  const [permissaoNegada, setPermissaoNegada] = useState(false);
  const [corTagAtiva, setCorTagAtiva] = useState<"verde" | "amarelo" | "vermelho">("verde");
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<Categoria[]>([]);
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
    if (!local) return;
    let ativo = true;
    const preencherZona = async () => {
      const fallback = `Região ${local.latitude.toFixed(4)}, ${local.longitude.toFixed(4)}`;
      try {
        const enderecos = await Location.reverseGeocodeAsync(local);
        const endereco = enderecos[0];
        const rua = [endereco?.street, endereco?.streetNumber].filter(Boolean).join(", ");
        const municipio = endereco?.city ?? endereco?.subregion ?? endereco?.region;
        const nomeZona = [rua, endereco?.district, municipio]
          .filter((parte, indice, partes) => Boolean(parte) && partes.indexOf(parte) === indice)
          .join(" · ") || fallback;
        if (ativo) setZona(nomeZona);
      } catch {
        if (ativo) setZona(fallback);
      }
    };
    void preencherZona();
    return () => { ativo = false; };
  }, [local]);

  useEffect(() => {
    if (local) mapaRef.current?.animateToRegion({ ...local, latitudeDelta: 0.009, longitudeDelta: 0.009 }, 350);
  }, [local]);

  const salvar = async () => {
    if (!local) {
      Alert.alert("Escolha um local", "Use sua localização atual ou toque no mapa para escolher onde ocorreu o problema.");
      return;
    }
    if (!categoriasSelecionadas.length) {
      Alert.alert("Escolha uma tag", "Selecione uma tag verde, amarela ou vermelha antes de publicar.");
      return;
    }
    setSalvando(true);
    try {
      await api("/avaliacoes-regiao", {
        method: "POST",
        autenticado: true,
        body: { ...local, zona, tags: categoriasSelecionadas, comentario: comentario.trim() || null },
      });
      setComentario("");
      setCategoriasSelecionadas([]);
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
        <Text style={styles.zoneLabel}>Zona preenchida pela localização</Text>
        <TextInput
          maxLength={200}
          onChangeText={setZona}
          placeholder="Localizando rua e bairro..."
          placeholderTextColor="#77808c"
          style={styles.zoneInput}
          value={zona}
        />
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

        <Text style={styles.sectionTitle}>Tags da avaliação</Text>
        <Text style={styles.helper}>Escolha uma tag. A cor define como ela afeta a avaliação desta zona.</Text>
        <View style={styles.colorTabs}>
          {([
            ["verde", "Verde · bom"],
            ["amarelo", "Amarelo · alerta"],
            ["vermelho", "Vermelho · risco"],
          ] as const).map(([cor, titulo]) => (
            <Pressable
              key={cor}
              onPress={() => setCorTagAtiva(cor)}
              style={[styles.colorTab, corTagAtiva === cor && { backgroundColor: CORES[cor], borderColor: CORES[cor] }]}
            >
              <Text style={[styles.colorTabText, corTagAtiva === cor && styles.colorTabTextSelected]}>{titulo}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.chips}>
          {TAGS[corTagAtiva].map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setCategoriasSelecionadas((selecionadas) => selecionadas.includes(item.id)
                ? selecionadas.filter((id) => id !== item.id)
                : [...selecionadas, item.id])}
              style={[styles.chip, categoriasSelecionadas.includes(item.id) && { backgroundColor: CORES[corTagAtiva], borderColor: CORES[corTagAtiva] }]}
            >
              <Text style={[styles.chipText, categoriasSelecionadas.includes(item.id) && styles.chipTextSelected]}>{item.titulo}</Text>
            </Pressable>
          ))}
        </View>
        {corTagAtiva === "vermelho" ? (
          <Text style={styles.tagNote}>Marque uma ocorrência ou comportamento concreto, como ameaça ou agressão. Não classifique alguém como perigoso apenas por sua condição de saúde ou uso de substâncias.</Text>
        ) : null}
        {categoriasSelecionadas.length ? (
          <Text style={styles.selectedTag}>
            Tags selecionadas: {TAGS.verde.concat(TAGS.amarelo, TAGS.vermelho).filter((tag) => categoriasSelecionadas.includes(tag.id)).map((tag) => tag.titulo).join(", ")}
          </Text>
        ) : null}
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
        <Text style={styles.scoringNote}>O resumo considera os últimos 90 dias: tags verdes melhoram o resultado, amarelas indicam alerta e vermelhas pesam o dobro. Você pode selecionar várias tags nesta publicação.</Text>

        <Text style={[styles.sectionTitle, styles.reportsTitle]}>Relatos desta área</Text>
        {resumo?.relatos.length ? resumo.relatos.map((item) => (
          <View key={item.id} style={styles.reportCard}>
            <View style={styles.reportTags}>
              {item.tags.map((tag) => (
                <View key={tag.id} style={[styles.reportTag, { backgroundColor: `${CORES[tag.cor]}20` }]}>
                  <Text style={[styles.reportTagText, { color: CORES[tag.cor] }]}>{tag.nome}</Text>
                </View>
              ))}
            </View>
            {item.zona ? <Text style={styles.reportZone}>{item.zona}</Text> : null}
            {item.comentario ? <Text style={styles.reportComment}>{item.comentario}</Text> : <Text style={styles.noComment}>Sem comentário</Text>}
            <Text style={styles.reportDate}>{formatarData(item.criadaEm)}</Text>
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
  zoneLabel: { color: "#505963", fontSize: 12, fontWeight: "700", marginBottom: 5 },
  zoneInput: { backgroundColor: "#fff", borderColor: "#dfe3e8", borderRadius: 10, borderWidth: 1, color: "#252a30", fontSize: 14, marginBottom: 10, minHeight: 42, paddingHorizontal: 12 },
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
  colorTabs: { flexDirection: "row", gap: 6, marginVertical: 8 },
  colorTab: { alignItems: "center", borderColor: "#dfe3e8", borderRadius: 10, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: 42, paddingHorizontal: 4 },
  colorTabText: { color: "#40464e", fontSize: 11, fontWeight: "700", textAlign: "center" },
  colorTabTextSelected: { color: "#fff" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 },
  chip: { backgroundColor: "#e9ebef", borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  chipText: { color: "#444b54", fontSize: 13, fontWeight: "600" },
  chipTextSelected: { color: "#fff" },
  tagNote: { color: "#68717c", fontSize: 11, lineHeight: 16, marginBottom: 8 },
  selectedTag: { color: "#343a40", fontSize: 13, fontWeight: "700", marginBottom: 4 },
  input: { backgroundColor: "#fff", borderColor: "#dfe3e8", borderRadius: 12, borderWidth: 1, color: "#252a30", fontSize: 14, height: 96, marginTop: 8, padding: 12 },
  submit: { alignItems: "center", backgroundColor: "#c83232", borderRadius: 12, justifyContent: "center", marginTop: 12, minHeight: 48 },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.65 },
  scoringNote: { color: "#737c86", fontSize: 11, lineHeight: 16, marginTop: 9 },
  reportsTitle: { marginTop: 24 },
  reportCard: { backgroundColor: "#fff", borderRadius: 14, marginTop: 9, padding: 14 },
  reportTags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  reportTag: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  reportTagText: { fontSize: 12, fontWeight: "800" },
  reportZone: { color: "#68717c", fontSize: 12, marginTop: 6 },
  reportComment: { color: "#48515b", fontSize: 14, lineHeight: 20, marginTop: 8 },
  noComment: { color: "#808892", fontSize: 13, fontStyle: "italic", marginTop: 8 },
  reportDate: { color: "#8a929b", fontSize: 11, marginTop: 9 },
  empty: { color: "#707984", fontSize: 13, lineHeight: 19, paddingVertical: 10 },
});
