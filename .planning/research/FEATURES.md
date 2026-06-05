# Feature Landscape: Visual HTML Email / Newsletter Builder

**Domain:** Web-based visual HTML email/newsletter builder (editorial tool)
**Researched:** 2026-06-05
**Confidence:** HIGH — synthesised from Unlayer docs, MJML docs, Stripo blog, caniemail.com, Litmus, Beefree/RGE Studio product pages

---

## Sources Used

| Source | What it informed |
|--------|-----------------|
| [docs.unlayer.com](https://docs.unlayer.com) | Built-in tools taxonomy (button, columns, divider, heading, HTML, image, menu, paragraph, social, table, text, timer, video, carousel) |
| [mjml.io/documentation](https://mjml.io/documentation/) | Email component model, preheader, responsive output, VML for Outlook |
| [caniemail.com](https://caniemail.com) | Client-specific CSS/HTML support (media queries 80.48%, flexbox unsupported in Outlook, dark mode ~42%) |
| [Litmus email client market share 2026](https://www.emailclientmarketshare.com/) | Apple+Gmail ≈ 90% of all opens; Outlook desktop ~3.67%; dark mode ≈ 35% of opens |
| [Litmus dark mode guide](https://litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers) | How email clients apply dark mode (force-invert, partial-invert, no-change); `prefers-color-scheme` workarounds |
| [Litmus email design best practices (2024)](https://litmus.com/blog/email-design-best-practices) | Modular design system, responsive design, mobile-first, CTA hierarchy, accessible design |
| [Beefree/RGE Studio product page](https://beefree.io/features/) | Template library (2,000+), collaboration features, brand kit, "inspiration catalog" as differentiator |
| [Mosaico GitHub (voidlabs/mosaico)](https://github.com/voidlabs/mosaico) | Template-driven architecture, template language approach |

---

## What Competitors Provide

### Unlayer (embeddable SDK)
Tools: Button, Carousel (AMP), Columns, Divider, Form, Heading, HTML (raw), Image, Menu, Paragraph, Social Media, Table, Text, Timer (countdown), Video  
Extras: Merge tags, custom tools API, design tags, special links, custom fonts, template library, dark mode editor UI, export HTML/design JSON

### Beefree / RGE Studio
Tools: All Unlayer equivalents + stock photo integration, animated GIF support, co-editing (collaboration), comment/review flow, brand kit (colors, fonts, logo stored), template catalog (2,000+), email + landing page + popup builder in one

### Stripo
Tools: Full WYSIWYG editor, drag-and-drop blocks, smart elements (synced modules), AMP emails, module library, email testing/preview in 90+ clients (via integrations), export to 70+ ESP platforms, conditional content, AI email assistant

### Mailchimp (built-in editor)
Classic content blocks: text, image, image+caption, image card, image group, button, divider, social follow, social share, video, product cards (ecommerce), code block  
Extras: Merge tags (`*|FNAME|*` syntax), preview in mobile/desktop, send test email, preheader text, reorder blocks

### Mosaico (open-source)
Template-driven: the editor controls only what the template exposes. No fixed component model — entirely template-defined. Simple, minimal UX. No built-in persistence.

---

## Table Stakes

**Must have or users leave.** These are features present in every serious email builder.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Drag-and-drop canvas** | Core interaction model; no drag-and-drop = not a visual builder | Medium | DnD between palette → canvas, and reorder on canvas |
| **Layout sections (rows)** | Structure of all emails; users think in rows/columns | Low–Medium | Stacked rows with 1/2/3-col variants; asymmetric (1:2, 2:1) |
| **Rich text block** | Every newsletter has body copy | Medium | WYSIWYG with bold, italic, link, lists, font size, alignment |
| **Named text styles** (Header / Subheader / Text) | Consistent typography across a newsletter | Low | Dropdown or button bar in the text toolbar |
| **Image block** | Every newsletter has images | Low | Src URL + alt text + link; resize proportionally |
| **Image-with-link block** | Clickable banners are universal | Low | Wraps `<a href>` around `<img>`; distinct from plain image |
| **Button (CTA) block** | Every newsletter has calls-to-action | Low | Label, href, background color, text color, border-radius, size |
| **Section reorder** | Building flow requires layout changes | Medium | Drag handles or up/down arrows per section |
| **Section delete** | Remove unwanted content | Low | Confirm dialog or undo-recoverable |
| **Element-level padding/spacing** | Spacing control is expected in any design tool | Low | Per-element top/bottom/left/right padding controls |
| **Section background color** | Visual email structure relies on banded color rows | Low | Color picker on each section |
| **Save newsletter** | Persistence is a baseline requirement | Low–Medium | Auto-save or explicit save to PostgreSQL backend |
| **Load / list newsletters** | Multi-document management | Low | Dashboard or list view per user |
| **Export as .html file** | The whole point of the tool | Medium | Inline all CSS; produce valid table-based HTML |
| **Inline style output** | Gmail strips `<head>` CSS blocks entirely | **High – Email-critical** | Must inline all CSS before export; use a library like `juice` |
| **Table-based HTML layout** | Outlook 2007–2019 uses Word rendering engine (no flexbox/grid) | **High – Email-critical** | All multi-column layouts must use `<table>` not `<div>` with flexbox |
| **Responsive output** | Mobile is primary reading environment (majority of opens) | High | Fluid widths (percentage) + media queries; columns stack on mobile |
| **Fixed 600 px content width** | Email convention; wider breaks in many clients | Low | Wrapper table at 600 px, 100% on mobile |
| **Desktop / mobile preview toggle** | Users validate rendering before export | Low–Medium | CSS width simulation in preview pane |
| **Header / footer preset selection** | Consistent branding across newsletter issues | Low | Per-newsletter header/footer selected from template presets |
| **Multi-user auth** | Multiple editors need separate accounts | Medium | Registration, login, JWT/session; each user sees own newsletters |
| **Divider / spacer element** | Vertical rhythm and visual separation | Low | Horizontal rule or empty spacer row |

---

## Differentiators

**Features that create competitive advantage. Not universally expected in a v1, but valued.**

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Pre-header text field** | Shown as inbox preview snippet in email clients (after subject line); all professional builders include it | Low | Hidden `<span>` at top of email body, max ~90 chars |
| **Section / element duplication** | Speeds up repetitive layouts (e.g., 3 identical article blocks) | Low | Clone a section with all its children |
| **Undo / redo** | Editorial workflow expectation; reduces fear of making mistakes | Medium | In-session history stack (browser memory); NOT the same as versioning |
| **Social media icon block** | Appears in nearly every newsletter footer | Low | Configurable icons (Twitter/X, Instagram, Facebook, LinkedIn) with links |
| **Dark mode–aware output HTML** | ~35% of email opens use dark mode; email clients handle it differently | High – Email-specific | Add `prefers-color-scheme: dark` media block + `data-ogsc` Outlook overrides; see [caniemail.com](https://caniemail.com/features/css-at-media-prefers-color-scheme/) |
| **Custom font support** | Brand consistency | Medium | Inject `<link>` + web-safe fallback stack; Gmail strips `<link>` in `<head>` so fallback is critical |
| **Mobile-specific visibility toggles** | Hide heavy visual blocks on mobile | Medium | CSS classes with `@media (max-width:600px) { display:none }` |
| **Image alt text field** | Accessibility + rendering with images blocked | Low | Text input per image element |
| **Section template presets ("saved blocks")** | Re-use a well-designed article block across issues | Medium | Save a section as named template; insert into any newsletter |
| **Inline HTML block** | Power-users and devs want escape hatch for custom code | Low | Raw `<td>` HTML insert, bypasses visual editing |
| **Column padding / gutter control** | Fine-grained layout control | Low | Per-column padding independent of section padding |
| **Background image on section** | Visually rich emails | High – Email-critical | Requires VML fallback `<!--[if gte mso 9]>...<![endif]-->` for Outlook |
| **Copy newsletter** | Start new issue from prior design | Low | Duplicate a whole newsletter document |
| **Newsletter rename** | Editorial management | Low | Inline rename on list/dashboard |

---

## Anti-Features

**Things to deliberately NOT build in v1** — either because they are out of scope, create unreasonable complexity, or belong to a sending platform rather than a builder.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Email sending / SMTP** | Explicitly out of scope; delivery requires bounce handling, unsubscribe management, CAN-SPAM/GDPR compliance, and ISP relationships | Export .html; user sends via their ESP |
| **Image hosting / CDN** | Significant infrastructure scope; storage costs, security, access control | Users provide image URLs or upload images to their own storage |
| **Real-time collaboration (simultaneous editing)** | Requires CRDTs or OT, conflict resolution, websocket infrastructure; disproportionate complexity for v1 | Simple multi-user model (one user at a time per newsletter) |
| **Version history / branching** | Git-like version management is complex; users need to understand the mental model | In-session undo/redo is sufficient for v1; explicit save points can come later |
| **Merge tags / personalization** | Dynamic content substitution (`{{first_name}}`) belongs to the sending platform, not the builder | Export HTML with placeholder text; ESP handles substitution |
| **AMP Email support** | AMP for Email requires a separate AMP HTML output, server-side signing, and Google whitelist registration; complex and niche | Plain HTML output only |
| **Countdown timers (live)** | Timer image generation requires a server-side GIF rendering service (e.g., sendtric.com API) | Not in scope; it's a delivery concern |
| **Video embed (playback)** | Email clients block video playback; common workaround is a thumbnail image linking to the video | Image-with-link is sufficient; true in-email video is Outlook-hostile |
| **Spam score testing** | Requires connection to spam checking APIs (SpamAssassin, Postmark); not a builder concern | Users test in their ESP or use Litmus/Email on Acid |
| **Send test email** | Requires SMTP setup; explicitly out of scope | Export and paste into ESP for test send |
| **Template marketplace / stock assets** | Requires content moderation, licensing, hosting; scope creep | Provide a curated set of header/footer presets shipped with the app |
| **AI content generation** | LLM API costs, prompt design, moderation; separate product surface | Scope to future milestone after core builder is stable |
| **A/B testing** | Requires two variants, a sending platform, and split audience logic | Not a builder concern |
| **Analytics / open tracking** | Pixel tracking + ESP integration; data privacy concerns | Not in scope |
| **Accessibility audit / scoring** | Requires parsing the output HTML and running heuristics; nice-to-have but not core | Document best practices instead |

---

## Feature Dependencies

```
Auth (register/login)
  └── Newsletter management (create / list / save / load)
       └── Builder canvas (DnD sections + elements)
            ├── Layout sections (1-col, 2-col, 3-col, asymmetric)
            │    └── Content elements (rich text, image, image+link, button)
            │         └── Element property panel (padding, colors, font, alignment)
            ├── Divider / spacer element
            ├── Header/footer preset selection
            └── Canvas state → Export as .html
                 ├── Inline CSS (juice or equivalent)          ← Email-critical
                 └── Table-based layout serialisation           ← Email-critical
```

Pre-header text → depends on export pipeline (injected into `<head>` / hidden `<span>`)  
Section duplication → depends on DnD reorder being stable  
Undo/redo → depends on immutable state management approach (e.g., history stack on canvas state)  
Mobile preview toggle → depends on export producing media-query-responsive HTML

---

## MVP Recommendation

### Must ship (table stakes for usability):

1. **Auth** — register, login, user-scoped data
2. **Newsletter CRUD** — create, name, save, load, list
3. **Canvas with DnD** — palette → canvas; section reorder; section delete
4. **Layout sections** — 1-col, 2-col, 3-col, small-left/big-right, small-right/big-left
5. **Content elements** — rich text (TipTap), image (URL + alt), image+link, button
6. **Header/footer preset selection**
7. **Export .html** — with inline CSS + table-based multi-column output
8. **Desktop/mobile preview toggle** — inside the UI
9. **Section/element padding & color controls** — property panel on right

### Strongly recommended for v1 (low-complexity differentiators):

10. **Pre-header text** — one text field; very low effort, high professional value
11. **Divider / spacer** — low complexity, expected by any editorial user
12. **Section duplication** — low effort, big UX win for repetitive layouts
13. **Image alt text field** — accessibility + basic email hygiene

### Defer to v2:

- Undo/redo (medium complexity; session-only history is hard to implement well without immutable state from day 1 — **design state management to support it even if not exposed yet**)
- Social media block (not complex but lower priority for editorial newsletter vs. marketing email)
- Dark mode–aware output (high complexity; needs separate design review)
- Saved section templates
- Custom font support

---

## Email-Specific Concerns

### 1. Table-Based Layout (CRITICAL)

**Problem:** Outlook 2007–2019 (still ~3.67% of opens; dominant in enterprise environments) uses the Microsoft Word HTML rendering engine, which does not support `display:flex`, `display:grid`, or CSS-driven multi-column layout.

**Required approach:** All multi-column layouts must be implemented using nested `<table>` elements with `cellpadding="0"` and `cellspacing="0"`, not `<div>` with flexbox.

```html
<!-- Required for Outlook compatibility -->
<table cellpadding="0" cellspacing="0" border="0" width="100%">
  <tr>
    <td width="50%" valign="top">Left column</td>
    <td width="50%" valign="top">Right column</td>
  </tr>
</table>
```

**Impact on builder architecture:** The export/serialisation layer must produce `<table>`-based HTML. The visual canvas can use flexbox/grid internally (it's a browser); only the exported HTML must be table-based.

### 2. Inline CSS (CRITICAL)

**Problem:** Gmail (54% of opens) strips all CSS from `<style>` and `<link>` blocks in the `<head>`. Only `style=""` inline attributes survive.

**Required approach:** After building the HTML tree, run a CSS inliner (e.g., [juice](https://github.com/Automattic/juice)) before generating the export file.

**Impact:** Style definitions can be written naturally during development; inlining is a post-processing step at export time.

### 3. Responsive / Mobile

**Problem:** Media queries (`@media`) are supported in ~80% of clients but NOT in Outlook Windows 2007–2019. Pure media-query responsiveness fails in Outlook.

**Required approach:** Hybrid responsive strategy:
- Use percentage column widths (fluid) as the primary mechanism
- Use media queries (`@media (max-width: 600px)`) as progressive enhancement for column stacking
- Outlook-specific workarounds via conditional comments `<!--[if mso]>...<![endif]-->`

### 4. Dark Mode

**Problem:** ~35% of email opens use dark mode. Different email clients handle it differently:
- **No change** (Apple Mail without meta tags, Gmail Desktop, AOL, Yahoo): Your email looks the same
- **Partial invert** (Apple Mail with meta tags enabled): Background inverted, some foreground adjustments
- **Force invert** (Outlook.com): Inverts colors using its own algorithm, can make light-colored text invisible on light backgrounds; workaround uses `data-ogsc`, `data-ogac`, `data-ogsb`, `data-ogab` attributes
- **Custom** (client honours `@media (prefers-color-scheme: dark)`): Only ~42% of clients support this

**v1 approach:** Design the export HTML defensively (avoid pure-white backgrounds with pure-black text that inverts poorly). Dark mode optimization (custom `prefers-color-scheme` styles) is a v2 differentiator.

### 5. Bulletproof Buttons

**Problem:** CSS `border-radius` is not supported in Outlook. Buttons in Outlook appear as rectangles.

**Required approach:** Use VML (Vector Markup Language) inside `<!--[if mso]>` conditional comments for rounded buttons in Outlook. MJML's `mj-msobutton` component does this automatically. For NL Layouter's own export, rounded buttons need the VML trick or accept rectangular Outlook buttons.

**v1 recommendation:** Accept rectangular buttons in Outlook (no rounded corners). Document this limitation. Bulletproof VML buttons are a v2 enhancement.

### 6. Image Width and Fluid Sizing

**Problem:** Fixed pixel widths on images break on mobile. Inline `width` attributes must coexist with `max-width: 100%` for responsive behavior.

**Required approach:** Always set `width` attribute on `<img>` tags (Outlook needs it), AND set `max-width: 100%; height: auto;` inline CSS for mobile. Outlook ignores `max-width`.

### 7. Pre-header Text

**What it is:** The 85–90-character snippet shown after the subject line in inbox listings (and visible in Apple Mail, Gmail, Outlook). Not visible in the email body.

**Implementation:** A `<span>` with `display:none; max-height:0; overflow:hidden;` placed immediately inside the `<body>` tag, before any visible content. Zero visual impact in rendered email.

**Value:** High — professional newsletters always include it. Implementation is trivial (one text input, one hidden `<span>` in export template).

---

## Phase-Specific Feature Guidance

| Phase Topic | Features to Include | Key Risk |
|-------------|---------------------|----------|
| Foundation / Auth | Auth, newsletter CRUD, empty canvas | State model design must accommodate DnD from day 1 |
| Core Builder | DnD layout + content elements, section controls | Export must be table-based from day 1; retrofitting is painful |
| Export Pipeline | Inline CSS, HTML serialisation, file download | Must inline CSS (juice); must test in Gmail + Outlook + Apple Mail |
| Polish / Presets | Header/footer presets, pre-header, section duplication, divider | Low-risk phase; refine existing features |
| Multi-user | Auth already in; newsletter list per user | Sharing/locking (if users edit same newsletter) needs access rules |

---

## Sources

- Unlayer built-in tools: https://docs.unlayer.com/docs/built-in-tools (HIGH confidence — official docs)
- MJML component list: https://mjml.io/documentation/ (HIGH confidence — official docs)
- MJML mj-preview (preheader): https://github.com/mjmlio/mjml/blob/master/packages/mjml-head-preview/README.md (HIGH confidence)
- MJML mj-msobutton (bulletproof Outlook buttons): Context7 MJML docs (HIGH confidence)
- caniemail.com — CSS @media support ~80.48%: https://caniemail.com (HIGH confidence — test-based data)
- caniemail.com — prefers-color-scheme ~41.86%: https://caniemail.com/features/css-at-media-prefers-color-scheme/ (HIGH confidence)
- caniemail.com — background-color ~100%: https://caniemail.com (HIGH confidence)
- Litmus email client market share (Feb 2026): https://www.emailclientmarketshare.com/ (MEDIUM confidence — Litmus sample, stated as "1.1 billion opens")
- Litmus dark mode guide: https://litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers (HIGH confidence — authoritative industry source)
- Litmus email design best practices: https://litmus.com/blog/email-design-best-practices (HIGH confidence)
- Mosaico architecture: https://github.com/voidlabs/mosaico (HIGH confidence — official repo)
