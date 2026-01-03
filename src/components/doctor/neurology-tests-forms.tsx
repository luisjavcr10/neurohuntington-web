"use client";

import { X } from "lucide-react";
import React, { useEffect, useState } from "react";

// --- COMPONENTES AUXILIARES ---
const ScoreOption = ({ value, label, current, onSelect }: any) => (
  <button
    onClick={() => onSelect(value)}
    className={`px-3 py-1.5 rounded-2xl border text-xs font-medium transition-colors ${
      current === value
        ? "bg-blue-100 border-blue-600 text-blue-700 font-bold"
        : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
    }`}
  >
    {value} - {label}
  </button>
);

const Modal = ({ visible, onClose, children, title }: any) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
      </div>
    </div>
  );
};

// --- 1. UHDRS MOTOR ASSESSMENT ---
export const MotorAssessmentForm = ({
  visible,
  onClose,
  initialData,
  onSave,
}: any) => {
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialData) setScores(initialData);
  }, [initialData]);

  const updateScore = (key: string, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const calculateTotal = () => Object.values(scores).reduce((a, b) => a + b, 0);

  const renderItem = (id: string, label: string, options: string[]) => (
    <div className="mb-4 pb-4 border-b border-slate-100 last:border-0">
      <p className="text-sm font-semibold text-slate-600 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt, idx) => (
          <ScoreOption
            key={idx}
            value={idx}
            label={opt}
            current={scores[id] ?? 0}
            onSelect={(v: number) => updateScore(id, v)}
          />
        ))}
      </div>
    </div>
  );

  const scale04 = ["Normal", "Leve/Dudoso", "Leve/Claro", "Moderado", "Severo"];
  const choreaScale = [
    "Ausente",
    "Leve/Intermitente",
    "Leve/Común",
    "Moderada/Común",
    "Marcada/Prolongada",
  ];

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="UHDRS - Evaluación Motora"
    >
      <div className="text-center mb-6">
        <span className="text-2xl font-bold text-blue-600">
          PUNTAJE TOTAL: {calculateTotal()} / 124
        </span>
      </div>

      <h4 className="text-sm uppercase font-bold text-slate-500 bg-slate-100 p-2 rounded mb-4">
        1. Oculomotor
      </h4>
      {renderItem("ocular_pursuit_h", "1a. Persecución Ocular Horizontal", [
        "Completa",
        "Sacádico",
        "Interrumpida",
        "Rango inc.",
        "Incapaz",
      ])}
      {renderItem("ocular_pursuit_v", "1b. Persecución Ocular Vertical", [
        "Completa",
        "Sacádico",
        "Interrumpida",
        "Rango inc.",
        "Incapaz",
      ])}
      {renderItem("saccade_init_h", "2a. Iniciación Sacádicos Horiz.", [
        "Normal",
        "Latencia+",
        "Parpadeo",
        "Cabeza",
        "Incapaz",
      ])}
      {renderItem("saccade_init_v", "2b. Iniciación Sacádicos Vert.", [
        "Normal",
        "Latencia+",
        "Parpadeo",
        "Cabeza",
        "Incapaz",
      ])}
      {renderItem("saccade_vel_h", "3a. Velocidad Sacádicos Horiz.", [
        "Normal",
        "Lento Leve",
        "Lento Mod",
        "Muy Lento",
        "Incompleto",
      ])}
      {renderItem("saccade_vel_v", "3b. Velocidad Sacádicos Vert.", [
        "Normal",
        "Lento Leve",
        "Lento Mod",
        "Muy Lento",
        "Incompleto",
      ])}

      <h4 className="text-sm uppercase font-bold text-slate-500 bg-slate-100 p-2 rounded mb-4 mt-6">
        2. Habla y Lengua
      </h4>
      {renderItem("dysarthria", "4. Disartria", [
        "Normal",
        "Poco Claro",
        "Repetir",
        "Incomprensible",
        "Mudo",
      ])}
      {renderItem("tongue_protrusion", "5. Protrusión Lengua", [
        "10s",
        "<10s",
        "<5s",
        "Parcial",
        "No sale",
      ])}

      <h4 className="text-sm uppercase font-bold text-slate-500 bg-slate-100 p-2 rounded mb-4 mt-6">
        3. Distonía (0-4)
      </h4>
      {renderItem("dystonia_trunk", "6a. Tronco", choreaScale)}
      {renderItem("dystonia_rue", "6b. Brazo Der.", choreaScale)}
      {renderItem("dystonia_lue", "6c. Brazo Izq.", choreaScale)}
      {renderItem("dystonia_rle", "6d. Pierna Der.", choreaScale)}
      {renderItem("dystonia_lle", "6e. Pierna Izq.", choreaScale)}

      <h4 className="text-sm uppercase font-bold text-slate-500 bg-slate-100 p-2 rounded mb-4 mt-6">
        4. Corea (0-4)
      </h4>
      {renderItem("chorea_face", "7a. Cara", choreaScale)}
      {renderItem("chorea_bol", "7b. Boca/Lengua", choreaScale)}
      {renderItem("chorea_trunk", "7c. Tronco", choreaScale)}
      {renderItem("chorea_rue", "7d. Brazo Der.", choreaScale)}
      {renderItem("chorea_lue", "7e. Brazo Izq.", choreaScale)}
      {renderItem("chorea_rle", "7f. Pierna Der.", choreaScale)}
      {renderItem("chorea_lle", "7h. Pierna Izq.", choreaScale)}

      <h4 className="text-sm uppercase font-bold text-slate-500 bg-slate-100 p-2 rounded mb-4 mt-6">
        5. Movilidad
      </h4>
      {renderItem("gait", "14. Marcha", [
        "Normal",
        "Base Ancha",
        "Dificultad",
        "Asistencia",
        "No Camina",
      ])}
      {renderItem("tandem", "15. Tándem (10 pasos)", [
        "Normal",
        "1-3 Error",
        ">3 Error",
        "No completa",
        "No Intenta",
      ])}
      {renderItem("retropulsion", "8. Pull Test", [
        "Normal",
        "Recupera",
        "Caería",
        "Cae",
        "No puede",
      ])}

      <h4 className="text-sm uppercase font-bold text-slate-500 bg-slate-100 p-2 rounded mb-4 mt-6">
        6. Destreza y Rigidez
      </h4>
      {renderItem("finger_taps_r", "9a. Toque Dedos (Der)", [
        ">=15",
        "11-14",
        "7-10",
        "3-6",
        "0-2",
      ])}
      {renderItem("finger_taps_l", "9b. Toque Dedos (Izq)", [
        ">=15",
        "11-14",
        "7-10",
        "3-6",
        "0-2",
      ])}
      {renderItem("pro_sup_r", "10a. Pron/Sup (Der)", scale04)}
      {renderItem("pro_sup_l", "10b. Pron/Sup (Izq)", scale04)}
      {renderItem("luria", "11. Luria (Puño-Canto-Palma)", [
        ">=4/10s",
        "<4/10s",
        "Con Pistas",
        "<4 Con Pistas",
        "No puede",
      ])}
      {renderItem("rigidity_r", "12a. Rigidez (Der)", [
        "Ausente",
        "Leve/Activ",
        "Leve/Mod",
        "Severa",
        "Limitada",
      ])}
      {renderItem("rigidity_l", "12b. Rigidez (Izq)", [
        "Ausente",
        "Leve/Activ",
        "Leve/Mod",
        "Severa",
        "Limitada",
      ])}
      {renderItem("bradykinesia", "13. Bradicinesia", [
        "Normal",
        "Mínima",
        "Leve",
        "Moderada",
        "Marcada",
      ])}

      <div className="mt-8">
        <button
          onClick={() => onSave(scores, calculateTotal())}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
        >
          Guardar Evaluación Motora
        </button>
      </div>
    </Modal>
  );
};

// --- 2. MMSE COGNITIVE ---
export const MMSEForm = ({ visible, onClose, initialData, onSave }: any) => {
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialData) setScores(initialData);
  }, [initialData]);
  const update = (k: string, v: number) => setScores((p) => ({ ...p, [k]: v }));
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  const renderInput = (id: string, label: string, max: number) => (
    <div className="mb-4 pb-4 border-b border-slate-100 last:border-0 flex items-center justify-between">
      <span className="text-sm font-semibold text-slate-600 mr-4">
        {label} (Max {max})
      </span>
      <input
        type="number"
        className="w-16 p-2 text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        placeholder="0"
        value={scores[id] ?? ""}
        onChange={(e) => {
          let v = parseInt(e.target.value) || 0;
          if (v > max) v = max;
          update(id, v);
        }}
      />
    </div>
  );

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="MMSE - Cognitivo (Max 35)"
    >
      <div className="text-center mb-6">
        <span className="text-2xl font-bold text-blue-600">
          TOTAL: {total} / 35
        </span>
      </div>

      <h4 className="text-sm uppercase font-bold text-slate-500 bg-slate-100 p-2 rounded mb-4">
        1. Orientación
      </h4>
      {renderInput("ori_time", "Temporal (Día, Mes, Año, etc)", 5)}
      {renderInput("ori_space", "Espacial (Lugar, Piso, Ciudad...)", 5)}

      <h4 className="text-sm uppercase font-bold text-slate-500 bg-slate-100 p-2 rounded mb-4 mt-6">
        2. Fijación y Memoria
      </h4>
      {renderInput("registration", "Repetición 3 Palabras", 3)}
      {renderInput("recall", "Recuerdo Diferido 3 Palabras", 3)}

      <h4 className="text-sm uppercase font-bold text-slate-500 bg-slate-100 p-2 rounded mb-4 mt-6">
        3. Concentración
      </h4>
      {renderInput("serial7", "Restas sucesivas (30-3...)", 5)}
      {renderInput("digits_back", "Dígitos Inversos (5-9-2)", 3)}

      <h4 className="text-sm uppercase font-bold text-slate-500 bg-slate-100 p-2 rounded mb-4 mt-6">
        4. Lenguaje
      </h4>
      {renderInput("naming", "Denominación (Lápiz, Reloj)", 2)}
      {renderInput("repetition", "Repetición Frase", 1)}
      {renderInput("abstraction", "Abstracción (Colores, Animales)", 2)}
      {renderInput("command3", "Orden 3 Comandos", 3)}
      {renderInput("reading", "Lectura y Ejecución", 1)}
      {renderInput("writing", "Escritura Frase", 1)}
      {renderInput("copying", "Copia Dibujo", 1)}

      <div className="mt-8">
        <button
          onClick={() => onSave(scores, total)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
        >
          Guardar MMSE
        </button>
      </div>
    </Modal>
  );
};

// --- 3. PBA BEHAVIORAL ---
export const PBAForm = ({ visible, onClose, initialData, onSave }: any) => {
  const [scores, setScores] = useState<Record<string, number>>({});
  useEffect(() => {
    if (initialData) setScores(initialData);
  }, [initialData]);
  const update = (k: string, v: number) => setScores((p) => ({ ...p, [k]: v }));
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  const userItems = [
    ["sad_mood", "Tristeza / Ánimo"],
    ["guilt", "Baja Autoestima / Culpa"],
    ["anxiety", "Ansiedad"],
    ["suicidal", "Pensamientos Suicidas"],
    ["aggressive", "Comp. Agresivo"],
    ["irritable", "Comp. Irritable"],
    ["obsessions", "Obsesiones"],
    ["compulsions", "Compulsiones"],
    ["delusions", "Delirios"],
    ["hallucinations", "Alucinaciones"],
  ];

  return (
    <Modal visible={visible} onClose={onClose} title="PBA - Conductual">
      <div className="text-center mb-2">
        <span className="text-2xl font-bold text-blue-600">TOTAL: {total}</span>
      </div>
      <p className="text-xs text-center text-slate-400 italic mb-6">
        0=Ausente, 1=Leve, 2=Ligera, 3=Moderada, 4=Severa
      </p>

      {userItems.map(([key, label]) => (
        <div
          key={key}
          className="mb-4 pb-4 border-b border-slate-100 last:border-0"
        >
          <p className="text-sm font-semibold text-slate-600 mb-2">{label}</p>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4].map((v) => (
              <ScoreOption
                key={v}
                value={v}
                label={v.toString()}
                current={scores[key] ?? 0}
                onSelect={(val: any) => update(key, val)}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8">
        <button
          onClick={() => onSave(scores, total)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
        >
          Guardar PBA
        </button>
      </div>
    </Modal>
  );
};

// --- 4. FUNCTIONAL CAPACITY ---
export const FCForm = ({ visible, onClose, initialData, onSave }: any) => {
  const [scores, setScores] = useState<Record<string, number>>({});
  useEffect(() => {
    if (initialData) setScores(initialData);
  }, [initialData]);
  const update = (k: string, v: number) => setScores((p) => ({ ...p, [k]: v }));
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  const renderOptions = (key: string, label: string, opts: string[]) => (
    <div className="mb-4 pb-4 border-b border-slate-100 last:border-0">
      <p className="text-sm font-semibold text-slate-600 mb-2">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {opts.map((txt, idx) => (
          <button
            key={idx}
            onClick={() => update(key, idx)}
            className={`px-3 py-2 rounded-xl border text-xs font-medium text-left transition-colors ${
              scores[key] === idx
                ? "bg-blue-100 border-blue-600 text-blue-700 font-bold"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
          >
            {idx} - {txt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Capacidad Funcional (TFC)"
    >
      <div className="text-center mb-6">
        <span className="text-2xl font-bold text-blue-600">
          TOTAL: {total} / 13
        </span>
      </div>

      {renderOptions("occupation", "1. Ocupación", [
        "Incapaz",
        "Marginal",
        "Reducida",
        "Normal",
      ])}
      {renderOptions("finances", "2. Finanzas", [
        "Incapaz",
        "Asist. Mayor",
        "Asist. Ligera",
        "Normal",
      ])}
      {renderOptions("chores", "3. Tareas Domésticas", [
        "Incapaz",
        "Deteriorado",
        "Normal",
      ])}
      {renderOptions("adl", "4. Actividades Vida Diaria", [
        "Cuidado Total",
        "Solo Básicas",
        "Deterioro Mín",
        "Normal",
      ])}
      {renderOptions("care_level", "5. Nivel Cuidado", [
        "Enfermería Prof.",
        "Casa/Crónico",
        "Casa",
      ])}

      <div className="mt-8">
        <button
          onClick={() => onSave(scores, total)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
        >
          Guardar TFC
        </button>
      </div>
    </Modal>
  );
};
