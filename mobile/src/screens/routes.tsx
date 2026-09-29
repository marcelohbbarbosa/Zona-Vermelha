import { useEffect, useState } from "react";
import { Alert, Image, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";

const sugestoes = ["Rua Almeida, 523", "Rua Anchieta, 212", "Rua Anchieta, 215", "Rua Augusta", "Rua Afonso Bovero", "Rua Argentina"];

const imagens = {
  busca: require("../../assets/images/Search.png"),
  microfone: require("../../assets/images/Mic.png"),
  voltar: require("../../assets/images/Return.png"),
  recente: require("../../assets/images/Recent.png"),
};

export default function Rotas({ navigation, route }: any) {
  const destinoTuristico = route?.params?.destino;
  const [origem, setOrigem] = useState("Localização atual");
  const [origemCoordenadas, setOrigemCoordenadas] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destino, setDestino] = useState(destinoTuristico ?? "");
  const [destinoCoordenadas, setDestinoCoordenadas] = useState<{ latitude: number; longitude: number } | null>(
    route?.params?.latitude != null && route?.params?.longitude != null
      ? { latitude: Number(route.params.latitude), longitude: Number(route.params.longitude) }
      : null,
  );
  const [rotaCriada, setRotaCriada] = useState(false);
  const [localizando, setLocalizando] = useState(false);
  const [abrindoRota, setAbrindoRota] = useState(false);
  const podeCriar = Boolean(origem.trim() && destino.trim()) && !abrindoRota;

  useEffect(() => {
    if (destinoTuristico) {
      setDestino(destinoTuristico);
      setDestinoCoordenadas(
        route?.params?.latitude != null && route?.params?.longitude != null
          ? { latitude: Number(route.params.latitude), longitude: Number(route.params.longitude) }
          : null,
      );
      setRotaCriada(false);
    }
  }, [destinoTuristico, route?.params?.latitude, route?.params?.longitude]);

  const usarLocalizacao = async (): Promise<{ latitude: number; longitude: number } | null> => {
    setLocalizando(true);
    try {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (permissao.status !== "granted") {
        Alert.alert("Localização necessária", "Permita o acesso à localização para usar sua posição como origem da rota.");
        return null;
      }
      const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordenadas = { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude };
      setOrigemCoordenadas(coordenadas);
      setOrigem("Minha localização atual");
      setRotaCriada(false);
      return coordenadas;
    } catch {
      Alert.alert("Não foi possível obter a localização", "Confira se o GPS está ativo e tente novamente.");
      return null;
    } finally {
      setLocalizando(false);
    }
  };

  const criarRota = async () => {
    if (!origem.trim() || !destino.trim()) return;
    setAbrindoRota(true);
    try {
      let origemAtual = origemCoordenadas;
      if (!origemAtual && origem.toLowerCase().includes("localização atual")) {
        origemAtual = await usarLocalizacao();
        if (!origemAtual) return;
      }
      const origemUrl = origemAtual
        ? `${origemAtual.latitude},${origemAtual.longitude}`
        : origem;
      const destinoUrl = destinoCoordenadas
        ? `${destinoCoordenadas.latitude},${destinoCoordenadas.longitude}`
        : destino;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origemUrl)}&destination=${encodeURIComponent(destinoUrl)}&travelmode=walking`;
      await Linking.openURL(url);
      setRotaCriada(true);
    } catch {
      Alert.alert("Erro ao abrir a rota", "Não foi possível abrir o serviço de mapas.");
    } finally {
      setAbrindoRota(false);
    }
  };

  const selecionarDestino = (local: string) => {
    setDestino(local);
    setDestinoCoordenadas(null);
    setRotaCriada(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cabecalho}>
        <Pressable accessibilityLabel="Voltar ao mapa" hitSlop={10} onPress={() => navigation.goBack()} style={styles.voltar}>
          <Image source={imagens.voltar} style={styles.iconeVoltar} />
        </Pressable>
        <View style={styles.busca}>
          <Image source={imagens.busca} style={styles.iconeBusca} />
          <Text style={styles.textoBusca}>Planeje sua rota</Text>
          <Image source={imagens.microfone} style={styles.iconeMicrofone} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Criar rota</Text>
        <Text style={styles.descricao}>Informe a origem e o destino para traçar seu caminho.</Text>

        <View style={styles.formulario}>
          <TextInput onBlur={() => { if (!origem.trim()) setOrigem("Localização atual"); }} onChangeText={(valor) => { setOrigem(valor); setOrigemCoordenadas(null); setRotaCriada(false); }} onFocus={() => { if (origem === "Localização atual" || origem === "Minha localização atual") setOrigem(""); }} placeholder="De onde você sai?" placeholderTextColor="#6b7280" style={styles.campo} value={origem} />
          <Pressable accessibilityRole="button" disabled={localizando} onPress={usarLocalizacao} style={styles.botaoLocalizacao}>
            <Text style={styles.textoLocalizacao}>{localizando ? "Obtendo localização..." : "Usar minha localização atual"}</Text>
          </Pressable>
          <TextInput onChangeText={(valor) => { setDestino(valor); setDestinoCoordenadas(null); setRotaCriada(false); }} placeholder="Para onde você vai?" placeholderTextColor="#6b7280" style={styles.campo} value={destino} />
          <Pressable accessibilityRole="button" disabled={!podeCriar} onPress={criarRota} style={[styles.botaoCriar, !podeCriar && styles.botaoDesativado]}>
            <Text style={styles.textoBotaoCriar}>{abrindoRota ? "Abrindo mapas..." : "Criar rota"}</Text>
          </Pressable>
        </View>

        {rotaCriada ? (
          <View style={styles.confirmacao}>
            <Text style={styles.tituloConfirmacao}>Rota aberta no Google Maps</Text>
            <Text style={styles.textoConfirmacao}>{origem} → {destino}</Text>
          </View>
        ) : null}

        <Text style={styles.tituloLista}>Destinos recentes</Text>
        <View style={styles.lista}>
          {sugestoes.map((local) => (
            <Pressable accessibilityRole="button" key={local} onPress={() => selecionarDestino(local)} style={styles.itemLocal}>
              <View style={styles.iconeLocal}><Image source={imagens.recente} style={styles.iconeItem} /></View>
              <Text numberOfLines={1} style={styles.nomeLocal}>{local}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#f8f8ff", flex: 1 },
  cabecalho: { alignItems: "center", flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 18 },
  voltar: { alignItems: "center", backgroundColor: "#ffffff", borderRadius: 21, elevation: 7, height: 42, justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, width: 42 },
  iconeVoltar: { height: 22, resizeMode: "contain", width: 22 },
  busca: { alignItems: "center", backgroundColor: "#ffffff", borderRadius: 26, elevation: 8, flex: 1, flexDirection: "row", minHeight: 54, paddingHorizontal: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.32, shadowRadius: 10 },
  iconeBusca: { height: 20, resizeMode: "contain", width: 20 },
  textoBusca: { color: "#6b7280", flex: 1, fontSize: 16, paddingLeft: 8 },
  iconeMicrofone: { height: 22, resizeMode: "contain", width: 17 },
  conteudo: { paddingBottom: 32, paddingTop: 26 },
  titulo: { color: "#1f2937", fontSize: 24, fontWeight: "800", paddingHorizontal: 24 },
  descricao: { color: "#6b7280", fontSize: 15, lineHeight: 21, paddingHorizontal: 24, paddingTop: 6 },
  formulario: { gap: 10, paddingHorizontal: 24, paddingTop: 20 },
  campo: { backgroundColor: "#ffffff", borderColor: "#e5e7eb", borderRadius: 14, borderWidth: 1, color: "#1f2937", fontSize: 16, minHeight: 52, paddingHorizontal: 16 },
  botaoCriar: { alignItems: "center", backgroundColor: "#8b0000", borderRadius: 26, elevation: 6, justifyContent: "center", marginTop: 4, minHeight: 52, shadowColor: "#450000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
  botaoDesativado: { opacity: 0.45 },
  botaoLocalizacao: { alignSelf: "flex-start", paddingVertical: 5 },
  textoLocalizacao: { color: "#8b0000", fontSize: 14, fontWeight: "700" },
  textoBotaoCriar: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  confirmacao: { backgroundColor: "#ffffff", borderColor: "#d1d5db", borderRadius: 16, borderWidth: 1, marginHorizontal: 24, marginTop: 18, padding: 16 },
  tituloConfirmacao: { color: "#8b0000", fontSize: 16, fontWeight: "800" },
  textoConfirmacao: { color: "#374151", fontSize: 14, marginTop: 4 },
  avisoFuncao: { color: "#6b7280", fontSize: 13, lineHeight: 18, marginTop: 10 },
  tituloLista: { color: "#1f2937", fontSize: 17, fontWeight: "700", paddingBottom: 10, paddingHorizontal: 24, paddingTop: 28 },
  lista: { backgroundColor: "#ffffff", borderBottomColor: "#e5e7eb", borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: "#e5e7eb", borderTopWidth: StyleSheet.hairlineWidth },
  itemLocal: { alignItems: "center", borderBottomColor: "#e5e7eb", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", minHeight: 52, paddingHorizontal: 20 },
  iconeLocal: { alignItems: "center", backgroundColor: "#d1d5db", borderRadius: 16, height: 32, justifyContent: "center", marginRight: 12, width: 32 },
  iconeItem: { height: 18, resizeMode: "contain", width: 18 },
  nomeLocal: { color: "#1f2937", flex: 1, fontSize: 15 },
});
