import { useState } from "react";
<<<<<<< HEAD
import { Image, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function Register({ navigation }: any) {
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

export default function Register({ navigation }: any) {

  const [nome, setNome] = useState("");
>>>>>>> main
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function fazerRegistro() {
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
            <Text style={styles.titulo}>Seja bem-vindo ao Zona{"\u00A0"}Vermelha!</Text>
            <Text style={styles.descricao}>O app para sua segurança nas ruas.</Text>

            <View style={styles.formulario}>
              <Text style={styles.rotulo}>E-mail</Text>
              <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="Digite seu e-mail" placeholderTextColor="#9ca3af" style={styles.input} value={email} />
              <Text style={styles.rotulo}>Senha</Text>
              <TextInput autoComplete="new-password" onChangeText={setSenha} placeholder="Crie uma senha" placeholderTextColor="#9ca3af" secureTextEntry style={styles.input} value={senha} />
              <Pressable accessibilityRole="button" onPress={fazerRegistro} style={styles.botao}>
                <Text style={styles.textoBotao}>Registrar</Text>
              </Pressable>
            </View>

            <Text style={styles.textoCadastro}>Possui uma conta? <Text onPress={() => navigation.navigate("Login")} style={styles.link}>Faça Login</Text></Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
=======
  
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
  formulario: { marginTop: 25 },
  rotulo: { color: "#374151", fontSize: 14, fontWeight: "700", marginBottom: 7, marginTop: 15 },
  input: { backgroundColor: "#ffffff", borderColor: "#e5e7eb", borderRadius: 14, borderWidth: 1, color: "#1f2937", elevation: 1, fontSize: 16, minHeight: 52, paddingHorizontal: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  botao: { alignItems: "center", backgroundColor: "#8b0000", borderRadius: 26, justifyContent: "center", marginTop: 27, minHeight: 52 },
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
>>>>>>> main
