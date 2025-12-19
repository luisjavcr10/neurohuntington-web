"use client";

import DoctorDashboard from "@/components/dashboards/doctor-dashboard";
import NurseDashboard from "@/components/dashboards/nurse-dashboard";
import PatientDashboard from "@/components/dashboards/patient-dashboard";
import ReceptionistDashboard from "@/components/dashboards/receptionist-dashboard";
import { useAuth } from "@/context/AuthContext";

// IDs basados en tu descripción
const ROLES = {
  ADMIN: 1,
  DOCTOR: 2,
  PATIENT: 3,
  RECEPTIONIST: 4,
  NURSE: 5,
};

export default function DashboardPage() {
  const { profile } = useAuth();

  // Loading state
  if (!profile) {
    return (
      <div className="flex justify-center p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Render based on role
  switch (profile.id_role) {
    case ROLES.DOCTOR:
      return <DoctorDashboard profile={profile} />;

    case ROLES.PATIENT:
      return <PatientDashboard profile={profile} />;

    case ROLES.RECEPTIONIST:
      return <ReceptionistDashboard profile={profile} />;

    case ROLES.NURSE:
      return <NurseDashboard profile={profile} />;

    case ROLES.ADMIN:
      // TODO: Admin Dashboard
      return (
        <div className="p-10 text-center">
          Dashboard de Admin (En Construcción)
        </div>
      );

    default:
      // Fallback
      return <PatientDashboard profile={profile} />;
  }
}
