import { describe, expect, it } from "vitest";
import { approvedInstrumentSchema, isValidParticipantCode, QUESTION_COUNT, researchCsv, scoreAnswers, splitInstrument } from "./research-engine";

// Datos sintéticos exclusivos de pruebas.
const fixture = {
  version: "test-01",
  consentVersion: "test-01",
  consentText: "Consentimiento sintético para comprobar la separación de los datos en las pruebas.",
  validationDate: "2026-11-17",
  scoringSummary: "Un punto por opción válida en el fixture.",
  questions: Array.from({ length: QUESTION_COUNT }, (_, index) => ({
    prompt: "Ítem de prueba " + (index + 1), options: ["Opción fixture A", "Opción fixture B"], correctIndex: 0, points: 1,
  })),
};

describe("Instrumento académico de un solo grupo", () => {
  it("limita la asignación a 36 códigos y el instrumento a exactamente 18 preguntas cerradas", () => {
    expect(isValidParticipantCode("REST-CAJ-01")).toBe(true);
    expect(isValidParticipantCode("REST-CAJ-36")).toBe(true);
    expect(isValidParticipantCode("REST-CAJ-37")).toBe(false);
    expect(approvedInstrumentSchema.safeParse(fixture).success).toBe(true);
    expect(approvedInstrumentSchema.safeParse({ ...fixture, questions: [...fixture.questions, ...fixture.questions.slice(0, 2)] }).success).toBe(false);
    const badKey = [{ ...fixture.questions[0], correctIndex: 2 }, ...fixture.questions.slice(1)];
    expect(approvedInstrumentSchema.safeParse({ ...fixture, questions: badKey }).success).toBe(false);
  });

  it("separa la clave y exporta pares sin datos personales ni respuestas", () => {
    const { participant, key } = splitInstrument(fixture);
    expect(participant.questions[0]).toEqual({ prompt: fixture.questions[0].prompt, options: fixture.questions[0].options });
    expect(JSON.stringify(participant)).not.toMatch(/correctIndex|scoringSummary|points/);
    const pretest = scoreAnswers(Array.from({ length: QUESTION_COUNT }, (_, index) => index < 10 ? 0 : 1), key);
    const postest = scoreAnswers(Array(QUESTION_COUNT).fill(0), key);
    expect(researchCsv([{ participantCode: "REST-CAJ-01", version: "test-01", pretest, postest, maximum: 18 }])).toBe(
      "Codigo,Version,Pretest,Postest,Diferencia,Maximo\r\nREST-CAJ-01,test-01,10,18,8,18",
    );
    expect(() => scoreAnswers([0], key)).toThrow();
  });
});
