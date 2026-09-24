# Build prompt: Bassera بصيرة — landing page and financial wellness portal

Use this prompt to build a **responsive web version of the existing Bassera mobile app**, plus a new public marketing landing page. Treat the current mobile implementation as the product reference, not as evidence that unimplemented backend features already exist. The result should feel like the same brand and support the same journeys on desktop, tablet, and mobile web.

## Product brief

Bassera بصيرة is a bilingual (English/Arabic) financial wellness experience focused on understanding the emotions behind spending, forming better habits, setting savings goals, and receiving guided financial insights. Its core concepts are **Money Personality** and **Emotional Financial Intelligence (EFI)**. The current app uses EGP examples and refers to Egypt/GCC markets. Use the name **Bassera بصيرة**, not MindWealth AI, in new marketing UI.

**Deliver:** a public landing page; onboarding/assessment; a signed-in-style portal with Home, Coach, Insights, Goals, and Profile; transaction and receipt entry; plan comparison; English/Arabic localization; responsive and accessible UI. Preserve existing behavior where specified, and make demo-only capabilities unmistakable. Do not invent live banking, AI, payments, or authentication.

### Source of truth in the existing project

- Mobile screens: `artifacts/mobile/app/onboarding.tsx`, `app/(tabs)/index.tsx`, `coach.tsx`, `insights.tsx`, `goals.tsx`, `profile.tsx`, `app/personal-info.tsx`, `app/upgrade.tsx`.
- Forms: `artifacts/mobile/components/AddExpenseModal.tsx`, `AddReceiptModal.tsx`.
- English/Arabic copy: `artifacts/mobile/localization/en.ts`, `ar.ts`. Use these dictionaries for portal screen copy and provide translations for every *new* landing-page string.
- Colors: `artifacts/mobile/constants/colors.ts`; seeded state and current local behavior: `artifacts/mobile/context/AppContext.tsx`.
- Graphics: existing app icon and splash assets in `artifacts/mobile/assets/images/`. Reuse appropriately; do not replace the logo with an unrelated financial brand.

## Visual and interaction direction

- **Personality:** trustworthy financial guidance with an optimistic, approachable AI feel. Spacious light portal surfaces with premium dark-gradient feature areas. Avoid generic stock trading dashboards and bank impersonation.
- **Typography:** Inter, regular/medium/semibold/bold. Arabic must use a legible Arabic-compatible fallback or paired font; do not force Latin Inter glyphs onto Arabic text.
- **Palette:** light background `#F8FAFC`; white cards `#FFFFFF`; foreground `#111827`; border `#E2E8F0`; indigo `#2E3192`; purple `#92278F`; orange `#F37021`; positive green `#22C55E`; amber `#F59E0B`; danger red `#EF4444`. Dark areas use `#0B1026`, `#1A1040`, `#2E3192`; dark card `#161B35`. Prefer navy-to-purple gradient headers and indigo→purple→orange highlights/CTAs.
- **Components:** 16–20px rounded cards, restrained shadows, gradient highlight cards, score/progress rings, metric chips, progress bars, clear empty/error/loading states, keyboard-accessible dialogs/drawers.
- **Navigation:** on wide screens, a left sidebar with Bassera branding and five primary destinations; on narrow screens, a five-item bottom navigation like the mobile app. Use page titles, active indicators, and visible account/language access. Keep an obvious path back to the public site and to the portal.
- **Responsive:** max-width content with a logical grid on desktop; readable stacked cards on mobile. Charts and plan cards must not overflow at 375px. Modals should become full-width bottom sheets or full screens on small devices. Support reduced motion, visible focus styles, semantic headings, descriptive buttons, and sufficient contrast.
- **Data presentation:** financial amounts show currency (EGP) and signs; do not mirror numbers, progress direction, or chart meaning simply because the page is RTL.

## Routes / information architecture

Suggested URLs (adapt to the framework without changing the journeys):

| Route | Purpose |
| --- | --- |
| `/` | Public landing page |
| `/start` | Intro slides, email/name and Money Personality assessment |
| `/portal` | Home dashboard |
| `/portal/coach` | AI coach demo chat |
| `/portal/insights` | EFI, forecast, nudges, anomalies |
| `/portal/goals` | Savings goals and achievements |
| `/portal/profile` | Profile, plan, settings and sign out |
| `/portal/profile/personal-info` | Personal information form |
| `/portal/upgrade` | Plan comparison and upgrade demo |
| fallback | Branded localized not-found page with a home link |

## 1. Public landing page — new web-only experience

This is **new**: the existing `artifacts/mobile/server/templates/landing-page.html` is a generic Expo preview/download page, not Bassera's marketing site. Build a proper, bilingual Bassera landing page:

1. **Header:** logo/name, anchors for How it works, Features, Insights, Pricing, FAQ, language switch (English / العربية), and strong “Get Started” CTA. On mobile use an accessible menu.
2. **Hero:** headline based on the mobile slogan, “Understand your money by understanding yourself”; subheading explaining Money Personality, EFI, personalized financial guidance, and savings habits; primary CTA “Discover Your Money Personality” → `/start`; secondary CTA “Explore the Portal” → `/portal` if demo access is intended. Show an authentic portal/dashboard visual built from the real UI and brand palette, not an invented bank account balance. A small label can say “Explore the demo.”
3. **How it works:** four steps matching mobile onboarding: understand your Money Personality; track emotional financial intelligence; meet your AI financial coach; build better financial habits. Reuse/adapt the exact onboarding subtitles below.
4. **Feature overview:** wellness score + mood check-in, manual expenses and receipt *demo*, insights/EFI and forecast *demo*, goal tracking, coach *demo*. CTA links to the corresponding portal screen; mark simulated features clearly.
5. **Money Personality preview:** five profile types (Vigilance, Worship, Status, Avoidance, Obligation) with a short explanation and a CTA to take the four-question assessment. Do not imply a clinical diagnosis.
6. **Insights preview:** show an example EFI breakdown and savings vs. spending chart labeled **illustrative demo data**. Explain that EFI describes emotional patterns and is not a credit score or investment recommendation.
7. **Pricing:** Free, Premium, Premium+ cards using the plan prices/features below. State clearly that checkout is not active in this version; do not present a working payment button.
8. **FAQ:** concise questions covering what Money Personality/EFI mean, whether banking is connected (no), whether receipt scanning is real (no, simulated in this version), whether data is stored locally, available languages, and whether paid subscriptions are active (no).
9. **Footer:** Bassera بصيرة, product links, language selector, privacy/support links. Do not fabricate legal policies, testimonials, ratings, download links, or support contact details. Only show actual verified links; if unavailable, use a plainly marked informational section instead of a dead link.

Every section and CTA must have a real destination or an explicit “Coming soon” explanation. Translate all marketing copy into natural Arabic, not raw machine-translated fragments.

## 2. Onboarding and Money Personality journey

### Intro

Recreate the dark navy/purple animated splash with Bassera logo, subtle particles/rings, and the slogan **“Understand your money by understanding yourself.”** Allow tap/click or a short automatic transition. Respect reduced-motion settings.

Four swipe/clickable intro slides with Skip / Next / Get Started:

1. **Understand Your Money Personality** — “Discover why you spend, save, and make financial decisions the way you do.”
2. **Track Your Emotional Financial Intelligence** — “Understand the emotions behind your financial behavior and decisions.”
3. **Meet Your AI Financial Coach** — “Receive personalized coaching, insights, and recommendations — 24/7.”
4. **Build Better Financial Habits** — “Develop saving habits and long-term financial confidence, one day at a time.”

### Identity and assessment

- Show “Welcome to Bassera”; ask for email/mobile, then name (“What should we call you?”). The existing mobile app uses only a **local email list** to distinguish an existing entry from a new one. The Apple/Google/Facebook buttons are not production OAuth; do not claim secure sign-in unless a real authentication integration is added.
- Show **Money Personality Assessment**, “Question {current} of 4”, one answer per question, progress, and back/next behavior. Use the exact questions and scoring:

| # | Question | Options → score |
| --- | --- | --- |
| 1 | When you receive unexpected money, what's your first instinct? | Spend it on something I've wanted → Worship +2; Save it immediately → Vigilance +2; Buy something to impress others → Status +2; Feel guilty and donate it → Avoidance +2 |
| 2 | How do you feel when discussing money with family? | Anxious — I prefer not to talk about it → Avoidance +2, Vigilance +1; Obligated to help everyone financially → Obligation +2; Open and comfortable → Vigilance +1; It shows who has power → Status +2 |
| 3 | What does financial success mean to you? | Having enough to never worry again → Worship +2; Living below my means, always saving → Vigilance +2; Driving a luxury car and nice home → Status +2; Being free from financial ties → Avoidance +2 |
| 4 | When you see something expensive you want, you: | Buy it — I deserve it → Worship +2; Research, wait, then decide carefully → Vigilance +2; Buy it so others see my taste → Status +2; Talk myself out of it, feel relief → Avoidance +1, Obligation +1 |

Pick the highest-scoring type. Keep the existing deterministic tie behavior or define and test a stable tie rule. Show a result card with emoji/color, description, Strength, Watch Out, and **Start My Journey**:

| Type | Visual | Description | Strength | Watch out |
| --- | --- | --- | --- | --- |
| Money Vigilance | 🛡️ indigo | Careful, responsible and private about money; believes in saving and preparation | Excellent at saving and financial security | May avoid spending even on important needs |
| Money Worship | ✨ orange | Believes money can solve problems and create happiness; works hard to earn more | High financial motivation and ambition | Prone to overspending or compulsive buying |
| Money Status | 👑 purple | Equates money with success and social status | Driven to achieve financial milestones | Spending to impress rather than fulfill |
| Money Avoidance | 🌿 green | Finds money stressful and prefers to ignore financial matters | Less materialistic, values experiences | May neglect important financial planning |
| Money Obligation | 🤝 amber | Feels responsible to provide for and support others financially | Generous and family-oriented with money | May sacrifice own financial wellbeing |

Finishing enters Home. Profile's Retake action must request confirmation, then re-run the assessment and update the displayed personality.

## 3. Home / wellness dashboard

- Personalized greeting by time of day (“Good morning/afternoon/evening, {name}”), notifications icon/badge, profile avatar/initial.
- **Mood check-in:** “How are you feeling today?” options Great 😄, Good 🙂, Okay 😐, Stressed 😰, Anxious 😟; selected state updates visibly.
- **Your Wellness Overview:** gradient featured card with Financial Wellness Score `72/100` by default, monthly change, Savings Rate `18%`, Debt Ratio `Low`, Habit Score `Good`. Supporting EFI `68` and Confidence `75` score cards. These scores are seeded illustrative values; do not imply they are computed from live bank data.
- **Today's Insight:** “You saved 12% more this week. Reducing coffee spending by 20% could add 300 EGP to your Emergency Fund.” Present as demo guidance.
- **Quick Actions:** Coach, Expense, Receipt, Goals, Insights. All link to real screens or open working dialogs.
- **Smart Nudges:** savings encouragement, impulse-spending reminder, and “Great progress toward your Emergency Fund. 62% complete!” Label illustrative nudges if not generated from user data.
- **Recent Transactions:** signed EGP amount, merchant/title, category, relative date, icon and empty state. Seed examples: Morning Coffee −85 (Food & Drink, Today), Salary Deposit +15,000 (Income, Yesterday), Online Shopping −420 (Shopping, 2 days ago), Gym Membership −200 (Health, 3 days ago), Freelance Payment +3,500 (Income, 4 days ago). “See All” should lead to a transaction view/list, not a dead end.
- **Goals preview:** progress for Emergency Fund and a link to Goals.

## 4. Add transaction and receipt journey

### Manual entry

Expense/Income toggle → EGP amount entry (numeric keypad on mobile, accessible number input on desktop) → category selection → Next → optional title/note and emotion tag → Save. Reject missing category or amount ≤ 0 with a translated validation message. Save with correct positive/negative sign and timestamp, show immediately in Recent Transactions, and persist on refresh.

Example categories: Food & Drink, Shopping, Transport, Housing, Health, Fun, Education, Bills, Savings, Travel, Family, Other; income examples Salary, Freelance, Investment, Gift, Rental. Emotions include Planned, Impulse, Routine, Stressed, Reward, Regret. Translate labels but store stable category/emotion identifiers rather than language-specific text.

### Receipt demo

“Scan Receipt” screen with camera/receipt viewfinder and “Enter manually instead.” In the mobile app **OCR is simulated**: it cycles through “Reading receipt”, “Detecting items”, “Auto-categorizing”, “Calculating totals”, then displays a mock itemized receipt. Example demo sets: Costa Coffee (Espresso × 2, Croissant, Sandwich), Uber (Taxi Ride, Toll Fee), H&M (T-Shirt, Shoes, Jeans), with a Carrefour mock variant if implemented. Let users inspect items, adjust categories, choose a feeling, then save the items as separate expense transactions. Clearly label the scan as a **demo**; do not request camera access or claim OCR unless actually implemented.

## 5. Coach

Header “Bassera AI Coach”, online indicator, “Personalized for you”; conversational bubbles, welcome message addressing `{name}`, typing state, suggested question chips, multiline “Ask your AI coach...” input (500-character limit), Enter/send button and auto-scroll.

Suggested prompts:

- Why do I overspend?
- Help me save for a car
- Analyze my spending
- How to reduce debt?
- What is my money personality?
- Build an emergency fund

The existing coach is **not a live LLM**: it matches keywords (overspend, save/car, debt, analyze/spending), waits about 1.4 seconds, and returns scripted guidance; otherwise it gives a generic response. Preserve this as a clearly labeled demo unless a genuine AI service is separately specified. Do not present unverified personalized figures as computed facts. Exact English and Arabic scripted answers are in the mobile localization files.

## 6. Insights

Header “Financial Insights — AI-powered patterns from your financial behavior”; score rings for EFI, Wellness, Confidence; four tabs:

- **EFI:** “Emotional Financial Intelligence”, a five-axis radar visualization and breakdown bars: Awareness 72, Confidence 75, Impulse Control 58, Stress Management 64, Planning 80. Risk Indicators: Anxiety Index 32 (Low — within healthy range), Spending Trigger Index 58 (Moderate — monitor weekend patterns), Emotional Stability 74 (Good — consistent over 30 days).
- **Forecast:** Monthly Overview; Savings vs Spending (EGP) Jan–Jun chart; July Predictions by category: Food & Drink 2,800, Shopping 1,600, Transport 750, Bills 1,200 EGP; savings opportunity/coffee-spending callout.
- **Nudges:** cards for Savings opportunity, Cooling-off reminder, and Milestone reached, with icon, concise description and readable priority.
- **Anomalies:** Unusual shopping spike (420 EGP above average), Weekend dining pattern (35% over budget for three weekends), Subscription waste (3 rarely used subscriptions totaling 245 EGP/month), AI confidence and View Details where detail actually exists.

The current charts, predictions, risk indices and anomaly descriptions are **static demo data**, not inferred from user transactions. Label them as examples rather than silently representing them as live analyses. Make charts keyboard/screen-reader accessible and provide textual summaries.

## 7. Savings Goals

- Header “Savings Goals — Build your financial future, one goal at a time.”
- Summary cards: Day Streak (seeded 12), Total Progress (saved vs target), Active Goals.
- Each goal card: icon, title, deadline, saved and target in EGP, percent complete, remaining amount, progress bar, action to add savings. Seed goals:

| Goal | Saved / target | Deadline |
| --- | --- | --- |
| Emergency Fund | 18,500 / 30,000 EGP | Dec 2025 |
| New Car | 45,000 / 120,000 EGP | Jun 2026 |
| Travel Fund | 8,200 / 15,000 EGP | Mar 2026 |
| Education | 12,000 / 50,000 EGP | Sep 2026 |

- Add Goal dialog: name, target amount (EGP), selectable icon/preset (Emergency, Home, Investment, Education, Travel, Health, Car, Savings), submit and validate. Adding savings should update the relevant goal, progress and summary, and persist.
- Achievements: First Save, 7-Day Streak, Emergency Ready initially unlocked; Discipline, Goal Getter, Investor initially locked. Show the first three as demo achievement states rather than inferring real activity.
- “This Week's Challenge”: “Skip 3 impulse purchases and add the savings to your Emergency Fund.”

The mobile demo's sample deadlines may now be past. For a fresh web demo, either label historical samples explicitly or use future illustrative dates; never quietly show an overdue goal as an upcoming target.

## 8. Profile and personal information

- Gradient profile header with avatar/initial, name/email, current plan badge and member-since date. Money Personality card with Retake confirmation. Your Plan card with features and upgrade action.
- Settings:
  - **Account:** Personal Information; Linked Accounts; Payment Methods.
  - **Preferences:** Notifications; Smart Nudges; Dark Mode; Language.
  - **Security:** Change Passcode; Biometric Login; Privacy Settings.
  - **Support:** Help Center; Contact Support; Rate Bassera.
  - **Sign Out:** confirmation; clear the local demo session while retaining the independently stored language preference.
- Personal Information screen: avatar/photo affordance; full name, email address, phone number, country, currency; Save Changes; name-required validation; saved confirmation. **Important:** the mobile screen currently shows a success alert but does not write edited fields back to the shared profile. The portal should actually save edits and persist them. Never imply photo change or biometric support is live if it is not.
- Language selector in Profile: English and العربية. Store preference locally; first visit uses browser language if supported, otherwise English. Switch every screen, navigation label, alert, form, seeded demo label and landing-page text; update document `lang` and `dir`; mirror navigation/row affordances for Arabic. Language survives reload and sign-out. LTR returns when switching to English. Avoid translating user-entered names or notes.
- Toggles should either persist and affect actual UI (dark mode) or be clearly marked demo/coming soon (notifications, nudges, biometrics). Do not show a switch that claims enabled security or alerts when it has no effect.
- Linked bank accounts, payments, passcode, support/contact/rating and photo changes are informational placeholders in the current mobile product. Use explicit coming-soon copy instead of fake working controls or unverified support URLs.

## 9. Upgrade / plan comparison

Dark premium header: “Upgrade Your Financial Journey” / “Unlock the full power of your money personality.” Monthly/Annual toggle with yearly savings, three selectable cards, included/excluded feature lists, highlighted Premium (“Most Popular”), Premium+ (“All-Inclusive”), and responsive CTA.

| Plan | Monthly | Annual | Main inclusions |
| --- | ---: | ---: | --- |
| Free | 0 EGP | 0 EGP | Basic expense tracking; 1 financial goal; weekly EFI snapshot; limited AI coach (5 messages/day) |
| Premium | 150 EGP | 1,440 EGP | Unlimited expense tracking; up to 10 goals; full EFI dashboard; unlimited AI coach; receipt scanning & OCR; weekly behavioral report |
| Premium+ | 400 EGP | 3,840 EGP | Everything in Premium; certified one-on-one advisor; investment portfolio; unlimited goals; priority support; family account (up to 5); tax hints |

The mobile checkout is **only an alert saying payment integration is coming soon**. The portal must not collect cards, charge money, modify entitlements, or assert that premium features are available. Make the pricing clearly illustrative and show “Payments coming soon” on the action until a separate real commerce implementation exists. Do not reuse “Secure payment” or “Cancel anytime” claims for a nonexistent checkout.

## Data and implementation boundaries

Current mobile models:

```ts
type PersonalityType =
  | 'Money Vigilance' | 'Money Worship' | 'Money Status'
  | 'Money Avoidance' | 'Money Obligation' | null;

type Profile = {
  name: string; email: string; personalityType: PersonalityType;
  subscription: 'free' | 'premium' | 'premium_plus';
  joinDate: string; wellnessScore: number; efiScore: number; confidenceScore: number;
};
type Transaction = {
  id: string; title: string; category: string; amount: number; date: string;
  type: 'expense' | 'income'; emotionTag?: string;
};
type Goal = {
  id: string; title: string; target: number; current: number;
  icon: string; deadline: string; color: string;
};
```

Use local browser storage for the demo unless a real backend/auth/storage scope is explicitly added. Persist profile, onboarding result, language, theme, mood, goals, and transactions reliably. The existing mobile app stores state in AsyncStorage (`@mindwealth_state`, `@mindwealth_accounts`, and separately `@bassera_language`), but **currently does not persist all added transactions/moods**; do not reproduce accidental data loss in the portal. Seed demo data once and do not duplicate it on every refresh. Keep stable IDs, validate input, and make sign-out behavior explicit.

The existing API server currently has only a health endpoint; **no banking, user auth, AI, OCR, insight computation, or payment endpoints exist**. This prompt does not authorize building these external integrations or presenting mocked output as live. If future work adds them, first define security, consent, privacy, API, and billing requirements separately.

## End-to-end journeys that must work

1. **Visitor → onboarding → portal:** open landing → choose language → Get Started → intro slides → local identity/name → answer four assessment questions → see personality result → Start My Journey → Home; reload retains demo profile and language.
2. **Track spending:** Home → Expense → choose Expense/Income, amount, category, note, emotion → Save → transaction appears immediately and survives refresh. Receipt demo → review mock items → adjust categories → save → transactions appear and survive refresh.
3. **Build a goal:** Home or sidebar → Goals → add a goal → see new card/stat change → add savings → progress changes → refresh retains it.
4. **Explore guidance:** Home → Coach → tap a suggested question or send typed text → see typing state and appropriate scripted response. Insights → switch EFI, Forecast, Nudges, Anomalies; show readable demo indicators.
5. **Personalize:** Profile → edit personal information → save/reopen and verify values; switch Arabic → full RTL localized landing and portal; reload → Arabic remains; switch English → LTR returns; choose dark mode and confirm it actually applies if the control is offered.
6. **Evaluate a plan:** landing Pricing or Profile Upgrade → compare monthly/yearly and Free/Premium/Premium+ → select plan → encounter an honest coming-soon payment state, never a fake charge.
7. **Sign out:** Profile → confirmation → return to public/start state as designed, with language preference preserved and no accidental deletion of unrelated demo data without warning.

## Completion criteria

- Every route works at phone, tablet and desktop widths; no overflow or clipped Arabic labels.
- Every user-facing portal and landing string has an English and Arabic version, including errors, placeholders, tabs, tooltips, modal buttons, seeded demo content, dates and empty states.
- RTL/LTR, stored language, theme, and all functional demo changes behave correctly after reload.
- Keyboard, focus, screen reader labels, semantic charts, and reduced-motion behavior are covered.
- The portal reproduces the mobile feature set **without overstating** real AI, OCR, banks, authentication, payments, advisors or notifications.
- No dead CTAs, fake checkout, silently discarded profile edits, or lost saved transactions.
- Include a short README documenting setup, route map, demo limitations and how to run the web portal.
