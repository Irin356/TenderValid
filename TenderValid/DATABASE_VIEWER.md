# 🗄️ How to View the Database (localStorage)

## 📌 Quick Answer
Since we're using **browser localStorage**, all data is stored in your browser's memory and can be viewed using **Developer Tools**.

---

## 🔍 METHOD 1: Browser DevTools (Recommended)

### **Step 1: Open Developer Tools**
- **Windows/Linux**: Press `F12` or `Ctrl + Shift + I`
- **Mac**: Press `Cmd + Option + I`

### **Step 2: Navigate to Storage Tab**
1. Click the **"Application"** tab (Chrome/Edge) or **"Storage"** tab (Firefox)
2. In the left sidebar, expand **"Local Storage"**
3. Click **"http://localhost:5177"** (or your current port)

### **Step 3: View Stored Data**
You'll see all localStorage keys:
- `tender_validator_rfps` - RFP documents
- `tender_validator_requirements` - Extracted requirements
- `tender_validator_vendors` - Vendor analysis results
- `tender_validator_sessions` - User sessions

---

## 💾 What Each Storage Key Contains

### **tender_validator_rfps**
```json
[
  {
    "id": "1712528930123abc123",
    "name": "IT_Infrastructure_RFP.txt",
    "content": "REQUEST FOR PROPOSAL – IT Infrastructure...",
    "uploaded_at": "2026-04-07T23:18:50.123Z"
  }
]
```

### **tender_validator_requirements**
```json
[
  {
    "id": "1712529001456def456",
    "rfp_id": "1712528930123abc123",
    "category": "Technical Specifications",
    "text": "The vendor must provide 99.9% uptime...",
    "keywords": ["uptime", "availability"],
    "priority": "Critical",
    "confirmed": true,
    "created_at": "2026-04-07T23:19:01.456Z"
  }
]
```

### **tender_validator_vendors**
```json
[
  {
    "id": "1712529045789ghi789",
    "name": "CloudTech Solutions",
    "rfp_id": "1712528930123abc123",
    "compliance_score": 85,
    "analysis_data": {
      "vendorName": "CloudTech Solutions",
      "complianceScore": 85,
      "requirementResults": [...],
      "risks": [...]
    },
    "created_at": "2026-04-07T23:19:45.789Z"
  }
]
```

### **tender_validator_sessions**
```json
[
  {
    "session_id": "session_1712528930_abc123xyz",
    "data": {
      "step": "dashboard",
      "rfpText": "...",
      "requirements": [...],
      "vendors": [...],
      "darkMode": false,
      "timestamp": 1712529050000
    },
    "updated_at": "2026-04-07T23:19:50.000Z"
  }
]
```

---

## 🎯 METHOD 2: Console Commands

### **Step 1: Open Console Tab** (in DevTools)

### **Step 2: Run These Commands**

**View all RFPs:**
```javascript
JSON.parse(localStorage.getItem('tender_validator_rfps'))
```

**View all Requirements:**
```javascript
JSON.parse(localStorage.getItem('tender_validator_requirements'))
```

**View all Vendors:**
```javascript
JSON.parse(localStorage.getItem('tender_validator_vendors'))
```

**View all Sessions:**
```javascript
JSON.parse(localStorage.getItem('tender_validator_sessions'))
```

**View Everything (Pretty Printed):**
```javascript
console.table(JSON.parse(localStorage.getItem('tender_validator_rfps')))
console.table(JSON.parse(localStorage.getItem('tender_validator_requirements')))
console.table(JSON.parse(localStorage.getItem('tender_validator_vendors')))
```

---

## 📊 METHOD 3: Database Stats Panel (In App)

### **Open Browser Console and Run:**
```javascript
// Check storage stats
import database from './src/database.js'
database.getStats()
```

**Sample Output:**
```
{
  rfps: 2,
  requirements: 8,
  vendors: 4,
  totalStorage: "1.23 MB"
}
```

---

## 🔄 METHOD 4: Clear Database (When Needed)

### **Via Console:**
```javascript
localStorage.clear()
// Refresh page
location.reload()
```

### **Via App:**
Open DevTools console:
```javascript
import database from './src/database.js'
database.clearAll()
```

---

## 📱 Storage Limits

- **Chrome**: ~10 MB per domain
- **Firefox**: ~10 MB per domain
- **Safari**: ~5 MB per domain
- **Edge**: ~10 MB per domain

---

## ✅ How to Verify Database is Working

### **Step 1: Start the App**
```bash
npm run dev
```

### **Step 2: Load Demo Data**
- Click "Load Demo RFP"
- Click "Extract Requirements"
- Click "Load Demo Vendors"

### **Step 3: Open DevTools (F12)**
- Go to "Application" tab
- Expand "Local Storage"
- Click your localhost
- You should see 4 keys with data

### **Step 4: Refresh Page**
- Press `F5`
- All data should still be there!

This confirms **data persistence is working** ✅

---

## 🐛 Troubleshooting

### **"I don't see any data"**
1. Make sure you've uploaded an RFP
2. Check that localStorage is enabled in browser
3. Open DevTools → Application → Storage
4. Look for keys starting with "tender_validator_"

### **"Data disappeared after closing browser"**
- This is expected! localStorage persists within a browser session
- Clear data with `localStorage.clear()` only if needed
- Sessions auto-cleanup after 24 hours

### **"Storage full" error**
- Clear old sessions: `database.cleanupOldSessions()`
- Or clear all: `localStorage.clear()`

---

## 💡 Pro Tips

1. **Export Data**: Download localStorage as JSON
   ```javascript
   const data = {
     rfps: JSON.parse(localStorage.getItem('tender_validator_rfps')),
     requirements: JSON.parse(localStorage.getItem('tender_validator_requirements')),
     vendors: JSON.parse(localStorage.getItem('tender_validator_vendors'))
   }
   console.save(JSON.stringify(data, null, 2), 'tender_data_backup.json')
   ```

2. **Monitor Storage Size**: Check DevTools → Application → Storage → "Manage" for breakdown

3. **Debug Specific RFP**:
   ```javascript
   const rfps = JSON.parse(localStorage.getItem('tender_validator_rfps'))
   const specificRfp = rfps.find(r => r.name === 'IT_Infrastructure_RFP.txt')
   console.log(specificRfp)
   ```

---

## 📚 Reference

**File**: `src/database.js`
**Storage Type**: localStorage (browser-based)
**Persistence**: Per browser session
**Auto-cleanup**: Sessions older than 24 hours
**Demo Data**: Auto-loads when clicking demo buttons
