# GOOGLE STITCH INTEGRATION AUDIT

> **System Environment Audit & Capability Assessment**  
> **Workspace:** Universal / Travel OS  
> **Integration Model:** Official Google `StitchMCP` Server via Model Context Protocol (MCP)  
> **Date:** August 31, 2026  

---

## 1. Executive Summary

This capability audit evaluates **Google Stitch** and defines its official, maintainable integration into the **Antigravity AI Development Environment**. 

Google Stitch is Google's generative UI/UX design tool platform, leveraging multimodal Gemini models (including `GEMINI_3_1_PRO` and `GEMINI_3_FLASH`) to generate, edit, tokenize, and variant UI screen designs and frontend structural layouts from natural language prompts, `design.md` token specifications, and visual references.

### Audit Verdict
- **Official Integration Available:** **YES**. Antigravity includes an eager/lazily loaded native Model Context Protocol (MCP) server named `StitchMCP`.
- **Third-Party Package Requirement:** **NONE**. Unofficial npm/PyPI packages named "stitch" are **strictly unnecessary** and present supply-chain security risks.
- **Authentication:** Managed transparently through Antigravity IDE single-sign-on (SSO) session tokens and Google user credentials. Zero raw API keys or plain-text secrets are required in codebase files or environment variables.
- **Reusability Status:** Fully universal. Operates across web apps (React, Vue, Vite, Tailwind, Laravel), mobile apps (React Native, Flutter, iOS, Android), dashboards, SaaS, ERPs, and landing pages.

---

## 2. Google Stitch Capabilities Matrix

Google Stitch provides a complete suite of generative UI capabilities exposed natively via `StitchMCP` JSON-RPC tools:

| Tool Identifier | Core Functionality | Input Parameters | Output Artifacts |
| :--- | :--- | :--- | :--- |
| `create_project` | Container creation for UI designs and frontend assets | `title` (string) | `projectId` (numeric ID string) |
| `list_projects` | Enumeration of user's Stitch design projects | None | List of projects, metadata, theme, screens |
| `get_project` | Full project inspection (theme tokens, screens, assets) | `projectId` | Complete project JSON with `designMd` & `screenInstances` |
| `delete_project` | Project removal | `projectId` | Confirmation status |
| `generate_screen_from_text` | Text-to-UI screen generation using Gemini 3.1 Pro / 3 Flash | `projectId`, `prompt`, `deviceType`, `modelId`, `designSystem` | Screen ID, layout components, screenshot asset, HTML/CSS |
| `get_screen` | Retrieves detailed screen structure, HTML/CSS, image asset URL | `projectId`, `screenId` | Screen DOM components, image download URL, prompt history |
| `edit_screens` | Natural language targeted editing of existing UI screens | `projectId`, `screenIds`, `prompt` | Updated screen version & updated visual layout |
| `generate_variants` | Generates layout & style variants for screen exploration | `projectId`, `screenId`, `prompt`, `variantCount` | Multiple screen variant objects |
| `upload_design_md` | Parses & applies tokenized `design.md` (colors, typography, radii) | `projectId`, `designMd` | Project theme update |
| `create_design_system` | Constructs standalone reusable design system asset | `name`, `colorVariant`, `namedColors`, `typography`, `spacing` | `designSystemId` asset path |
| `apply_design_system` | Applies custom design system asset to project/screen | `projectId`, `designSystemId` | Theme application status |

---

## 3. Integration Method Comparison

| Feature / Criteria | Official Antigravity `StitchMCP` | Google Cloud API / SDK | Third-Party Package (npm/pip) |
| :--- | :--- | :--- | :--- |
| **Official Status** | **Official Google Antigravity Integration** | Official Google Cloud API | Unofficial / Community |
| **Integration Complexity** | **Zero Setup** (Native MCP Server) | High (GCP Service Account, IAM, OAuth) | Variable / High risk |
| **Credential Safety** | **100% Safe** (IDE Session token managed) | Manual env var management | Danger of token leak |
| **Tool Capabilities** | Full (Projects, Screens, Variants, Tokens) | API dependent | Fragmented / Partial |
| **Multi-Stack Support** | Universal (HTML/CSS, React, RN, Tailwind) | Code dependent | Hardcoded templates |
| **Maintenance Standard** | Maintained automatically by IDE | Requires manual SDK updates | Abandonment risk |

### Recommendation
**Use `StitchMCP` natively.** It is the official, safest, and most fully featured integration method.

---

## 4. Dependencies & System Requirements

### Hardware & OS
- Supported on Windows, macOS, and Linux.
- Execution takes place via Antigravity's local MCP handler communicating with Google Stitch backend endpoints.

### Software Dependencies
- Antigravity IDE (builtin support).
- No external npm CLI dependencies required.
- No local node_modules modifications needed.

### Configuration & Environment Variables
- `StitchMCP` does **NOT** expose or require hardcoded secrets in `.env` files.
- Session authentication is managed by the host environment.

---

## 5. Security & Credentials Assessment

1. **Zero Credential Exposure:** Neither project code, Git commits, documentation, nor terminal logs store Google Stitch API keys or personal access tokens.
2. **Data Boundary:** Design prompts and `design.md` files describe UI hierarchy and visual tokens. Sensitive database connection strings, API secrets, and private business logic must never be passed into screen generation prompts.
3. **Repository Cleanliness:** Generated screenshot URLs and design tokens are stored in Stitch Cloud or exported into documentation files. No binary bloated artifacts are forced into Git history.

---

## 6. Current Limitations & Mitigation Strategies

1. **Generation Latency:**
   - *Limitation:* Text-to-UI screen generation using `GEMINI_3_1_PRO` can take 60–180 seconds.
   - *Mitigation:* `StitchMCP` instructions advise non-blocking status polling via `get_screen` if an initial call times out. Do NOT issue rapid duplicate tool calls.
2. **Code Translation Layer:**
   - *Limitation:* Stitch outputs high-fidelity visual layouts and structured DOM/CSS components, but does not know your project's internal React hook structure, state manager (Zustand/Redux), or ORM model.
   - *Mitigation:* Follow the strict **Design → Code Workflow** (Section 11). Never blindly paste raw code; extract visual hierarchy, spacing, and design system tokens into existing clean architecture.
3. **Device Aspect Ratios:**
   - *Limitation:* Screens must be explicitly flagged with `deviceType` (`MOBILE`, `DESKTOP`, `TABLET`, `AGNOSTIC`) to ensure proper layout generation.

---

## 7. Recommended Workflow Summary

```text
[REQUIREMENTS & UX BRIEF]
           │
           ▼
[DESIGN TOKEN SPECIFICATION (design.md)]
           │
           ▼
[StitchMCP: upload_design_md / create_design_system]
           │
           ▼
[StitchMCP: generate_screen_from_text (GEMINI_3_1_PRO)]
           │
           ▼
[StitchMCP: get_screen / edit_screens / generate_variants]
           │
           ▼
[DESIGN REVIEW & COMPONENT ISOLATION]
           │
           ▼
[PRODUCTION IMPLEMENTATION IN REACT/TAILWIND/RN]
           │
           ▼
[VISUAL QA & POLISH]
```
