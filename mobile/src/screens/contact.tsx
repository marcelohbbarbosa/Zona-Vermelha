import { useState } from "react";

import {
  View,
  Text,
  TextInput,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Image,
} from "react-native";

export default function Contatos({ navigation }: any) {

  const [email, setEmail] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviado, setEnviado] = useState(false);

  function enviarMensagem() {
    setAssunto("");
    setMensagem("");
    setEnviado(true);
  }

  return (

    <SafeAreaView style={styles.container}>
      <View style={styles.cabecalho}>
        <Pressable accessibilityLabel="Voltar às configurações" hitSlop={10} onPress={() => navigation.goBack()} style={styles.voltar}>
          <Image source={require("../../assets/images/Return.png")} style={styles.iconeVoltar} />
        </Pressable>
        <Text style={styles.tituloCabecalho}>Contate-nos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Como podemos ajudar?</Text>
        <Text style={styles.descricao}>Envie sua dúvida, sugestão ou relato para o time Zona Vermelha.</Text>

        <View style={styles.formulario}>

        <TextInput
          placeholder="Digite seu email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          placeholder="Digite seu assunto"
          value={assunto}
          onChangeText={setAssunto}
          style={styles.input}
        />

        <TextInput
          placeholder="Digite sua mensagem"
          value={mensagem}
          onChangeText={setMensagem}
          multiline
          textAlignVertical="top"
          style={styles.inputM}
        />

        <Pressable
          style={styles.botao}
          onPress={enviarMensagem}
        >
          <Text style={styles.textoBotao}>
            Enviar
          </Text>
        </Pressable>
        </View>
      </ScrollView>

      <Modal animationType="fade" transparent visible={enviado} onRequestClose={() => setEnviado(false)}>
        <View style={styles.fundoPopup}>
          <View style={styles.popup}>
            <Text style={styles.tituloPopup}>Enviado</Text>
            <Pressable accessibilityRole="button" onPress={() => setEnviado(false)} style={styles.botaoPopup}>
              <Text style={styles.textoBotao}>Ok</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({

  container: { backgroundColor: "#f8f8ff", flex: 1 },
  cabecalho: { alignItems: "center", flexDirection: "row", gap: 14, paddingHorizontal: 16, paddingTop: 18 },
  voltar: { alignItems: "center", backgroundColor: "#ffffff", borderRadius: 21, elevation: 7, height: 42, justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, width: 42 },
  iconeVoltar: { height: 22, resizeMode: "contain", width: 22 },
  tituloCabecalho: { color: "#1f2937", fontSize: 22, fontWeight: "800" },
  conteudo: { padding: 24, paddingBottom: 36 },
  titulo: { color: "#1f2937", fontSize: 24, fontWeight: "800" },
  descricao: { color: "#6b7280", fontSize: 15, lineHeight: 21, marginTop: 6 },
  formulario: { backgroundColor: "#ffffff", borderRadius: 18, elevation: 4, marginTop: 22, padding: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 7 },
  input: { backgroundColor: "#ffffff", borderColor: "#e5e7eb", borderRadius: 14, borderWidth: 1, color: "#1f2937", fontSize: 16, marginBottom: 12, minHeight: 52, paddingHorizontal: 16 },
  inputM: { backgroundColor: "#ffffff", borderColor: "#e5e7eb", borderRadius: 14, borderWidth: 1, color: "#1f2937", fontSize: 16, height: 150, marginBottom: 12, padding: 16 },
  botao: { alignItems: "center", backgroundColor: "#8b0000", borderRadius: 26, justifyContent: "center", marginTop: 4, minHeight: 52 },
  textoBotao: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  fundoPopup: { alignItems: "center", backgroundColor: "rgba(17, 24, 39, 0.4)", flex: 1, justifyContent: "center", padding: 24 },
  popup: { alignItems: "center", backgroundColor: "#ffffff", borderRadius: 20, elevation: 8, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, width: "100%" },
  tituloPopup: { color: "#1f2937", fontSize: 20, fontWeight: "800", marginBottom: 18 },
  botaoPopup: { alignItems: "center", backgroundColor: "#8b0000", borderRadius: 22, justifyContent: "center", minHeight: 46, paddingHorizontal: 34 },
});