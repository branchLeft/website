import * as gcp from '@pulumi/gcp';
import { artifactRegistryRepoId, region } from './config';
import { enabledApis } from './apis';

export const repository = new gcp.artifactregistry.Repository(
  'website-repo',
  {
    location: region,
    repositoryId: artifactRegistryRepoId,
    format: 'DOCKER',
    description: 'Docker images for the branchLeft website',
  },
  { dependsOn: enabledApis }
);
