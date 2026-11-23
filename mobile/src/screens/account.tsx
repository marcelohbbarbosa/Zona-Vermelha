import { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, limparToken } from "../services/api";

type Perfil = { id: number; email: string; emailVerificado: boolean };
type Comentario = { id: number; zona: string; comentario: string; dataCriacao: string; nomeAutor: string };
type RotaSalva = { id: number; nome: string; origem: string; destino: string; disponivelOffline: boolean };
const voltar = require("../../assets/images/Return.png");

export default function Conta({ navigation }: any) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [rotas, setRotas] = useState<RotaSalva[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<"comentarios" | "rotas">("comentarios");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarConta = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [dadosPerfil, recentes, rotas] = await Promise.all([
        api("/auth/perfil", { autenticado: true }) as Promise<Perfil>,
        api("/comentarios/meus", { autenticado: true }) as Promise<Comentario[]>,
        api("/rotas/salvas", { autenticado: true }) as Promise<RotaSalva[]>,
      ]);
      setPerfil(dadosPerfil);
      setComentarios(recentes);
      setRotas(rotas);
    } catch (e: any) {
      setErro(e.message || "Não foi possível carregar sua conta.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void carregarConta();
  }, [carregarConta]));

  const sair = async () => {
    await limparToken();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.cabecalho}>
          <Pressable accessibilityLabel="Voltar ao mapa" hitSlop={10} onPress={() => navigation.goBack()} style={styles.voltar}>
            <Image source={voltar} style={styles.iconeVoltar} />
          </Pressable>
          <View style={styles.resumoPerfil}>
            <View style={styles.avatar}><Text style={styles.inicial}>{perfil?.email?.charAt(0).toUpperCase() ?? "?"}</Text></View>
            <Text style={styles.nome}>{perfil?.email ?? "Minha conta"}</Text>
            <Text style={styles.meta}>{perfil?.emailVerificado ? "E-mail confirmado" : "E-mail não confirmado"}</Text>
          </View>
        </View>

        <View style={styles.painel}>
          <Text style={styles.titulo}>Minha conta</Text>
          <Text style={styles.descricao}>Seu endereço de e-mail é usado como nome de perfil.</Text>
          {carregando ? <ActivityIndicator color="#8b0000" style={styles.carregando} /> : null}
          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <View style={styles.filtros}>
            <Pressable onPress={() => setAbaAtiva("comentarios")} style={[styles.filtro, abaAtiva === "comentarios" && styles.filtroAtivo]}>
              <Text style={[styles.textoFiltro, abaAtiva === "comentarios" && styles.textoFiltroAtivo]}>Comentários</Text>
            </Pressable>
            <Pressable onPress={() => setAbaAtiva("rotas")} style={[styles.filtro, abaAtiva === "rotas" && styles.filtroAtivo]}>
              <Text style={[styles.textoFiltro, abaAtiva === "rotas" && styles.textoFiltroAtivo]}>Rotas</Text>
            </Pressable>
          </View>

          {abaAtiva === "comentarios" ? (
            <>
              <Text style={styles.tituloRecentes}>Meus comentários recentes</Text>
              {!carregando && comentarios.length === 0 ? <Text style={styles.vazio}>Você ainda não publicou comentários.</Text> : null}
              {comentarios.map((item) => (
                <View key={item.id} style={styles.cardComentario}>
                  <View style={styles.linhaComentario}>
                    <Text style={styles.zona}>{item.zona}</Text>
                    <Text style={styles.data}>{formatarData(item.dataCriacao)}</Text>
                  </View>
                  <Text style={styles.textoComentario}>{item.comentario}</Text>
                  <Text style={styles.apelido}>Publicado como {item.nomeAutor}</Text>
                </View>
              ))}
            </>
          ) : (
            <>
              <Text style={styles.tituloRecentes}>Minhas rotas salvas</Text>
              {!carregando && rotas.length === 0 ? <Text style={styles.vazio}>Você ainda não salvou rotas.</Text> : null}
              {rotas.map((item) => (
                <View key={item.id} style={styles.cardRota}>
                  <Text style={styles.nomeRota}>{item.nome}</Text>
                  <Text style={styles.enderecoRota}>{item.origem} → {item.destino}</Text>
                  {item.disponivelOffline ? <Text style={styles.rotaOffline}>Download registrado na conta</Text> : null}
                </View>
              ))}
            </>
          )}

          <Pressable accessibilityRole="button" onPress={sair} style={styles.botaoSair}>
            <Text style={styles.textoBotaoSair}>Sair da conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatarData(valor: string) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "" : data.toLocaleDateString("pt-BR");
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#f8f8ff", flex: 1 },
  conteudo: { flexGrow: 1 },
  cabecalho: { backgroundColor: "#8b0000", minHeight: 280, paddingHorizontal: 18, paddingTop: 18 },
  voltar: { alignItems: "center", borderRadius: 21, height: 42, justifyContent: "center", width: 42 },
  iconeVoltar: { height: 22, resizeMode: "contain", tintColor: "#ffffff", width: 32 },
  resumoPerfil: { alignItems: "flex-start", marginTop: 36, paddingHorizontal: 18 },
  avatar: { alignItems: "center", backgroundColor: "#ffffff", borderRadius: 38, height: 76, justifyContent: "center", width: 76 },
  inicial: { color: "#8b0000", fontSize: 32, fontWeight: "800" },
  nome: { color: "#ffffff", fontSize: 19, fontWeight: "800", marginTop: 12 },
  meta: { color: "#ffffff", fontSize: 14, marginTop: 4, opacity: 0.92 },
  painel: { backgroundColor: "#f8f8ff", borderTopLeftRadius: 28, borderTopRightRadius: 28, flex: 1, marginTop: -24, minHeight: 330, padding: 24 },
  titulo: { color: "#1f2937", fontSize: 24, fontWeight: "800" },
  descricao: { color: "#6b7280", fontSize: 15, lineHeight: 21, marginTop: 6 },
  carregando: { marginTop: 20 },
  erro: { color: "#b91c1c", marginTop: 16 },
  tituloRecentes: { color: "#1f2937", fontSize: 18, fontWeight: "800", marginTop: 26 },
  filtros: { flexDirection: "row", gap: 8, marginTop: 22 },
  filtro: { alignItems: "center", backgroundColor: "#ffffff", borderColor: "#e1e4e8", borderRadius: 18, borderWidth: 1, flex: 1, paddingHorizontal: 13, paddingVertical: 9 },
  filtroAtivo: { backgroundColor: "#8b0000", borderColor: "#8b0000" },
  textoFiltro: { color: "#4b5563", fontSize: 13, fontWeight: "700" },
  textoFiltroAtivo: { color: "#ffffff" },
  vazio: { color: "#6b7280", fontSize: 14, marginTop: 12 },
  cardComentario: { backgroundColor: "#ffffff", borderRadius: 14, marginTop: 12, padding: 15 },
  linhaComentario: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  zona: { color: "#8b0000", flex: 1, fontSize: 14, fontWeight: "800", paddingRight: 8 },
  data: { color: "#6b7280", fontSize: 12 },
  textoComentario: { color: "#1f2937", fontSize: 15, lineHeight: 21, marginTop: 8 },
  apelido: { color: "#6b7280", fontSize: 12, marginTop: 9 },
  cardRota: { backgroundColor: "#ffffff", borderRadius: 14, marginTop: 12, padding: 15 },
  nomeRota: { color: "#1f2937", fontSize: 15, fontWeight: "800" },
  enderecoRota: { color: "#626b75", fontSize: 13, lineHeight: 18, marginTop: 5 },
  rotaOffline: { color: "#24823b", fontSize: 12, fontWeight: "700", marginTop: 7 },
  botaoSair: { alignItems: "center", backgroundColor: "#8b0000", borderRadius: 24, justifyContent: "center", marginBottom: 22, marginTop: 26, minHeight: 50 },
  textoBotaoSair: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
});
