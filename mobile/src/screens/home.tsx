import React, { useRef, useState } from "react";
import { Animated, Image, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const MAP_HTML = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" /><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script><style>*{margin:0;padding:0;box-sizing:border-box}html,body,#map{width:100%;height:100%}</style></head><body><div id="map"></div><script>const bounds=L.latLngBounds([-24.8,-47.5],[-23.3,-45.5]);const map=L.map('map',{maxBounds:bounds,maxBoundsViscosity:1,minZoom:9,maxZoom:19}).setView([-24.05,-46.75],10);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(map);<\/script></body></html>`;

type Painel = "fechado" | "meio" | "aberto";
const POSICOES: Record<Painel, number> = { fechado: 438, meio: 345, aberto: 190 };
const imagens = {
  busca: require("../../assets/images/Search.png"),
  microfone: require("../../assets/images/Mic.png"),
  conta: require("../../assets/images/Account.png"),
  configuracoes: require("../../assets/images/Config.png"),
  rota: require("../../assets/images/Route.png"),
  comentarios: require("../../assets/images/Comment.png"),
  turismo: require("../../assets/images/Turism.png"),
};

export default function Home({ navigation }: any) {
  const [painel, setPainel] = useState<Painel>("meio");
  const translateY = useRef(new Animated.Value(POSICOES.meio)).current;
  const ultimoOffset = useRef(POSICOES.meio);
  const animacaoBotoes = useRef(new Animated.Value(0)).current;

  const moverPainel = (novoPainel: Painel) => {
    ultimoOffset.current = POSICOES[novoPainel];
    setPainel(novoPainel);
    Animated.parallel([
      Animated.spring(translateY, { toValue: POSICOES[novoPainel], useNativeDriver: true }),
      Animated.spring(animacaoBotoes, { toValue: novoPainel === "aberto" ? 1 : 0, useNativeDriver: true }),
    ]).start();
  };

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesto) => Math.abs(gesto.dy) > 8,
    onPanResponderMove: (_, gesto) => translateY.setValue(Math.max(POSICOES.aberto, Math.min(POSICOES.fechado, ultimoOffset.current + gesto.dy))),
    onPanResponderRelease: (_, gesto) => {
      const posicaoFinal = Math.max(POSICOES.aberto, Math.min(POSICOES.fechado, ultimoOffset.current + gesto.dy));
      const proximo = (Object.entries(POSICOES) as [Painel, number][]).reduce((melhor, atual) => Math.abs(atual[1] - posicaoFinal) < Math.abs(melhor[1] - posicaoFinal) ? atual : melhor)[0];
      moverPainel(proximo);
    },
  })).current;

  return <View style={styles.container}>
    <WebView style={styles.map} source={{ html: MAP_HTML }} originWhitelist={["*"]} javaScriptEnabled />
    <View style={styles.topo}>
      <Pressable accessibilityLabel="Pesquisar destino" onPress={() => navigation.navigate("Pesquisa")} style={styles.busca}>
        <Image source={imagens.busca} style={styles.iconeBusca} />
        <Text style={styles.textoBusca}>Pesquise aqui</Text>
        <Image source={imagens.microfone} style={styles.iconeMicrofone} />
      </Pressable>
      <View style={styles.acoesTopo}>
        <Pressable accessibilityLabel="Conta" onPress={() => navigation.navigate("Conta")} style={styles.botaoTopo}><Image source={imagens.conta} style={styles.iconeTopo} /></Pressable>
        <Pressable accessibilityLabel="Configurações" onPress={() => navigation.navigate("Configuracoes")} style={styles.botaoTopo}><Image source={imagens.configuracoes} style={styles.iconeTopo} /></Pressable>
      </View>
    </View>
    <Animated.View style={[styles.painel, { transform: [{ translateY }] }]}>
      <View {...panResponder.panHandlers} style={styles.areaArrasto}><View style={styles.indicadorArrasto} /></View>
      <Animated.View style={[styles.grupoBotoes, { opacity: animacaoBotoes.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }), transform: [{ translateY: animacaoBotoes.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
      {painel === "aberto" ? (
        <View style={styles.barraAberta}>
          <Pressable accessibilityLabel="Rotas" onPress={() => navigation.navigate("Rotas")} style={[styles.botaoNavegacao, styles.botaoRotas, styles.botaoRotasAberto, styles.botaoAberto]}><Image source={imagens.rota} style={styles.iconeNavegacao} /></Pressable>
          <Text style={styles.nomeBotao}>Planejar suas Rotas</Text>
          <Pressable accessibilityLabel="Comentários" onPress={() => navigation.navigate("Comentarios")} style={[styles.botaoNavegacao, styles.botaoAberto]}><Image source={imagens.comentarios} style={styles.iconeNavegacao} /></Pressable>
          <Text style={styles.nomeBotao}>Avaliações da Semana</Text>
          <Pressable accessibilityLabel="Turismo" onPress={() => navigation.navigate("Turismo")} style={[styles.botaoNavegacao, styles.botaoAberto]}><Image source={imagens.turismo} style={styles.iconeNavegacao} /></Pressable>
          <Text style={styles.nomeBotao}>Assistente para Turistas</Text>
        </View>
      ) : (
        <View style={styles.barraInferior}>
          <Pressable accessibilityLabel="Comentários" onPress={() => navigation.navigate("Comentarios")} style={styles.botaoNavegacao}><Image source={imagens.comentarios} style={styles.iconeNavegacao} /></Pressable>
          <Pressable accessibilityLabel="Rotas" onPress={() => navigation.navigate("Rotas")} style={[styles.botaoNavegacao, styles.botaoRotas]}><Image source={imagens.rota} style={styles.iconeRota} /></Pressable>
          <Pressable accessibilityLabel="Turismo" onPress={() => navigation.navigate("Turismo")} style={styles.botaoNavegacao}><Image source={imagens.turismo} style={styles.iconeNavegacao} /></Pressable>
        </View>
      )}
      </Animated.View>
      <View style={styles.conteudoPainel} />
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827" }, map: { flex: 1 },
  topo: { left: 16, position: "absolute", right: 16, top: 54 },
  busca: { alignItems: "center", backgroundColor: "#ffffff", borderRadius: 26, elevation: 8, flexDirection: "row", minHeight: 54, paddingHorizontal: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.32, shadowRadius: 10 },
  textoBusca: { color: "#6b7280", flex: 1, fontSize: 16, paddingLeft: 8 },
  acoesTopo: { alignItems: "flex-end", gap: 10, marginTop: 12 },
  iconeBusca: { height: 20, resizeMode: "contain", width: 20 }, iconeMicrofone: { height: 22, resizeMode: "contain", width: 17 }, iconeTopo: { height: 23, resizeMode: "contain", width: 23 },
  botaoTopo: { alignItems: "center", backgroundColor: "#ffffff", borderRadius: 21, elevation: 7, height: 42, justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, width: 42 },
  painel: { backgroundColor: "#f8f8ff", borderTopLeftRadius: 28, borderTopRightRadius: 28, bottom: 0, elevation: 11, height: 470, left: 0, position: "absolute", right: 0, shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.3, shadowRadius: 11 },
  areaArrasto: { alignItems: "center", paddingBottom: 11, paddingTop: 12 }, indicadorArrasto: { backgroundColor: "#9ca3af", borderRadius: 4, height: 5, width: 58 },
  barraInferior: { alignItems: "center", flexDirection: "row", gap: 34, justifyContent: "center", paddingBottom: 14, paddingHorizontal: 22 },
  botaoNavegacao: { alignItems: "center", backgroundColor: "#d1d5db", borderRadius: 33, elevation: 7, height: 66, justifyContent: "center", shadowColor: "#374151", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.32, shadowRadius: 8, width: 66 },
  botaoRotas: { backgroundColor: "#8b0000", borderRadius: 39, elevation: 9, height: 78, shadowColor: "#450000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.36, shadowRadius: 9, width: 78 },
  botaoRotasAberto: { borderRadius: 33, height: 66, width: 66 },
  grupoBotoes: { flex: 1 },
  barraAberta: { alignItems: "center", flexDirection: "column", paddingHorizontal: 30, paddingTop: 10 },
  botaoAberto: { alignSelf: "flex-start", marginBottom: -66, zIndex: 1 },
  nomeBotao: { alignSelf: "stretch", color: "#1f2937", fontSize: 17, fontWeight: "700", minHeight: 78, paddingLeft: 90, paddingTop: 22 },
  iconeNavegacao: { height: 34, resizeMode: "contain", width: 34 },
  iconeRota: { height: 41, resizeMode: "contain", width: 41 },
  conteudoPainel: { flex: 1 },
});
