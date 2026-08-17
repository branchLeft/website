#!/usr/bin/env python3
"""Refuse a `Pulumi.<stack>.yaml` that carries an `encryptionsalt`.

The salt is an offline verifier for the stack passphrase: whoever holds it can
test candidate passphrases at their own rate, with nothing in the loop to
notice and no service to rate-limit them. It does not belong in a repository
anyone can clone.

A `secure:` ciphertext is deliberately *not* a finding. `branchLeft/standards`
PUL-12 is explicit that a ciphertext with no salt beside it is not an oracle --
nothing in such a file lets an attacker derive the key or verify a guess
offline -- and that rejecting it would ban the safe half of the pattern with
the unsafe half for no security gain. Widening this matcher past the clause
would also make the local hook and the standards gate disagree, and the one
that fires first would be the one nobody believes.

This has to be a mechanical check rather than a rule people follow, because the
salt is not added by hand. Pulumi writes it back into the file itself, during
an ordinary `pulumi config set` or `pulumi stack init`, and the diff then looks
like exactly what the command was asked to do.

Usage:

    assert-no-committed-pulumi-secrets.py PATH [PATH...]   # scan named files
    assert-no-committed-pulumi-secrets.py --scan-tree DIR  # find them itself
    assert-no-committed-pulumi-secrets.py --self-test

`--scan-tree` exists so CI does not inherit pre-commit's `files:` pattern as
its only definition of which files matter. A hook whose pattern silently stops
matching is a hook that passes everything, and the pattern lives in a different
file from this one.

**What it does not see.** It reads lines, not YAML: a real parser is not
available here, the same stdlib-only constraint the other script beside this
one works under. A key written inside an inline flow mapping
(`config: {encryptionsalt: x}`) is therefore missed. Pulumi has never emitted
that shape -- it writes block style throughout -- so the gap is between what
Pulumi writes and what YAML permits, not a case anything here produces.
"""

from __future__ import annotations

import argparse
import contextlib
import io
import pathlib
import re
import sys
import tempfile

# Anchored at the start of a mapping entry so the key has to *be*
# `encryptionsalt` rather than merely end with it, and case-insensitive because
# the raw bytes are an oracle whatever case wraps the key -- a leftover from a
# half-done migration is crackable even where Pulumi's own parser would skip
# the line. A guard that cries wolf is a guard people start passing
# --no-verify to, so it matches nothing wider than that.
FORBIDDEN_KEY = re.compile(r"^\s*(?:-\s+)?encryptionsalt\s*:", re.IGNORECASE)

# A stack config, not a project file: `Pulumi.yaml` declares the project and
# never holds the salt, while `Pulumi.<stack>.yaml` does.
STACK_CONFIG = re.compile(r"^Pulumi\.[^/]+\.yaml$")

SKIP_DIRS = {".git", ".worktrees", "node_modules", "graphify-out", "dist", "vendor"}


def is_commented(line: str) -> bool:
    """Whether the line is entirely a comment.

    Only a leading `#` counts. A `#` further along may be inside a value, and
    treating it as a comment marker would let `encryptionsalt: v1:x#y` through.
    """
    return line.lstrip().startswith("#")


def offending_lines(text: str) -> list[tuple[int, str]]:
    """Every (1-based line number, line) that commits a secret."""
    found = []
    for number, line in enumerate(text.splitlines(), start=1):
        if is_commented(line):
            continue
        if FORBIDDEN_KEY.search(line):
            found.append((number, line.rstrip()))
    return found


def is_stack_config(path: pathlib.Path) -> bool:
    return bool(STACK_CONFIG.match(path.name))


def find_stack_configs(root: pathlib.Path) -> list[pathlib.Path]:
    found = []
    for path in sorted(root.rglob("Pulumi.*.yaml")):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if is_stack_config(path):
            found.append(path)
    return found


def check(paths: list[pathlib.Path]) -> int:
    failed = False
    for path in paths:
        try:
            text = path.read_text(encoding="utf-8")
        except OSError as exc:
            # Not a pass. A file this cannot read is a file it cannot clear,
            # and reporting clean for it is the failure mode that matters.
            print(f"::error::cannot read {path}: {exc}", file=sys.stderr)
            failed = True
            continue
        for number, line in offending_lines(text):
            print(f"::error file={path},line={number}::{line}", file=sys.stderr)
            failed = True
    if failed:
        print(
            "\nRemove these before committing. The salt is supplied at deploy from a "
            "repository secret, and an operator applying by hand appends their own "
            "copy without committing it -- see CLAUDE.md.",
            file=sys.stderr,
        )
        return 1
    return 0


# --------------------------------------------------------------------------
# Self-test
#
# Hermetic: fixtures in this file and a temp directory, nothing about the real
# repository. It must pass in every state of the tree, so it can run on every
# edit to this script.
# --------------------------------------------------------------------------

SALTED = "config:\n  gcp:project: p\nencryptionsalt: v1:AAA=:v1:BBB:CCC==\n"
INDENTED_SALT = "config:\n  a: b\n  encryptionsalt: v1:AAA=\n"
UPPERCASE_SALT = "config:\n  a: b\nEncryptionSalt: v1:AAA=\n"
LIST_SALT = "config:\n  proj:list:\n    - encryptionsalt: AAAA\n"
# The live shape of this repo's stack config: ciphertexts stay, the salt does
# not. Both directions matter, so both are asserted on one fixture.
SECURE_VALUE = "config:\n  proj:token:\n    secure: AAAABBBBCCCC\n"
SECURE_VALUE_WITH_SALT = SECURE_VALUE + "encryptionsalt: v1:AAA=\n"
COMMENTED = (
    "# `encryptionsalt` is deliberately absent from this committed file.\n"
    "#     printf '\\nencryptionsalt: %s\\n' \"$SALT\" >> Pulumi.production.yaml\n"
    "config:\n  gcp:project: p\n"
)
SALT_SUFFIX_KEY = "config:\n  proj:noencryptionsalt: x\n  proj:encryptionsaltish: y\n"
CLEAN = "config:\n  gcp:project: branchleft-prod\n  proj:region: europe-west1\n"
SALT_WITH_HASH = "encryptionsalt: v1:AAA=#notacomment\n"


def _quiet_check(paths: list[pathlib.Path]) -> tuple[int, str]:
    """`check` with its report captured, so a fixture's own error output does
    not read as a self-test failure."""
    buffer = io.StringIO()
    with contextlib.redirect_stderr(buffer):
        code = check(paths)
    return code, buffer.getvalue()


def _self_test() -> int:
    cases = [
        ("a committed salt is caught", SALTED, [3]),
        ("an indented salt is caught", INDENTED_SALT, [3]),
        ("a salt in any case is caught", UPPERCASE_SALT, [3]),
        ("a salt as a list item is caught", LIST_SALT, [3]),
        ("a secure: value with no salt beside it is allowed", SECURE_VALUE, []),
        ("a salt beside a secure: value is still caught", SECURE_VALUE_WITH_SALT, [4]),
        ("commented-out mentions are ignored", COMMENTED, []),
        ("a key merely containing the word is not flagged", SALT_SUFFIX_KEY, []),
        ("a clean stack config passes", CLEAN, []),
        ("a # inside a value does not make the line a comment", SALT_WITH_HASH, [1]),
    ]

    failures = 0
    for label, text, expected in cases:
        actual = [number for number, _ in offending_lines(text)]
        if actual == expected:
            print(f"PASS: {label} -> lines {actual} (expected {expected})")
        else:
            print(f"FAIL: {label} -> lines {actual} (expected {expected})", file=sys.stderr)
            failures += 1

    name_cases = [
        ("Pulumi.production.yaml", True),
        ("Pulumi.blog.yaml", True),
        ("Pulumi.yaml", False),
        ("Pulumi.production.yaml.bak", False),
        ("something.yaml", False),
    ]
    for name, expected in name_cases:
        actual = is_stack_config(pathlib.Path("a/b") / name)
        if actual == expected:
            print(f"PASS: {name} is{'' if expected else ' not'} a stack config")
        else:
            print(f"FAIL: {name} -> {actual} (expected {expected})", file=sys.stderr)
            failures += 1

    with tempfile.TemporaryDirectory() as raw:
        root = pathlib.Path(raw)
        (root / "Pulumi.production.yaml").write_text(CLEAN, encoding="utf-8")
        (root / "infra").mkdir()
        (root / "infra" / "Pulumi.production.yaml").write_text(SALTED, encoding="utf-8")
        (root / "Pulumi.yaml").write_text("name: x\nruntime: nodejs\n", encoding="utf-8")
        skipped = root / "node_modules" / "pkg"
        skipped.mkdir(parents=True)
        (skipped / "Pulumi.fixture.yaml").write_text(SALTED, encoding="utf-8")

        found = {p.relative_to(root).as_posix() for p in find_stack_configs(root)}
        expected_found = {"Pulumi.production.yaml", "infra/Pulumi.production.yaml"}
        if found == expected_found:
            print(f"PASS: --scan-tree finds {sorted(found)} and skips Pulumi.yaml and node_modules")
        else:
            print(f"FAIL: --scan-tree found {sorted(found)} (expected {sorted(expected_found)})", file=sys.stderr)
            failures += 1

        code, report = _quiet_check(find_stack_configs(root))
        if code == 1 and "infra/Pulumi.production.yaml" in report.replace("\\", "/"):
            print("PASS: a tree containing a salted stack config exits 1, naming the file")
        else:
            print(f"FAIL: salted tree -> exit {code}, report {report!r}", file=sys.stderr)
            failures += 1

        # The shape this repo actually commits: ciphertexts, no salt.
        (root / "infra" / "Pulumi.production.yaml").write_text(SECURE_VALUE, encoding="utf-8")
        code, _ = _quiet_check(find_stack_configs(root))
        if code == 0:
            print("PASS: a salt-free tree exits 0 with its ciphertexts intact")
        else:
            print("FAIL: a salt-free tree did not exit 0", file=sys.stderr)
            failures += 1

        code, _ = _quiet_check([root / "Pulumi.missing.yaml"])
        if code == 1:
            print("PASS: an unreadable path fails rather than reporting clean")
        else:
            print("FAIL: an unreadable path did not fail", file=sys.stderr)
            failures += 1

    if failures:
        print(f"\n{failures} self-test failure(s)", file=sys.stderr)
        return 1
    print("\nOK: assert-no-committed-pulumi-secrets.py self-test passed")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("paths", nargs="*", help="stack config files to check")
    parser.add_argument("--scan-tree", metavar="DIR", help="find every Pulumi.<stack>.yaml under DIR")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args(argv)

    if args.self_test:
        return _self_test()

    targets = [pathlib.Path(p) for p in args.paths]
    if args.scan_tree:
        targets += find_stack_configs(pathlib.Path(args.scan_tree))
    if not targets:
        parser.error("pass at least one path, or --scan-tree DIR, or --self-test")
    return check(targets)


if __name__ == "__main__":
    sys.exit(main())
