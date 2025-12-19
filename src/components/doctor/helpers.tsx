"use client";

import { ChevronDown, ChevronUp, LucideIcon } from "lucide-react";
import React, { useState } from "react";

// --- SUB-COMPONENTES UI ---

// 1. Acordeón Reutilizable
export const Accordion = ({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  color = "text-blue-600",
  borderColor = "border-blue-600",
}: {
  title: string;
  icon: LucideIcon;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  color?: string;
  borderColor?: string;
}) => (
  <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <button
      onClick={onToggle}
      className={`flex w-full items-center justify-between border-l-4 bg-white px-4 py-4 transition-colors hover:bg-slate-50 ${borderColor}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={color} />
        <span className="font-bold text-slate-700">{title}</span>
      </div>
      {isOpen ? (
        <ChevronUp size={20} className="text-slate-400" />
      ) : (
        <ChevronDown size={20} className="text-slate-400" />
      )}
    </button>
    {isOpen && (
      <div className="border-t border-slate-100 bg-white p-4">{children}</div>
    )}
  </div>
);

// 2. Renderizador de Tablas JSON Recursivo (Lab Results)
export const JsonResultsTable = ({
  data,
  level = 0,
}: {
  data: any;
  level?: number;
}) => {
  if (!data) return <span className="text-xs text-slate-400">Sin datos.</span>;
  if (typeof data !== "object")
    return (
      <span className="flex-wrap text-sm text-slate-700">{String(data)}</span>
    );

  // Manejo de Arrays
  if (Array.isArray(data)) {
    if (data.length === 0)
      return <span className="text-xs text-slate-400">[ Vacío ]</span>;
    return (
      <div className="flex flex-col gap-1">
        {data.map((item, idx) => (
          <div key={idx} className="ml-2 border-l-2 border-slate-300 pl-2">
            <JsonResultsTable data={item} level={level + 1} />
          </div>
        ))}
      </div>
    );
  }

  // Manejo de Objetos
  return (
    <div className="w-full">
      {Object.entries(data).map(([key, value], index) => (
        <div
          key={key}
          className={`flex border-b border-slate-100 p-2 last:border-0 ${
            index % 2 === 0 ? "bg-white" : "bg-slate-50"
          }`}
        >
          <span
            className="w-2/5 pr-2 text-[11px] font-bold uppercase text-slate-600"
            style={{ paddingLeft: level * 4 }}
          >
            {key.replace(/_/g, " ")}:
          </span>
          <div className="flex-1">
            <JsonResultsTable data={value} level={level + 1} />
          </div>
        </div>
      ))}
    </div>
  );
};
