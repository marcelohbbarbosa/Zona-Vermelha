import { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";

export default function Contatos({ navigation }: any) {

  const [email, setEmail] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");

  function fazerLogin() {
    console.log(email);
    console.log(assunto);
    console.log(mensagem);
  }

  return (

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
          secureTextEntry
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

        <TouchableOpacity
          style={styles.botao}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.textoBotao}>
            Enviar
          </Text>
        </TouchableOpacity>

      </View>

    </View>

  );
}

const styles = StyleSheet.create({

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