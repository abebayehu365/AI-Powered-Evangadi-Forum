# ForumStudy - AI-Powered Technical Forum & Learning Platform

Welcome to **ForumStudy**! This guide explains how to use all platform features, including the **Telebirr payment process**, **Security PIN protection**, **Admin & Co-Admin roles**, **Followers & Notifications**, and **Knowledge Base limits**.

---

## 📱 1. Telebirr Payment & Premium Upgrade Guide

ForumStudy includes a simple, secure 2-step Telebirr payment flow to upgrade your account to **Premium (5 ETB)**.

### Payment Details
* **Receiver / Merchant Number**: `0941427950`
* **Account Name**: ForumStudy (Telebirr)
* **Amount**: `5.00 ETB (Birr)` (One-time payment)
* **Status**: Submitted as Pending -> Verified & Approved by Admin in Admin Dashboard

### How Users Pay (2-Step Process)
1. **Step 1: Send 5 Birr via Telebirr**
   * Open your Telebirr app (or dial `*127#`).
   * Transfer **5 Birr** to merchant phone number: **`0941427950`**.
   * (A one-click **Copy** button is provided in the payment popup for convenience).
2. **Step 2: Submit Payment Details in ForumStudy**
   * In ForumStudy, click **"Upgrade (5 Birr)"** in the top navigation bar or sidebar.
   * Enter your 10-digit Telebirr phone number that you sent the payment from (e.g. `0912345678`).
   * Enter your **Telebirr Transaction Number / SMS Code** (e.g. `FT2409...` or `TB...`) from your Telebirr receipt SMS.
   * Click **"Submit for Verification (5 Birr)"**.
   * The payment is recorded as **Pending Admin Verification**.
3. **Step 3: Admin Approval in Frontend (No Coding Needed!)**
   * The administrator opens the **Admin Panel** (`/admin`) -> **"Telebirr Payments"** tab.
   * The admin compares the learner's phone and transaction code against their Telebirr app/SMS on `0941427950`.
   * With ONE click, the admin clicks **"Approve & Activate Premium"**!
   * The user immediately receives Premium status, unlimited RAG docs, PIN security, and the Golden badge.

### Premium Perks Unlocked
* 🔓 **Unlimited RAG Documents**: Free tier is limited to 3 documents; Premium allows unlimited uploads to your knowledge base.
* 🛡️ **Security Plus PIN Lock**: Set a personal 4-6 digit security PIN to lock access to the website when you return.
* 📱 **Personal QR Codes**: Generate and share QR codes for every question and answer on the forum.
* ✨ **Golden Premium Badge**: Displayed on your profile, questions, and answers across the community.

### Payment Security
* Payments cannot be falsified by simply typing a random phone number.
* Each submission requires a valid Telebirr Transaction code and must be approved by the site owner/admin.
* All transactions are securely tracked in the database with timestamps and status (`pending`, `completed`, `failed`).

---

## 🛡️ 2. Security Plus PIN Protection

Premium users have access to **Security Plus**, adding an extra layer of privacy and protection to their account.

### How to Set or Change Your PIN
1. Go to your **Profile** page (`/profile`).
2. Click on the **"Security PIN"** tab.
3. Click **"Set Security PIN"** (or **"Change Security PIN"**).
4. Enter a 4-to-6 digit numeric PIN and confirm it.
5. Click **"Save PIN"**.
6. Toggle the **"Enable PIN Lock on Return"** switch ON.

### How the PIN Lock Screen Works
* When you open or refresh the forum website, the **Security Plus Lock Screen** automatically appears.
* You can enter your PIN using:
  * The on-screen interactive keypad.
  * Your physical keyboard numbers (`0`-`9`, `Backspace` to delete, `Esc` to clear).
* Once the correct PIN is entered, your session is verified and unlocked instantly.
* If you enter the wrong PIN, the keypad shakes with a warning message.

---

## 👑 3. Admin & Co-Admin Management Guide (100% Frontend - No Coding)

The website admin does **NOT** need to write code or open any database. Everything is managed directly in the web browser!

| Role | Permissions & Capabilities |
| :--- | :--- |
| **Super Admin (`admin`)** | Full access: approve/reject Telebirr payments, view abuse reports, edit/delete questions, and **assign roles** (`admin`, `co-admin`, `user`) or toggle Premium for any learner. |
| **Co-Admin / Moderator (`co-admin`)** | Can access the Admin Panel, approve/reject Telebirr payments, review abuse reports, delete abusive content, and edit or delete questions. Cannot reassign other users' roles. |
| **Regular User (`user`)** | Standard student/learner privileges: ask questions, post answers, like/rate posts, follow users, and upload RAG documents. |

### How to Assign Roles & Manage Users in the Frontend:
1. Log in to the website with an Admin account (e.g. `live@gmail.com` or `hiwotfikru@gmail.com`).
2. Click **"Admin Panel"** in the sidebar (or go to `/admin`).
3. Click on the **"User & Role Management"** tab.
4. **Quick Assign by Email**:
   * Type the learner's email in the box: `[ coadmin@example.com ]`.
   * Select role from the dropdown: `Super Admin` or `Co-Admin (Moderator)`.
   * Click **"Assign Role"**. Done!
5. **Or Manage from the User Table**:
   * Search for any user by name or email.
   * Click **"Make Admin"** or **"Make Co-Admin"** or **"Set to User"**.
   * Click **"Grant Premium"** or **"Revoke Premium"** to give anyone Premium without them even paying if you choose.

---

## 👥 4. Followers, Following & Notifications

ForumStudy allows learners to follow other learners and track their activity:

### How to See Followers & Following
1. Visit your **Profile** page (`/profile`) or any other user's profile (`/profile/:id`).
2. In the stats bar, you can click directly on the **"Followers"** or **"Following"** card to open that tab.
3. **Followers Tab**: Shows everyone following this user, their avatar, name, and follow date. If they follow you, you can click "Follow Back".
4. **Following Tab**: Shows everyone this user is following, with a toggle button to follow/unfollow.

### Follow Notifications in Navbar
* In the top navigation bar, logged-in users have a **Notification Bell (`🔔`)**.
* When someone follows you, a red unread badge appears on the bell.
* Clicking the bell opens a dropdown showing recent follower notifications:
  * *"John Doe started following you • [Date]"*
* Clicking any notification navigates directly to that user's profile.
* Includes a quick link **"View All Followers & Following →"** to open your profile's followers tab.

---

## ⭐ 5. Interactive Features

### 1-5 Star Ratings
* Every question and answer has an interactive 5-star rating widget.
* Shows the average rating score (e.g. `★ 4.8`) and total number of ratings.
* Users can click any star to submit or update their rating.

### Like & Unlike (Upvoting / Downvoting)
* Questions and answers have Upvote (▲) and Downvote (▼) buttons with vote counts.
* Users can toggle their vote or switch between upvote and downvote.

### Abuse Reporting
* Any user can click the **Report (⚐)** button on an inappropriate question or answer.
* Select a reason (Spam, Harassment, Inappropriate Content, Misinformation, etc.) and add optional details.
* Reports appear immediately in the **Admin Panel** (`/admin`) for review by Admins and Co-Admins.

---

## 🚀 6. Running the Project Locally

### Prerequisites
* Node.js (v18+ recommended)
* MySQL database (configured in `backend/.env`)

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
*Backend runs on port `3778`.*

### 2. Start Frontend Server
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` (or port indicated by Vite).*

---

---

## 🤖 7. AI Customer Support Assistant ("Customer Bot")

### Where is the Customer Bot?
* Look at the **bottom-right corner** of any page on ForumStudy when logged in.
* You will see a **purple floating circular chat bubble button** with a chat icon.
* Click it to open the **ForumStudy Assistant** popup!

### Features of the Customer Bot
* **Instant Answers**: Powered by Google Gemini (`gemini-2.5-flash-lite` / `gemini-1.5-flash-latest`) via `POST /api/addon/support/chat`.
* **Platform Navigation Help**: Answers questions on posting, answers, stars, RAG knowledge bases, QR codes, PINs, and Telebirr payment.
* **Study Tips & Tech Questions**: Assists learners with technical concepts, coding, and academic questions.
* **Suggested FAQs**: Pre-loaded with quick-tap FAQs for immediate help without typing.
* **Scoped Guardrails**: Specifically guided to focus on ForumStudy and learning, politely redirecting off-topic queries.

---

## 💳 8. Official Telebirr API Integration (Ethio Telecom)

ForumStudy now supports **BOTH** official automated Telebirr API checkout and manual SMS confirmation transfers!

### Dual Payment Modes:
1. **Mode A: Automated Telebirr API Gateway (`telebirrjs`)**
   * Uses the official Node.js Telebirr library (`telebirrjs`).
   * When credentials are configured in `backend/.env`, clicking "Pay via Telebirr API" generates a direct session and redirects the user to Ethio Telecom's secure web payment gateway (`toPayUrl`).
   * Once paid, Ethio Telecom sends an RSA-encrypted webhook notification to `POST /api/payment/telebirr-api/notify`.
   * The backend automatically decrypts the notification with your public key, verifies status `Completed`, and **instantly activates Premium without waiting for admin approval**!
   * In sandbox / dev mode (before Ethio Telecom issues your merchant keys), an interactive simulation button lets you test the instant activation pipeline immediately!

2. **Mode B: Direct Transfer to 0941427950 (Manual Verification)**
   * Users transfer 5 Birr to `0941427950` via Telebirr app or `*127#`.
   * User submits their phone number and SMS transaction code.
   * Admin approves with 1 click in the Admin Dashboard (`/admin`).

### How to Configure Live Telebirr API Credentials
When Ethio Telecom approves your merchant developer account, open `backend/.env` and replace:
```env
TELEBIRR_APP_ID=your_real_telebirr_app_id
TELEBIRR_APP_KEY=your_real_telebirr_app_key
TELEBIRR_SHORT_CODE=your_real_telebirr_short_code
TELEBIRR_PUBLIC_KEY=your_real_telebirr_public_key
TELEBIRR_RECEIVE_NAME=ForumStudy
TELEBIRR_NOTIFY_URL=https://your-public-domain.com/api/payment/telebirr-api/notify
TELEBIRR_RETURN_URL=https://your-frontend-domain.com/plans?payment=success
```
Restart the backend, and live Telebirr payment gateway checkout will automatically activate!

---

## 🔒 9. Security Best Practices
1. **Keep Payment Number Updated**: If the manual recipient number changes, update `TELEBIRR_MANUAL_PHONE` in `.env` and `TELEBIRR_MERCHANT_NUMBER` in `TelebirrModal.jsx`.
2. **Protect Admin Accounts**: Only assign the `admin` role to trusted platform owners; assign `co-admin` to team members who only need moderation powers.
3. **Security PIN Encryption**: PINs are hashed before verification to ensure student credentials remain secure.
