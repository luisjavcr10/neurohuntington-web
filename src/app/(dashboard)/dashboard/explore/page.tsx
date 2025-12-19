"use client";

import { Activity, BookOpen, Brain, Calendar, HeartPulse } from "lucide-react";

export default function ExplorePage() {
  const categories = [
    {
      title: "Ejercicios Cognitivos",
      icon: Brain,
      color: "bg-purple-500",
      description: "Mantén tu mente activa con estos recursos.",
    },
    {
      title: "Fisioterapia",
      icon: Activity,
      color: "bg-blue-500",
      description: "Ejercicios físicos adaptados a tus necesidades.",
    },
    {
      title: "Calendario de Citas",
      icon: Calendar,
      color: "bg-green-500",
      description: "Gestiona tus próximas visitas médicas.",
    },
    {
      title: "Salud Mental",
      icon: HeartPulse,
      color: "bg-red-500",
      description: "Recursos para el bienestar emocional.",
    },
    {
      title: "Educación",
      icon: BookOpen,
      color: "bg-amber-500",
      description: "Aprende más sobre la enfermedad de Huntington.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Explorar</h1>
        <p className="text-slate-500">Recursos y herramientas disponibles.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div
            key={category.title}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md"
          >
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white ${category.color}`}
            >
              <category.icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {category.title}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {category.description}
            </p>
            <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent transition-all group-hover:ring-blue-500/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
