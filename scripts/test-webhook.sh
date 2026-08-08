#!/bin/bash

# Step 1 — submit insurance request and capture sandbox ID
echo "📤 Submitting insurance request..."

RESPONSE=$(curl -s -X POST http://localhost:3000/api/insurance/request \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "jane@example.com",
    "insurance": "Blue Cross",
    "cptCodes": ["99203", "73560"]
  }')

echo "Response: $RESPONSE"

SANDBOX_ID=$(echo $RESPONSE | grep -o '"sandboxId":"[^"]*"' | cut -d'"' -f4)
echo ""
echo "⏸  Sandbox hibernating: $SANDBOX_ID"
echo ""

# Step 2 — wait 3 seconds
echo "⏳ Waiting 3 seconds (simulating insurance review)..."
sleep 3

# Step 3 — fire webhook with trace ID
TRACE_ID="test-trace-$(date +%s)"
echo "🔔 Firing webhook with TraceID: $TRACE_ID"
echo ""

curl -i -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -H "x-sls-trace-id: $TRACE_ID" \
  -d "{
    \"sandboxId\": \"$SANDBOX_ID\",
    \"requestId\": \"pa-12345\",
    \"patientId\": \"jane@example.com\",
    \"status\": \"APPROVED\",
    \"authorizationNumber\": \"AUTH-778899\"
  }"

echo ""
echo "✅ Full loop complete"