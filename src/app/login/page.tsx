"use client";

import { useAuth } from "@/context/AuthContext";
import { Activity, Eye, EyeOff, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor ingresa correo y contraseña");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Falló el inicio de sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-md">
        {/* Header / Logo */}
        <div className="mb-10 flex flex-col items-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Activity size={32} color="#fff" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">
            Neuro<span className="text-blue-600">Center</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sistema Especializado Huntington
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Email Input */}
          <div className="flex h-14 items-center rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <User size={20} className="mr-3 text-slate-400" />
            <input
              type="email"
              className="w-full bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400"
              placeholder="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {/* Password Input */}
          <div className="flex h-14 items-center rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <Lock size={20} className="mr-3 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              className="w-full bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff size={20} className="text-slate-400" />
              ) : (
                <Eye size={20} className="text-slate-400" />
              )}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Botón Login */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex h-14 items-center justify-center rounded-xl bg-slate-800 text-base font-bold text-white shadow-lg shadow-black/20 transition-all hover:bg-slate-700 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-300">
            Powered by Supabase & AI
          </p>
        </div>
      </div>
    </div>
  );
}
