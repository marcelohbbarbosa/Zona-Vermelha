import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../services/api";

type Coordenadas = { latitude: number; longitude: number };
type LocalEncontrado = Coordenadas & { id: number | string; nome: string };
type PontoTuristico = {
  id: string;
  nome: string;
  cidade: string;
  endereco: string;
  coordenadas?: Coordenadas;
};

const cidades = ["Santos", "São Vicente", "Guarujá", "Praia Grande", "Bertioga", "Cubatão", "Mongaguá", "Itanhaém", "Peruíbe"];
const locais: PontoTuristico[] = [
  { id: "santos-vila-belmiro", nome: "Vila Belmiro (Estádio Urbano Caldeira)", cidade: "Santos", endereco: "R. Princesa Isabel, Vila Belmiro" },
  { id: "santos-memorial-conquistas", nome: "Memorial das Conquistas do Santos FC", cidade: "Santos", endereco: "Vila Belmiro" },
  { id: "santos-museu-pele", nome: "Museu Pelé", cidade: "Santos", endereco: "Largo Marquês de Monte Alegre, 1, Valongo" },
  { id: "santos-museu-cafe", nome: "Museu do Café", cidade: "Santos", endereco: "R. Quinze de Novembro, 95, Centro" },
  { id: "santos-museu-porto", nome: "Museu do Porto de Santos", cidade: "Santos", endereco: "Av. Conselheiro Rodrigues Alves, Macuco" },
  { id: "santos-pinacoteca", nome: "Pinacoteca Benedito Calixto", cidade: "Santos", endereco: "Av. Bartholomeu de Gusmão, 15, Boqueirão" },
  { id: "santos-mass", nome: "MASS (Museu de Arte Sacra)", cidade: "Santos", endereco: "R. Santa Cecília, 795, Morro São Bento" },
  { id: "santos-museus-mar", nome: "Museu do Mar e Museu Marítimo", cidade: "Santos", endereco: "Ponta da Praia" },
  { id: "santos-mis", nome: "MIS (Museu da Imagem e do Som)", cidade: "Santos", endereco: "Av. Senador Pinheiro Machado, 48, Vila Mathias" },
  { id: "santos-trem-belico", nome: "Casa do Trem Bélico", cidade: "Santos", endereco: "R. Tiro Onze, 11, Centro" },
  { id: "santos-aquario", nome: "Aquário Municipal e Jardim do Aquário", cidade: "Santos", endereco: "Ponta da Praia" },
  { id: "santos-orquidario", nome: "Orquidário Municipal", cidade: "Santos", endereco: "Praça Washington, José Menino" },
  { id: "santos-outeiro", nome: "Outeiro de Santa Catarina", cidade: "Santos", endereco: "R. Visconde de Rio Branco, 48, Centro" },
  { id: "santos-valongo", nome: "Estação do Valongo, Bonde Turístico e Arcos do Valongo", cidade: "Santos", endereco: "Valongo" },
  { id: "santos-palacio-prefeitura", nome: "Palácio José Bonifácio (Prefeitura)", cidade: "Santos", endereco: "Praça Visconde de Mauá" },
  { id: "santos-cafe-carioca", nome: "Café Carioca", cidade: "Santos", endereco: "Praça Visconde de Mauá, 1" },
  { id: "santos-praia-jose-menino", nome: "Praia do José Menino", cidade: "Santos", endereco: "Divisa com São Vicente" },
  { id: "sv-marco-padrao", nome: "Marco Padrão", cidade: "São Vicente", endereco: "Av. Embaixador Pedro de Toledo, Centro" },
  { id: "sv-parque-cultural", nome: "Parque Cultural Vila de São Vicente", cidade: "São Vicente", endereco: "Praça João Pessoa, Centro" },
  { id: "sv-instituto-historico", nome: "Instituto Histórico e Geográfico", cidade: "São Vicente", endereco: "R. Frei Gaspar, 280, Centro" },
  { id: "sv-pontinha-pier", nome: "Pontinha da Praia e Píer dos Apaixonados", cidade: "São Vicente", endereco: "Boa Vista, orla do Gonzaguinha" },
  { id: "sv-teleferico", nome: "Teleférico de São Vicente", cidade: "São Vicente", endereco: "Av. Ayrton Senna da Silva, 500, Itararé" },
  { id: "sv-memorial-500", nome: "Memorial dos 500 Anos / Mirante Niemeyer", cidade: "São Vicente", endereco: "Alameda Ari Barroso, Ilha Porchat" },
  { id: "guaruja-acqua-mundo", nome: "Acqua Mundo", cidade: "Guarujá", endereco: "Av. Miguel Estéfno, 2001, Pitangueiras" },
  { id: "guaruja-fortaleza-barra", nome: "Fortaleza da Barra Grande", cidade: "Guarujá", endereco: "R. Messias Borges, 380, Santa Cruz dos Navegantes" },
  { id: "guaruja-mirante-galheta", nome: "Mirante da Galheta", cidade: "Guarujá", endereco: "R. das Galhetas, Jardim Astúrias" },
  { id: "guaruja-mirante-campina", nome: "Mirante do Morro da Campina", cidade: "Guarujá", endereco: "Morro do Maluf, Enseada" },
  { id: "guaruja-forte-andradas", nome: "Forte dos Andradas", cidade: "Guarujá", endereco: "Jardim Guaiúba" },
  { id: "guaruja-maria-fumaca", nome: "Pavilhão da Maria Fumaça", cidade: "Guarujá", endereco: "Av. Leomil, Centro" },
  { id: "guaruja-museu-historia", nome: "Museu da História de Guarujá", cidade: "Guarujá", endereco: "Av. Dep. Emílio Carlos, 39, Vila Maia" },
  { id: "pg-iemanja", nome: "Estátua de Iemanjá", cidade: "Praia Grande", endereco: "Av. Pres. Castelo Branco, Nova Mirim" },
  { id: "pg-netuno", nome: "Estátua de Netuno", cidade: "Praia Grande", endereco: "Av. Pres. Castelo Branco, Cidade Ocian" },
  { id: "pg-wonderland", nome: "Park Wonderland", cidade: "Praia Grande", endereco: "R. Carlos Gomes, 64, Cidade Ocian" },
  { id: "pg-portinho", nome: "Portinho, Parque Ézio Dall’Acqua", cidade: "Praia Grande", endereco: "R. Paulo Sérgio Garcia, Sítio do Campo" },
  { id: "pg-parque-cidade", nome: "Parque da Cidade", cidade: "Praia Grande", endereco: "R. José Bonifácio, Sítio do Campo" },
  { id: "bertioga-forte-sao-joao", nome: "Forte São João", cidade: "Bertioga", endereco: "Av. Vicente de Carvalho, Centro" },
  { id: "bertioga-praia-maitinga", nome: "Praia de Maitinga", cidade: "Bertioga", endereco: "Maitinga" },
  { id: "bertioga-sesc", nome: "Reserva Natural Sesc Bertioga", cidade: "Bertioga", endereco: "Av. Francisco Soto Barreiro Filho, Maitinga" },
  { id: "bertioga-restinga", nome: "Parque Estadual Restinga de Bertioga", cidade: "Bertioga", endereco: "Av. Henrique Costabile, 114, Jardim Veleiros" },
  { id: "cubatao-anilinas", nome: "New Anilinas Park", cidade: "Cubatão", endereco: "Av. Nove de Abril, Centro" },
  { id: "cubatao-pereque", nome: "Perequê Park (Trilha Véu da Noiva)", cidade: "Cubatão", endereco: "Rod. Cônego Domênico Rangoni, km 42,5" },
  { id: "cubatao-casqueiro", nome: "Píer do Casqueiro", cidade: "Cubatão", endereco: "Av. Beira Mar" },
  { id: "mongagua-tribuna", nome: "Parque Ecológico A Tribuna", cidade: "Mongaguá", endereco: "Av. Gov. Mário Covas Júnior, 10.410" },
  { id: "mongagua-poco-antas", nome: "Poço das Antas", cidade: "Mongaguá", endereco: "R. do Poço das Antas, Pedreira" },
  { id: "mongagua-padroeira", nome: "Morro da Padroeira", cidade: "Mongaguá", endereco: "R. Antonieta Loureiro, Centro" },
  { id: "itanhaem-cama-anchieta", nome: "Cama de Anchieta", cidade: "Itanhaém", endereco: "R. da Enseada, Praia dos Sonhos" },
  { id: "itanhaem-paranambuco", nome: "Morro Paranambuco (Pedra da Esfinge)", cidade: "Itanhaém", endereco: "Morro Paranambuco" },
  { id: "itanhaem-sapucaitava", nome: "Morro Sapucaitava", cidade: "Itanhaém", endereco: "Praia dos Sonhos" },
  { id: "itanhaem-pocinho", nome: "Pocinho de Anchieta", cidade: "Itanhaém", endereco: "Cibratel I" },
  { id: "itanhaem-museu-conceicao", nome: "Museu Conceição de Itanhaém", cidade: "Itanhaém", endereco: "Praça Narciso de Andrade, Centro" },
  { id: "peruibe-guarau", nome: "Praia do Guaraú", cidade: "Peruíbe", endereco: "Estr. do Guaraú" },
  { id: "peruibe-jureia", nome: "Estação Ecológica Jureia-Itatins", cidade: "Peruíbe", endereco: "Estr. do Guaraú, 4164" },
  { id: "peruibe-cachoeira-pereque", nome: "Cachoeira do Perequê", cidade: "Peruíbe", endereco: "Balneário Garça Vermelha" },
  { id: "peruibe-parque-turistico", nome: "Parque Turístico de Peruíbe", cidade: "Peruíbe", endereco: "Av. Gov. Mário Covas Júnior, Centro" },
];

const imagens = {
  busca: require("../../assets/images/Search.png"),
  voltar: require("../../assets/images/Return.png"),
  rota: require("../../assets/images/Route.png"),
};

export default function Turismo({ navigation }: any) {
  const [consulta, setConsulta] = useState("");
  const [cidadeAtiva, setCidadeAtiva] = useState("Todas");
  const [carregandoId, setCarregandoId] = useState<string | null>(null);
  const [coordenadasPorLocal, setCoordenadasPorLocal] = useState<Record<string, Coordenadas>>({});

  const locaisVisiveis = useMemo(() => {
    const termo = consulta.trim().toLocaleLowerCase("pt-BR");
    return locais.filter((local) => {
      const correspondeCidade = cidadeAtiva === "Todas" || local.cidade === cidadeAtiva;
      const correspondeConsulta = !termo || `${local.nome} ${local.endereco} ${local.cidade}`.toLocaleLowerCase("pt-BR").includes(termo);
      return correspondeCidade && correspondeConsulta;
    });
  }, [cidadeAtiva, consulta]);

  const abrirPonto = async (local: PontoTuristico, acao: "avaliar" | "rota") => {
    setCarregandoId(local.id);
    try {
      let coordenadas = local.coordenadas ?? coordenadasPorLocal[local.id];
      if (!coordenadas) {
        const consultas = [
          `${local.nome}, ${local.cidade}, São Paulo, Brasil`,
          `${local.endereco}, ${local.cidade}, São Paulo, Brasil`,
        ];
        let encontrados: LocalEncontrado[] = [];
        for (const texto of consultas) {
          encontrados = await api(`/locais/buscar?q=${encodeURIComponent(texto)}`) as LocalEncontrado[];
          if (encontrados.length) break;
        }
        const escolhido = encontrados[0];
        if (!escolhido) {
          Alert.alert("Localização não encontrada", "Não encontramos as coordenadas deste ponto agora. Confira o endereço e tente novamente.");
          return;
        }
        coordenadas = { latitude: escolhido.latitude, longitude: escolhido.longitude };
        setCoordenadasPorLocal((atuais) => ({ ...atuais, [local.id]: coordenadas! }));
      }

      const zona = `${local.nome} · ${local.endereco} · ${local.cidade}`.slice(0, 200);
      if (acao === "avaliar") {
        navigation.navigate("AvaliacoesRegiao", { ...coordenadas, zona, nomePonto: local.nome });
      } else {
        navigation.navigate("Rotas", {
          destino: `${local.nome} — ${local.cidade}`,
          latitude: coordenadas.latitude,
          longitude: coordenadas.longitude,
        });
      }
    } catch (erro: any) {
      Alert.alert("Não foi possível localizar o ponto", erro.message || "Verifique sua conexão e tente novamente.");
    } finally {
      setCarregandoId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cabecalho}>
        <Pressable accessibilityLabel="Voltar ao mapa" hitSlop={10} onPress={() => navigation.goBack()} style={styles.voltar}>
          <Image source={imagens.voltar} style={styles.iconeVoltar} />
        </Pressable>
        <View style={styles.busca}>
          <Image source={imagens.busca} style={styles.iconeBusca} />
          <Text style={styles.textoBusca}>Pontos turísticos</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Pontos turísticos da Baixada Santista</Text>
        <Text style={styles.descricao}>Consulte o endereço, trace uma rota ou avalie as condições da região do ponto.</Text>

        <View style={styles.campoPesquisa}>
          <Image source={imagens.busca} style={styles.iconeCampo} />
          <TextInput
            accessibilityLabel="Pesquisar pontos turísticos"
            onChangeText={setConsulta}
            placeholder="Buscar ponto ou endereço"
            placeholderTextColor="#737b86"
            style={styles.inputBusca}
            value={consulta}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
          {["Todas", ...cidades].map((cidade) => (
            <Pressable key={cidade} onPress={() => setCidadeAtiva(cidade)} style={[styles.filtro, cidadeAtiva === cidade && styles.filtroAtivo]}>
              <Text style={[styles.textoFiltro, cidadeAtiva === cidade && styles.textoFiltroAtivo]}>{cidade}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.contagem}>{locaisVisiveis.length} ponto(s) encontrado(s)</Text>
        {locaisVisiveis.map((local) => (
          <View key={local.id} style={styles.card}>
            <View style={styles.cabecalhoCard}>
              <View style={styles.iconePonto}><Text style={styles.iconePontoTexto}>★</Text></View>
              <View style={styles.titulosCard}>
                <Text style={styles.nomeLocal}>{local.nome}</Text>
                <Text style={styles.cidade}>{local.cidade}</Text>
              </View>
            </View>
            <Text style={styles.rotuloEndereco}>Endereço informado</Text>
            <Text selectable style={styles.endereco}>{local.endereco}, {local.cidade} - SP</Text>
            <View style={styles.acoes}>
              <Pressable accessibilityRole="button" disabled={carregandoId === local.id} onPress={() => void abrirPonto(local, "avaliar")} style={[styles.botaoAvaliar, carregandoId === local.id && styles.botaoDesativado]}>
                {carregandoId === local.id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.textoBotaoAvaliar}>Avaliar ponto</Text>}
              </Pressable>
              <Pressable accessibilityRole="button" disabled={carregandoId === local.id} onPress={() => void abrirPonto(local, "rota")} style={[styles.botaoRota, carregandoId === local.id && styles.botaoDesativado]}>
                <Image source={imagens.rota} style={styles.iconeRota} />
                <Text style={styles.textoBotaoRota}>Traçar rota</Text>
              </Pressable>
            </View>
          </View>
        ))}
        {!locaisVisiveis.length ? <Text style={styles.vazio}>Nenhum ponto corresponde à busca.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#f8f8ff", flex: 1 },
  cabecalho: { alignItems: "center", flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 18 },
  voltar: { alignItems: "center", backgroundColor: "#fff", borderRadius: 21, elevation: 7, height: 42, justifyContent: "center", width: 42 },
  iconeVoltar: { height: 22, resizeMode: "contain", width: 22 },
  busca: { alignItems: "center", backgroundColor: "#fff", borderRadius: 26, elevation: 8, flex: 1, flexDirection: "row", minHeight: 50, paddingHorizontal: 14 },
  iconeBusca: { height: 20, resizeMode: "contain", width: 20 },
  textoBusca: { color: "#6b7280", flex: 1, fontSize: 16, paddingLeft: 8 },
  conteudo: { gap: 12, padding: 20, paddingBottom: 36 },
  titulo: { color: "#1f2937", fontSize: 23, fontWeight: "800", marginTop: 8 },
  descricao: { color: "#6b7280", fontSize: 14, lineHeight: 20 },
  campoPesquisa: { alignItems: "center", backgroundColor: "#fff", borderColor: "#e5e7eb", borderRadius: 12, borderWidth: 1, flexDirection: "row", minHeight: 46, paddingHorizontal: 12 },
  iconeCampo: { height: 18, resizeMode: "contain", width: 18 },
  inputBusca: { color: "#1f2937", flex: 1, fontSize: 14, paddingHorizontal: 9, paddingVertical: 8 },
  filtros: { gap: 8, paddingVertical: 4 },
  filtro: { backgroundColor: "#fff", borderColor: "#e1e4e8", borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  filtroAtivo: { backgroundColor: "#8b0000", borderColor: "#8b0000" },
  textoFiltro: { color: "#4b5563", fontSize: 12, fontWeight: "700" },
  textoFiltroAtivo: { color: "#fff" },
  contagem: { color: "#6b7280", fontSize: 12, fontWeight: "700", marginTop: 2 },
  card: { backgroundColor: "#fff", borderColor: "#e7e9ed", borderRadius: 16, borderWidth: 1, elevation: 3, padding: 15 },
  cabecalhoCard: { alignItems: "center", flexDirection: "row", gap: 11 },
  iconePonto: { alignItems: "center", backgroundColor: "#fff1cc", borderRadius: 20, height: 40, justifyContent: "center", width: 40 },
  iconePontoTexto: { color: "#a16b00", fontSize: 21 },
  titulosCard: { flex: 1 },
  nomeLocal: { color: "#20252b", fontSize: 15, fontWeight: "800", lineHeight: 20 },
  cidade: { color: "#8b0000", fontSize: 12, fontWeight: "700", marginTop: 3 },
  rotuloEndereco: { color: "#69727c", fontSize: 11, fontWeight: "700", marginTop: 12 },
  endereco: { color: "#424a53", fontSize: 13, lineHeight: 19, marginTop: 3 },
  acoes: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 13 },
  botaoAvaliar: { alignItems: "center", backgroundColor: "#8b0000", borderRadius: 20, justifyContent: "center", minHeight: 40, minWidth: 125, paddingHorizontal: 14 },
  textoBotaoAvaliar: { color: "#fff", fontSize: 13, fontWeight: "800" },
  botaoRota: { alignItems: "center", borderColor: "#8b0000", borderRadius: 20, borderWidth: 1, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 40, paddingHorizontal: 14 },
  iconeRota: { height: 17, resizeMode: "contain", tintColor: "#8b0000", width: 17 },
  textoBotaoRota: { color: "#8b0000", fontSize: 13, fontWeight: "800" },
  botaoDesativado: { opacity: 0.55 },
  vazio: { color: "#6b7280", fontSize: 14, paddingVertical: 18, textAlign: "center" },
});
