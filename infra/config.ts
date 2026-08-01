import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';

const config = new pulumi.Config();
const gcpConfig = new pulumi.Config('gcp');

export const projectId = gcpConfig.require('project');
export const region = config.get('region') ?? 'europe-west2';

// Domain(s) to map to the Cloud Run service. The apex domain can't be
// verified/mapped until Search Console ownership verification (manual step)
// has completed for the Google account running `pulumi up`.
export const domains = config.getObject<string[]>('domains') ?? [
  'branchleft.co.uk',
  'www.branchleft.co.uk',
];

// Set by CI after building and pushing a new image:
//   pulumi config set imageTag <git-sha>
// Defaults to a placeholder so the very first `pulumi up` (before any image
// has ever been pushed) can still create the Cloud Run service; it will be
// immediately unhealthy until a real image is deployed on top of it.
export const imageTag = config.get('imageTag') ?? 'placeholder';

export const artifactRegistryRepoId = 'branchleft-website';

export const imageUrl = pulumi.interpolate`${region}-docker.pkg.dev/${projectId}/${artifactRegistryRepoId}/website:${imageTag}`;

// The GitHub repo allowed to assume the deployer service account via
// Workload Identity Federation, as "owner/repo".
export const githubRepo = config.require('githubRepo');

export const project = pulumi.output(gcp.organizations.getProject({ projectId }));
