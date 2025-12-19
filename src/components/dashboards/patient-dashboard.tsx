"use client";

import { useAuth, UserProfile } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  CalendarClock,
  ChevronRight,
  FileText,
  Pill,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function PatientDashboard({
  profile,
}: {
  profile: UserProfile;
}) {
  const [caseStatus, setCaseStatus] = useState<string>("Cargando...");
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // 1. Obtener estado del caso clínico activo
      const { data: caseData } = await supabase
        .from("clinical_cases")
        .select("status(case_status)")
        .eq("patient_id", profile.id)
        .eq("is_active", true)
        .single();

      if (caseData) {
        setCaseStatus((caseData.status as any)?.case_status || "Sin estado");
      } else {
        setCaseStatus("Sin caso activo");
      }

      // 2. Obtener próxima cita
      const today = new Date().toISOString();
      const { data: apptData } = await supabase
        .from("appointments")
        .select(
          `
          scheduled_at,
          doctor:profiles!doctor_id(first_name, last_name),
          type:type_appointment(type)
        `
        )
        .eq("patient_id", profile.id)
        .gte("scheduled_at", today)
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .single();

      if (apptData) {
        setNextAppointment(apptData);
      }
    } catch (error) {
      console.error("Error fetching patient data:", error);
      setCaseStatus("Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de Bienvenida */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Hola, {profile.first_name}
        </h1>
        <p className="text-slate-500">Tu salud es nuestra prioridad</p>
      </div>

      {/* Tarjeta de Estado Principal */}
      <div className="rounded-2xl bg-blue-600 p-6 shadow-lg shadow-blue-600/20">
        <div className="mb-3 flex items-center gap-2 text-blue-100">
          <Activity size={24} />
          <span className="font-semibold text-sm">Estado del Caso</span>
        </div>
        <div className="mb-2 text-3xl font-bold text-white">{caseStatus}</div>
        <p className="text-sm text-blue-100/90">
          {caseStatus === "Sin caso activo"
            ? "No tienes un proceso médico en curso."
            : "Tu equipo médico está trabajando en tu caso."}
        </p>
      </div>

      {/* Accesos Rápidos (Grid) */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-slate-800">
          Accesos Rápidos
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <button className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-blue-100 hover:shadow-md">
            <div className="mb-2 rounded-xl bg-sky-100 p-2.5 text-sky-600">
              <CalendarClock size={24} />
            </div>
            <span className="text-sm font-semibold text-slate-600">
              Mis Citas
            </span>
          </button>

          <button className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-green-100 hover:shadow-md">
            <div className="mb-2 rounded-xl bg-green-100 p-2.5 text-green-600">
              <Pill size={24} />
            </div>
            <span className="text-sm font-semibold text-slate-600">
              Recetas
            </span>
          </button>

          <button className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-purple-100 hover:shadow-md">
            <div className="mb-2 rounded-xl bg-purple-100 p-2.5 text-purple-600">
              <FileText size={24} />
            </div>
            <span className="text-sm font-semibold text-slate-600">
              Historial
            </span>
          </button>
        </div>
      </div>

      {/* Próxima Cita (Preview) */}
      {nextAppointment ? (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <div className="mb-1 text-xs font-bold uppercase text-blue-600">
              Próxima Cita
            </div>
            <div className="text-lg font-bold text-slate-800 capitalize">
              {new Date(nextAppointment.scheduled_at).toLocaleDateString(
                "es-ES",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </div>
            <div className="text-sm text-slate-500">
              Dr. {nextAppointment.doctor?.first_name}{" "}
              {nextAppointment.doctor?.last_name} ({nextAppointment.type?.type})
            </div>
          </div>
          <ChevronRight className="text-slate-400" />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-400">
          No tienes citas próximas.
        </div>
      )}
    </div>
  );
}
