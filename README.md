# RoboKing: Intelligence in Motion

A four-page robotics company site: Home, Solutions, Innovation Lab and Contact.

## Development

Requires Node.js 22+ and Google Chrome for browser QA.

- `npm install`
- `npm run build`: generate the four static pages and bundle the articulated Three.js hero.
- `npm run dev`: serve `dist/` at http://localhost:4173.
- `npm test`: calculator and robot pose/grounding unit tests.
- `npm run test:browser`: interactions, accessibility, responsive layouts and images across all four pages.
- `npm run test:framing`: all three robot poses remain in frame and the contact line stays below navigation at twelve screen sizes.
- `npm run test:robot`: 3D gaze, unchanged background pixels, automatic/manual poses, pause, reduced motion and WebGL fallbacks.

Page source and shared header/footer are in `scripts/build-pages.mjs`. Shared behavior and styling are in `dist/app.js`, `dist/styles.css` and `dist/robot-scene.css`; calculator and enquiry modules are in `dist/lab.js` and `dist/contact.js`. Articulated robot rendering is in `src/hero-robot.js`, with deterministic motion math in `src/robot-motion.js`. Rebuild after editing templates or robot source. `dist/` is the complete deployable site; no server API or CDN is required.

## Experience

- Ten distinct concept images, including the seated hero requested by the user: two front legs upright, two rear legs folded.
- Dark graphite and warm metallic visual direction, supplied crown logo, local fonts and responsive navigation.
- Home and Innovation Lab use a fully articulated 3D concept robot with custom ivory/graphite armor and a two-link optical neck. This is a 3D reinterpretation, not a pixel-identical reconstruction of the original AI photograph.
- Seated, standing and folded-rest poses cycle automatically, with eased transitions and a grounded leg-chain solver. Manual pose buttons and an automatic-pose pause are available.
- Independent quaternion-based head orientation follows the pointer and keeps the sensors directed toward the viewer. Subtle idle neck movements add variation; it does not spin its face away from the viewer or orbit the camera.
- The architectural background is a separate static plate. No photo displacement, wall deformation, inset image frame, floating viewer, chatbot, dragging or zoom controls.
- Reduced motion freezes animation; offscreen/hidden scenes pause. Touch does not hijack scrolling. Unsupported/lost WebGL shows the original static concept image.
- Six-sector carousel automatically switches every six seconds. Clicking or keyboard navigation selects a field. Hover, keyboard focus, hidden tabs, explicit pause and reduced motion suspend automatic changes.
- Four calculators: battery runtime, drivetrain speed, drone lift and electrical current. These are planning estimates, not safety validation.
- Project brief preview, email draft, clipboard copy and text download. Nothing is sent automatically or persisted; the visitor sends through their email client.

## Provenance

- User logo: `C:\Users\night\Downloads\rk\logo.jpeg`.
- `sales@roboking.in` and `+91 96505 26625` verified from https://www.roboking.in/ and its public application bundle on 2026-10-10.
- Malerkotla, Punjab, India was explicitly confirmed by the user. No street address was supplied; none is invented.
- No invented client records, testimonials, certifications, sales metrics or product specifications.
- Images are clearly identified as concepts. PNG originals and exact generation prompts are in `artwork/`, including `PROMPTS-V3.md`. WebP copies are in `dist/assets/`.
- The interactive concept adapts Unitree Go2 reference geometry under BSD-3-Clause with additional original armor, head and neck. The footer links the upstream license and Three.js MIT notice. No manufacture or endorsement claim is made. Earlier photo-warp and floating-viewer source is retained but not imported. See `artwork/MODEL-SOURCE.md`.
- DM Sans, Space Grotesk and IBM Plex Mono fonts are locally hosted with SIL Open Font License notices.

## Hosting

Vercel uses `vercel.json` at the repository root: Framework Preset **Other** (`framework: null`), Build Command `npm run build`, Output Directory `dist`. Keep the Vercel Root Directory at the repository root. This is a static multi-page website, not a server function; `server.mjs` is only the local preview server. Do not deploy it as Express or point a catch-all rewrite at it. Push configuration changes to the connected production branch to trigger a new deployment.

Existing identity and owner-private audience are retained in `.openai/hosting.json`. The roboking.in domain is not changed. Screenshots and deployment archives stay in ignored `artifacts/`.
