"use client";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { DoctorDetail } from "@/types/medical";
import { Badge, Clock, Mail, Stethoscope, User } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { profile, loading: authLoading } = useAuth();
  const [doctorDetail, setDoctorDetail] = useState<DoctorDetail | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(false);

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      if (profile?.id_role === 2) {
        // Doctor
        setLoadingDoctor(true);
        const { data, error } = await supabase
          .from("doctor_details")
          .select("*, specialty:doctor_specialties(specialty)")
          .eq("profile_id", profile.id)
          .single();

        if (error) {
          console.warn("Error fetching doctor details:", error);
        }
        if (data) setDoctorDetail(data as unknown as DoctorDetail); // Type adjustment if needed
        setLoadingDoctor(false);
      }
    };

    if (profile) {
      fetchDoctorDetails();
    }
  }, [profile]);

  if (authLoading || loadingDoctor) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>No se encontró el perfil.</p>
      </div>
    );
  }

  const getRoleLabel = (roleId: number) => {
    switch (roleId) {
      case 1:
        return "Administrador";
      case 2:
        return "Médico";
      case 3:
        return "Paciente";
      case 4:
        return "Recepcionista";
      case 5:
        return "Enfermera";
      default:
        return "Usuario";
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center rounded-3xl bg-blue-600 py-10 shadow-lg shadow-blue-600/20">
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <User size={48} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">
          {profile.first_name} {profile.last_name}
        </h2>
        <span className="mt-1 rounded-full bg-blue-500/50 px-4 py-1 text-sm font-medium text-blue-100">
          {getRoleLabel(profile.id_role)}
        </span>
      </div>

      {/* Info Sections */}
      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="mb-4 text-lg font-bold text-slate-800">
            Información Personal
          </h3>
          <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
              <Mail size={20} className="text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-medium text-slate-800">
                {profile.email}
              </p>
            </div>
          </div>
        </div>

        {profile.id_role === 2 && doctorDetail && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-4 text-lg font-bold text-slate-800">
              Información Profesional
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                  <Stethoscope size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Especialidad</p>
                  <p className="text-sm font-medium text-slate-800">
                    {doctorDetail.specialty?.specialty || "No especificada"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                  <Badge size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Código CMP</p>
                  <p className="text-sm font-medium text-slate-800">
                    {doctorDetail.cmp_code}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Clock size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">
                      Horarios Disponibles
                    </p>
                  </div>
                </div>
                <div className="space-y-2 pl-14">
                  {doctorDetail.available_hours &&
                    Object.entries(doctorDetail.available_hours).map(
                      ([day, hours]) => (
                        <div
                          key={day}
                          className="flex justify-between border-b border-slate-200 pb-2 last:border-0 last:pb-0"
                        >
                          <span className="font-medium capitalize text-slate-700">
                            {day}:
                          </span>
                          <div className="text-right">
                            {hours.map((h, i) => (
                              <div key={i} className="text-sm text-slate-500">
                                {h.start_time} - {h.end_time}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
