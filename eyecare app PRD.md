# Impact an Eye Every Day — Full Product Requirements Document
## Combined: v1.0 Functional Spec + v2.0 Strategic Expansion
**Version:** 2.0
**Status:** Engineering & Strategy Reference
**Last Updated:** March 2026

---

# PART ONE: FUNCTIONAL SPECIFICATION (v1.0)

## 1. Overview

### 1.1 Product Purpose
Impact an Eye Every Day is a mobile application designed to help patients and their caregivers manage complex medication schedules — with a focus on eye-drop and ophthalmic treatment regimens. The app delivers loud, full-screen medication reminders that fire even when a device is locked or sleeping, tracks adherence, and surfaces educational eye-care content.

### 1.2 Target Users
- **Primary:** Patients managing ongoing eye conditions requiring timed drops (e.g. glaucoma, post-surgical care)
- **Secondary:** Caretakers and family members managing medication on behalf of a patient
- **Tertiary:** Healthcare teams wanting adherence reports

### 1.3 Core Value Proposition
Complex eye-drop schedules are uniquely difficult to follow — multiple drops per day, minimum spacing between drops, and consequences for missed doses. This app removes that cognitive burden by generating conflict-free schedules automatically, delivering unmissable alarms, and giving caregivers and clinicians visibility into adherence.

---

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Reduce missed doses | % of reminders marked Taken | >= 80% adherence in active users |
| Drive caretaker adoption | % of accounts with >= 2 patient profiles | >= 30% within 90 days |
| Engagement | DAU/MAU | >= 40% |
| Content engagement | Stories opened per week per user | >= 2 |
| Donation conversion | % of logged-in users who donate | >= 5% |

---

## 3. User Roles

| Role | Capabilities |
|---|---|
| **Guest** | Read-only Stories & Videos; prompted to sign up for reminders or donations |
| **User / Caretaker** | Full app access; can manage multiple patient profiles |
| **Admin** | Content management, medication DB, user management, donation reporting |

---

## 4. Functional Requirements

### 4.1 Authentication & Onboarding

#### Login / Sign Up
- Login via email or phone + password
- Sign up collects: full name, email (optional), phone, password, preferred language, timezone (auto-detected, editable)
- Consent checkbox required: storage of reminders and donation receipts (links to privacy policy)
- Forgot password flow (standard email/SMS reset)
- Guest mode: view-only access to Stories & Videos; CTA prompts login for reminders and donations

#### First-Run Onboarding (3 steps)
1. Create first patient profile (name, DOB, relationship, preferred language)
2. Optional: add first prescription immediately or defer
3. Notification permission request with explanation — defer allowed, with limited-experience tooltip shown if denied

---

### 4.2 Patient Management

Each user account can hold multiple independent patient profiles.

**Patient profile fields:** name, DOB, avatar, notes, relationship to account owner, preferred language.

Each patient has independent:
- Prescription & reminder schedules
- Adherence reports
- Notification streams (patient name shown on lock-screen alarm)

---

### 4.3 Prescription Management

**Prescription record contains:**
- Uploaded image of prescription (optional)
- One or more linked medications (from DB or custom entry)
- Dosage instructions per medication
- Optional verification by a doctor

**Medication Database (admin-managed):**
- Canonical name, synonyms, brand names
- Primary image, thumbnail, alternative images
- Dosage forms, description, common dosage examples
- Language tags, search keywords
- Verified flag

---

### 4.4 Reminder Scheduling

#### 4.4.1 Scheduling Modes

**1. Fixed Interval**
Input: repeat every [N] [minutes/hours] between [start time] and [end time].
Example: every 2 hours between 08:00 and 20:00 -> instances at 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00

**2. Count-Based**
Input: [X] times separated by [Y] minutes, starting at [Z time].
Example: 5 times, 10 minutes apart, starting 09:00 -> 09:00, 09:10, 09:20, 09:30, 09:40

**3. Specific Times**
User adds/removes individual time pickers. Instances fire exactly as selected.

**4. Custom (Advanced)**
Free-text cron-style expression (power users only).

#### 4.4.2 Common Reminder Settings
- Patient (required if multi-patient account)
- Medication (autocomplete from DB or custom)
- Dosage text (free text)
- Start date & time; optional end date or duration in days/cycles
- Day-of-week checkboxes (default: all)
- DND override toggle
- Alarm sound selection (preview available) + vibration toggle
- Show medication image on alarm toggle
- Snooze: configurable count limit and interval (default: 10 minutes)

#### 4.4.3 Conflict Resolution Engine
1. Minimum spacing rule between any two reminder instances (default: 5 minutes; configurable)
2. Collisions: apply `shift_forward_minimally` — push conflicting instance forward by minimum gap
3. Preserve instance order when shifting
4. If shifted instance crosses day end: attempt backward shift; if impossible, mark "could not schedule" with plain-language explanation
5. User-specified gap between medications honored at highest priority
6. If constraints make scheduling impossible, explain clearly why in plain language

**Example:** 5 x 10 min from 09:00, existing reminder at 09:10, min spacing 5 min -> [09:00, 09:15, 09:25, 09:35, 09:45]

#### 4.4.4 Timezone & DST Handling
- Store schedule definitions in patient timezone (IANA string)
- Convert to UTC for instance storage only
- DST spring-forward: shift instances in skipped hour to first valid time after jump
- DST fall-back: prefer earlier occurrence; surface ambiguity to user

---

### 4.5 Reminder Delivery & Device Behavior

#### Behavioral Requirements
- Fires visibly and audibly when device is locked, screen off, or in DND (if override enabled)
- Full-screen alarm shows: large medication image, name and dosage, action buttons — without requiring device unlock

#### Alarm UI
- Large medication image (cached locally for instant display)
- Medication name and dosage in bold
- Current time display
- Buttons: [Taken] (green), [Snooze 10m] (yellow), [Skip] (gray), [Report Problem] (small)
- Eye-care tip snippet

#### Audio
- Play alarm until user acts or max_alarm_duration (default: 2 minutes)
- DND override on: full volume, bypass silent/DND
- Audio denied: fall back to repeated vibration

#### Snooze
- Reschedules for now + snooze_interval (default 10 min)
- Status -> snoozed; new linked instance created
- Tracked against snooze_limit; button disabled when limit reached

#### Missed Logic
- No action within miss_timeout (default: 30 min) -> status: missed
- Missed badge in UI; added to reports
- Next app open: "You missed N reminders" with undo option for recent misses

#### Device Off
- Physically off: cannot fire; setting explains this limitation plainly
- Next launch: show missed timeline, offer catch-up reminders
- Caretaker push: notify linked devices after X consecutive misses (configurable)

---

### 4.6 Appointment Management
- List view sorted by upcoming date
- Add: patient, doctor, clinic, date/time, notes, reminder rules (multiple per appointment)
- Overlaps within configurable block window trigger shift or user confirmation

---

### 4.7 Stories & Video Content

#### User Feed
- Infinite scroll; thumbnail, title, category tag, language badge, summary per card
- Actions: Play/Read, Bookmark, Share
- On-demand [Translate] button for non-user-language content

#### Admin Pipeline
- Create story: title, body, category, language(s), attachments, thumbnail, scheduled publish datetime, visibility, tags, author, allow comments
- Upload video: title, transcript (manual or auto-generate), duration, language, subtitles
- Translate: upload translations or request auto-translation
- Moderate: Hide, Edit, Publish, Delete
- Medication DB: add/edit, upload images, mark verified

---

### 4.8 Adherence Reports

#### User Reports
- Timeframe: Last 7 days / Last 30 days / Custom
- Per-medication: total scheduled, taken, missed, adherence rate, last missed datetime
- Overall adherence: weighted average across medications
- Missed alerts list with suggested actions
- Audit trail: chronological events with device ID

#### Doctor / Secure Share
- Consent-gated; patient controls and can revoke at any time
- One-click PDF for appointments
- Shareable via secure link or signed PDF download

#### Export Formats
- PDF: charts + per-medication tables, timezone and language included
- CSV: `reminder_instance_id, schedule_id, patient_id, med_name, scheduled_time, action, action_time, device_id`

---

### 4.9 Donations
- Amount presets: $5 / $10 / $20 / $50 / Other
- Frequency: One-time or Monthly
- Confirmation screen before payment
- Success: receipt page, email receipt, donation history entry
- Failure: clear error, retry allowed, pending state if network lost

---

## 5. Offline & Sync
- All user actions queued locally when offline
- FIFO sync on reconnect; prefer latest `updated_at` on conflict
- Sync log visible in Settings

---

## 6. Localization & Accessibility

### Localization
- All UI strings i18n-ready
- Dates/times in patient timezone with label
- Missing translations surface [Translate] button

### Accessibility
- Minimum 44x44px tap targets everywhere
- VoiceOver/TalkBack labels on all elements
- High-contrast theme in Settings
- Large text mode supported
- All alarm actions accessible from lock screen without unlocking

---

## 7. Data Model

| Entity | Key Fields |
|---|---|
| User | id, email, phone, name, role, preferred_language, timezone, notification_settings |
| PatientProfile | id, user_id, name, dob, relationship, preferred_language |
| MedicationDBEntry | id, canonical_name, synonyms, brand_names, images, dosage_forms, verified_flag |
| Prescription | id, patient_id, medications[], source_image_url, parsed_text |
| ReminderSchedule | id, patient_id, scheduling_mode, scheduling_parameters (json), timezone, allow_dnd_override, sound_id, snooze settings |
| ReminderInstance | id, schedule_id, scheduled_time (UTC), status, fired_device_id, action_timestamp |
| Appointment | id, patient_id, appointment_time, reminder_rules[], notes |
| Story | id, title, body_text, language, category, attachments, publish_time, translations[] |
| Donation | id, user_id, amount, currency, frequency, status, receipt_id |
| Tip | id, short_text, category, duration_seconds, recommended_interval_minutes, language |
| Device | id, user_id, push_token, platform, allowed_permissions |

---

## 8. Edge Cases & Operational Rules

| Scenario | Required Behavior |
|---|---|
| DST spring-forward | Shift instances in skipped hour to first valid time after jump |
| DST fall-back | Prefer earlier occurrence; surface ambiguity to user |
| Two reminders < min_spacing | Shift forward; if crossing day end shift backward; if impossible mark unschedulable with plain-language explanation |
| Appointment overlap | Shift reminder or ask user to confirm within configurable block window |
| Device powered off | Cannot fire; show missed timeline and offer catch-up on next launch |
| Permissions revoked | Surface in-app guidance with step-by-step re-enable instructions |
| Network lost during donation | Mark as pending; retry with user permission on reconnect |
| Missed N reminders in a row | Push notification to linked caretaker device (if configured) |

---

## 9. Acceptance Criteria

### Feature Checklist
- [ ] Login / Sign Up end-to-end; language saved and applied globally
- [ ] Guest mode restricts to Stories only; prompts login for reminders and donations
- [ ] Create patient; multi-patient switching functions independently
- [ ] Prescription: manual entry + image upload; medication DB linking shows image
- [ ] Interval mode: "every 2 hours, 08:00–20:00" generates exactly 7 instances per day
- [ ] Count-based: "5 times, 10 min apart, 09:00" generates exactly 5 instances
- [ ] Specific times: fires at exactly the times selected
- [ ] Conflict preview flags collisions; impossible cases surface plain-language explanation
- [ ] Alarm wakes screen, shows image, plays sound, presents Taken/Snooze/Skip
- [ ] Alarm actionable from lock screen without unlock
- [ ] Snooze reschedules correctly; limit disables button when reached
- [ ] Missed marking fires after miss_timeout; appears in reports
- [ ] DND override: alarm plays if on; silent/vibration only if off
- [ ] Admin: future-scheduled story hidden until publish time, then visible to target language users
- [ ] Adherence calculation matches test dataset ground truth
- [ ] Donations: flow completes, receipt generated, failure handled gracefully
- [ ] Offline: create reminder offline -> syncs on reconnect, no data loss
- [ ] DST transition: instances generated correctly on transition days
- [ ] Device off: missed instances recorded with note on next launch

### QA Test Cases
1. "Every 2 hours 08:00–20:00" for 3 days -> verify 7 instances per day (21 total)
2. 5x10 min from 09:00 with existing reminder at 09:10, min spacing 5 min -> verify [09:00, 09:15, 09:25, 09:35, 09:45]
3. Locked device: verify full-screen alarm fires and Taken markable without unlock
4. Future-scheduled video: verify hidden until publish time, then visible to target language users
5. DND on: verify alarm sounds with override on; silent/vibration only with override off
6. Two drops 1 min apart, min spacing 5 min: verify plain-language decline
7. Create reminder offline, reconnect: verify on server, no duplicates
8. Daily reminder at 02:30 through spring-forward DST: verify instance shifts to first valid time

---

# PART TWO: STRATEGIC EXPANSION (v2.0)

## Vision

Eye disease is the world's leading cause of preventable blindness. Adherence rates globally sit below 50% — the bottleneck is not medicine, it is behaviour, information, and access. This platform can change that.

---

## Part A — Intelligence Layer

### A1. Smart Schedule Optimiser
Track delta between scheduled and actual action times over 2 weeks. Surface weekly "Schedule Health" card with suggested adjustments based on behaviour patterns. Compute globally optimal slot assignments for multi-drop patients. Never auto-change without explicit user approval.

New data needed: `action_timestamp` vs `scheduled_time` delta, day-of-week patterns, patient timezone activity windows.

### A2. Prescription OCR & AI Parsing
On-device OCR extracts prescription text; AI parsing matches medication names to DB, identifies dosage/frequency/duration, pre-fills reminder creation form. User reviews and confirms every field. Low-confidence fields highlighted in amber. Strict image retention limits.

### A3. Symptom & Side-Effect Journal
**Entry fields:** vision quality (5-point scale), eye comfort (multi-select from curated list), side effects (free text + quick-select per medication), overall wellbeing (1–5), optional eye photo.

**Intelligence:** Correlate entries with adherence data. Flag unusual clusters: "You've reported burning after instillation 4 days in a row — worth mentioning to your doctor." Journal export becomes a clinical document for appointments.

### A4. AI Eye Care Assistant ("Ask")
Grounded Q&A from a clinician-reviewed knowledge base.

**In scope:** General eye health, drop technique, condition education, nutrition for eye health.
**Out of scope:** Diagnosis, prescription advice, emergency assessment.

Every answer cites its source and includes: "This is not medical advice." No freeform generation of clinical information.

### A5. Instillation Coaching
Short technique videos per drop type (standard, gel, ointment, punctal occlusion). Prompted after first few Taken marks. Optional "did the drop land?" feedback toggle logged over time. Future V3: camera-based real-time feedback (requires clinical validation).

---

## Part B — Caregiver & Clinical Ecosystem

### B1. Caregiver App Mode
Patient-first dashboard: each patient card shows photo, today's adherence traffic light (green/amber/red), next reminder, quick-mark-taken. Unified daily timeline across all patients. Morning summary push notification. Caregiver-specific alerts: consecutive misses, device offline, weekly adherence drop.

### B2. Clinic & Doctor Portal (Web)
Consent-gated, read-only web portal per patient. Shows: adherence timeline (30/90 days), symptom journal summary, missed-dose patterns by time of day and day of week, one-click appointment PDF. Data is read-only for clinicians. Patient controls access and can revoke instantly.

### B3. Remote Patient Monitoring
Clinician sets monitoring flag and adherence threshold. Drop below threshold in any 3-day window triggers care coordinator alert. Daily digest to care team (with patient consent). Clear in-app patient disclosure about what is shared and why.

### B4. Pharmacy Integration
Calculate estimated run-out from dispensed quantity and frequency. Alert 7 days before. "Order refill" deep link to preferred pharmacy. Flag dosage changes between prescription uploads.

**New entity fields:** `dispensed_quantity`, `dispensed_date`, `days_supply`, `estimated_run_out_date`

---

## Part C — Patient Experience & Engagement

### C1. Streak & Consistency Tracking
Daily adherence streak counter. Weekly consistency score with trend arrow. Quiet milestones at 7, 30, 90, 180 days. Streak protection: if one day is missed on a 60+ day streak, ask once "Did you actually take this but forget to mark it?"

**Design principle:** Supportive coach, not disappointed parent. No leaderboards. No social comparison. No shame indicators for missed doses.

### C2. Personalised Education Pathways
Admin creates condition-specific 8-part learning journeys (glaucoma, diabetic retinopathy, macular degeneration, dry eye, post-surgical, caregiver). App suggests relevant pathway when a matching medication is added. Progress tracked quietly. Not mandatory — "here if you want it."

### C3. Tip Engine (Upgraded)
**Categories:** 20-20-20 reminders, blink reminders, post-instillation tips ("keep eye closed 2 minutes after drops"), lifestyle tips (sleep position, UV protection, nutrition), emotional support.

**Smart timing:** Post-instillation tips fire ~2 minutes after Taken mark. Eye strain tips at configurable screen-time intervals (opt-in). All tips admin-curated and clinically reviewed.

### C4. Emergency & Urgent Guidance
Persistent help button on home screen. Covers: wrong drop instilled, severe pain/redness/swelling, foreign body, extended missed doses. Immediate first steps + direction to appropriate care level. Triage only — not medical advice. This feature could prevent serious harm.

### C5. Multilingual Voice Interface
Voice commands: Taken/Snooze/Skip during drop instillation (no tapping required). Voice logging: "I just took my latanoprost." Text-to-speech for tips and articles. "Read alarm aloud" accessibility setting announces medication name and dosage audibly.

---

## Part D — Community & Research

### D1. Community Forum (Moderated)
Condition-specific channels, caregiver channel, new diagnosis welcome space. Volunteer patient moderators + paid admin moderation. No medical advice permitted. Community-submitted tips moderated before entering tip engine. Peer support is one of the strongest evidence-based adherence drivers.

### D2. Research Participation Programme
Opt-in per-dataset with clear disclosure of what is shared. De-identified aggregated adherence data available to research partners via API (IRB required). Independent data ethics board + patient advisory panel with veto power. Annual transparency report published publicly. GDPR, HIPAA, and local equivalent compliance from day one — not retrofitted.

### D3. Awareness Campaigns & Impact Giving
Time-bounded campaigns with live goal counter. Patient stories tied to campaigns. Donor wall (opt-in). Corporate matching UI. Impact receipts: "Your contribution provides 6 months of reminders for a patient who couldn't afford care."

---

## Part E — Platform & Growth

### E1. Wearable Integration
Apple Watch / WearOS: wrist reminders, mark taken without touching phone, watch face complications for next reminder time. Smart display integration (Alexa Echo Show, Google Nest Hub): voice announcement and voice mark-taken in the home. Particularly valuable for elderly patients or those with mobility limitations.

### E2. HL7 FHIR Integration (R4)
Pull active prescriptions from connected EHR (patient-consented). Push adherence records as FHIR Observations. Hospital discharge use case: drops prescribed -> app auto-populated before patient leaves the building. Formulary compliance alerts.

**Priority EHR systems:** Epic, Cerner, EMIS, Systm1 (confirm with team).

### E3. White-Label & Institutional Licensing
License to: hospital systems (branded as their own), pharmaceutical companion apps (strict no-promotional guardrails), NGOs at subsidised/free tier, national health programmes with aggregate population-level reporting for ministries of health.

### E4. Offline-First for Low-Connectivity Markets
Scheduling engine runs entirely on-device. Content pre-downloaded on Wi-Fi. SMS fallback reminders for users without smartphones. USSD interface for feature phones: mark taken, check next reminder, emergency guidance via basic mobile code.

### E5. Connected Device & Clinical Trial Integration
**Connected devices:** Bluetooth-enabled eye drop bottles — auto-mark Taken when opened near reminder time, dosage counter synced to refill alerts.

**Clinical trial support:** Protocol-adherence tracking with regulatory-grade audit trails, eClinical export formats, 21 CFR Part 11 compliance.

---

## Part F — Business & Sustainability

### F1. Freemium Tier Structure

| Feature | Free | Premium (£3.99/mo) | Clinic (per-seat) |
|---|---|---|---|
| Reminders (1 patient, 3 medications) | Yes | Yes | Yes |
| Stories & education content | Yes | Yes | Yes |
| Basic adherence reports | Yes | Yes | Yes |
| Unlimited patients | No | Yes | Yes |
| Unlimited medications | No | Yes | Yes |
| AI schedule optimiser | No | Yes | Yes |
| Symptom journal | No | Yes | Yes |
| Doctor sharing | No | Yes | Yes |
| Refill reminders | No | Yes | Yes |
| Education pathways | No | Yes | Yes |
| PDF reports | No | Yes | Yes |
| Community forum | No | Yes | Yes |
| Caregiver mode | No | Yes | Yes |
| Wearable sync | No | Yes | Yes |
| Clinic portal | No | No | Yes |
| FHIR integration | No | No | Yes |
| Audit-grade exports | No | No | Yes |

**Patient Access Programme:** Self-certify for Premium at no cost. No proof required. Goal is access, not enforcement.

### F2. Impact Metrics (Published Annually)
- Total doses tracked (aggregate, all-time)
- Estimated doses not missed due to app reminders
- Number of patients in low-income countries accessing the app
- Number of clinician-patient adherence conversations enabled (proxy: secure share uses)
- Research publications enabled by platform data
- Donation impact: patients subsidised, amount raised, projects funded

---

## Phasing Recommendation

### Phase 1 — Foundation (Months 1–6)
Core scheduling, reminders, content, reports, donations. Alarm reliability is non-negotiable.

### Phase 2 — Intelligence & Caregivers (Months 6–12)
Prescription OCR parsing, symptom journal, caregiver mode, smart schedule optimiser, tip engine upgrade, refill reminders, Apple Watch integration.

### Phase 3 — Clinical Ecosystem (Months 12–18)
Doctor portal, research programme consent infrastructure, FHIR integration, AI assistant (limited scope), community forum.

### Phase 4 — Platform & Scale (Months 18–30)
White-label licensing, clinical trial support, wearable device partnerships, USSD/SMS for low-connectivity markets, institutional sales.

---

## Design Principles (Full)

- **Design for forgetting.** Every feature assumes the user is distracted, tired, or anxious. Nothing requires memory or planning effort.
- **Design for dignity.** Missed doses are not moral failures. Language is always supportive, never shaming.
- **Design for the caregiver's guilt.** Surface what caregivers did do, not just what was missed.
- **Design for the newly diagnosed.** Acknowledge fear at onboarding for patients matching high-anxiety medication profiles.
- **Design for imperfect hands.** Tremor, arthritis, low vision — generous tap targets, voice as first-class interface, nothing critical requiring precise motor control.
- **Huge primary actions.** [Taken], [Snooze], [Skip], [Add] must have large tap areas and be immediately obvious.
- **Redundant urgency cues.** Color + icon + label for every critical state — never icon-only.
- **Minimal motion.** Micro-feedback on action is good; animation for animation's sake is not.

---

## Open Questions

1. What clinical advisory board reviews AI assistant answers and tip content? Who has veto power?
2. Which FHIR-enabled EHR systems are priority? (Epic, Cerner, EMIS, Systm1?)
3. What is the ethical governance model for the research programme? Patient advisory panel from day one?
4. Which languages are priority for V1 localisation beyond English?
5. Is there a clinical validation study planned? Design it now so the app collects the right data from launch.
6. Who are the first community forum moderators? Recruit patient advocates before launch?
7. What is the regulatory classification in key markets? (MDR in EU, UKCA in UK, FDA SaMD in US — affects what the AI assistant can say.)
8. Is the donation infrastructure already set up, or does the payment gateway need to route to a new entity?
9. What payment gateway for donations? (Stripe, Braintree, local?)
10. What push notification infrastructure? (FCM, APNs, OneSignal?)