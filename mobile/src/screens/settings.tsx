import { useState } from "react";
import { Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const imagens = {
  conta: require("../../assets/images/AccountConfig.png"),
  notificacoes: require("../../assets/images/Notification.png"),
  acessibilidade: require("../../assets/images/Acessibility.png"),
  voltar: require("../../assets/images/Return.png"),
};

export default function Configuracoes({ navigation }: any) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cabecalho}>
        <Pressable accessibilityLabel="Voltar ao mapa" hitSlop={10} onPress={() => navigation.goBack()} style={styles.voltar}>
          <Image source={imagens.voltar} style={styles.iconeVoltar} />
        </Pressable>
        <Text style={styles.tituloCabecalho}>Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={styles.descricao}>Personalize sua experiência no Zona Vermelha.</Text>

        <View style={styles.lista}>
          <ItemConfiguracao icone={imagens.conta} texto="Configurações da conta" />
          <ItemConfiguracao icone={imagens.notificacoes} texto="Privacidade e notificações" />
          <ItemConfiguracao icone={imagens.acessibilidade} texto="Acessibilidade e usabilidade" />
        </View>

        <Text style={styles.tituloSecao}>Time Zona Vermelha</Text>
        <View style={styles.lista}>
          <ItemConfiguracao texto="Sobre o Zona Vermelha" onPress={() => navigation.navigate("Sobre")} />
          <ItemConfiguracao texto="Contate-nos" onPress={() => navigation.navigate("Contatos")} ultimo />
        </View>

        <Text style={styles.tituloSecao}>Excluir conta</Text>
        <View style={styles.abaExcluir}>
          <Pressable accessibilityRole="button" onPress={() => setConfirmandoExclusao(true)} style={styles.botaoExcluir}>
            <Text style={styles.textoExcluir}>Excluir conta</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal animationType="fade" transparent visible={confirmandoExclusao} onRequestClose={() => setConfirmandoExclusao(false)}>
        <View style={styles.fundoPopup}>
          <View style={styles.popup}>
            <Text style={styles.tituloPopup}>Excluir conta?</Text>
            <Text style={styles.textoPopup}>Esta ação é irreversível. Tem certeza?</Text>
            <View style={styles.acoesPopup}>
              <Pressable accessibilityRole="button" onPress={() => setConfirmandoExclusao(false)} style={styles.botaoNao}>
                <Text style={styles.textoNao}>Não</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => { setConfirmandoExclusao(false); navigation.navigate("Register"); }} style={styles.botaoSim}>
                <Text style={styles.textoSim}>Sim</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ItemConfiguracao({ icone, texto, onPress, ultimo = false }: { icone?: number; texto: string; onPress?: () => void; ultimo?: boolean }) {
  const conteudo = <>
    {icone ? <View style={styles.iconeItem}><Image source={icone} style={styles.imagemItem} /></View> : null}
    <Text style={styles.textoItem}>{texto}</Text>
    {onPress ? <Text style={styles.seta}>›</Text> : null}
  </>;

  if (!onPress) {
    return <View style={[styles.item, ultimo && styles.itemUltimo]}>{conteudo}</View>;
  }

  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.item, ultimo && styles.itemUltimo, pressed && styles.itemPressionado]}>{conteudo}</Pressable>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#f8f8ff", flex: 1 },
  cabecalho: { alignItems: "center", flexDirection: "row", gap: 14, paddingHorizontal: 16, paddingTop: 18 },
  voltar: { alignItems: "center", backgroundColor: "#ffffff", borderRadius: 21, elevation: 7, height: 42, justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, width: 42 },
  iconeVoltar: { height: 22, resizeMode: "contain", width: 22 },
  tituloCabecalho: { color: "#1f2937", fontSize: 22, fontWeight: "800" },
  conteudo: { padding: 24, paddingBottom: 36 },
  descricao: { color: "#6b7280", fontSize: 15, lineHeight: 21 },
  lista: { backgroundColor: "#ffffff", borderRadius: 18, elevation: 4, marginTop: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 7 },
  item: { alignItems: "center", borderBottomColor: "#e5e7eb", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", minHeight: 76, paddingHorizontal: 16 },
  itemUltimo: { borderBottomWidth: 0 },
  itemPressionado: { backgroundColor: "#f3f4f6" },
  iconeItem: { alignItems: "center", backgroundColor: "#d1d5db", borderRadius: 22, height: 44, justifyContent: "center", marginRight: 14, width: 44 },
  imagemItem: { height: 26, resizeMode: "contain", width: 26 },
  textoItem: { color: "#1f2937", flex: 1, fontSize: 15, fontWeight: "600" },
  seta: { color: "#6b7280", fontSize: 28, fontWeight: "300", lineHeight: 28 },
  tituloSecao: { color: "#1f2937", fontSize: 17, fontWeight: "800", marginTop: 28 },
  abaExcluir: { backgroundColor: "#ffffff", borderRadius: 18, elevation: 4, marginTop: 20, padding: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 7 },
  botaoExcluir: { alignItems: "center", backgroundColor: "#b91c1c", borderRadius: 24, justifyContent: "center", minHeight: 50 },
  textoExcluir: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  fundoPopup: { alignItems: "center", backgroundColor: "rgba(17, 24, 39, 0.4)", flex: 1, justifyContent: "center", padding: 24 },
  popup: { backgroundColor: "#ffffff", borderRadius: 20, elevation: 8, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, width: "100%" },
  tituloPopup: { color: "#1f2937", fontSize: 20, fontWeight: "800" },
  textoPopup: { color: "#6b7280", fontSize: 15, lineHeight: 21, marginTop: 8 },
  acoesPopup: { flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 22 },
  botaoNao: { alignItems: "center", backgroundColor: "#e5e7eb", borderRadius: 22, justifyContent: "center", minHeight: 46, minWidth: 86, paddingHorizontal: 16 },
  textoNao: { color: "#374151", fontSize: 15, fontWeight: "700" },
  botaoSim: { alignItems: "center", backgroundColor: "#b91c1c", borderRadius: 22, justifyContent: "center", minHeight: 46, minWidth: 86, paddingHorizontal: 16 },
  textoSim: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
});
