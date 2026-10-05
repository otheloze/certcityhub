import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StemBlocks } from "../../../src/components/stem-blocks";
import { colors, ErrorText, LoadingScreen, Muted, PrimaryButton, SecondaryButton } from "../../../src/components/ui";
import {
  AnswerFeedback,
  Attempt,
  AttemptQuestionView,
  ExamVersionConfig,
  checkAttemptAnswer,
  fetchAttempt,
  fetchAttemptQuestions,
  fetchExamVersion,
  saveAttemptAnswer,
  setAttemptReviewFlag,
  submitAttempt,
} from "../../../src/lib/api-client";
import { useAuth } from "../../../src/lib/auth-context";

const LOW_TIME_SECONDS = 300;

function formatRemaining(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export default function AttemptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, ready } = useAuth();
  const insets = useSafeAreaInsets();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [config, setConfig] = useState<ExamVersionConfig | null>(null);
  const [examTitle, setExamTitle] = useState("Exam");
  const [questions, setQuestions] = useState<AttemptQuestionView[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, AnswerFeedback>>({});
  const [checking, setChecking] = useState(false);

  const submit = useCallback(async () => {
    if (!token || submitting) return;
    setSubmitting(true);
    try {
      await submitAttempt(token, id);
    } finally {
      router.replace(`/attempts/${id}/result`);
    }
  }, [token, id, submitting, router]);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const fetchedAttempt = await fetchAttempt(token!, id);
        if (fetchedAttempt.status !== "IN_PROGRESS") {
          router.replace(`/attempts/${id}/result`);
          return;
        }
        const [fetchedVersion, fetchedQuestions] = await Promise.all([
          fetchExamVersion(fetchedAttempt.examVersionId),
          fetchAttemptQuestions(token!, id),
        ]);
        if (cancelled) return;
        setAttempt(fetchedAttempt);
        setConfig(fetchedVersion.config);
        if (fetchedVersion.exam?.title) setExamTitle(fetchedVersion.exam.title);
        setQuestions(fetchedQuestions);
        setRemainingSeconds((new Date(fetchedAttempt.expiresAt).getTime() - Date.now()) / 1000);
      } catch {
        if (!cancelled) setError("Could not load this exam attempt.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, ready]);

  useEffect(() => {
    if (remainingSeconds === null) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return prev;
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          submit();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds !== null]);

  const current = questions[currentIndex];
  const isPractice = attempt?.mode === "PRACTICE";
  const allowBack = isPractice || (config?.navigation.allowBackNavigation ?? true);
  const allowChanges = isPractice || (config?.navigation.allowAnswerChanges ?? true);
  const allowReview = config?.navigation.allowMarkForReview ?? true;
  const isLocked = !allowChanges && current?.answer != null;

  const answeredCount = questions.filter((q) => q.answer != null).length;
  const flaggedCount = questions.filter((q) => q.markedForReview).length;
  const unansweredCount = questions.length - answeredCount;

  async function saveResponse(responseData: Record<string, unknown>) {
    if (!token || !current) return;
    const questionId = current.id;
    const previousAnswer = current.answer;
    setError(null);
    setFeedback((prev) => {
      const { [questionId]: _stale, ...rest } = prev;
      return rest;
    });
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, answer: responseData } : q)));
    try {
      await saveAttemptAnswer(token, id, current.questionId, responseData);
    } catch {
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, answer: previousAnswer } : q)));
      setError("Could not save your answer. Check your connection and try again.");
    }
  }

  async function checkCurrent() {
    if (!token || !current) return;
    setChecking(true);
    setError(null);
    try {
      const result = await checkAttemptAnswer(token, id, current.questionId);
      setFeedback((prev) => ({ ...prev, [current.id]: result }));
    } catch {
      setError("Could not check your answer. Make sure you have answered, then try again.");
    } finally {
      setChecking(false);
    }
  }

  async function toggleReview() {
    if (!token || !current || !allowReview) return;
    const questionId = current.id;
    const previous = current.markedForReview;
    const marked = !previous;
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, markedForReview: marked } : q)));
    try {
      await setAttemptReviewFlag(token, id, current.questionId, marked);
    } catch {
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, markedForReview: previous } : q)));
      setError("Could not update the review flag.");
    }
  }

  function goTo(index: number) {
    if (index < 0 || index >= questions.length) return;
    if (!allowBack && index < currentIndex) return;
    setCurrentIndex(index);
  }

  function confirmSubmit() {
    const parts = [`Answered ${answeredCount} of ${questions.length} questions.`];
    if (unansweredCount > 0) parts.push(`${unansweredCount} unanswered.`);
    if (flaggedCount > 0) parts.push(`${flaggedCount} flagged for review.`);
    if (!isPractice) parts.push("You can't change your answers after submitting.");
    Alert.alert(
      isPractice ? "Finish this practice session?" : "Submit your exam?",
      parts.join(" "),
      [
        { text: "Keep working", style: "cancel" },
        { text: isPractice ? "Finish and see results" : "Submit exam", style: "destructive", onPress: submit },
      ],
    );
  }

  if (loading) return <LoadingScreen label="Loading your exam…" />;
  if (error && !attempt) {
    return (
      <View style={styles.center}>
        <ErrorText>{error}</ErrorText>
      </View>
    );
  }
  if (!current) {
    return (
      <View style={styles.center}>
        <ErrorText>This exam has no questions.</ErrorText>
      </View>
    );
  }

  const low = remainingSeconds !== null && remainingSeconds <= LOW_TIME_SECONDS;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const isLast = currentIndex === questions.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.topbar}>
        <Text style={styles.examTitle} numberOfLines={1}>
          {examTitle} · {isPractice ? "Practice" : "Simulation"}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.topbarRow}>
          <Muted>
            {answeredCount} / {questions.length} answered
          </Muted>
          <Text style={[styles.timer, low && { color: colors.danger }]}>
            ⏱ {remainingSeconds !== null ? formatRemaining(remainingSeconds) : "--:--"}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.palette} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {questions.map((q, index) => (
          <Pressable
            key={q.id}
            onPress={() => goTo(index)}
            disabled={!allowBack && index < currentIndex}
            style={[
              styles.paletteItem,
              index === currentIndex && styles.paletteCurrent,
              q.answer != null && styles.paletteAnswered,
              q.markedForReview && styles.paletteFlagged,
            ]}
          >
            <Text style={styles.paletteText}>{index + 1}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}>
        {error ? <ErrorText>{error}</ErrorText> : null}

        <View style={styles.qMeta}>
          <Muted>
            Question {currentIndex + 1} of {questions.length}
          </Muted>
          {allowReview ? (
            <View style={styles.flagRow}>
              <Muted>Flag for review</Muted>
              <Switch value={current.markedForReview} onValueChange={toggleReview} />
            </View>
          ) : null}
        </View>

        <StemBlocks blocks={current.stem.blocks} />

        <QuestionInput key={current.id} question={current} disabled={isLocked} onAnswer={saveResponse} />

        {isLocked ? <Muted>Your answer is locked for this exam.</Muted> : null}

        {isPractice ? (
          <View style={{ gap: 8 }}>
            <SecondaryButton title={checking ? "Checking…" : "Check answer"} onPress={checkCurrent} disabled={checking || current.answer == null} />
            {feedback[current.id] ? <FeedbackPanel feedback={feedback[current.id]} /> : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.bottombar, { paddingBottom: Math.max(12, insets.bottom) }]}>
        <SecondaryButton title="← Previous" onPress={() => goTo(currentIndex - 1)} disabled={!allowBack || currentIndex === 0} />
        {!isLast ? (
          <SecondaryButton title="Next →" onPress={() => goTo(currentIndex + 1)} />
        ) : (
          <View style={{ flex: 1 }}>
            <PrimaryButton title={isPractice ? "Finish practice" : "Submit exam"} onPress={confirmSubmit} disabled={submitting} />
          </View>
        )}
      </View>
    </View>
  );
}

function QuestionInput({
  question,
  disabled,
  onAnswer,
}: {
  question: AttemptQuestionView;
  disabled: boolean;
  onAnswer: (responseData: Record<string, unknown>) => void;
}) {
  const optionLabel = (blocks: { type: string; text?: string }[]) => blocks.map((b) => b.text ?? "").join(" ");
  // Declared unconditionally: this component remounts per-question (see the
  // `key={current.id}` on its call site), so each mounted instance only ever
  // renders one branch below - but the hooks themselves must still be called
  // on every render of that instance, not behind the type checks.
  const [numericText, setNumericText] = useState(question.answer?.value !== undefined ? String(question.answer?.value) : "");
  const [shortText, setShortText] = useState((question.answer?.text as string) ?? "");

  if (question.type === "SINGLE_CHOICE" || question.type === "TRUE_FALSE") {
    const selected = (question.answer?.optionLabel as string) ?? "";
    return (
      <View style={{ gap: 8 }}>
        {question.options?.map((option, i) => (
          <Pressable
            key={option.label}
            disabled={disabled}
            onPress={() => onAnswer({ optionLabel: option.label })}
            style={[styles.option, selected === option.label && styles.optionSelected]}
          >
            <Text style={styles.optionKey}>{question.type === "TRUE_FALSE" ? (option.label === "True" ? "T" : "F") : String.fromCharCode(65 + i)}</Text>
            <Text style={styles.optionText}>{optionLabel(option.content.blocks)}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  if (question.type === "MULTIPLE_CHOICE") {
    const selected = ((question.answer?.optionLabels as string[]) ?? []) as string[];
    return (
      <View style={{ gap: 8 }}>
        <Muted>Select all that apply.</Muted>
        {question.options?.map((option, i) => {
          const isSelected = selected.includes(option.label);
          return (
            <Pressable
              key={option.label}
              disabled={disabled}
              onPress={() => {
                const next = isSelected ? selected.filter((l) => l !== option.label) : [...selected, option.label];
                onAnswer({ optionLabels: next });
              }}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              <Text style={styles.optionKey}>{String.fromCharCode(65 + i)}</Text>
              <Text style={styles.optionText}>{optionLabel(option.content.blocks)}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (question.type === "NUMERIC") {
    return (
      <View style={{ gap: 6 }}>
        <Muted>Your answer (number)</Muted>
        <TextInput
          value={numericText}
          editable={!disabled}
          keyboardType="numeric"
          onChangeText={setNumericText}
          onBlur={() => {
            const parsed = Number(numericText);
            if (!Number.isNaN(parsed) && numericText !== "") onAnswer({ value: parsed });
          }}
          style={styles.textInput}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      <Muted>Your answer</Muted>
      <TextInput
        value={shortText}
        editable={!disabled}
        onChangeText={setShortText}
        onBlur={() => {
          if (shortText.trim() !== "") onAnswer({ text: shortText });
        }}
        style={styles.textInput}
      />
    </View>
  );
}

function describeCorrect(feedback: AnswerFeedback): string | null {
  const { correct } = feedback;
  if (correct.optionLabels && correct.optionLabels.length > 0) return `Correct answer: ${correct.optionLabels.join(", ")}`;
  if (correct.value !== undefined) return `Correct answer: ${correct.value}${correct.tolerance ? ` (±${correct.tolerance})` : ""}`;
  if (correct.acceptedAnswers && correct.acceptedAnswers.length > 0) {
    return `Accepted answer${correct.acceptedAnswers.length > 1 ? "s" : ""}: ${correct.acceptedAnswers.join(", ")}`;
  }
  return null;
}

function FeedbackPanel({ feedback }: { feedback: AnswerFeedback }) {
  const correctText = describeCorrect(feedback);
  return (
    <View style={[styles.feedback, { borderColor: feedback.isCorrect ? colors.good : colors.danger }]}>
      <Text style={{ color: feedback.isCorrect ? colors.good : colors.danger, fontWeight: "700" }}>
        {feedback.isCorrect ? "✓ Correct" : feedback.fraction > 0 ? "◐ Partly correct" : "✕ Not quite"}
      </Text>
      {!feedback.isCorrect && correctText ? <Muted>{correctText}</Muted> : null}
      {feedback.explanation
        ? feedback.explanation.blocks.map((b, i) => (b.type === "text" && b.text ? <Muted key={i}>{b.text}</Muted> : null))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, padding: 20 },
  topbar: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, padding: 12, gap: 8 },
  examTitle: { color: colors.text, fontWeight: "700" },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: "#1c2740", overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: colors.primary },
  topbarRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  timer: { color: colors.text, fontWeight: "700" },
  palette: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 10 },
  paletteItem: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  paletteCurrent: { borderColor: colors.primary, borderWidth: 2 },
  paletteAnswered: { backgroundColor: "#12321f" },
  paletteFlagged: { borderColor: colors.warn },
  paletteText: { color: colors.text, fontWeight: "700", fontSize: 13 },
  qMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  flagRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: "#132036" },
  optionKey: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border,
    color: colors.text,
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "700",
    fontSize: 12,
  },
  optionText: { color: colors.text, flex: 1, fontSize: 15 },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: "#0e1626",
  },
  feedback: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  bottombar: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
});
