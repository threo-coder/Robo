# Publication Handoff

The four-page redesign is updated locally on 2026-10-11 with an independently articulated 3D hero. The former photograph deformation is no longer loaded. The new hero has seated, standing and resting poses, continuous viewer-facing gaze, a static architectural plate, and a revised header. The hosted site has NOT been updated.

## Existing Identity

- Project: `appgprj_6aca005b28408191af982db144b023b2`
- Live URL: https://roboking-studio.crispangel4.chatgpt.site
- Last verified live source SHA before this redesign: `aca43d4570a30ea386e860b62212ac55a85367c0`
- Audience was owner-private. Preserve the existing identity and audience; do not create a replacement Site.

## Blocker

The source helper opened this existing project successfully before editing. At publication, `get_site` and fresh credential creation returned `NOT_FOUND / project_not_found`. A second read returned the same error; `list_sites` returned an empty list. The user explicitly said they had not changed accounts or workspaces. The underlying cause is unconfirmed. No valid new write credential was obtained; expired credentials were not reused. No source push, save-version or deployment call was made for this redesign. The live site was not changed.

## Verified

- All seven calculator and robot stance/interpolation unit tests passed.
- All four pages passed WCAG 2/2.1 AA automated checks.
- Responsive overflow checks at widths 320, 390, 768, 1024 and 1440 passed.
- Ten distinct content images load correctly.
- The hero uses a 3D reinterpretation with adapted licensed geometry and original armor/head detailing, not an exact conversion of the original generated photograph.
- Real 3D head orientation, automatic/manual seated/standing/resting transitions, automatic-pose pause, reduced motion, touch compatibility, unavailable WebGL and lost-context fallbacks passed.
- A visible-wall pixel comparison is identical across cursor movements. The backdrop's source and geometry remain unchanged. No image-warp module, floating viewer or orbit controls are loaded.
- Carousel automatic/manual changes, pause, keyboard navigation and reduced motion passed.
- Four calculators, invalid values and retained inputs passed.
- Contact preselection, draft dialog, clipboard and download passed. No enquiry was sent.
- No browser exceptions or failed network responses in the main suite. Dependency audit reported zero vulnerabilities.

## Files

- Complete deployable output: `dist/`. Licensed articulated reference meshes are loaded by the new hero bundle.
- Backup ZIP: `artifacts/RoboKing-redesign.zip`.
- Current interaction recording: `artifacts/robot-natural-motion.webm`.
- Current screenshots: `artifacts/robot-final-desktop.png`, the `robot-framing-*.png` responsive checks, and the four `v3-*-full.png` page screenshots. Earlier neck-only screenshots/recordings are retained as history, not the current experience.
- Original artwork/prompts: `artwork/` and `artwork/PROMPTS-V3.md`.
- Build and test commands: README.md.

## Resume

Restore access to the same Sites project, read current audience, mint a fresh write credential and use the Sites source helper before further edits/synchronization. The opening result earlier in this session used the last-live SHA above and checkout `C:\Users\night\Downloads\rk\roboking-studio`. Preserve all current uncommitted redesign files.

Package/push with the source helper and the matching identity. On Windows, use Git for Windows Bash via `C:\Program Files\Git\bin` first in PATH and `TAR_OPTIONS=--force-local`; pass credentials only through hidden stdin. After successful helper output, save/deploy the exact returned SHA and archive through native Sites calls. Never publish the backup ZIP as if it were a source-helper-verified archive.
