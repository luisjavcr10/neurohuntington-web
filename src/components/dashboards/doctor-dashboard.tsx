"use client";

import { useAuth, UserProfile } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Appointment } from "@/types/medical";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Clock,
  LogOut,
  Stethoscope,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import ClinicalCaseDetail from "../doctor/clinical-case-detail";

export default function DoctorDashboard({ profile }: { profile: UserProfile }) {
  const { signOut } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para controlar el Modal del Detalle
  const [selectedCase, setSelectedCase] = useState<{
    caseId: string;
    patientId: string;
  } | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          scheduled_at,
          case_id,
          type:type_appointment(type),
          status:appointment_status(appointment_status),
          patient:profiles!patient_id(id, first_name, last_name)
        `
        )
        .eq("doctor_id", profile.id)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setAppointments(data as any);
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError("No se pudo cargar la agenda.");
    } finally {
      setLoading(false);
    }
  };

  const totalAppointments = appointments.length;
  const highPriorityCount = 0; // Simulación

  return (
    <>
      <div className="space-y-6">
        {/* Header Doctor */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-sm font-medium text-slate-500">
              Bienvenido Dr.
            </h2>
            <h1 className="text-2xl font-bold text-slate-800">
              {profile.first_name} {profile.last_name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-white">
              <Stethoscope size={16} />
              <span className="text-xs font-bold">Neurología</span>
            </div>
          </div>
        </div>

        {/* Resumen Diario */}
        <div className="flex gap-4">
          <div className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-blue-50 p-4 text-center">
            <Calendar size={28} className="text-blue-600" />
            <span className="text-3xl font-bold text-blue-600">
              {totalAppointments}
            </span>
            <span className="text-xs text-slate-500">Citas Hoy</span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-orange-50 p-4 text-center">
            <AlertCircle size={28} className="text-orange-600" />
            <span className="text-3xl font-bold text-orange-600">
              {highPriorityCount}
            </span>
            <span className="text-xs text-slate-500">Prioridad Alta</span>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-bold text-slate-800">Agenda</h3>

          {/* Estado de Carga y Error */}
          {loading && (
            <div className="flex justify-center p-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-red-50 p-6 text-red-600">
              <AlertCircle size={24} />
              <p>{error}</p>
              <button
                onClick={fetchAppointments}
                className="font-bold underline hover:text-red-800"
              >
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && appointments.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-slate-400">
              <Calendar size={48} />
              <p>No hay citas programadas para hoy.</p>
            </div>
          )}

          {/* Lista de Citas */}
          <div className="grid gap-3">
            {appointments.map((appt) => {
              const time = new Date(appt.scheduled_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <button
                  key={appt.id}
                  onClick={() => {
                    if (appt.patient?.id) {
                      setSelectedCase({
                        caseId: appt.case_id,
                        patientId: appt.patient.id,
                      });
                    }
                  }}
                  className="flex w-full items-center rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:bg-slate-50 hover:shadow-md"
                >
                  {/* Columna Hora */}
                  <div className="flex w-20 flex-col items-center border-r border-slate-100 pr-4">
                    <Clock size={16} className="text-slate-400" />
                    <span className="mt-1 text-sm font-bold text-slate-600">
                      {time}
                    </span>
                  </div>

                  {/* Columna Info */}
                  <div className="flex flex-1 flex-col pl-4">
                    <span className="font-bold text-slate-800">
                      {appt.patient
                        ? `${appt.patient.first_name} ${appt.patient.last_name}`
                        : "Paciente desconocido"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {appt.type?.type || "Tipo desconocido"}
                    </span>
                    <div className="mt-1 flex items-center gap-1 self-start rounded bg-red-50 px-2 py-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      <span className="text-[10px] font-bold text-red-500">
                        {appt.status?.appointment_status || "Desconocido"}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={20} className="text-slate-300" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Espacio extra al final */}
        <div className="h-10" />
      </div>

      {/* MODAL DE DETALLE COMPLETO */}
      {selectedCase && (
        <ClinicalCaseDetail
          caseId={selectedCase.caseId}
          patientId={selectedCase.patientId}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </>
  );
}
