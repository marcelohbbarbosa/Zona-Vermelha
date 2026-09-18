import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function Login({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function fazerLogin() {
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
  );
}

const styles = StyleSheet.create({
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
