# PokéVault

A premium Pokémon pack shop built for the Philippines market. Customers can browse packs, add to cart, and checkout as guests. Orders are tracked in a Supabase database, stock is automatically decremented on checkout, and email receipts are sent via Resend. An admin panel lets you manage inventory and orders.

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Email | Resend |
| Hosting | Vercel (recommended) |

---

## Project structure

```
app/
├── admin/
│   ├── login/page.js          # Admin login page
│   ├── forgot-password/page.js # Password reset request
│   ├── reset-password/page.js  # Password reset form
│   ├── dashboard.js            # Admin UI component
│   └── page.js                 # Admin panel (protected)
├── api/
│   ├── admin/
│   │   ├── cards/route.js      # Add / edit packs (admin only)
│   │   └── orders/route.js     # Update order status (admin only)
│   ├── checkout/
│   │   └── route.js            # Checkout, stock decrement, order creation
│   └── email/
│       └── receipt.js          # Email helpers (receipt + shipped notification)
├── checkout/
│   ├── page.js                 # Checkout form (guest details)
│   └── success/page.js         # Order confirmation page
├── home/
│   └── page.js                 # Landing / home page
├── browser.js                  # Supabase browser client
├── server.js                   # Supabase server client (SSR)
├── supabase.js                 # Supabase public client
├── storefront.js               # Storefront UI component
├── page.js                     # Shop page (/)
├── globals.css
└── layout.js
```

---

## Database schema

### `pokebox` (packs catalog)
| Column | Type | Notes |
|---|---|---|
| id | int8 | Primary key, auto-increment |
| name | text | Pack name, required |
| set_name | text | e.g. Scarlet & Violet, required |
| pack_type | text | e.g. Booster Pack, ETB |
| price | int4 | Price in PHP |
| stock_quantity | int4 | Defaults to 0 |
| image_url | text | Optional |
| created_at | timestamp | Auto-filled |

### `orders`
| Column | Type | Notes |
|---|---|---|
| id | int8 | Primary key |
| guest_name | text | |
| guest_email | text | |
| guest_phone | text | |
| shipping_address | text | |
| status | text | pending, shipped |
| total | int4 | Subtotal in PHP |
| shipping_fee | int4 | Defaults to 80 |
| user_id | uuid | Nullable, for future user accounts |
| created_at | timestamp | |

### `order_items`
| Column | Type | Notes |
|---|---|---|
| id | int8 | Primary key |
| order_id | int8 | FK → orders.id |
| card_id | int8 | FK → pokebox.id |
| quantity | int4 | |
| unit_price | int4 | Price at time of purchase |

---

## Environment variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAIL=your-admin-email@example.com
NEXT_PUBLIC_ADMIN_EMAIL=your-admin-email@example.com
RESEND_API_KEY=re_your-resend-key
```

---

## Supabase RLS policies

The following Row Level Security policies must be set up in Supabase → Authentication → Policies:

| Table | Policy name | Command | Expression |
|---|---|---|---|
| pokebox | allow public read | SELECT | `true` |
| orders | allow insert orders | INSERT | `true` |
| orders | allow admin read orders | SELECT | `true` |
| order_items | allow insert order items | INSERT | `true` |
| order_items | allow admin read order items | SELECT | `true` |

---

## Getting started

```bash
# Install dependencies
npm install

# Run in development (without Turbopack to avoid caching issues)
TURBOPACK=0 npm run dev
```

Open `http://localhost:3000` to see the shop.
Open `http://localhost:3000/home` to see the landing page.
Open `http://localhost:3000/admin` to access the admin panel.

---

## Key flows

### Customer checkout
1. Customer browses packs at `/`
2. Adds packs to cart (saved in localStorage)
3. Clicks checkout → redirected to `/checkout`
4. Fills in name, email, phone, address
5. Submits → stock is verified and decremented, order saved to database
6. Redirected to `/checkout/success`
7. Email receipt sent via Resend

### Admin panel
1. Go to `/admin/login`
2. Sign in with your Supabase admin account
3. View orders, manage packs, mark orders as shipped
4. Shipped notification email sent to customer automatically

### Adding packs
Option 1 — via admin panel at `/admin` → Add pack tab
Option 2 — directly in Supabase Table Editor → `pokebox` → Insert row

### Pack images
Upload images to Supabase Storage → `packs` bucket (set to public).
Copy the public URL and paste it into the image URL field when adding a pack.

---

## Deployment

Recommended: deploy to [Vercel](https://vercel.com).

1. Push your code to GitHub
2. Import the repo in Vercel
3. Add all environment variables from `.env.local` in Vercel's project settings
4. Deploy

---

## Roadmap

- [ ] PayMongo integration (GCash + credit/debit card)
- [ ] User accounts and order history
- [ ] Email marketing / order follow-ups
- [ ] Featured packs on homepage connected to live database
- [ ] Discount codes

---

## Notes

- The project name in Supabase is `pokebind` — this does not affect functionality
- Run dev server with `TURBOPACK=0 npm run dev` to avoid caching issues in development
- The `pokebox` table stores packs (originally named for card singles, repurposed for packs)