"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LinkButton, Notice, PageHeading } from "@/components/ui/primitives";
import { useSession } from "@/features/auth/session";
import { useUnfinishedAssessment } from "./assessment-entry";
import { activities, assessmentFieldLabels, assessmentFields, choices, emptyDraft, fromBusinessContext, regimes, registration, relevantAssessmentFields, toBusinessContext, validateAssessmentStep, type AssessmentDraft, type AssessmentField } from "./assessment";
import { ChoiceField, SelectField, TextField } from "./assessment-fields";
import { limaDay, readAssessment, readDraft, saveAssessment, storeDraft, type AssessmentSnapshot, type DraftSnapshot } from "./session-storage";

const steps = [
  { label: "Tu restaurante", description: "Empieza por el régimen de tu restaurante y cuéntanos cómo está registrado." },
  { label: "Ventas y compras", description: "Usa los datos de 2026. Deja en blanco los montos que no conozcas y escribe 0 si el total fue cero." },
  { label: "Cómo operas", description: "Estas respuestas ayudan a revisar las opciones que siguen abiertas. Puedes dejar en blanco los datos que no conozcas." },
  { label: "Revisa tus datos", description: "Comprueba tus respuestas antes de ver el diagnóstico." },
];

const diagnosisHref = "/negocios?seccion=diagnostico";
const reviewStep = steps.length - 1;
type Edit = { fields: AssessmentField[]; original: AssessmentDraft; returnToDiagnosis?: boolean };
type Errors = ReturnType<typeof validateAssessmentStep>;

export function BusinessWizard() {
  const { user, loading } = useSession();
  const search = useSearchParams();
  const editing = search.get("editar") === "1";
  const requested = search.get("campo");
  const requestedField = assessmentFields.flat().find((field) => field === requested);

  return <AssessmentEditor key={JSON.stringify([loading, user?.uid, editing, requestedField])} loading={loading} uid={user?.uid} requestedField={requestedField} editing={editing} />;
}

function AssessmentEditor({ loading, uid, requestedField, editing }: { loading: boolean; uid?: string; requestedField?: AssessmentField; editing: boolean }) {
  const [initial, setInitial] = useState<{ snapshot?: AssessmentSnapshot; restored?: DraftSnapshot }>();
  useEffect(() => {
    if (loading) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      if (editing) setInitial({ snapshot: readAssessment(uid) ?? undefined });
      else setInitial({ restored: readDraft(uid) ?? undefined });
    });
    return () => { active = false; };
  }, [loading, editing, uid]);

  if (loading || !initial) return <div className="container-site page-shell"><p role="status">Cargando evaluación…</p></div>;
  if (editing && !initial.snapshot) return <div className="container-site page-shell">
    <PageHeading title="Abre una evaluación para editarla" description="Puedes volver a tus evaluaciones o comenzar una nueva." />
    <LinkButton href={diagnosisHref}>Volver a mis evaluaciones</LinkButton>
  </div>;
  return <Wizard uid={uid} previous={initial.snapshot} restored={initial.restored} requestedField={requestedField} />;
}

function Wizard({ uid, previous, restored, requestedField }: { uid?: string; previous?: AssessmentSnapshot; restored?: DraftSnapshot; requestedField?: AssessmentField }) {
  const router = useRouter();
  const unfinished = useUnfinishedAssessment();
  const [draft, setDraft] = useState<AssessmentDraft>(() => previous ? fromBusinessContext(previous.context) : { ...emptyDraft, ...restored?.answers });
  const [step, setStep] = useState(() => {
    if (previous) return reviewStep;
    if (!restored) return 0;
    const visible = relevantAssessmentFields(draft);
    const restoredStep = assessmentFields[restored.step];
    return restoredStep?.some((field) => visible.includes(field)) ? restored.step : reviewStep;
  });
  const [edit, setEdit] = useState<Edit | null>(() => requestedField && relevantAssessmentFields(draft).includes(requestedField)
    ? { fields: [requestedField], original: draft, returnToDiagnosis: true } : null);
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<AssessmentField | null>(null);
  const moved = useRef(Boolean(edit));
  const visible = relevantAssessmentFields(draft);
  const activeSteps = steps.map((_, index) => index).filter((index) => assessmentFields[index].some((field) => visible.includes(field)));
  const chapter = activeSteps.indexOf(step);

  useEffect(() => {
    if (previous) return;
    const answers = edit?.original ?? draft;
    if (Object.values(answers).some(Boolean)) storeDraft({ answers, step }, uid);
    else storeDraft(null, uid);
  }, [draft, edit, previous, step, uid]);

  useEffect(() => {
    if (!moved.current) return;
    const trigger = returnFocus.current && document.getElementById("change-" + returnFocus.current);
    (trigger || heading.current)?.focus();
    returnFocus.current = null;
  }, [step, edit]);

  function update(key: AssessmentField, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function goTo(index: number) {
    moved.current = true;
    returnFocus.current = null;
    setErrors({});
    setStep(index);
  }

  function startEdit(field: AssessmentField) {
    moved.current = true;
    setErrors({});
    returnFocus.current = null;
    setEdit({ fields: [field], original: draft });
  }

  function endEdit(cancel: boolean) {
    if (!edit) return;
    if (cancel) setDraft(edit.original);
    returnFocus.current = edit.fields[0];
    setEdit(null);
    setErrors({});
  }

  function finish() {
    try {
      const context = toBusinessContext(draft, previous?.context);
      saveAssessment({
        id: previous?.id ?? crypto.randomUUID(),
        context,
        date: previous?.date ?? limaDay(new Date()),
        demo: previous?.demo,
      }, uid);
      if (!previous) storeDraft(null, uid);
      router.push(diagnosisHref);
    } catch {
      setFailure("Habilita el almacenamiento de sesión del navegador para poder abrir el diagnóstico.");
    }
  }

  function focusField(field: AssessmentField) {
    requestAnimationFrame(() => document.getElementById(field)?.focus());
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (edit) {
      const before = relevantAssessmentFields(edit.original);
      const issues = Object.assign({}, ...activeSteps.map((index) => validateAssessmentStep(draft, index, visible))) as Errors;
      const invalid = Object.keys(issues) as AssessmentField[];
      const additional = visible.filter((field) => !edit.fields.includes(field)
        && ((!before.includes(field) && (!draft[field] || draft[field] === "unknown")) || invalid.includes(field)));
      if (additional.length) {
        setEdit({ ...edit, fields: [...edit.fields, ...additional] });
        setErrors(issues);
        focusField(invalid[0] ?? additional[0]);
        return;
      }
      if (invalid[0]) {
        setErrors(issues);
        focusField(invalid[0]);
        return;
      }
      if (edit.returnToDiagnosis) finish();
      else endEdit(false);
      return;
    }

    const nextErrors = validateAssessmentStep(draft, step, visible);
    const invalid = Object.keys(nextErrors)[0] as AssessmentField | undefined;
    if (invalid) {
      setErrors(nextErrors);
      focusField(invalid);
      return;
    }
    if (step !== reviewStep) {
      goTo(activeSteps[chapter + 1]);
      return;
    }
    for (const index of activeSteps) {
      const issues = validateAssessmentStep(draft, index, visible);
      const field = Object.keys(issues)[0] as AssessmentField | undefined;
      if (field) {
        goTo(index);
        setErrors(issues);
        focusField(field);
        return;
      }
    }
    finish();
  }

  const currentFields = edit ? edit.fields.filter((field, index) => index === 0 || visible.includes(field))
    : assessmentFields[step].filter((field) => visible.includes(field));
  const field = (id: AssessmentField) => <Question key={id} id={id} value={draft[id]} error={errors[id]} onChange={(value) => update(id, value)} />;

  return <div className="container-site page-shell">
    <PageHeading title={previous ? "Actualiza tu evaluación" : "Evalúa tu restaurante"}
      description={previous ? previous.context.businessName || undefined : restored ? "Tu borrador se recuperó en esta pestaña." : undefined}
      actions={!previous && !edit && unfinished && <LinkButton href="/" variant="ghost">Pausar evaluación</LinkButton>} />
    <div className="wizard-grid">
      <nav className="wizard-nav" aria-label="Progreso de la evaluación">
        <ol className="wizard-progress">
          {activeSteps.map((index) => <li key={index} className={index < step ? "step-done" : undefined} aria-current={index === step ? "step" : undefined}>
            <span className="step-number">{index < step ? <Check size={16} aria-label="Completado" /> : activeSteps.indexOf(index) + 1}</span> {steps[index].label}
          </li>)}
        </ol>
      </nav>
      <Card className="p-5 sm:p-8">
        <form onSubmit={submit} noValidate className="grid gap-7">
          <div key={edit ? "edit-" + edit.fields[0] : step} className="flow-step">
            {!edit && <>
              <p className="eyebrow mb-2">Paso {chapter + 1} de {activeSteps.length}</p>
              <div className="step-track" aria-hidden="true">
                {activeSteps.map((index) => <span key={index} data-reached={index <= step} />)}
              </div>
            </>}
            <h2 ref={heading} tabIndex={-1} className="editorial-title">{edit ? "Cambiar " + assessmentFieldLabels[edit.fields[0]].toLowerCase() : steps[step].label}</h2>
            <p className="mt-2 text-muted-foreground">{edit
              ? (edit.returnToDiagnosis ? "Al guardar verás tu diagnóstico actualizado." : "Al guardar volverás a la revisión.")
              : steps[step].description}</p>
          </div>
          {edit ? <>
            {field(currentFields[0])}
            {currentFields.length > 1 && <section className="grid gap-5 rounded-lg border border-border p-4">
              <h3 className="font-bold">Datos relacionados con el cambio</h3>
              {currentFields.slice(1).map(field)}
            </section>}
          </> : step === reviewStep ? <>
            <Review draft={draft} visible={visible} edit={startEdit} />
            {field("name")}
          </> : step === 1 ? <>
            <div className="grid gap-5 sm:grid-cols-2">{currentFields.slice(0, 2).map(field)}</div>
            {currentFields.length > 2 && <section className="grid gap-4 rounded-lg bg-muted p-4 sm:p-5">
              <div><h3 className="font-bold">Topes del Nuevo RUS</h3><p className="mt-1 text-sm text-muted-foreground">Indica el mes con más ventas y el mes con más compras. Pueden ser meses distintos.</p></div>
              <div className="grid gap-5 sm:grid-cols-2">{currentFields.slice(2).map(field)}</div>
            </section>}
          </> : currentFields.map(field)}
          {failure && <Notice tone="error">{failure}</Notice>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            {edit?.returnToDiagnosis || (previous && !edit) ? <LinkButton href={diagnosisHref} variant="ghost">Cancelar</LinkButton>
              : edit ? <Button type="button" variant="ghost" onClick={() => endEdit(true)}>Cancelar</Button>
                : chapter > 0 ? <Button type="button" variant="ghost" onClick={() => goTo(activeSteps[chapter - 1])}><ArrowLeft aria-hidden="true" /> Atrás</Button> : <span />}
            <Button type="submit">{edit ? "Guardar cambio" : step === reviewStep ? "Ver mi diagnóstico" : "Continuar"} <ArrowRight aria-hidden="true" /></Button>
          </div>
        </form>
      </Card>
    </div>
  </div>;
}

const numberQuestions = {
  annualSales: ["Ventas anuales", "Total del año. Si declaras IGV, usa las ventas netas sin IGV."],
  annualPurchases: ["Compras anuales", "Total anual de compras del negocio, sin devoluciones."],
  maxMonthlySales: ["Ventas del mes más alto", "Indica el total del mes de 2026 con más ventas."],
  maxMonthlyPurchases: ["Compras del mes más alto", "Indica el total del mes de 2026 con más compras."],
  locations: ["Número de locales o unidades de operación", "Incluye todos los espacios desde los que opera tu negocio."],
  assets: ["Valor de los equipos y muebles del negocio", "Incluye equipos y mobiliario de trabajo. Excluye terrenos, inmuebles y vehículos."],
  workers: ["Máximo de trabajadores en un turno", "Cuenta el turno con más personas. Si no tienes trabajadores, escribe 0."],
} as const;

type QuestionProps = { id: AssessmentField; value: string; error?: string; onChange: (value: string) => void };

function Question(props: QuestionProps) {
  switch (props.id) {
    case "name":
      return <TextField {...props} label="Nombre del restaurante (opcional)" maxLength={100} />;
    case "regime":
      return <SelectField {...props} label="¿En qué régimen estás inscrito?" hint="Consúltalo en tu ficha RUC. Puedes continuar si no lo sabes.">
        <option value="">Elige una opción</option>
        {regimes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </SelectField>;
    case "activity":
      return <ChoiceField {...props} label="¿A qué se dedica principalmente tu negocio?" options={activities} />;
    case "legal":
      return <ChoiceField {...props} label="¿Está registrado a tu nombre o como empresa?" options={registration} />;
    case "invoice":
      return <ChoiceField {...props} label="¿Emites o necesitas emitir facturas de venta?" options={choices} compact />;
    case "foreignBranch":
      return <ChoiceField {...props} label="¿Tu negocio es una sucursal, agencia o local de una empresa constituida fuera del Perú?" options={choices} compact />;
    case "linkage":
      return <ChoiceField {...props} label="¿Tu negocio está vinculado por capital a otras empresas y sus ingresos en conjunto superan 1 700 UIT al año?" hint="Si tu negocio es independiente, marca No. En 2026, 1 700 UIT equivalen a S/ 9 350 000." options={choices} compact />;
    default: {
      const [label, hint] = numberQuestions[props.id];
      const whole = props.id === "workers" || props.id === "locations";
      return <TextField {...props} label={label} hint={hint} numeric whole={whole} maxLength={whole ? 5 : 15} />;
    }
  }
}

function Review({ draft, visible, edit }: { draft: AssessmentDraft; visible: AssessmentField[]; edit: (field: AssessmentField) => void }) {
  const options = { activity: activities, legal: registration, regime: regimes, invoice: choices, linkage: choices, foreignBranch: choices };
  function value(field: AssessmentField) {
    if (field in options) return options[field as keyof typeof options].find(([key]) => key === draft[field])?.[1];
    if (!draft[field]) return;
    return field === "workers" || field === "locations" ? draft[field] : "S/ " + draft[field];
  }

  return <div className="grid gap-5">
    {assessmentFields.slice(0, reviewStep).map((group, index) => {
      const fields = group.filter((field) => visible.includes(field));
      if (!fields.length) return null;
      return <section key={steps[index].label} className="rounded-lg border border-border p-4">
        <h3 className="mb-2 font-bold">{steps[index].label}</h3>
        <dl className="divide-y divide-border">
          {fields.map((field) => <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1.5" key={field}>
            <dt className="text-sm text-muted-foreground">{assessmentFieldLabels[field]}</dt>
            <dd className="col-start-1 row-start-2 min-w-0 break-words font-semibold">{value(field) || "Sin indicar"}</dd>
            <dd className="col-start-2 row-span-2 row-start-1">
              <Button id={"change-" + field} type="button" variant="ghost" aria-label={"Cambiar " + assessmentFieldLabels[field].toLowerCase()} onClick={() => edit(field)}>Cambiar</Button>
            </dd>
          </div>)}
        </dl>
      </section>;
    })}
  </div>;
}
