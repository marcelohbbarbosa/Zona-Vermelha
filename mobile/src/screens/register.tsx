import { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";

import Svg, { Path } from "react-native-svg";

export default function Register({ navigation }: any) {

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function fazerRegistro() {
  
    console.log(nome);
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
        <Svg
    height="100"
    width="100%"
    viewBox="0 0 1440 320"
    style={styles.curva}
  >
    <Path
      fill="#F8F8FF"
      d="
        M-320,320
        L25,320
        C640,191,340,0,960,1
        L1440,0
        L1440,3200
        L-320,3200
        Z
      "
    />
  </Svg>

      </View>

      {/* ÁREA REGISTRO */}
      <View style={styles.formulario}>

        <Text style={styles.titulo}>
          Registrar
        </Text>

        <TextInput
          placeholder="Digite seu nome"
          value={nome}
          onChangeText={setNome}
          style={styles.input}
        />

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
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.textoBotao}>
            Registrar
          </Text>
        </TouchableOpacity>

        <Text style={styles.texto}>
          Já tem uma conta? {" "}
        
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("Login")}
          >
            Faça Login
          </Text>
        </Text>

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
  paddingTop: 80,
},

  curva: {
  width: "auto",
  marginTop: "auto",
},

  logo: {
    width: 400,
    height: 200,
    resizeMode: "contain",
    alignSelf: "auto"
  },

  formulario: {
    flex: 1,
    padding: 24,
    marginTop: -70,
  },

  titulo: {
    fontSize: 32,
    marginBottom: 30,
    fontWeight: "bold",
    textAlign: "right",
  },

  texto: {
    fontSize: 20,
    paddingTop: 15,
  },

  link: {
    fontSize: 20,
    color: "blue",
  },

  input: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
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