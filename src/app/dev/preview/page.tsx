import { notFound } from "next/navigation";

import PreviewClient from "./PreviewClient";

// Dev-only device preview: /dev/preview.
//
// The gate lives here, in a Server Component, rather than inside the client
// component. NODE_ENV is a build-time constant, so in a production build this
// module folds to an unconditional notFound() — the route answers 404 and the
// preview UI is never reachable. `notFound()` returns `never`, so nothing below
// it needs a guard.
export default function DevPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return <PreviewClient />;
}
