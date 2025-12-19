"use client";

import { supabase } from "@/lib/supabase";
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
  Brain,
  ChevronDown,
  ChevronUp,
  FileText,
  FlaskConical,
  Phone,
  Plus,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Accordion, JsonResultsTable } from "./helpers";
import { useAuth } from "@/context/AuthContext";

// --- TIPOS DE EXAMENES ---
const LAB_TYPES = [
  "Bioquímica y Hematología",
  "Inmunología y Serología",
  "Microbiología y Parasitología",
  "Genética y Biología Molecular",
  "Urianálisis y Líquidos Corporales",
  "Endocrinología (Hormonas)",
];

// 3. Item de Resultado de Laboratorio Colapsable
const LabResultItem = ({ lab }: { lab: LabResult }) => {
  const [expanded, setExpanded] = useState(false);

  // Formatear Fecha
  const formattedDate = new Date(
    lab.analyzed_at || new Date()
  ).toLocaleDateString();

  return (
    <div className="mb-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between bg-slate-50 px-3 py-3 hover:bg-slate-100"
      >
        <div className="flex flex-col items-start">
          <span className="text-sm font-bold text-violet-600 line-clamp-1 text-left">
            {lab.type}
          </span>
          <span className="text-xs text-slate-400">{formattedDate}</span>
        </div>

        <div className="flex items-center gap-2">
          {lab.status ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
              COMPLETADO
            </span>
          ) : (
            <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] font-bold text-yellow-800">
              PENDIENTE
            </span>
          )}
          {expanded ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-4">
          <span className="mb-1 block text-xs font-bold text-slate-400">
            Descripción:
          </span>
          <p className="mb-4 text-sm italic text-slate-700">
            "{lab.description}"
          </p>

          {lab.status ? (
            <>
              {/* Tabla Dinámica JSON Recursiva */}
              <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                <JsonResultsTable data={lab.results_json} />
              </div>

              {lab.result_text && (
                <div className="mt-4 rounded-lg bg-violet-50 p-3">
                  <span className="block text-xs font-bold text-violet-600">
                    CONCLUSIÓN MÉDICA:
                  </span>
                  <p className="mt-1 text-sm font-semibold text-violet-800">
                    {lab.result_text}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="mt-2 rounded-lg bg-amber-50 p-3">
              <span className="text-xs font-medium italic text-amber-600">
                Esperando resultados del laboratorio...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function ClinicalCaseDetail({
  caseId,
  patientId,
  onClose,
}: {
  caseId: string;
  patientId: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [patient, setPatient] = useState<PatientProfile | null>(null);

  const [history, setHistory] = useState<MedicalHistory | null>(null);
  const [triage, setTriage] = useState<TriageRecord | null>(null);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const { user } = useAuth();

  // Estado de Solicitud de Lab
  const [showLabOrder, setShowLabOrder] = useState(false);
  const [newLabType, setNewLabType] = useState(LAB_TYPES[0]);
  const [newLabDesc, setNewLabDesc] = useState("");
  const [orderingLab, setOrderingLab] = useState(false);

  // Estado de Formularios
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
    uhdrs_motor_score: "",
    mmse_score: "",
    clinical_notes: "",
    diagnosis: "",
  });

  // Estado de UI
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    history: false,
    triage: false,
    anamnesis: false,
    labs: true,
    neuro: true,
  });

  // Estado de IA
  const [aiThinking, setAiThinking] = useState(false);
  const [aiOptions, setAiOptions] = useState<{
    gpt: string;
    copilot: string;
  } | null>(null);

  // Cargar datos
  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Perfil del Paciente
      const patientPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", patientId)
        .single();

      // 2. Historial Médico
      const historyPromise = supabase
        .from("medical_histories")
        .select("*")
        .eq("patient_id", patientId)
        .single();

      // 3. Triaje (Asociado al caso)
      const triagePromise = supabase
        .from("triage_records")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // 4. Anamnesis (General Consultation asociada al caso)
      const anamnesisPromise = supabase
        .from("general_consultations")
        .select("*")
        .eq("case_id", caseId)
        .single();

      // 5. Resultados de Laboratorio
      const labsPromise = supabase
        .from("lab_results")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      // 6. Evaluación Neurológica
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

      if (patientRes.data) setPatient(patientRes.data as any);
      if (historyRes.data) setHistory(historyRes.data as any);
      if (triageRes.data) setTriage(triageRes.data as any);
      if (anamnesisRes.data) setAnamnesis(anamnesisRes.data as any);
      if (labsRes.data) setLabResults(labsRes.data as any);
      if (neuroRes.data) setNeuroAssessment(neuroRes.data as any);
    } catch (error) {
      console.error("Error loading clinical case data:", error);
      alert("Error: No se pudieron cargar todos los datos del caso.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId && patientId) {
      loadData();
    }
  }, [caseId, patientId]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // --- ACCIONES DE GUARDADO ---

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
      alert("Éxito: Anamnesis guardada correctamente.");
    } catch (error) {
      console.error("Error saving anamnesis:", error);
      alert("Error: No se pudo guardar la anamnesis.");
    }
  };

  const saveNeuroAssessment = async () => {
    console.log("Iniciando guardado de evaluación...", neuroAssessment);
    try {
      const payload: any = {
        case_id: caseId,
        doctor_id: user?.id, // ID del doctor actual
        has_chorea: neuroAssessment.has_chorea,
        // Convertir strings a números de forma segura
        uhdrs_motor_score:
          parseInt(String(neuroAssessment.uhdrs_motor_score)) || 0,
        mmse_score: parseInt(String(neuroAssessment.mmse_score)) || 0,
        clinical_notes: neuroAssessment.clinical_notes || "",
        diagnosis: neuroAssessment.diagnosis || "",
      };

      if (neuroAssessment.id) {
        payload.id = neuroAssessment.id;
      }

      console.log("Enviando payload a Supabase:", payload);

      const { data, error } = await supabase
        .from("neurology_assessments")
        .upsert(payload)
        .select();

      if (error) {
        console.error("Error devuelto por Supabase:", error);
        throw error;
      }

      console.log("Guardado exitoso:", data);
      alert("Éxito: Evaluación guardada correctamente.");

      // Actualizar estado local si es necesario (ej. capturar ID nuevo)
      if (data && data[0]) {
        setNeuroAssessment((prev) => ({ ...prev, id: data[0].id }));
      }
    } catch (error: any) {
      console.error("EXCEPCIÓN al guardar evaluación:", error);
      alert(`Error al guardar: ${error.message || "Ver consola"}`);
    }
  };

  const requestLabTest = async () => {
    if (!newLabDesc) {
      alert("Error: Ingrese una descripción para el examen.");
      return;
    }
    setOrderingLab(true);
    try {
      const { error } = await supabase.from("lab_results").insert({
        case_id: caseId,
        type: newLabType,
        description: newLabDesc,
        status: false, // Pendiente
      });

      if (error) throw error;
      alert("Solicitud Enviada: El examen ha sido solicitado.");
      setShowLabOrder(false);
      setNewLabDesc("");
      // Recargar labs
      const { data } = await supabase
        .from("lab_results")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });
      if (data) setLabResults(data as any);
    } catch (error) {
      console.error("Error requesting lab:", error);
      alert("Error: No se pudo solicitar el examen.");
    } finally {
      setOrderingLab(false);
    }
  };

  // --- LÓGICA DE IA ---
  // --- LÓGICA DE IA REAL ---
  const consultAI = async () => {
    setAiThinking(true);
    setAiOptions(null);

    // Preparar el payload con toda la data disponible
    const caseData = {
      history,
      triage,
      labs: labResults,
      neuro: neuroAssessment,
    };

    try {
      // Llamadas en paralelo a ambas APIs
      const [gptRes, geminiRes] = await Promise.allSettled([
        fetch("/api/ai/openai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: caseData }),
        }),
        fetch("/api/ai/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: caseData }),
        }),
      ]);

      let gptText = "Error consultando GPT.";
      let geminiText = "Error consultando Gemini.";

      // Procesar OpenAI
      if (gptRes.status === "fulfilled" && gptRes.value.ok) {
        const data = await gptRes.value.json();
        // Formatear respuesta para mostrar
        gptText = `[${data.confidence}] ${data.diagnosis}. ${data.reasoning}`;
      } else if (gptRes.status === "fulfilled") {
        const err = await gptRes.value.json();
        gptText = `Error: ${err.error || "Falta configuración de API Key"}`;
      }

      // Procesar Gemini
      if (geminiRes.status === "fulfilled" && geminiRes.value.ok) {
        const data = await geminiRes.value.json();
        geminiText = `[${data.confidence}] ${data.diagnosis}. ${data.reasoning}`;
      } else if (geminiRes.status === "fulfilled") {
        const err = await geminiRes.value.json();
        geminiText = `Error: ${err.error || "Falta configuración de API Key"}`;
      }

      setAiOptions({
        gpt: gptText,
        copilot: geminiText, // Reusamos el campo 'copilot' para Gemini en la UI
      });
    } catch (error) {
      console.error("Error en consulta IA:", error);
      alert("Error de conexión al consultar las IAs.");
    } finally {
      setAiThinking(false);
    }
  };

  const selectAiOption = (text: string) => {
    setNeuroAssessment((prev) => ({ ...prev, diagnosis: text }));
    setAiOptions(null);
    alert("Diagnóstico Importado. Puedes editar el texto antes de guardar.");
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 lg:static lg:h-auto">
      {/* Header Fijo */}
      <div className="flex items-center justify-between bg-slate-900 px-6 py-4 shadow-md">
        <div className="flex items-center gap-4">
          <img
            src={patient?.avatar_url || "https://i.pravatar.cc/150"}
            alt="Avatar"
            className="h-12 w-12 rounded-full border-2 border-white object-cover"
          />
          <div>
            <h2 className="text-lg font-bold text-white">
              {patient?.first_name} {patient?.last_name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Phone size={12} />
              <span>{patient?.phone || "Sin teléfono"}</span>
              <span className="ml-2">DNI: {patient?.dni || "---"}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* 1. Historial Médico */}
        <Accordion
          title="Historial Médico General"
          icon={FileText}
          isOpen={openSections["history"]}
          onToggle={() => toggleSection("history")}
          color="text-slate-500"
          borderColor="border-slate-500"
        >
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
            <li>
              <span className="font-semibold">Alergias:</span>{" "}
              {history?.allergies?.join(", ") || "Ninguna"}
            </li>
            <li>
              <span className="font-semibold">Tipo de Sangre:</span>{" "}
              {history?.blood_type || "Desconocido"}
            </li>
            <li>
              <span className="font-semibold">Condiciones:</span>{" "}
              {history?.chronic_conditions?.join(", ") || "Ninguna"}
            </li>
          </ul>
        </Accordion>

        {/* 2. Triaje */}
        <Accordion
          title="Datos de Triaje"
          icon={Activity}
          isOpen={openSections["triage"]}
          onToggle={() => toggleSection("triage")}
          color="text-orange-600"
          borderColor="border-orange-600"
        >
          {triage ? (
            <div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center rounded-lg bg-orange-50 p-3">
                  <span className="text-[10px] font-bold uppercase text-orange-600">
                    Presión
                  </span>
                  <span className="text-lg font-bold text-orange-800">
                    {triage.systolic_pressure}/{triage.diastolic_pressure}
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-orange-50 p-3">
                  <span className="text-[10px] font-bold uppercase text-orange-600">
                    Peso
                  </span>
                  <span className="text-lg font-bold text-orange-800">
                    {triage.weight_kg} kg
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-orange-50 p-3">
                  <span className="text-[10px] font-bold uppercase text-orange-600">
                    Temp
                  </span>
                  <span className="text-lg font-bold text-orange-800">
                    {triage.temperature}°C
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center rounded-lg bg-orange-50 p-3">
                  <span className="text-[10px] font-bold uppercase text-orange-600">
                    Ritmo Card.
                  </span>
                  <span className="text-lg font-bold text-orange-800">
                    {triage.heart_rate} bpm
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-orange-50 p-3">
                  <span className="text-[10px] font-bold uppercase text-orange-600">
                    Sat. O2
                  </span>
                  <span className="text-lg font-bold text-orange-800">
                    {triage.oxygen_saturation}%
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-orange-50 p-3">
                  <span className="text-[10px] font-bold uppercase text-orange-600">
                    Talla
                  </span>
                  <span className="text-lg font-bold text-orange-800">-</span>
                </div>
              </div>
              {triage.notes && (
                <div className="mt-4 rounded-lg bg-orange-50 p-3">
                  <span className="text-xs font-bold text-orange-600">
                    NOTAS DE TRIAJE:
                  </span>
                  <p className="mt-1 text-sm text-orange-800">{triage.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No hay datos de triaje recientes.
            </p>
          )}
        </Accordion>

        {/* 3. Anamnesis */}
        <Accordion
          title="Anamnesis"
          icon={FileText}
          isOpen={openSections["anamnesis"]}
          onToggle={() => toggleSection("anamnesis")}
          color="text-blue-600"
          borderColor="border-blue-600"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                Motivo de Consulta
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:outline-none"
                rows={3}
                value={anamnesis.reason_consultation || ""}
                onChange={(e) =>
                  setAnamnesis({
                    ...anamnesis,
                    reason_consultation: e.target.value,
                  })
                }
                placeholder="Motivo principal..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                Enfermedad Actual
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm focus:border-blue-500 focus:outline-none"
                rows={3}
                value={anamnesis.current_illness || ""}
                onChange={(e) =>
                  setAnamnesis({
                    ...anamnesis,
                    current_illness: e.target.value,
                  })
                }
                placeholder="Describa la enfermedad actual..."
              />
            </div>
            {/* ... Other inputs can be added similarly ... */}
            <button
              onClick={saveAnamnesis}
              className="ml-auto block rounded-lg text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              Guardar Anamnesis
            </button>
          </div>
        </Accordion>

        {/* 4. Resultados de Laboratorio */}
        <Accordion
          title="Resultados de Laboratorio"
          icon={FlaskConical}
          isOpen={openSections["labs"]}
          onToggle={() => toggleSection("labs")}
          color="text-violet-600"
          borderColor="border-violet-600"
        >
          <button
            onClick={() => setShowLabOrder(true)}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-violet-700"
          >
            <Plus size={16} /> Solicitar Nuevo Examen
          </button>

          {labResults.length > 0 ? (
            <div>
              {labResults.map((lab) => (
                <LabResultItem key={lab.id} lab={lab} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No hay resultados de laboratorio.
            </p>
          )}
        </Accordion>

        {/* 5. Evaluación Neurológica */}
        <Accordion
          title="Evaluación Neurológica"
          icon={Brain}
          isOpen={openSections["neuro"]}
          onToggle={() => toggleSection("neuro")}
          color="text-teal-600"
          borderColor="border-teal-600"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="text-sm font-bold text-slate-700">
                Presencia de Corea
              </span>
              <input
                type="checkbox"
                checked={neuroAssessment.has_chorea}
                onChange={(e) =>
                  setNeuroAssessment({
                    ...neuroAssessment,
                    has_chorea: e.target.checked,
                  })
                }
                className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">
                  UHDRS Motor (0-124)
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-sm"
                  value={neuroAssessment.uhdrs_motor_score}
                  onChange={(e) =>
                    setNeuroAssessment({
                      ...neuroAssessment,
                      uhdrs_motor_score: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">
                  MMSE Cognitivo (0-30)
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-sm"
                  value={neuroAssessment.mmse_score}
                  onChange={(e) =>
                    setNeuroAssessment({
                      ...neuroAssessment,
                      mmse_score: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* AI Section */}
            <div className="mt-6 rounded-xl bg-slate-800 p-4 text-white">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                <span className="font-bold text-amber-400">
                  Consultar Inteligencia Artificial
                </span>
              </div>
              <p className="mb-4 text-xs text-slate-400">
                Enviar datos (Lab + Motor + Cognitivo) para análisis preliminar.
              </p>

              {!aiThinking && !aiOptions && (
                <button
                  onClick={consultAI}
                  className="w-full rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-amber-950 hover:bg-amber-300"
                >
                  Consultar a GPT-4 & Copilot
                </button>
              )}

              {aiThinking && (
                <div className="flex justify-center py-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                </div>
              )}

              {aiOptions && (
                <div className="space-y-3">
                  <button
                    onClick={() => selectAiOption(aiOptions.gpt)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-left transition-colors hover:bg-slate-600"
                  >
                    <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                      GPT-4o
                    </span>
                    <p className="text-xs text-slate-200">{aiOptions.gpt}</p>
                  </button>
                  <button
                    onClick={() => selectAiOption(aiOptions.copilot)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 p-3 text-left transition-colors hover:bg-slate-600"
                  >
                    <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                      Google Gemini 1.5
                    </span>
                    <p className="text-xs text-slate-200">
                      {aiOptions.copilot}
                    </p>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                Diagnóstico Final
              </label>
              <textarea
                className="w-full rounded-lg border border-teal-500 bg-slate-50 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                rows={4}
                value={neuroAssessment.diagnosis}
                onChange={(e) =>
                  setNeuroAssessment({
                    ...neuroAssessment,
                    diagnosis: e.target.value,
                  })
                }
              />
            </div>

            <button
              onClick={saveNeuroAssessment}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-4 font-bold text-white transition-colors hover:bg-teal-800"
            >
              <Save size={20} /> Guardar Evaluación
            </button>
          </div>
        </Accordion>

        {/* Espaciado final */}
        <div className="h-20" />
      </div>

      {/* MODAL SOLICITUD LAB */}
      {showLabOrder && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-slate-800">
              Solicitar Examen de Laboratorio
            </h3>

            <div className="mb-4">
              <span className="mb-2 block text-xs font-bold text-slate-500">
                Tipo de Examen
              </span>
              <div className="flex flex-wrap gap-2">
                {LAB_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewLabType(type)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      newLabType === type
                        ? "border-violet-600 bg-violet-50 text-violet-700"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <span className="mb-2 block text-xs font-bold text-slate-500">
                Descripción / Indicaciones
              </span>
              <textarea
                className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm focus:border-violet-500 focus:outline-none"
                rows={3}
                placeholder="Ej: Hemograma completo, descartar anemia..."
                value={newLabDesc}
                onChange={(e) => setNewLabDesc(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLabOrder(false)}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-600 hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={requestLabTest}
                disabled={orderingLab}
                className="flex-1 rounded-xl bg-violet-600 px-4 py-3 font-bold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {orderingLab ? "Enviando..." : "Confirmar Solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
