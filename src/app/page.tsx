"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login"); // Redirect to login if no user
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting...
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-2xl font-bold text-slate-800">
        Bienvenido, {user.email}
      </h1>
      <div className="mt-4 rounded-xl bg-white p-6 shadow-sm">
        <p className="text-slate-600">
          Has iniciado sesión correctamente. Esta es la página principal
          (Dashboard).
        </p>
      </div>
    </div>
  );
}
