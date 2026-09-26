# Learning this codebase (for a MERN developer)

You already know React, Express, MongoDB/Mongoose and Tailwind. Next.js keeps React and Mongoose exactly as you know them. What changes is **where code runs** and **how the browser talks to the server**. This guide maps each new idea to something you know, points at the real file, and ends with interview questions.

Take it in order. Don't try to read every file at once.

---

## 1. The one big mental shift

In MERN you have two apps:

```
React app (browser)  --axios-->  Express API  --mongoose-->  MongoDB
```

In this project there is **one app**, and each React component runs either on the server or in the browser:

```
Server Component (runs on server) --mongoose--> MongoDB     (reading data)
Client Component (runs in browser) --server action--> server --mongoose--> MongoDB   (writing data)
```

- **Server Components** are the default. They can be `async`, can `await` Mongoose directly, and never ship their code to the browser. They can't use `useState`, `useEffect` or `onClick`.
- **Client Components** start with `"use client"` at the top of the file. They're normal React: state, effects, event handlers. They can't talk to the database directly.
- **Server Actions** are async functions in a file that starts with `"use server"`. A client component imports one and calls it like a normal function. Next.js turns that call into a POST request for you. They replace the Express routes you'd normally write.

The rule of thumb: **pages fetch data on the server and pass plain props down to small interactive client components.**

---

## 2. MERN → this repo

| You know | Here | Look at |
|---|---|---|
| `react-router` routes | Folders in `app/` are URLs. `page.tsx` is the page. `[id]` is a URL param | `app/boards/[id]/page.tsx` |
| `useEffect(() => axios.get(...))` | An `async` Server Component that awaits Mongoose | `app/dashboard/page.tsx` |
| Express `router.post("/claims")` | A Server Action: `export async function createClaim()` | `lib/actions/items.ts` |
| Express routes (still exist) | Route Handlers: `app/api/.../route.ts` exporting `GET`/`POST` | `app/api/register/route.ts` |
| JWT auth middleware | NextAuth, and `getCurrentUser()` on the server | `lib/auth.ts` |
| Role-check middleware | `requireBoard(boardId, "edit")` at the top of each action | `lib/permissions.ts` |
| Refetching after a POST | `revalidatePath("/boards/123")` re-renders that page with fresh data | `lib/actions/items.ts` |
| `react-helmet` for `<title>` | `export const metadata` or `generateMetadata()` | `app/layout.tsx`, `app/profile/[username]/page.tsx` |
| `App.jsx` wrapper | `app/layout.tsx` wraps every page | `app/layout.tsx` |
| 404 route `*` | `app/not-found.tsx` (plus calling `notFound()`) | `app/not-found.tsx` |
| `mongoose.connect()` in `server.js` | Cached connection reused across requests (serverless-safe) | `lib/mongodb.ts` |
| `.env` + `dotenv` | `.env.local`, loaded automatically | `.env.example` |

---

## 3. Reading order (about 12 files)

Read each file with the question in the right column in mind.

| # | File | What to notice |
|---|---|---|
| 1 | `app/layout.tsx` | Fonts, global metadata and the title template (`%s · Warrant`), the `<Toaster />` |
| 2 | `app/page.tsx` | An async Server Component querying MongoDB. No `useEffect` anywhere |
| 3 | `components/SiteShell.tsx`, `components/Navbar.tsx` | A server component (Navbar) rendering client components (`MobileMenu`, `UserMenu`) and passing them props |
| 4 | `components/nav/MobileMenu.tsx` | A normal client component: `useState`, `usePathname`, close on Escape |
| 5 | `lib/auth.ts` | NextAuth config, the GitHub sign-up flow, `getCurrentUser()` |
| 6 | `lib/validation.ts` + `lib/permissions.ts` | Roles (owner / editor / commenter / viewer) and what each can do. Pure functions, unit tested in `tests/` |
| 7 | `lib/actions/boards.ts` | `createBoard`: auth check → validate → write → `logActivity` → `revalidatePath` |
| 8 | `components/BoardForm.tsx` | A client form calling a server action directly: `await createBoard(values)` |
| 9 | `app/boards/[id]/page.tsx` | Loads all board data on the server, turns it into plain objects, passes it to the canvas |
| 10 | `components/workspace/BoardWorkspace.tsx` | The canvas: building React Flow nodes, drag-to-save, drag-to-connect, panels |
| 11 | `components/workspace/DetailPanel.tsx` + `forms.tsx` | Edit, delete, status change and comments, all via server actions |
| 12 | `lib/activity.ts` + `lib/notifications.ts` | How one `Activity` collection powers history, the dashboard feed and notifications |

---

## 4. Trace one feature end to end: "Add a claim"

Follow this with the files open. It's the best single exercise for understanding the app.

1. **Button click.** `ToolRail` or `MobileActionBar` (`components/workspace/chrome.tsx`) calls `openCompose("claim")`.
2. **Form opens.** `BoardWorkspace.tsx` renders `<ClaimForm>` (`forms.tsx`) in a floating panel, or a bottom sheet on phones.
3. **Where should it go?** On submit, `getPosition()` in `BoardWorkspace.tsx` finds a free spot near the center of the screen.
4. **Server action.** The form calls `createClaim(boardId, { title, tags, position })` from `lib/actions/items.ts`. The browser sends a POST behind the scenes.
5. **Permission check.** `requireBoard(boardId, "edit")` gets the session user, loads the board and resolves their role. Viewers and commenters get an error message back.
6. **Validate and save.** `cleanTags`, `cleanPosition`, then `Claim.create(...)`.
7. **History.** `logActivity(...)` writes an Activity row and bumps the board's `updatedAt`.
8. **Refresh.** `revalidatePath("/boards/<id>")` tells Next.js to re-run `app/boards/[id]/page.tsx`. The fresh data comes back in the same response.
9. **Canvas updates.** `BoardWorkspace` gets a new `data` prop and merges it into its nodes (the `prevData !== data` block), keeping positions that are already on screen.
10. **Feedback.** The form calls `toast("Claim added to the board.")` and closes. If the card landed off-screen, `afterCreate()` pans to it.

**Exercise:** do the same trace for "comment on a card" (`DetailPanel.tsx` → `addComment` → `Comment.create` → activity → revalidate).

---

## 5. How the canvas works (React Flow)

- React Flow draws **nodes** (cards) and **edges** (lines). We register three custom node components in `components/workspace/nodes.tsx`: `claim`, `source`, `note`.
- `buildNodes()` converts claims, sources and notes into React Flow nodes. Saved positions come from MongoDB; cards without one get a default layout.
- Edges come from `Evidence` documents: `source = claimId`, `target = sourceId`, and the label and color come from the relationship.
- **Dragging:** React Flow emits position changes → `applyNodeChanges` updates local state → `onNodeDragStop` calls `saveNodePosition()`, a server action with no revalidate so nothing flickers.
- **Connecting:** dragging from one card's dot to another fires `onConnect`. `isValidConnection` only allows claim↔source, and the evidence form then opens pre-filled.
- **Selection** is our own state (`selection`), not React Flow's, so the side panel, highlighted card and highlighted edge always agree.

---

## 5b. How the "hand-drawn" look works

Nothing is an image. Every wobbly line, arrow, highlighter stroke and pencil circle is an SVG path from `lib/rough.ts`:

- `seeded("some-id")` returns a tiny pseudo-random number generator. The same seed always gives the same numbers.
- The shape functions (`handConnector`, `handArrowhead`, `handEllipse`, `handHighlight`) add small random offsets to otherwise perfect geometry.
- Seeding by the card's or edge's id means the server and the browser draw exactly the same path. Otherwise React would complain about a hydration mismatch, and cards would jiggle on every render.

The building blocks in `components/paper/` wrap this, so pages just write `<IndexCard seed={board.id}>` or `<HandNote arrow="up">`. The canvas edges are a custom React Flow edge type (`components/workspace/HandEdge.tsx`).

**Interview angle:** "How did you make it look hand-made without images?" Deterministic procedural SVG, seeded by ids for stable server rendering, plus a unit test (`tests/rough.test.ts`) that guarantees it.

## 6. Auth in one paragraph

NextAuth (`lib/auth.ts`) handles login. Email/password users are checked with bcrypt in `authorize()`. GitHub users are created on first sign-in with a generated username. Sessions are JWTs in an HTTP-only cookie. On the server, `getCurrentUser()` reads the session. Pages redirect to `/login?callbackUrl=...` when there's no user, and every server action re-checks the user and role. **Never trust the client**: the UI hides buttons, but the server is what actually enforces permissions.

---

## 7. Testing

- `npm test`: Vitest runs `tests/*.test.ts`. They're fast pure-function tests, including the full role/permission matrix.
- `npm run test:e2e`: Playwright builds the app, starts it on port 3100 against a separate database, and drives real Chromium through `e2e/*.spec.ts` on desktop and phone viewports.
- CI (`.github/workflows/ci.yml`) runs all of it on every push, with MongoDB as a Docker service.

---

## 8. Two-week plan (alongside DSA)

**Week 1: Next.js basics**
- Do the official **Next.js Learn course (App Router)** at nextjs.org/learn. It maps almost one-to-one onto this repo.
- Read sections 1 to 3 of this guide and the first 6 files in the reading order.
- Change something small and visible, e.g. the home page copy or a new topic in `lib/constants.ts`, and watch it update.

**Week 2: own a feature**
- Do the trace in section 4 with a debugger or `console.log` in the server action (logs appear in your terminal, not the browser).
- Build a small feature yourself: **delete your own comment**.
  1. `deleteComment` server action with a check that the author matches the user
  2. A button in `DetailPanel.tsx`
  3. An activity row
  4. A unit test for the rule
- Practice explaining the architecture out loud in 2 minutes using the diagram in the README.

---

## 9. Interview questions you should be ready for

1. **Why Next.js instead of MERN for this?** One codebase, data fetching on the server (fast first load, good SEO for public boards), and server actions remove a lot of API boilerplate. Mongoose and React knowledge carry over directly.
2. **What's the difference between a Server Component and a Client Component?** Server Components run only on the server, can read the database, and send HTML plus a serialized tree. Client Components hydrate in the browser and handle interactivity. We keep client components small: canvas, forms, menus.
3. **How do Server Actions work?** A `"use server"` function becomes an RPC endpoint. Calling it from the client sends a POST with the arguments. The return value must be serializable. They're still public endpoints, so each one checks auth itself.
4. **How do you stop a viewer from editing?** The UI hides editing tools, but the real protection is `requireBoard(boardId, "edit")` inside every write action. It's unit-tested and covered by the roles E2E test.
5. **How do card positions persist?** On drag stop we call `saveNodePosition`, which writes `{x, y}` to the card document. We skip revalidation there so dragging doesn't cause a re-render.
6. **After a save, how does the page update?** `revalidatePath` re-renders the Server Component and the fresh data arrives in the action's response. The canvas merges it without resetting card positions.
7. **How is data modeled?** Separate collections for claims, sources, notes, evidence (a join between claim and source with a relationship), comments and activity, all keyed by `boardId` with indexes. Members are embedded in the board because they're small and always read with it.
8. **Why is Evidence its own collection and not an array on Claim?** It's a many-to-many relationship with its own data (type, explanation, author), it needs uniqueness per pair (a compound unique index), and it's queried from both sides.
9. **How do you count claims per board for a list without N+1 queries?** One aggregation per collection: `$match` on the board IDs, then `$group` by `boardId` (`lib/data.ts`).
10. **How does search avoid leaking private boards?** It first computes the boards you're allowed to see, then searches claims, sources and notes only inside those. User input is regex-escaped (`escapeRegex`).
11. **How do notifications work without websockets?** They're derived from the Activity collection: recent rows by other people on your boards. A `notificationsSeenAt` timestamp on the user drives the unread dot. Real-time updates would be a next step (e.g. polling or websockets).
12. **What about security?** bcrypt passwords, JWT sessions in HTTP-only cookies, auth checks in every action, http(s)-only URL validation (no `javascript:` links), a relative-only login redirect (no open redirect), private board names hidden from metadata, and security headers in `next.config.ts`.
13. **How did you make it mobile-friendly?** The canvas tools become a bottom action bar and panels become bottom sheets. The E2E suite runs on a Pixel 7 viewport and fails if any page scrolls sideways.
14. **How do you test it?** Unit tests for pure rules; E2E tests for user journeys on desktop and phone; CI runs lint, types, tests, build and E2E on every push.
15. **What would you improve next?** Real-time collaboration (websockets or a CRDT for positions), optimistic UI for card creation, full-text search with a MongoDB Atlas Search index, rate limiting on auth routes, and version history with restore.
16. **Hardest bug?** One real example from building this: new cards were being placed on top of existing ones. The E2E test caught it because it couldn't click the claim underneath. The fix was to search for a free slot, preferring below and then right, and pan to cards that land off-screen.

---

## 10. Glossary

- **App Router**: the `app/` folder routing system.
- **RSC**: React Server Components.
- **Hydration**: React attaching event handlers in the browser to HTML the server already rendered.
- **revalidatePath**: marks a page's data as stale so it's re-rendered with fresh data.
- **Serverless**: on Vercel each request may run in a fresh function, which is why `lib/mongodb.ts` caches the connection on `global`.
