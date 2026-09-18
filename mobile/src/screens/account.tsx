import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const imagens = {
  conta: require("../../assets/images/Account.png"),
  voltar: require("../../assets/images/Return.png"),
};

export default function Conta({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView bounces={false} contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.cabecalho}>
          <Pressable accessibilityLabel="Voltar ao mapa" hitSlop={10} onPress={() => navigation.goBack()} style={styles.voltar}>
            <Image source={imagens.voltar} style={styles.iconeVoltar} />
          </Pressable>

          <View style={styles.resumoPerfil}>
            <View style={styles.avatar}>
              <Image source={imagens.conta} style={styles.iconeConta} />
            </View>
            <Text style={styles.nome}>MB_337</Text>
            <Text style={styles.meta}>Membro desde 2026</Text>
            <Text style={styles.meta}>Perfil verificado</Text>
          </View>
        </View>

        <View style={styles.painel}>
          <Text style={styles.titulo}>Meu perfil</Text>
          <Text style={styles.descricao}>Acompanhe as informações da sua conta.</Text>

          <View style={styles.card}>
            <LinhaPerfil rotulo="Nome de usuário" valor="MB_337" />
            <View style={styles.divisor} />
            <LinhaPerfil rotulo="Status da conta" valor="Verificada" />
            <View style={styles.divisor} />
            <LinhaPerfil rotulo="Participa desde" valor="2026" />
          </View>

          <Pressable accessibilityRole="button" onPress={() => navigation.navigate("Login")} style={styles.botaoSair}>
            <Text style={styles.textoBotaoSair}>Sair da conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LinhaPerfil({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={styles.linha}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#f8f8ff", flex: 1 },
  conteudo: { flexGrow: 1 },
  cabecalho: { backgroundColor: "#8b0000", minHeight: 306, paddingHorizontal: 18, paddingTop: 18 },
  voltar: { alignItems: "center", borderRadius: 21, height: 42, justifyContent: "center", width: 42 },
  iconeVoltar: { height: 22, resizeMode: "contain", tintColor: "#ffffff", width: 32 },
  resumoPerfil: { alignItems: "flex-start", marginTop: 50, paddingHorizontal: 18 },
  avatar: { alignItems: "center", backgroundColor: "#ffffff", borderRadius: 38, height: 76, justifyContent: "center", width: 76 },
  iconeConta: { height: 46, tintColor: "#8b0000", width: 46 },
  nome: { color: "#ffffff", fontSize: 24, fontWeight: "800", marginTop: 12 },
  meta: { color: "#ffffff", fontSize: 14, marginTop: 3, opacity: 0.92 },
  painel: { backgroundColor: "#f8f8ff", borderTopLeftRadius: 28, borderTopRightRadius: 28, flex: 1, marginTop: -24, minHeight: 330, padding: 24 },
  titulo: { color: "#1f2937", fontSize: 24, fontWeight: "800" },
  descricao: { color: "#6b7280", fontSize: 15, lineHeight: 21, marginTop: 6 },
  card: { backgroundColor: "#ffffff", borderRadius: 18, elevation: 5, marginTop: 22, paddingHorizontal: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 8 },
  linha: { minHeight: 67, justifyContent: "center" },
  rotulo: { color: "#6b7280", fontSize: 13 },
  valor: { color: "#1f2937", fontSize: 16, fontWeight: "700", marginTop: 3 },
  divisor: { backgroundColor: "#e5e7eb", height: StyleSheet.hairlineWidth },
  botaoSair: { alignItems: "center", backgroundColor: "#8b0000", borderRadius: 24, justifyContent: "center", marginTop: 22, minHeight: 50 },
  textoBotaoSair: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
});
