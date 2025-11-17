# Partner Progression System Implementation Guide

## ✅ Completed

1. **Database Schema** (`supabase/migrations/add_partner_progression_system.sql`)
   - Added `current_xp` and `current_rank` to sellers table
   - Created `partner_lessons`, `partner_quiz_results`, `partner_activity_log` tables
   - Created `automation_suggestions`, `partner_case_studies`, `deal_tracking` tables
   - Added `is_demo` flag to clients table
   - Added `custom_sales_script` to sellers table
   - Created XP and rank management functions
   - Created triggers for automatic XP rewards

2. **Lessons Data** (`supabase/migrations/insert_partner_lessons.sql`)
   - All 21 lessons/quizzes/tasks for 6 stages inserted
   - Stage 1: 4 items (Welcome course, Profile setup, Rules course, Automation preview)
   - Stage 2: 3 items (Understanding automations course, Matching game, Suggestion form)
   - Stage 3: 3 items (Sales basics course, Sales script task, Deal diary task)
   - Stage 4: 4 items (Client management course, Demo client, Demo automation, Reflection)
   - Stage 5: 4 items (Close deals course, Real client, Real automation, First sale, Case study)
   - Stage 6: 1 item (Pro onboarding course)

3. **Progression Utilities** (`src/lib/partner-progression.ts`)
   - Rank definitions and thresholds
   - Tab unlock logic
   - Progress calculation functions

4. **PartnerDashboard Updates Started**
   - Added interfaces for progression data
   - Added state variables for lessons, quizzes, deals, etc.
   - Added imports for progression utilities

## 🚧 Remaining Work

### 1. Update fetchSellerData Function
Add to fetch progression data:
```typescript
// Fetch lessons
const { data: lessonsData } = await supabase
  .from("partner_lessons")
  .select("*")
  .order("stage", { ascending: true })
  .order("order_index", { ascending: true });

// Fetch quiz results
const { data: quizResultsData } = await supabase
  .from("partner_quiz_results")
  .select("*")
  .eq("seller_id", seller.id);

// Fetch deal tracking entries
const { data: dealEntriesData } = await supabase
  .from("deal_tracking")
  .select("*")
  .eq("seller_id", seller.id)
  .order("created_at", { ascending: false });

// Set custom script if exists
if (seller.custom_sales_script) {
  setCustomScript(seller.custom_sales_script);
}
```

### 2. Add Progress Banner Component
Insert before the main Card:
```tsx
{/* Progress Banner */}
{sellerData?.current_xp !== undefined && sellerData?.current_rank && (
  <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30 mb-6">
    <CardContent className="pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-primary" />
            <div>
              <h3 className="text-lg font-bold text-primary">
                Rank: {sellerData.current_rank} • {sellerData.current_xp} XP
              </h3>
              <p className="text-sm text-muted-foreground">
                Commission Rate: {sellerData.commission_rate}%
              </p>
            </div>
          </div>
          {getNextRank(sellerData.current_rank) && (
            <>
              <Progress 
                value={calculateProgressToNextRank(sellerData.current_xp, sellerData.current_rank).percentage} 
                className="h-2 mb-1"
              />
              <p className="text-xs text-muted-foreground">
                {calculateProgressToNextRank(sellerData.current_xp, sellerData.current_rank).current} / {calculateProgressToNextRank(sellerData.current_xp, sellerData.current_rank).next} XP to {getNextRank(sellerData.current_rank)}
              </p>
            </>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

### 3. Update Tabs Navigation
Replace TabsList to include new tabs and conditional visibility:
```tsx
<TabsList className="hidden md:grid w-full grid-cols-8 mb-6 h-auto p-1 bg-muted/50 gap-1">
  <TabsTrigger 
    value="getting-started" 
    className="flex items-center justify-center gap-2 data-[state=active]:bg-background"
    disabled={!isTabUnlocked('getting_started', sellerData?.current_rank || 'Recruit')}
  >
    <BookOpen className="w-4 h-4" />
    <span>Getting Started</span>
  </TabsTrigger>
  <TabsTrigger value="overview" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
    <LayoutDashboard className="w-4 h-4" />
    <span>Overview</span>
  </TabsTrigger>
  <TabsTrigger 
    value="clients" 
    className="flex items-center justify-center gap-2 data-[state=active]:bg-background"
    disabled={!isTabUnlocked('clients_real', sellerData?.current_rank || 'Recruit') && !isTabUnlocked('clients_demo', sellerData?.current_rank || 'Recruit')}
  >
    <Building2 className="w-4 h-4" />
    <span>Clients</span>
  </TabsTrigger>
  <TabsTrigger 
    value="automations" 
    className="flex items-center justify-center gap-2 data-[state=active]:bg-background"
    disabled={!isTabUnlocked('automations_view', sellerData?.current_rank || 'Recruit')}
  >
    <Boxes className="w-4 h-4" />
    <span>Automations</span>
  </TabsTrigger>
  <TabsTrigger 
    value="sales-scripts" 
    className="flex items-center justify-center gap-2 data-[state=active]:bg-background"
    disabled={!isTabUnlocked('sales_scripts', sellerData?.current_rank || 'Recruit')}
  >
    <FileText className="w-4 h-4" />
    <span>Scripts</span>
  </TabsTrigger>
  <TabsTrigger 
    value="deal-tracking" 
    className="flex items-center justify-center gap-2 data-[state=active]:bg-background"
    disabled={!isTabUnlocked('deal_tracking', sellerData?.current_rank || 'Recruit')}
  >
    <Target className="w-4 h-4" />
    <span>Deals</span>
  </TabsTrigger>
  <TabsTrigger 
    value="earnings" 
    className="flex items-center justify-center gap-2 data-[state=active]:bg-background"
    disabled={!isTabUnlocked('earnings', sellerData?.current_rank || 'Recruit')}
  >
    <CreditCard className="w-4 h-4" />
    <span>Earnings</span>
  </TabsTrigger>
  <TabsTrigger value="support" className="flex items-center justify-center gap-2 data-[state=active]:bg-background">
    <Ticket className="w-4 h-4" />
    <span>Support</span>
  </TabsTrigger>
</TabsList>
```

### 4. Add Getting Started Tab Content
Add new TabsContent with:
- Accordion showing all lessons for current stage
- Course content display (markdown rendering)
- Quiz modal with questions
- Task completion forms
- XP rewards display

### 5. Add Sales Scripts Tab
- Template selector (3 templates)
- Text editor for custom script
- Save functionality
- Display saved script

### 6. Add Deal Tracking Tab
- Form to log new deals
- Table/list of deal entries
- Filter by status
- Edit/delete functionality

### 7. Add Helper Functions
- `handleCompleteLesson()` - Mark lesson complete, award XP
- `handleSubmitQuiz()` - Grade quiz, award XP
- `handleCompleteTask()` - Complete task, award XP
- `showXPNotification()` - Display floating XP notification
- `handleSaveSalesScript()` - Save custom script
- `handleSubmitDeal()` - Create deal entry
- `handleSubmitSuggestion()` - Submit automation suggestion
- `handleSubmitCaseStudy()` - Submit case study

### 8. Add XP Notification Component
Floating notification that appears when XP is earned:
```tsx
{xpNotification && (
  <div className="fixed top-20 right-4 z-50 animate-bounce">
    <Card className="bg-primary text-primary-foreground border-primary">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          <div>
            <p className="font-bold">+{xpNotification.xp} XP</p>
            <p className="text-sm">{xpNotification.message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)}
```

## 📋 Testing Checklist

- [ ] New sellers start at Recruit rank with 0 XP
- [ ] Completing Course 1 awards 200 XP
- [ ] Completing Profile Setup awards 300 XP
- [ ] Quiz completion awards XP and marks lesson complete
- [ ] Reaching 1000 XP unlocks Apprentice rank and automations tab
- [ ] Reaching 2500 XP unlocks Agent rank and sales scripts/deal tracking tabs
- [ ] Reaching 4500 XP unlocks Partner rank and clients tab (demo mode)
- [ ] Reaching 7000 XP unlocks Verified rank and earnings/leaderboard tabs
- [ ] Reaching 10000 XP unlocks Seller Pro rank
- [ ] Commission rate updates automatically on rank up
- [ ] Tab visibility reflects current rank
- [ ] XP notifications appear when XP is earned
- [ ] Progress bar shows correct percentage
- [ ] Sales script saves correctly
- [ ] Deal tracking entries save and display correctly
- [ ] Automation suggestions submit correctly
- [ ] Case studies submit correctly

## 🎯 Next Steps

1. Complete PartnerDashboard updates (functions + UI)
2. Test all progression flows
3. Add markdown rendering for course content
4. Style XP notifications
5. Add tooltips for locked tabs
6. Test database triggers
7. Verify RLS policies work correctly





