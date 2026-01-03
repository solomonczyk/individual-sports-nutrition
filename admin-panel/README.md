# Admin Panel - Sports Nutrition Platform

Modern admin panel built with Next.js 14 for managing products, stores, and brands.

## Features

- 📊 **Dashboard** - Overview with key metrics and aggregation status
- 📦 **Products Management** - Browse, search, and manage product catalog
- 🏪 **Stores Management** - Manage partner stores and trigger syncs
- 🏷️ **Brands Management** - Manage product brands and verification
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- ⚡ **Fast** - Built with Next.js 14 App Router and React Query

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **React Query** - Data fetching and caching
- **Lucide React** - Icon library
- **Recharts** - Charts and graphs

## Getting Started

### Prerequisites

- Node.js 18+ 
- Backend API running on port 3000

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run development server
npm run dev
```

The admin panel will be available at `http://localhost:3001`

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
admin-panel/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard layout group
│   │   ├── products/      # Products page
│   │   ├── stores/        # Stores page
│   │   └── brands/        # Brands page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard page
│   └── providers.tsx      # React Query provider
├── components/            # Reusable components
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Sidebar.tsx
│   ├── StatCard.tsx
│   └── Table.tsx
└── lib/                   # Utilities
    ├── api.ts            # API client
    └── utils.ts          # Helper functions
```

## API Integration

The admin panel connects to the backend API at `/api/v1/admin/*` endpoints:

- `GET /admin/dashboard/stats` - Dashboard statistics
- `GET /admin/products` - List products with pagination
- `GET /admin/stores` - List stores
- `POST /admin/stores/:id/sync` - Trigger store sync
- `GET /admin/brands` - List brands
- `POST /admin/brands` - Create brand
- `PUT /admin/brands/:id` - Update brand

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3000/api/v1)

## Development

### Adding New Pages

1. Create a new folder in `app/(dashboard)/`
2. Add `page.tsx` file
3. Update `components/Sidebar.tsx` navigation

### Adding New API Endpoints

1. Add types to `lib/api.ts`
2. Add API functions
3. Use with React Query in components

## License

MIT
