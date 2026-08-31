# GOOGLE STITCH SETUP & MCP INTEGRATION GUIDE

> **Developer Integration & Setup Manual**  
> **Target Environment:** Antigravity AI IDE  
> **MCP Server:** `StitchMCP`  

---

## 1. Overview & Setup Status

Google Stitch is pre-configured and lazily loaded in the Antigravity development environment under the server identifier `StitchMCP`.

### Integration Summary
- **MCP Server Name:** `StitchMCP`
- **Location:** `C:\Users\spdit\.gemini\antigravity-ide\mcp\StitchMCP`
- **Authentication:** Automated IDE Session Authentication (Single Sign-On).
- **Supported Generative Models:** `GEMINI_3_1_PRO` (Recommended default), `GEMINI_3_FLASH`.
- **Supported Device Layouts:** `MOBILE`, `DESKTOP`, `TABLET`, `AGNOSTIC`.

---

## 2. MCP Command Reference

The agent interacts with Google Stitch via `call_mcp_tool` using the following exact tool schemas:

### A. Project Management
- `create_project`: `{"title": "Project Name"}`
- `list_projects`: `{}`
- `get_project`: `{"projectId": "123456789"}`
- `delete_project`: `{"projectId": "123456789"}`

### B. Design System & Tokens
- `upload_design_md`: `{"projectId": "123456789", "designMd": "YAML_FRONTMATTER_AND_MARKDOWN"}`
- `create_design_system_from_design_md`: `{"name": "System Name", "designMd": "..."}`
- `list_design_systems`: `{}`
- `apply_design_system`: `{"projectId": "123456789", "designSystemId": "assets/123"}`

### C. Screen Generation & Editing
- `generate_screen_from_text`:
  ```json
  {
    "projectId": "123456789",
    "prompt": "Detailed natural language screen specification",
    "deviceType": "MOBILE",
    "modelId": "GEMINI_3_1_PRO",
    "designSystem": "assets/optional_design_system_id"
  }
  ```
- `get_screen`: `{"projectId": "123456789", "screenId": "screen_uuid"}`
- `edit_screens`: `{"projectId": "123456789", "screenIds": ["screen_uuid"], "prompt": "Refinement prompt"}`
- `generate_variants`: `{"projectId": "123456789", "screenId": "screen_uuid", "prompt": "Variant prompt"}`

---

## 3. How to Execute a Design Project

### Step 1: Initialize Project Container
Call `StitchMCP:create_project` with a descriptive title (e.g., `Travel OS Core Experience`).
Note the returned `projectId` (e.g., `4044680601076201931`).

### Step 2: Establish Design Tokens (`design.md`)
Create a markdown string adhering to Stitch's design token schema with YAML frontmatter:

```markdown
---
name: Project Design Language
colors:
  surface: '#0F172A'
  primary: '#0EA5E9'
  on-primary: '#FFFFFF'
  secondary: '#F59E0B'
  background: '#020617'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
spacing:
  unit: 4px
  md: 16px
  lg: 24px
rounded:
  DEFAULT: 0.5rem
  lg: 1rem
---

## Visual Philosophy
Modern, dark-mode first, glassmorphic UI with high contrast and intuitive information hierarchy.
```

Call `StitchMCP:upload_design_md` passing `projectId` and `designMd`.

### Step 3: Generate Screen Brief & Request UI Generation
Formulate a structured screen brief covering UX hierarchy, key components, layout, and device targets.
Call `StitchMCP:generate_screen_from_text`:
- `projectId`: `<your_project_id>`
- `prompt`: `<detailed_screen_brief>`
- `deviceType`: `"MOBILE"` or `"DESKTOP"`
- `modelId`: `"GEMINI_3_1_PRO"`

### Step 4: Inspect Visual Output & Retrieve Metadata
Call `StitchMCP:get_screen` using the returned `screenId`.
Extract:
- Screenshot preview download URL (`downloadUrl`)
- HTML/CSS layout representation
- Component tree & suggested variants

### Step 5: Iterative Refinement & Variant Exploration
If visual adjustments are needed:
- Call `StitchMCP:edit_screens` with a target refinement prompt (e.g., "Add floating AI audio companion bar at bottom of mobile viewport").
- Call `StitchMCP:generate_variants` to explore alternative component treatments.

---

## 4. Design-to-Code Translation Rules

When incorporating Stitch generated UI designs into codebase:

1. **Extract Layout & Visual Hierarchy:** Treat Stitch output as the authoritative source for spacing, typography sizing, component grouping, and visual weight.
2. **Map to Existing Component Architecture:** Map Stitch components to existing design system primitives (`Card`, `Button`, `Badge`, `Avatar`, `Input`).
3. **Preserve Production State & Logic:** Never overwrite existing state hooks (`useState`, `useQuery`), API bindings, or backend database schemas with raw generated markup.
4. **Enforce Responsive Behavior:** Adapt desktop/mobile variations into unified responsive Tailwind/CSS code (e.g., using `md:flex-row flex-col`).

---

## 5. Troubleshooting & Limitations

- **Tool Call Timeout:**
  If `generate_screen_from_text` times out due to server load, **do not retry immediately**.
  Call `StitchMCP:get_screen` or `StitchMCP:get_project` every 30 seconds (up to 10 attempts) to retrieve the background-generated screen.
- **Model Deprecations:**
  Always specify `modelId: "GEMINI_3_1_PRO"` or `"GEMINI_3_FLASH"`. Do not use deprecated `GEMINI_3_PRO`.
- **Project Scope Isolation:**
  Store Stitch project IDs in documentation or local task tracking files. Do not check credentials into source code.
