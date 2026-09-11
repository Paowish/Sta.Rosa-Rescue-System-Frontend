#!/bin/bash

# Fix UserAccount.jsx
FILE="src/pages/admin/UserAccount.jsx"
if [ -f "$FILE" ]; then
    # Show current definition
    echo "=== Current apiUrl in $FILE ==="
    grep -n "apiUrl" "$FILE" | head -3
    
    # Replace `: '/api'` pattern with the new backend URL
    sed -i "s|: '/api';|: 'https://sta-rosa-rescue-system-backend-7zbj.onrender.com/api';|g" "$FILE"
    sed -i 's|: "/api";|: "https://sta-rosa-rescue-system-backend-7zbj.onrender.com/api";|g' "$FILE"
    sed -i "s|const apiUrl = '/api';|const apiUrl = 'https://sta-rosa-rescue-system-backend-7zbj.onrender.com/api';|g" "$FILE"
    sed -i 's|const apiUrl = "/api";|const apiUrl = "https://sta-rosa-rescue-system-backend-7zbj.onrender.com/api";|g' "$FILE"
    
    echo "âœ… Fixed: $FILE"
    echo "=== New apiUrl in $FILE ==="
    grep -n "apiUrl" "$FILE" | head -3
fi

# Fix VolunteerApproval.jsx
FILE="src/pages/rescueTeam/VolunteerApproval.jsx"
if [ -f "$FILE" ]; then
    echo ""
    echo "=== Current apiUrl in $FILE ==="
    grep -n "apiUrl" "$FILE" | head -3
    
    sed -i "s|: '/api';|: 'https://sta-rosa-rescue-system-backend-7zbj.onrender.com/api';|g" "$FILE"
    sed -i 's|: "/api";|: "https://sta-rosa-rescue-system-backend-7zbj.onrender.com/api";|g' "$FILE"
    sed -i "s|const apiUrl = '/api';|const apiUrl = 'https://sta-rosa-rescue-system-backend-7zbj.onrender.com/api';|g" "$FILE"
    sed -i 's|const apiUrl = "/api";|const apiUrl = "https://sta-rosa-rescue-system-backend-7zbj.onrender.com/api";|g' "$FILE"
    
    echo "âœ… Fixed: $FILE"
    echo "=== New apiUrl in $FILE ==="
    grep -n "apiUrl" "$FILE" | head -3
fi

echo ""
echo "í´Ž Verify no more relative /api refs:"
grep -rn "apiUrl = '/api\|apiUrl = \"/api\|: '/api'\|: \"/api\"" src/ || echo "âœ… Clean!"
