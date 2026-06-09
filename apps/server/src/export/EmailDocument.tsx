// apps/server/src/export/EmailDocument.tsx
// Top-level email document component for Phase 9 HTML export pipeline.
//
// Responsibilities:
//   - Provides the react-email Html/Head/Body skeleton
//   - Injects pre-header hidden span immediately after <Body> open (EXPORT-06)
//   - Applies globalStyles.backgroundColor to the Body background
//   - Centers content in a contentWidth-wide wrapper table
//
// DOCTYPE + MSO head tags are injected by wrapWithDoctype() in doctype.ts
// AFTER react-email's render() call — not here.
import React from 'react';
import { Html, Head, Body } from '@react-email/components';

// ── Local types (mirrors apps/client/src/types/newsletter.ts — do not import cross-package) ──

interface GlobalStyles {
  fontFamily: string;
  backgroundColor: string;
  contentWidth: number;
  primaryColor: string;
}

export interface NewsletterDocBase {
  header: { presetId: string; variables: Record<string, string> };
  footer: { presetId: string; variables: Record<string, string> };
  rows: unknown[];
  globalStyles: GlobalStyles;
  preHeader?: string;
}

export interface EmailDocumentProps {
  doc: NewsletterDocBase;
  children: React.ReactNode;
}

export function EmailDocument({ doc, children }: EmailDocumentProps) {
  const { globalStyles } = doc;
  const contentWidth = globalStyles.contentWidth ?? 600;

  return (
    <Html lang="en">
      <Head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title></title>
      </Head>
      <Body
        style={{
          backgroundColor: globalStyles.backgroundColor,
          fontFamily: globalStyles.fontFamily,
          margin: '0',
          padding: '0',
        }}
      >
        {/* Pre-header: hidden span shown in inbox preview only (EXPORT-06).
            Only injected when preHeader text is present.
            display:none + opacity:0 + maxHeight:0 + overflow:hidden = belt-and-suspenders hiding.
        */}
        {doc.preHeader && doc.preHeader.trim().length > 0 && (
          <span
            style={{
              display: 'none',
              fontSize: '1px',
              color: '#ffffff',
              maxHeight: '0',
              overflow: 'hidden',
              opacity: 0,
            }}
            aria-hidden="true"
          >
            {doc.preHeader}
            {/* Zero-width non-joiner padding prevents Gmail preview bleed past 90 chars */}
            {'\u200C\u200B\u200C\u200B\u200C\u200B\u200C\u200B\u200C\u200B'}
          </span>
        )}

        {/* Outer centering table — 100% width, centers contentWidth inner table */}
        <table
          role="presentation"
          width="100%"
          style={{ borderCollapse: 'collapse', margin: '0', padding: '0' }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: '0' }}>
                {/* Content container — constrained to contentWidth px */}
                <table
                  role="presentation"
                  width={contentWidth}
                  style={{
                    borderCollapse: 'collapse',
                    width: `${contentWidth}px`,
                    maxWidth: `${contentWidth}px`,
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: '0' }}>
                        {children}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}

export default EmailDocument;
