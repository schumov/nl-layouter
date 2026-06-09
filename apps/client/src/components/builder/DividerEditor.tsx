// apps/client/src/components/builder/DividerEditor.tsx
//
// ⚠️ TAILWIND V4 RULE: All class names must be complete string literals — no template literals.
// D-09: all controls dispatch onUpdate immediately on every onChange — no debounce.
// CC-2/CC-6: color values go in style={} — never in Tailwind class names.
// font-medium is FORBIDDEN — use font-semibold for all labels (STATE.md constraint).

import React from 'react';
import type { DividerElement } from '../../types/newsletter';
import { Input } from '@/components/ui/input';

interface DividerEditorProps {
  element: DividerElement;
  onUpdate: (patch: Partial<DividerElement>) => void;
}

export function DividerEditor({ element, onUpdate }: DividerEditorProps) {
  return (
    <div className="flex flex-col gap-4 p-4">

      {/* ── Color ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">Color</label>
        <div className="flex items-center gap-2">
          {/* Native color swatch — dispatches immediately (D-09) */}
          <input
            type="color"
            value={element.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="h-8 w-10 cursor-pointer rounded border border-border p-0"
          />
          {/* Hex text input — validates before dispatch */}
          <Input
            type="text"
            value={element.color}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                onUpdate({ color: val });
              }
            }}
            className="w-28 font-mono text-sm"
            maxLength={7}
            placeholder="#rrggbb"
          />
        </div>
      </div>

      {/* ── Thickness ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">Thickness</label>
          <span className="text-xs text-muted-foreground">{element.thickness}px</span>
        </div>
        <input
          type="range"
          min={1}
          max={8}
          step={1}
          value={element.thickness}
          onChange={(e) => onUpdate({ thickness: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* ── Spacing ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">Spacing</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={element.spacing}
            onChange={(e) => onUpdate({ spacing: Number(e.target.value) })}
            className="w-24"
          />
          <span className="text-xs text-muted-foreground">px (top + bottom)</span>
        </div>
      </div>

    </div>
  );
}
