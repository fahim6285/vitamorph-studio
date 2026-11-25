# VitaMorph Studio by Fahim
**Verified CVs. Interactive portfolios. One accurate professional identity.**

This is a reusable CV-to-interactive-portfolio agent skill and a working, Netlify-ready starter website. It does NOT install itself into an account or publish a website automatically.

## What's inside
- `SKILL.md`: the reusable skill's main instructions.
- `AGENT_INSTRUCTIONS.md`: ready-to-paste setup for a plugin/agent builder.
- `references/quality_gate.md`: CV and portfolio verification checklist.
- `website/index.html`, `website/assets/`: working no-framework static portfolio.
- `website/profile.json`: the single editable source of portfolio facts.
- `scripts/build_profile.py`: generate the website's browser data from JSON.
- `scripts/verify_profile.py`: validates duplicates, links, public privacy and totals.

## Using as a CV/portfolio workflow
1. Give the agent the current authoritative CV and any change instructions. The agent builds a private claims ledger and reconciles discrepancies before issuing the polished CV.
2. Have the agent populate `website/profile.json` from the approved CV, and include only approved public information.
3. Generate site assets: `python scripts/build_profile.py` (run from this folder).
4. Run public checks: `python scripts/verify_profile.py --public`. Fix all errors and review warnings.
5. Open `website/index.html` locally. Test publication search/filter and print view.
6. To host, drag the `website` directory onto Netlify Drop, or use another static host. The URL is issued by the hosting service after deployment. The `website` directory—not the entire skill ZIP—is the folder to deploy.

## Using in ChatGPT
- If your eligible workspace has the Skills editor, upload this skill or create it from `SKILL.md`.
- If your account supports Plugin Creator, connect it and ask it to use the included `SKILL.md` and `AGENT_INSTRUCTIONS.md` for a new skill-driven plugin.
- In a regular chat, attach the ZIP or paste the instructions and your CV, then request: "Follow VitaMorph Studio to audit my CV and build the matching interactive CV."
- The ZIP is an agent blueprint and web starter. A native installed agent requires product eligibility and installation permissions.

## Content policy and practical limits
Do not trust data in the sample `website/profile.json` as a professional's real achievements. The sample deliberately contains no achievements. Real profiles must be built from verified materials. Never publish personal phone numbers, residential addresses, student IDs, outdated email addresses or private source documents by accident.

## Customization
The starter website uses an editorial ink/cream/rust/olive palette. Change design tokens in `website/assets/style.css`. Put a user-approved portrait at `website/assets/portrait.jpg` and add `"portrait": "assets/portrait.jpg"` to `website/profile.json` (and run build again). To offer a PDF download, place `cv.pdf` inside `website` and set `links.cv_pdf` to `cv.pdf`.

Generated: October 2026.

