# 🚀 VARA Frontend Setup Guide

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- VARA backend running on port 8000
- Git for version control

## 🛠️ Installation Steps

### 1. Navigate to Frontend Directory
```bash
cd vara/frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create `.env` file:
```env
VITE_API_URL=http://localhost:8000
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Open Browser
Navigate to: `http://localhost:3000`

## 🔧 Backend Connection

### Option 1: Development (Recommended)
Use Vite proxy - automatically configured in `vite.config.js`

### Option 2: Production
Set environment variable:
```env
VITE_API_URL=http://your-backend-url:8000
```

## 📦 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🎨 Customization

### Colors
Edit `src/styles/globals.css`:
```css
:root {
  --vara-accent: #00ff88;
  --vara-danger: #ff4757;
  /* ... other colors */
}
```

### Typography
Modify font stack in `globals.css`:
```css
body {
  font-family: 'Your Font', sans-serif;
}
```

## 🐛 Troubleshooting

### Common Issues

**1. "Cannot connect to backend"**
- Ensure backend is running on port 8000
- Check CORS settings on backend
- Verify API URL in `.env`

**2. "Module not found"**
- Run `npm install` again
- Clear node_modules: `rm -rf node_modules && npm install`

**3. "Build fails"**
- Check for syntax errors in components
- Verify all imports are correct
- Run `npm run lint` to catch issues

### Development Tips

- Use browser DevTools for debugging
- Check Network tab for API calls
- Monitor Console for JavaScript errors
- Use React DevTools for component inspection

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Static Hosting
Deploy the `dist/` folder to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

### Environment Variables for Production
```env
VITE_API_URL=https://your-production-api.com
```

## 📱 Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🎯 Feature Overview

### Core Components
- **QueryBar**: Input and submission interface
- **ExecutionFlow**: Live pipeline visualization
- **ReasoningPanel**: Claims and subtasks display
- **GraphPanel**: Interactive knowledge graph
- **ClaimDrawer**: Detailed claim analysis
- **ConfidencePanel**: System metrics

### Key Features
- Real-time execution tracking
- Interactive knowledge graph
- Claim confidence visualization
- Evidence source verification
- Uncertainty analysis
- Responsive design

## 🔗 API Integration

### Required Backend Endpoints
```typescript
POST /query          # Main query processing
GET  /health         # Health check
GET  /metrics        # System metrics
```

### Expected Response Format
```json
{
  "goal": "...",
  "subtasks": [...],
  "claims": [
    {
      "claim_id": "...",
      "text": "...",
      "confidence": 0.72,
      "uncertainty": 0.28,
      "trust_level": "medium",
      "verification": {...},
      "sources": [...]
    }
  ],
  "graph": {
    "nodes": [...],
    "edges": [...]
  },
  "overall_confidence": 0.41,
  "risk_level": "medium"
}
```

## 🎨 UI Components

### Color Scheme
- **Dark Theme**: Optimized for extended use
- **High Contrast**: Clear visual hierarchy
- **Semantic Colors**: Green (success), Yellow (warning), Red (danger)

### Animations
- **Framer Motion**: Smooth transitions
- **Loading States**: Skeleton screens
- **Micro-interactions**: Hover and click feedback

### Responsive Design
- **Desktop**: Full three-panel layout
- **Tablet**: Optimized two-column
- **Mobile**: Single column stack

## 🧪 Testing

### Manual Testing Checklist
- [ ] Query submission works
- [ ] Execution flow displays correctly
- [ ] Claims appear with confidence bars
- [ ] Graph visualization loads
- [ ] Claim drawer opens on click
- [ ] Error handling works
- [ ] Responsive design on mobile

### Browser Testing
Test in multiple browsers for compatibility:
- Chrome/Chromium
- Firefox
- Safari
- Edge

## 📈 Performance

### Optimization Features
- **Code Splitting**: Lazy loading
- **Bundle Optimization**: Tree shaking
- **Image Optimization**: Compressed assets
- **Caching**: Proper headers

### Monitoring
- **Load Time**: < 3 seconds
- **Interaction Response**: < 100ms
- **Graph Performance**: Smooth animations

## 🔒 Security

### Implemented Measures
- **XSS Prevention**: Input sanitization
- **CSRF Protection**: Proper headers
- **Secure Headers**: HSTS, CSP
- **No Sensitive Data**: No API keys in frontend

## 🚀 Ready to Launch!

Your VARA frontend is now configured and ready for development. The sophisticated interface provides:

- **Interactive AI Reasoning Visualization**
- **Real-time Execution Pipeline**
- **Knowledge Graph Exploration**
- **Claim Analysis and Verification**
- **Modern, Responsive Design**

**Start exploring the future of AI interaction!** 🎯
