# ✈️ AirPark & Ride Direct

> **Full-Stack Airport Parking Aggregator & Private Hire Transfer Platform**  
> Built by synthesizing the business models of **Royal Cars Private Hire**, **AirportParkingReservations.com**, **AirportParking.com**, and **AirportParkings.uk**.

---

## 📖 1. Business Model Synthesis & Architecture

This platform bridges two complementary models in ground transportation:

```
                            ┌──────────────────────────────────────────────┐
                            │            AirPark & Ride Direct             │
                            │        (Clearinghouse & Marketplace)         │
                            └──────┬────────────────────────────────┬──────┘
                                   │                                │
                 ┌─────────────────┴─────────────┐    ┌─────────────┴─────────────────┐
                 │                               │    │                               │
                 ▼                               ▼    ▼                               ▼
    [ Model A: OTA Marketplace ]                        [ Model B: Private Chauffeur ]
    • AirportParkingReservations.com                    • Royal Cars Private Hire
    • AirportParking.com & UK Aggregators               • Fixed-Fare Long-Distance Dispatch
    ────────────────────────────────────────            ─────────────────────────────────
    • Off-Site Park & Ride (Shuttle Bus)                • Standard, Estate, Executive & MPV
    • Meet & Greet / Valet (Terminal Forecourt)         • Guaranteed Flight Delay Monitoring
    • Hotel + Parking ("Park, Sleep & Fly")             • Transparent Airport Drop-off Tolls
    • Wholesale Rate Arbitrage + Booking Fees           • 15% Broker / Dispatch Take
```

### Revenue & Margin Breakdown
1. **OTA Parking Aggregation Model:**
   * **Wholesale Spread:** Retains 15%–20% margin between wholesale operator net rate and consumer retail price.
   * **Platform Convenience Fee:** £2.99 / $3.99 per booking charged at checkout.
2. **Private Hire Dispatch Model (Royal Cars):**
   * **Distance & Tier-Based Pricing:** Base flag drop + mileage rate + terminal drop-off toll + optional £12 meet & greet inside arrivals.
   * **Driver Split:** 85% paid to licensed driver; 15% retained as dispatch clearing fee.
3. **Reconciliation & Operator Settlement Ledger:**
   * Built-in accounting engine tracking Gross Booking Value (GBV), commissions earned, booking fees collected, and net payables to partner parking lots and chauffeur fleets.

---

## 🛠️ 2. Tech Stack

* **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React Icons.
* **Backend:** Node.js v24, Express, UUID, CORS.
* **Architecture:** Modular REST API, In-memory Financial Audit Ledger, Self-contained static serving capability.

---

## 🚀 3. Features Walkthrough

* **🔍 Airport Parking Comparison Engine:**
  * Real-time search across major UK (LHR, LGW, STN, LTN, MAN, BHX) and US (JFK, EWR, LAX) hubs.
  * Filter by **Park & Ride**, **Meet & Greet / Valet**, **On-Airport Long Stay**, and **Hotel + Parking ("Park, Sleep & Fly")**.
  * Sort by recommended value, lowest price, highest rating, or shortest shuttle transfer time.
  * Verified security badges (Park Mark® Safer Parking, 24/7 CCTV, ANPR barrier access).
* **🚖 Executive Chauffeur & Private Hire Transfers:**
  * Fixed-fare quotes between London/Kent hubs and all major airport terminals.
  * Vehicle selection: Standard Saloon, Estate, Executive Chauffeur (Mercedes E-Class/BMW 5), and 8-Seater Minibuses.
  * Automatic inclusion of official airport terminal drop-off toll charges.
* **💳 Transparent Checkout & Instant Booking:**
  * Clear fee itemization (Operator net rate vs platform booking fee).
  * Captures lead passenger info, flight number for delay tracking, and vehicle registration for automated ANPR entry.
* **🎟️ Boarding-Pass Style Digital Voucher:**
  * Generates digital QR voucher token (e.g. `VOUCHER-9B41C2A8`).
  * 24/7 emergency helpline, terminal gate instructions, and printable voucher layout (`window.print()` / PDF ready).
* **📊 Live Revenue & Accounting Dashboard:**
  * Live monitoring of GBV, Platform Net Take, Effective Take Rate %, Operator Payables, and Transaction Audit Trails.

---

## 🏃 4. Running the Platform Locally

### Quick Start (Production Mode)
```bash
# 1. Install root dependencies
npm install

# 2. Build the client application
npm run build:client

# 3. Start the Express server
npm start
```
Open **[http://localhost:5001](http://localhost:5001)** in your browser.

---

### Development Mode (Hot Reload)
Run the backend and frontend in separate terminals:

```bash
# Terminal 1: Backend API (runs on port 5001)
npm run dev:server

# Terminal 2: Frontend Vite dev server (runs on port 3000 with API proxy)
npm run dev:client
```
Open **[http://localhost:3000](http://localhost:3000)** for hot-module reloading.

---

## 🐙 5. Pushing to GitHub (for @ranaahmadmaqsood)

Follow these steps to publish this project to your GitHub account:

1. **Create an empty repository on GitHub:**
   * Go to [https://github.com/new](https://github.com/new)
   * Repository name: `airpark-transfers-platform`
   * Leave it Public or Private (do **not** check "Initialize with README")

2. **Run the following commands in the project folder:**
   ```powershell
   cd "c:\Users\HP\Documents\Antigravity\airpark-transfers-platform"

   # Initialize Git
   git init
   git add .
   git commit -m "feat: initial commit of AirPark & Ride direct platform"

   # Set branch and link remote
   git branch -M main
   git remote add origin https://github.com/ranaahmadmaqsood/airpark-transfers-platform.git

   # Push code
   git push -u origin main
   ```

---

## 📄 License
MIT License. Created by [ranaahmadmaqsood](https://github.com/ranaahmadmaqsood).
