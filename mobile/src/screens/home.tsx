import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import MapView, { Circle, Marker, type Region } from "react-native-maps";
import { api } from "../services/api";

type Ponto = { latitude: number; longitude: number };
type Status = "verde" | "amarelo" | "vermelho" | "sem_dados";
type ResumoMapa = Ponto & { celulaLat: number; celulaLng: number; status: Status; total: number; verdes: number; amarelos: number; vermelhos: number };

const REGIAO_INICIAL: Region = {
  latitude: -23.96,
  longitude: -46.33,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
};
const CORES: Record<Status, string> = { verde: "#2f9e44", amarelo: "#d69e00", vermelho: "#d94848", sem_dados: "#64748b" };

export default function Home({ navigation }: any) {
  const mapaRef = useRef<MapView>(null);
  const [regiao, setRegiao] = useState<Region>(REGIAO_INICIAL);
  const [selecionado, setSelecionado] = useState<Ponto | null>(null);
  const [resumos, setResumos] = useState<ResumoMapa[]>([]);
  const [localizando, setLocalizando] = useState(true);
  const [erroMapa, setErroMapa] = useState("");

  const centralizarNaLocalizacao = useCallback(async (mostrarErro = false) => {
    setLocalizando(true);
    try {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (permissao.status !== "granted") {
        if (mostrarErro) Alert.alert("Localização indisponível", "Permita o acesso à localização ou toque no mapa para escolher um local.");
        return;
      }
      const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const ponto = { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude };
      setSelecionado(ponto);
      const novaRegiao = { ...ponto, latitudeDelta: 0.025, longitudeDelta: 0.025 };
      setRegiao(novaRegiao);
      mapaRef.current?.animateToRegion(novaRegiao, 450);
    } catch {
      if (mostrarErro) Alert.alert("Não foi possível localizar", "Toque no mapa para escolher o local manualmente.");
    } finally {
      setLocalizando(false);
    }
  }, []);

  useEffect(() => { void centralizarNaLocalizacao(); }, [centralizarNaLocalizacao]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const norte = regiao.latitude + regiao.latitudeDelta / 2;
      const sul = regiao.latitude - regiao.latitudeDelta / 2;
      const leste = regiao.longitude + regiao.longitudeDelta / 2;
      const oeste = regiao.longitude - regiao.longitudeDelta / 2;
      try {
        const dados = await api(`/avaliacoes-mapa?norte=${norte}&sul=${sul}&leste=${leste}&oeste=${oeste}`) as ResumoMapa[];
        setResumos(Array.isArray(dados) ? dados : []);
        setErroMapa("");
      } catch {
        setErroMapa("Não foi possível atualizar as avaliações do mapa.");
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [regiao]);

  const abrirAvaliacao = (ponto = selecionado) => {
    if (!ponto) {
      void centralizarNaLocalizacao(true);
      return;
    }
    navigation.navigate("AvaliacoesRegiao", ponto);
  };

  const resumoSelecionado = selecionado
    ? resumos.find((item) => item.celulaLat === Math.floor(selecionado.latitude / 0.002)
      && item.celulaLng === Math.floor(selecionado.longitude / 0.002))
    : undefined;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapaRef}
        initialRegion={REGIAO_INICIAL}
        onPress={(event) => setSelecionado(event.nativeEvent.coordinate)}
        onRegionChangeComplete={setRegiao}
        showsUserLocation
        style={styles.map}
      >
        {resumos.flatMap((item) => [
          <Circle key={`area-${item.latitude}:${item.longitude}`} center={item} radius={140} fillColor={`${CORES[item.status]}22`} strokeColor={`${CORES[item.status]}88`} strokeWidth={1} />,
          <Marker
            key={`pino-${item.latitude}:${item.longitude}`}
            coordinate={item}
            onPress={() => setSelecionado(item)}
            pinColor={CORES[item.status]}
            title={item.status === "verde" ? "Bem avaliada" : item.status === "amarelo" ? "Em alerta" : "Muitos relatos de risco"}
            description={`${item.total} avaliações recentes`}
          />,
        ])}
        {selecionado ? <Marker coordinate={selecionado} pinColor="#8b0000" title="Local selecionado" /> : null}
      </MapView>

      <View style={styles.top}>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Pesquisa", { modo: "avaliar" })} style={styles.search}>
          <Image source={require("../../assets/images/Search.png")} style={styles.searchIcon} />
          <Text style={styles.searchText}>Pesquisar endereço ou bairro</Text>
        </Pressable>
        <View style={styles.topActions}>
          <Pressable accessibilityLabel="Minha conta" onPress={() => navigation.navigate("Conta")} style={styles.roundButton}>
            <Image source={require("../../assets/images/Account.png")} style={styles.topIcon} />
          </Pressable>
          <Pressable accessibilityLabel="Configurações" onPress={() => navigation.navigate("Configuracoes")} style={styles.roundButton}>
            <Image source={require("../../assets/images/Config.png")} style={styles.topIcon} />
          </Pressable>
        </View>
      </View>

      <Pressable accessibilityLabel="Centralizar na minha localização" onPress={() => void centralizarNaLocalizacao(true)} style={styles.locateButton}>
        {localizando ? <ActivityIndicator color="#8b0000" size="small" /> : <Text style={styles.locateGlyph}>◎</Text>}
      </Pressable>

      <View style={styles.bottomPanel}>
        <Text style={styles.panelTitle}>Como está esta região?</Text>
        <Text style={styles.panelText}>
          {selecionado
            ? resumoSelecionado
              ? `${resumoSelecionado.total} avaliações • ${resumoSelecionado.status === "verde" ? "bem avaliada" : resumoSelecionado.status === "amarelo" ? "em alerta" : "com relatos de risco"}`
              : "Toque no mapa para escolher outro local ou avalie este ponto."
            : "Toque no mapa para escolher um local e ver as avaliações."}
        </Text>
        {erroMapa ? <Text style={styles.mapError}>{erroMapa}</Text> : null}
        <Pressable onPress={() => abrirAvaliacao()} style={styles.evaluateButton}>
          <Text style={styles.evaluateText}>Avaliar este local</Text>
        </Pressable>
        <View style={styles.navigation}>
          <Pressable onPress={() => abrirAvaliacao()} style={styles.navItem}><Text style={styles.navIcon}>●</Text><Text style={styles.navLabel}>Avaliações</Text></Pressable>
          <Pressable onPress={() => navigation.navigate("Rotas")} style={styles.navItem}><Text style={styles.navIcon}>↗</Text><Text style={styles.navLabel}>Rotas</Text></Pressable>
          <Pressable onPress={() => navigation.navigate("Turismo")} style={styles.navItem}><Text style={styles.navIcon}>⌖</Text><Text style={styles.navLabel}>Turismo</Text></Pressable>
          <Pressable onPress={() => navigation.navigate("Comentarios")} style={styles.navItem}><Text style={styles.navIcon}>☰</Text><Text style={styles.navLabel}>Comentários</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#e7e9ec", flex: 1 },
  map: { flex: 1 },
  top: { flexDirection: "row", gap: 10, left: 16, position: "absolute", right: 16, top: 54 },
  search: { alignItems: "center", backgroundColor: "#fff", borderRadius: 26, elevation: 8, flex: 1, flexDirection: "row", minHeight: 52, paddingHorizontal: 14 },
  searchIcon: { height: 20, resizeMode: "contain", width: 20 },
  searchText: { color: "#68717c", flex: 1, fontSize: 14, paddingLeft: 9 },
  topActions: { gap: 8 },
  roundButton: { alignItems: "center", backgroundColor: "#fff", borderRadius: 21, elevation: 7, height: 42, justifyContent: "center", width: 42 },
  topIcon: { height: 21, resizeMode: "contain", width: 21 },
  locateButton: { alignItems: "center", backgroundColor: "#fff", borderRadius: 24, bottom: 300, elevation: 6, height: 48, justifyContent: "center", position: "absolute", right: 18, width: 48 },
  locateGlyph: { color: "#8b0000", fontSize: 27, fontWeight: "700", lineHeight: 30 },
  bottomPanel: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, bottom: 0, elevation: 12, left: 0, paddingBottom: 24, paddingHorizontal: 18, paddingTop: 18, position: "absolute", right: 0 },
  panelTitle: { color: "#22272e", fontSize: 18, fontWeight: "800" },
  panelText: { color: "#68717c", fontSize: 13, marginTop: 4 },
  mapError: { color: "#b42318", fontSize: 11, marginTop: 4 },
  evaluateButton: { alignItems: "center", backgroundColor: "#c83232", borderRadius: 12, justifyContent: "center", marginTop: 12, minHeight: 46 },
  evaluateText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  navigation: { borderTopColor: "#edf0f3", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-around", marginTop: 12, paddingTop: 10 },
  navItem: { alignItems: "center", minWidth: 58 },
  navIcon: { color: "#8b0000", fontSize: 19, fontWeight: "700" },
  navLabel: { color: "#505963", fontSize: 10, marginTop: 2 },
});
