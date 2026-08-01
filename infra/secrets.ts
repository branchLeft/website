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

export const gmailUser = secretWithValue(
  'gmail-user',
  'gmail-user',
  config.requireSecret('gmailUser')
);

export const gmailAppPassword = secretWithValue(
  'gmail-app-password',
  'gmail-app-password',
  config.requireSecret('gmailAppPassword')
);
