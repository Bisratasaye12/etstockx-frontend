#!/usr/bin/env bash
# Seeds verified broker accounts via the EtStockX API + optional Postgres IAM display name.
#
# Prerequisites:
#   - API reachable (default http://localhost:5163/api/v1)
#   - Postgres reachable if you use email confirmation / full_name update (default PGURL below)
#   - Admin credentials: ADMIN_EMAIL, ADMIN_PASSWORD
#
# Usage:
#   export ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='Your@Pass'
#   ./scripts/seed-brokers-demo.sh
#
# Optional:
#   API=http://localhost:5163/api/v1
#   PGURL=postgresql://postgres:root@localhost:5432/etstockx
#   BROKER_PASS=Strong@123   (password for every seeded broker login)
#   SKIP_FULL_NAME_SQL=1     (skip optional UPDATE iam.users SET full_name …)
#
# After running, sign in as any broker with email printed and BROKER_PASS to edit profile in UI.
# IAM: iam.users (full_name, email, email_confirmed). The investor directory list is NOT iam.broker_applications —
# it reads profiles.broker_profiles (created when a Broker/Dealer registers, via UserRegistered → Profiles handler).
# If broker_profiles is empty but iam.users has brokers, registration events did not run or a different DB was used.
# The investor UI shows a display name when the API adds fullName to BrokerDirectoryDto (often from iam.users.full_name).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API="${API:-http://localhost:5163/api/v1}"
PGURL="${PGURL:-postgresql://postgres:root@localhost:5432/etstockx}"
BROKER_PASS="${BROKER_PASS:-Strong@123}"
RUN="$(date +%s)"
DATA_FILE="${ROOT}/scripts/seed-brokers-demo.data.tsv"

if [[ -z "${ADMIN_EMAIL:-}" || -z "${ADMIN_PASSWORD:-}" ]]; then
  echo "Set ADMIN_EMAIL and ADMIN_PASSWORD to an Admin account on your API." >&2
  exit 1
fi

if [[ ! -f "$DATA_FILE" ]]; then
  echo "Missing data file: $DATA_FILE" >&2
  exit 1
fi

DOC="$(mktemp /tmp/etstockx-seed-lic.XXXXXX.pdf)"
cleanup() { rm -f "$DOC"; }
trap cleanup EXIT
printf '%%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%%%EOF\n' >"$DOC"

access_from_login_json() {
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('accessToken') or d.get('AccessToken') or '')"
}

echo "== Admin login =="
LOGIN_JSON="$(curl -sS -f -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")"
ADMIN_TOKEN="$(printf '%s' "$LOGIN_JSON" | access_from_login_json)"
if [[ -z "$ADMIN_TOKEN" ]]; then
  echo "Admin login failed." >&2
  exit 1
fi

application_id_for_email() {
  local email="$1"
  curl -sS "$API/auth/brokers/pending" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "
import json,sys
email=sys.argv[1].lower()
apps=json.load(sys.stdin)
for a in apps:
  if (a.get('email') or '').lower()==email:
    print(a['id'])
    break
" "$email"
}

escape_sql() {
  printf '%s' "$1" | sed "s/'/''/g"
}

echo "== Seeding brokers from $DATA_FILE =="
while IFS=$'\t' read -r slug full_name institution license accepting bio specs_raw; do
  [[ -z "${slug:-}" ]] && continue
  email="seed-broker-${slug}-${RUN}@example.com"
  echo "--- $full_name <$email> ---"

  curl -sS -f -X POST "$API/auth/register/broker" \
    -F "Role=Broker" \
    -F "Email=$email" \
    -F "Password=$BROKER_PASS" \
    -F "FullName=$full_name" \
    -F "Phone=+251900000000" \
    -F "PreferredLang=en" \
    -F "LicenseNumber=$license" \
    -F "Institution=$institution" \
    -F "EcmaReference=ECMA-REF-${slug}-${RUN}" \
    -F "Documents=@${DOC};type=application/pdf" \
    -F "DocumentTypes=License" >/dev/null

  psql "$PGURL" -v ON_ERROR_STOP=1 -c "UPDATE iam.users SET email_confirmed = true WHERE email = '$(escape_sql "$email")';" >/dev/null

  APP_ID="$(application_id_for_email "$email" || true)"
  if [[ -z "$APP_ID" ]]; then
    echo "No pending application for $email (check admin queue / registration error)." >&2
    exit 1
  fi

  curl -sS -f -X POST "$API/auth/brokers/${APP_ID}/verify" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"decision":"Approve","reason":null}' >/dev/null

  BR_LOGIN="$(curl -sS -f -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$BROKER_PASS\"}")"
  BR_TOKEN="$(printf '%s' "$BR_LOGIN" | access_from_login_json)"

  export BIO="$bio" INST="$institution" LIC="$license" ACC="$accepting" SPECSTR="$specs_raw"
  BODY="$(python3 -c 'import json,os
print(json.dumps({
  "bio": os.environ["BIO"],
  "institution": os.environ["INST"],
  "licenseDisplay": os.environ["LIC"],
  "isAcceptingRequests": os.environ["ACC"].lower()=="true",
  "specializations": [s.strip() for s in os.environ["SPECSTR"].split("^") if s.strip()],
}))')"

  curl -sS -f -X PUT "$API/profiles/broker/me" \
    -H "Authorization: Bearer $BR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BODY" >/dev/null

  if [[ -z "${SKIP_FULL_NAME_SQL:-}" ]]; then
    fn_esc="$(escape_sql "$full_name")"
    em_esc="$(escape_sql "$email")"
    psql "$PGURL" -v ON_ERROR_STOP=1 -c "UPDATE iam.users SET full_name = '${fn_esc}' WHERE email = '${em_esc}';" >/dev/null
  fi

  echo "  OK — $email / $BROKER_PASS"
  sleep 0.4
done < <(grep -v '^[[:space:]]*$' "$DATA_FILE")

echo ""
echo "Done. Brokers use password: $BROKER_PASS"
echo "If names do not appear in the investor directory, ensure the API includes fullName (or map iam.users.full_name) on GET /profiles/brokers."
