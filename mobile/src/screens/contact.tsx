import { useState } from "react";

import {
  View,
  Text,
  TextInput,
<<<<<<< HEAD
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
=======
  TouchableOpacity,
>>>>>>> main
  StyleSheet,
  Image,
} from "react-native";

export default function Contatos({ navigation }: any) {

  const [email, setEmail] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
<<<<<<< HEAD
  const [enviado, setEnviado] = useState(false);

  function enviarMensagem() {
    setAssunto("");
    setMensagem("");
    setEnviado(true);
=======

  function fazerLogin() {
    console.log(email);
    console.log(assunto);
    console.log(mensagem);
>>>>>>> main
  }

  return (

<<<<<<< HEAD
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
=======
    <View style={styles.container}>

      {/*Cabeçalho*/}
      <View style={styles.topo}>

        <Image
          source={require("../../assets/images/name.png")}
          style={styles.logo}
        />

      </View>

      {/* ÁREA LOGIN */}
      <View style={styles.formulario}>

        <Text style={styles.titulo}>
          Nos Contate
        </Text>
>>>>>>> main

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
<<<<<<< HEAD
=======
          secureTextEntry
>>>>>>> main
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

<<<<<<< HEAD
        <Pressable
          style={styles.botao}
          onPress={enviarMensagem}
=======
        <TouchableOpacity
          style={styles.botao}
          onPress={() => navigation.goBack()}
>>>>>>> main
        >
          <Text style={styles.textoBotao}>
            Enviar
          </Text>
<<<<<<< HEAD
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
=======
        </TouchableOpacity>

      </View>

    </View>
>>>>>>> main

  );
}

const styles = StyleSheet.create({

<<<<<<< HEAD
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
=======
  container: {
    flex: 1,
    backgroundColor: "#F8F8FF",
  },

  topo: {
    backgroundColor: "#8B0000",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 30,
    paddingBottom: 10,
  },

  logo: {
    width: 300,
    height: 200,
  },

  formulario: {
    flex: 1,
    padding: 24,
    marginTop: -10,
  },

  titulo: {
    fontSize: 32,
    marginTop: 20,
    marginBottom: 40,
    fontWeight: "bold",
    textAlign: "center",
  },

  input: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DDD",
  },

  inputM: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DDD",
    height: 150,
  },

  botao: {
    backgroundColor: "#8B0000",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  textoBotao: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
>>>>>>> main
