"use client";
import { MODEL_GROUPS } from "../lib/llm";

export default function ModelSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "#171B24",
        color: "#F2F5F9",
        border: "1px solid #21E0DC",
        borderRadius: 6,
        padding: "7px 10px",
        fontSize: 12.5
      }}
    >
      {MODEL_GROUPS.map((g) => (
        <optgroup key={g.tier} label={g.tier}>
          {g.models.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
