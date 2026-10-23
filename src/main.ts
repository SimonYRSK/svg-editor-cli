import { CompositionRoot } from './CompositionRoot.js';

/** Entry point of `npm run cli`. */
async function main(): Promise<void> {
  const repl = new CompositionRoot().createRepl(process.stdin, process.stdout);
  await repl.run();
}

main().catch((error: unknown) => {
  const detail = error instanceof Error ? error.message : String(error);
  process.stderr.write(`fatal: ${detail}\n`);
  process.exitCode = 1;
});
