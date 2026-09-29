import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, salvarToken } from "../services/api";

type LoginProps = {
  navigation: {
    reset: (state: {
      index: number;
      routes: { name: string }[];
    }) => void;
    navigate: (screen: string) => void;
  };
};

type ErroApi = {
  message?: string;
  status?: number;
};

export default function Login({ navigation }: LoginProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [enviandoAcao, setEnviandoAcao] = useState(false);
  const [modoRecuperacao, setModoRecuperacao] = useState(false);
  const [precisaConfirmar, setPrecisaConfirmar] = useState(false);
  const [mensagem, setMensagem] = useState("");

  function limparMensagens() {
    setErro("");
    setMensagem("");
  }

  async function fazerLogin() {
    const emailNormalizado = email.trim();

    if (!emailNormalizado || !senha.trim()) {
      setErro("Preencha e-mail e senha.");
      setMensagem("");
      return;
    }

    setCarregando(true);
    limparMensagens();
    setPrecisaConfirmar(false);

    try {
      const dados = await api("/auth/login", {
        method: "POST",
        body: {
          email: emailNormalizado,
          senha,
        },
      });

      if (!dados?.token) {
        throw new Error("A API não retornou um token de autenticação.");
      }

      await salvarToken(dados.token);

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (e: unknown) {
      const erroApi = e as ErroApi;

      setErro(
        erroApi.message || "Não foi possível realizar o login. Tente novamente."
      );

      setPrecisaConfirmar(erroApi.status === 403);
    } finally {
      setCarregando(false);
    }
  }

  async function enviarAcao(caminho: string) {
    const emailNormalizado = email.trim();

    if (!emailNormalizado) {
      setErro("Informe seu e-mail para continuar.");
      setMensagem("");
      return;
    }

    setEnviandoAcao(true);
    limparMensagens();

    try {
      const dados = await api(caminho, {
        method: "POST",
        body: {
          email: emailNormalizado,
        },
      });

      setMensagem(
        dados?.mensagem || "Solicitação realizada com sucesso."
      );
    } catch (e: unknown) {
      const erroApi = e as ErroApi;

      setErro(
        erroApi.message || "Não foi possível concluir a solicitação."
      );
    } finally {
      setEnviandoAcao(false);
    }
  }

  function alternarModoRecuperacao() {
    setModoRecuperacao((anterior) => !anterior);
    setPrecisaConfirmar(false);
    limparMensagens();
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
        >
          <View style={styles.cabecalho}>
            <Image
              source={require("../../assets/images/name.png")}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Logo do aplicativo"
            />

            <Text style={styles.frase}>
              Navegue pela cidade com a segurança de estar na melhor rota
            </Text>
          </View>

          <View style={styles.conteudo}>
            <Text style={styles.titulo}>
              {modoRecuperacao
                ? "Recuperar senha"
                : "Bem-vindo de volta!"}
            </Text>

            <Text style={styles.descricao}>
              {modoRecuperacao
                ? "Informe seu e-mail para receber as instruções de recuperação."
                : "Entre para continuar cuidando dos seus caminhos."}
            </Text>

            <View style={styles.formulario}>
              <Text style={styles.rotulo}>E-mail</Text>

              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType={modoRecuperacao ? "done" : "next"}
                editable={!carregando && !enviandoAcao}
                onChangeText={(valor) => {
                  setEmail(valor);
                  setPrecisaConfirmar(false);
                }}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#9ca3af"
                style={styles.input}
                value={email}
                accessibilityLabel="E-mail"
                accessibilityHint="Digite o e-mail da sua conta"
              />

              {!modoRecuperacao && (
                <>
                  <Text style={styles.rotulo}>Senha</Text>

                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    secureTextEntry
                    returnKeyType="go"
                    editable={!carregando}
                    onChangeText={setSenha}
                    onSubmitEditing={fazerLogin}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                    value={senha}
                    accessibilityLabel="Senha"
                    accessibilityHint="Digite a senha da sua conta"
                  />
                </>
              )}

              {erro ? (
                <Text
                  accessibilityRole="alert"
                  style={styles.erro}
                >
                  {erro}
                </Text>
              ) : null}

              {mensagem ? (
                <Text
                  accessibilityRole="text"
                  style={styles.sucesso}
                >
                  {mensagem}
                </Text>
              ) : null}

              {modoRecuperacao ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={enviandoAcao}
                  onPress={() =>
                    enviarAcao("/auth/solicitar-redefinicao")
                  }
                  style={({ pressed }) => [
                    styles.botao,
                    pressed && styles.botaoPressionado,
                    enviandoAcao && styles.botaoDesabilitado,
                  ]}
                >
                  {enviandoAcao ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.textoBotao}>
                      Enviar link para redefinir senha
                    </Text>
                  )}
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  disabled={carregando}
                  onPress={fazerLogin}
                  style={({ pressed }) => [
                    styles.botao,
                    pressed && styles.botaoPressionado,
                    carregando && styles.botaoDesabilitado,
                  ]}
                >
                  {carregando ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.textoBotao}>Entrar</Text>
                  )}
                </Pressable>
              )}

              {precisaConfirmar && !modoRecuperacao ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={enviandoAcao}
                  onPress={() =>
                    enviarAcao("/auth/reenviar-confirmacao")
                  }
                  style={styles.linkPressable}
                >
                  <Text style={styles.linkAcao}>
                    Reenviar e-mail de confirmação
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={carregando || enviandoAcao}
                onPress={alternarModoRecuperacao}
                style={styles.linkPressable}
              >
                <Text style={styles.linkAcao}>
                  {modoRecuperacao
                    ? "Voltar ao login"
                    : "Esqueci minha senha"}
                </Text>
              </Pressable>
            </View>

            {!modoRecuperacao && (
              <Text style={styles.textoCadastro}>
                Não possui uma conta?{" "}
                <Text
                  accessibilityRole="link"
                  onPress={() => navigation.navigate("Register")}
                  style={styles.link}
                >
                  Registrar
                </Text>
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f8ff",
    flex: 1,
  },

  flex: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    paddingBottom: 28,
  },

  cabecalho: {
    alignItems: "center",
    backgroundColor: "#8b0000",
    height: 285,
    paddingHorizontal: 28,
    paddingTop: 8,
  },

  logo: {
    height: 200,
    transform: [{ translateY: -18 }],
    width: "100%",
  },

  frase: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 25,
    marginTop: -22,
    maxWidth: 320,
    textAlign: "center",
  },

  conteudo: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 44,
  },

  titulo: {
    color: "#1f2937",
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },

  descricao: {
    color: "#374151",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 7,
    textAlign: "center",
  },

  formulario: {
    marginTop: 28,
  },

  rotulo: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 17,
  },

  input: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 14,
    borderWidth: 1,
    color: "#1f2937",
    elevation: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },

  botao: {
    alignItems: "center",
    backgroundColor: "#8b0000",
    borderRadius: 26,
    justifyContent: "center",
    marginTop: 28,
    minHeight: 52,
    paddingHorizontal: 16,
  },

  botaoPressionado: {
    opacity: 0.85,
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  textoBotao: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  erro: {
    color: "#b91c1c",
    fontSize: 14,
    marginTop: 14,
    textAlign: "center",
  },

  sucesso: {
    color: "#166534",
    fontSize: 14,
    marginTop: 14,
    textAlign: "center",
  },

  linkPressable: {
    alignItems: "center",
    paddingVertical: 2,
  },

  linkAcao: {
    color: "#8b0000",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 18,
    textAlign: "center",
  },

  textoCadastro: {
    color: "#374151",
    fontSize: 15,
    marginTop: 25,
    textAlign: "center",
  },

  link: {
    color: "#8b0000",
    fontWeight: "800",
  },
});
