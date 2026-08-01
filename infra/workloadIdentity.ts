import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { githubRepo } from './config';
import { githubActionsDeployerSa } from './serviceAccounts';
import { enabledApis } from './apis';

export const pool = new gcp.iam.WorkloadIdentityPool(
  'github-actions-pool',
  {
    workloadIdentityPoolId: 'github-actions',
    displayName: 'GitHub Actions',
  },
  { dependsOn: enabledApis }
);

export const provider = new gcp.iam.WorkloadIdentityPoolProvider('github-actions-provider', {
  workloadIdentityPoolId: pool.workloadIdentityPoolId,
  workloadIdentityPoolProviderId: 'github',
  displayName: 'GitHub',
  attributeMapping: {
    'google.subject': 'assertion.sub',
    'attribute.repository': 'assertion.repository',
  },
  // Restricts token exchange to this specific repo only.
  attributeCondition: `assertion.repository == "${githubRepo}"`,
  oidc: {
    issuerUri: 'https://token.actions.githubusercontent.com',
  },
});

new gcp.serviceaccount.IAMMember('github-actions-can-impersonate-deployer', {
  serviceAccountId: githubActionsDeployerSa.name,
  role: 'roles/iam.workloadIdentityUser',
  member: pulumi.interpolate`principalSet://iam.googleapis.com/${pool.name}/attribute.repository/${githubRepo}`,
});

// Consumed by the GitHub Actions `google-github-actions/auth` step.
export const workloadIdentityProvider = provider.name;
export const deployerServiceAccountEmail = githubActionsDeployerSa.email;
