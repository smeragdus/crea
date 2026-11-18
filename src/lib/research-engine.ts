import { z } from "zod";

export const RESEARCH_SAMPLE_SIZE = 36;
export const QUESTION_COUNT = 18;
export const VALID_PARTICIPANT_CODES = Array.from(
  { length: RESEARCH_SAMPLE_SIZE },
  (_, index) => "REST-CAJ-" + String(index + 1).padStart(2, "0"),
);
export const interventionModules = ["Diagnóstico", "Comparador", "Simulador", "Obligaciones", "Reportes", "Guías", "Crea IA"] as const;
export const stages = ["pretest", "postest"] as const;
export type StudyStage = typeof stages[number];

const questionSchema = z.strictObject({
  prompt: z.string().trim().min(1).max(1500),
  options: z.array(z.string().trim().min(1).max(550)).min(2).max(6),
  correctIndex: z.number().int().min(0).max(5),
  points: z.number().gt(0).max(100),
}).refine(({ options, correctIndex }) => correctIndex < options.length && new Set(options).size === options.length, "Revisa las opciones y la clave.");

export const approvedInstrumentSchema = z.strictObject({
  version: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{2,59}$/),
  consentVersion: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{2,59}$/),
  consentText: z.string().trim().min(50).max(16000),
  validationDate: z.iso.date(),
  scoringSummary: z.string().trim().min(5).max(1500),
  questions: z.array(questionSchema).length(QUESTION_COUNT),
});

export type ApprovedInstrument = z.infer<typeof approvedInstrumentSchema>;
export type ParticipantInstrument = Omit<ApprovedInstrument, "questions" | "scoringSummary"> & {
  questions: Array<{ prompt: string; options: string[] }>;
};
export type AnswerKey = { scoringSummary: string; correctIndices: number[]; points: number[] };
export type PairedScore = { participantCode: string; version: string; pretest: number; postest: number; maximum: number };

export function isValidParticipantCode(code: string) {
  return VALID_PARTICIPANT_CODES.includes(code);
}

export function splitInstrument(data: ApprovedInstrument) {
  const { questions, scoringSummary, ...versioned } = approvedInstrumentSchema.parse(data);
  return {
    participant: { ...versioned, questions: questions.map(({ prompt, options }) => ({ prompt, options })) } satisfies ParticipantInstrument,
    key: { scoringSummary, correctIndices: questions.map(({ correctIndex }) => correctIndex), points: questions.map(({ points }) => points) } satisfies AnswerKey,
  };
}

export function scoreAnswers(answers: number[], key: AnswerKey) {
  if (answers.length !== QUESTION_COUNT || key.correctIndices.length !== QUESTION_COUNT || key.points.length !== QUESTION_COUNT) {
    throw new Error("Las respuestas y la clave deben corresponder a los 18 ítems.");
  }
  return Math.round(answers.reduce((sum, option, index) => sum + (option === key.correctIndices[index] ? key.points[index] : 0), 0) * 1e6) / 1e6;
}

export function researchCsv(pairs: PairedScore[]) {
  return [
    "Codigo,Version,Pretest,Postest,Diferencia,Maximo",
    ...pairs.map(({ participantCode, version, pretest, postest, maximum }) => [
      participantCode, version, pretest, postest, Math.round((postest - pretest) * 1e6) / 1e6, maximum,
    ].join(",")),
  ].join("\r\n");
}
