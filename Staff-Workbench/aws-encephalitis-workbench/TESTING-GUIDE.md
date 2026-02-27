# Testing Guide - Local Development

## ✅ App is Running Successfully!

**URL:** http://localhost:3000/

The app is running with **mock AI responses** - no AWS deployment needed for testing!

## 🎯 Complete Workflow Test

### Step 1: Search & Profile Selection

**Option A: Use Existing Profiles**
1. Look at the "In Tray / Web Enquiries" section (3 new items)
2. Click on any enquiry (e.g., "Alice Vane" - memory loss concerns)
3. Profile data auto-fills into the intake form

**Option B: Search CRM**
1. Type a name in the search box (e.g., "John Smith")
2. Click on the profile from results
3. Data auto-fills

**Option C: Create New Profile**
1. Type a new name (e.g., "Test Patient")
2. Click "Create new case for..."
3. Start with blank form

### Step 2: Intake Form

**Rapid Triage Mode (Default):**
- **Role Selection:** Click cards OR press keys 1-4
  - 1 = Patient
  - 2 = Caregiver
  - 3 = Professional
  - 4 = Bereaved

- **Stage Selection:** Click cards OR press keys A-D
  - A = Acute Hospital
  - B = Early Recovery
  - C = Long-term Management
  - D = Bereavement

- **Diagnosis:** 
  - Click quick-select chips (Anti-NMDAR, HSV, etc.)
  - OR type custom diagnosis

- **Key Concerns:**
  - Click topic buttons to toggle (Memory Loss, Fatigue, etc.)
  - OR type in text area

**Detailed Notes Mode:**
- Click "Detailed Notes" tab at top
- Use traditional form fields
- Large text area for pasting full notes

### Step 3: Get AI Resource Suggestions

1. Fill in at least: Name, Role, and Concerns
2. Click **"Retrieve Resources"** button
3. Wait ~2 seconds (simulated AI call)
4. See 12 AI-suggested resources appear

**What to Look For:**
- Resource cards with titles, excerpts, types (PDF, Video, Article)
- "Match Reason" badges showing why each was selected
- Time to read estimates
- First 3 resources auto-selected

### Step 4: Curate Resources

1. Click resource cards to select/deselect
2. Selected cards have rose/pink background
3. Checkmark appears when selected
4. Bottom bar shows count: "X resources selected"

**Try This:**
- Deselect some auto-selected resources
- Select different ones
- Aim for 3-5 resources

### Step 5: Generate Email Draft

1. Click **"Generate Response Kit"** button (bottom right)
2. Wait ~2 seconds (simulated AI call)
3. See modular email draft appear

**Draft Components:**
- **Subject line** - Concise, supportive
- **Opening** - Acknowledges their situation
- **Resource intro** - Brief introduction
- **Resources list** - Your selected resources with links
- **Closing** - Offers further help
- **Sign-off** - Warm closing

### Step 6: Edit & Copy Draft

**Builder Tab:**
- Toggle blocks on/off with checkboxes
- Edit text directly in fields
- See live preview on right

**Resources Tab:**
- View just the resource list
- Copy for separate use

**Actions:**
- Click **"Copy to Clipboard"** - Copies full email
- Click **"Start New Case"** - Reset and start over

## 🧪 Test Scenarios

### Scenario 1: Patient with Memory Issues
```
Name: Sarah Johnson
Role: Patient (press 1)
Stage: Early Recovery (press B)
Diagnosis: Anti-NMDAR
Concerns: Memory Loss, Fatigue, Return to Work
```
**Expected:** Resources about memory, fatigue management, workplace support

### Scenario 2: Caregiver in Crisis
```
Name: John Davies
Role: Caregiver (press 2)
Stage: Acute Hospital (press A)
Diagnosis: HSV Encephalitis
Concerns: Behavior/Anger, Hospital Discharge
```
**Expected:** Resources about behavioral changes, discharge planning

### Scenario 3: Professional Seeking Info
```
Name: Dr. Smith
Role: Professional (press 3)
Stage: Post-Diagnosis
Diagnosis: Autoimmune (Unspecified)
Concerns: School/Education, Legal/Financial
```
**Expected:** Professional guides, educational resources

## 🎨 UI Features to Test

### Keyboard Shortcuts (Rapid Mode)
- Press **1-4** for role selection
- Press **A-D** for stage selection
- Works when NOT typing in a field

### Visual Feedback
- Hover effects on cards
- Selected state highlighting
- Loading animations
- Smooth transitions

### Responsive Design
- Resize browser window
- Check mobile view (narrow width)
- All features should work

### Navigation
- Click logo to reset
- Back buttons between steps
- Step indicator in header

## 🔍 Mock Data Available

### Inbox Items (3)
1. **Alice Vane** - Anti-LGI1, memory concerns
2. **Greg Houseman** - HSV, anger issues, legal needs
3. **Sarah & Tom** - Parents, son in coma, treatment questions

### CRM Profiles (10)
- Miriam Al-Fayed (Caregiver, ICU)
- John Smith (Patient, memory loss)
- Sarah Jenkins (Parent, school issues)
- Dr. Aris Thorne (Professional)
- Emily Chen (Bereaved)
- Marcus Johnson (Patient, seizures)
- Elena Rodriguez (Caregiver, advocacy)
- David O'Connell (Patient, fatigue)
- Priya Patel (Parent, surgery)
- Thomas Mueller (Caregiver, personality change)

### Mock AI Responses
- **12 resources** per suggestion
- **Modular email** with 5 editable blocks
- **2-second delay** to simulate real API

## 🐛 Known Behaviors

### Expected (Not Bugs)
- Console warning: "Using mock API" - Normal for local dev
- 2-second delays - Simulating real AI calls
- No actual emails sent - This is a draft tool
- Knowledge base upload - Stores in state only (no S3 yet)

### If Something Breaks
1. Check browser console (F12) for errors
2. Refresh the page
3. Check the terminal for Vite errors
4. Restart dev server if needed

## 📝 Testing Checklist

- [ ] Search existing profiles
- [ ] Click inbox item
- [ ] Create new profile
- [ ] Use Rapid Triage mode
- [ ] Use Detailed Notes mode
- [ ] Test keyboard shortcuts (1-4, A-D)
- [ ] Click topic buttons
- [ ] Get resource suggestions
- [ ] Select/deselect resources
- [ ] Generate email draft
- [ ] Edit draft blocks
- [ ] Toggle blocks on/off
- [ ] Copy to clipboard
- [ ] Start new case
- [ ] Upload knowledge base file (JSON)

## 🚀 Next Steps

### To Deploy to AWS:
1. Follow [QUICKSTART.md](./QUICKSTART.md)
2. Deploy backend: `cd backend && sam deploy --guided`
3. Update `.env.local` with real API endpoint
4. Change `VITE_USE_MOCK=false`
5. Restart dev server
6. Test with real AI (Claude via Bedrock)

### To Customize:
- **Mock profiles:** Edit `src/data/mockProfiles.ts`
- **Mock resources:** Edit `src/services/mock-api.ts`
- **Styling:** Modify Tailwind classes in components
- **Workflow:** Edit `src/App.tsx`

## 💡 Tips

1. **Use Browser DevTools** (F12) to see:
   - Console logs ("Using mock API for...")
   - Network requests (none for mock mode)
   - React component tree

2. **Test Edge Cases:**
   - Empty forms
   - Very long text
   - Special characters
   - Rapid clicking

3. **Performance:**
   - Hot reload works (instant updates)
   - No need to refresh after code changes
   - Mock delays are intentional

4. **Accessibility:**
   - Tab through form fields
   - Keyboard shortcuts work
   - Screen reader friendly

## 📞 Support

If you encounter issues:
1. Check [LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md)
2. Review browser console errors
3. Check terminal for Vite errors
4. Restart dev server: Ctrl+C, then `npm run dev`

---

**Enjoy testing! The app is fully functional with mock data.** 🎉

When ready, deploy to AWS for real AI-powered responses with Claude!
