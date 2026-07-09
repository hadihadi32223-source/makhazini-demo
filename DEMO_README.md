# Makhazini Demo Mode

This package keeps the original system flow and adds a separate browser-only demo mode for sharing with a client.

## Demo login accounts

```text
admin / admin123
warehouse.manager / manager123
storekeeper / store123
data.entry / data123
readonly / read123
```

## Run locally as a static demo

```bash
npm install
npm run build:demo
npm run preview
```

Open the shown local URL and log in using one of the accounts above.

## Deploy the demo on GitHub Pages

1. Run:

```bash
npm install
npm run build:demo
```

2. Upload the contents of the `dist` folder to GitHub Pages.

The demo uses browser storage and mock data, so it does not need `/api`, Supabase, or `AUTH_SECRET`.

## Important

The normal backend mode is still available. Use the original `npm run dev` or `npm run build` when you want the API/backend version. Demo mode is activated only through `.env.demo` and `npm run build:demo`.
