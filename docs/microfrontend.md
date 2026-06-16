# Module Federation & Microfrontend Architecture

> An analysis of runtime code-sharing, cross-container compilation, and distributed frontend scaling.

*Based on Steve Kinney's Enterprise UI Course (March 2026).*

---

## The Definition
Module Federation is a **runtime** composition system. Unlike traditional bundlers that statically compile monolithic assets, MF treats isolated builds as independent network containers. Containers actively expose modules (Producers) and consume them (Hosts) asynchronously at runtime. 

> **Crucial context**: Module Federation is environment-agnostic. While popular for microfrontends, it works natively in Node.js, SSR processes, and decentralized BFF layers.

---

## Deployment Strategy
Adopt Module Federation strictly when infrastructural independence is paramount.

**Use it for:**
- Coarse-grained vertical slices (domain features, routing pathways).
- Decoupled continuous delivery cadences across autonomous sprint teams.
- Shared component libraries demanding real-time runtime A/B testing functionality.

**Avoid it when:**
- Release cadences are identical. If your teams effectively deploy together, standard NPM packaging is infinitely faster and more predictable.
- Federating atomic micro-widgets. Distributing tiny UI leaf nodes horizontally introduces catastrophic network latency and systemic fragility. 

---

## Core Operational Model
Five mechanics drive distributed architectures:

  1. **Producer (remote)**: Exposes internal chunks over the network.
  2. **Consumer (host)**: Dynamically fetches and parses remote bundles.
  3. **Container**: The entry-point façade proxying an isolated build target.
  4. **Shared dependencies**: Modules explicitly mapped to prevent multi-loading overhead (e.g., Core React).
  5. **Share scopes**: Dependency pooling dictating runtime override priority.

Remote loading executes purely asynchronously—typically wrapped securely behind `import()` boundaries—mapping perfectly to React's lazy routing architecture.

---

## Configuration

Standard orchestration requires tracking four primary configurations `name`, `remotes`, `exposes`, and `shared`:

```js
// Remote (Producer)
module.exports = {
  name: 'catalog',
  filename: 'remoteEntry.js',
  exposes: {
    './ProductCard': './src/ProductCard.jsx',
  },
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
};

// Host (Consumer)
module.exports = {
  name: 'shell',
  remotes: {
    store: 'catalog@http://localhost:3001/remoteEntry.js', // Configured Alias
  },
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
};
```
*Note: The alias `store` maps purely locally, strictly abstracting the remote's `catalog` namespace.*

---

## The Execution Handshake

Peeling back the Webpack abstraction reveals standard Promise-driven execution routines:

```js
await __webpack_init_sharing__('default');
const container = window.catalog;
await container.init(__webpack_share_scopes__.default);

const factory = await container.get('./ProductCard');
const ProductCardModule = factory();
```
This asynchronous handshake resolves shared dependency graphs *before* the remote's factory logic is permitted to instantiate.

---

## Dependency Management

Shared modules are inherently volatile vectors. If frameworks like `react` strictly load asynchronously multiple times across containers, the internal fiber state breaks.

**Survival Rules:**
- Force `singleton: true` globally on root state libraries.
- The **Host** shell initializes first, seeding the origin share scope. Remotes must mathematically abide by the Host's system versioning unless specifically constrained. 
- Ban `eager` sharing unless synchronous loading at the primary entry is fundamentally required. Eager packing destroys chunk hydration efficiency.

---

## State & Route Ownership

**The Host Shell permanently owns the DOM router and the active URL.** 

```jsx
const Catalog = React.lazy(() => import('catalog/ProductList'));

<Route path="/catalog/*" element={<Catalog />} />
```
- A remote must definitively **never** inject its own localized `<BrowserRouter>`. Two routing algorithms fighting for `window.history` ownership will reliably corrupt structural components. 
- Remotes should utilize the wildcard `/*` router context explicitly to track parameter logic internally.

---

## Isolation & Failure Fallbacks
If a statically registered remote gateway stalls, the entire host application will fatally exception out before React can establish an Error Boundary container.

**Architectural Solutions:**
1. **Dynamic Registration**: Inject remotes programmatically through the MF runtime environment (`registerRemotes()`), safely bypassing the static boot sequence initialization locks.
2. **Lazy Wrappers**: Map `import(remote)` calls gracefully inside raw `.catch()` Promise chains to render isolated fallback UI skeletons if the handshake times out.

> Systems architecture relies on the premise that remotes *will* eventually fail. A crushed component should gracefully resolve to an empty div panel, not a 500 error shattering the root layer.

---

## Contract Migrations

Unlike API configurations, standard Module Federation establishes **no** typescript guardrails at runtime. There are zero validation checks or contract handshakes. If a Host demands a missing Prop, the system renders `undefined` silently.

**Expand, Migrate, Contract Workflow:**
Rapidly release breaking architectural changes securely. Deploy backward-compatible prop bridges to the Producer, patch the Consumers, and natively drop the shim entirely. Heavily integrate MF 2.0 `@module-federation/enhanced` bindings to securely attach TypeScript definitions intrinsically onto the runtime pipeline validation cycle.