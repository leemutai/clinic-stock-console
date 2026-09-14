# Clinic Stock Console

An internal stock-management console for clinic supplies teams. Built with React, React Router, TanStack Query, and Axios against the [DummyJSON](https://dummyjson.com/docs) mock API.

> **Assessment context:** clinic staff, ward tablets, patchy Wi-Fi, links shared over chat, single clinic today, rolling out to more later. The catalogue is generic retail data treated as clinic stock  no clinical content is invented.

---

## Section 1  Design

### 1. Components and screen division

The screen is divided into four functional regions:

| Region | Purpose | Components |
|---|---|---|
| **Shell** | Persistent chrome: brand, signed-in user, sign-out | `Layout`, `Header` |
| **Controls** | Search, category filter, sort field, sort order | `SearchBar`, `Filters` |
| **Results** | Paginated grid of stock items | `ProductList`, `ProductCard`, `Pagination` |
| **Detail** | Single item view + stock correction form | `ProductDetailsPage`, `StockUpdateForm` |

Shared state surfaces (`LoadingState`, `ErrorState`, `EmptyState`) are used by every data-bound view so behaviour is identical across pages.

Folder layout:

```
src/
  api/            client.js ┬╖ auth.js ┬╖ products.js
  components/
    auth/         LoginForm.jsx
    stocks/       SearchBar ┬╖ Filters ┬╖ ProductList ┬╖ ProductCard ┬╖ Pagination
    common/       LoadingState ┬╖ ErrorState ┬╖ EmptyState
    layout/       Header ┬╖ Layout
  pages/          LoginPage ┬╖ StockPage ┬╖ ProductDetailsPage
  hooks/          useAuth ┬╖ useDebounce ┬╖ useProducts
  routes/         AppRouter ┬╖ ProtectedRoute
  context/        AuthContext
  styles/         variables.css ┬╖ global.css
  main.jsx
```

### 2. Where each piece of state lives

State is deliberately split across three homes ΓÇö server cache, URL, and local component state ΓÇö and the split is enforced by rule, not by convenience.

**Server state  TanStack Query**

| Query key | Data | Stale time |
|---|---|---|
| `['products', filters]` | Paginated list | 5 min |
| `['product', id]` | Single item | 5 min |
| `['categories']` | Category list | `Infinity` (static) |

**URL state  React Router `useSearchParams`**

| Param | Meaning |
|---|---|
| `q` | Search query |
| `category` | Category slug |
| `sortBy` | Sort field |
| `order` | `asc` \| `desc` |
| `page` | 1-indexed page number |

Example: `/items?q=gloves&category=beauty&sortBy=stock&order=asc&page=2`

The URL is the source of truth for everything that must survive a refresh or a pasted link (Requirement #3). Nothing here is mirrored into React state or Context.

**Local UI state  `useState` only**

- Search input value *while typing* (before the debounce commits it to the URL)
- Mobile filter panel open/closed
- Stock-correction form input value
- Transient success/error toasts

Rules: no Redux. No global store for products. No URL state duplicated into Context.

### 3. Fetching, caching, and invalidation

- **TanStack Query** owns all server data.
- List queries: `staleTime: 5 min`, `keepPreviousData: true` so pagination does not flash empty.
- Category queries: `staleTime: Infinity` ΓÇö the category list never changes within a session.
- Search requests carry an `AbortSignal` from TanStack Query v5 into Axios, so a superseded request cannot resolve and overwrite the current one. This is the mechanism behind Requirement #1.
- **Stock corrections:** optimistic cache write on `onMutate`, rollback on error, and on success the corrected value is written into both the detail and list caches. We deliberately do **not** invalidate or refetch after success ΓÇö see Decision 3.

### 4. Layout, spacing, colour, typography

- **Layout:** CSS Grid and Flexbox; fluid from 360 px up. No fixed breakpoint for "mobile" ΓÇö the layout reflows.
- **Tokens:** `src/styles/variables.css` defines a 4 px-based spacing scale (`--spacing-1` ΓÇª `--spacing-8`), a small semantic colour palette (primary / success / warning / danger + neutrals), one font stack, and three radii. Every component consumes tokens; no magic numbers in component styles.
- **Colour and meaning:** stock levels use a semantic scale ΓÇö high / medium / low ΓÇö mapped to success / warning / danger tokens. Colour is never the *only* signal: the number is always shown too.
- **Typography:** one system font stack, four sizes (`sm` 0.875 rem through `2xl` 1.5 rem). Line length capped by container width for readability on tablets.
- **No component library.** Everything is plain CSS with tokens. The brief permits a library; I chose not to add one so the styling is fully explainable in the live session.

### 5. Accessibility

- **Semantics first:** `<main>`, `<header>`, `<nav>`, `<article>`, `<section>`, `<form>` on every screen; headings follow a strict h1 ΓåÆ h2 ΓåÆ h3 order.
- **Forms:** every input has a `<label htmlFor>` pair. The stock-correction number input has `min="0"`, `inputMode="numeric"`, and a helper line tied via `aria-describedby`.
- **Live regions:** loading and empty states use `role="status"` with `aria-live="polite"`; errors use `role="alert"` with `aria-live="assertive"`. Result count updates announce politely.
- **Keyboard:** logical tab order, a visible 2 px focus ring on all interactive elements, `Enter`/`Space` to submit, `Escape` to clear the search input.
- **Contrast:** all foreground/background pairs meet WCAG AA (ΓëÑ 4.5:1 for normal text, ΓëÑ 3:1 for large text).
- **Targets:** interactive elements are at least 44 ├ù 44 px on touch screens.
- **Responsive:** tested down to 360 px width.
- **Motion:** spinner is the only animation; it is decorative and communicates nothing colour-only.

### Decision log

#### Decision 1 ΓÇö URL as the source of truth for list state
- **Alternative rejected:** component state, React Context, or Redux.
- **Why:** Requirement #3 demands that refresh and pasted URLs restore search, filter, sort, and page. Only the URL satisfies that without extra synchronisation code. `useSearchParams` gives reading, writing, and history control for free.

#### Decision 2 ΓÇö 300 ms debounce + request cancellation
- **Alternative rejected:** debounce only, or immediate requests with a "latest response wins" guard.
- **Why:** Debouncing alone reduces request volume but does not stop a slow earlier request from resolving *after* a faster later one on a 2 s-delayed link ΓÇö the exact scenario Requirement #1 describes. TanStack Query v5 forwards an `AbortSignal` into `queryFn`; Axios honours it. The two together make stale responses impossible to render. Verified against `?delay=2000`.

#### Decision 3 ΓÇö Optimistic stock update, no refetch after success
- **Alternative rejected:** blocking UI until the PUT resolves; or optimistic update followed by `invalidateQueries`.
- **Why:** Ward tablets on patchy Wi-Fi make a blocking save button feel broken. But DummyJSON's `PUT /products/:id` is a mock ΓÇö it returns the updated object and does **not** persist it, so a subsequent `GET` returns the original stock. Refetching after success would visibly revert the user's correction. Instead, we write the corrected value into both the detail and list caches on success and roll back on failure. This is a deliberate accommodation of a mock-API limitation; against a real backend we would invalidate normally.

#### Decision 4 ΓÇö Search overrides category; never combined
- **Alternative rejected:** client-side intersection (fetch all category items and filter by `q` locally), or blocking one control when the other is used.
- **Why:** DummyJSON exposes `/products/search` and `/products/category/{slug}` as separate endpoints with no combined query. Fetching all 194 items per debounced keystroke is unacceptable on a ward tablet. When a query is active the category control is disabled and cleared so the UI reflects what the app is actually doing.

#### Decision 5 ΓÇö Simple promise-based token-refresh lock
- **Alternative rejected:** a full subscriber queue, or a third-party Axios refresh plugin.
- **Why:** The failure mode is specific ΓÇö many concurrent requests 401 at once, all try to refresh, only the last refresh token survives. A single in-flight promise plus a subscriber array is ~30 lines and can be defended line-by-line. A library would hide the same logic behind configuration we would still have to explain.

#### Decision 6 ΓÇö JavaScript over TypeScript
- **Alternative rejected:** TypeScript.
- **Why:** Honest self-assessment. Within the assessment window, JavaScript lets me spend effort on the hard parts ΓÇö cancellation, optimistic rollback, token refresh ΓÇö rather than on generics and type plumbing. A smaller submission I fully understand beats a larger one I cannot defend.

#### Decision 7  `select` on the list endpoint, full object on detail
- **Alternative rejected:** fetch the full product shape everywhere and pick fields in components.
- **Why:** The scenario is ward tablets on patchy Wi-Fi. The list view renders seven fields; the API lets us request only those (`select=id,title,price,stock,thumbnail,category,rating`). The detail page needs the full object. One query param, measurably fewer bytes on the slowest link.

---

## Section 2  Implementation

### Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React 18 | Stable, widely documented, sufficient for the scope |
| Routing | React Router v6 | `useSearchParams` is the cleanest way to make URL the source of truth |
| Server state | TanStack Query v5 | Caching, request cancellation via `AbortSignal`, mutation lifecycle hooks |
| HTTP | Axios | Interceptors make token injection and refresh centralised |
| Build | Vite 5 | Fast dev server, native ESM, trivial SPA deploy |
| Styling | Plain CSS + design tokens | No component library; every style decision is explained and reviewable |
| Testing | Vitest + Testing Library | Same transform pipeline as Vite; fast, minimal config |
| Lint/format | ESLint 8 + Prettier 3 | Conventional rules; ruleset chosen, not templated |
| Commit convention | commitlint + Husky | Conventional Commits enforced locally, not only in CI |
| CI/CD | GitHub Actions + Vercel | Pipeline validates; Vercel deploys from `main` |

### Project structure

```
src/
  api/                 client.js · auth.js · products.js
  components/
    auth/              LoginForm
    stocks/            SearchBar · Filters · ProductList · ProductCard ·
                       Pagination · StockUpdateForm
    common/            LoadingState · ErrorState · EmptyState
    layout/            Header · Layout
  pages/               LoginPage · StockPage · ProductDetailsPage
  hooks/               useAuth · useDebounce · useProductList · useProduct ·
                       useCategories · useUpdateStock · useStockFilters
  routes/              AppRouter · ProtectedRoute
  context/             AuthContext (provider only)
  styles/              variables.css (tokens) · global.css
  main.jsx
tests/
  hooks/               useDebounce.test.js · useUpdateStock.test.jsx
```

### Running locally

Prerequisites: Node.js 18+ and npm.

```bash
git clone https://github.com/leemutai/clinic-stock-console.git
cd clinic-stock-console
npm install
npm run dev
```

The dev server runs on http://localhost:5173. Sign in with any DummyJSON user — for example `emilys` / `emilyspass`.

### Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | ESLint over `src/` and `tests/` |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check (used in CI) |
| `npm run prepare` | Wire Husky git hooks |

### Testing approach

Tests cover the two pieces of logic most likely to break under well-intentioned refactoring:

- **`useDebounce`** — three tests, each catching a distinct failure mode:
  - returns the initial value synchronously (guards against a naive implementation that returns `undefined` on mount)
  - updates only after the delay elapses (guards against returning the raw input)
  - resets the timer on rapid changes (guards against a missing `clearTimeout`)

- **`useUpdateStock`** — three tests, each covering a distinct path of the optimistic mutation:
  - optimistically writes the new value into the detail cache before the server responds
  - rolls the detail cache back if the mutation fails
  - rolls every matching list-page cache back if the mutation fails

Presentational components (buttons, badges, cards) are not unit-tested. The brief explicitly penalises placeholder tests; asserting that a `<p>` renders adds noise, not signal.

### Implementation notes

- **Cancellation.** TanStack Query v5 forwards an `AbortSignal` into `queryFn`; Axios honours it. When the query key changes (new search term, new filter, new page), the previous request is aborted and cannot resolve into the current cache entry. Verified against `?delay=2000`.
- **URL is the source of truth.** `useStockFilters` is the only module that reads or writes `q`, `category`, `sortBy`, `order`, and `page`. Every other component goes through that hook.
- **Page resets on filter change.** `setFilters` clears `page` on any update other than a `page` update itself. This is what prevents Requirement #2 (filter change stranded on an empty page).
- **Search overrides category.** DummyJSON exposes `/products/search` and `/products/category/{slug}` as separate endpoints with no combined query. When a query is present, the category control is disabled with a hint rather than silently ignored. See Decision 4.
- **No refetch after successful stock update.** DummyJSON's PUT is a mock — it does not persist. Refetching would visibly revert the user's correction. The mutation writes the server response into both the detail and list caches. See Decision 3.
- **Token refresh is single-flight.** Many concurrent 401s trigger one refresh request, not many. Failed refreshes clear tokens and redirect to login once, not once per in-flight request.

### Limitations of the mock API

- **PUT does not persist.** A subsequent GET returns the original stock. The mutation writes the response into cache and does not invalidate — this is documented as a deliberate accommodation, not a bug.
- **Search and category cannot be combined.** The API provides them as separate endpoints; combining them would require fetching the entire catalogue per keystroke, which is unacceptable on patchy Wi-Fi.
- **Token is not a real JWT.** DummyJSON's `accessToken` is a base64 JSON blob with a meaningless signature. The app does not decode it to check expiry; the authoritative check is a live request to `/auth/me`. A 401 triggers refresh through the standard interceptor path.
- **Product data is generic retail.** Per the brief, the app treats this as the clinic's stock catalogue without renaming items or substituting images. Inventing clinical content would fabricate data and mismatch titles with thumbnails. Clinical framing is applied at the UI layer (stock emphasis, stock-level thresholds, labels), not to the underlying records.


---

## Section 3  Deployment & CI/CD

### Public URL

**https://clinic-stock-console-nine.vercel.app**

Sign in with `emilys` / `emilyspass`.

### Deployment branch

`main`. Every push to `main` triggers a production deploy on Vercel. Every pull request gets a preview deployment with its own URL.

### Pipeline overview

The pipeline is defined in `.github/workflows/ci.yml` and runs on every pull request and every push to `main`.

**Job 1 — Validate** (runs on every PR and on push to `main`):

1. `npm ci` — deterministic install from `package-lock.json`
2. `npm run format:check` — Prettier
3. `npm run lint` — ESLint
4. `npx commitlint` — validates commit messages in the PR's commit range (PRs only)
5. `npm run test` — Vitest

If any step fails, the job fails.

**Job 2 — Deploy** (runs only on push to `main`):

1. `npm ci`
2. `npm run build` — sanity check that the production build succeeds

The actual production deploy is performed by Vercel's GitHub integration, which watches `main` independently of GitHub Actions. This is deliberate: the workflow's `deploy` job acts as a build gate, while Vercel handles hosting. Both must succeed for a merge to reach production.

### Checks that can block a merge

Any of these failing on a PR blocks the merge:

- Prettier formatting drift (`format:check`)
- ESLint errors (`lint`)
- A commit message that doesn't follow Conventional Commits (`commitlint`)
- A failing test (`test`)

A `concurrency` block cancels superseded runs on the same branch, so pushing twice in quick succession doesn't waste CI minutes or race two deploys.

### Verification

The pipeline is verified to fail, not just to pass. A throwaway branch (`test/verify-ci-blocks-bad-format`) introduced deliberately malformed formatting in `src/App.jsx`; the PR was rejected at the Prettier check step. The branch was deleted and the PR closed without merging.

### Local enforcement

The same checks that run in CI also run locally:

- **Pre-commit** — Husky runs `lint-staged`, which formats and lints only the files being committed
- **Commit-msg** — Husky runs `commitlint`, which rejects non-conventional commit messages before they land

A deliberately malformed commit (`"bad message"`) was rejected locally by commitlint during development, verifying that the hooks are wired correctly.

---

## Section 4  Reflection

