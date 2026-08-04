import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { projectId } from './config';
import { gmailUser, gmailAppPassword } from './secrets';

export const cloudRunRuntimeSa = new gcp.serviceaccount.Account('cloud-run-runtime-sa', {
  accountId: 'cloud-run-runtime',
  displayName: 'branchLeft website - Cloud Run runtime identity',
});

for (const [label, { secret }] of Object.entries({
  gmailUser,
  gmailAppPassword,
})) {
  new gcp.secretmanager.SecretIamMember(`runtime-sa-access-${label}`, {
    secretId: secret.id,
    role: 'roles/secretmanager.secretAccessor',
    member: pulumi.interpolate`serviceAccount:${cloudRunRuntimeSa.email}`,
  });
}

export const githubActionsDeployerSa = new gcp.serviceaccount.Account(
  'github-actions-deployer-sa',
  {
    accountId: 'github-actions-deployer',
    displayName: 'branchLeft website - GitHub Actions CI/CD identity',
  }
);

new gcp.projects.IAMMember('deployer-artifact-registry-writer', {
  project: projectId,
  role: 'roles/artifactregistry.writer',
  member: pulumi.interpolate`serviceAccount:${githubActionsDeployerSa.email}`,
});

// Cloud Run has no per-service deploy role (only per-service invoker, via
// cloudrunv2.ServiceIamMember) — roles/run.developer is project-wide. Fine
// for a single-service project; revisit with an IAM Condition scoped to the
// service resource name if more services are added later.
new gcp.projects.IAMMember('deployer-run-developer', {
  project: projectId,
  role: 'roles/run.developer',
  member: pulumi.interpolate`serviceAccount:${githubActionsDeployerSa.email}`,
});

// Lets the deployer SA deploy Cloud Run revisions that run as the runtime SA.
new gcp.serviceaccount.IAMMember('deployer-can-act-as-runtime-sa', {
  serviceAccountId: cloudRunRuntimeSa.name,
  role: 'roles/iam.serviceAccountUser',
  member: pulumi.interpolate`serviceAccount:${githubActionsDeployerSa.email}`,
});

// Lets the deployer SA manage the gcp.projects.Service resources in
// apis.ts. Granted via gcloud and then `pulumi import`ed — like the two
// bindings above, CI can't create this itself (no project setIamPolicy),
// so it must already exist in state before a deploy runs. See
// KNOWN_ISSUES.md.
new gcp.projects.IAMMember('deployer-service-usage-admin', {
  project: projectId,
  role: 'roles/serviceusage.serviceUsageAdmin',
  member: pulumi.interpolate`serviceAccount:${githubActionsDeployerSa.email}`,
});

// The roles below are all granted via gcloud and `pulumi import`ed, for the
// same reason as the bindings above — CI has no project-level setIamPolicy, so
// a binding it doesn't already hold can't be created by the deploy that needs
// it.
//
// The first three (loadBalancerAdmin, compute.securityAdmin,
// certificatemanager.owner) were originally for the edge load balancer this
// repo used to declare in `edge.ts` — loadBalancerAdmin for the address,
// serverless NEG, backend service, URL maps, proxies and forwarding rules;
// securityAdmin for the Cloud Armor policy; certificatemanager.owner for the
// DNS authorizations, certificates and certificate map. The edge itself has
// since moved to a separate private infrastructure repo via a Pulumi state
// move, and that repo runs no CI deploy of its own (it's applied by hand,
// under a human owner account), so nothing exercises these three roles
// through *this* deployer SA today.
//
// They stay granted anyway — a deliberate deferral, not an oversight, and
// NOT a settled position: moving project-level IAM for a deploy identity
// across repos has its own bootstrap trap (see KNOWN_ISSUES.md), and there
// was no benefit to taking that on in the same change that moved the edge
// resources themselves.
//
// Be precise about what "unused" means here: Pulumi no longer *declaring*
// the edge resources does not revoke the deployer SA's project-level GCP
// permissions to modify them. This repo is public, and its CI workflow runs
// with this SA's credentials — a compromised or maliciously modified
// workflow run could call the GCP API directly (bypassing Pulumi entirely)
// and modify the shared edge, its Cloud Armor policy, or its certificates.
// That residual attack surface is real and currently accepted, not closed
// by this change. Revisit — and prefer removing these three roles outright
// — when this SA is scoped down to only what `website` itself uses.
//
// securityAdmin is wider than Cloud Armor alone (it also grants firewall and
// SSL-policy management project-wide) — accepted because the project has
// only the unused auto-created default VPC, but it is the binding to
// revisit first if that stops being true.
//
// monitoring.editor and logging.configWriter are for `monitoring.ts`, not the
// edge — the notification channel, uptime check and alert policies added with
// it, plus the log-based metric behind the contact-form alert. Their absence
// broke every deploy from 2026-08-02 16:26 onwards: `pulumi up` 403'd on
// creating them and aborted the whole update, so the Cloud Run service stopped
// picking up new images too. Monitoring resources are only ever created, never
// read back into the app, which is why nothing else surfaced it.
for (const [name, role] of [
  ['deployer-load-balancer-admin', 'roles/compute.loadBalancerAdmin'],
  ['deployer-compute-security-admin', 'roles/compute.securityAdmin'],
  ['deployer-certificate-manager-owner', 'roles/certificatemanager.owner'],
  ['deployer-monitoring-editor', 'roles/monitoring.editor'],
  ['deployer-logging-config-writer', 'roles/logging.configWriter'],
]) {
  new gcp.projects.IAMMember(name, {
    project: projectId,
    role,
    member: pulumi.interpolate`serviceAccount:${githubActionsDeployerSa.email}`,
  });
}
