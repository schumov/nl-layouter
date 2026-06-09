// apps/client/src/hooks/usePresets.ts
// TanStack Query v5 hooks for fetching preset data from the server.
// staleTime: Infinity — presets are developer-seeded static data that never changes at runtime.
import { useQuery } from '@tanstack/react-query';

const API = 'http://localhost:3001';

// PresetSummary — shape returned by GET /presets?type=...
// html_content is NOT included in the list response (too heavy for selector cards)
export interface PresetSummary {
  id:        string;
  type:      'header' | 'footer';
  name:      string;
  thumbnail: string | null;
}

// PresetFull — shape returned by GET /presets/:id
// Includes htmlContent for rendering in the canvas via dangerouslySetInnerHTML
export interface PresetFull extends PresetSummary {
  htmlContent: string;
}

/**
 * usePresets — fetches the list of presets for the given type.
 * Queries: GET /presets?type=header  or  GET /presets?type=footer
 * staleTime: Infinity — static seed data; never re-fetched after first load.
 */
export function usePresets(type: 'header' | 'footer') {
  return useQuery<PresetSummary[]>({
    queryKey: ['presets', type],
    queryFn:  async () => {
      const res = await fetch(`${API}/presets?type=${type}`);
      if (!res.ok) throw new Error(`Failed to load ${type} presets`);
      return res.json() as Promise<PresetSummary[]>;
    },
    staleTime: Infinity,
  });
}

/**
 * usePreset — fetches a single preset by id including htmlContent.
 * Queries: GET /presets/:id
 * enabled: !!id — disabled when id is empty string (no header/footer selected).
 * staleTime: Infinity — static seed data; never re-fetched after first load.
 */
export function usePreset(id: string) {
  return useQuery<PresetFull>({
    queryKey: ['preset', id],
    queryFn:  async () => {
      const res = await fetch(`${API}/presets/${id}`);
      if (!res.ok) throw new Error(`Failed to load preset: ${id}`);
      return res.json() as Promise<PresetFull>;
    },
    enabled:   !!id,   // disabled when id is empty — avoids fetching when no preset is selected
    staleTime: Infinity,
  });
}
