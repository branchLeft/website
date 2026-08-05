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
  // Not consumed by anything in this program any more — the edge load
  // balancer that needed them (compute for the LB, NEG, forwarding rules and
  // Cloud Armor policy; certificatemanager for the managed certificates and
  // certificate map) has moved to a separate private infrastructure repo via
  // a Pulumi state move. Deliberately kept declared *here* regardless: that
  // repo's program explicitly does not enable these APIs itself, precisely
  // so that a post-move `pulumi preview` there shows a zero diff rather than
  // two stacks fighting over the same `gcp.projects.Service` resource. If
  // this repo's declaration is ever removed, the other repo needs its own
  // enablement resource added first, or a rebuilt project can't provision.
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
