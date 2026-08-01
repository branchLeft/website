# Known issues

## `gcp.cloudrun.DomainMapping` hangs or times out on `pulumi up`

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
