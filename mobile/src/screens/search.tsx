import { useState } from "react";
import { ActivityIndicator, Image, Keyboard, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { api } from "../services/api";

type Local = { id: number; nome: string; latitude: number; longitude: number };
const imagens = {
  busca: require("../../assets/images/Search.png"),
  voltar: require("../../assets/images/Return.png"),
};

export default function Pesquisa({ navigation }: any) {
  const [consulta, setConsulta] = useState("");
  const [locais, setLocais] = useState<Local[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const pesquisar = async () => {
    const texto = consulta.trim();
    if (texto.length < 3) {
      setErro("Digite pelo menos 3 caracteres para pesquisar.");
      setLocais([]);
      return;
    }
    Keyboard.dismiss();
    setCarregando(true);
    setErro("");
    try {
      const resultado = await api(`/locais/buscar?q=${encodeURIComponent(texto)}`) as Local[];
      setLocais(resultado);
      if (resultado.length === 0) setErro("Nenhum local encontrado na Baixada Santista.");
    } catch (e: any) {
      setErro(e.message || "Não foi possível pesquisar este local.");
      setLocais([]);
    } finally {
      setCarregando(false);
    }
  };

  const escolher = (local: Local) => {
    navigation.navigate("Rotas", {
      destino: local.nome,
      latitude: local.latitude,
      longitude: local.longitude,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cabecalho}>
        <Pressable accessibilityLabel="Voltar ao mapa" hitSlop={10} onPress={() => navigation.goBack()} style={styles.voltar}>
          <Image source={imagens.voltar} style={styles.iconeVoltar} />
        </Pressable>
        <View style={styles.busca}>
          <Image source={imagens.busca} style={styles.iconeBusca} />
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
            onChangeText={setConsulta}
            onSubmitEditing={pesquisar}
            placeholder="Pesquise um endereço ou local"
            placeholderTextColor="#4b5563"
            returnKeyType="search"
            style={styles.campoBusca}
            value={consulta}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Pesquisar" disabled={carregando} onPress={pesquisar}>
            {carregando ? <ActivityIndicator color="#8b0000" /> : <Text style={styles.textoPesquisar}>Buscar</Text>}
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.painel} keyboardShouldPersistTaps="handled">
        {erro ? <Text style={styles.mensagem}>{erro}</Text> : null}
        {locais.map((local) => (
          <Pressable accessibilityRole="button" key={local.id} onPress={() => escolher(local)} style={styles.itemLocal}>
            <View style={styles.iconeLocal}><Image source={imagens.busca} style={styles.iconeItem} /></View>
            <Text numberOfLines={2} style={styles.nomeLocal}>{local.nome}</Text>
          </Pressable>
        ))}
        {!locais.length && !erro && !carregando ? <Text style={styles.instrucao}>Pesquise um endereço, rua ou ponto de interesse da Baixada Santista.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#f8f8ff", flex: 1 },
  cabecalho: { alignItems: "center", flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 18 },
  voltar: { alignItems: "center", backgroundColor: "#ffffff", borderRadius: 21, elevation: 7, height: 42, justifyContent: "center", width: 42 },
  iconeVoltar: { height: 22, resizeMode: "contain", width: 22 },
  busca: { alignItems: "center", backgroundColor: "#ffffff", borderRadius: 26, elevation: 8, flex: 1, flexDirection: "row", minHeight: 54, paddingHorizontal: 14 },
  iconeBusca: { height: 20, resizeMode: "contain", width: 20 },
  campoBusca: { color: "#1f2937", flex: 1, fontSize: 16, marginHorizontal: 8, paddingVertical: 0 },
  textoPesquisar: { color: "#8b0000", fontSize: 14, fontWeight: "700" },
  painel: { flexGrow: 1, marginTop: 24, paddingBottom: 28, paddingTop: 8 },
  mensagem: { color: "#6b7280", paddingHorizontal: 24, paddingVertical: 16 },
  instrucao: { color: "#6b7280", fontSize: 15, lineHeight: 22, paddingHorizontal: 24, paddingTop: 12 },
  itemLocal: { alignItems: "center", backgroundColor: "#ffffff", borderBottomColor: "#e5e7eb", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", minHeight: 62, paddingHorizontal: 20, paddingVertical: 10 },
  iconeLocal: { alignItems: "center", backgroundColor: "#fee2e2", borderRadius: 16, height: 32, justifyContent: "center", marginRight: 12, width: 32 },
  iconeItem: { height: 18, resizeMode: "contain", tintColor: "#8b0000", width: 18 },
  nomeLocal: { color: "#1f2937", flex: 1, fontSize: 15 },
});
