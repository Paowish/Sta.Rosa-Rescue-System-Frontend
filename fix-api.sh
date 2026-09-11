#!/bin/bash

# 1. Ensure API_URL is exported from api.js
if ! grep -q "export { API_URL" src/services/api.js; then
    echo "" >> src/services/api.js
    echo "export { API_URL, getApiUrl };" >> src/services/api.js
    echo "✅ Exported API_URL from api.js"
fi

# 2. Files with relative /api/ fetches
FILES=(
    "src/components/layout/DashboardLayout.jsx"
    "src/pages/admin/AdminOverview.jsx"
    "src/pages/admin/IncidentReport.jsx"
    "src/pages/admin/SystemMaintenance.jsx"
    "src/pages/admin/SystemSettings.jsx"
    "src/pages/civilian/EditProfile.jsx"
    "src/pages/rescueTeam/DispatchSelectionModal.jsx"
    "src/pages/rescueTeam/IncidentDetails.jsx"
    "src/pages/rescueTeam/RescueProfile.jsx"
    "src/pages/VerifyEmail.jsx"
    "src/pages/volunteer/VolunteerDashboard.jsx"
)

for FILE in "${FILES[@]}"; do
    [ ! -f "$FILE" ] && continue

    # Compute relative import path to services/api
    DEPTH=$(echo "$FILE" | awk -F'/' '{print NF-2}')
    case $DEPTH in
        1) IMPORT_PATH="./services/api" ;;
        2) IMPORT_PATH="../services/api" ;;
        *) IMPORT_PATH="../../services/api" ;;
    esac

    # Add import if missing
    if ! grep -q "API_URL.*from.*services/api" "$FILE"; then
        sed -i "0,/^import /s//import { API_URL } from \"${IMPORT_PATH}\";\nimport /" "$FILE"
        echo "✅ Import added: $FILE"
    fi

    # Replace relative URLs with ${API_URL}
    sed -i "s|fetch('/api/|fetch(\`\${API_URL}/|g" "$FILE"
    sed -i "s|fetch(\`/api/|fetch(\`\${API_URL}/|g" "$FILE"
    sed -i 's|fetch("/api/|fetch(`\${API_URL}/|g' "$FILE"

    echo "✅ Fixed: $FILE"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "��� Remaining relative /api fetch calls:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -rn "fetch('/api\|fetch(\`/api\|fetch(\"/api" src/ && echo "❌ STILL FOUND ABOVE" || echo "✅ NONE - all clean!"
