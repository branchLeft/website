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
