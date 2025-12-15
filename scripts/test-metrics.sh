#!/bin/bash
# API Endpoint Metrics Test Script
# Tests all major endpoints and reports latency

BASE_URL="${1:-http://localhost:8080/api/v1}"
TOKEN="${2:-}"  # Optional: Pass auth token as second argument

echo "=========================================="
echo "  API Endpoint Metrics Test"
echo "  Base URL: $BASE_URL"
echo "  Time: $(date)"
echo "=========================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local name=$3
    local auth_required=$4
    
    local curl_opts="-s -o /dev/null -w %{time_total}"
    
    if [ "$auth_required" = "auth" ] && [ -n "$TOKEN" ]; then
        curl_opts="$curl_opts -H 'Authorization: Bearer $TOKEN'"
    fi
    
    if [ "$method" = "GET" ]; then
        time=$(curl $curl_opts "$BASE_URL$endpoint")
    else
        time=$(curl $curl_opts -X $method "$BASE_URL$endpoint")
    fi
    
    # Convert to ms
    time_ms=$(echo "$time * 1000" | bc 2>/dev/null || echo "$time")
    
    # Color coding based on latency
    if (( $(echo "$time < 0.1" | bc -l 2>/dev/null || echo 0) )); then
        status="🟢"
    elif (( $(echo "$time < 0.5" | bc -l 2>/dev/null || echo 0) )); then
        status="🟡"
    else
        status="🔴"
    fi
    
    printf "%-35s %-8s %s %.3fs\n" "$name" "$method" "$status" "$time"
}

echo "📊 PUBLIC ENDPOINTS (No Auth)"
echo "-------------------------------------------"
test_endpoint "GET" "/health" "Health Check (Fast)" ""
test_endpoint "GET" "/health/detailed" "Health Check (Detailed)" ""
test_endpoint "GET" "/subscriptions/plans" "Subscription Plans" ""
test_endpoint "GET" "/boost/packages" "Boost Packages" ""
test_endpoint "GET" "/boost/featured" "Featured Profiles" ""
echo ""

if [ -n "$TOKEN" ]; then
    echo "📊 AUTHENTICATED ENDPOINTS"
    echo "-------------------------------------------"
    test_endpoint "GET" "/profile/me" "My Profile" "auth"
    test_endpoint "GET" "/profile/recommendations" "Recommendations" "auth"
    test_endpoint "GET" "/profile/search" "Profile Search" "auth"
    test_endpoint "GET" "/matches/sent" "Sent Matches" "auth"
    test_endpoint "GET" "/matches/received" "Received Matches" "auth"
    test_endpoint "GET" "/matches/accepted" "Accepted Matches" "auth"
    test_endpoint "GET" "/interests/received" "Received Interests" "auth"
    test_endpoint "GET" "/interests/sent" "Sent Interests" "auth"
    test_endpoint "GET" "/notifications" "Notifications" "auth"
    test_endpoint "GET" "/subscriptions/my-subscription" "My Subscription" "auth"
    test_endpoint "GET" "/boost/active" "Active Boost" "auth"
    echo ""
else
    echo "💡 To test authenticated endpoints, run:"
    echo "   ./test-metrics.sh $BASE_URL YOUR_AUTH_TOKEN"
    echo ""
fi

echo "=========================================="
echo "Legend: 🟢 <100ms | 🟡 100-500ms | 🔴 >500ms"
echo "=========================================="
