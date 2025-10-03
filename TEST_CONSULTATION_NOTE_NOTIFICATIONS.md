# Test Consultation Note Notifications

## Issue: Consultation Note Notifications Not Showing

### Problem
When creating consultation notes for patients (e.g., nvtarakanadh@gmail.com), notifications are not being generated.

### Solution Implemented
Added notification creation to the `createConsultationNote` function in `src/services/prescriptionService.ts`.

### Testing Steps

#### Step 1: Check Browser Console
1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Create a consultation note** as a doctor
4. **Look for these console logs:**
   ```
   Creating consultation note notification: {patientUserId: "...", patientProfileId: "...", doctorName: "...", noteTitle: "..."}
   Consultation note notification created: "notification-id"
   ```

#### Step 2: Test Consultation Note Creation
1. **Login as a doctor**
2. **Go to Doctor Dashboard** → **Consultation Notes**
3. **Click "Create New Note"**
4. **Fill in the form:**
   - Select patient: `nvtarakanadh@gmail.com`
   - Title: `Test Consultation Note`
   - Description: `Test description`
   - Diagnosis: `Test diagnosis`
   - Recommendations: `Test recommendations`
   - Follow-up required: Yes
   - Follow-up date: Tomorrow
   - Consultation date: Today
5. **Click "Create Note"**
6. **Check console for notification logs**

#### Step 3: Verify Notification Creation
1. **Login as the patient** (nvtarakanadh@gmail.com)
2. **Check notification bell** in the header
3. **Look for notification:**
   - Title: "New Consultation Note"
   - Message: "You have a new consultation note 'Test Consultation Note' from [Doctor Name]"
   - Type: consultation_note_created

#### Step 4: Test Navigation
1. **Click on the consultation note notification**
2. **Verify you're taken to** `/consultation-notes`
3. **Check if the consultation note is visible**

### Debug Information

#### Console Logs to Look For:
```
Creating consultation note notification: {
  patientUserId: "uuid",
  patientProfileId: "uuid", 
  doctorName: "Dr. Name",
  noteTitle: "Test Consultation Note"
}
Consultation note notification created: "notification-id"
```

#### If No Logs Appear:
- Check if patient profile exists
- Check if patient has a user_id
- Check for errors in console

#### If Notification Not Created:
- Check database permissions
- Check RLS policies
- Check notification service errors

### Database Verification

#### Check if notification was created:
```sql
SELECT * FROM notifications 
WHERE type = 'consultation_note_created' 
ORDER BY created_at DESC 
LIMIT 5;
```

#### Check consultation note:
```sql
SELECT cn.*, p.full_name as patient_name, d.full_name as doctor_name
FROM consultation_notes cn
LEFT JOIN profiles p ON cn.patient_id = p.id
LEFT JOIN profiles d ON cn.doctor_id = d.id
ORDER BY cn.created_at DESC
LIMIT 5;
```

### Common Issues

#### Issue 1: "Failed to get patient user for notification"
**Cause:** Patient profile doesn't have a user_id
**Solution:** Check if patient profile is properly linked to auth user

#### Issue 2: No console logs
**Cause:** Notification creation code not being called
**Solution:** Check if createConsultationNote function is being called

#### Issue 3: Notification created but not visible
**Cause:** RLS policies or user authentication issue
**Solution:** Check RLS policies and user authentication

### Test Data Creation

If you need to create test data:

```sql
-- Create test consultation note
INSERT INTO consultation_notes (
    patient_id,
    doctor_id,
    title,
    description,
    diagnosis,
    recommendations,
    follow_up_required,
    follow_up_date,
    consultation_date
) VALUES (
    (SELECT id FROM profiles WHERE email = 'nvtarakanadh@gmail.com'),
    (SELECT id FROM profiles WHERE role = 'doctor' LIMIT 1),
    'Test Consultation Note',
    'Test description',
    'Test diagnosis',
    'Test recommendations',
    true,
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE
);
```

### Expected Behavior

1. **Doctor creates consultation note** → Console shows notification creation logs
2. **Patient receives notification** → Notification appears in bell icon
3. **Patient clicks notification** → Navigates to consultation notes page
4. **Consultation note is visible** → Patient can see the note details

### Files Modified

- `src/services/prescriptionService.ts` - Added notification creation to createConsultationNote
- `src/services/notificationService.ts` - Already had createConsultationNoteNotification function

### Next Steps

1. **Test the flow** as described above
2. **Check console logs** for debugging information
3. **Verify notification appears** for the patient
4. **Test navigation** by clicking the notification

If notifications still don't appear, check the console logs and database to identify the specific issue.
