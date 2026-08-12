import * as gcp from '@pulumi/gcp';
import { contactSmtpHost, contactSmtpPort, imageUrl, region } from './config';
import { repository } from './artifactRegistry';
import { cloudRunRuntimeSa } from './serviceAccounts';
import { contactSmtpUser, contactSmtpPassword } from './secrets';

// Plain string, not a `pulumi.Output`, so it can be exported and hand-copied
// into another program's config without that program taking a dependency on
// this stack. See the comment on the exports in `index.ts`.
export const serviceName = 'branchleft-website';

export const service = new gcp.cloudrunv2.Service(
  'website',
  {
    name: serviceName,
    location: region,
    // Only the edge load balancer — declared in a separate private
    // infrastructure repo, which routes to this service by plain-string name
    // and region (see the exports at the bottom of `index.ts`) — can reach
    // this service. Without this, both `run.app` hostnames stay publicly
    // reachable and bypass the load balancer, Cloud Armor and the TLS
    // configuration entirely — the WAF would be decorative. This is the
    // single easiest step to omit and the one that invalidates the whole
    // edge layer. DO NOT relax this to `INGRESS_TRAFFIC_ALL`; see below.
    //
    // Applied by `gcloud run services update --ingress` at 03:23Z on
    // 2026-08-03, once DNS had fully cut over to the LB and a full TTL had
    // elapsed; this declaration brings the program back in line with reality.
    // Setting it any earlier would have taken the site down, because Cloud Run
    // Domain Mapping requires INGRESS_TRAFFIC_ALL.
    //
    // Reverting this to INGRESS_TRAFFIC_ALL does not break the site — traffic
    // arrives via the LB either way — it silently re-opens the bypass. Verify
    // with both hostnames, which return 404 (not 403) when correctly blocked:
    //   branchleft-website-915502481546.europe-west1.run.app
    //   branchleft-website-syoeiqz6mq-ew.a.run.app
    ingress: 'INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER',
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
              name: 'CONTACT_SMTP_HOST',
              value: contactSmtpHost,
            },
            {
              name: 'CONTACT_SMTP_PORT',
              value: contactSmtpPort,
            },
            {
              name: 'CONTACT_SMTP_USER',
              valueSource: {
                secretKeyRef: { secret: contactSmtpUser.secret.secretId, version: 'latest' },
              },
            },
            {
              name: 'CONTACT_SMTP_PASSWORD',
              valueSource: {
                secretKeyRef: { secret: contactSmtpPassword.secret.secretId, version: 'latest' },
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
  { dependsOn: [repository, contactSmtpUser.version, contactSmtpPassword.version] }
);

new gcp.cloudrunv2.ServiceIamMember('website-public-invoker', {
  location: region,
  name: service.name,
  role: 'roles/run.invoker',
  member: 'allUsers',
});
