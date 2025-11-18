# Quiz System Implementation Guide

## Overview

A complete quiz system has been implemented that allows you to:
1. Create quizzes with multiple-choice questions
2. Generate unique shareable quiz links
3. Assign quizzes to modules
4. Track quiz attempts and scores

## Database Setup

### 1. Run the Migration

Run the quiz system migration in Supabase SQL Editor:
```sql
-- File: supabase/migrations/create_quiz_system.sql
```

This creates:
- `quizzes` table - Stores quiz metadata
- `quiz_questions` table - Stores questions and answers
- `quiz_attempts` table - Tracks learner attempts
- `quiz_access_tokens` table - Stores shareable quiz links

### 2. Create the Foundations Quiz

Run the Foundations quiz migration:
```sql
-- File: supabase/migrations/create_foundations_quiz.sql
```

This creates the "Foundations of Business Automation" quiz with all 25 questions.

## How to Use

### Step 1: Create a Quiz (via SQL)

For now, quizzes are created via SQL migrations. The Foundations quiz is already prepared in:
- `supabase/migrations/create_foundations_quiz.sql`

To create a new quiz, follow the same pattern:
1. Insert into `quizzes` table
2. Insert all questions into `quiz_questions` table

### Step 2: Create a Quiz Access Link

1. Go to **Admin Dashboard → Quizzes** tab
2. In "Create Quiz Access Link" section:
   - Select the quiz from dropdown
   - Optionally customize the link title
   - Set expiration date (optional)
   - Set max uses (optional)
3. Click "Create Quiz Link"
4. Copy the generated quiz link

### Step 3: Assign Quiz to Module

1. Go to **Admin Dashboard → Modules** tab
2. When creating a module access link:
   - Fill in module information
   - Upload images (optional)
   - Paste HTML content
   - **In Step 4: Assign Quiz** - Select the quiz link you created
   - Copy the quiz link shown
   - Add it to your HTML as a button/link

### Step 4: Add Quiz Link to HTML

In your module HTML, add a button that links to the quiz:

```html
<a href="https://vaultnet.work/quiz?token=quiz_xxxxx" 
   style="display:inline-block;padding:10px 22px;border-radius:999px;
          border:1px solid #f5c84c;background:#111111;color:#f5c84c;
          text-decoration:none;font-size:13px;letter-spacing:0.12em;
          text-transform:uppercase;">
  Take Quiz
</a>
```

## Quiz Features

### For Learners:
- Take quizzes via unique links
- See timer if time limit is set
- Get immediate results after submission
- See which questions were correct/incorrect
- View correct answers for all questions
- Retake quiz if they didn't pass

### For Admins:
- Create quiz access links with custom settings
- Track quiz usage (current uses / max uses)
- Set expiration dates
- Delete quiz links
- View all quizzes and their settings

## Quiz Link Format

Quiz links follow this format:
```
https://vaultnet.work/quiz?token=quiz_xxxxx
```

The token is unique and can be shared in Discord, embedded in HTML, etc.

## Example: Foundations Quiz

The "Foundations of Business Automation" quiz has been prepared with:
- 25 multiple-choice questions
- 70% passing score
- 3 max attempts
- Linked to `module-1-foundations`

After running the migration, you can:
1. Create a quiz link for it
2. Assign it to Module 1
3. Add the link to your HTML module content

## Next Steps

1. **Run the migrations** in Supabase SQL Editor
2. **Create a quiz link** for the Foundations quiz
3. **Update your module HTML** to include the quiz button
4. **Test the quiz** by accessing the link

The quiz system is now fully integrated and ready to use!

