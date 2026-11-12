# Cross-cutting Invariants

Project-wide invariants that must always hold. Enforced as cheap guards/assertions at owning modules and exercised by tests/runs.

| ID | Invariant | Scope / Owner module/boundary | Guard / assertion location | Exercised by (tests/runs) | Notes |
|---|---|---|---|---|---|
| INV-URL-SINGLE-WRITER | Single writer for URL/view/store interactions; URL and view state must not be mutated by competing writers. | Router / URL sync / Store / App shell | Owning router/store modules (URL updates and view-state transitions) | Integration/E2E for routing/navigation and URL↔UI sync | Prevents the "URL changes but view doesn't switch" class of failures. |
| INV-ROUTE-RENDER | A route change must result in the correct rendered view/state; route state exposed in a way the UI tracks. | Router + View binding (Alpine/components) | Router state ownership + view binding layer | Integration/E2E for navigation and deep links | Route/state change drives DOM update. |
| INV-PERSISTENCE-ROUNDTRIP | Persistence/serialization round-trips must preserve valid state or fail safely with no partial/corrupt state applied. | Persistence / localStorage / JSON import/export boundaries | Parse/validate at untrusted/serialized edges (see Boundary contracts) | Unit/integration tests for save/restore/import (valid/invalid/edge) | Pairs with boundary validation. |
| INV-IMPORT-NO-PARTIAL | Invalid import payloads must not apply a partial/corrupt state; valid payloads applied atomically/consistently or rejected with clear error. | JSON import boundary | Import/parse+validate owning module | Integration/unit tests for invalid payloads, unknown IDs | Unknown spell IDs may be skipped with a summary, but state must not be partially corrupted. |

**Usage:** `/technical-discovery` must reference applicable invariants from this list; feature-specific invariants go in the feature’s technical spec and may be promoted here if they become cross-cutting. Guards must exist at owners and be exercised by tests/runs; `/review`/independent reviewer checks alignment against this list and the feature spec.