"use client";

import { useState } from "react";
import SetupScreen from "@/components/SetupScreen";
import QuizScreen from "@/components/QuizScreen";
import ResultScreen from "@/components/ResultScreen";
import { buildQuiz } from "@/lib/vocab";
import type { Answered, Question, QuizSettings } from "@/lib/types";

type View = "setup" | "quiz" | "result";

export default function Page() {
  const [view, setView] = useState<View>("setup");
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answered[]>([]);

  function startQuiz(s: QuizSettings) {
    setSettings(s);
    setQuestions(buildQuiz(s));
    setAnswers([]);
    setView("quiz");
  }

  function finishQuiz(a: Answered[]) {
    setAnswers(a);
    setView("result");
  }

  function retry() {
    if (!settings) return setView("setup");
    setQuestions(buildQuiz(settings)); // yeni rastgele sorular
    setAnswers([]);
    setView("quiz");
  }

  return (
    <main className="min-h-dvh">
      {view === "setup" && <SetupScreen onStart={startQuiz} />}
      {view === "quiz" && settings && (
        <QuizScreen
          questions={questions}
          seconds={settings.seconds}
          onFinish={finishQuiz}
          onExit={() => setView("setup")}
        />
      )}
      {view === "result" && (
        <ResultScreen
          questions={questions}
          answers={answers}
          onRetry={retry}
          onNew={() => setView("setup")}
        />
      )}
    </main>
  );
}
