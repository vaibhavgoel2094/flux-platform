// Zero-backend build: every page calls api.get/post/put exactly as it would
// against a real server. See localApi.ts for what actually fulfills that
// contract — a localStorage-backed workspace seeded from the bundled
// synthetic dataset, no network request involved.
export { api, ApiError } from "./localApi";
