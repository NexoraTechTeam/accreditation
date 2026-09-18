# NEXACCRED Requirement Readiness Prototype

Static prototype applying the Requirement Readiness AI Assistant to the NEXACCRED Accreditation review surface (`/accreditation/`).

## Demo flow
1. Open `index.html`.
2. Click **Head of Accreditation** on the role-selection screen.
3. On the dashboard, click **Ask AI**, **Overall Readiness 87%**, or **Next Accreditation Assessment**.
4. Capture a `REQUIREMENT_GAP` from the AI response.
5. Open **Findings** to inspect evidence context.
6. Open **Readiness**, complete review areas, resolve blocking findings, and sign off the version.
7. After sign-off, new findings are captured as `CHANGE_REQUEST` instead of overwriting the approved baseline.

## What is simulated
- Runtime screen/route context
- Reviewer identity and role
- Contextual Q&A guardrails
- Structured requirement-gap / clarification capture
- Evidence/audit record
- Requirement Readiness Gate
- Explicit version-specific human sign-off
- Post-baseline change-request handling
- JSON export

## Not connected yet
This prototype is not connected to an LLM, RAG/source documents, NEXACCRED backend, database, authentication/SSO, NEXONE, Slack, notifications, or production audit trails.

## Integration shape
In a real application the widget can be mounted once and receive context from the host application, e.g. project, environment, application version, route, screen, authenticated reviewer, stakeholder role, and optional entity context.
