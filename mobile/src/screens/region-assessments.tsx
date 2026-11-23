import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { ApiError, api } from "../services/api";
import { temLinguagemPreconceituosa } from "../services/content-filter";

type Coordenadas = { latitude: number; longitude: number };
type LocalEncontrado = Coordenadas & { id: number | string; nome: string };
type Status = "verde" | "amarelo" | "vermelho" | "sem_dados";
type Categoria =
  | "assalto" | "infraestrutura" | "acidente" | "iluminacao" | "outro"
  | "boa_iluminacao" | "policiamento_presente" | "via_conservada" | "local_movimentado" | "ambiente_tranquilo"
  | "iluminacao_ruim" | "buracos_na_via" | "calcada_danificada" | "alagamento" | "sinalizacao_danificada" | "lixo_acumulado"
  | "furto" | "ameaca_agressao" | "assedio" | "comercio_drogas";
type Avaliacao = {
  id: number;
  idUsuario: number;
  zona: string | null;
  tags: { id: number; nome: string; nivel: number; cor: "verde" | "amarelo" | "vermelho" }[];
  comentario: string | null;
  criadaEm: string;
};
type MotivoDenuncia = "Preconceito ou discriminação" | "Ameaça ou incentivo à violência" | "Spam ou conteúdo irrelevante" | "Outro motivo";
type Resumo = Coordenadas & {
  status: Status;
  total: number;
  verdes: number;
  amarelos: number;
  vermelhos: number;
  relatos: Avaliacao[];
};
type CelulaMapa = Coordenadas & {
  celulaLat: number;
  celulaLng: number;
  status: Status;
  total: number;
  verdes: number;
  amarelos: number;
  vermelhos: number;
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
const MOTIVOS_DENUNCIA: MotivoDenuncia[] = [
  "Preconceito ou discriminação",
  "Ameaça ou incentivo à violência",
  "Spam ou conteúdo irrelevante",
  "Outro motivo",
];

function formatarData(valor: string) {
  return new Date(valor).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AvaliacoesRegiao({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const mapaRef = useRef<MapView>(null);
  const mapaExpandidoRef = useRef<MapView>(null);
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const comentarioY = useRef(0);
  const coordenadasIniciais = useMemo<Coordenadas | null>(() => {
    const latitude = Number(route?.params?.latitude);
    const longitude = Number(route?.params?.longitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
  }, [route?.params?.latitude, route?.params?.longitude]);
  const [local, setLocal] = useState<Coordenadas | null>(coordenadasIniciais);
  const [regiaoMapa, setRegiaoMapa] = useState<Region>(() => coordenadasIniciais
    ? { ...coordenadasIniciais, latitudeDelta: 0.009, longitudeDelta: 0.009 }
    : CENTRO_INICIAL);
  const [celulasMapa, setCelulasMapa] = useState<CelulaMapa[]>([]);
  const [mapaExpandido, setMapaExpandido] = useState(false);
  const limitesZona = useMemo(() => {
    if (!local) return [];
    const tamanho = 0.004;
    const sul = Math.floor(local.latitude / tamanho) * tamanho;
    const oeste = Math.floor(local.longitude / tamanho) * tamanho;
    const norte = sul + tamanho;
    const leste = oeste + tamanho;
    return [
      { latitude: sul, longitude: oeste },
      { latitude: sul, longitude: leste },
      { latitude: norte, longitude: leste },
      { latitude: norte, longitude: oeste },
    ];
  }, [local]);
  const [zona, setZona] = useState(typeof route?.params?.zona === "string" ? route.params.zona : "");
  const [buscaAtiva, setBuscaAtiva] = useState(false);
  const [resultadosBusca, setResultadosBusca] = useState<LocalEncontrado[]>([]);
  const [buscandoLocais, setBuscandoLocais] = useState(false);
  const [permissaoNegada, setPermissaoNegada] = useState(false);
  const [corTagAtiva, setCorTagAtiva] = useState<"verde" | "amarelo" | "vermelho">("verde");
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<Categoria[]>([]);
  const [comentario, setComentario] = useState("");
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [denunciaAlvo, setDenunciaAlvo] = useState<Avaliacao | null>(null);
  const [motivoDenuncia, setMotivoDenuncia] = useState<MotivoDenuncia | null>(null);
  const [enviandoDenuncia, setEnviandoDenuncia] = useState(false);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [edicaoAlvo, setEdicaoAlvo] = useState<Avaliacao | null>(null);
  const [comentarioEdicao, setComentarioEdicao] = useState("");
  const [tagsEdicao, setTagsEdicao] = useState<Categoria[]>([]);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const comentarioPreconceituoso = temLinguagemPreconceituosa(comentario);

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

  useEffect(() => {
    api("/auth/perfil", { autenticado: true })
      .then((perfil: any) => setUsuarioId(Number(perfil.id)))
      .catch(() => setUsuarioId(null));
  }, []);

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
    const zonaInicial = typeof route?.params?.zona === "string" ? route.params.zona : "";
    const correspondeAoPontoTuristico = Boolean(coordenadasIniciais
      && Math.abs(local.latitude - coordenadasIniciais.latitude) < 0.000001
      && Math.abs(local.longitude - coordenadasIniciais.longitude) < 0.000001);
    if (zonaInicial && correspondeAoPontoTuristico) {
      setZona(zonaInicial);
      return;
    }
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
  }, [local, coordenadasIniciais, route?.params?.zona]);

  useEffect(() => {
    if (local) mapaRef.current?.animateToRegion({ ...local, latitudeDelta: 0.009, longitudeDelta: 0.009 }, 350);
  }, [local]);

  useEffect(() => {
    const controller = new AbortController();
    const temporizador = setTimeout(async () => {
      const norte = regiaoMapa.latitude + regiaoMapa.latitudeDelta / 2;
      const sul = regiaoMapa.latitude - regiaoMapa.latitudeDelta / 2;
      const leste = regiaoMapa.longitude + regiaoMapa.longitudeDelta / 2;
      const oeste = regiaoMapa.longitude - regiaoMapa.longitudeDelta / 2;
      try {
        const dados = await api(
          `/avaliacoes-mapa?norte=${norte}&sul=${sul}&leste=${leste}&oeste=${oeste}`,
          { signal: controller.signal },
        ) as CelulaMapa[];
        setCelulasMapa(Array.isArray(dados) ? dados : []);
      } catch {
        if (!controller.signal.aborted) setCelulasMapa([]);
      }
    }, 350);
    return () => {
      clearTimeout(temporizador);
      controller.abort();
    };
  }, [regiaoMapa]);

  useEffect(() => {
    if (!buscaAtiva || zona.trim().length < 3) {
      setResultadosBusca([]);
      setBuscandoLocais(false);
      return;
    }
    let cancelado = false;
    const controller = new AbortController();
    const temporizador = setTimeout(async () => {
      setBuscandoLocais(true);
      try {
        const locais = await api(
          `/locais/buscar?q=${encodeURIComponent(zona.trim())}`,
          { signal: controller.signal },
        ) as LocalEncontrado[];
        if (!cancelado) setResultadosBusca(Array.isArray(locais) ? locais : []);
      } catch {
        if (!cancelado) setResultadosBusca([]);
      } finally {
        if (!cancelado) setBuscandoLocais(false);
      }
    }, 850);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
      controller.abort();
    };
  }, [buscaAtiva, zona]);

  const salvar = async () => {
    if (!local) {
      Alert.alert("Escolha um local", "Use sua localização atual ou toque no mapa para escolher onde ocorreu o problema.");
      return;
    }
    if (!categoriasSelecionadas.length) {
      Alert.alert("Escolha uma tag", "Selecione uma tag verde, amarela ou vermelha antes de publicar.");
      return;
    }
    if (comentarioPreconceituoso) {
      setErro("Troque ou remova a expressão preconceituosa antes de publicar.");
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

  const enviarDenuncia = async () => {
    if (!denunciaAlvo || !motivoDenuncia || denunciaAlvo.idUsuario === usuarioId) return;
    setEnviandoDenuncia(true);
    try {
      const resultado = await api(`/comentarios/${denunciaAlvo.id}/denunciar`, {
        method: "POST",
        autenticado: true,
        body: { motivo: motivoDenuncia },
      }) as { mensagem: string };
      setDenunciaAlvo(null);
      setMotivoDenuncia(null);
      if (local) await carregarResumo(local);
      Alert.alert("Denúncia enviada", resultado.mensagem);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) {
        setDenunciaAlvo(null);
        Alert.alert("Entre na sua conta", "Faça login para denunciar um comentário.", [
          { text: "Agora não", style: "cancel" },
          { text: "Entrar", onPress: () => navigation.navigate("Login") },
        ]);
      } else {
        Alert.alert("Não foi possível denunciar", e.message || "Tente novamente em instantes.");
      }
    } finally {
      setEnviandoDenuncia(false);
    }
  };

  const iniciarEdicao = (item: Avaliacao) => {
    const opcoes = TAGS.verde.concat(TAGS.amarelo, TAGS.vermelho);
    setEdicaoAlvo(item);
    setComentarioEdicao(item.comentario ?? "");
    setTagsEdicao(opcoes.filter((opcao) => item.tags.some((tag) => tag.nome.toLocaleLowerCase("pt-BR") === opcao.titulo.toLocaleLowerCase("pt-BR"))).map((opcao) => opcao.id));
  };

  const salvarEdicao = async () => {
    if (!edicaoAlvo || !tagsEdicao.length || comentarioEdicao && temLinguagemPreconceituosa(comentarioEdicao)) return;
    setSalvandoEdicao(true);
    try {
      await api(`/avaliacoes-regiao/${edicaoAlvo.id}`, {
        method: "PUT",
        autenticado: true,
        body: { tags: tagsEdicao, comentario: comentarioEdicao.trim() || null },
      });
      setEdicaoAlvo(null);
      if (local) await carregarResumo(local);
      Alert.alert("Avaliação atualizada", "Suas tags e seu comentário foram atualizados.");
    } catch (e: any) {
      Alert.alert("Não foi possível editar", e.message || "Tente novamente em instantes.");
    } finally { setSalvandoEdicao(false); }
  };

  const selecionarLocalBusca = (item: LocalEncontrado) => {
    const ponto = { latitude: item.latitude, longitude: item.longitude };
    setBuscaAtiva(false);
    setResultadosBusca([]);
    setZona(item.nome);
    setLocal(ponto);
    setRegiaoMapa({ ...ponto, latitudeDelta: 0.009, longitudeDelta: 0.009 });
    Keyboard.dismiss();
  };

  const selecionarPontoMapa = (ponto: Coordenadas) => {
    setBuscaAtiva(false);
    setResultadosBusca([]);
    Keyboard.dismiss();
    setLocal(ponto);
  };

  const renderMapa = (expandido = false) => (
    <View style={expandido ? styles.mapFullscreen : styles.mapFrame}>
      <MapView
        key={expandido ? "mapa-expandido" : "mapa-mini"}
        ref={expandido ? mapaExpandidoRef : mapaRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={expandido ? regiaoMapa : local
          ? { ...local, latitudeDelta: 0.009, longitudeDelta: 0.009 }
          : CENTRO_INICIAL}
        onRegionChangeComplete={setRegiaoMapa}
        onPress={(event) => selecionarPontoMapa(event.nativeEvent.coordinate)}
        showsUserLocation
        style={styles.map}
      >
        {celulasMapa.map((celula) => {
          const tamanho = 0.004;
          const sul = celula.celulaLat * tamanho;
          const oeste = celula.celulaLng * tamanho;
          const norte = sul + tamanho;
          const leste = oeste + tamanho;
          return (
            <Polygon
              key={`celula-${celula.celulaLat}:${celula.celulaLng}`}
              coordinates={[
                { latitude: sul, longitude: oeste },
                { latitude: sul, longitude: leste },
                { latitude: norte, longitude: leste },
                { latitude: norte, longitude: oeste },
              ]}
              fillColor={`${CORES[celula.status]}33`}
              strokeColor={`${CORES[celula.status]}aa`}
              strokeWidth={1}
            />
          );
        })}
        {local ? <>
          <Polygon coordinates={limitesZona} fillColor="rgba(214,158,0,0.08)" strokeColor="rgba(214,158,0,0.9)" strokeWidth={2} />
          <Marker coordinate={local} pinColor={CORES[resumo?.status ?? "sem_dados"]} title="Local selecionado" />
        </> : null}
      </MapView>
      <View style={[styles.mapLegend, { top: expandido ? insets.top + 12 : 10 }]}>
        <Text style={styles.mapLegendText}>🟢 Bem avaliada   🟡 Alerta   🔴 Risco</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expandido ? "Fechar mapa ampliado" : "Ampliar mapa"}
        onPress={() => setMapaExpandido(!expandido)}
        style={[styles.mapExpandButton, expandido && { bottom: Math.max(insets.bottom, 12) + 12 }]}
      >
        <Text style={styles.mapExpandButtonText}>{expandido ? "Voltar ao mapa" : "Ampliar mapa"}</Text>
      </Pressable>
    </View>
  );

  const apagarAvaliacao = (item: Avaliacao) => {
    Alert.alert("Apagar sua avaliação?", "Ela será removida da região e não poderá ser recuperada.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: () => void (async () => {
        try {
          await api(`/avaliacoes-regiao/${item.id}`, { method: "DELETE", autenticado: true });
          if (local) await carregarResumo(local);
        } catch (e: any) { Alert.alert("Não foi possível apagar", e.message || "Tente novamente."); }
      })() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" onPress={() => navigation.goBack()} style={styles.back}>
          <Image source={require("../../assets/images/Return.png")} style={styles.backIcon} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Comentários da região</Text>
          <Text style={styles.subtitle}>Veja avaliações e relate algo neste setor do mapa.</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardArea}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapHeading}>
          <Text style={styles.sectionTitle}>Onde fica?</Text>
          <Pressable onPress={() => void localizar()} style={styles.locationButton}>
            <Text style={styles.locationButtonText}>Usar minha localização</Text>
          </Pressable>
        </View>
        <Text style={styles.helper}>O mapa começa na sua posição. Toque em outro ponto para mudar. Cada zona cobre cerca de 400 metros.</Text>
        <Text style={styles.zoneLabel}>Nome ou endereço da área avaliada</Text>
        <TextInput
          autoCorrect={false}
          autoCapitalize="words"
          maxLength={200}
          onChangeText={(valor) => {
            setZona(valor);
            setBuscaAtiva(true);
          }}
          onFocus={() => setBuscaAtiva(true)}
          returnKeyType="search"
          placeholder="Pesquise um endereço ou local..."
          placeholderTextColor="#77808c"
          style={styles.zoneInput}
          value={zona}
        />
        {buscandoLocais ? <ActivityIndicator color="#8b0000" style={styles.searchLoading} /> : null}
        {resultadosBusca.length ? (
          <View style={styles.searchResults}>
            {resultadosBusca.map((item) => (
              <Pressable key={item.id} onPress={() => selecionarLocalBusca(item)} style={styles.searchResult}>
                <Text style={styles.searchResultText}>{item.nome}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {renderMapa()}
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
        <Text style={styles.helper}>Escolha quantas tags quiser, inclusive de cores diferentes. A cor define como cada uma afeta esta zona.</Text>
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
          onFocus={() => {
            setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, comentarioY.current - 24), animated: true }), 250);
          }}
          onLayout={(event) => { comentarioY.current = event.nativeEvent.layout.y; }}
          placeholder="Conte o que aconteceu (opcional)"
          placeholderTextColor="#77808c"
          style={styles.input}
          textAlignVertical="top"
          value={comentario}
        />
        {comentarioPreconceituoso ? <Text style={styles.erroConteudo}>Este texto contém uma expressão preconceituosa. Troque ou remova a palavra para publicar.</Text> : null}
        <Pressable disabled={salvando || comentarioPreconceituoso} onPress={() => void salvar()} style={[styles.submit, (salvando || comentarioPreconceituoso) && styles.disabled]}>
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
            {usuarioId === item.idUsuario ? (
              <View style={styles.ownerActions}>
                <Pressable accessibilityRole="button" onPress={() => iniciarEdicao(item)} style={styles.ownerButton}><Text style={styles.ownerButtonText}>Editar minha avaliação</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => apagarAvaliacao(item)} style={[styles.ownerButton, styles.deleteButton]}><Text style={[styles.ownerButtonText, styles.deleteButtonText]}>Apagar</Text></Pressable>
              </View>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => { setDenunciaAlvo(item); setMotivoDenuncia(null); }} style={styles.reportButton}>
                <Text style={styles.reportButtonText}>Denunciar comentário</Text>
              </Pressable>
            )}
          </View>
        )) : <Text style={styles.empty}>Ainda não há relatos recentes. Você pode ser a primeira pessoa a avaliar este local.</Text>}
      </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={mapaExpandido}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onShow={() => mapaExpandidoRef.current?.animateToRegion(regiaoMapa, 200)}
        onRequestClose={() => setMapaExpandido(false)}
      >
        {renderMapa(true)}
      </Modal>
      <Modal visible={Boolean(denunciaAlvo)} transparent animationType="fade" onRequestClose={() => setDenunciaAlvo(null)}>
        <View style={[styles.modalBackdrop, { paddingTop: Math.max(insets.top, 22), paddingBottom: Math.max(insets.bottom, 22) }]}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Denunciar comentário</Text>
            <Text style={styles.modalDescription}>Escolha o motivo. Uma denúncia por pessoa é permitida para cada comentário.</Text>
            {MOTIVOS_DENUNCIA.map((motivo) => (
              <Pressable key={motivo} onPress={() => setMotivoDenuncia(motivo)} style={[styles.motivoItem, motivoDenuncia === motivo && styles.motivoSelecionado]}>
                <Text style={[styles.motivoTexto, motivoDenuncia === motivo && styles.motivoTextoSelecionado]}>{motivo}</Text>
              </Pressable>
            ))}
            <View style={styles.modalActions}>
              <Pressable disabled={enviandoDenuncia} onPress={() => setDenunciaAlvo(null)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable disabled={!motivoDenuncia || enviandoDenuncia} onPress={() => void enviarDenuncia()} style={[styles.modalSubmit, (!motivoDenuncia || enviandoDenuncia) && styles.disabled]}>
                {enviandoDenuncia ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Enviar denúncia</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={Boolean(edicaoAlvo)} transparent animationType="slide" onRequestClose={() => setEdicaoAlvo(null)}>
        <View style={[styles.modalBackdrop, { paddingTop: Math.max(insets.top, 22), paddingBottom: Math.max(insets.bottom, 22) }]}>
          <View style={styles.editModalCard}>
            <Text style={styles.modalTitle}>Editar sua avaliação</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.zoneLabel}>Comentário</Text>
              <TextInput maxLength={1000} multiline onChangeText={setComentarioEdicao} placeholder="Comentário (opcional)" placeholderTextColor="#77808c" style={styles.input} textAlignVertical="top" value={comentarioEdicao} />
              {temLinguagemPreconceituosa(comentarioEdicao) ? <Text style={styles.erroConteudo}>Troque ou remova a expressão preconceituosa para salvar.</Text> : null}
              <Text style={styles.zoneLabel}>Tags (selecione várias, inclusive de cores diferentes)</Text>
              {(["verde", "amarelo", "vermelho"] as const).map((cor) => (
                <View key={cor}>
                  <Text style={[styles.editColorLabel, { color: CORES[cor] }]}>{cor === "verde" ? "Verde · bom" : cor === "amarelo" ? "Amarelo · alerta" : "Vermelho · risco"}</Text>
                  <View style={styles.chips}>
                    {TAGS[cor].map((tag) => {
                      const selecionada = tagsEdicao.includes(tag.id);
                      return <Pressable key={tag.id} onPress={() => setTagsEdicao((atuais) => selecionada ? atuais.filter((id) => id !== tag.id) : [...atuais, tag.id])} style={[styles.chip, selecionada && { backgroundColor: CORES[cor], borderColor: CORES[cor] }]}><Text style={[styles.chipText, selecionada && styles.chipTextSelected]}>{tag.titulo}</Text></Pressable>;
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable disabled={salvandoEdicao} onPress={() => setEdicaoAlvo(null)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancelar</Text></Pressable>
              <Pressable disabled={!tagsEdicao.length || salvandoEdicao || temLinguagemPreconceituosa(comentarioEdicao)} onPress={() => void salvarEdicao()} style={[styles.modalSubmit, (!tagsEdicao.length || salvandoEdicao || temLinguagemPreconceituosa(comentarioEdicao)) && styles.disabled]}>{salvandoEdicao ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Salvar alterações</Text>}</Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#f6f7f9", flex: 1 },
  keyboardArea: { flex: 1 },
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
  searchLoading: { alignSelf: "flex-start", marginBottom: 8 },
  searchResults: { backgroundColor: "#fff", borderColor: "#dfe3e8", borderRadius: 10, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  searchResult: { borderBottomColor: "#e9ebef", borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 42, justifyContent: "center", paddingHorizontal: 12, paddingVertical: 8 },
  searchResultText: { color: "#252a30", fontSize: 13 },
  mapFrame: { borderRadius: 18, height: 250, overflow: "hidden" },
  mapFullscreen: { backgroundColor: "#e5e5e5", flex: 1, overflow: "hidden" },
  map: { flex: 1 },
  mapExpandButton: { position: "absolute", bottom: 10, right: 10, backgroundColor: "#fff", borderColor: "#dfe3e8", borderWidth: 1, borderRadius: 18, elevation: 5, paddingHorizontal: 13, paddingVertical: 9 },
  mapExpandButtonText: { color: "#8b0000", fontSize: 12, fontWeight: "800" },
  mapLegend: { position: "absolute", left: 10, backgroundColor: "rgba(255,255,255,0.94)", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  mapLegendText: { color: "#252a30", fontSize: 12, fontWeight: "700" },
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
  erroConteudo: { color: "#b42318", fontSize: 13, fontWeight: "700", lineHeight: 19, marginTop: 7 },
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
  reportButton: { alignSelf: "flex-start", borderColor: "#b42318", borderRadius: 16, borderWidth: 1, marginTop: 10, paddingHorizontal: 12, paddingVertical: 7 },
  reportButtonText: { color: "#b42318", fontSize: 12, fontWeight: "700" },
  ownerActions: { alignItems: "center", flexDirection: "row", gap: 9, marginTop: 10 },
  ownerButton: { borderColor: "#8b0000", borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  ownerButtonText: { color: "#8b0000", fontSize: 12, fontWeight: "700" },
  deleteButton: { borderColor: "#b42318" },
  deleteButtonText: { color: "#b42318" },
  editModalCard: { backgroundColor: "#fff", borderRadius: 18, height: "85%", maxWidth: 480, padding: 18, width: "100%" },
  editColorLabel: { fontSize: 12, fontWeight: "800", marginTop: 8 },
  modalBackdrop: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.45)", flex: 1, justifyContent: "center", padding: 22 },
  modalCard: { backgroundColor: "#fff", borderRadius: 18, maxWidth: 460, padding: 20, width: "100%" },
  modalTitle: { color: "#20252b", fontSize: 18, fontWeight: "800" },
  modalDescription: { color: "#68717c", fontSize: 13, lineHeight: 19, marginBottom: 10, marginTop: 6 },
  motivoItem: { borderColor: "#dfe3e8", borderRadius: 10, borderWidth: 1, marginTop: 8, padding: 12 },
  motivoSelecionado: { backgroundColor: "#fff1f2", borderColor: "#b42318" },
  motivoTexto: { color: "#40464e", fontSize: 14 },
  motivoTextoSelecionado: { color: "#8b0000", fontWeight: "800" },
  modalActions: { flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 16 },
  modalCancel: { alignItems: "center", borderColor: "#dfe3e8", borderRadius: 10, borderWidth: 1, justifyContent: "center", minHeight: 42, paddingHorizontal: 14 },
  modalCancelText: { color: "#40464e", fontSize: 13, fontWeight: "700" },
  modalSubmit: { alignItems: "center", backgroundColor: "#8b0000", borderRadius: 10, justifyContent: "center", minHeight: 42, paddingHorizontal: 14 },
  modalSubmitText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  empty: { color: "#707984", fontSize: 13, lineHeight: 19, paddingVertical: 10 },
});
