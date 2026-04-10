# AppRequirements.md
# Digital Manufacturing PMO — Project Resourcing Tool

## Overview

A React/Vite single-page application that allows Project Leads to submit new project resource demands, enables Resource Managers and Theme Leads to review and assign named engineers, and allows the Prioritisation Board to approve projects. Approved projects reduce live engineer capacity, which is reflected in all subsequent submissions and reviews.

This is a proof-of-concept. No external system integrations are required. All data is persisted in a backend data store (see Data Storage section).

---

## User Roles

| Role | Description |
|---|---|
| `project_lead` | Submits new projects with skill demand forecasts |
| `resource_manager` | Reviews projects, assigns engineers, manages the engineer roster |
| `prioritisation_board` | Reviews pending projects and approves or rejects them |
| `pmo_admin` | Configures themes, skills, skill levels, and the engineer roster |

> Authentication/authorisation is out of scope for the POC. Role switching via a simple role selector in the UI header is sufficient.

---

## Core Concepts

### Themes and Skills

- The system organises skills under **Digital Themes** (e.g. MOM, MI&V, MBM).
- Each theme contains a configurable list of **skills** (e.g. "Simatic S7", "API Integrations").
- Each skill has a configurable **level taxonomy** — defaulting to: `Basic`, `Advanced`, `Specialist`.
- Themes, skills, and level labels are all managed by the `pmo_admin` role via a configuration screen.

### Engineers

- Each engineer aligns to one or more themese, use Theme>Skill as the process.
- Each engineer has a set of **skill assignments**: a skill + a proficiency level (e.g. Simatic S7 — Advanced).
- Each engineer has a **standard weekly capacity** (default: 40 hrs/week), configurable per engineer.
- Engineer records are maintained by the `resource_manager` or `pmo_admin`.

### Capacity

- An engineer's **available capacity** in any given week = `standard weekly capacity` minus hours already committed to approved projects in that week.
- Capacity is recalculated live whenever a project is approved.
- Engineers with zero remaining capacity in a week must not be assignable to new projects in that week.

### Project States

```
Draft → Submitted → Under Review → Pending Approval → Approved | Rejected
```

| State | Description |
|---|---|
| `draft` | Being built by the Project Lead, not yet submitted |
| `submitted` | Submitted by Project Lead, awaiting review |
| `under_review` | Resource Manager / Theme Lead are assigning engineers |
| `pending_approval` | Resource assignments complete, awaiting Prioritisation Board decision |
| `approved` | Approved — engineer capacity updated |
| `rejected` | Rejected by Prioritisation Board — capacity unchanged |

---

## Features

### 1. Project Creation (Project Lead)

**Route:** `/projects/new`

The Project Lead creates a project by completing the following:

#### 1.1 Project metadata
- Project name (text, required)
- Project description (textarea, optional)
- Start date (date picker, required)
- End date (date picker, required — must be after start date)
- Funding type (single select: `Group Strategy Funded` | `Business Funded`)

#### 1.2 Demand forecast

The forecast is structured as a **weekly grid** spanning the project start–end date range.

- The Project Lead selects one or more **skills** from the theme/skill hierarchy (e.g. MOM > Simatic S7).
- For each selected skill, they may optionally specify a **minimum required level** (e.g. Advanced). If no level is specified, any level is acceptable.
- For each skill row, the Project Lead enters the **hours per week** required for each week of the project.
- Weeks with zero demand may be left blank (treated as 0).

**UI guidance:**
- The weekly grid should be horizontally scrollable if the project spans many weeks.
- Week columns should be labelled with the week commencing date (Monday).
- A row total (summed hours) should be shown per skill.
- A column total (summed hours across all skills) should be shown per week.

#### 1.3 Submission
- Project Lead can save as `draft` at any point.
- Submitting transitions the project to `submitted` and makes it visible in the review queue.

---

### 2. Review & Resource Assignment (Resource Manager / Theme Lead)

**Route:** `/review`

A list view of all projects in `submitted` or `under_review` state.

#### 2.1 Review queue
- Each project card shows: project name, lead, date submitted, funding type, total hours demanded, date range.
- Clicking a project opens the review detail view.
- Opening a `submitted` project automatically transitions it to `under_review`.

#### 2.2 Capacity visualisation

At the top of the review detail view, show a **capacity overview panel** for the project's date range:

- For each skill demanded by the project, show a weekly bar or heat-map row displaying:
  - Total hours demanded that week (from the forecast)
  - Total available hours across engineers who hold that skill at or above the required level
  - A clear visual indicator: green = demand can be met, amber = partial coverage, red = insufficient capacity
- This view should update in real time as engineers are assigned to the project (i.e. their capacity reduces and the available pool shrinks).

#### 2.3 Engineer assignment

Below the capacity panel, show the demand forecast grid alongside an assignment panel:

- For each skill row, show a list of **assignable engineers**: engineers who hold the skill at or above the required level and have available capacity in the relevant weeks.
- Each engineer entry shows: name, skill level, and available hours per week (for the project's date range).
- The reviewer clicks to assign an engineer to a skill row.
- Once assigned, the engineer's hours for those weeks are **tentatively committed** (shown as reduced capacity) but not yet locked — they are only locked on approval.
- Multiple engineers can be assigned to a single skill if demand requires it.
- A reviewer can unassign an engineer at any point before approval.

#### 2.4 Transition to pending

Once all skill rows have at least one assigned engineer, a **"Submit for Approval"** button becomes active.

- Clicking this transitions the project to `pending_approval`.
- The project disappears from the review queue and appears in the Prioritisation Board queue.

---

### 3. Approval (Prioritisation Board)

**Route:** `/approval`

A list view of all projects in `pending_approval` state.

#### 3.1 Approval queue
- Each project card shows: project name, lead, funding type, total hours committed, date range, and assigned engineer summary.
- Clicking opens the approval detail view.

#### 3.2 Approval detail
- Read-only view of the project metadata, demand forecast, capacity overview panel, and engineer assignments.
- Two actions available:
  - **Approve** — transitions project to `approved`, locks all tentative capacity commitments (reduces engineer available capacity permanently for the relevant weeks).
  - **Reject** — transitions project to `rejected`, releases all tentative capacity commitments, requires a rejection reason (textarea, required).

#### 3.3 Post-approval
- Approved projects are visible in a read-only **"Approved Projects"** list.
- Rejected projects are returned to the Project Lead (visible in their project list with status `rejected` and the rejection reason shown).

---

### 4. PMO Admin — Configuration

**Route:** `/admin`

Access restricted to `pmo_admin` role.

#### 4.1 Theme & skill management
- Create, rename, and deactivate **themes**.
- Within each theme, create, rename, and deactivate **skills**.
- Configure **level labels** (system-wide, e.g. Basic / Advanced / Specialist). Order of levels matters — higher index = higher proficiency.
- Deactivated themes/skills remain on historical projects but cannot be selected on new ones.

#### 4.2 Engineer roster management
- Create and edit engineer records:
  - Name (required)
  - Theme(s) they belong to
  - Standard weekly capacity in hours (required, default 40)
  - Skill assignments: for each skill, assign a proficiency level
- Deactivate engineers (removes them from the assignable pool; does not affect existing project assignments).

---

### 5. My Projects (Project Lead)

**Route:** `/my-projects`

- List of all projects created by the current Project Lead.
- Shows status badge, date range, total hours demanded.
- Draft projects can be edited and submitted.
- Rejected projects show the rejection reason and a **"Revise & Resubmit"** option that creates a new draft pre-populated with the original project data.

---

## Data Model

### `Theme`
```
id, name, isActive
```

### `Skill`
```
id, themeId, name, isActive
```

### `SkillLevel`
```
id, label, rank (integer, higher = more proficient)
```
> System-wide. Default seed: Basic (1), Advanced (2), Specialist (3).

### `Engineer`
```
id, name, weeklyCapacityHours, isActive
themes: Theme[]
skills: { skillId, skillLevelId }[]
```

### `Project`
```
id, name, description, startDate, endDate, fundingType,
createdByUserId, status, rejectionReason
```

### `DemandRow`
```
id, projectId, skillId, requiredSkillLevelId (nullable)
weeklyHours: { weekCommencing (date), hours (number) }[]
```

### `Assignment`
```
id, projectId, demandRowId, engineerId
weeklyHours: { weekCommencing (date), hours (number) }[]
status: 'tentative' | 'locked'
```
> Status becomes `locked` on project approval. On rejection, all `tentative` assignments are deleted.

---

## Capacity Calculation

```
engineerAvailableHours(engineerId, weekCommencing) =
  engineer.weeklyCapacityHours
  - SUM of assignment.weeklyHours[weekCommencing]
    WHERE assignment.status = 'locked'
    AND assignment.engineerId = engineerId
```

> Tentative assignments (under review / pending approval) are shown as visual indicators in the reviewer's capacity panel but do NOT reduce the available capacity pool for other concurrent reviews. This keeps the model simple for the POC and avoids race conditions between concurrent reviewers.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| State management | Zustand (or React Context if scope is small) |
| Routing | React Router v6 |
| Backend / data store | **Recommended: Supabase (Postgres + REST API)** — provides a hosted Postgres instance with a REST API and no backend code required for a POC. Alternative: json-server with a `db.json` file for a fully local POC with no external dependencies. |
| Date handling | date-fns |

> The backend choice is open. Supabase is recommended for a realistic POC (persistent data, easy to share). If fully offline/local is preferred, json-server requires zero accounts or infrastructure.

---

## Seed Data Requirements

The application should include a seed script or on-first-run seeding that populates:

- At least 2 themes (e.g. MOM, MI&V) each with 4–6 skills
- Skill levels: Basic, Advanced, Specialist
- At least 6 engineers across the two themes with varied skill assignments and 40hr/week capacity
- 1 example project in each of the following states: `draft`, `submitted`, `under_review`, `pending_approval`, `approved`

---

## Out of Scope (POC)

- Authentication / real user accounts
- Email notifications
- Azure DevOps integration
- Mobile-responsive design
- Audit trail / change history
- Multi-tenancy
