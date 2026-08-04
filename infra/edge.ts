import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { enabledApis } from './apis';

/**
 * The shared Global External Application Load Balancer that fronts every
 * Cloud Run service branchLeft serves on the public internet.
 *
 * This is deliberately *not* website-specific. Cloud Armor has no attachment
 * point on a Cloud Run service reached via Cloud Run Domain Mapping — it
 * attaches to an LB backend service — so every service that needs WAF or rate
 * limiting has to sit behind this LB. One LB with host-based routing serves
 * all of them, which is what keeps the cost flat (the forwarding rule and the
 * security policy are fixed charges, not per-service ones).
 *
 * Adding a service is one more entry in the array passed to `createEdge`: a
 * hostname list and the Cloud Run service to route it to. Everything else —
 * NEG, backend service, certificate, certificate-map entry, URL-map host rule
 * — is derived from that.
 */
export interface EdgeSite {
  /** Prefix for this site's Pulumi resource names and GCP resource names. */
  name: string;
  /** Every hostname routed to `service`. Each gets a certificate-map entry. */
  hostnames: string[];
  /** The Cloud Run service to route to. */
  service: gcp.cloudrunv2.Service;
  /** Region the Cloud Run service lives in — the serverless NEG must match. */
  region: pulumi.Input<string>;
}

/** A host-level redirect, e.g. `www.example.com` → `example.com`. */
export interface HostRedirect {
  /** The hostname that should redirect rather than serve content. */
  from: string;
  /** The hostname to redirect to. */
  to: string;
}

/** The DNS records a domain owner must publish before a certificate can issue. */
export interface DnsAuthorizationRecord {
  hostname: string;
  recordName: pulumi.Output<string>;
  recordType: pulumi.Output<string>;
  recordData: pulumi.Output<string>;
}

export interface Edge {
  /** The LB's global anycast IP — the A-record target for every hostname. */
  ipAddress: pulumi.Output<string>;
  /** `_acme-challenge.*` CNAMEs to publish before the certificate can issue. */
  dnsAuthorizationRecords: DnsAuthorizationRecord[];
  /** Certificate Manager resource names, for polling issuance after the apply. */
  certificateNames: pulumi.Output<string[]>;
  /** Cloud Armor policy name, for reading preview-mode verdicts from logs. */
  securityPolicyName: pulumi.Output<string>;
}

/**
 * Requests per IP per minute before the rate-limit rule fires.
 *
 * Provisional. The rule ships in preview mode (see `preview: true` below), so
 * this threshold currently only decides what gets *logged* as over-limit, not
 * what gets throttled. Tune it against real traffic before promoting the rule
 * to enforcing.
 *
 * Raised from 100 to 200 on 2026-08-04 after reviewing the first ~23h of real
 * edge traffic: crawl-66-249-74-36.googlebot.com peaked at 92 requests in a
 * single 60s window — 92% of the old limit — while every other observed IP
 * stayed at or below 67. 100 was one crawl burst away from a 429 against
 * Google's own crawler on a site that just shipped dedicated SEO work
 * (sitemap, robots.txt, OG tags). 200 keeps roughly 2x headroom over the
 * worst legitimate burst seen so far.
 */
const RATE_LIMIT_REQUESTS = 200;
const RATE_LIMIT_INTERVAL_SEC = 60;

/**
 * OWASP preconfigured WAF expressions, at the lowest sensitivity.
 *
 * Sensitivity 1 is the least false-positive-prone level Google publishes, and
 * these ship in preview mode regardless — a marketing site has essentially no
 * SQL or shell surface, so anything these match is worth reading before it is
 * worth blocking.
 */
const OWASP_RULESETS = ['sqli-v33-stable', 'xss-v33-stable', 'rce-v33-stable', 'lfi-v33-stable'];

const ALL_SOURCE_IPS = {
  versionedExpr: 'SRC_IPS_V1',
  config: { srcIpRanges: ['*'] },
};

export function createEdge(sites: EdgeSite[], hostRedirects: HostRedirect[] = []): Edge {
  // Anycast IPv4 the A records point at. Reserved rather than ephemeral so a
  // rebuild of the forwarding rule doesn't change the address and silently
  // break DNS that already points here.
  const ip = new gcp.compute.GlobalAddress(
    'edge-ip',
    {
      name: 'branchleft-edge-ip',
      addressType: 'EXTERNAL',
      ipVersion: 'IPV4',
    },
    { dependsOn: enabledApis }
  );

  // One shared policy across all sites. Per-site policies would be $5/month
  // each and scale badly; host-scoped *rules* within one policy do not.
  //
  // Every rule below is `preview: true`: it is evaluated and logged but never
  // acted on. This is a live site with real visitors and no traffic baseline
  // yet, so the thresholds are guesses until the logs say otherwise. Promoting
  // a rule to enforcing is flipping this one field.
  const securityPolicy = new gcp.compute.SecurityPolicy(
    'edge-armor',
    {
      name: 'branchleft-edge-armor',
      description: 'Shared Cloud Armor policy for the branchLeft edge load balancer',
      type: 'CLOUD_ARMOR',
      // Cloud Armor evaluates rules in priority order (lowest number first)
      // and stops at the first *match* — not the first rule that takes
      // action. The rate-limit rule's match condition is `srcIpRanges: ['*']`,
      // which is unconditionally true for every request, so it must sit
      // *after* the WAF rules below. Getting this backwards (as an earlier
      // version of this file did) makes the WAF rules permanently
      // unreachable: the catch-all rate limiter always wins the match first,
      // regardless of preview/enforce mode, and 23h of real traffic logs
      // showed exactly that — zero recorded hits against any WAF rule.
      rules: [
        ...OWASP_RULESETS.map((ruleset, i) => ({
          action: 'deny(403)',
          priority: 1000 + i,
          description: `OWASP preconfigured: ${ruleset} (sensitivity 1)`,
          match: {
            expr: {
              expression: `evaluatePreconfiguredWaf('${ruleset}', {'sensitivity': 1})`,
            },
          },
          preview: true,
        })),
        {
          action: 'throttle',
          priority: 2000,
          description: `Per-IP rate limit: ${RATE_LIMIT_REQUESTS} requests / ${RATE_LIMIT_INTERVAL_SEC}s`,
          match: ALL_SOURCE_IPS,
          rateLimitOptions: {
            conformAction: 'allow',
            exceedAction: 'deny(429)',
            // Keyed on client IP, never on Host. Keying on Host pools all of a
            // site's traffic into one bucket, so a legitimate traffic spike
            // throttles real readers — the opposite of what this is for. Note
            // an HTTP-HEADER key also silently degrades to a single global
            // bucket when the named header is absent.
            enforceOnKey: 'IP',
            rateLimitThreshold: {
              count: RATE_LIMIT_REQUESTS,
              intervalSec: RATE_LIMIT_INTERVAL_SEC,
            },
          },
          preview: true,
        },
        {
          action: 'allow',
          priority: 2147483647,
          description: 'Default: allow',
          match: ALL_SOURCE_IPS,
        },
      ],
    },
    { dependsOn: enabledApis }
  );

  const dnsAuthorizationRecords: DnsAuthorizationRecord[] = [];
  const certificateNames: Array<pulumi.Output<string>> = [];
  const hostRules: gcp.types.input.compute.URLMapHostRule[] = [];
  const pathMatchers: gcp.types.input.compute.URLMapPathMatcher[] = [];
  let defaultService: pulumi.Output<string> | undefined;

  // A hostname can only appear in one URL-map host rule, so a redirect
  // source (e.g. www.example.com) must be excluded from the serving host
  // rule below — its own dedicated redirect host rule is added further
  // down, after the sites loop. The certificate-issuance loop is
  // unaffected: the redirect source still needs its own managed
  // certificate so the TLS/SNI handshake succeeds before the URL map's
  // host rule is ever consulted to redirect it.
  const redirectFromHosts = new Set(hostRedirects.map((r) => r.from));

  // Created once, outside the loop, so every site's certificate map entry
  // points at the same map and the same target proxy serves all of them.
  const certificateMap = new gcp.certificatemanager.CertificateMap(
    'edge-cert-map',
    {
      name: 'branchleft-edge-certs',
      description: 'Certificate map for the branchLeft edge load balancer',
    },
    { dependsOn: enabledApis }
  );

  for (const site of sites) {
    // Serverless NEG — the only backend type that can point at Cloud Run.
    // Must be in the same region as the service it targets.
    const neg = new gcp.compute.RegionNetworkEndpointGroup(
      `${site.name}-neg`,
      {
        name: `${site.name}-neg`,
        region: site.region,
        networkEndpointType: 'SERVERLESS',
        cloudRun: { service: site.service.name },
      },
      { dependsOn: enabledApis }
    );

    const backendService = new gcp.compute.BackendService(`${site.name}-backend`, {
      name: `${site.name}-backend`,
      loadBalancingScheme: 'EXTERNAL_MANAGED',
      protocol: 'HTTPS',
      // Cloud Armor's only attachment point. This field is the entire reason
      // the LB exists.
      securityPolicy: securityPolicy.id,
      backends: [{ group: neg.id }],
      // Required to see Cloud Armor's preview-mode verdicts at all — the
      // verdicts are emitted on the load balancer's request logs, so a
      // backend service with logging off makes preview mode unobservable.
      // Full sampling: current traffic is low enough that the log volume is
      // immaterial and a sampled log is a poor basis for tuning a threshold.
      logConfig: { enable: true, sampleRate: 1.0 },
      // Cloud CDN attaches here when doc 07's Tier 3/4 caching question is
      // settled. Off until then so caching behaviour isn't a surprise.
      enableCdn: false,
    });
    // Serverless NEG backends take no health check — Cloud Run handles that.

    defaultService = defaultService ?? backendService.id;

    const servingHosts = site.hostnames.filter((h) => !redirectFromHosts.has(h));
    const pathMatcherName = `${site.name}-paths`;
    hostRules.push({ hosts: servingHosts, pathMatcher: pathMatcherName });
    pathMatchers.push({ name: pathMatcherName, defaultService: backendService.id });

    for (const hostname of site.hostnames) {
      // Slug for Pulumi/GCP resource names: dots aren't valid in either.
      const slug = hostname.replaceAll('.', '-');

      // Issuance is gated entirely on this record resolving — not on Search
      // Console verification, which is neither the mechanism nor sufficient.
      // The record can be published before or after this resource exists; the
      // certificate simply sits in AUTHORIZING until it resolves.
      const authorization = new gcp.certificatemanager.DnsAuthorization(`dns-auth-${slug}`, {
        name: `dns-auth-${slug}`,
        domain: hostname,
        description: `DNS authorization for ${hostname}`,
      });

      dnsAuthorizationRecords.push({
        hostname,
        recordName: authorization.dnsResourceRecords.apply((r) => r[0]?.name ?? ''),
        recordType: authorization.dnsResourceRecords.apply((r) => r[0]?.type ?? ''),
        recordData: authorization.dnsResourceRecords.apply((r) => r[0]?.data ?? ''),
      });

      // One certificate per hostname rather than one multi-domain
      // certificate: a hostname whose DNS authorization hasn't resolved yet
      // then can't hold up issuance for hostnames whose has. That matters
      // during onboarding, when a new site's DNS is the slow part.
      const certificate = new gcp.certificatemanager.Certificate(`cert-${slug}`, {
        name: `cert-${slug}`,
        description: `Managed certificate for ${hostname}`,
        managed: {
          domains: [hostname],
          dnsAuthorizations: [authorization.id],
        },
      });

      certificateNames.push(certificate.name);

      new gcp.certificatemanager.CertificateMapEntry(`cert-entry-${slug}`, {
        name: `cert-entry-${slug}`,
        map: certificateMap.name,
        hostname,
        certificates: [certificate.id],
      });
    }
  }

  if (defaultService === undefined) {
    throw new Error('createEdge requires at least one site');
  }

  // Canonical-domain redirects (e.g. www → apex), each on its own host rule
  // pointing at a pathMatcher whose only job is a 301. `stripQuery: false`
  // and no `pathRedirect` — this is a bare host swap, every path and query
  // string carries through unchanged.
  for (const redirect of hostRedirects) {
    const slug = redirect.from.replaceAll('.', '-');
    const pathMatcherName = `redirect-${slug}-paths`;
    hostRules.push({ hosts: [redirect.from], pathMatcher: pathMatcherName });
    pathMatchers.push({
      name: pathMatcherName,
      defaultUrlRedirect: {
        hostRedirect: redirect.to,
        httpsRedirect: true,
        redirectResponseCode: 'MOVED_PERMANENTLY_DEFAULT',
        stripQuery: false,
      },
    });
  }

  const urlMap = new gcp.compute.URLMap('edge-url-map', {
    name: 'branchleft-edge',
    // Only reachable by a request whose Host matches no rule above. Since the
    // certificate map has an entry per known hostname and no PRIMARY
    // fallback, an unknown hostname fails the TLS handshake before a URL map
    // is ever consulted — so in practice this is unreachable. It points at
    // the first site rather than erroring because the field is required.
    defaultService,
    hostRules,
    pathMatchers,
  });

  // A certificate map rather than direct certificate references: a target
  // proxy accepts at most 100 direct Certificate Manager references (15 for
  // classic Compute Engine SSL certs), which caps out below the tenant count
  // this LB is meant to reach. A map supports thousands of entries.
  const httpsProxy = new gcp.compute.TargetHttpsProxy('edge-https-proxy', {
    name: 'branchleft-edge-https',
    urlMap: urlMap.id,
    certificateMap: pulumi.interpolate`//certificatemanager.googleapis.com/${certificateMap.id}`,
  });

  new gcp.compute.GlobalForwardingRule('edge-https-rule', {
    name: 'branchleft-edge-https',
    loadBalancingScheme: 'EXTERNAL_MANAGED',
    target: httpsProxy.id,
    ipAddress: ip.selfLink,
    portRange: '443',
  });

  // Cloud Run Domain Mapping redirects http:// to https:// for free; the LB
  // does not, so without this pair every plain-HTTP request would hang after
  // the cutover. Both forwarding rules fall inside the flat first-five-rules
  // charge, so this costs nothing extra.
  const redirectUrlMap = new gcp.compute.URLMap('edge-http-redirect', {
    name: 'branchleft-edge-http-redirect',
    defaultUrlRedirect: {
      httpsRedirect: true,
      redirectResponseCode: 'MOVED_PERMANENTLY_DEFAULT',
      stripQuery: false,
    },
  });

  const httpProxy = new gcp.compute.TargetHttpProxy('edge-http-proxy', {
    name: 'branchleft-edge-http',
    urlMap: redirectUrlMap.id,
  });

  new gcp.compute.GlobalForwardingRule('edge-http-rule', {
    name: 'branchleft-edge-http',
    loadBalancingScheme: 'EXTERNAL_MANAGED',
    target: httpProxy.id,
    ipAddress: ip.selfLink,
    portRange: '80',
  });

  return {
    ipAddress: ip.address,
    dnsAuthorizationRecords,
    certificateNames: pulumi.all(certificateNames),
    securityPolicyName: securityPolicy.name,
  };
}
