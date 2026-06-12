import type { AIProvider } from "./provider";
import { PRD_SYSTEM_PROMPT, REVISE_SYSTEM_PROMPT } from "@/lib/prd-prompt";

// ============================================================
// Mock AI Provider — realistic PRD output for testing
// ============================================================

function generateMockPRD(prompt: string, language: "id" | "en"): string {
  const isId = language === "id";
  const productName = extractProductName(prompt);

  return `# PRD — Project Requirements Document

## 1. Overview

**Nama Produk:** ${productName}

**Masalah yang Diselesaikan:**
${isId ? `Berdasarkan deskripsi Anda, produk ini hadir untuk menyelesaikan tantangan yang dihadapi oleh pengguna dalam hal ${prompt.slice(0, 100)}. Saat ini, pengguna masih menggunakan cara manual yang tidak efisien, membuang waktu dan sering terjadi kesalahan.` : `Based on your description, this product addresses challenges faced by users regarding ${prompt.slice(0, 100)}. Currently, users rely on manual processes that are inefficient and error-prone.`}

**Tujuan Utama:**
${isId ? `- Menyederhanakan proses yang ada menjadi lebih efisien dan otomatis
- Memberikan pengalaman pengguna yang intuitif dan menyenangkan
- Mengurangi waktu yang dibutuhkan dari jam menjadi menit
- Meningkatkan akurasi dan mengurangi human error` : `- Simplify existing processes to be more efficient and automated
- Provide an intuitive and delightful user experience
- Reduce time required from hours to minutes
- Improve accuracy and reduce human error`}

---

## 2. Requirements

### Functional Requirements
${isId ? `- **FR-01:** Pengguna dapat mendaftar dan masuk menggunakan email/password atau Google OAuth
- **FR-02:** Pengguna dapat membuat, mengedit, dan menghapus data utama
- **FR-03:** Sistem harus mendukung pencarian dan filter data secara real-time
- **FR-04:** Notifikasi email dikirim untuk aksi-aksi penting
- **FR-05:** Export data dalam format PDF, Excel, atau CSV
- **FR-06:** Dashboard menampilkan statistik dan ringkasan aktivitas` : `- **FR-01:** Users can register and sign in using email/password or Google OAuth
- **FR-02:** Users can create, edit, and delete core data
- **FR-03:** System must support real-time search and filtering
- **FR-04:** Email notifications sent for important actions
- **FR-05:** Export data in PDF, Excel, or CSV format
- **FR-06:** Dashboard displays statistics and activity summary`}

### Non-Functional Requirements
${isId ? `- **NFR-01:** Waktu respons API < 200ms untuk 95% request
- **NFR-02:** Uptime 99.9% (downtime < 8.7 jam/tahun)
- **NFR-03:** Mendukung hingga 10.000 pengguna aktif bersamaan
- **NFR-04:** Data dienkripsi at-rest dan in-transit (TLS 1.3)
- **NFR-05:** WCAG 2.1 AA accessibility compliance
- **NFR-06:** Mobile responsive, mendukung layar 320px ke atas` : `- **NFR-01:** API response time < 200ms for 95% of requests
- **NFR-02:** 99.9% uptime (< 8.7 hours downtime/year)
- **NFR-03:** Support up to 10,000 concurrent active users
- **NFR-04:** Data encrypted at-rest and in-transit (TLS 1.3)
- **NFR-05:** WCAG 2.1 AA accessibility compliance
- **NFR-06:** Mobile responsive, supports screens 320px and up`}

### Business Requirements
${isId ? `- **BR-01:** Time-to-market maksimal 3 bulan untuk MVP
- **BR-02:** Biaya infrastruktur cloud < $500/bulan untuk 1.000 pengguna
- **BR-03:** Integrasi dengan tools yang sudah digunakan tim (Slack, Notion)
- **BR-04:** Compliance dengan regulasi data lokal (UU PDP Indonesia)` : `- **BR-01:** Maximum 3-month time-to-market for MVP
- **BR-02:** Cloud infrastructure cost < $500/month for 1,000 users
- **BR-03:** Integration with existing team tools (Slack, Notion)
- **BR-04:** Compliance with local data regulations`}

---

## 3. Core Features

### MVP (Fase 1 — Rilis Awal)
${isId ? `**Target: Bulan 1-3**

- ✅ Autentikasi pengguna (email + Google OAuth)
- ✅ Manajemen data core (CRUD lengkap)
- ✅ Dashboard dengan statistik dasar
- ✅ Pencarian dan filter sederhana
- ✅ Notifikasi email dasar
- ✅ Responsive web design` : `**Target: Month 1-3**

- ✅ User authentication (email + Google OAuth)
- ✅ Core data management (full CRUD)
- ✅ Dashboard with basic statistics
- ✅ Simple search and filter
- ✅ Basic email notifications
- ✅ Responsive web design`}

### Phase 2 (Post-Launch)
${isId ? `**Target: Bulan 4-6**

- 🔄 Kolaborasi tim (undang anggota, role management)
- 🔄 Advanced analytics dan reporting
- 🔄 Integrasi API pihak ketiga (Zapier, Slack)
- 🔄 Mobile app (React Native)
- 🔄 Bulk import/export data
- 🔄 Custom branding / white-label` : `**Target: Month 4-6**

- 🔄 Team collaboration (invite members, role management)
- 🔄 Advanced analytics and reporting
- 🔄 Third-party API integrations (Zapier, Slack)
- 🔄 Mobile app (React Native)
- 🔄 Bulk data import/export
- 🔄 Custom branding / white-label`}

### Phase 3 (Premium)
${isId ? `**Target: Bulan 7-12**

- 💎 AI-powered insights dan rekomendasi
- 💎 Single Sign-On (SSO) untuk enterprise
- 💎 Audit log lengkap dan compliance report
- 💎 Custom workflows dan automasi
- 💎 Dedicated support (SLA 4 jam)
- 💎 On-premise deployment option` : `**Target: Month 7-12**

- 💎 AI-powered insights and recommendations
- 💎 Single Sign-On (SSO) for enterprise
- 💎 Complete audit log and compliance reports
- 💎 Custom workflows and automation
- 💎 Dedicated support (4-hour SLA)
- 💎 On-premise deployment option`}

---

## 4. User Flow

### Flow 1: Onboarding & Registrasi
\`\`\`
Landing Page → Klik "Daftar Gratis"
    → Form Registrasi (nama, email, password)
    → Verifikasi Email (link dikirim)
    → Profil Setup (opsional)
    → Dashboard Utama
\`\`\`

### Flow 2: Core Action — Buat Item Baru
\`\`\`
Dashboard → Klik "Buat Baru" / FAB Button
    → Form Input (validasi real-time)
    → Preview sebelum simpan
    → Simpan → Konfirmasi toast
    → Redirect ke detail item
\`\`\`

### Flow 3: Pencarian & Filter
\`\`\`
Dashboard → Search bar (Ctrl+K shortcut)
    → Ketik keyword → Hasil real-time (debounce 300ms)
    → Klik filter icon → Panel filter muncul
    → Pilih filter → Daftar ter-update
    → Export hasil jika diperlukan
\`\`\`

### Flow 4: Kolaborasi Tim
\`\`\`
Settings → Tim → Undang Anggota
    → Input email → Pilih role (Admin/Editor/Viewer)
    → Kirim undangan email
    → Anggota terima → Klik link → Bergabung otomatis
    → Notifikasi ke semua anggota tim
\`\`\`

---

## 5. Architecture

\`\`\`
┌─────────────────────────────────────────────────┐
│                  CLIENT LAYER                    │
│  Next.js 16 (App Router) + React 19              │
│  Tailwind CSS v4 + Shadcn/ui                     │
└──────────────────┬──────────────────────────────┘
                   │ HTTP / Server Actions
┌──────────────────▼──────────────────────────────┐
│                  API LAYER                       │
│  Next.js API Routes + Server Actions             │
│  Better Auth (Session Management)               │
│  Input Validation (Zod)                         │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│                SERVICE LAYER                     │
│  Business Logic + Domain Services               │
│  AI Provider Layer (pluggable adapters)         │
│  Email Service (Resend/Nodemailer)              │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│                DATA LAYER                        │
│  Drizzle ORM + PostgreSQL                       │
│  (Lokal dev → Supabase prod)                    │
└─────────────────────────────────────────────────┘
\`\`\`

**Deployment Stack:**
- **Frontend + Backend:** Vercel (serverless)
- **Database:** Supabase PostgreSQL
- **File Storage:** Supabase Storage (jika diperlukan)
- **CDN:** Vercel Edge Network

---

## 6. Database Schema

\`\`\`sql
-- Users (dikelola Better Auth)
users (id, email, name, image, email_verified, created_at, updated_at)

-- Sesi Auth
sessions (id, user_id, token, expires_at, ip_address, user_agent)
accounts (id, user_id, provider_id, account_id, access_token, ...)

-- Core App Tables
items (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL → users.id,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT DEFAULT 'active',  -- active | archived | deleted
  metadata    JSONB,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
)

team_members (
  id        TEXT PRIMARY KEY,
  team_id   TEXT NOT NULL,
  user_id   TEXT NOT NULL → users.id,
  role      TEXT NOT NULL,  -- owner | admin | editor | viewer
  joined_at TIMESTAMP DEFAULT NOW()
)

activity_logs (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL → users.id,
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  resource_id TEXT,
  metadata    JSONB,
  created_at  TIMESTAMP DEFAULT NOW()
)
\`\`\`

---

## 7. Tech Stack

### Recommended Stack

| Layer | Technology | Alasan |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full-stack, SSR, Server Actions, Edge Runtime |
| Language | TypeScript 5 | Type safety, better DX, refactoring yang aman |
| UI Components | Shadcn/ui | Komponen accessible, customizable, tidak opinionated |
| Styling | Tailwind CSS v4 | Utility-first, konsisten, DX yang sangat baik |
| ORM | Drizzle ORM | Type-safe, ringan, SQL-like, mudah di-debug |
| Database | PostgreSQL (Supabase) | ACID compliance, mature, gratis hingga 500MB |
| Auth | Better Auth | Modern, type-safe, banyak plugin, Drizzle adapter |
| AI Integration | OpenAI / Anthropic / Gemini | Pluggable adapter, mudah ganti provider |
| Email | Resend | Developer-friendly, React Email templates |
| Deployment | Vercel | Zero-config, edge functions, analytics built-in |
| Monitoring | Vercel Analytics + Sentry | Error tracking & performance monitoring |

### Mengapa Stack Ini?

Stack ini dipilih untuk **kecepatan development tanpa mengorbankan scalability**:
- **Next.js 16** menggabungkan frontend dan backend dalam satu codebase, mengurangi overhead DevOps
- **Drizzle + Supabase** memberikan PostgreSQL yang reliable tanpa biaya server management
- **Better Auth** menyediakan autentikasi production-ready dalam hitungan jam, bukan hari
- **Shadcn/ui** memungkinkan customisasi penuh tanpa vendor lock-in

### Upgrade Path (Saat Scale)

| Scale | Action |
|---|---|
| 10K+ users | Upgrade Supabase plan, tambah read replicas |
| 50K+ users | Migrasi ke dedicated PostgreSQL (Railway/RDS) |
| 100K+ users | Tambah Redis (Upstash) untuk caching & rate limiting |
| 500K+ users | Microservices untuk fitur berat (AI, reporting) |
| 1M+ users | Kubernetes + multi-region deployment |

### Langkah Selanjutnya

1. **Setup Database** — Install PostgreSQL lokal, jalankan \`drizzle-kit push\`
2. **Konfigurasi Auth** — Set env vars Better Auth, test register/login
3. **Build MVP Features** — Core CRUD, dashboard dasar
4. **Testing** — Unit test untuk business logic, E2E dengan Playwright
5. **Deploy** — Push ke GitHub, connect ke Vercel, set env vars production
6. **Monitor** — Setup Sentry, Vercel Analytics, alert untuk error rate
`;
}

function extractProductName(prompt: string): string {
  // Simple heuristic to extract product name from prompt
  const words = prompt.split(" ").slice(0, 5).join(" ");
  return words.length > 30 ? words.slice(0, 30) + "..." : words;
}

function generateMockRevision(currentPRD: string, instruction: string): string {
  const revisionNote = `\n\n> **📝 Revisi:** ${instruction}\n> *Diperbarui pada ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}*\n\n---\n\n`;
  return revisionNote + currentPRD;
}

const mockProvider: AIProvider = {
  async generatePRD(prompt: string, language: "id" | "en"): Promise<string> {
    // Simulate AI delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return generateMockPRD(prompt, language);
  },

  async revisePRD(
    currentPRD: string,
    instruction: string,
    language: "id" | "en"
  ): Promise<string> {
    // Simulate AI delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return generateMockRevision(currentPRD, instruction);
  },

  async clarify(prompt: string, language: "id" | "en"): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const isId = language === "id";
    // Mock: treat prompts under 60 chars as vague
    if (prompt.trim().length < 60) {
      return JSON.stringify({
        needsClarification: true,
        questions: isId
          ? [
              "Siapa target pengguna utama produk ini?",
              "Apa fitur inti yang harus ada di MVP?",
              "Apakah ada integrasi dengan layanan lain yang diperlukan?",
            ]
          : [
              "Who is the primary target user for this product?",
              "What core features must be in the MVP?",
              "Are there any third-party integrations required?",
            ],
      });
    }
    return JSON.stringify({ needsClarification: false });
  },
};

export default mockProvider;
