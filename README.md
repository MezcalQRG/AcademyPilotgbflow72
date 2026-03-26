# Gracie Barra AI Pilot System

High-performance automation system for Gracie Barra academies. Streamline marketing, recruitment, and session management via an integrated tactical dashboard.

## Core Operational Components

### 1. Lead Management
Tactical registry for unit initialization. Monitor recruitment status, tactical tags, and detailed intelligence data for every captured lead. This module ensures no potential unit is left unbriefed.

### 2. Conversations
Encrypted interaction logs and persistent tactical links. Review the complete history of AI-driven and manual communications with recruits. Maintain operational oversight across Email, SMS, and AI Voice channels.

### 3. Class Command
Operational mission matrix for session management. Control class schedules, manifest student presence, and manage live training sessions. Seamlessly transition leads into active training units.

### 4. Ad Deployment
Deploy and monitor targeted intelligence campaigns across Meta networks. Automate lead capture directly into the tactical pipeline, routing prospects instantly to their designated academy sector.

### 5. Voice Dispatch
Autonomous AI agents for inbound intake and outbound callback operations. Powered by ElevenLabs, these agents handle conversational lead qualification, schedule management, and automated academy briefings.

### 6. Omnichannel Matrix (AI Helpdesk)
Automated interception of raw incoming transmissions. Incoming replies via AWS SES are routed to S3, parsed by backend microservices, and injected directly into specific lead dossiers in Firestore for immediate LLM analysis and programmatic response drafting.

## System Architecture

### Multi-Tenant Franchise OS
A fully isolated, scalable architecture designed for global branch deployment. Data is strictly segmented by `tenantSlug`.
- **Public Storefronts:** Dynamic, branded landing pages for localized lead capture (e.g., `graciebarra.ai/westcovina`).
- **Secure Command Centers:** Gated, tenant-specific dashboards equipped with Firebase JWT verification (e.g., `graciebarra.ai/westcovina/dashboard`).

### Security & Authentication Protocol
The system enforces a zero-trust, role-based architecture.
- **Frontend Identity:** The Next.js frontend uses a robust, custom Firebase Provider (`src/firebase/provider.tsx`) to manage real-time authentication state (`useUser` hook). 
- **The Golden Rule of Authorization:** The URL slug (e.g., `/westcovina/dashboard`) is strictly for UX and routing. Security is enforced server-side. The frontend explicitly sends the user's Firebase JWT to the backend for every protected action.
- **Role-Based Access Control (RBAC):** The Next.js API Proxy (`/api/orchestrator`) intercepts the JWT, verifies it cryptographically using the Firebase Admin SDK, and checks the user's `role` (e.g., `academy_owner`) and authorized `tenantSlug` in Firestore before allowing the request to reach the AWS microservices.

### Tactical Data Matrix (Firestore Collections)
The NoSQL database is structured to support horizontal, multi-tenant scaling:

- **`user_profiles`**: The central identity registry. Links a Firebase Auth UID to an operational role (`academy_owner`, `student`) and a specific `tenantSlug`.
- **`landing_pages`**: The public configuration matrix. Stores localized branding, headlines, and contact intelligence for each academy storefront, keyed by the `slug`.
- **`leads`**: The primary operational unit. Every captured lead is strictly tagged with a `tenantSlug`, ensuring absolute data isolation across academy branches.
- **`tenants/{slug}/store_items`**: Isolated subcollections. Enables each academy to manage its specific inventory of official GB gear and tactical uniforms independently.
- **`callback_queue`**: A global, FIFO operational queue. Holds pending outbound dispatch missions, processed asynchronously by AWS EventBridge workers while respecting local tenant operational hours.

### Tactical Microservices (`/services`)
The backend is completely decoupled from the Next.js frontend, operating as a suite of independent, single-purpose AWS Lambda microservices deployed via AWS SAM. 

**1. The Universal Tactical Orchestrator (`/services/orchestrator`)**
The central nervous system of the backend. A secure API proxy that enforces the RBAC protocols. It validates all incoming JWT directives from the frontend before dispatching verified payloads to the specialized Lambdas.

**2. API-Driven Operations**
Invoked securely by the Orchestrator to handle direct dashboard actions:
- `add-lead` & `get-leads`: Manages the isolated tenant databases.
- `mark-processed`: Updates lead statuses post-operation.
- `ses-template-handler`: Dispatches official HTML email templates via AWS SES.

**3. Event-Driven Operations**
Autonomous workers triggered by AWS infrastructure:
- `inbound-mail-parser`: Triggered by S3 object creation. Parses raw `.eml` files dropped by SES, extracts the tenant routing, and saves the conversation directly into the student's Firestore dossier for future AI (LLM) analysis.
- `process-callback-queue`: A CRON-based EventBridge worker. It checks academy operational hours globally and autonomously dispatches outbound voice agents to follow up with pending leads.
- `transcript-webhook`: Catches ElevenLabs end-of-call webhooks and triggers secondary outbound operations asynchronously.

### Tech Stack Deployments
- **Frontend Matrix:** Next.js (App Router), React, Tailwind CSS, shadcn/ui.
- **Tactical Backend:** AWS Lambda, API Gateway, EventBridge, S3, SES, AWS SAM.
- **Data & Security:** Firebase Firestore, Firebase Authentication.
- **Artificial Intelligence:** Genkit, ElevenLabs Conversational AI.
