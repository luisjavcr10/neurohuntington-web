"use client";

import { supabase } from "@/lib/supabase";
import {
  generateMedicalPrompt,
  getChatGPTDiagnosis,
  getGeminiDiagnosis,
} from "@/services/aiService";
import {
  GeneralConsultation,
  LabResult,
  MedicalHistory,
  NeurologyAssessment,
  PatientProfile,
  TriageRecord,
} from "@/types/medical";
import {
  Activity,
  ActivitySquare,
  Brain,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  FlaskConical,
  Phone,
  Plus,
  Save,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import {
  FCForm,
  MMSEForm,
  MotorAssessmentForm,
  PBAForm,
} from "./neurology-tests-forms";

// --- SUB-COMPONENTS UI ---

const Accordion = ({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  color = "#2563eb",
}: any) => (
  <div className="mb-3 bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 bg-white border-l-4 transition-colors hover:bg-slate-50"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} color={color} />
        <span className="text-base font-bold text-slate-700">{title}</span>
      </div>
      {isOpen ? (
        <ChevronUp size={20} className="text-slate-400" />
      ) : (
        <ChevronDown size={20} className="text-slate-400" />
      )}
    </button>
    {isOpen && <div className="p-4 border-t border-slate-100">{children}</div>}
  </div>
);

const JsonResultsTable = ({
  data,
  level = 0,
}: {
  data: any;
  level?: number;
}) => {
  if (!data) return <span className="text-xs text-slate-400">Sin datos.</span>;
  if (typeof data !== "object")
    return <span className="text-sm text-slate-700">{String(data)}</span>;

  if (Array.isArray(data)) {
    if (data.length === 0)
      return <span className="text-xs text-slate-400">[ Vacío ]</span>;
    return (
      <div className="flex flex-col gap-1">
        {data.map((item, idx) => (
          <div key={idx} className="ml-2 pl-2 border-l-2 border-slate-300">
            <JsonResultsTable data={item} level={level + 1} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      {Object.entries(data).map(([key, value], index) => (
        <div
          key={key}
          className={`flex p-2 border-b border-slate-100 last:border-0 ${
            index % 2 === 0 ? "bg-slate-50" : ""
          }`}
        >
          <span
            className="font-bold text-slate-600 text-xs w-[40%] pr-2 uppercase"
            style={{ paddingLeft: level * 8 }}
          >
            {key.replace(/_/g, " ")}:
          </span>
          <div className="flex-1">
            <JsonResultsTable data={value} level={level + 1} />
          </div>
        </div>
      ))}
    </div>
  );
};

const LabResultItem = ({ lab }: { lab: LabResult }) => {
  const [expanded, setExpanded] = useState(false);
  const formattedDate = new Date(
    lab.analyzed_at || new Date()
  ).toLocaleDateString();

  return (
    <div className="mb-2 border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="text-left">
          <p className="font-bold text-violet-600 text-sm mb-0.5">{lab.type}</p>
          <p className="text-xs text-slate-400">{formattedDate}</p>
        </div>

        <div className="flex items-center gap-2">
          {lab.status ? (
            <div className="px-2 py-0.5 rounded-full bg-green-100">
              <span className="text-[10px] font-bold text-green-800">
                COMPLETADO
              </span>
            </div>
          ) : (
            <div className="px-2 py-0.5 rounded-full bg-yellow-50">
              <span className="text-[10px] font-bold text-yellow-800">
                PENDIENTE
              </span>
            </div>
          )}
          {expanded ? (
            <ChevronUp size={20} className="text-slate-400" />
          ) : (
            <ChevronDown size={20} className="text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-4 bg-white">
          <p className="text-xs font-bold text-slate-400 mb-1">Descripción:</p>
          <p className="text-sm text-slate-700 italic mb-3">
            "{lab.description}"
          </p>

          {lab.status ? (
            <>
              <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
                <JsonResultsTable data={lab.results_json} />
              </div>

              {lab.result_text && (
                <div className="bg-violet-50 p-3 rounded-lg mt-3">
                  <p className="text-xs text-violet-600 font-bold mb-1">
                    CONCLUSIÓN MÉDICA:
                  </p>
                  <p className="text-violet-800 text-sm font-semibold">
                    {lab.result_text}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-amber-600 italic text-xs">
                Esperando resultados del laboratorio...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LAB_TYPES = [
  "Bioquímica y Hematología",
  "Inmunología y Serología",
  "Microbiología y Parasitología",
  "Genética y Biología Molecular",
  "Urianálisis y Líquidos Corporales",
  "Endocrinología (Hormonas)",
];

const TestButton = ({ title, icon: Icon, score, onPress, color }: any) => (
  <button
    className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 border-l-4 hover:shadow-md transition-shadow group"
    style={{ borderLeftColor: color }}
    onClick={onPress}
  >
    <div className="flex items-center gap-3">
      <Icon size={24} color={color} />
      <div className="text-left">
        <p className="text-base font-bold text-slate-700 group-hover:text-slate-900">
          {title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Puntaje: {score !== undefined && score !== "" ? score : "---"}
        </p>
      </div>
    </div>
    <ChevronDown size={20} className="text-slate-400" />
  </button>
);

export default function ClinicalCaseDetail({
  caseId,
  patientId,
  onClose,
}: any) {
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [history, setHistory] = useState<MedicalHistory | null>(null);
  const [triage, setTriage] = useState<TriageRecord | null>(null);
  const [labResults, setLabResults] = useState<LabResult[]>([]);

  // Labs State
  const [showLabOrder, setShowLabOrder] = useState(false);
  const [newLabType, setNewLabType] = useState(LAB_TYPES[0]);
  const [newLabDesc, setNewLabDesc] = useState("");
  const [orderingLab, setOrderingLab] = useState(false);

  // Forms State
  const [anamnesis, setAnamnesis] = useState<GeneralConsultation>({
    id: "",
    reason_consultation: "",
    current_illness: "",
    family_history: "",
    pathological_history: "",
    physical_exam_notes: "",
  });

  const [neuroAssessment, setNeuroAssessment] = useState<NeurologyAssessment>({
    has_chorea: false,
    has_dystonia: false,
    has_bradykinesia: false,
    uhdrs_motor_score: "",
    mmse_score: "",
    pba_score: "",
    fc_score: "",
    clinical_notes: "",
    diagnosis: "",
    uhdrs_motor_info: {},
    mmse_info: {},
    pba_info: {},
    fc_info: {},
  });

  // Test Modals State
  const [activeTest, setActiveTest] = useState<
    "MOTOR" | "MMSE" | "PBA" | "FC" | null
  >(null);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    history: false,
    triage: false,
    anamnesis: false,
    labs: true,
    neuro: true,
  });
  const [aiThinking, setAiThinking] = useState(false);
  const [aiOptions, setAiOptions] = useState<{
    gpt: string;
    copilot: string;
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const patientPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", patientId)
        .single();
      const historyPromise = supabase
        .from("medical_histories")
        .select("*")
        .eq("patient_id", patientId)
        .single();
      const triagePromise = supabase
        .from("triage_records")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      const anamnesisPromise = supabase
        .from("general_consultations")
        .select("*")
        .eq("case_id", caseId)
        .single();
      const labsPromise = supabase
        .from("lab_results")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });
      const neuroPromise = supabase
        .from("neurology_assessments")
        .select("*")
        .eq("case_id", caseId)
        .single();

      const [
        patientRes,
        historyRes,
        triageRes,
        anamnesisRes,
        labsRes,
        neuroRes,
      ] = await Promise.all([
        patientPromise,
        historyPromise,
        triagePromise,
        anamnesisPromise,
        labsPromise,
        neuroPromise,
      ]);

      if (patientRes.data) setPatient(patientRes.data);
      if (historyRes.data) setHistory(historyRes.data);
      if (triageRes.data) setTriage(triageRes.data);
      if (anamnesisRes.data) setAnamnesis(anamnesisRes.data);
      if (labsRes.data) setLabResults(labsRes.data);
      if (neuroRes.data) setNeuroAssessment(neuroRes.data);
    } catch (error) {
      console.error("Error loading clinical case data:", error);
      alert("No se pudieron cargar todos los datos del caso.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId && patientId) loadData();
  }, [caseId, patientId]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveAnamnesis = async () => {
    try {
      const { error } = await supabase.from("general_consultations").upsert({
        id: anamnesis.id || undefined,
        case_id: caseId,
        reason_consultation: anamnesis.reason_consultation,
        current_illness: anamnesis.current_illness,
        family_history: anamnesis.family_history,
        pathological_history: anamnesis.pathological_history,
        physical_exam_notes: anamnesis.physical_exam_notes,
      });

      if (error) throw error;
      alert("Anamnesis guardada correctamente.");
    } catch (error) {
      console.error("Error saving anamnesis:", error);
      alert("No se pudo guardar la anamnesis.");
    }
  };

  // Generic function to save assessment updates
  const saveNeuroUpdate = async (updates: Partial<NeurologyAssessment>) => {
    try {
      const payload: any = {
        case_id: caseId,
        ...neuroAssessment, // current state
        ...updates, // new updates
      };

      // Clean undefineds
      if (!payload.id) delete payload.id;

      const { data, error } = await supabase
        .from("neurology_assessments")
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      setNeuroAssessment(data); // Update local state with saved data
      return true;
    } catch (error) {
      console.error("Error saving neuro assessment:", error);
      alert("No se pudo guardar la evaluación.");
      return false;
    }
  };

  const handleSaveTest = async (
    testType: string,
    scores: any,
    total: number
  ) => {
    let updates: Partial<NeurologyAssessment> = {};

    switch (testType) {
      case "MOTOR":
        updates = { uhdrs_motor_score: total, uhdrs_motor_info: scores };
        break;
      case "MMSE":
        updates = { mmse_score: total, mmse_info: scores };
        break;
      case "PBA":
        updates = { pba_score: total, pba_info: scores };
        break;
      case "FC":
        updates = { fc_score: total, fc_info: scores };
        break;
    }

    const success = await saveNeuroUpdate(updates);
    if (success) {
      setActiveTest(null);
      alert(`Evaluación ${testType} guardada con éxito.`);
    }
  };

  const saveFullNeuro = async () => {
    const success = await saveNeuroUpdate({
      clinical_notes: neuroAssessment.clinical_notes,
      diagnosis: neuroAssessment.diagnosis,
      has_chorea: neuroAssessment.has_chorea,
      has_dystonia: neuroAssessment.has_dystonia,
      has_bradykinesia: neuroAssessment.has_bradykinesia,
    });
    if (success) alert("Evaluación global guardada.");
  };

  const requestLabTest = async () => {
    if (!newLabDesc) {
      alert("Ingrese una descripción para el examen.");
      return;
    }
    setOrderingLab(true);
    try {
      const { error } = await supabase.from("lab_results").insert({
        case_id: caseId,
        type: newLabType,
        description: newLabDesc,
        status: false,
      });

      if (error) throw error;
      alert("El examen ha sido solicitado.");
      setShowLabOrder(false);
      setNewLabDesc("");
      const { data } = await supabase
        .from("lab_results")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });
      if (data) setLabResults(data);
    } catch (error) {
      console.error("Error requesting lab:", error);
      alert("No se pudo solicitar el examen.");
    } finally {
      setOrderingLab(false);
    }
  };

  // AI Logic
  const consultAI = async () => {
    setAiThinking(true);
    setAiOptions(null);

    try {
      // Calcular edad (aproximada si no hay DOB)
      const birthDate = new Date(patient?.birthday || "1980-01-01");
      const ageDiffJs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDiffJs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);

      // Generar Prompt
      const prompt = generateMedicalPrompt(
        `${patient?.first_name} ${patient?.last_name}`,
        age,
        labResults,
        neuroAssessment
      );

      console.log("Enviando Prompt a AI:", prompt);

      // Llamadas Paralelas
      const [gptRes, geminiRes] = await Promise.allSettled([
        getChatGPTDiagnosis(prompt),
        getGeminiDiagnosis(prompt),
      ]);

      setAiOptions({
        gpt:
          gptRes.status === "fulfilled"
            ? gptRes.value
            : "Error conectando con ChatGPT",
        copilot:
          geminiRes.status === "fulfilled"
            ? geminiRes.value
            : "Error conectando con Gemini",
      });
    } catch (error) {
      console.error("Error AI:", error);
      alert("Fallo al consultar los servicios de IA.");
    } finally {
      setAiThinking(false);
    }
  };

  const selectAiOption = (text: string) => {
    setNeuroAssessment((prev) => ({ ...prev, diagnosis: text }));
    setAiOptions(null);
    alert("El texto ha sido copiado al campo de diagnóstico final.");
  };

  if (loading)
    return (
      <div className="flex flex-1 justify-center items-center h-full">
        <span className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></span>
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="bg-slate-800 p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full border-2 border-white overflow-hidden bg-slate-200">
              {patient?.avatar_url ? (
                <Image
                  src={patient.avatar_url}
                  alt="Patient"
                  layout="fill"
                  objectFit="cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-400" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white leading-tight">
                {patient?.first_name} {patient?.last_name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Phone size={14} className="text-slate-300" />
                <span className="text-slate-300 text-sm">
                  {patient?.phone || "Sin teléfono"}
                </span>
              </div>
              <span className="text-slate-400 text-xs mt-0.5 block">
                DNI: {patient?.dni || "---"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-5xl mx-auto w-full">
        {/* 1. History */}
        <Accordion
          title="Historial Médico General"
          icon={FileText}
          isOpen={openSections["history"]}
          onToggle={() => toggleSection("history")}
          color="#64748b"
        >
          <p className="text-slate-500 mb-1">
            • Alergias: {history?.allergies?.join(", ") || "Ninguna"}
          </p>
          <p className="text-slate-500 mb-1">
            • Tipo de Sangre: {history?.blood_type || "Desconocido"}
          </p>
          <p className="text-slate-500">
            • Condiciones:{" "}
            {history?.chronic_conditions?.join(", ") || "Ninguna"}
          </p>
        </Accordion>

        {/* 2. Triage */}
        <Accordion
          title="Datos de Triaje"
          icon={Activity}
          isOpen={openSections["triage"]}
          onToggle={() => toggleSection("triage")}
          color="#ea580c"
        >
          {triage ? (
            <div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-orange-50 p-3 rounded-lg flex flex-col items-center">
                  <span className="text-orange-600 text-xs font-bold uppercase mb-1">
                    Presión
                  </span>
                  <span className="text-orange-800 text-lg font-bold">
                    {triage.systolic_pressure}/{triage.diastolic_pressure}
                  </span>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg flex flex-col items-center">
                  <span className="text-orange-600 text-xs font-bold uppercase mb-1">
                    Peso
                  </span>
                  <span className="text-orange-800 text-lg font-bold">
                    {triage.weight_kg} kg
                  </span>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg flex flex-col items-center">
                  <span className="text-orange-600 text-xs font-bold uppercase mb-1">
                    Temp
                  </span>
                  <span className="text-orange-800 text-lg font-bold">
                    {triage.temperature}°C
                  </span>
                </div>
              </div>
              {triage.notes && (
                <p className="mt-3 text-orange-700 text-sm italic">
                  {triage.notes}
                </p>
              )}
            </div>
          ) : (
            <span className="text-slate-400">Sin datos recientes.</span>
          )}
        </Accordion>

        {/* 3. Anamnesis */}
        <Accordion
          title="Anamnesis"
          icon={FileText}
          isOpen={openSections["anamnesis"]}
          onToggle={() => toggleSection("anamnesis")}
          color="#2563eb"
        >
          <label className="block text-xs font-bold text-slate-500 uppercase mt-2 mb-1">
            Motivo de Consulta
          </label>
          <textarea
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24"
            value={anamnesis.reason_consultation || ""}
            onChange={(e) =>
              setAnamnesis({
                ...anamnesis,
                reason_consultation: e.target.value,
              })
            }
          />

          <label className="block text-xs font-bold text-slate-500 uppercase mt-4 mb-1">
            Enfermedad Actual
          </label>
          <textarea
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24"
            value={anamnesis.current_illness || ""}
            onChange={(e) =>
              setAnamnesis({ ...anamnesis, current_illness: e.target.value })
            }
          />

          <div className="flex justify-end mt-3">
            <button
              onClick={saveAnamnesis}
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              Guardar Anamnesis
            </button>
          </div>
        </Accordion>

        {/* 4. Labs */}
        <Accordion
          title="Resultados de Laboratorio"
          icon={FlaskConical}
          isOpen={openSections["labs"]}
          onToggle={() => toggleSection("labs")}
          color="#7c3aed"
        >
          <button
            onClick={() => setShowLabOrder(true)}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white p-3 rounded-lg mb-4 transition-colors font-bold text-sm"
          >
            <Plus size={16} />
            Solicitar Nuevo Examen
          </button>
          {labResults.length > 0 ? (
            <div className="flex flex-col gap-2">
              {labResults.map((lab) => (
                <LabResultItem key={lab.id} lab={lab} />
              ))}
            </div>
          ) : (
            <span className="text-slate-400 italic">No hay resultados.</span>
          )}
        </Accordion>

        {/* 5. Neurology Assessment (Detailed) */}
        <Accordion
          title="Evaluación Neurológica"
          icon={Brain}
          isOpen={openSections["neuro"]}
          onToggle={() => toggleSection("neuro")}
          color="#0d9488"
        >
          {/* Botones de Tests Específicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <TestButton
              title="Evaluación Motora (UHDRS)"
              icon={ClipboardList}
              score={neuroAssessment.uhdrs_motor_score}
              color="#e11d48"
              onPress={() => setActiveTest("MOTOR")}
            />
            <TestButton
              title="Cognitivo (MMSE)"
              icon={Brain}
              score={neuroAssessment.mmse_score}
              color="#2563eb"
              onPress={() => setActiveTest("MMSE")}
            />
            <TestButton
              title="Conductual (PBA)"
              icon={ActivitySquare}
              score={neuroAssessment.pba_score}
              color="#d97706"
              onPress={() => setActiveTest("PBA")}
            />
            <TestButton
              title="Capacidad Funcional (TFC)"
              icon={UserCheck}
              score={neuroAssessment.fc_score}
              color="#059669"
              onPress={() => setActiveTest("FC")}
            />
          </div>

          {/* Checkbox Rapidos */}
          <label className="block text-xs font-bold text-slate-500 uppercase mt-4 mb-2">
            Observaciones Rápidas
          </label>
          <div className="flex flex-wrap gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                className="accent-teal-600 w-5 h-5 rounded"
                checked={neuroAssessment.has_chorea}
                onChange={(e) =>
                  setNeuroAssessment({
                    ...neuroAssessment,
                    has_chorea: e.target.checked,
                  })
                }
              />
              <span className="text-sm text-slate-700">Corea visible</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                className="accent-teal-600 w-5 h-5 rounded"
                checked={neuroAssessment.has_dystonia}
                onChange={(e) =>
                  setNeuroAssessment({
                    ...neuroAssessment,
                    has_dystonia: e.target.checked,
                  })
                }
              />
              <span className="text-sm text-slate-700">Distonía</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                className="accent-teal-600 w-5 h-5 rounded"
                checked={neuroAssessment.has_bradykinesia}
                onChange={(e) =>
                  setNeuroAssessment({
                    ...neuroAssessment,
                    has_bradykinesia: e.target.checked,
                  })
                }
              />
              <span className="text-sm text-slate-700">Bradicinesia</span>
            </label>
          </div>

          <label className="block text-xs font-bold text-slate-500 uppercase mt-4 mb-1">
            Notas Clínicas
          </label>
          <textarea
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none h-24 mb-4"
            placeholder="Observaciones generales..."
            value={neuroAssessment.clinical_notes || ""}
            onChange={(e) =>
              setNeuroAssessment({
                ...neuroAssessment,
                clinical_notes: e.target.value,
              })
            }
          />

          {/* AI Section */}
          <div className="bg-slate-800 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-yellow-400" />
              <span className="text-yellow-400 font-bold text-sm uppercase">
                Consultar Inteligencia Artificial
              </span>
            </div>

            {!aiThinking && !aiOptions && (
              <button
                onClick={consultAI}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-lg transition-colors"
              >
                Generar Diagnóstico Asistido
              </button>
            )}

            {aiThinking && (
              <div className="flex justify-center p-4">
                <span className="animate-spin h-6 w-6 border-2 border-yellow-400 rounded-full border-t-transparent"></span>
              </div>
            )}

            {aiOptions && (
              <div className="flex flex-col gap-3 mt-3">
                <button
                  onClick={() => selectAiOption(aiOptions.gpt)}
                  className="bg-slate-700 border border-slate-600 p-4 rounded-lg text-left hover:bg-slate-600 transition-colors"
                >
                  <span className="text-slate-400 text-[10px] font-bold uppercase block mb-2">
                    GPT-4o
                  </span>
                  <p className="text-slate-200 text-sm">{aiOptions.gpt}</p>
                </button>
                <button
                  onClick={() => selectAiOption(aiOptions.copilot)}
                  className="bg-slate-700 border border-slate-600 p-4 rounded-lg text-left hover:bg-slate-600 transition-colors"
                >
                  <span className="text-slate-400 text-[10px] font-bold uppercase block mb-2">
                    GEMINI
                  </span>
                  <p className="text-slate-200 text-sm">{aiOptions.copilot}</p>
                </button>
              </div>
            )}
          </div>

          <label className="block text-xs font-bold text-slate-500 uppercase mt-4 mb-1">
            Diagnóstico Final
          </label>
          <textarea
            className="w-full bg-white border-2 border-teal-500 rounded-lg p-4 text-sm focus:ring-2 focus:ring-teal-200 outline-none h-32 mb-6"
            value={neuroAssessment.diagnosis || ""}
            onChange={(e) =>
              setNeuroAssessment({
                ...neuroAssessment,
                diagnosis: e.target.value,
              })
            }
          />

          <button
            onClick={saveFullNeuro}
            className="w-full py-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-teal-900/20"
          >
            <Save size={20} />
            Guardar Evaluación Global
          </button>
        </Accordion>

        <div className="h-24" />
      </div>

      {/* MODALS FOR TESTS */}
      {activeTest === "MOTOR" && (
        <MotorAssessmentForm
          visible={true}
          onClose={() => setActiveTest(null)}
          initialData={neuroAssessment.uhdrs_motor_info}
          onSave={(scores: any, total: number) =>
            handleSaveTest("MOTOR", scores, total)
          }
        />
      )}
      {activeTest === "MMSE" && (
        <MMSEForm
          visible={true}
          onClose={() => setActiveTest(null)}
          initialData={neuroAssessment.mmse_info}
          onSave={(scores: any, total: number) =>
            handleSaveTest("MMSE", scores, total)
          }
        />
      )}
      {activeTest === "PBA" && (
        <PBAForm
          visible={true}
          onClose={() => setActiveTest(null)}
          initialData={neuroAssessment.pba_info}
          onSave={(scores: any, total: number) =>
            handleSaveTest("PBA", scores, total)
          }
        />
      )}
      {activeTest === "FC" && (
        <FCForm
          visible={true}
          onClose={() => setActiveTest(null)}
          initialData={neuroAssessment.fc_info}
          onSave={(scores: any, total: number) =>
            handleSaveTest("FC", scores, total)
          }
        />
      )}

      {/* MODAL SOLICITUD LAB */}
      {showLabOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-6">
              Solicitar Examen de Laboratorio
            </h3>

            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Tipo de Examen
            </label>
            <div className="flex flex-wrap gap-2 mb-6">
              {LAB_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setNewLabType(type)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    newLabType === type
                      ? "bg-violet-100 border-violet-600 text-violet-700 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Descripción
            </label>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-violet-500 outline-none h-24 mb-6"
              placeholder="Ej: Hemograma completo..."
              value={newLabDesc}
              onChange={(e) => setNewLabDesc(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowLabOrder(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={requestLabTest}
                disabled={orderingLab}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {orderingLab ? "Enviando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
