"use client";

import { useAuth, UserProfile } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { PatientProfile } from "@/types/medical";
import { Activity, ClipboardList, LogOut, Search, User } from "lucide-react";
import { useState } from "react";

export default function NurseDashboard({ profile }: { profile: UserProfile }) {
  const { signOut } = useAuth();
  const [view, setView] = useState<"home" | "triage" | "history">("home");

  // --- ESTADOS DE BÚSQUEDA ---
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(
    null
  );
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [triageId, setTriageId] = useState<string | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // --- ESTADOS DE FORMULARIOS ---
  const [triageData, setTriageData] = useState({
    weight: "",
    height: "",
    temp: "",
    sys: "",
    dia: "",
    heart: "",
    oxy: "",
    notes: "",
  });
  const [historyData, setHistoryData] = useState({
    blood_type: "",
    allergies: "",
    chronic: "",
  });
  const [saving, setSaving] = useState(false);

  // --- LÓGICA DE BÚSQUEDA ---
  const searchPatients = async (text: string) => {
    setPatientSearch(text);
    if (text.length < 3) {
      setPatients([]);
      return;
    }
    setLoadingSearch(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id_role", 3) // Paciente
      .or(
        `first_name.ilike.%${text}%,last_name.ilike.%${text}%,dni.ilike.%${text}%`
      )
      .limit(5);

    if (data) setPatients(data as any);
    setLoadingSearch(false);
  };

  const selectPatient = async (patient: PatientProfile) => {
    setSelectedPatient(patient);
    setPatients([]);
    setPatientSearch("");

    // 1. Buscar caso activo
    const { data: caseData } = await supabase
      .from("clinical_cases")
      .select("id")
      .eq("patient_id", patient.id)
      .eq("is_active", true)
      .single();

    const cId = caseData?.id || null;
    setActiveCaseId(cId);

    // 2. Buscar Historial Médico existente
    const { data: histData } = await supabase
      .from("medical_histories")
      .select("*")
      .eq("patient_id", patient.id)
      .maybeSingle();

    if (histData) {
      setHistoryData({
        blood_type: histData.blood_type || "",
        allergies: histData.allergies ? histData.allergies.join(", ") : "",
        chronic: histData.chronic_conditions
          ? histData.chronic_conditions.join(", ")
          : "",
      });
    } else {
      setHistoryData({ blood_type: "", allergies: "", chronic: "" });
    }

    // 3. Buscar Triaje existente para el caso activo
    if (cId) {
      const { data: triData } = await supabase
        .from("triage_records")
        .select("*")
        .eq("case_id", cId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (triData) {
        setTriageId(triData.id);
        setTriageData({
          weight: triData.weight_kg?.toString() || "",
          height: triData.height_cm?.toString() || "",
          temp: triData.temperature?.toString() || "",
          sys: triData.systolic_pressure?.toString() || "",
          dia: triData.diastolic_pressure?.toString() || "",
          heart: triData.heart_rate?.toString() || "",
          oxy: triData.oxygen_saturation?.toString() || "",
          notes: triData.notes || "",
        });
      } else {
        setTriageId(null);
        setTriageData({
          weight: "",
          height: "",
          temp: "",
          sys: "",
          dia: "",
          heart: "",
          oxy: "",
          notes: "",
        });
      }
    } else {
      setTriageId(null);
      setTriageData({
        weight: "",
        height: "",
        temp: "",
        sys: "",
        dia: "",
        heart: "",
        oxy: "",
        notes: "",
      });
    }
  };

  // --- ACCIONES DE GUARDADO ---
  const saveTriage = async () => {
    if (!activeCaseId) {
      alert("Error: El paciente no tiene un caso clínico activo.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        case_id: activeCaseId,
        weight_kg: parseFloat(triageData.weight) || 0,
        height_cm: parseFloat(triageData.height) || 0,
        temperature: parseFloat(triageData.temp) || 0,
        systolic_pressure: parseInt(triageData.sys) || 0,
        diastolic_pressure: parseInt(triageData.dia) || 0,
        heart_rate: parseInt(triageData.heart) || 0,
        oxygen_saturation: parseInt(triageData.oxy) || 0,
        notes: triageData.notes,
        priority: 2, // Media por defecto
      };

      let error;
      if (triageId) {
        // Update
        const { error: err } = await supabase
          .from("triage_records")
          .update(payload)
          .eq("id", triageId);
        error = err;
      } else {
        // Insert
        const { error: err } = await supabase
          .from("triage_records")
          .insert(payload);
        error = err;
      }

      if (error) throw error;
      alert(
        triageId ? "Éxito: Triaje actualizado." : "Éxito: Triaje guardado."
      );
      setView("home");
    } catch (error) {
      console.error(error);
      alert("Error: No se pudo guardar el triaje.");
    } finally {
      setSaving(false);
    }
  };

  const saveHistory = async () => {
    if (!selectedPatient) return;
    setSaving(true);
    try {
      // Upsert (Insertar o Actualizar)
      const { error } = await supabase.from("medical_histories").upsert(
        {
          patient_id: selectedPatient.id,
          blood_type: historyData.blood_type,
          allergies: historyData.allergies.split(",").map((s) => s.trim()),
          chronic_conditions: historyData.chronic
            .split(",")
            .map((s) => s.trim()),
        },
        { onConflict: "patient_id" }
      );

      if (error) throw error;
      alert("Éxito: Historial actualizado.");
      setHistoryData({ blood_type: "", allergies: "", chronic: "" });
      setView("home");
    } catch (error) {
      console.error(error);
      alert("Error: No se pudo guardar el historial.");
    } finally {
      setSaving(false);
    }
  };

  // --- RENDERS ---

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-sm font-bold uppercase text-slate-500">
            Panel de Enfermería
          </h2>
          <h1 className="text-xl font-bold text-slate-800">
            {profile.first_name} {profile.last_name}
          </h1>
        </div>
        <button
          onClick={() => signOut()}
          className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500"
        >
          <LogOut size={24} />
        </button>
      </div>

      {view === "home" && (
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-4 text-sm font-bold text-slate-600">
              Seleccionar Paciente
            </h3>

            {selectedPatient ? (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
                <div>
                  <h4 className="text-lg font-bold text-blue-900">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h4>
                  <div className="text-sm text-slate-500">
                    DNI: {selectedPatient.dni}
                  </div>
                  <div
                    className={`mt-1 text-xs font-bold ${
                      activeCaseId ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {activeCaseId
                      ? "Caso Activo: #" + activeCaseId.slice(0, 8)
                      : "Sin Caso Clìnico Activo"}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="rounded-lg bg-white px-3 py-1 text-sm font-bold text-blue-600 shadow-sm hover:bg-slate-50"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-3 text-slate-400"
                  />
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Buscar por nombre o DNI..."
                    value={patientSearch}
                    onChange={(e) => searchPatients(e.target.value)}
                  />
                </div>
                {loadingSearch && (
                  <div className="mt-2 text-center text-xs text-slate-500">
                    Buscando...
                  </div>
                )}
                {patients.length > 0 && (
                  <div className="absolute left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        className="flex w-full items-center gap-2 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50"
                        onClick={() => selectPatient(p)}
                      >
                        <User size={16} className="text-slate-400" />
                        <span className="text-sm text-slate-700">
                          {p.first_name} {p.last_name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedPatient && (
            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() =>
                  activeCaseId
                    ? setView("triage")
                    : alert("Aviso: Se requiere un caso activo para triaje.")
                }
                className={`flex flex-col items-center rounded-2xl border p-6 shadow-sm transition-all ${
                  activeCaseId
                    ? "border-slate-200 bg-white hover:border-blue-200 hover:shadow-md"
                    : "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50"
                }`}
              >
                <div className="mb-4 rounded-full bg-blue-100 p-4 text-blue-600">
                  <Activity size={32} />
                </div>
                <h3 className="mb-1 text-lg font-bold text-slate-800">
                  Registrar Triaje
                </h3>
              </button>

              <button
                onClick={() => setView("history")}
                className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-purple-200 hover:shadow-md"
              >
                <div className="mb-4 rounded-full bg-purple-100 p-4 text-purple-600">
                  <ClipboardList size={32} />
                </div>
                <h3 className="mb-1 text-lg font-bold text-slate-800">
                  Antecedentes
                </h3>
              </button>
            </div>
          )}
        </div>
      )}

      {view === "triage" && (
        <div className="space-y-6">
          <button
            onClick={() => setView("home")}
            className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800"
          >
            <ChevronLeft size={16} /> Volver
          </button>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="mb-1 text-2xl font-bold text-slate-800">
              Registro de Triaje
            </h2>
            <p className="mb-6 text-sm text-slate-500">
              Paciente: {selectedPatient?.first_name}{" "}
              {selectedPatient?.last_name}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 p-2"
                  value={triageData.weight}
                  onChange={(e) =>
                    setTriageData({ ...triageData, weight: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">
                  Talla (cm)
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 p-2"
                  value={triageData.height}
                  onChange={(e) =>
                    setTriageData({ ...triageData, height: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">
                  Temp (°C)
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 p-2"
                  value={triageData.temp}
                  onChange={(e) =>
                    setTriageData({ ...triageData, temp: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">
                  Sat. O2 (%)
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 p-2"
                  value={triageData.oxy}
                  onChange={(e) =>
                    setTriageData({ ...triageData, oxy: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-bold text-slate-500">
                Presión Arterial (Sys/Dia)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="120"
                  className="flex-1 rounded-lg border border-slate-300 p-2"
                  value={triageData.sys}
                  onChange={(e) =>
                    setTriageData({ ...triageData, sys: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="80"
                  className="flex-1 rounded-lg border border-slate-300 p-2"
                  value={triageData.dia}
                  onChange={(e) =>
                    setTriageData({ ...triageData, dia: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-bold text-slate-500">
                Frecuencia Cardíaca (lpm)
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-300 p-2"
                value={triageData.heart}
                onChange={(e) =>
                  setTriageData({ ...triageData, heart: e.target.value })
                }
              />
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-bold text-slate-500">
                Notas de Observación
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-300 p-2"
                value={triageData.notes}
                onChange={(e) =>
                  setTriageData({ ...triageData, notes: e.target.value })
                }
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setView("home")}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-3 font-bold text-slate-500 hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={saveTriage}
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-70"
              >
                {saving ? "Guardando..." : "Guardar Triaje"}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "history" && (
        <div className="space-y-6">
          <button
            onClick={() => setView("home")}
            className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800"
          >
            <ChevronLeft size={16} /> Volver
          </button>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="mb-1 text-2xl font-bold text-slate-800">
              Antecedentes Médicos
            </h2>
            <p className="mb-6 text-sm text-slate-500">
              Paciente: {selectedPatient?.first_name}{" "}
              {selectedPatient?.last_name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">
                  Grupo Sanguíneo
                </label>
                <input
                  type="text"
                  placeholder="Ej: O+"
                  className="w-full rounded-lg border border-slate-300 p-2"
                  value={historyData.blood_type}
                  onChange={(e) =>
                    setHistoryData({
                      ...historyData,
                      blood_type: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">
                  Alergias (separar por comas)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Penicilina, Polvo"
                  className="w-full rounded-lg border border-slate-300 p-2"
                  value={historyData.allergies}
                  onChange={(e) =>
                    setHistoryData({
                      ...historyData,
                      allergies: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">
                  Condiciones Crónicas
                </label>
                <input
                  type="text"
                  placeholder="Ej: Diabetes, Hipertensión"
                  className="w-full rounded-lg border border-slate-300 p-2"
                  value={historyData.chronic}
                  onChange={(e) =>
                    setHistoryData({ ...historyData, chronic: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setView("home")}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-3 font-bold text-slate-500 hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={saveHistory}
                disabled={saving}
                className="flex-1 rounded-lg bg-purple-600 px-4 py-3 font-bold text-white hover:bg-purple-700 disabled:opacity-70"
              >
                {saving ? "Guardando..." : "Guardar Historial"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper icon
function ChevronLeft({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
