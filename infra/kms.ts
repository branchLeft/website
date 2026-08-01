import * as gcp from '@pulumi/gcp';
import { region } from './config';

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

// NOTE: this key's IAM bindings (cryptoKeyEncrypterDecrypter for the
// deployer SA and rob@branchleft.co.uk) are deliberately NOT managed here.
// Managing them would require granting CI roles/cloudkms.admin, letting the
// deploy pipeline rewrite who can decrypt the stack's own secrets — exactly
// the control this key exists to provide. They're also a bootstrap
// prerequisite: they must already exist for Pulumi to decrypt config and
// run at all. Same reasoning as the state bucket IAM binding; both are
// gcloud-managed and documented in KNOWN_ISSUES.md.
