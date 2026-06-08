import React from 'react';
import type { ButtonElement } from '../../types/newsletter';

// ⚠️ TAILWIND V4 RULE: All class names must be complete string literals.
// ⚠️ CC-2/CC-6: ALL configurable colours MUST be inline styles — NEVER Tailwind colour classes.
//   This component is rendered in email previews; email clients strip Tailwind class styles.
// ⚠️ font-medium (500) is FORBIDDEN — fontWeight must be 600 (font-semibold equivalent).

interface ButtonRendererProps {
  element: ButtonElement;
}

export function ButtonRenderer({ element }: ButtonRendererProps) {
  // Common styles applied to both variants
  const commonStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'center',
    padding: '12px 24px',
    borderRadius: element.borderRadius ?? '4px',
    textDecoration: 'none',
    fontWeight: 600,        // 600 = font-semibold equivalent; NEVER 500 (font-medium is FORBIDDEN)
    fontSize: '14px',
    boxSizing: 'border-box',
  };

  // D-05: ghost falls through to solid as a safe default.
  // ghost is a valid stored value — do NOT use assertNeverElement here.
  // Using !== 'outline' means: solid + ghost → solid rendering; only outline → outline rendering.
  const isSolid = element.style !== 'outline';

  const variantStyle: React.CSSProperties = isSolid
    ? {
        backgroundColor: element.backgroundColor,
        color: element.textColor,
        border: 'none',
      }
    : {
        backgroundColor: 'rgba(0, 0, 0, 0)',   // 'transparent' gets normalized away by jsdom; rgba is explicit
        color: element.backgroundColor,   // D-12: outline text colour derives from backgroundColor
        border: `2px solid ${element.backgroundColor}`,
      };

  return (
    // Outer wrapper centres the button within the column slot with breathing room
    <div className="w-full py-2 px-4">
      <a
        href={element.href || '#'}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...commonStyle, ...variantStyle }}
      >
        {element.label}
      </a>
    </div>
  );
}
