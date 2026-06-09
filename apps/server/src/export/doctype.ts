// apps/server/src/export/doctype.ts
// Wraps a react-email rendered HTML string with the XHTML transitional DOCTYPE
// and MSO/VML namespace attributes required for Outlook compatibility.
//
// Called after @react-email/render() and juice() in pipeline.ts.
// react-email produces <!DOCTYPE html> + <html lang="en"> — we replace those
// with the XHTML 1.0 Transitional DOCTYPE + VML namespace attributes.

// ── DOCTYPE + namespace string ────────────────────────────────────────────────

const XHTML_DOCTYPE =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" ' +
  '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';

// MSO OfficeDocumentSettings block injected after <head> open tag
const MSO_HEAD_BLOCK =
  '<!--[if mso]><noscript><xml>' +
  '<o:OfficeDocumentSettings>' +
  '<o:AllowPNG/>' +
  '<o:PixelsPerInch>96</o:PixelsPerInch>' +
  '</o:OfficeDocumentSettings>' +
  '</xml></noscript><![endif]-->';

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Replace the default HTML5 DOCTYPE and <html> tag produced by react-email
 * with an XHTML 1.0 Transitional DOCTYPE and VML namespace attributes.
 * Inject MSO OfficeDocumentSettings block after the opening <head> tag.
 *
 * @param html  Raw HTML string from react-email render() + juice()
 * @returns     Email-client-compatible HTML with XHTML DOCTYPE + MSO head
 */
export function wrapWithDoctype(html: string): string {
  let result = html;

  // 1. Replace any existing DOCTYPE declaration (react-email emits <!DOCTYPE html>)
  result = result.replace(/<!DOCTYPE[^>]*>/i, XHTML_DOCTYPE);

  // 2. Replace <html ...> opening tag to add VML namespaces
  //    react-email typically emits: <html lang="en">
  //    We replace with: <html xmlns="..." xmlns:v="..." xmlns:o="..." lang="en">
  result = result.replace(
    /<html([^>]*)>/i,
    (_match, attrs: string) => {
      // Preserve existing attributes (e.g., lang="en"), strip any existing xmlns
      const cleanAttrs = attrs
        .replace(/\s+xmlns(?::\w+)?="[^"]*"/g, '')
        .trim();
      const sep = cleanAttrs ? ' ' : '';
      return (
        `<html` +
        ` xmlns="http://www.w3.org/1999/xhtml"` +
        ` xmlns:v="urn:schemas-microsoft-com:vml"` +
        ` xmlns:o="urn:schemas-microsoft-com:office:office"` +
        `${sep}${cleanAttrs}>`
      );
    }
  );

  // 3. Inject MSO OfficeDocumentSettings block after <head> open tag
  result = result.replace(/<head>/i, `<head>${MSO_HEAD_BLOCK}`);
  // Also handle <head with attributes> (e.g., react-email may not add attrs but be safe)
  result = result.replace(/<head\s[^>]*>/i, (match) => `${match}${MSO_HEAD_BLOCK}`);

  return result;
}
