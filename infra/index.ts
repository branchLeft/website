import { service } from './cloudRun';
import { domainMappingDnsRecords } from './domainMapping';
import { repository } from './artifactRegistry';
import { workloadIdentityProvider, deployerServiceAccountEmail } from './workloadIdentity';
import { createEdge } from './edge';
import { region, artifactRegistryRepoId, projectId, domains } from './config';
import './kms';
import './monitoring';

// The shared edge load balancer. `blog.branchleft.co.uk` and, later, tenant
// outlets join this same LB as additional entries in this array — a hostname
// list plus the Cloud Run service behind them.
const edge = createEdge([
  {
    name: 'website',
    hostnames: domains,
    service,
    region,
  },
]);

export const cloudRunUrl = service.uri;
export const artifactRegistryRepositoryUrl = repository.name;

// The A-record target for every hostname on the edge. Cutting DNS to this is
// the migration's point of no easy return; see the cutover sequence.
export const edgeIpAddress = edge.ipAddress;

// `_acme-challenge.*` CNAMEs to publish at IONOS. Certificates sit in
// AUTHORIZING until these resolve, then issue in roughly five minutes.
export const certificateDnsAuthorizationRecords = edge.dnsAuthorizationRecords;

// For polling issuance and for reading Cloud Armor's preview-mode verdicts:
//   gcloud certificate-manager certificates describe <name> --project=...
//   gcloud logging read 'jsonPayload.enforcedSecurityPolicy.name="<policy>"'
export const certificateNames = edge.certificateNames;
export const securityPolicyName = edge.securityPolicyName;

// Superseded by `edgeIpAddress` above, and removed once the domain mappings
// are deleted at the end of the cutover.
export const dnsRecordsToAddAtIonos = domainMappingDnsRecords;

// Feed these into GitHub Actions repo variables/secrets (see the deploy plan).
export const githubActionsWorkloadIdentityProvider = workloadIdentityProvider;
export const githubActionsDeployerServiceAccountEmail = deployerServiceAccountEmail;
export const dockerPushTarget = `${region}-docker.pkg.dev/${projectId}/${artifactRegistryRepoId}/website`;
