# duke-mlk.github.io

OAuth-authenticated proxy that renders the private dashboard from [`duke-mlk/medical-flow`](https://github.com/duke-mlk/medical-flow) (gh-pages branch).

## How it works

1. User visits `duke-mlk.github.io` and signs in with GitHub (OAuth App, `repo` scope)
2. Token exchange happens via `cors-proxy.jonasneves.workers.dev`
3. App verifies the user has access to `duke-mlk/medical-flow`
4. Dashboard HTML is fetched from gh-pages via the GitHub API, scripts and stylesheets are inlined, and the result is rendered in an iframe via blob URL
5. A fetch interceptor proxies data/image requests through the GitHub Contents API

## Stack

- React, TypeScript, Vite, Zustand
- GitHub OAuth App (`Ov23lioKDt8Os7hdiSEh`)
- Deployed to GitHub Pages via Actions

## Development

```
npm install
npm run dev
```

## Setup

Add `https://duke-mlk.github.io/` as a callback URL in the [OAuth App settings](https://github.com/settings/developers).
