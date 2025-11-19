-- Migration: Update "Understanding Automations" course to slide-based format
-- This updates only the course content to be structured for slides
-- Other lessons remain unchanged

-- Update the course content to be slide-based (split by ## headings)
UPDATE public.partner_lessons
SET content = '# The 6 Default Automations

## Slide 1: Google Review Booster
**Problem**: Businesses struggle to collect and manage Google reviews
**Solution**: Automatically requests reviews from satisfied customers and monitors responses
**Best For**: Local services, restaurants, retail stores

## Slide 2: Invoice Reminder System
**Problem**: Late payments hurt cash flow
**Solution**: Sends automated payment reminders and tracks invoice status
**Best For**: Freelancers, agencies, service businesses

## Slide 3: CRM Sync Bot
**Problem**: Data scattered across multiple platforms
**Solution**: Keeps CRM data synchronized across all platforms in real-time
**Best For**: Agencies, sales teams, growing businesses

## Slide 4: Lead Qualification System
**Problem**: Too many unqualified leads waste time
**Solution**: Automatically scores and routes leads based on custom criteria
**Best For**: Sales teams, agencies, B2B companies

## Slide 5: Social Media Scheduler
**Problem**: Posting consistently across platforms is time-consuming
**Solution**: Schedules and posts content across all major social platforms
**Best For**: Marketing agencies, content creators, small businesses

## Slide 6: Email Campaign Automator
**Problem**: Email marketing is manual and inconsistent
**Solution**: Creates and manages sophisticated email marketing campaigns
**Best For**: E-commerce, SaaS companies, marketing agencies

## Slide 7: Pricing Structure
Each automation has:
- **Setup Fee**: One-time payment for initial setup (you earn commission)
- **Monthly Retainer**: Recurring monthly payment (you earn recurring commission)

## Slide 8: How Automations Are Delivered
Vault Network handles all technical setup and delivery. Your role is to:
1. Connect businesses with the right automation
2. Explain the value and benefits
3. Vault Network handles the rest!'
WHERE title = 'Understanding Automations' 
  AND rank_required = 'Apprentice'
  AND lesson_type = 'course';










