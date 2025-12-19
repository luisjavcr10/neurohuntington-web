"use client";

import { useAuth, UserProfile } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { DoctorDetail, DoctorSpecialty, PatientProfile } from "@/types/medical";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FilePlus,
  LogOut,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function ReceptionistDashboard({
  profile,
}: {
  profile: UserProfile;
}) {
  const { signOut } = useAuth();
  const [view, setView] = useState<"home" | "new_appointment" | "new_case">(
    "home"
  );

  // --- ESTADOS PARA NUEVA CITA ---
  const [specialties, setSpecialties] = useState<DoctorSpecialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<DoctorSpecialty | null>(null);
  const [doctors, setDoctors] = useState<DoctorDetail[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDetail | null>(
    null
  );
  const [doctorSearch, setDoctorSearch] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Calendario y Horarios
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<
    { date: Date; time: string }[]
  >([]);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: Date;
    time: string;
  } | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Paciente para la cita
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(
    null
  );

  // --- ESTADOS PARA NUEVO CASO ---
  const [newCaseCode, setNewCaseCode] = useState("");
  const [creatingCase, setCreatingCase] = useState(false);

  // Cargar Especialidades al inicio
  useEffect(() => {
    fetchSpecialties();
  }, []);

  const fetchSpecialties = async () => {
    const { data } = await supabase
      .from("doctor_specialties")
      .select("*")
      .eq("status", true);
    if (data) setSpecialties(data as any);
  };

  // Buscar Doctores cuando cambia especialidad o búsqueda
  useEffect(() => {
    if (view === "new_appointment" && selectedSpecialty) {
      fetchDoctors();
    }
  }, [selectedSpecialty, doctorSearch]);

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      let query = supabase
        .from("doctor_details")
        .select(
          `
            *,
            profile:profiles!profile_id(id, first_name, last_name, avatar_url),
            specialty:doctor_specialties(specialty)
        `
        )
        .eq("specialty_id", selectedSpecialty?.id);

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data as unknown as DoctorDetail[];
      if (doctorSearch) {
        const search = doctorSearch.toLowerCase();
        filtered = filtered.filter(
          (d) =>
            d.profile?.first_name.toLowerCase().includes(search) ||
            d.profile?.last_name.toLowerCase().includes(search)
        );
      }
      setDoctors(filtered);
    } catch (error) {
      console.error(error);
      alert("Error: No se pudieron cargar los doctores");
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Buscar Pacientes
  const searchPatients = async (text: string) => {
    setPatientSearch(text);
    if (text.length < 3) {
      setPatients([]);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id_role", 3) // Rol Paciente
      .or(
        `first_name.ilike.%${text}%,last_name.ilike.%${text}%,dni.ilike.%${text}%`
      )
      .limit(5);

    if (data) setPatients(data as any);
  };

  // --- LÓGICA DE CALENDARIO INTELIGENTE ---
  useEffect(() => {
    if (selectedDoctor) {
      calculateAvailableSlots();
    }
  }, [selectedDoctor, currentWeekStart]);

  const calculateAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDoctor.available_hours) return;
    setLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedSlot(null);

    try {
      // 1. Obtener citas existentes del doctor para la semana seleccionada
      const startStr = currentWeekStart.toISOString();
      const endOfWeek = new Date(currentWeekStart);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      const endStr = endOfWeek.toISOString();

      const { data: existingAppts } = await supabase
        .from("appointments")
        .select("scheduled_at")
        .eq("doctor_id", selectedDoctor.profile_id)
        .gte("scheduled_at", startStr)
        .lte("scheduled_at", endStr);

      const busyTimes = new Set(
        existingAppts?.map((a) => new Date(a.scheduled_at).toISOString()) || []
      );

      // 2. Generar slots basados en available_hours (JSON)
      const daysMap: Record<string, number> = {
        Domingo: 0,
        Lunes: 1,
        Martes: 2,
        Miercoles: 3,
        Jueves: 4,
        Viernes: 5,
        Sabado: 6,
      };
      const generatedSlots: { date: Date; time: string }[] = [];

      Object.entries(selectedDoctor.available_hours).forEach(
        ([dayName, ranges]) => {
          const dayIndex = daysMap[dayName]; // 0-6
          if (dayIndex === undefined) return;

          // Calcular fecha para este día en la semana actual
          const slotDate = new Date(currentWeekStart);
          const currentDayIndex = slotDate.getDay(); // 0-6
          const diff = dayIndex - currentDayIndex;
          slotDate.setDate(slotDate.getDate() + diff);

          // Si la fecha es pasada (ayer u hoy antes de hora actual), ignorar
          if (slotDate < new Date(new Date().setHours(0, 0, 0, 0))) return;

          ranges.forEach((range) => {
            let startHour = parseInt(range.start_time.split(":")[0]);
            const endHour = parseInt(range.end_time.split(":")[0]);

            while (startHour < endHour) {
              const timeStr = `${startHour.toString().padStart(2, "0")}:00`;

              const slotFullDate = new Date(slotDate);
              slotFullDate.setHours(startHour, 0, 0, 0);
              const isoSlot = slotFullDate.toISOString();

              if (!busyTimes.has(isoSlot)) {
                generatedSlots.push({ date: slotFullDate, time: timeStr });
              }
              startHour++;
            }
          });
        }
      );

      generatedSlots.sort((a, b) => a.date.getTime() - b.date.getTime());
      setAvailableSlots(generatedSlots);
    } catch (error) {
      console.error("Error calculating slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const changeWeek = (direction: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeekStart(newDate);
  };

  // --- ACCIONES ---

  const handleCreateAppointment = async () => {
    if (!selectedDoctor || !selectedPatient || !selectedSlot) {
      alert("Faltan datos: Seleccione doctor, paciente y horario.");
      return;
    }

    try {
      const { data: appt, error: apptError } = await supabase
        .from("appointments")
        .insert({
          doctor_id: selectedDoctor.profile_id,
          patient_id: selectedPatient.id,
          scheduled_at: selectedSlot.date.toISOString(),
          status: 1, // Pendiente
          type: 1, // Primera vez
        })
        .select()
        .single();

      if (apptError) throw apptError;

      // Crear Notificación
      await supabase.from("notifications").insert({
        user_id: selectedPatient.id,
        title: "Recordatorio de Cita",
        message: `Tienes una cita con el Dr. ${selectedDoctor.profile?.last_name} mañana a las ${selectedSlot.time}`,
        created_at: new Date().toISOString(),
      });

      alert("Éxito: Cita agendada correctamente.");
      setView("home");
      setSelectedDoctor(null);
      setSelectedPatient(null);
      setSelectedSlot(null);
    } catch (error) {
      console.error(error);
      alert("Error: No se pudo agendar la cita.");
    }
  };

  const handleCreateCase = async () => {
    if (!selectedPatient || !newCaseCode) {
      alert("Error: Seleccione paciente e ingrese código.");
      return;
    }
    setCreatingCase(true);
    try {
      const { error } = await supabase.from("clinical_cases").insert({
        patient_id: selectedPatient.id,
        code_case: newCaseCode,
        status: 1, // Activo/Evaluación
        is_active: true,
      });

      if (error) throw error;
      alert("Éxito: Caso clínico creado.");
      setView("home");
      setSelectedPatient(null);
      setNewCaseCode("");
    } catch (error) {
      console.error(error);
      alert("Error: No se pudo crear el caso.");
    } finally {
      setCreatingCase(false);
    }
  };

  // --- RENDERS ---

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-sm font-bold uppercase text-slate-500">
            Panel de Recepción
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            onClick={() => setView("new_appointment")}
            className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
          >
            <div className="mb-4 rounded-full bg-blue-100 p-4 text-blue-600">
              <Calendar size={32} />
            </div>
            <h3 className="mb-1 text-lg font-bold text-slate-800">
              Nueva Cita
            </h3>
            <p className="text-center text-sm text-slate-500">
              Agendar cita verificando disponibilidad.
            </p>
          </button>

          <button
            onClick={() => setView("new_case")}
            className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-green-200 hover:shadow-md"
          >
            <div className="mb-4 rounded-full bg-green-100 p-4 text-green-600">
              <FilePlus size={32} />
            </div>
            <h3 className="mb-1 text-lg font-bold text-slate-800">
              Nuevo Caso
            </h3>
            <p className="text-center text-sm text-slate-500">
              Abrir expediente para nuevo paciente.
            </p>
          </button>
        </div>
      )}

      {view === "new_appointment" && (
        <div className="space-y-6">
          <button
            onClick={() => setView("home")}
            className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800"
          >
            <ChevronLeft size={16} /> Volver
          </button>
          <h2 className="text-2xl font-bold text-slate-800">
            Agendar Nueva Cita
          </h2>

          {/* 1. Seleccionar Paciente */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-4 text-sm font-bold uppercase text-slate-500">
              1. Seleccionar Paciente
            </h3>
            {selectedPatient ? (
              <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
                <span className="font-bold text-blue-900">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </span>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs font-bold text-blue-600 hover:underline"
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
                {patients.length > 0 && (
                  <div className="absolute left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        className="w-full border-b border-slate-50 px-4 py-2 text-left text-sm hover:bg-slate-50"
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatients([]);
                          setPatientSearch("");
                        }}
                      >
                        {p.first_name} {p.last_name} ({p.dni})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Seleccionar Especialidad */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-4 text-sm font-bold uppercase text-slate-500">
              2. Especialidad
            </h3>
            <div className="flex flex-wrap gap-2">
              {specialties.map((spec) => (
                <button
                  key={spec.id}
                  onClick={() => {
                    setSelectedSpecialty(spec);
                    setSelectedDoctor(null);
                  }}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    selectedSpecialty?.id === spec.id
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {spec.specialty}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Seleccionar Doctor */}
          {selectedSpecialty && (
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h3 className="mb-4 text-sm font-bold uppercase text-slate-500">
                3. Seleccionar Doctor
              </h3>
              <input
                type="text"
                className="mb-4 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Filtrar doctores..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
              />
              {loadingDoctors ? (
                <div className="py-4 text-center text-sm text-slate-500">
                  Cargando...
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {doctors.map((doc) => (
                    <button
                      key={doc.profile_id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        selectedDoctor?.profile_id === doc.profile_id
                          ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                          : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <img
                        src={
                          doc.profile?.avatar_url || "https://i.pravatar.cc/150"
                        }
                        alt="Avatar"
                        className="h-10 w-10 rounded-full bg-slate-200 object-cover"
                      />
                      <div>
                        <div className="font-bold text-slate-800">
                          Dr. {doc.profile?.last_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          CMP: {doc.cmp_code}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Seleccionar Horario */}
          {selectedDoctor && (
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h3 className="mb-4 text-sm font-bold uppercase text-slate-500">
                4. Disponibilidad
              </h3>

              <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 p-2">
                <button
                  onClick={() => changeWeek(-1)}
                  className="rounded p-1 hover:bg-slate-200"
                >
                  <ChevronLeft size={20} className="text-slate-500" />
                </button>
                <span className="font-bold text-slate-700">
                  Semana del {currentWeekStart.toLocaleDateString()}
                </span>
                <button
                  onClick={() => changeWeek(1)}
                  className="rounded p-1 hover:bg-slate-200"
                >
                  <ChevronRight size={20} className="text-slate-500" />
                </button>
              </div>

              {loadingSlots ? (
                <div className="py-4 text-center text-sm text-slate-500">
                  Calculando horarios...
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {availableSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg border p-2 text-center transition-all ${
                        selectedSlot === slot
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white hover:border-blue-300"
                      }`}
                    >
                      <div
                        className={`text-[10px] uppercase ${
                          selectedSlot === slot
                            ? "text-blue-100"
                            : "text-slate-500"
                        }`}
                      >
                        {slot.date.toLocaleDateString("es-ES", {
                          weekday: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="font-bold">{slot.time}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm italic text-slate-400">
                  No hay horarios disponibles esta semana.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleCreateAppointment}
            disabled={!selectedSlot || !selectedPatient}
            className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none"
          >
            Confirmar Cita
          </button>
        </div>
      )}

      {view === "new_case" && (
        <div className="space-y-6">
          <button
            onClick={() => setView("home")}
            className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800"
          >
            <ChevronLeft size={16} /> Volver
          </button>
          <h2 className="text-2xl font-bold text-slate-800">
            Nuevo Caso Clínico
          </h2>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-2 text-sm font-bold uppercase text-slate-500">
              Paciente
            </h3>
            {selectedPatient ? (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
                <span className="font-bold text-blue-900">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </span>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative mb-4">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-slate-400"
                />
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Buscar paciente..."
                  value={patientSearch}
                  onChange={(e) => searchPatients(e.target.value)}
                />
                {patients.length > 0 && (
                  <div className="absolute left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        className="w-full border-b border-slate-50 px-4 py-2 text-left text-sm hover:bg-slate-50"
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatients([]);
                          setPatientSearch("");
                        }}
                      >
                        {p.first_name} {p.last_name} ({p.dni})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <h3 className="mb-2 text-sm font-bold uppercase text-slate-500">
              Código del Caso
            </h3>
            <input
              type="text"
              className="mb-6 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Ej: HD-2024-005"
              value={newCaseCode}
              onChange={(e) => setNewCaseCode(e.target.value)}
            />

            <button
              onClick={handleCreateCase}
              disabled={!selectedPatient || !newCaseCode || creatingCase}
              className="w-full rounded-xl bg-green-600 py-4 font-bold text-white shadow-lg shadow-green-600/20 transition-all hover:bg-green-700 disabled:bg-slate-300 disabled:shadow-none"
            >
              {creatingCase ? "Creando..." : "Crear Caso"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
