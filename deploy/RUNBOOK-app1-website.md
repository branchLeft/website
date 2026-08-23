# Runbook — the website stack on `app1`

Bootstrapping `deploy/compose.yml` onto `app1` so CI's digest deploys
(`.github/workflows/ci.yml`'s `deploy` job) have something to restart, and
rotating the CI deploy key that lets it do so.

`app1` is `167.233.93.244` (private `10.20.1.100`), provisioned by
`branchLeft/ghost-platform`'s hosts stack per
`ghost-platform-docs/14-hetzner-migration-programme.md` §3.4's stack-homing
decision — this repo owns the container definition, not the host. Every
`ssh`/`rsync` below that targets `root@` uses the platform owner's key,
`~/.ssh/id_ed25519_hetzner`, the same one every other Hetzner runbook in this
estate uses. Run every command from the root of a `branchLeft/website`
checkout.

## What has to be true first

`shared-infra/hetzner/RUNBOOK-provision-host.md` must have been run against
`app1`: Docker, `branchleft-compose@.service` and
`/usr/local/sbin/branchleft-deploy` installed, plus the `deploy` account and
its CI keypair from `shared-infra/hetzner-host/cloudInit.ts`. Confirm:

```bash
ssh -i ~/.ssh/id_ed25519_hetzner root@167.233.93.244 '
  systemctl is-active docker &&
  test -x /usr/local/sbin/branchleft-deploy &&
  systemctl cat branchleft-compose@.service >/dev/null &&
  echo provisioned'
```

Expect `active` then `provisioned`. This runbook does not provision the host
itself — that is `ghost-platform`'s job, run once ahead of every service that
lands on `app1`.

## 1. Write the stack's secret on the host

`/etc/branchleft/website.env` is the file `branchleft-compose@website` loads
for stack secrets, and nothing automated ever writes it — the CI deploy
account's one sudo-permitted command writes
`/etc/branchleft/website.image.env` and only that. It needs the four contact
form SMTP values (`website/CLAUDE.md`'s "Contact form" section):

```bash
ssh -i ~/.ssh/id_ed25519_hetzner root@167.233.93.244 '
  install -d -m 0755 -o root -g root /etc/branchleft &&
  umask 077 &&
  { printf "CONTACT_SMTP_HOST=%s\n" "<SMTP_HOST>";
    printf "CONTACT_SMTP_PORT=%s\n" "<SMTP_PORT>";
    printf "CONTACT_SMTP_USER=%s\n" "<SMTP_USER>";
    printf "CONTACT_SMTP_PASSWORD=%s\n" "<SMTP_PASSWORD>"; } > /etc/branchleft/website.env &&
  chmod 0600 /etc/branchleft/website.env &&
  ls -l /etc/branchleft/website.env'
```

Expect `-rw------- 1 root root`. The credential is the dedicated,
send-as-only submission account already in use on GCP — rotate it on the
mail host only if it needs to change, never here.

## 2. Copy the stack directory onto the host

Provisioning creates `/opt/branchleft` itself but no per-service directory
under it — the edge and monitoring stacks get theirs from a directory-tree
`rsync`, which creates its own destination; this stack's `rsync` copies one
file into a directory that has to already exist:

```bash
ssh -i ~/.ssh/id_ed25519_hetzner root@167.233.93.244 \
  'install -d -m 0755 -o root -g root /opt/branchleft/website'

rsync -av -e 'ssh -i ~/.ssh/id_ed25519_hetzner' \
  deploy/compose.yml root@167.233.93.244:/opt/branchleft/website/compose.yml
```

Not `--delete`, and not the whole `deploy/` directory: `RUNBOOK-app1-website.md`
itself must never land on the host, and this stack has no per-posture generated
files the way the edge stack does — one file, copied whole.

## 3. Enable the unit

```bash
ssh -i ~/.ssh/id_ed25519_hetzner root@167.233.93.244 \
  'systemctl enable branchleft-compose@website'
```

## 4. First deploy

CI's `deploy` job (push to `main`) does this from here on. For the very
first run, or to confirm the account works before trusting CI with it:

```bash
ssh -i ~/.ssh/id_ed25519_hetzner deploy@167.233.93.244 \
  'sudo -n /usr/local/sbin/branchleft-deploy website ghcr.io/branchleft/website@<DIGEST>'
```

Expect `branchleft-deploy: website now pinned to ghcr.io/branchleft/website@<DIGEST>`.
`ghcr.io/branchleft/website` must be a **public** package before this
succeeds — `docker compose pull` runs as root with no registry credential on
this host, the same posture every other estate host takes. First push only:
<https://github.com/orgs/branchLeft/packages/container/website/settings>,
"Change package visibility", choose Public, confirm. This is a
platform-owner action; there is no reviewed path to it.

## 5. Verify

```bash
ssh -i ~/.ssh/id_ed25519_hetzner root@167.233.93.244 '
  docker ps --filter label=com.docker.compose.project=website &&
  curl -fsS --max-time 10 http://10.20.1.100:8080/ -o /dev/null && echo app-ok &&
  curl -fsS --max-time 10 http://10.20.1.100:9092/metrics'
```

Expect two containers `Up`, `app-ok`, and a `branchleft_website_contact_form_send_failures_total`
line reading `0` on a freshly deployed stack.

## Rotating the CI deploy key

Identical procedure to `shared-infra/hetzner/RUNBOOK-provision-host.md`
"Rotating the deploy key" — that key is per-host, shared by every service CI
deploys to a given host, not per-repository. Generate, append, prove, replace
the `HETZNER_APP1_DEPLOY_SSH_KEY` secret on **every** repository that deploys
to `app1`, then remove the old line. `app1` has one deployer today
(`branchLeft/website`); update this list as more land.
