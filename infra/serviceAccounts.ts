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
