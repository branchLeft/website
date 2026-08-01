import * as gcp from '@pulumi/gcp';
import { imageUrl, region } from './config';
import { repository } from './artifactRegistry';
import { cloudRunRuntimeSa } from './serviceAccounts';
import { gmailUser, gmailAppPassword } from './secrets';

export const service = new gcp.cloudrunv2.Service(
  'website',
  {
    name: 'branchleft-website',
    location: region,
    ingress: 'INGRESS_TRAFFIC_ALL',
    // IaC-managed and expected to be replaced/updated freely; flip to true
    // once the service has been stable in production for a while.
    deletionProtection: false,
    template: {
      serviceAccount: cloudRunRuntimeSa.email,
      scaling: {
        minInstanceCount: 0,
        maxInstanceCount: 3,
      },
      containers: [
        {
          image: imageUrl,
          resources: {
            limits: {
              cpu: '1',
              memory: '512Mi',
            },
          },
          envs: [
            {
              name: 'GMAIL_USER',
              valueSource: {
                secretKeyRef: { secret: gmailUser.secret.secretId, version: 'latest' },
              },
            },
            {
              name: 'GMAIL_APP_PASSWORD',
              valueSource: {
                secretKeyRef: { secret: gmailAppPassword.secret.secretId, version: 'latest' },
              },
            },
          ],
        },
      ],
    },
  },
  { dependsOn: [repository, gmailUser.version, gmailAppPassword.version] }
);

new gcp.cloudrunv2.ServiceIamMember('website-public-invoker', {
  location: region,
  name: service.name,
  role: 'roles/run.invoker',
  member: 'allUsers',
});
