# Cine-vault-online-streaming-platform
A modern online movie and TV show streaming platform
<br>
Auther : Uzair Ali

# CineVault — Advanced Online Movie & TV Show Streaming Platform

[![Deployment Status](https://shields.io)](https://vercel.app)
[![Language](https://shields.io)](#)
[![Framework](https://shields.io)](#)

CineVault is a production-ready, high-performance online movie and television series streaming platform built using **React 18** and **Vite**. The application architecture leverages serverless edge microservices to safely pipe video assets, integrates robust third-party backend database models, and provides an end-to-end premium subscription workflow driven by secure payment infrastructure.

🌐 **Live Production Link:** [https://vercel.app](https://vercel.app)

---

## 🚀 Key Architectural Features

* **Serverless Media Pipelining & Proxy Routing:** Implemented optimized edge handlers (`api/stream-pipe.js`, `api/proxy.js`) to stream remote multimedia contents securely, effectively abstracting origin targets and bypassing browser Cross-Origin Resource Sharing (CORS) limits.
* **Stripe Monetization Ecosystem:** Integrated a programmatic multi-tier billing pipeline featuring a native `api/create-checkout.js` transaction builder and an asynchronous network event handler (`api/stripe-webhook.js`) to instantly unlock contents for premium accounts.
* **Core Appwrite Database Architecture:** Anchored authentication workflows, watch history retention engines (`useWatchHistory.js`), and session contexts around a high-speed **Appwrite** cloud infrastructure tier.
* **Production Build Splitting & Bundling:** Utilized a custom modular build analyzer script (`_analyze_chunks.cjs`) inside Vite compilation layers to segment code bundles, drastically lowering initial payload sizes and boosting time-to-interactive scores.
* **Interactive Monetization UX:** Deployed a responsive structural payload containing smart content lockers, banner-ad grid injectors, and dynamic pop-under script configurations optimized for monetization strategy deployments.

---

## 🛠️ Technology Stack

* **Frontend Engine:** React 18, Vite, JavaScript (ES6+), React Router Dom v6
* **State & Tracking Engine:** React Context API, Custom Authorization Hooks (`useWatchHistory`)
* **Backend Framework / Edge Hosting:** Node.js, Express Layer, Vercel Serverless Functions
* **Cloud Infrastructure Services:** Appwrite (Database, Core Auth, User Sessions)
* **Financial Integration:** Stripe Checkout API, Asynchronous Stripe Webhooks
* **Styles & Presentation:** CSS3 Semantic Layouts, Fluid Grid Configurations

---

## 📂 Structural Code Mapping

```text
Cine-vault-online-streaming-platform/
│
├── api/                     # Vercel Serverless Functions
│   ├── create-checkout.js   # Generates secure Stripe billing links
│   ├── proxy.js             # Obfuscates raw media streaming resources
│   ├── stream-pipe.js       # Manages data pipe delivery for playback
│   └── stripe-webhook.js    # Listens for valid payment settlement states
│
├── plans/                   # Developer Engineering Architecture Plans
│   ├── streaming-sources-plan.md
│   └── monetization-ad-revenue-plan.md
│
├── public/                  # Core static files, icons, ads configuration
│   └── ads.txt              # Publisher verification manifest
│
└── src/                     # Core React application codebase
    ├── components/          # Reusable design assets
    │   ├── VideoPlayer.jsx  # Customized baseline media layout player
    │   ├── ContentLocker.jsx# Premium content gating mechanism
    │   └── AdBanner.jsx     # Managed platform monetization banner
    ├── context/             # Global application wrapper wrappers
    │   └── AuthContext.jsx  # Context mapping user session persistence
    ├── hooks/               # Custom lifecycle mechanisms
    │   └── useWatchHistory.js# Stores and returns live tracking rows
    └── pages/               # High-level responsive routing views
        ├── HomePage.jsx     # Master aggregated directory catalog 
        ├── WatchPage.jsx    # Immersive media rendering screen
        └── PremiumPage.jsx  # Gated payment subscription portal
```

---

## ⚙️ Local Development Installation

Follow these steps to spin up the client codebase locally on your machine:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com
   cd Cine-vault-online-streaming-platform
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root folder and input your private api access strings:
   ```env
   VITE_APPWRITE_ENDPOINT=your_appwrite_endpoint
   VITE_APPWRITE_PROJECT_ID=your_project_id
   STRIPE_SECRET_KEY=your_stripe_key
   ```

4. **Boot Up the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` inside your browser to view the application live.

---

## 📄 License & Compliance
This software application contains legal placeholders detailing digital licensing arrangements. Built strictly as an advanced engineering demonstration showcasing full-stack media platform scalability.

*Developed by **Uzair Ali**.*
