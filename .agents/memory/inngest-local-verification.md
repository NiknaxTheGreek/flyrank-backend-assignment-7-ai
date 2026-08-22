---
name: Inngest local verification
description: Durable details for registering and executing Inngest functions against the local dev server.
---

For Inngest v4, declare event triggers in the `createFunction` options object and pass the handler as the second argument. To register and run functions locally, set the non-secret `INNGEST_DEV=1` development setting and point the Inngest dev server at the Express endpoint.

**Why:** The legacy three-argument registration signature fails typechecking, and without development mode the SDK behaves as cloud mode and requires a production signing key.

**How to apply:** When adding or verifying another Inngest function locally, use the two-argument API with `triggers: [{ event: "..." }]`, restart the API after the development setting changes, then verify the local dev server sees registration and a function-finished event.