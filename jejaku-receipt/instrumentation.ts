// Runs once when a new server instance starts, before it handles any
// requests — the right place for a process-wide patch like this, rather
// than relying on every module that calls fetch (auth.ts, email.ts, ...)
// to remember to import it first. See app/lib/fetchRetry.ts for why.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { installFetchRetry } = await import("./app/lib/fetchRetry");
    installFetchRetry();
  }
}
