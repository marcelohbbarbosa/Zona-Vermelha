import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const locais = [
  {
    nome: "Praia do Canto do Forte",
    endereco: "Av. Pres. Castelo Branco, 2400 - Canto do Forte, Praia Grande",
    destinoRota: "Av. Pres. Castelo Branco, 2400",
    imagem: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  },
  {
    nome: "Palácio das Artes",
    endereco: "Av. Pres. Costa e Silva, 1600 - Boqueirão, Praia Grande",
    destinoRota: "Av. Pres. Costa e Silva, 1600",
    imagem: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Pal%C3%A1cio_das_Artes_Centro_Cultural_Praia_Grande-SP_2.jpg/1280px-Pal%C3%A1cio_das_Artes_Centro_Cultural_Praia_Grande-SP_2.jpg",
  },
];

const imagens = {
  busca: require("../../assets/images/Search.png"),
  microfone: require("../../assets/images/Mic.png"),
  voltar: require("../../assets/images/Return.png"),
  rota: require("../../assets/images/Route.png"),
};

export default function Turismo({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cabecalho}>
        <Pressable accessibilityLabel="Voltar ao mapa" hitSlop={10} onPress={() => navigation.goBack()} style={styles.voltar}>
          <Image source={imagens.voltar} style={styles.iconeVoltar} />
        </Pressable>
        <View style={styles.busca}>
          <Image source={imagens.busca} style={styles.iconeBusca} />
          <Text style={styles.textoBusca}>Pontos turísticos</Text>
          <Image source={imagens.microfone} style={styles.iconeMicrofone} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Explore Praia Grande</Text>
        <Text style={styles.descricao}>Conheça pontos turísticos e planeje uma rota mais segura.</Text>

        {locais.map((local) => (
          <View key={local.nome} style={styles.card}>
            <Image source={{ uri: local.imagem }} style={styles.imagemLocal} />
            <View style={styles.informacoes}>
              <Text style={styles.nomeLocal}>{local.nome}</Text>
              <Text style={styles.endereco}>{local.endereco}</Text>
              <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Rotas", { destino: local.destinoRota })} style={styles.botaoRota}>
                <Image source={imagens.rota} style={styles.iconeRota} />
                <Text style={styles.textoBotao}>Rotas mais seguras</Text>
              </Pressable>
            </View>
          </View>
        ))}
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
  conteudo: { gap: 16, padding: 24, paddingBottom: 36 },
  titulo: { color: "#1f2937", fontSize: 24, fontWeight: "800", marginBottom: -10 },
  descricao: { color: "#6b7280", fontSize: 15, lineHeight: 21, marginBottom: 4 },
  card: { backgroundColor: "#ffffff", borderRadius: 18, elevation: 5, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 8 },
  imagemLocal: { backgroundColor: "#d1d5db", height: 156, width: "100%" },
  informacoes: { padding: 16 },
  nomeLocal: { color: "#1f2937", fontSize: 17, fontWeight: "800" },
  endereco: { color: "#6b7280", fontSize: 13, lineHeight: 18, marginTop: 5 },
  botaoRota: { alignItems: "center", alignSelf: "flex-start", backgroundColor: "#8b0000", borderRadius: 20, flexDirection: "row", gap: 7, marginTop: 14, paddingHorizontal: 14, paddingVertical: 10 },
  iconeRota: { height: 18, resizeMode: "contain", width: 18 },
  textoBotao: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
});
