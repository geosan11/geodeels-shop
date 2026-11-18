# Geodeels Customer Shop

Clean, calm, phone-first customer shop for **Geodeels** — high-grade hygiene, disinfection, and cleaning solutions for Nigerian households, businesses, hospitals, and cleaning professionals.

## Tech Stack
- **Frontend**: Vanilla JavaScript (ES modules) + Vite
- **Styling**: Vanilla CSS, design system tokens, Plus Jakarta Sans, phone-first responsive design
- **Database & Auth**: Supabase (`shop_products`, `shop_orders`, `product-photos` storage)
- **Testing**: Vitest unit & integration tests

## Getting Started

### Prerequisites
- Node.js >= 18
- npm

### Installation
```bash
npm install
```

### Environment Variables
Copy `.env.example` to `.env` or `.env.local`:
```bash
cp .env.example .env
```
Fill in:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Development
```bash
npm run dev
```

### Build & Test
```bash
npm run build
npm test
```
