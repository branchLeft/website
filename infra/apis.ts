import * as gcp from '@pulumi/gcp';

const requiredServices = [
  'run.googleapis.com',
  'artifactregistry.googleapis.com',
  'secretmanager.googleapis.com',
  'iam.googleapis.com',
  'iamcredentials.googleapis.com',
  'cloudresourcemanager.googleapis.com',
  'cloudkms.googleapis.com',
  'monitoring.googleapis.com',
  'logging.googleapis.com',
  // The edge load balancer (edge.ts): compute for the LB, NEG, forwarding
  // rules and Cloud Armor policy; certificatemanager for the managed
  // certificates and certificate map. All three were already enabled on the
  // project before edge.ts existed, so they are declared here for
  // completeness rather than to turn anything on — but declaring them means
  // a rebuilt project provisions in one pass.
  'compute.googleapis.com',
  'certificatemanager.googleapis.com',
  // Not used yet: DNS for branchleft.co.uk is manual at IONOS. Declared
  // because moving the zone to Cloud DNS is the prerequisite for onboarding
  // a bundled subdomain with no manual DNS touch.
  'dns.googleapis.com',
];

export const enabledApis = requiredServices.map(
  (service) =>
    new gcp.projects.Service(`api-${service}`, {
      service,
      disableOnDestroy: false,
    })
);
