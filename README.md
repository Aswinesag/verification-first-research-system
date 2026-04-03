# VARA - Verified Autonomous Reasoning Agent

VARA is a verification-first research system that plans, executes, verifies, and scores claims produced for a user query.  
It combines orchestration, retrieval, claim verification, conflict detection, and uncertainty estimation, then presents results through a React-based interface.

## What VARA Does

- Accepts a natural-language research query.
- Breaks the query into structured subtasks.
- Retrieves supporting context from local indexed documents and optional web-connected components.
- Generates claims for each task.
- Verifies each claim with evidence and reasoning checks.
- Detects contradictions/conflicts across claims.
- Computes uncertainty and system-level confidence/risk.
- Returns a structured response for UI rendering and analysis.

## Key Features

- Verification-first pipeline (claims are not treated as final without validation).
- Multi-step orchestration with explicit execution state.
- Debate-capable execution flow for stronger claim selection.
- Evidence-aware confidence and uncertainty scoring.
- Conflict detection across claims in a graph structure.
- Frontend dashboard with:
  - Execution pipeline view
  - Claims and subtasks panel
  - Knowledge graph panel
  - System confidence and risk panel
  - Claim detail drawer with evidence/verification details

## System Architecture

### 1) API Layer (`api/`)
- FastAPI application exposes primary endpoints:
  - `POST /query`
  - `GET /health`
  - `GET /metrics`
- Handles request lifecycle, validation, error handling, and response shaping.

### 2) Core Orchestration (`core/`)
- `Orchestrator` coordinates end-to-end execution.
- `ExecutionLoop` processes subtasks and tracks state transitions.
- `StateManager` stores goals, tasks, claims, verifications, and execution metadata.

### 3) Agent Layer (`agents/`)
- `PlannerAgent`: decomposes a query into actionable subtasks.
- `ExecutorAgent`: generates claims from retrieved context.
- `VerifierAgent`: evaluates claim support quality and reasoning validity.
- `DebateAgent`: runs multiple rounds and selects stronger claims.

### 4) Retrieval and LLM Routing (`retrieval/`, `llm/`)
- Retrieval uses local index/search and reranking to fetch relevant context.
- LLM routing supports primary/fallback model behavior.

### 5) Graph and Uncertainty (`graph/`, `uncertainty/`)
- Graph tracks claim relationships and conflict signals.
- Uncertainty estimator calibrates confidence and assigns trust/risk levels.

### 6) Frontend (`frontend/`)
- React + Vite + Zustand + Framer Motion.
- Calls backend APIs, normalizes response payloads, and renders interactive panels.

## Problem Statement

Modern AI systems, particularly large language models (LLMs), are highly capable at generating fluent and contextually relevant responses. However, they often exhibit critical limitations:

* They can produce **factually incorrect or hallucinated information**
* They tend to be **overconfident**, even when uncertain
* They lack **transparent reasoning and verifiability**
* They do not explicitly account for **conflicting or incomplete information**

In real-world domains such as healthcare, legal analysis, and decision support, these limitations make it difficult to **trust AI-generated outputs without additional validation**.

---

## Our Approach

VARA (Verified Autonomous Reasoning Agent) is an experimental system that explores a more structured approach to AI reasoning by combining:

* Multi-agent task decomposition
* Retrieval-augmented generation (RAG)
* Claim-level verification
* Knowledge graph construction
* Uncertainty and confidence estimation

Rather than treating AI outputs as final answers, VARA attempts to **break down responses into verifiable claims, evaluate supporting evidence, and quantify uncertainty**.

---

## Scope & Limitations

VARA is **not a definitive solution to AI reliability**. Instead, it serves as a:

* Research-oriented framework
* Exploration of trust-aware AI pipelines
* Foundation for building more robust reasoning systems

The system still depends on the quality of retrieved data and underlying language models, and its outputs should be interpreted as **assisted reasoning rather than guaranteed truth**.


## Repository Structure

```text
vara/
  api/                # FastAPI app and routes
  core/               # Orchestrator, execution loop, state
  agents/             # Planner, executor, verifier, debate agents
  retrieval/          # Retrieval pipeline and search/reranking
  graph/              # Graph model and conflict detection
  uncertainty/        # Confidence and uncertainty estimation
  llm/                # LLM clients, routing, parsing
  frontend/           # React UI
  config/             # Runtime settings
  schemas/            # Shared data models
  utils/              # Logging, retry, metrics helpers
```

## Prerequisites

- Python 3.10+ (3.13 is supported in this repo setup)
- Node.js 18+ and npm
- Windows/Linux/macOS shell environment
- Required API keys/config in `.env` (if your backend setup needs external providers)

## Installation

### Backend

```bash
cd d:\vara
pip install -r requirements.txt
```

### Frontend

```bash
cd d:\vara\frontend
npm install
```

## Run the Project

Use two terminals.

### Terminal 1: Core Backend

```bash
cd d:\vara
python -m uvicorn api.app:app --host 0.0.0.0 --port 8000
```

### Terminal 2: Frontend

```bash
cd d:\vara\frontend
npm run dev -- --host 0.0.0.0 --port 3000
```

Open:
- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8000/health`

## API Endpoints

### `POST /query`
- Input:
  ```json
  { "query": "Your question here" }
  ```
- Output: structured response containing goal, subtasks, claims, verification details, graph data, and confidence/risk metrics.

### `GET /health`
- Service health and component readiness.

### `GET /metrics`
- Runtime/system metrics (when enabled in settings).

## Frontend Functionality

- Query submission with loading and error states.
- Execution pipeline progression view.
- Goal/subtask/claims rendering with claim selection.
- Knowledge graph rendering of node/edge relationships.
- Confidence panel with risk categorization and distribution.
- Side drawer for per-claim evidence and verification details.

## Configuration Notes

- Backend settings are managed in `config/settings.py`.
- Frontend API base URL defaults to `http://localhost:8000` and can be overridden via environment config (`VITE_API_URL`).

## Troubleshooting

- If `/query` is slow, keep frontend timeout sufficiently high for heavy reasoning runs.
- If frontend shows empty/uneven data, verify backend is the core service (`api.app`) and not a mock server.
- If backend starts but responses fail, inspect:
  - `api` logs
  - agent execution logs
  - retrieval/index availability
- If frontend fails to load, run:
  ```bash
  cd d:\vara\frontend
  npm run build
  ```
  to validate compile-time issues.

## Development Notes

- This repository includes additional debug/test scripts and reports for diagnostics.
- Core production path is the FastAPI app under `api/` with the React frontend under `frontend/`.

