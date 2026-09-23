import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const locaisSalvos = [
  "Rua Almeida, 523",
  "Rua Anchieta, 212",
];

const pesquisasRecentes = [
  "Rua Anchieta, 215",
  "Rua Augusta",
  "Rua Afonso Bovero",
  "Rua Argentina",
  "Rua Antônio Cândido da Silva",
  "Rua Amazonas",
  "Rua Amador Bueno da Ribeira",
  "Rua Adilson",
];

const imagens = {
  busca: require("../../assets/images/Search.png"),
  microfone: require("../../assets/images/Mic.png"),
  voltar: require("../../assets/images/Return.png"),
  salvo: require("../../assets/images/Home.png"),
  recente: require("../../assets/images/Recent.png"),
};

export default function Pesquisa({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cabecalho}>
        <Pressable accessibilityLabel="Voltar ao mapa" hitSlop={10} onPress={() => navigation.goBack()} style={styles.voltar}>
          <Image source={imagens.voltar} style={styles.iconeVoltar} />
        </Pressable>
        <View style={styles.busca}>
          <Image source={imagens.busca} style={styles.iconeBusca} />
          <TextInput autoFocus placeholder="Pesquise aqui" placeholderTextColor="#4b5563" returnKeyType="search" style={styles.campoBusca} />
          <Image source={imagens.microfone} style={styles.iconeMicrofone} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.painel} showsVerticalScrollIndicator={false}>
        <Text style={styles.tituloLista}>Locais salvos</Text>
        <View style={styles.lista}>
          {locaisSalvos.map((local) => (
            <Pressable accessibilityRole="button" key={local} onPress={() => undefined} style={styles.itemLocal}>
              <View style={styles.iconeLocal}><Image source={imagens.salvo} style={styles.iconeItem} /></View>
              <Text numberOfLines={1} style={styles.nomeLocal}>{local}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.tituloLista, styles.tituloRecentes]}>Pesquisas recentes</Text>
        <View style={styles.lista}>
          {pesquisasRecentes.map((local) => (
            <Pressable accessibilityRole="button" key={local} onPress={() => undefined} style={styles.itemLocal}>
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
  campoBusca: { color: "#1f2937", flex: 1, fontSize: 16, marginHorizontal: 8, paddingVertical: 0 },
  iconeMicrofone: { height: 22, resizeMode: "contain", width: 17 },
  painel: { backgroundColor: "#f8f8ff", borderTopLeftRadius: 28, borderTopRightRadius: 28, flexGrow: 1, marginTop: 24, paddingBottom: 28, paddingTop: 8 },
  tituloLista: { color: "#1f2937", fontSize: 17, fontWeight: "700", paddingBottom: 10, paddingHorizontal: 24 },
  tituloRecentes: { paddingTop: 24 },
  lista: { backgroundColor: "#ffffff", borderTopColor: "#e5e7eb", borderTopWidth: StyleSheet.hairlineWidth },
  itemLocal: { alignItems: "center", borderBottomColor: "#e5e7eb", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", minHeight: 52, paddingHorizontal: 20 },
  iconeLocal: { alignItems: "center", backgroundColor: "#d1d5db", borderRadius: 16, height: 32, justifyContent: "center", marginRight: 12, width: 32 },
  iconeItem: { height: 18, resizeMode: "contain", width: 18 },
  nomeLocal: { color: "#1f2937", flex: 1, fontSize: 15 },
});
