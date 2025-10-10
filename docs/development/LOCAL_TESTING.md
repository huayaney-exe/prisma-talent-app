# Local Testing Guide

Your forms now work locally with simulated database operations! 🎉

## Quick Start

1. **Start local server**:
   ```bash
   python3 -m http.server 8000
   ```

2. **Test HR Form**:
   - Open: http://localhost:8000/formulario-hr.html
   - Fill out the form completely
   - Submit → Should show success modal
   - Check browser console for demo mode logs

3. **Test Leader Form**:
   - Use generated position code from HR form, OR
   - Open: http://localhost:8000/formulario-lider.html?position=POS_DEMO01
   - Fill out the form (dynamic questions will load)
   - Submit → Should show success modal

## What's Different Now

### ✅ Demo Mode Enabled
- **Purple banner** at top shows "DEMO MODE"
- All database operations are **simulated**
- **Console logs** show what would be saved
- **Mock authentication** bypasses login requirement

### ✅ Working Features
- Form validation (required fields, email, dates)
- Progress tracking and section completion
- Dynamic questions based on area selection
- Success/error modals
- Complete workflow simulation

### ✅ Pre-loaded Test Data
Available position codes for immediate testing:
- `POS_DEMO01` - Senior Product Manager (Product area)
- `POS_DEMO02` - Lead Frontend Engineer (Engineering area)
- `POS_DEMO03` - Growth Marketing Manager (Growth area)

## Console Output Examples

### HR Form Submission:
```
🔧 Demo Mode: Using mock HR user data
🔧 Demo Mode: Simulating position creation
Position data to be created: {position_name: "Senior Product Manager", ...}
✅ Demo Position created: {id: "demo-position-...", position_code: "POS_A1B2C3D4"}
📝 Activity logged: {activity_type: "hr_form_completed", ...}
📧 Email communication logged: {email_type: "leader_specification_request", ...}
```

### Leader Form Submission:
```
🔧 Demo Mode: Getting position by code: POS_A1B2C3D4
✅ Demo Position found: {position_name: "Senior Product Manager", ...}
🔧 Demo Mode: Simulating position update
✅ Demo Position updated: {workflow_stage: "leader_completed", ...}
```

## Testing Different Scenarios

### Test Form Validation
1. Submit empty form → See validation errors
2. Enter invalid email → See email validation
3. Select past date → See date validation
4. Fill form progressively → See progress tracking

### Test Dynamic Questions
1. Go to leader form: `formulario-lider.html?position=POS_DEMO01`
2. Area auto-selects to "product-management"
3. Product-specific questions appear
4. Progress bar updates as you fill fields

### Test Error Handling
1. Try invalid position code: `formulario-lider.html?position=INVALID`
2. Should show error banner

## Real vs Demo Mode

### Demo Mode (localhost):
- 🎭 Purple banner visible
- 🔧 Console shows "Demo Mode" logs
- ✅ Forms submit successfully
- 📝 All operations simulated

### Production Mode:
- 🚫 No banner
- 🔐 Requires real authentication
- 💾 Saves to actual Supabase database
- 📧 Sends real emails

## Disable Demo Mode

Click "Disable Demo" button in banner, or:
```javascript
localStorage.setItem('talent-platform-demo', 'false');
location.reload();
```

## Troubleshooting

### Forms don't submit?
- Check browser console for errors
- Ensure demo mode banner is visible
- Verify all required fields are filled

### Leader form doesn't load position?
- Use valid position code (POS_DEMO01, POS_DEMO02, POS_DEMO03)
- Or create new position through HR form first
- Check console for position loading logs

### Demo mode not activating?
- Verify you're on localhost:8000
- Check that localStorage allows demo mode
- Refresh page if needed

## Next Steps

Now that local testing works, you can:
1. **Test complete workflows** end-to-end
2. **Validate form behavior** without database
3. **Debug UI issues** with real interactions
4. **Demonstrate functionality** to stakeholders

When ready for production, just deploy to your live domain and demo mode will automatically disable! 🚀