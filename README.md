# Roboking: Intelligence in Motion

A complete, responsive company website built with HTML, CSS and JavaScript.

## Run locally

Requires Node.js 22 or later. Run `npm install`, then `npm run dev`.
The local preview is available at http://localhost:4173.

`dist/` is the complete deployable site. There is no runtime framework or build step.

## Included

- Original quadruped, drone and robotic-arm concept imagery, optimized to WebP.
- Supplied crown logo, with locally hosted typography.
- SVG quadruped companion with cursor-tracking eyes, greeting animation and reduced-motion support.
- Six keyboard-accessible robotics sector tabs.
- Four working estimators: battery runtime, drivetrain speed, drone lift ratio, and electrical current.
- Project brief builder with email draft, clipboard and text download.
- Responsive navigation, accessible labels, native dialog and keyboard focus indicators.

## Contact and content provenance

- Logo supplied by the user: `C:\Users\night\Downloads\rk\logo.jpeg`.
- Email `sales@roboking.in` and phone `+91 96505 26625` verified from https://www.roboking.in/ and its public application bundle on 2026-10-10.
- Location `Malerkotla, Punjab, India` explicitly confirmed by the user. The existing website listed New Delhi; the new design follows the user's corrected location. No street address was supplied.
- Company positioning reflects the user brief and the current site's robotics and hardware sourcing description. No customer testimonials, certifications, deployment metrics or product specifications have been invented.
- Generated images are marked as concept visualizations. Originals and prompt provenance are in `artwork/`.

## Form behaviour

The form prepares an email draft addressed to Roboking. The visitor must send it through their email client. It does not claim to submit to a backend or retain personal information. A text download and clipboard option provide alternatives.

## Verification

- `npm test`: calculator tests, including invalid inputs and units.
- `npm run test:browser`: Chrome desktop/mobile checks for all interactive features and overflow down to 320px. Requires Google Chrome.
- Screenshots and accessibility results are written to the ignored `artifacts/` folder.

## Hosting

Site identity is tracked in `.openai/hosting.json`. The preview is owner-private.
The existing roboking.in domain has not been changed.

## Design and assets

The original PNGs were generated with the built-in image-generation tool. The site uses optimized WebP copies from `dist/assets/`. Fonts are DM Sans, Space Grotesk and IBM Plex Mono, sourced from Google Fonts. Their SIL Open Font License notices are included with the assets.
