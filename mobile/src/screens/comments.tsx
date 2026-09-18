import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Comentario = {
  id: number;
  zona: string;
  comentario: string;
  dataCriacao: string;
};

const imagens = {
  conta: require("../../assets/images/Account.png"),
  voltar: require("../../assets/images/Return.png"),
};

const API_BASE_URL =
  "http://localhost:3000";

export default function Comentarios({ navigation }: any) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [zona, setZona] = useState("");
  const [comentario, setComentario] = useState("");
  const [comentarioEmEdicao, setComentarioEmEdicao] = useState<number | null>(
    null,
  );
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregarComentarios = useCallback(async (mostrarCarregando = true) => {
    if (mostrarCarregando) {
      setCarregando(true);
    }

    try {
      const resposta = await fetch(`${API_BASE_URL}/comentarios`);

      if (!resposta.ok) {
        throw new Error("Falha ao buscar comentarios");
      }

      const dados = (await resposta.json()) as Comentario[];
      setComentarios(Array.isArray(dados) ? dados : []);
      setErro("");
    } catch {
      setErro("Não foi possível conectar ao servidor de avaliações.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarComentarios();
  }, [carregarComentarios]);

  const limparFormulario = () => {
    setZona("");
    setComentario("");
    setComentarioEmEdicao(null);
  };

  const salvarComentario = async () => {
    const zonaTratada = zona.trim();
    const comentarioTratado = comentario.trim();

    if (!zonaTratada || !comentarioTratado) {
      Alert.alert("Campos obrigatorios", "Preencha a zona e o comentario.");
      return;
    }

    setSalvando(true);

    try {
      const editando = comentarioEmEdicao !== null;
      const resposta = await fetch(
        editando
          ? `${API_BASE_URL}/comentarios/${comentarioEmEdicao}`
          : `${API_BASE_URL}/comentarios`,
        {
          method: editando ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            zona: zonaTratada,
            comentario: comentarioTratado,
          }),
        },
      );

      if (!resposta.ok) {
        throw new Error("Falha ao salvar comentario");
      }

      limparFormulario();
      await carregarComentarios(false);
    } catch {
      Alert.alert("Erro", "Nao foi possivel salvar o comentario.");
    } finally {
      setSalvando(false);
    }
  };

  const editarComentario = (item: Comentario) => {
    setComentarioEmEdicao(item.id);
    setZona(item.zona);
    setComentario(item.comentario);
  };

  const excluirComentario = async (id: number) => {
    try {
      const resposta = await fetch(`${API_BASE_URL}/comentarios/${id}`, {
        method: "DELETE",
      });

      if (!resposta.ok) {
        throw new Error("Falha ao excluir comentario");
      }

      if (comentarioEmEdicao === id) {
        limparFormulario();
      }

      await carregarComentarios(false);
    } catch {
      Alert.alert("Erro", "Nao foi possivel excluir o comentario.");
    }
  };

  const confirmarExclusao = (id: number) => {
    if (Platform.OS === "web") {
      const confirmar = (globalThis as { confirm?: (mensagem: string) => boolean })
        .confirm;

      if (!confirmar || confirmar("Deseja apagar este registro?")) {
        excluirComentario(id);
      }

      return;
    }

    Alert.alert("Excluir comentario", "Deseja apagar este registro?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => excluirComentario(id),
      },
    ]);
  };

  const atualizarLista = () => {
    setAtualizando(true);
    carregarComentarios(false);
  };

  const renderComentario = ({ item }: { item: Comentario }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.autor}>
          <View style={styles.avatar}><Image source={imagens.conta} style={styles.iconeConta} /></View>
          <View><Text style={styles.nomeAutor}>MB_337</Text><Text style={styles.data}>{formatarData(item.dataCriacao)}</Text></View>
        </View>
        <Text style={styles.zona}>{item.zona}</Text>
      </View>

      <Text style={styles.comentario}>{item.comentario}</Text>

      <View style={styles.cardActions}>
        <Pressable
          onPress={() => editarComentario(item)}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Editar</Text>
        </Pressable>

        <Pressable
          onPress={() => confirmarExclusao(item.id)}
          style={({ pressed }) => [
            styles.dangerButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.dangerButtonText}>Excluir</Text>
        </Pressable>
      </View>
    </View>
  );

  const listHeader = (
    <View>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar ao mapa"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Image source={imagens.voltar} style={styles.iconeVoltar} />
        </Pressable>
      </View>

      <Text style={styles.title}>Avaliações</Text>
      <Text style={styles.intro}>Compartilhe informações importantes para ajudar outras pessoas a se deslocarem com mais segurança.</Text>

      <View style={styles.formPanel}>
        <Text style={styles.formTitle}>
          {comentarioEmEdicao ? "Editar avaliação" : "Faça uma avaliação"}
        </Text>

        <TextInput
          autoCapitalize="sentences"
          onChangeText={setZona}
          placeholder="Zona"
          placeholderTextColor="#7b8794"
          style={styles.input}
          value={zona}
        />

        <TextInput
          multiline
          onChangeText={setComentario}
          placeholder="Comentario"
          placeholderTextColor="#7b8794"
          style={[styles.input, styles.textArea]}
          textAlignVertical="top"
          value={comentario}
        />

        <View style={styles.formActions}>
          {comentarioEmEdicao ? (
            <Pressable
              onPress={limparFormulario}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
          ) : null}

          <Pressable
            disabled={salvando}
            onPress={salvarComentario}
            style={({ pressed }) => [
              styles.saveButton,
              salvando && styles.disabledButton,
              pressed && styles.buttonPressed,
            ]}
          >
            {salvando ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>{comentarioEmEdicao ? "Salvar avaliação" : "Publicar avaliação"}</Text>
            )}
          </Pressable>
        </View>
      </View>

      {erro ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Suas avaliações</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <FlatList
          contentContainerStyle={styles.listContent}
          data={comentarios}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            carregando ? (
              <ActivityIndicator color="#c5283d" style={styles.loading} />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Nenhum registro ainda</Text>
                <Text style={styles.emptyText}>
                  Os comentarios cadastrados aparecem aqui.
                </Text>
              </View>
            )
          }
          ListHeaderComponent={listHeader}
          refreshControl={
            <RefreshControl
              colors={["#c5283d"]}
              onRefresh={atualizarLista}
              refreshing={atualizando}
              tintColor="#c5283d"
            />
          }
          renderItem={renderComentario}
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatarData(valor: string) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "";
  }

  return data.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f8ff",
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    gap: 14,
    paddingBottom: 28,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 18 : 8,
  },
  header: {
    flexDirection: "row",
    marginBottom: 22,
  },
  title: {
    color: "#1f2937",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 0,
  },
  intro: { color: "#6b7280", fontSize: 15, lineHeight: 21, marginTop: 6 },
  backButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 21,
    elevation: 7,
    height: 42,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: 42,
  },
  iconeVoltar: { height: 22, resizeMode: "contain", width: 22 },
  formPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    elevation: 4,
    marginTop: 22,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
  },
  formTitle: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#d7dee8",
    borderRadius: 14,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    marginTop: 10,
    minHeight: 112,
  },
  formActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 14,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#8b0000",
    borderRadius: 23,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 18,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0,
  },
  cancelButton: {
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 14,
  },
  cancelButtonText: {
    color: "#32404f",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0,
  },
  disabledButton: {
    opacity: 0.68,
  },
  buttonPressed: {
    opacity: 0.78,
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 12,
  },
  errorText: {
    color: "#7f1d1d",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0,
  },
  sectionTitle: {
    color: "#1f2937",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 2,
    marginTop: 28,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    elevation: 3,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 10,
  },
  autor: { alignItems: "center", flexDirection: "row", flex: 1 },
  avatar: { alignItems: "center", backgroundColor: "#d1d5db", borderRadius: 16, height: 32, justifyContent: "center", marginRight: 9, width: 32 },
  iconeConta: { height: 20, resizeMode: "contain", width: 20 },
  nomeAutor: { color: "#1f2937", fontSize: 14, fontWeight: "800" },
  zona: {
    backgroundColor: "#fbe3e3",
    borderRadius: 12,
    color: "#8b0000",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    maxWidth: "42%",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  data: {
    color: "#6b7280",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    textAlign: "right",
  },
  comentario: {
    color: "#1f2937",
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 23,
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 14,
  },
  secondaryButton: {
    backgroundColor: "#edf2f7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#32404f",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0,
  },
  dangerButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dangerButtonText: {
    color: "#9f1f2d",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0,
  },
  loading: {
    marginTop: 22,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    marginTop: 2,
    padding: 22,
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 6,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 20,
    textAlign: "center",
  },
});
