# Migration Cleanup Guide

## Important Notes

When editing tasks in `insert_partner_lessons.sql`, ensure you also:

1. **Remove old task data** - Add DELETE statements at the top of the migration to remove deprecated tasks
2. **Clean up related data** - Delete quiz results, activity logs, etc. related to removed tasks
3. **Update retention data** - Check `insert_retention_initial_data.sql` for any references to removed tasks

## Current Changes

### Removed Tasks:
- **Profile Setup** (Stage 1, Recruit rank)
  - Reason: Business name set during registration, referral code set at Partner rank
  - Cleanup: DELETE statements added to remove task and related quiz results

### Task Order Updates:
- Automation Preview is now Task 1 (was Task 2)
- Order indices updated accordingly

## Running Migrations

**Migration Order:**
1. `add_partner_progression_system.sql` - Creates tables and structure
2. `insert_partner_lessons.sql` - Inserts/updates lesson data (includes cleanup)
3. `add_partner_retention_systems.sql` - Adds retention system tables
4. `insert_retention_initial_data.sql` - Inserts badges, challenges, quests

**After running migrations:**
- Profile Setup task will be removed from database
- All related quiz results will be cleaned up
- New task order will be applied







