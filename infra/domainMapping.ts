import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { domains, projectId, region } from './config';
import { service } from './cloudRun';

// Requires the domain to already be verified for the Google account running
// `pulumi up`, via Search Console (see the deploy plan's manual steps) —
// Cloud Run rejects domain mappings for unverified domains.
export const domainMappings = domains.map(
  (domain) =>
    new gcp.cloudrun.DomainMapping(`domain-${domain}`, {
      location: region,
      name: domain,
      metadata: { namespace: projectId },
      spec: { routeName: service.name },
    })
);

// DNS records to create at IONOS — printed as a stack output since Cloud Run
// only returns them once the mapping resource is created.
export const domainMappingDnsRecords = pulumi
  .all(domainMappings.map((m) => m.statuses))
  .apply((allStatuses) =>
    allStatuses.map((statuses, i) => ({
      domain: domains[i],
      records: statuses[0]?.resourceRecords ?? [],
    }))
  );
