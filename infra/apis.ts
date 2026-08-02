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
];

export const enabledApis = requiredServices.map(
  (service) =>
    new gcp.projects.Service(`api-${service}`, {
      service,
      disableOnDestroy: false,
    })
);
