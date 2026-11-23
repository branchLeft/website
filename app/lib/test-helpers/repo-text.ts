import { readFileSync } from 'node:fs';

// The repository root, three levels up from app/lib/test-helpers/.
const REPO_ROOT = new URL('../../../', import.meta.url);

// Reads a file in the repository as UTF-8 text, by its path from the root.
// Tests use it to check the text of workflows and build files, not a parsed form.
export function readRepoFile(relative: string): string {
  return readFileSync(new URL(relative, REPO_ROOT), 'utf8');
}
