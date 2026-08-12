import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { enabledApis } from './apis';

const config = new pulumi.Config();

function secretWithValue(name: string, secretId: string, value: pulumi.Output<string>) {
  const secret = new gcp.secretmanager.Secret(
    name,
    {
      secretId,
      replication: { auto: {} },
    },
    { dependsOn: enabledApis }
  );

  const version = new gcp.secretmanager.SecretVersion(`${name}-version`, {
    secret: secret.id,
    secretData: value,
  });

  return { secret, version };
}

export const contactSmtpUser = secretWithValue(
  'contact-smtp-user',
  'contact-smtp-user',
  config.requireSecret('contactSmtpUser')
);

export const contactSmtpPassword = secretWithValue(
  'contact-smtp-password',
  'contact-smtp-password',
  config.requireSecret('contactSmtpPassword')
);
