import { service } from './cloudRun';
import { domainMappingDnsRecords } from './domainMapping';
import { repository } from './artifactRegistry';
import { workloadIdentityProvider, deployerServiceAccountEmail } from './workloadIdentity';
import { region, artifactRegistryRepoId, projectId } from './config';
import './kms';

export const cloudRunUrl = service.uri;
export const dnsRecordsToAddAtIonos = domainMappingDnsRecords;
export const artifactRegistryRepositoryUrl = repository.name;

// Feed these into GitHub Actions repo variables/secrets (see the deploy plan).
export const githubActionsWorkloadIdentityProvider = workloadIdentityProvider;
export const githubActionsDeployerServiceAccountEmail = deployerServiceAccountEmail;
export const dockerPushTarget = `${region}-docker.pkg.dev/${projectId}/${artifactRegistryRepoId}/website`;
