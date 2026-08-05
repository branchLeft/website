#!/usr/bin/env python3
"""Fail if a `pulumi preview` plans to delete the shared edge load balancer.

The edge moved to a separate private infrastructure repo via a Pulumi state
move. Until that move completes, this stack's state still holds the edge
resources while this program no longer declares them — so an unguarded
`pulumi up` deletes them, including the reserved anycast IP, which does not
come back.

Usage:
    assert-no-edge-deletes.py <preview-output-file>
    assert-no-edge-deletes.py --self-test

Exit status is 1 if any edge resource is planned for deletion, else 0.

Why this parses URNs rather than matching near a `(delete)` marker: the first
version of this check matched two lines *before* each `(delete)`, but the URN
sits *after* it. It therefore matched nothing, exited 0, and would have let
`pulumi up` run against the exact state it was written to block — a control
that ran, reported success, and did nothing. `--self-test` exists so that
failure mode is loud rather than invisible: it runs the matcher against a
fixture of real preview output and fails if the matcher stops matching.
"""

import re
import sys

# Logical names of the resources the state-move runbook moves out of this
# stack. A planned delete of any of them means the move has not completed.
EDGE_RESOURCES = {
    "edge-ip",
    "edge-armor",
    "edge-cert-map",
    "dns-auth-branchleft-co-uk",
    "dns-auth-www-branchleft-co-uk",
    "cert-branchleft-co-uk",
    "cert-www-branchleft-co-uk",
    "cert-entry-branchleft-co-uk",
    "cert-entry-www-branchleft-co-uk",
    "website-neg",
    "website-backend",
    "edge-url-map",
    "edge-https-proxy",
    "edge-https-rule",
    "edge-http-redirect",
    "edge-http-proxy",
    "edge-http-rule",
}

_DELETE = re.compile(r"\(delete\)\s*$")
_URN = re.compile(r"\[urn=.*::([^:\]]+)\]\s*$")


def edge_deletes(text: str) -> list[str]:
    """Return the edge resources `text` plans to delete.

    Pairs each `(delete)` line with the next `[urn=...]` line, whatever the
    distance between them, so the result does not depend on how many attribute
    lines the provider happens to print in between.
    """
    found: list[str] = []
    pending = False
    for line in text.splitlines():
        if _DELETE.search(line):
            pending = True
            continue
        match = _URN.search(line)
        if match:
            if pending and match.group(1) in EDGE_RESOURCES:
                found.append(match.group(1))
            pending = False
    return found


# One deleted edge resource and one deleted unrelated resource, in the exact
# shape `pulumi preview` emits (URN two lines below the marker).
_FIXTURE_DELETE = """\
    - gcp:compute/globalAddress:GlobalAddress: (delete)
        [id=projects/branchleft-prod/global/addresses/branchleft-edge-ip]
        [urn=urn:pulumi:production::branchleft-website-infra::gcp:compute/globalAddress:GlobalAddress::edge-ip]
        addressType: "EXTERNAL"
"""

_FIXTURE_UNRELATED = """\
    - gcp:storage/bucket:Bucket: (delete)
        [id=projects/branchleft-prod/buckets/something]
        [urn=urn:pulumi:production::branchleft-website-infra::gcp:storage/bucket:Bucket::unrelated-bucket]
"""

# An edge resource merely *mentioned* — updated, not deleted — must not fire.
_FIXTURE_UPDATE = """\
    ~ gcp:compute/globalAddress:GlobalAddress: (update)
        [id=projects/branchleft-prod/global/addresses/branchleft-edge-ip]
        [urn=urn:pulumi:production::branchleft-website-infra::gcp:compute/globalAddress:GlobalAddress::edge-ip]
"""


def self_test() -> int:
    cases = [
        ("edge resource deleted", _FIXTURE_DELETE, ["edge-ip"]),
        ("unrelated resource deleted", _FIXTURE_UNRELATED, []),
        ("edge resource updated, not deleted", _FIXTURE_UPDATE, []),
        ("both, in one preview", _FIXTURE_UNRELATED + _FIXTURE_DELETE, ["edge-ip"]),
        ("empty preview", "", []),
    ]
    failed = False
    for name, text, expected in cases:
        actual = edge_deletes(text)
        ok = actual == expected
        failed |= not ok
        print(f"{'PASS' if ok else 'FAIL'}: {name} -> {actual!r} (expected {expected!r})")
    if failed:
        print("\nThe edge-delete matcher no longer matches real preview output.")
        print("It would pass silently against a preview that deletes the edge.")
    return 1 if failed else 0


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    if sys.argv[1] == "--self-test":
        return self_test()

    try:
        with open(sys.argv[1], encoding="utf-8", errors="replace") as handle:
            text = handle.read()
    except OSError as error:
        # A missing or unreadable file must fail loudly. Reading it as empty
        # would report "no edge deletes planned" without having looked.
        print(f"::error::cannot read preview output: {error}")
        return 1

    found = edge_deletes(text)
    if found:
        print(
            "::error::pulumi preview plans to DELETE the shared edge load "
            f"balancer ({len(found)} resources: {', '.join(sorted(found))}). "
            "The Pulumi state move has not completed — see infra/KNOWN_ISSUES.md."
        )
        return 1

    print(f"OK: no edge resources planned for deletion ({len(text.splitlines())} lines checked).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
