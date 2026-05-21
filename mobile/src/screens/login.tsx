import { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";

export default function Login() {

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function fazerLogin() {
    console.log(email);
    console.log(senha);
  }

  return (

    <View style={styles.container}>

      {/* TOPO VERMELHO */}
      <View style={styles.topo}>

        <Image
          source={require("../../assets/images/name.png")}
          style={styles.logo}
        />

      </View>

      {/* ÁREA LOGIN */}
      <View style={styles.formulario}>

        <Text style={styles.titulo}>
          Entrar
        </Text>

        <TextInput
          placeholder="Digite seu email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          placeholder="Digite sua senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.botao}
          onPress={fazerLogin}
        >
          <Text style={styles.textoBotao}>
            Entrar
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
    height: 270,
    backgroundColor: "#8B0000",
    justifyContent: "center",
    alignItems: "center"

  },

  logo: {
    width: 350,
    height: 350,
    resizeMode: "contain",
    alignSelf: "auto"
  },

  formulario: {
    flex: 1,
    padding: 24,
    marginTop: 20,
  },

  titulo: {
    fontSize: 32,
    marginBottom: 30,
    fontWeight: "bold",
  },

  input: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DDD",
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