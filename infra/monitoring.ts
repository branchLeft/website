import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { enabledApis } from './apis';
import { service } from './cloudRun';
import { projectId } from './config';

// Where alert notifications are sent. There is no dedicated ops/alerts
// mailbox configured anywhere in this program or in CLAUDE.md, so this uses
// contact@branchleft.co.uk — the org's public contact address, already used
// as the disclosed contact point on /privacy and /terms.
const alertEmailAddress = 'contact@branchleft.co.uk';

export const alertEmailChannel = new gcp.monitoring.NotificationChannel(
  'alert-email',
  {
    displayName: 'branchLeft website alerts (email)',
    type: 'email',
    labels: { email_address: alertEmailAddress },
  },
  { dependsOn: enabledApis }
);

// --- Uptime check on the public homepage -------------------------------

export const uptimeCheck = new gcp.monitoring.UptimeCheckConfig(
  'website-uptime',
  {
    displayName: 'branchleft.co.uk homepage',
    timeout: '10s',
    period: '300s',
    httpCheck: {
      path: '/',
      port: 443,
      useSsl: true,
      validateSsl: true,
    },
    monitoredResource: {
      type: 'uptime_url',
      labels: {
        project_id: projectId,
        host: 'branchleft.co.uk',
      },
    },
  },
  { dependsOn: enabledApis }
);

export const uptimeAlertPolicy = new gcp.monitoring.AlertPolicy(
  'website-uptime-alert',
  {
    displayName: 'branchleft.co.uk is down',
    combiner: 'OR',
    conditions: [
      {
        displayName: 'Uptime check failing',
        conditionThreshold: {
          filter: pulumi.interpolate`metric.type="monitoring.googleapis.com/uptime_check/check_passed" resource.type="uptime_url" metric.label."check_id"="${uptimeCheck.uptimeCheckId}"`,
          comparison: 'COMPARISON_LT',
          thresholdValue: 1,
          duration: '60s',
          aggregations: [
            {
              alignmentPeriod: '1200s',
              perSeriesAligner: 'ALIGN_NEXT_OLDER',
              crossSeriesReducer: 'REDUCE_COUNT_FALSE',
              groupByFields: ['resource.label.host'],
            },
          ],
        },
      },
    ],
    notificationChannels: [alertEmailChannel.id],
    alertStrategy: { autoClose: '1800s' },
  },
  { dependsOn: enabledApis }
);

// --- Cloud Run 5xx rate --------------------------------------------------

export const cloudRun5xxAlertPolicy = new gcp.monitoring.AlertPolicy(
  'website-5xx-alert',
  {
    displayName: 'branchleft-website 5xx error rate',
    combiner: 'OR',
    conditions: [
      {
        displayName: 'Cloud Run 5xx responses',
        conditionThreshold: {
          filter: pulumi.interpolate`metric.type="run.googleapis.com/request_count" resource.type="cloud_run_revision" resource.label."service_name"="${service.name}" metric.label."response_code_class"="5xx"`,
          comparison: 'COMPARISON_GT',
          thresholdValue: 5,
          duration: '300s',
          aggregations: [
            {
              alignmentPeriod: '300s',
              perSeriesAligner: 'ALIGN_RATE',
              crossSeriesReducer: 'REDUCE_SUM',
            },
          ],
        },
      },
    ],
    notificationChannels: [alertEmailChannel.id],
    alertStrategy: { autoClose: '1800s' },
  },
  { dependsOn: enabledApis }
);

// --- Contact form email failures ----------------------------------------
//
// app/routes/contact.tsx does `console.error('Failed to send contact form
// email:', error)` when sendContactEmail throws — that line lands in Cloud
// Logging as a plain stderr entry and, until now, nobody was watching it.
// This turns it into a log-based metric with an alert on any occurrence.

export const contactFormFailureMetric = new gcp.logging.Metric(
  'contact-form-email-failures',
  {
    name: 'contact-form-email-failures',
    description:
      'Count of "Failed to send contact form email" log lines from the Cloud Run service (app/routes/contact.tsx).',
    filter: pulumi.interpolate`resource.type="cloud_run_revision" AND resource.labels.service_name="${service.name}" AND textPayload:"Failed to send contact form email"`,
    metricDescriptor: {
      metricKind: 'DELTA',
      valueType: 'INT64',
      unit: '1',
      displayName: 'Contact form email failures',
    },
  },
  { dependsOn: enabledApis }
);

export const contactFormFailureAlertPolicy = new gcp.monitoring.AlertPolicy(
  'contact-form-failure-alert',
  {
    displayName: 'Contact form email sending is failing',
    combiner: 'OR',
    conditions: [
      {
        displayName: 'Contact form email failure logged',
        conditionThreshold: {
          filter: pulumi.interpolate`metric.type="logging.googleapis.com/user/${contactFormFailureMetric.name}" resource.type="cloud_run_revision"`,
          comparison: 'COMPARISON_GT',
          thresholdValue: 0,
          duration: '0s',
          aggregations: [
            {
              alignmentPeriod: '60s',
              perSeriesAligner: 'ALIGN_SUM',
              crossSeriesReducer: 'REDUCE_SUM',
            },
          ],
        },
      },
    ],
    notificationChannels: [alertEmailChannel.id],
    alertStrategy: { autoClose: '1800s' },
  },
  { dependsOn: enabledApis }
);
