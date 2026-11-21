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

  return (
    <View style={styles.container}>
      <MapView
        ref={mapaRef}
        initialRegion={REGIAO_INICIAL}
        onPress={(event) => setSelecionado(event.nativeEvent.coordinate)}
        onLongPress={(event) => abrirAvaliacao(event.nativeEvent.coordinate)}
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
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Pesquisa")} style={styles.search}>
          <Image source={require("../../assets/images/Search.png")} style={styles.searchIcon} />
          <Text style={styles.searchText}>Pesquise aqui</Text>
          <Image source={require("../../assets/images/Mic.png")} style={styles.micIcon} />
        </Pressable>
      </View>
      <View style={styles.topActions}>
        <Pressable accessibilityLabel="Minha conta" onPress={() => navigation.navigate("Conta")} style={styles.roundButton}>
          <Image source={require("../../assets/images/Account.png")} style={styles.topIcon} />
        </Pressable>
        <Pressable accessibilityLabel="Configurações" onPress={() => navigation.navigate("Configuracoes")} style={styles.roundButton}>
          <Image source={require("../../assets/images/Config.png")} style={styles.topIcon} />
        </Pressable>
      </View>

      <Pressable accessibilityLabel="Centralizar na minha localização" onPress={() => void centralizarNaLocalizacao(true)} style={styles.locateButton}>
        {localizando ? <ActivityIndicator color="#8b0000" size="small" /> : <Text style={styles.locateGlyph}>◎</Text>}
      </Pressable>

      {erroMapa ? <Text style={styles.mapError}>{erroMapa}</Text> : null}
      <View style={styles.bottomPanel}>
        <Pressable accessibilityLabel="Comentários" onPress={() => navigation.navigate("Comentarios")} style={styles.navButton}>
          <Image source={require("../../assets/images/Comment.png")} style={styles.navIcon} />
        </Pressable>
        <Pressable accessibilityLabel="Rotas" onPress={() => navigation.navigate("Rotas")} style={[styles.navButton, styles.routeButton]}>
          <Image source={require("../../assets/images/Route.png")} style={styles.routeIcon} />
        </Pressable>
        <Pressable accessibilityLabel="Turismo" onPress={() => navigation.navigate("Turismo")} style={styles.navButton}>
          <Image source={require("../../assets/images/Turism.png")} style={styles.navIcon} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#e7e9ec", flex: 1 },
  map: { flex: 1 },
  top: { left: 16, position: "absolute", right: 16, top: 32 },
  search: { alignItems: "center", backgroundColor: "#fff", borderRadius: 26, elevation: 8, flexDirection: "row", minHeight: 40, paddingHorizontal: 12 },
  searchIcon: { height: 20, resizeMode: "contain", width: 20 },
  searchText: { color: "#111827", flex: 1, fontSize: 15, paddingLeft: 8 },
  micIcon: { height: 21, resizeMode: "contain", width: 18 },
  topActions: { alignItems: "flex-end", gap: 7, position: "absolute", right: 18, top: 74 },
  roundButton: { alignItems: "center", backgroundColor: "#fff", borderRadius: 20, elevation: 7, height: 40, justifyContent: "center", width: 40 },
  topIcon: { height: 22, resizeMode: "contain", width: 22 },
  locateButton: { alignItems: "center", backgroundColor: "#fff", borderRadius: 17, bottom: 122, elevation: 6, height: 34, justifyContent: "center", position: "absolute", right: 14, width: 34 },
  locateGlyph: { color: "#8b0000", fontSize: 27, fontWeight: "700", lineHeight: 30 },
  mapError: { alignSelf: "center", backgroundColor: "#fff", borderRadius: 8, bottom: 145, color: "#b42318", fontSize: 11, padding: 7, position: "absolute" },
  bottomPanel: { alignItems: "center", backgroundColor: "#f8f8ff", bottom: 0, elevation: 12, flexDirection: "row", height: 118, justifyContent: "center", gap: 22, left: 0, paddingBottom: 4, position: "absolute", right: 0 },
  navButton: { alignItems: "center", backgroundColor: "#d1d5db", borderRadius: 33, elevation: 5, height: 66, justifyContent: "center", width: 66 },
  routeButton: { backgroundColor: "#bd2026", borderRadius: 39, height: 78, width: 78 },
  navIcon: { height: 34, resizeMode: "contain", width: 34 },
  routeIcon: { height: 44, resizeMode: "contain", width: 44 },
});
