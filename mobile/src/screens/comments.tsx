import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

const API_BASE_URL =
  "https://zona-vermelha-api.onrender.com";

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
      setErro("Nao foi possivel conectar ao backend.");
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
        <Text style={styles.zona}>{item.zona}</Text>
        <Text style={styles.data}>{formatarData(item.dataCriacao)}</Text>
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
          onPress={() => navigation.navigate("Home")}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>

        <Pressable
          onPress={atualizarLista}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.refreshButtonText}>Atualizar</Text>
        </Pressable>
      </View>

      <Text style={styles.kicker}>Zona Vermelha</Text>
      <Text style={styles.title}>Comentarios de risco</Text>

      <View style={styles.formPanel}>
        <Text style={styles.formTitle}>
          {comentarioEmEdicao ? "Editar registro" : "Novo registro"}
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
              <Text style={styles.saveButtonText}>
                {comentarioEmEdicao ? "Salvar" : "Adicionar"}
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      {erro ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Registros recentes</Text>
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
    backgroundColor: "#111827",
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    gap: 12,
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 28 : 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  kicker: {
    color: "#fca5a5",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 18,
    marginTop: 4,
  },
  backButton: {
    backgroundColor: "#273244",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0,
  },
  refreshButton: {
    backgroundColor: "#c5283d",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  refreshButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0,
  },
  formPanel: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 16,
  },
  formTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#d7dee8",
    borderRadius: 8,
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
    backgroundColor: "#c5283d",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 46,
    minWidth: 124,
    paddingHorizontal: 16,
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
    color: "#dbeafe",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 2,
    marginTop: 22,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 15,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 10,
  },
  zona: {
    backgroundColor: "#def7ec",
    borderRadius: 8,
    color: "#046c4e",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    maxWidth: "62%",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  data: {
    color: "#64748b",
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
    backgroundColor: "#f8fafc",
    borderRadius: 8,
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
