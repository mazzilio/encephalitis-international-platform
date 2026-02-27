# Local Development Guide

## ✅ App is Running!

The Encephalitis Support Workbench is now running locally at:

**🌐 http://localhost:3000/**

## 🎯 What You Can Do

The app is running with **mock AI responses** so you can test all features without deploying to AWS:

### 1. Search & Profile Management
- Search for existing profiles (mock data included)
- View inbox/web enquiries
- Create new profiles

### 2. Intake Form
- **Rapid Triage Mode**: Quick selection with keyboard shortcuts
  - Press 1-4 for Role selection
  - Press A-D for Stage selection
  - Click topics to add concerns
  
- **Detailed Notes Mode**: Full clinical documentation
  - Paste long-form notes
  - Traditional form inputs

### 3. AI Resource Suggestion
- Click "Retrieve Resources" to get AI-suggested resources
- Mock API returns 12 relevant resources (2-second delay to simulate API call)
- Resources are contextual based on your intake data

### 4. Resource Curation
- Select/deselect resources with visual cards
- See match reasons for each resource
- Human-in-the-loop approval

### 5. Draft Generation
- Click "Generate Response Kit" to create email draft
- Mock API generates modular email blocks
- Edit and customize the draft

## 🔧 Mock vs Real API

### Current Setup (Mock API)
```env
VITE_USE_MOCK=true
```

**Advantages:**
- ✅ No AWS account needed
- ✅ No costs
- ✅ Instant setup
- ✅ Test all features
- ✅ Fast iteration

### Switch to Real AWS API

When you deploy the backend to AWS:

1. Deploy backend:
   ```bash
   cd backend
   sam deploy --guided
   ```

2. Update `.env.local`:
   ```env
   VITE_USE_MOCK=false
   VITE_API_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
   ```

3. Restart dev server:
   ```bash
   npm run dev
   ```

## 🎨 Features to Test

### Mock Profiles Available
- Sarah Mitchell (Patient, Anti-NMDAR, Early Recovery)
- John Davies (Caregiver, HSV Encephalitis, Long-term)
- Dr. Emma Thompson (Professional, Multiple cases)
- Robert Chen (Patient, LGI1 Antibody, Acute Hospital)

### Inbox Items
- 3 new web enquiries ready to action
- Click to import directly into intake form

### Keyboard Shortcuts (Rapid Mode)
- **1-4**: Select role (Patient, Caregiver, Professional, Bereaved)
- **A-D**: Select stage (Acute, Early Recovery, Long-term, Bereavement)

### Common Topics (Quick Select)
- Memory Loss
- Behavior/Anger
- Fatigue
- Seizures
- Sleep Issues
- Return to Work
- School/Education
- Legal/Financial
- Hospital Discharge
- Rehab Access
- Depression/Anxiety
- Social Isolation

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is busy, Vite will automatically use the next available port (3001, 3002, etc.)

### Changes Not Reflecting
- Vite has hot module replacement (HMR)
- Changes should appear instantly
- If not, refresh the browser

### Console Warnings
You may see: "VITE_API_ENDPOINT is not set. Using mock API for local development."
- This is expected and normal for local development

## 📝 Development Workflow

### Making Changes

1. **Edit files** in `src/` directory
2. **Save** - changes appear instantly (HMR)
3. **Test** in browser
4. **Commit** to Git

### File Structure
```
frontend/src/
├── App.tsx                    # Main application
├── components/
│   ├── FileUploader.tsx      # Knowledge base upload
│   └── OutputSection.tsx     # Draft display
├── services/
│   ├── aws-bedrock.ts        # API client (auto-switches mock/real)
│   └── mock-api.ts           # Mock responses
├── data/
│   └── mockProfiles.ts       # Sample CRM data
└── types.ts                  # TypeScript definitions
```

### Adding New Features

1. **Mock the API response** in `mock-api.ts`
2. **Build the UI** in components
3. **Test locally** with mock data
4. **Implement real API** in Lambda
5. **Deploy and test** with real backend

## 🚀 Next Steps

### 1. Test All Features Locally
- [ ] Search profiles
- [ ] Create new profile
- [ ] Fill intake form (both modes)
- [ ] Get resource suggestions
- [ ] Select resources
- [ ] Generate draft
- [ ] Upload knowledge base file

### 2. Deploy to AWS (Optional)
Follow [QUICKSTART.md](./QUICKSTART.md) to deploy the backend

### 3. Customize
- Update mock profiles in `data/mockProfiles.ts`
- Modify UI in `App.tsx`
- Add new resources in `mock-api.ts`
- Customize styling (Tailwind CSS)

## 🛑 Stop the Server

To stop the development server:
```bash
# Press Ctrl+C in the terminal
```

Or if running in background:
```bash
# Find the process
lsof -ti:3000 | xargs kill
```

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

## 💡 Tips

1. **Use Browser DevTools** - Press F12 to see console logs and network requests
2. **Check Mock API Logs** - Console shows "Using mock API for..." messages
3. **Test Edge Cases** - Try empty forms, long text, special characters
4. **Mobile Testing** - Resize browser or use device emulation
5. **Accessibility** - Test with keyboard navigation

---

**Happy Coding! 🎉**

The app is fully functional with mock data. When you're ready, deploy to AWS for real AI-powered responses!
