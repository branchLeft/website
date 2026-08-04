import { service, serviceName } from './cloudRun';
import { repository } from './artifactRegistry';
import { workloadIdentityProvider, deployerServiceAccountEmail } from './workloadIdentity';
import { region, artifactRegistryRepoId, projectId } from './config';
import './kms';
import './monitoring';

// This stack no longer declares the edge load balancer. It moved to a
// separate private infrastructure repo — the shared LB that fronts every
// hostname branchLeft serves — via a Pulumi state move, so that a deploy of
// this repo can no longer touch a hostname it doesn't own. See that repo's
// state-move runbook for the migration and its rationale.

export const cloudRunUrl = service.uri;
export const artifactRegistryRepositoryUrl = repository.name;

// Informational only, for a human — NOT a programmatic dependency. The edge
// program deliberately holds no `StackReference` to this stack (a
// serverless NEG only needs a Cloud Run service's name and region, both
// plain strings, so taking one would add a coupling with no payoff); instead
// whoever wires this service into the edge's site roster copies these two
// values across by hand. Both are already plain `string`s, not Pulumi
// `Output`s, so `pulumi stack output` prints them immediately without
// waiting on the resource to resolve.
export const cloudRunServiceName = serviceName;
export const cloudRunRegion = region;

// Feed these into GitHub Actions repo variables/secrets (see the deploy plan).
export const githubActionsWorkloadIdentityProvider = workloadIdentityProvider;
export const githubActionsDeployerServiceAccountEmail = deployerServiceAccountEmail;
export const dockerPushTarget = `${region}-docker.pkg.dev/${projectId}/${artifactRegistryRepoId}/website`;
