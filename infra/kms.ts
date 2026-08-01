import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import { region } from './config';
import { githubActionsDeployerSa } from './serviceAccounts';

// Bootstrapped manually via gcloud before this program could run (Pulumi
// can't decrypt its own stack secrets to grant itself access to the key
// that decrypts them) — see KNOWN_ISSUES.md. Imported into state with
// `pulumi import`, not created fresh.
export const pulumiKeyRing = new gcp.kms.KeyRing('pulumi-keyring', {
  name: 'pulumi',
  location: region,
});

// Encrypts/decrypts the production stack's config secrets
// (gmailUser, gmailAppPassword). Key rings and keys can never be deleted in
// Cloud KMS — `pulumi destroy` would only disable this key, not remove it.
export const pulumiSecretsKey = new gcp.kms.CryptoKey(
  'pulumi-secrets-key',
  {
    name: 'pulumi-secrets',
    keyRing: pulumiKeyRing.id,
    purpose: 'ENCRYPT_DECRYPT',
  },
  { protect: true }
);

new gcp.kms.CryptoKeyIAMMember('pulumi-secrets-key-deployer-access', {
  cryptoKeyId: pulumiSecretsKey.id,
  role: 'roles/cloudkms.cryptoKeyEncrypterDecrypter',
  member: pulumi.interpolate`serviceAccount:${githubActionsDeployerSa.email}`,
});

new gcp.kms.CryptoKeyIAMMember('pulumi-secrets-key-rob-access', {
  cryptoKeyId: pulumiSecretsKey.id,
  role: 'roles/cloudkms.cryptoKeyEncrypterDecrypter',
  member: 'user:rob@branchleft.co.uk',
});
