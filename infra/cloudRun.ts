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
    // Service has been stable in production since 2026-08-01; no longer a
    // freely-replaceable bootstrap resource.
    deletionProtection: true,
    template: {
      serviceAccount: cloudRunRuntimeSa.email,
      scaling: {
        // >0 avoids a full cold start for every visitor after an idle
        // period, at the cost of a few pounds/month for the always-on
        // instance.
        minInstanceCount: 1,
        maxInstanceCount: 3,
      },
      containers: [
        {
          image: imageUrl,
          ports: {
            // react-router-serve reads $PORT, which Cloud Run sets to this
            // value; declared explicitly so the probes below have an
            // unambiguous default port to target.
            containerPort: 8080,
          },
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
          // Gates traffic promotion: a revision that never becomes healthy
          // fails here instead of serving requests. All other probes are
          // suspended until this one succeeds, so the generous failure
          // budget (60s) only affects cold start, not steady-state
          // detection.
          startupProbe: {
            httpGet: {
              path: '/',
            },
            periodSeconds: 10,
            timeoutSeconds: 5,
            failureThreshold: 6,
          },
          // Restarts a container that has gone unhealthy after startup
          // (e.g. wedged event loop) rather than leaving it serving
          // errors indefinitely.
          livenessProbe: {
            httpGet: {
              path: '/',
            },
            periodSeconds: 30,
            timeoutSeconds: 5,
            failureThreshold: 3,
          },
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
