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
  );
}

const styles = StyleSheet.create({

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