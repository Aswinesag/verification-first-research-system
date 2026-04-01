# 🔧 VARA Frontend Troubleshooting Guide

## **Issue: No Output When Clicking Run Query**

### **🔍 Problem Diagnosis**
The frontend is not processing queries when you click the "Run Query" button. This could be due to several reasons:

### **🛠️ Troubleshooting Steps**

#### **1. Check Browser Console**
1. Open the frontend at `http://localhost:3000`
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Look for any error messages
5. Click the "Run Query" button and watch for new console messages

**Expected Console Output:**
```
🔍 QueryBar handleSubmit called with: What is Artificial Intelligence?
📤 QueryBar calling onSubmit with: What is Artificial Intelligence?
🚀 handleRunQuery called with: What is Artificial Intelligence?
🔄 Resetting state and starting query...
📡 Calling API service...
🚀 API Request: POST /query
✅ API Response: 200 /query
✅ API response received: {...}
🎉 VARA Response set: {...}
🏁 Query processing completed
```

#### **2. Test API Directly**
Open the debug page: `file:///d:/vara/frontend_debug.html`

**Steps:**
1. Click "Test Health Endpoint" - should show green success
2. Click "Test Query Endpoint" - should show mock data
3. Try "Run Query" - should process successfully

#### **3. Check Network Requests**
1. In Developer Tools, go to **Network** tab
2. Click "Run Query" button
3. Look for the `/query` request
4. Check if it shows status 200
5. Click on the request to see the response

#### **4. Verify Frontend Code**
The issue was in the `QueryBar` component - it wasn't properly calling the `onSubmit` prop. This has been fixed with debugging logs.

### **🔧 Quick Fixes**

#### **Option 1: Restart Frontend**
```bash
# Kill current frontend
taskkill /F /IM node.exe

# Restart frontend
cd d:\vara\frontend
npm run dev
```

#### **Option 2: Clear Browser Cache**
1. Press `Ctrl+Shift+Delete`
2. Clear cache and cookies
3. Refresh the page

#### **Option 3: Use Debug Page**
Open `d:\vara\frontend_debug.html` in your browser to test API directly.

### **📊 Expected Behavior**

#### **When Working Correctly:**
1. **Click "Run Query"** → Loading animation starts
2. **Execution Pipeline** → Steps light up progressively
3. **Claims Appear** → With confidence bars and trust levels
4. **Knowledge Graph** → Interactive nodes and edges
5. **Confidence Panel** → System metrics displayed

#### **Test Query:**
```
"What is Artificial Intelligence?"
```

**Expected Results:**
- 3 claims generated
- Confidence scores: 0.85, 0.78, 0.72
- Trust levels: High, Medium, Medium
- Overall confidence: 0.78
- Risk level: Low

### **🚀 If Still Not Working**

#### **Check Backend Status:**
```bash
# Test backend directly
python d:\vara\test_api_direct.py
```

#### **Verify Services Running:**
- Backend: `http://localhost:8000/health`
- Frontend: `http://localhost:3000`

#### **Manual API Test:**
```bash
# Test API with curl (or use PowerShell)
curl -X POST http://localhost:8000/query -H "Content-Type: application/json" -d "{\"query\": \"What is AI?\"}"
```

### **📞 Next Steps**

1. **Check Console** - Look for the debugging messages
2. **Test Debug Page** - Verify API connectivity
3. **Restart Services** - Fresh start for both frontend and backend
4. **Try Different Browser** - Chrome, Firefox, Edge

### **🎯 Success Indicators**

✅ **Console Shows Debug Messages**  
✅ **Network Tab Shows 200 Response**  
✅ **Execution Pipeline Animates**  
✅ **Claims Display with Confidence Bars**  
✅ **Knowledge Graph Renders**  
✅ **No Error Messages in Console**

---

## **🔧 Advanced Debugging**

### **Check React Components**
```javascript
// In browser console
window.React = React;
// Inspect component state
```

### **Monitor API Calls**
```javascript
// In browser console
fetch('http://localhost:8000/health').then(r => r.json()).then(console.log)
```

### **Verify State Management**
```javascript
// Check Zustand store
console.log(window.store?.getState?.());
```

---

## **🚀 Final Verification**

After fixing the issue, you should see:

1. **Immediate Response** when clicking "Run Query"
2. **Loading Animation** with execution steps
3. **Progressive Updates** as each step completes
4. **Final Results** with claims, graph, and confidence metrics
5. **Interactive Elements** - clickable claims, graph nodes

**The system should now be fully functional!** 🎉
