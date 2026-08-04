# Known issues

## `gcp.cloudrun.DomainMapping` hangs or times out on `pulumi up` — RESOLVED 2026-08-03

> **Resolved by removing the resource, not by fixing it.** `branchleft.co.uk`
> and `www.branchleft.co.uk` were migrated off Cloud Run Domain Mapping onto a
> Global External Application Load Balancer with Certificate Manager on
> 2026-08-03 (originally `infra/edge.ts` in this repo; that program has since
> moved to a separate private infrastructure repo via a Pulumi state move, so
> a `website` deploy can no longer touch it — see that repo's state-move
> runbook). The two `DomainMapping` resources still
> exist in `domainMapping.ts`, retained as a rollback path while the new edge
> soaks. Cloud Run ingress is locked to the load balancer, so they carry no
> traffic **from any DNS record the cutover checklist actually changed** —
> but that turned out not to be the same thing as "carry no traffic" full
> stop. A stale `AAAA` record the original mapping had published back on
> 2026-08-01 — never part of the A-record cutover — was still live at IONOS a
> day later, and routed real IPv6-preferring mobile traffic straight into
> this now-blocked path, producing a genuine production 404. Fixed by
> deleting those `AAAA` records (see
> `ghost-platform-docs/12-availability-abuse-and-tenant-exit.md` §1 point 6
> for the full incident writeup and the resulting DNS-audit checklist).
> **Do not treat "retained as rollback" as synonymous with "receives no
> traffic" for either of these mappings** — re-check `dig` for every record
> type, not just `A`, before deleting them or trusting the soak period.
>
> The replacement was driven by Cloud Armor — which cannot attach to a Cloud
> Run service reached via Domain Mapping at all — rather than by this bug; the
> fix was a side effect. See
> `ghost-platform-docs/12-availability-abuse-and-tenant-exit.md` §1 for the
> architecture, and the "Production cutover" section there for what the real
> migration measured.
>
> **Kept because the reasoning still generalises.** The root-cause analysis
> below is the clearest statement of a pattern that recurs across this program
> (see the three bootstrap entries that follow): Pulumi blocking on a terminal
> state that can only be reached by an action the resource itself was supposed
> to unblock. It is also the answer to "why did we take on a fixed ~$18/month
> forwarding-rule charge", which is not obvious from the code alone.
>
> Certificate Manager, by contrast, **does not** block the apply on issuance —
> verified adversarially with the DNS-authorization record deliberately
> withheld. That is the specific property that makes the replacement work.

**Symptom:** `pulumi up` gets stuck (or times out after ~20 minutes) creating or
replacing a `domain-*` resource, often with a status like:

```
Route '<service>' exists but is not ready with a domain to serve traffic.
```

or it appears to succeed quickly but the mapping stays stuck in
`CertificatePending` indefinitely.

**Root cause:** this is not specific to this project, this domain, or IONOS as
a registrar. The raw GCP API is _not_ chicken-and-egg — `gcloud beta run
domain-mappings create` returns almost immediately with the DNS records you
need to configure, before any DNS exists. The problem is that Pulumi (via the
bridged `hashicorp/terraform-provider-google` resource
`google_cloud_run_domain_mapping`) blocks the whole `create`/`update` until
the resource reaches a terminal `Ready` state — but `Ready` can only become
true once a certificate has issued, which can only happen once DNS records
(the very thing the resource was supposed to hand you) are live at the
registrar. Using Cloud DNS instead of a third-party registrar doesn't remove
this — it just lets you automate the DNS-record side of the loop within the
same Pulumi program.

This is a long-standing, unfixed upstream issue, not something we introduced:

- [hashicorp/terraform-provider-google#19053](https://github.com/hashicorp/terraform-provider-google/issues/19053) — `Ready:False` failure, matches this exactly.
- [#8053](https://github.com/hashicorp/terraform-provider-google/issues/8053) — resource recreates on every apply.
- [#7741](https://github.com/hashicorp/terraform-provider-google/issues/7741) — forced replacement.
- [#4651](https://github.com/hashicorp/terraform-provider-google/issues/4651) — "is broken", open since 2020.

**Workaround:** don't wait out a stuck `pulumi up` past a few minutes. Go
directly to `gcloud`, which isn't subject to Pulumi's wait-for-Ready logic:

```bash
# Inspect current state / get the DNS records to hand to the registrar
gcloud beta run domain-mappings describe --domain=<domain> --region=<region> --project=<project> --format=yaml

# If genuinely stuck (e.g. underlying service was unhealthy when the mapping
# was first created), force a fresh reconciliation attempt:
gcloud beta run domain-mappings delete --domain=<domain> --region=<region> --project=<project> --quiet
gcloud beta run domain-mappings create --service=<service> --domain=<domain> --region=<region> --project=<project> --format=yaml
```

Since the resource is identified by domain name (not an internal UID),
Pulumi's state reconciles cleanly against the manually-recreated resource on
the next `pulumi preview`/`up` — no import needed.

**Planning implication:** when quoting or scoping similar work (Pulumi/Terraform

- Cloud Run + a custom domain via Domain Mapping) for future projects, budget
  for this manual `gcloud` step rather than assuming a single clean `pulumi up`
  will provision the domain end-to-end. This is also a direct consequence of
  Domain Mapping being a GCP "preview" feature with no SLA — the alternative
  (external HTTPS Load Balancer + Certificate Manager) doesn't have this
  particular problem, at the cost of a fixed monthly forwarding-rule charge.

## `pulumi preview --config <k>=<v>` writes to `Pulumi.production.yaml`

**Symptom:** a `git status` after what you believed was a read-only command
shows `Pulumi.production.yaml` modified, with `imageTag` changed.

**Why it matters here:** the stack pins `imageTag: bootstrap-amd64-v2`, and
the existing warning against a local `pulumi up` assumes that pin stays put.
`--config` is the obvious way to preview against the _live_ image rather than
the bootstrap one — but it is not a per-invocation override, it mutates the
stack config file, exactly the file the pin lives in. Committing that by
accident changes what a later deploy would roll out.

```bash
# Persists imageTag to Pulumi.production.yaml as a side effect
pulumi preview --config imageTag=<sha>

# Read-only
pulumi preview
```

**How to apply:** prefer a bare `pulumi preview` and read past the expected
`~image` diff, which is just the local bootstrap pin against whatever CI last
deployed. If you do use `--config`, `git checkout -- infra/Pulumi.production.yaml`
afterwards and confirm the pin is back before committing. Note this is a
different mechanism from the `pulumi up` footgun — that one changes production,
this one changes the file that decides what production becomes.

## `github-actions-deployer` SA needs manual IAM on the Pulumi state bucket

**Symptom:** `pulumi login gs://branchleft-pulumi-state` fails in the `deploy`
CI job with:

```
error: problem logging in: error listing stacks: could not list bucket:
blob (code=NotFound): googleapi: Error 403:
github-actions-deployer@branchleft-prod.iam.gserviceaccount.com does not
have storage.objects.list access to the Google Cloud Storage bucket ...
```

**Root cause:** chicken-and-egg, same shape as the Domain Mapping issue
above. `serviceAccounts.ts` grants the deployer SA `artifactregistry.writer`,
`run.developer`, and `iam.serviceAccountUser` — all via Pulumi, i.e. things
Pulumi can only grant _after_ it has already authenticated and read state
from this bucket. It cannot also grant itself read/write access to the very
bucket it needs to log in to, so the bucket's IAM was never covered by the
Pulumi program.

**Fix (already applied 2026-08-01):** granted manually via `gcloud`, not
through Pulumi:

```bash
gcloud storage buckets add-iam-policy-binding gs://branchleft-pulumi-state \
  --member="serviceAccount:github-actions-deployer@branchleft-prod.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

**Do not** try to import this binding into the Pulumi program and reconcile
it via `pulumi up` — the same bootstrap problem applies to any future
recreation of the SA or bucket. If the deployer SA is ever recreated, redo
the `gcloud` grant above manually before the next deploy.

## Pulumi stack secrets are encrypted with a Cloud KMS key — bootstrap it via `gcloud`, not Pulumi

**Context:** the `production` stack's secret config values (`gmailUser`,
`gmailAppPassword`) use a `gcpkms://` secrets provider instead of a shared
passphrase, so decrypt access is a normal, revocable IAM grant rather than a
single `PULUMI_CONFIG_PASSPHRASE` GitHub secret.

**Same chicken-and-egg shape as the two issues above:** Pulumi cannot grant
itself access to the key it needs in order to decrypt the stack config it
would use to run `pulumi up` in the first place. So the keyring
(`pulumi`), key (`pulumi-secrets`, location `europe-west1`), and the two
`roles/cloudkms.cryptoKeyEncrypterDecrypter` IAM bindings (for
`github-actions-deployer@branchleft-prod.iam.gserviceaccount.com` and
`rob@branchleft.co.uk`) were created manually via `gcloud`, then adopted
into the Pulumi program (`infra/kms.ts`) with `pulumi import` afterward —
never `pulumi up` for the initial creation.

**If the keyring/key is ever lost or needs recreating:**

```bash
gcloud services enable cloudkms.googleapis.com --project=branchleft-prod
gcloud kms keyrings create pulumi --location=europe-west1 --project=branchleft-prod
gcloud kms keys create pulumi-secrets --keyring=pulumi --location=europe-west1 \
  --purpose=encryption --project=branchleft-prod

gcloud kms keys add-iam-policy-binding pulumi-secrets \
  --keyring=pulumi --location=europe-west1 --project=branchleft-prod \
  --member="serviceAccount:github-actions-deployer@branchleft-prod.iam.gserviceaccount.com" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"
gcloud kms keys add-iam-policy-binding pulumi-secrets \
  --keyring=pulumi --location=europe-west1 --project=branchleft-prod \
  --member="user:rob@branchleft.co.uk" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"
```

Note Cloud KMS key rings can never be deleted, and keys are only ever
disabled, not destroyed — `pulumiSecretsKey` in `infra/kms.ts` is marked
`protect: true` for this reason.

**Do not manage this key's IAM bindings in Pulumi.** An attempt to declare
them as `gcp.kms.CryptoKeyIAMMember` resources fails in CI with:

```
Error retrieving IAM policy for KMS CryptoKey "...": googleapi: Error 403:
Permission 'cloudkms.cryptoKeys.getIamPolicy' denied on resource ...
```

`roles/cloudkms.cryptoKeyEncrypterDecrypter` grants _use_ of the key, not
`get/setIamPolicy` — managing the bindings would require giving CI
`roles/cloudkms.admin`. Don't. That would let the deploy pipeline rewrite
who is allowed to decrypt the stack's own secrets, which is precisely the
control this key was introduced to provide. The bindings are also a
bootstrap prerequisite (they must exist before Pulumi can decrypt config and
run at all), so managing them from inside the program is circular. Keep them
in `gcloud`, exactly like the state bucket IAM binding above.

## `github-actions-deployer` SA needs manual `serviceusage.serviceUsageAdmin` to manage `apis.ts`

**Symptom:** CI's `pulumi up` fails creating a new `gcp:projects:Service` resource with:

```
error: 1 error occurred:
  * Error when reading or editing Project Service : Request `List Project
  Services <project>` returned error: ... 403 ... Permission denied to list
  services for consumer container ... AUTH_PERMISSION_DENIED
```

**Root cause:** same bootstrap chicken-and-egg as the state bucket IAM and
KMS key issues above. The original entries in `requiredServices`
(`apis.ts`) were enabled the first time under `rob@branchleft.co.uk`'s
`roles/owner` account during initial setup, so CI's `github-actions-deployer`
SA — which only ever holds `artifactregistry.writer`, `run.developer`, and
`iam.serviceAccountUser` — never had to exercise the `gcp:projects:Service`
create/list path until a _new_ entry was added to `requiredServices`
(`cloudkms.googleapis.com`, for the KMS migration above). It surfaced only
then because it's the first API added to the list since CI became the sole
identity running `pulumi up`.

**Fix (already applied):** granted manually via `gcloud`, then declared in
`serviceAccounts.ts` (`deployer-service-usage-admin`) so it's tracked and
re-appliable going forward:

```bash
gcloud projects add-iam-policy-binding branchleft-prod \
  --member="serviceAccount:github-actions-deployer@branchleft-prod.iam.gserviceaccount.com" \
  --role="roles/serviceusage.serviceUsageAdmin"
```

It is declared in `serviceAccounts.ts` (`deployer-service-usage-admin`) for
documentation, but was brought into state with `pulumi import` — **not** left
for CI to create. The deployer SA has no `resourcemanager.projects.setIamPolicy`,
so any project-level `IAMMember` that isn't already in state will 403 during a
CI deploy. The two older project bindings (`artifactregistry.writer`,
`run.developer`) only work because they were created under the owner account
during initial setup.

**How to apply:** if the deployer SA is ever recreated, redo this grant
manually before the next `apis.ts` change — Pulumi still can't grant itself
a permission it needs in order to read/manage its own dependency APIs. Any
_new_ project-level IAM binding added to this program must likewise be
granted via `gcloud` and then `pulumi import`ed locally, never applied by CI.

## A missing project role fails the deploy _silently from the app's point of view_

**Symptom:** every `pulumi up` on `main` fails, but the site stays up and
serves correctly — so nothing alerts. The deploy log shows a 403 on a
resource unrelated to the app itself:

```
gcp:monitoring:UptimeCheckConfig website-uptime creating error:
Error 403: Permission 'monitoring.uptimeCheckConfigs.create' denied on
resource 'projects/branchleft-prod' (or it may not exist).
```

**What actually happened (2026-08-02 → 2026-08-03):** the monitoring work
added `gcp.monitoring.*` resources and a `gcp.logging.Metric` to the program.
The deployer SA held neither `roles/monitoring.editor` nor
`roles/logging.configWriter`, so `pulumi up` 403'd creating them — and
because a failed resource aborts the whole update, **the Cloud Run service
stopped picking up new images too**. Two commits merged to `main` and neither
reached production; the site went on serving the last image that deployed
before the monitoring change landed. Discovered incidentally two days later
while previewing an unrelated change.

**Why it hid.** The generalisable point, and the reason this has its own
entry rather than a line in the section above:

- The failing resources are **observability, not application** — nothing in
  the request path reads them, so the site is completely healthy while the
  deploy is completely broken.
- The **smoke test can't catch it.** It runs after `pulumi up` in the same
  job, so a failed `pulumi up` means it never executes. Even if it did, it
  hits the live URL, which was serving the old image perfectly happily.
- **A red run on `main` is the only signal**, and it's easy to read a red
  `main` as "that flaky e2e again" when the site is demonstrably fine.

**Fix:** granted manually via `gcloud`, then `pulumi import`ed, and declared
in `serviceAccounts.ts` alongside the others:

```bash
gcloud projects add-iam-policy-binding branchleft-prod \
  --member="serviceAccount:github-actions-deployer@branchleft-prod.iam.gserviceaccount.com" \
  --role="roles/monitoring.editor" --condition=None
gcloud projects add-iam-policy-binding branchleft-prod \
  --member="serviceAccount:github-actions-deployer@branchleft-prod.iam.gserviceaccount.com" \
  --role="roles/logging.configWriter" --condition=None
```

**Planning implication:** adding a resource _type_ the program has never
created before is the moment to check the deployer SA's roles, whether or not
the resource has anything to do with serving traffic. The three entries above
plus this one are all the same bug, and it will recur on the next new
resource type. Treat "does CI hold a role that can create this?" as part of
adding any new resource, and check that `main` is green after the deploy that
introduces it — the site being up does not mean the deploy succeeded.

## `github-actions-deployer` retains edge-admin IAM roles this program no longer uses — accepted risk, not closed

**Symptom:** would be silent. Nothing errors; the gap is a standing
capability, not a failure.

**What's true:** since the edge load balancer moved out of this repo (see the
"resolved" entry above and `serviceAccounts.ts`), nothing in this Pulumi
program exercises `deployer-load-balancer-admin`
(`roles/compute.loadBalancerAdmin`), `deployer-compute-security-admin`
(`roles/compute.securityAdmin`) or `deployer-certificate-manager-owner`
(`roles/certificatemanager.owner`) any more. They were deliberately left
granted to `github-actions-deployer` regardless — moving project-level IAM
for a deploy identity across repos has its own bootstrap trap, and there was
no benefit to taking that on in the same change that moved the edge resources
themselves. See `serviceAccounts.ts` for the reasoning in full.

**Why this is a real, currently-accepted gap, not just leftover config:**
Pulumi no longer _declaring_ the edge resources does not revoke the SA's
underlying GCP permissions. This repo is public and its CI workflow runs with
this SA's credentials on every push to `main`. A compromised or maliciously
modified workflow run could call the GCP `compute` and `certificatemanager`
APIs directly — bypassing Pulumi and this program entirely — and modify the
shared edge, its Cloud Armor policy, or its certificates. Nothing in this
repo's CI closes that path today.

**How to apply:** don't treat "the edge isn't in this program any more" as
"this repo can no longer affect the edge." When `github-actions-deployer` is
next scoped down to only what `website` itself needs, remove these three
roles as part of that work rather than assuming their removal was already
handled by the resources moving out. Until then, this is unfinished business
to revisit, not a settled architecture.
