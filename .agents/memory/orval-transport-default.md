---
name: Orval transport default
description: Orval 8 transport selection must match a custom Axios mutator.
---

Orval 8 defaults to fetch-shaped requests, even when a custom mutator accepts Axios request configurations. Select the HTTP transport explicitly when defining a new generation target.

**Why:** Choosing React Query as the client does not select Axios. A mismatched transport generates incompatible request arguments and can also add an unexpected HTTP response envelope around the returned data.

**How to apply:** Match each generation target's HTTP transport to its custom mutator. Confirm generated request signatures and return types with the shared-library type check; do not compensate by changing generated endpoint functions manually.
