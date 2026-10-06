#!/usr/bin/env bash
# One-time setup for the GitHub Actions deploy.
# Cloud Run, Artifact Registry, the Gemini secret, and Firebase Hosting
# all use the same project.
#
# Usage, from the repo root, after `gcloud auth login`:
#   scripts/setup-gcp-deploy.sh [PROJECT]
set -euo pipefail

EXPECTED_ACCOUNT="mrkcaptcha@merkava.gov.il"
GITHUB_REPO="ranhsd/job-matchmaker"
REGION="me-west1"
AR_REPO="matchmaker"
SECRET_NAME="gemini-api-key"
RUNTIME_SA_NAME="matchmaker-runtime"
DEPLOY_SA_NAME="github-actions"
POOL="github"
PROVIDER="github"

cd "$(dirname "$0")/.."

RUN_PROJECT="${1:-sigma-matchmaker-dev}"
FIREBASE_PROJECT="${2:-$RUN_PROJECT}"
PROJECT_ID="$RUN_PROJECT"

active="$(gcloud auth list --filter=status:ACTIVE --format='value(account)')"
if [[ "$active" != "$EXPECTED_ACCOUNT" ]]; then
  echo "Active gcloud account is ${active:-none}." >&2
  echo "Run: gcloud auth login ${EXPECTED_ACCOUNT}" >&2
  exit 1
fi

gcloud config set project "$PROJECT_ID" >/dev/null

echo "Enabling APIs on ${PROJECT_ID}"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  sts.googleapis.com \
  serviceusage.googleapis.com

echo "Checking Firebase project ${FIREBASE_PROJECT}"
token="$(gcloud auth print-access-token)"
firebase_status="$(curl -s -o /dev/null -w '%{http_code}' \
  -H "Authorization: Bearer ${token}" \
  -H "x-goog-user-project: ${FIREBASE_PROJECT}" \
  "https://firebase.googleapis.com/v1beta1/projects/${FIREBASE_PROJECT}")"
unset token
if [[ "$firebase_status" != "200" ]]; then
  echo "Firebase project ${FIREBASE_PROJECT} is not available to this account (HTTP ${firebase_status})." >&2
  exit 1
fi

if gcloud artifacts repositories describe "$AR_REPO" --location="$REGION" >/dev/null 2>&1; then
  echo "Artifact Registry repository ${AR_REPO} already exists"
else
  gcloud artifacts repositories create "$AR_REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Matchmaker API images"
fi

create_sa() {
  local name="$1"
  local display="$2"
  local email="${name}@${PROJECT_ID}.iam.gserviceaccount.com"
  if gcloud iam service-accounts describe "$email" >/dev/null 2>&1; then
    echo "Service account ${email} already exists"
  else
    gcloud iam service-accounts create "$name" --display-name="$display"
  fi
}

create_sa "$RUNTIME_SA_NAME" "Matchmaker API runtime"
create_sa "$DEPLOY_SA_NAME" "GitHub Actions deployer"

RUNTIME_SA="${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
DEPLOY_SA="${DEPLOY_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if gcloud secrets describe "$SECRET_NAME" >/dev/null 2>&1; then
  echo "Secret ${SECRET_NAME} already exists"
elif [[ -f apps/api/.env ]]; then
  key="$(sed -n 's/^GOOGLE_GENERATIVE_AI_API_KEY=//p' apps/api/.env | head -1 | tr -d '\r' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
  if [[ -z "$key" ]]; then
    echo "GOOGLE_GENERATIVE_AI_API_KEY is empty in apps/api/.env" >&2
    exit 1
  fi
  printf '%s' "$key" | gcloud secrets create "$SECRET_NAME" --replication-policy=automatic --data-file=-
  unset key
  echo "Created secret ${SECRET_NAME} from apps/api/.env"
else
  echo "apps/api/.env was not found, so the Gemini secret was not created." >&2
  echo "Create it before the first deploy, without echoing the key:" >&2
  echo "  gcloud secrets create ${SECRET_NAME} --replication-policy=automatic --data-file=-" >&2
  exit 1
fi

bind_secret() {
  local member="$1"
  gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
    --member="$member" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet >/dev/null
}

bind_secret "serviceAccount:${RUNTIME_SA}"
bind_secret "serviceAccount:${DEPLOY_SA}"

if ! scripts/grant-gcp-deploy-iam.sh "$RUN_PROJECT" "$FIREBASE_PROJECT"; then
  echo >&2
  echo "The API resources exist on ${RUN_PROJECT}, and the site is ${FIREBASE_PROJECT}." >&2
  echo "${active} cannot grant IAM or create a Workload Identity pool." >&2
  echo "Ask a project IAM admin to run:" >&2
  echo "  scripts/grant-gcp-deploy-iam.sh ${RUN_PROJECT} ${FIREBASE_PROJECT}" >&2
  exit 1
fi
