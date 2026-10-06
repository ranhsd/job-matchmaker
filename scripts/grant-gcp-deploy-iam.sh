#!/usr/bin/env bash
# Grants the GitHub deployer permission to ship Cloud Run and Firebase Hosting.
# Run this as a principal that can set IAM policy and create Workload Identity pools
# on the project. The account mrkcaptcha@merkava.gov.il cannot.
#
# Cloud Run project and Firebase project are separate.
# Usage:
#   scripts/grant-gcp-deploy-iam.sh [RUN_PROJECT] [FIREBASE_PROJECT]
set -euo pipefail

GITHUB_REPO="ranhsd/job-matchmaker"
RUNTIME_SA_NAME="matchmaker-runtime"
DEPLOY_SA_NAME="github-actions"
POOL="github"
PROVIDER="github"

RUN_PROJECT="${1:-sigma-matchmaker-dev}"
FIREBASE_PROJECT="${2:-matchmaker-f1b1d}"

gcloud config set project "$RUN_PROJECT" >/dev/null

RUNTIME_SA="${RUNTIME_SA_NAME}@${RUN_PROJECT}.iam.gserviceaccount.com"
DEPLOY_SA="${DEPLOY_SA_NAME}@${RUN_PROJECT}.iam.gserviceaccount.com"

echo "Granting Cloud Run deploy roles on ${RUN_PROJECT} to ${DEPLOY_SA}"
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:${DEPLOY_SA}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet >/dev/null

for role in roles/run.admin roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding "$RUN_PROJECT" \
    --member="serviceAccount:${DEPLOY_SA}" \
    --role="$role" \
    --quiet >/dev/null
done

echo "Granting Firebase Hosting deploy on ${FIREBASE_PROJECT}"
gcloud projects add-iam-policy-binding "$FIREBASE_PROJECT" \
  --member="serviceAccount:${DEPLOY_SA}" \
  --role="roles/firebasehosting.admin" \
  --quiet >/dev/null

if ! gcloud iam workload-identity-pools describe "$POOL" --location=global >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$POOL" \
    --location=global \
    --display-name="GitHub Actions"
fi

if ! gcloud iam workload-identity-pools providers describe "$PROVIDER" \
  --location=global \
  --workload-identity-pool="$POOL" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" \
    --location=global \
    --workload-identity-pool="$POOL" \
    --display-name="GitHub" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
    --attribute-condition="assertion.repository=='${GITHUB_REPO}' && assertion.ref=='refs/heads/main'" \
    --issuer-uri="https://token.actions.githubusercontent.com"
fi

PROJECT_NUMBER="$(gcloud projects describe "$RUN_PROJECT" --format='value(projectNumber)')"
WIF="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}"

gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/attribute.repository/${GITHUB_REPO}" \
  --role="roles/iam.workloadIdentityUser" \
  --quiet >/dev/null

if command -v gh >/dev/null 2>&1; then
  printf '%s' "$DEPLOY_SA" | gh secret set GCP_SERVICE_ACCOUNT --repo "$GITHUB_REPO"
  printf '%s' "$WIF" | gh secret set GCP_WORKLOAD_IDENTITY_PROVIDER --repo "$GITHUB_REPO"
  echo "GitHub Actions secrets are set on ${GITHUB_REPO}."
else
  echo "gh is not installed. Set these GitHub Actions secrets on ${GITHUB_REPO}:"
  echo "  GCP_SERVICE_ACCOUNT=${DEPLOY_SA}"
  echo "  GCP_WORKLOAD_IDENTITY_PROVIDER=${WIF}"
fi

echo
echo "Done. Push to main to deploy."
echo "API:  Cloud Run on ${RUN_PROJECT} (me-west1)"
echo "Site: https://${FIREBASE_PROJECT}.web.app"
echo "The Gemini key stays in Secret Manager on ${RUN_PROJECT} (gemini-api-key), not in GitHub."
