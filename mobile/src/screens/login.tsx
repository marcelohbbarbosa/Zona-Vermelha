import { useState } from "react";
<<<<<<< HEAD
import { Image, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function Login({ navigation }: any) {
=======

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";

import Svg, { Path } from "react-native-svg";

export default function Login({ navigation }: any) {

>>>>>>> main
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function fazerLogin() {
<<<<<<< HEAD
    navigation.navigate("Home");
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.cabecalho}>
            <Image source={require("../../assets/images/name.png")} style={styles.logo} />
            <Text style={styles.frase}>Navegue pela cidade com a segurança de estar na melhor rota</Text>
          </View>

          <View style={styles.conteudo}>
            <Text style={styles.titulo}>Bem-vindo de volta!</Text>
            <Text style={styles.descricao}>Entre para continuar cuidando dos seus caminhos.</Text>

            <View style={styles.formulario}>
              <Text style={styles.rotulo}>E-mail</Text>
              <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="Digite seu e-mail" placeholderTextColor="#9ca3af" style={styles.input} value={email} />
              <Text style={styles.rotulo}>Senha</Text>
              <TextInput autoComplete="password" onChangeText={setSenha} placeholder="Digite sua senha" placeholderTextColor="#9ca3af" secureTextEntry style={styles.input} value={senha} />
              <Pressable accessibilityRole="button" onPress={fazerLogin} style={styles.botao}>
                <Text style={styles.textoBotao}>Entrar</Text>
              </Pressable>
            </View>

            <Text style={styles.textoCadastro}>Não possui uma conta? <Text onPress={() => navigation.navigate("Register")} style={styles.link}>Registrar</Text></Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
=======
    console.log(email);
    console.log(senha);
  }

  return (

    <View style={styles.container}>

      {/*Cabeçalho*/}
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
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.textoBotao}>
            Entrar
          </Text>
        </TouchableOpacity>

        <Text style={styles.texto}>
          Não tem uma conta? {" "}

          <Text
            style={styles.link}
            onPress={() => navigation.navigate("Register")}
          >
            Registre-se
          </Text>
        </Text>

      </View>

    </View>

>>>>>>> main
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: { backgroundColor: "#f8f8ff", flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 28 },
  cabecalho: { alignItems: "center", backgroundColor: "#8b0000", height: 285, paddingHorizontal: 28, paddingTop: 8 },
  logo: { height: 200, resizeMode: "contain", transform: [{ translateY: -18 }], width: "100%" },
  frase: { color: "#ffffff", fontSize: 18, lineHeight: 25, marginTop: -22, maxWidth: 320, textAlign: "center" },
  conteudo: { flex: 1, paddingHorizontal: 24, paddingTop: 44 },
  titulo: { color: "#1f2937", fontSize: 26, fontWeight: "800", textAlign: "center" },
  descricao: { color: "#374151", fontSize: 16, lineHeight: 23, marginTop: 7, textAlign: "center" },
  formulario: { marginTop: 28 },
  rotulo: { color: "#374151", fontSize: 14, fontWeight: "700", marginBottom: 7, marginTop: 17 },
  input: { backgroundColor: "#ffffff", borderColor: "#e5e7eb", borderRadius: 14, borderWidth: 1, color: "#1f2937", elevation: 1, fontSize: 16, minHeight: 52, paddingHorizontal: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  botao: { alignItems: "center", backgroundColor: "#8b0000", borderRadius: 26, justifyContent: "center", marginTop: 28, minHeight: 52 },
  textoBotao: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  textoCadastro: { color: "#374151", fontSize: 15, marginTop: 25, textAlign: "center" },
  link: { color: "#8b0000", fontWeight: "800" },
});
=======

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
  transform: [{ scaleX: -1 }],
},

  logo: {
    width: 375,
    height: 225,
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
  },

  texto: {
    fontSize: 20,
    paddingTop: 20,
  },

  link: {
    fontSize: 20,
    color: "blue",
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
>>>>>>> main
