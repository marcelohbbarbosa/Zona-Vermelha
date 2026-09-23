<<<<<<< HEAD
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

const imagens = {
  voltar: require("../../assets/images/Return.png"),
};

const pilares = [
  ["01", "Mapeamento", "Visualização de locais e informações importantes de Praia Grande."],
  ["02", "Orientação", "Recursos simples para planejar deslocamentos com mais segurança."],
  ["03", "Apoio", "Acesso direto a pontos úteis, turismo e canais de contato."],
];

export default function Sobre({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView bounces={false} contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.cabecalho}>
          <View style={styles.resumo}>
            <Text style={styles.tituloCabecalho}>Zona Vermelha</Text>
            <Text style={styles.subtituloCabecalho}>Informação, prevenção e cuidado para Praia Grande.</Text>
          </View>
        </View>

        <View style={styles.painel}>
          <Text style={styles.titulo}>Sobre o projeto</Text>
          <Text style={styles.texto}>O Zona Vermelha ajuda a encontrar locais, planejar deslocamentos e acessar informações úteis de forma simples pelo celular.</Text>
          <View style={styles.divisor} />
          <Text style={styles.tituloSecao}>Nosso objetivo</Text>
          <Text style={styles.texto}>Apoiar decisões mais conscientes em situações que pedem atenção, cuidado e resposta rápida.</Text>

          <Text style={styles.tituloPilares}>Como ajudamos</Text>
          <View style={styles.lista}>
            {pilares.map(([numero, titulo, texto]) => (
              <View key={numero} style={styles.pilar}>
                <Text style={styles.numero}>{numero}</Text>
                <View style={styles.pilarConteudo}>
                  <Text style={styles.tituloPilar}>{titulo}</Text>
                  <Text style={styles.textoPilar}>{texto}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <Pressable accessibilityLabel="Voltar ao mapa" hitSlop={10} onPress={() => navigation.goBack()} style={styles.voltar}>
        <Image source={imagens.voltar} style={styles.iconeVoltar} />
      </Pressable>
    </SafeAreaView>
=======
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function Sobre({ navigation }: any) {
  return (

    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>

        <Image
          source={require("../../assets/images/name.png")}
          style={styles.logo}
        />

        <Text style={styles.subtitle}>
          Informacao, prevencao e cuidado
        </Text>
        <Text style={styles.subtitle}>
          em areas de risco.
        </Text>

      </View>

      {/* CONTEÚDO */}
      <View style={styles.content}>

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Sobre o projeto
          </Text>

          <Text style={styles.paragraph}>
            O Zona Vermelha foi pensado para ajudar pessoas a visualizarem
            pontos de atencao, encontrarem informacoes importantes e acessarem
            contatos uteis de forma simples pelo celular.
          </Text>

        </View>

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Objetivo
          </Text>

          <Text style={styles.paragraph}>
            Organizar dados e orientacoes para apoiar a tomada de decisao em
            situacoes que exigem alerta, cuidado e resposta rapida.
          </Text>

        </View>

        <View style={styles.cardsContainer}>

          <View style={styles.card}>

            <Text style={styles.cardNumber}>
              01
            </Text>

            <Text style={styles.cardTitle}>
              Mapeamento
            </Text>

            <Text style={styles.cardText}>
              Visualizacao de regioes e pontos relevantes para acompanhamento.
            </Text>

          </View>

          <View style={styles.card}>

            <Text style={styles.cardNumber}>
              02
            </Text>

            <Text style={styles.cardTitle}>
              Orientacao
            </Text>

            <Text style={styles.cardText}>
              Conteudo direto para facilitar a consulta em momentos importantes.
            </Text>

          </View>

          <View style={styles.card}>

            <Text style={styles.cardNumber}>
              03
            </Text>

            <Text style={styles.cardTitle}>
              Apoio
            </Text>

            <Text style={styles.cardText}>
              Acesso a canais e informacoes que aproximam o usuario de ajuda.
            </Text>

          </View>

        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >

          <Text style={styles.buttonText}>
            Voltar
          </Text>

        </TouchableOpacity>

      </View>

    </ScrollView>
>>>>>>> main
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: { backgroundColor: "#f8f8ff", flex: 1 },
  conteudo: { flexGrow: 1 },
  cabecalho: { backgroundColor: "#8b0000", minHeight: 218, paddingHorizontal: 24, paddingTop: 72 },
  voltar: { alignItems: "center", backgroundColor: "#ffffff", borderRadius: 21, elevation: 7, height: 42, justifyContent: "center", left: 16, position: "absolute", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8, top: 18, width: 42, zIndex: 2 },
  iconeVoltar: { height: 22, resizeMode: "contain", width: 22 },
  resumo: { alignItems: "flex-start" },
  tituloCabecalho: { color: "#ffffff", fontSize: 27, fontWeight: "800" },
  subtituloCabecalho: { color: "#ffffff", fontSize: 15, lineHeight: 21, marginTop: 5, opacity: 0.92 },
  painel: { backgroundColor: "#f8f8ff", flex: 1, minHeight: 370, padding: 24 },
  titulo: { color: "#1f2937", fontSize: 24, fontWeight: "800" },
  tituloSecao: { color: "#1f2937", fontSize: 19, fontWeight: "800" },
  texto: { color: "#6b7280", fontSize: 15, lineHeight: 22, marginTop: 7 },
  divisor: { backgroundColor: "#dfe1e6", height: StyleSheet.hairlineWidth, marginVertical: 24 },
  tituloPilares: { color: "#1f2937", fontSize: 19, fontWeight: "800", marginTop: 28 },
  lista: { gap: 12, marginTop: 12 },
  pilar: { backgroundColor: "#ffffff", borderRadius: 18, elevation: 3, flexDirection: "row", padding: 17, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  numero: { color: "#8b0000", fontSize: 14, fontWeight: "800", marginRight: 14, paddingTop: 2, width: 26 },
  pilarConteudo: { flex: 1 },
  tituloPilar: { color: "#1f2937", fontSize: 16, fontWeight: "800" },
  textoPilar: { color: "#6b7280", fontSize: 14, lineHeight: 20, marginTop: 3 },
});
=======

  container: {
    flex: 1,
    backgroundColor: "#F8F8FF",
  },

  header: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B0000",

    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,

    marginBottom: 24,
  },

  logo: {
    width: 300,
    height: 200,
    resizeMode: "contain",
  },

  subtitle: {
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },

  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    color: "#1F1F1F",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },

  paragraph: {
    color: "#444",
    fontSize: 16,
    lineHeight: 24,
  },

  cardsContainer: {
    gap: 14,
    marginTop: 4,
    marginBottom: 28,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E7E7EF",
  },

  cardNumber: {
    color: "#8B0000",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
  },

  cardTitle: {
    color: "#222",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },

  cardText: {
    color: "#555",
    fontSize: 15,
    lineHeight: 21,
  },

  button: {
    backgroundColor: "#8B0000",
    padding: 18,
    borderRadius: 25,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },

});
>>>>>>> main
