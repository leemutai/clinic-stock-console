# Clinic Stock Console

An internal stock-management console for clinic supplies teams. Built with React, React Router, TanStack Query, and Axios against the [DummyJSON](https://dummyjson.com/docs) mock API.

> **Assessment context:** clinic staff, ward tablets, patchy Wi-Fi, links shared over chat, single clinic today, rolling out to more later. The catalogue is generic retail data treated as clinic stock — no clinical content is invented.

---

## Section 1 — Design

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
  api/            client.js · auth.js · products.js
  components/
    auth/         LoginForm.jsx
    stocks/       SearchBar · Filters · ProductList · ProductCard · Pagination
    common/       LoadingState · ErrorState · EmptyState
    layout/       Header · Layout
  pages/          LoginPage · StockPage · ProductDetailsPage
  hooks/          useAuth · useDebounce · useProducts
  routes/         AppRouter · ProtectedRoute
  context/        AuthContext
  styles/         variables.css · global.css
  main.jsx
```

### 2. Where each piece of state lives

State is deliberately split across three homes — server cache, URL, and local component state — and the split is enforced by rule, not by convenience.

**Server state — TanStack Query**

| Query key | Data | Stale time |
|---|---|---|
| `['products', filters]` | Paginated list | 5 min |
| `['product', id]` | Single item | 5 min |
| `['categories']` | Category list | `Infinity` (static) |

**URL state — React Router `useSearchParams`**

| Param | Meaning |
|---|---|
| `q` | Search query |
| `category` | Category slug |
| `sortBy` | Sort field |
| `order` | `asc` \| `desc` |
| `page` | 1-indexed page number |

Example: `/items?q=gloves&category=beauty&sortBy=stock&order=asc&page=2`

The URL is the source of truth for everything that must survive a refresh or a pasted link (Requirement #3). Nothing here is mirrored into React state or Context.

**Local UI state — `useState` only**

- Search input value *while typing* (before the debounce commits it to the URL)
- Mobile filter panel open/closed
- Stock-correction form input value
- Transient success/error toasts

Rules: no Redux. No global store for products. No URL state duplicated into Context.

### 3. Fetching, caching, and invalidation

- **TanStack Query** owns all server data.
- List queries: `staleTime: 5 min`, `keepPreviousData: true` so pagination does not flash empty.
- Category queries: `staleTime: Infinity` — the category list never changes within a session.
- Search requests carry an `AbortSignal` from TanStack Query v5 into Axios, so a superseded request cannot resolve and overwrite the current one. This is the mechanism behind Requirement #1.
- **Stock corrections:** optimistic cache write on `onMutate`, rollback on error, and on success the corrected value is written into both the detail and list caches. We deliberately do **not** invalidate or refetch after success — see Decision 3.

### 4. Layout, spacing, colour, typography

- **Layout:** CSS Grid and Flexbox; fluid from 360 px up. No fixed breakpoint for "mobile" — the layout reflows.
- **Tokens:** `src/styles/variables.css` defines a 4 px-based spacing scale (`--spacing-1` … `--spacing-8`), a small semantic colour palette (primary / success / warning / danger + neutrals), one font stack, and three radii. Every component consumes tokens; no magic numbers in component styles.
- **Colour and meaning:** stock levels use a semantic scale — high / medium / low — mapped to success / warning / danger tokens. Colour is never the *only* signal: the number is always shown too.
- **Typography:** one system font stack, four sizes (`sm` 0.875 rem through `2xl` 1.5 rem). Line length capped by container width for readability on tablets.
- **No component library.** Everything is plain CSS with tokens. The brief permits a library; I chose not to add one so the styling is fully explainable in the live session.

### 5. Accessibility

- **Semantics first:** `<main>`, `<header>`, `<nav>`, `<article>`, `<section>`, `<form>` on every screen; headings follow a strict h1 → h2 → h3 order.
- **Forms:** every input has a `<label htmlFor>` pair. The stock-correction number input has `min="0"`, `inputMode="numeric"`, and a helper line tied via `aria-describedby`.
- **Live regions:** loading and empty states use `role="status"` with `aria-live="polite"`; errors use `role="alert"` with `aria-live="assertive"`. Result count updates announce politely.
- **Keyboard:** logical tab order, a visible 2 px focus ring on all interactive elements, `Enter`/`Space` to submit, `Escape` to clear the search input.
- **Contrast:** all foreground/background pairs meet WCAG AA (≥ 4.5:1 for normal text, ≥ 3:1 for large text).
- **Targets:** interactive elements are at least 44 × 44 px on touch screens.
- **Responsive:** tested down to 360 px width.
- **Motion:** spinner is the only animation; it is decorative and communicates nothing colour-only.

### Decision log

#### Decision 1 — URL as the source of truth for list state
- **Alternative rejected:** component state, React Context, or Redux.
- **Why:** Requirement #3 demands that refresh and pasted URLs restore search, filter, sort, and page. Only the URL satisfies that without extra synchronisation code. `useSearchParams` gives reading, writing, and history control for free.

#### Decision 2 — 300 ms debounce + request cancellation
- **Alternative rejected:** debounce only, or immediate requests with a "latest response wins" guard.
- **Why:** Debouncing alone reduces request volume but does not stop a slow earlier request from resolving *after* a faster later one on a 2 s-delayed link — the exact scenario Requirement #1 describes. TanStack Query v5 forwards an `AbortSignal` into `queryFn`; Axios honours it. The two together make stale responses impossible to render. Verified against `?delay=2000`.

#### Decision 3 — Optimistic stock update, no refetch after success
- **Alternative rejected:** blocking UI until the PUT resolves; or optimistic update followed by `invalidateQueries`.
- **Why:** Ward tablets on patchy Wi-Fi make a blocking save button feel broken. But DummyJSON's `PUT /products/:id` is a mock — it returns the updated object and does **not** persist it, so a subsequent `GET` returns the original stock. Refetching after success would visibly revert the user's correction. Instead, we write the corrected value into both the detail and list caches on success and roll back on failure. This is a deliberate accommodation of a mock-API limitation; against a real backend we would invalidate normally.

#### Decision 4 — Search overrides category; never combined
- **Alternative rejected:** client-side intersection (fetch all category items and filter by `q` locally), or blocking one control when the other is used.
- **Why:** DummyJSON exposes `/products/search` and `/products/category/{slug}` as separate endpoints with no combined query. Fetching all 194 items per debounced keystroke is unacceptable on a ward tablet. When a query is active the category control is disabled and cleared so the UI reflects what the app is actually doing.

#### Decision 5 — Simple promise-based token-refresh lock
- **Alternative rejected:** a full subscriber queue, or a third-party Axios refresh plugin.
- **Why:** The failure mode is specific — many concurrent requests 401 at once, all try to refresh, only the last refresh token survives. A single in-flight promise plus a subscriber array is ~30 lines and can be defended line-by-line. A library would hide the same logic behind configuration we would still have to explain.

#### Decision 6 — JavaScript over TypeScript
- **Alternative rejected:** TypeScript.
- **Why:** Honest self-assessment. Within the assessment window, JavaScript lets me spend effort on the hard parts — cancellation, optimistic rollback, token refresh — rather than on generics and type plumbing. A smaller submission I fully understand beats a larger one I cannot defend.

#### Decision 7 — `select` on the list endpoint, full object on detail
- **Alternative rejected:** fetch the full product shape everywhere and pick fields in components.
- **Why:** The scenario is ward tablets on patchy Wi-Fi. The list view renders seven fields; the API lets us request only those (`select=id,title,price,stock,thumbnail,category,rating`). The detail page needs the full object. One query param, measurably fewer bytes on the slowest link.

---

## Section 2 — Implementation



---

## Section 3 — Deployment & CI/CD



---

## Section 4 — Reflection

