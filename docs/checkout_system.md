# PokéVault Checkout & Email System

This document outlines the architecture and data flow of the checkout process and the subsequent email notification system in PokéVault.

---

## 🏗️ System Overview

The checkout system follows a secure, multi-step process to ensure inventory integrity and reliable payment processing.

1.  **Selection**: Customer browses packs and adds to cart (**localStorage only** — no database interaction yet).
2.  **Cart Validation**: Customer opens cart → `revalidateStock()` is called, fetching live stock data from `/api/cards` to ensure availability before proceeding.
3.  **Details**: Customer proceeds to `/checkout` and fills in trainer details (automatically persisted in `localStorage`).
4.  **Order Creation & Locking**: Customer clicks "Proceed to Payment" → `POST /api/checkout` fires:
    -   Backend re-verifies pricing and stock.
    -   `checkout_order` RPC is called: Creates a "pending" order and **atomically decrements/locks stock**.
    -   PayMongo session is generated.
    -   Customer is redirected to the secure PayMongo checkout URL.
5.  **Payment**: Customer completes payment on PayMongo.
6.  **Webhook Notification**: PayMongo asynchronously fires `POST /api/webhooks/paymongo` with the `checkout_session.payment.paid` event.
7.  **Order Finalization**: The Webhook handler:
    -   Checks idempotency (ensures order isn't already processed).
    -   Marks order as `paid` and sets status to `pending` (for fulfillment).
    -   Triggers the **Receipt Email** via Resend.
8.  **Completion**: Customer is redirected back to `/checkout/success`:
    -   `localStorage` is cleared (cart, form, session) to reset for the next purchase.

---

## 🛡️ Idempotency & Session Management

To prevent duplicate orders and ensure a smooth experience if a user refreshes the page:

-   **Session ID**: A unique, random string (e.g., `sess_a1b2c3d4`) is generated in the browser and stored in `localStorage` (`pokevault-checkout-session`) upon entering the checkout page.
-   **Persistence**: This ID is sent with the checkout request. If the same browser session attempts to check out again before completion, the backend use this ID to identify and update the existing "pending" order rather than creating a duplicate.
-   **Cleanup**: Once the purchase is successful and the user reaches the success page, the `pokevault-checkout-session` is cleared from `localStorage`, ensuring the next purchase starts with a fresh session.

---

## 🎨 File Responsibilities

### Frontend: Checkout Page
**File:** [app/checkout/page.js](file:///home/ubuubuntu/Documents/Marthan/pokebind/pokevault/app/checkout/page.js)
-   **Form Persistence**: Saves trainer details in `localStorage`.
-   **Shipping Calculation**: Dynamic fees based on Region (Metro Manila, Luzon, Visayas, Mindanao).
-   **Payment Handoff**: Submits cart and trainer details to the backend.

### Backend: Checkout API
**File:** [app/api/checkout/route.js](file:///home/ubuubuntu/Documents/Marthan/pokebind/pokevault/app/api/checkout/route.js)
-   **Stock Locking**: Reserves stock via `checkout_order` RPC BEFORE payment.
-   **Gateway Integration**: Creates the PayMongo session and returns the URL.

### Webhook: Payment Processing
**File:** [app/api/webhooks/paymongo/route.js](file:///home/ubuubuntu/Documents/Marthan/pokebind/pokevault/app/api/webhooks/paymongo/route.js)
-   **Payment Confirmation**: Updates order status to `paid` upon notification from PayMongo.
-   **Email Trigger**: Initiates the confirmation receipt.

### Email System
**File:** [app/api/email/receipt.js](file:///home/ubuubuntu/Documents/Marthan/pokebind/pokevault/app/api/email/receipt.js)
-   **Receipt Template**: Displays items, subtotal (Total - Shipping), and Grand Total.
-   **Notification Service**: Uses Resend for email delivery.
