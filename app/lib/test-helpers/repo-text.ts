import { readFileSync } from 'node:fs';

// The repository root, three levels up from app/lib/test-helpers/.
const REPO_ROOT = new URL('../../../', import.meta.url);

// A job key in ci.yml sits at two spaces; a step item sits at six.
const JOB_KEY = /^ {2}[A-Za-z0-9_-]+:\s*$/;
const STEP_ITEM = /^ {6}- /;

// Reads a file in the repository as UTF-8 text, by its path from the root.
// Tests use it to check the text of workflows and build files, not a parsed form.
export function readRepoFile(relative: string): string {
  return readFileSync(new URL(relative, REPO_ROOT), 'utf8');
}

// The lines of one job in a workflow source: from its key to the next job key.
// Returns null when no job has that name, so the caller decides whether that fails.
export function ciJobBlock(source: string, name: string): string[] | null {
  const lines = source.split('\n');
  const start = lines.findIndex((line) => line === `  ${name}:`);
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (JOB_KEY.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end);
}

// The lines of one step in a job block: from its `- name:` line to the next step.
// Throws when the job has no step with that name, so a typo cannot pass vacuously.
export function ciStepBlock(job: string[], name: string): string[] {
  const start = job.findIndex((line) => line.trim() === `- name: ${name}`);
  if (start === -1) throw new Error(`no step named "${name}" in the job`);
  const body: string[] = [];
  for (const line of job.slice(start + 1)) {
    if (STEP_ITEM.test(line)) break;
    body.push(line);
  }
  return body;
}
