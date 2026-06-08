import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ButtonElement } from '../../types/newsletter';

// ⚠️ TAILWIND V4 RULE: All class names must be complete string literals.
// ⚠️ font-medium (500) FORBIDDEN — only font-semibold (600) for labels.
// ⚠️ D-07: All fields dispatch onUpdate immediately on every onChange — no debounce.
// ⚠️ D-06: Style toggle uses variant="default" (active) vs variant="outline" (inactive).

interface ButtonEditorProps {
  element: ButtonElement;
  onUpdate: (patch: Partial<ButtonElement>) => void;
}

export function ButtonEditor({ element, onUpdate }: ButtonEditorProps) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Label field — ELEM-04 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground">Label</label>
        <Input
          value={element.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Button label"
          className="text-sm"
        />
      </div>

      {/* Link URL field — ELEM-04 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground">Link URL</label>
        <Input
          value={element.href}
          onChange={(e) => onUpdate({ href: e.target.value })}
          placeholder="https://..."
          className="text-sm"
        />
      </div>

      <div className="border-t border-border my-0" />

      {/* Background Color — ELEM-04 — native color picker + hex text input */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground">Background Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={element.backgroundColor}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
            aria-label="Background color swatch"
          />
          <Input
            value={element.backgroundColor}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#[0-9a-fA-F]{6}$/.test(v)) onUpdate({ backgroundColor: v.toLowerCase() });
            }}
            className="font-mono text-xs h-8 w-[88px]"
            maxLength={7}
          />
        </div>
      </div>

      {/* Text Color — ELEM-04 — native color picker + hex text input */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground">Text Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={element.textColor}
            onChange={(e) => onUpdate({ textColor: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
            aria-label="Text color swatch"
          />
          <Input
            value={element.textColor}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#[0-9a-fA-F]{6}$/.test(v)) onUpdate({ textColor: v.toLowerCase() });
            }}
            className="font-mono text-xs h-8 w-[88px]"
            maxLength={7}
          />
        </div>
      </div>

      <div className="border-t border-border my-0" />

      {/* Style toggle — ELEM-05 — D-06 segmented button group */}
      {/* variant="default" = active (filled); variant="outline" = inactive */}
      {/* D-05: ghost is NOT shown in Phase 6 editor */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-foreground">Style</label>
        <div className="flex gap-1">
          <Button
            variant={element.style === 'solid' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => onUpdate({ style: 'solid' })}
            type="button"
          >
            Filled
          </Button>
          <Button
            variant={element.style === 'outline' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => onUpdate({ style: 'outline' })}
            type="button"
          >
            Outline
          </Button>
        </div>
      </div>
    </div>
  );
}
