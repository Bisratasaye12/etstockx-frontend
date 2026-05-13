#!/usr/bin/env bash
# Seeds local Postgres + API so the investor dashboard has listings, watchlist, and mixed trade rows.
# Prereqs: API at http://localhost:5163, Postgres per EtStockX.Api appsettings (default: etstockx/postgres/root).
set -euo pipefail

API="${API:-http://localhost:5163/api/v1}"
PGURL="${PGURL:-postgresql://postgres:root@localhost:5432/etstockx}"
EMAIL="${EMAIL:-e2e.dashboard.$(date +%s)@example.com}"
PASS="${PASS:-Strong@123}"
# Default: bootstrap admin user id from appsettings — used as listing broker_id and trade counterparty for local demos only.
BROKER_ID="${BROKER_ID:-939133b3-2a61-4f59-b701-e2ec22aea0f0}"

echo "== Register $EMAIL =="
curl -sS -f -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"role\":\"Client\",\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"fullName\":\"Dashboard E2E\",\"phone\":\"+251911999888\",\"preferredLang\":\"en\"}" \
  | python3 -m json.tool

echo "== Confirm email (SQL) =="
psql "$PGURL" -v ON_ERROR_STOP=1 -c "UPDATE iam.users SET email_confirmed = true WHERE email = '$EMAIL';"

echo "== Login =="
LOGIN=$(curl -sS -f -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
ACCESS=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('accessToken') or d.get('AccessToken') or '')" "$LOGIN")
REFRESH=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('refreshToken') or d.get('RefreshToken') or '')" "$LOGIN")

echo "== Complete profile =="
curl -sS -f -X POST "$API/profiles/client/complete" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{"riskProfile":"Moderate","address":"Bole, Addis Ababa","contactPerson":"Dashboard E2E","settlementBank":"Commercial Bank of Ethiopia","accountNickname":"Primary"}' \
  | python3 -m json.tool

echo "== Refresh JWT (isActivated) =="
PAIR=$(curl -sS -f -X POST "$API/auth/refresh-token" -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}")
ACCESS=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('accessToken') or d.get('AccessToken') or '')" "$PAIR")

L1=$(uuidgen | tr '[:upper:]' '[:lower:]')
L2=$(uuidgen | tr '[:upper:]' '[:lower:]')
L3=$(uuidgen | tr '[:upper:]' '[:lower:]')

echo "== Insert 3 listings =="
psql "$PGURL" -v ON_ERROR_STOP=1 <<SQL
INSERT INTO market.listings (
  id, broker_id, instrument_name, ticker, sector, price, currency, quantity,
  notes, status, view_count, created_at, updated_at, search_vector
) VALUES
('$L1', '$BROKER_ID'::uuid, 'CBE Shares', 'CBE', 'Finance', 1250.00, 'ETB', 10000,
 NULL, 'Active', 0, now(), now(), to_tsvector('english', 'CBE Shares Finance')),
('$L2', '$BROKER_ID'::uuid, 'Ethio Telecom', 'ET', 'Tech', 850.00, 'ETB', 5000,
 NULL, 'Active', 0, now(), now(), to_tsvector('english', 'Ethio Telecom Tech')),
('$L3', '$BROKER_ID'::uuid, 'Dashen Bank', 'DASHEN', 'Finance', 420.00, 'ETB', 8000,
 NULL, 'Active', 0, now(), now(), to_tsvector('english', 'Dashen Bank Finance'));
SQL

echo "== Watchlist + trade =="
curl -sS -f -X POST "$API/profiles/client/watchlist" -H "Authorization: Bearer $ACCESS" -H "Content-Type: application/json" -d "{\"listingId\":\"$L1\"}" | python3 -m json.tool
curl -sS -f -X POST "$API/profiles/client/watchlist" -H "Authorization: Bearer $ACCESS" -H "Content-Type: application/json" -d "{\"listingId\":\"$L2\"}" | python3 -m json.tool

B1=$(curl -sS -f -X POST "$API/trade/buy-requests" -H "Authorization: Bearer $ACCESS" -H "Content-Type: application/json" \
  -d "{\"brokerId\":\"$BROKER_ID\",\"listingId\":\"$L1\",\"instrumentName\":\"CBE Shares\",\"ticker\":\"CBE\",\"quantity\":100,\"desiredPrice\":1200,\"currency\":\"ETB\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
B2=$(curl -sS -f -X POST "$API/trade/buy-requests" -H "Authorization: Bearer $ACCESS" -H "Content-Type: application/json" \
  -d "{\"brokerId\":\"$BROKER_ID\",\"listingId\":\"$L3\",\"instrumentName\":\"Dashen Bank\",\"ticker\":\"DASHEN\",\"quantity\":50,\"desiredPrice\":400,\"currency\":\"ETB\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
S1=$(curl -sS -f -X POST "$API/trade/sell-requests" -H "Authorization: Bearer $ACCESS" -H "Content-Type: application/json" \
  -d "{\"brokerId\":\"$BROKER_ID\",\"instrumentName\":\"Ethio Telecom\",\"ticker\":\"ET\",\"quantity\":200,\"desiredPrice\":900,\"currency\":\"ETB\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
S2=$(curl -sS -f -X POST "$API/trade/sell-requests" -H "Authorization: Bearer $ACCESS" -H "Content-Type: application/json" \
  -d "{\"brokerId\":\"$BROKER_ID\",\"instrumentName\":\"Awash Bank\",\"ticker\":\"AWASH\",\"quantity\":300,\"desiredPrice\":310,\"currency\":\"ETB\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

echo "== Optional: vary statuses (SQL) for dashboard cards =="
psql "$PGURL" -v ON_ERROR_STOP=1 <<SQL
UPDATE trade.buy_requests SET status = 'BrokerReviewing', updated_at = now() WHERE id = '$B1'::uuid;
UPDATE trade.buy_requests SET status = 'TermsAgreed', updated_at = now() WHERE id = '$B2'::uuid;
UPDATE trade.sell_requests SET status = 'ProposalSent', updated_at = now() WHERE id = '$S1'::uuid;
UPDATE trade.sell_requests SET status = 'Filled', updated_at = now() WHERE id = '$S2'::uuid;
SQL

echo ""
echo "Log in on the frontend:"
echo "  Email:    $EMAIL"
echo "  Password: $PASS"
