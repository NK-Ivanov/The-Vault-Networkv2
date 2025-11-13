# Partner Access & Available Automations Overview

## 📊 Partner Dashboard Access

Partners have access to a comprehensive dashboard with the following features:

### 1. **Overview Tab**
- **Referral Link Management**
  - View and copy personalized referral link (`/for-businesses?ref=YOUR-CODE`)
  - Edit referral code (alphanumeric, dashes, underscores only)
  - Unique referral code per partner

- **Key Metrics Dashboard**
  - Total Sales: Cumulative sales from all client transactions
  - Commission Earned: Total commission earned from sales
  - Active Clients: Number of clients with "active" status
  - Commission Rate: Custom rate (if set) or automation default rates

- **Quick Stats Summary**
  - Total Automations Assigned: Count of all automations assigned to clients
  - Active Automations: Automations with "active" setup status
  - Pending Setup: Automations awaiting setup completion
  - Open Tickets: Support tickets requiring attention
  - Total Transactions: Historical transaction count
  - Available Automations: Number of automations partner can assign

- **Partner Leaderboard**
  - Top 10 partners ranked by total sales
  - Shows masked business names (except your own)
  - Displays total sales and commission for each partner
  - Highlights your position with "You" badge

### 2. **Clients Tab**
- **Client Management**
  - View all clients assigned to the partner
  - See client business name, contact name, status, and total spent
  - Mobile-responsive card layout and desktop table view

- **Assign Automation to Client**
  - Select from available clients (active status only)
  - Choose from automations assigned to the partner
  - Assign automations to clients with one-click
  - Prevents duplicate assignments

### 3. **Automations Tab**
- **Available Automations**
  - View all automations assigned to the partner by admins
  - See automation details:
    - Name and description
    - Category badge
    - Setup price (one-time)
    - Monthly price (recurring)
    - Commission rate (partner custom rate or automation default)
  - Only shows automations the partner has permission to sell

- **Client Automations Tracking**
  - View all automations assigned to partner's clients
  - Track payment status (paid/unpaid)
  - Monitor setup status:
    - `pending_setup`: Awaiting setup
    - `setup_in_progress`: Currently being set up
    - `setup_complete`: Setup finished, not yet active
    - `active`: Fully operational
  - See assignment dates and payment dates
  - Mobile and desktop views

### 4. **Earnings Tab**
- **Transaction History**
  - Detailed view of all transactions from partner's clients
  - Transaction details include:
    - Date and time
    - Client business name
    - Automation name
    - Transaction type (setup, monthly, custom)
    - Sale amount (total transaction value)
    - Partner earnings (commission earned)
    - Vault Network share (remaining amount)
    - Commission rate used for calculation
  - Sorted by most recent first
  - Mobile card layout and desktop table view

- **Earnings Summary**
  - Total Sales: Sum of all transaction amounts
  - Total Earnings: Sum of all partner commissions

### 5. **Support Tab**
- **Client Support Tickets**
  - View all support tickets from partner's clients
  - Ticket information:
    - Title and description
    - Status (open, waiting_for_seller, waiting_for_client, needs_vault_help, resolved, closed)
    - Client business name
    - Creation date and time
  - Real-time ticket chat:
    - View conversation history
    - Send messages to clients
    - See messages from clients, partners, and Vault Network admins
    - Color-coded message bubbles by sender type
    - Request Vault Network help when needed
  - Real-time updates via Supabase subscriptions

- **Message The Vault Network**
  - Create new messages to Vault Network team
  - Subject and message body fields
  - View conversation history
  - Reply to messages from Vault Network
  - Track message status (open, in_progress, resolved, closed)
  - Threaded conversation view

---

## 🤖 Available Automations

The system currently has **6 automation solutions** available:

### 1. **Google Review Booster**
- **Category:** Marketing
- **Setup Price:** $299.00 (one-time)
- **Monthly Price:** $49.00/month
- **Description:** Automatically request and manage Google reviews from satisfied customers
- **Features:**
  - Automated review requests
  - Review monitoring
  - Response templates
  - Analytics dashboard

### 2. **Invoice Reminder System**
- **Category:** Finance
- **Setup Price:** $199.00 (one-time)
- **Monthly Price:** $39.00/month
- **Description:** Send automated payment reminders and track invoice status
- **Features:**
  - Automated reminders
  - Payment tracking
  - Custom schedules
  - Client notifications

### 3. **CRM Sync Bot**
- **Category:** Operations
- **Setup Price:** $399.00 (one-time)
- **Monthly Price:** $79.00/month
- **Description:** Keep your CRM data synchronized across multiple platforms
- **Features:**
  - Multi-platform sync
  - Real-time updates
  - Data validation
  - Error handling

### 4. **Lead Qualification System**
- **Category:** Sales
- **Setup Price:** $349.00 (one-time)
- **Monthly Price:** $69.00/month
- **Description:** Automatically score and route leads based on custom criteria
- **Features:**
  - Smart lead scoring
  - Auto-routing
  - Integration ready
  - Custom rules

### 5. **Social Media Scheduler**
- **Category:** Marketing
- **Setup Price:** $249.00 (one-time)
- **Monthly Price:** $59.00/month
- **Description:** Schedule and post content across all major social platforms
- **Features:**
  - Multi-platform posting
  - Content calendar
  - Analytics
  - Media library

### 6. **Email Campaign Automator**
- **Category:** Marketing
- **Setup Price:** $279.00 (one-time)
- **Monthly Price:** $59.00/month
- **Description:** Create and manage sophisticated email marketing campaigns
- **Features:**
  - Drip campaigns
  - A/B testing
  - Segmentation
  - Performance tracking

---

## 🔐 Partner Access Control

### Automation Assignment Flow
1. **Admin assigns automations to partners** via `seller_automations` table
   - Admins can assign any automation to any partner
   - Partners can only see automations assigned to them

2. **Partners assign automations to clients** via `client_automations` table
   - Partners can only assign automations they have access to
   - Partners can only assign to their own clients
   - System prevents duplicate assignments

### Commission System
- **Custom Partner Rate:** Partners can have a custom commission rate set by admins
- **Automation Default Rate:** Each automation has a `default_commission_rate` field
- **Rate Priority:** If partner has custom rate, it overrides automation default
- **Transaction Calculation:** Commission calculated at transaction time using applicable rate

### Security & Permissions
- **Row Level Security (RLS):** All tables protected by RLS policies
- **Partner Isolation:** Partners can only see their own data
- **Client Isolation:** Partners can only manage their assigned clients
- **Automation Access:** Partners can only assign automations granted to them by admins

---

## 📈 Partner Capabilities Summary

✅ **What Partners CAN Do:**
- View and manage their referral link
- See all assigned clients
- Assign available automations to clients
- Track client automation status (payment & setup)
- View detailed transaction history
- Calculate earnings and commissions
- Respond to client support tickets
- Message The Vault Network team
- View leaderboard rankings
- Monitor key performance metrics

❌ **What Partners CANNOT Do:**
- Create new automations (admin-only)
- Assign automations not granted to them
- Access other partners' clients or data
- Modify commission rates (admin-only)
- Approve/deny partner applications (admin-only)
- Access admin dashboard features

---

## 🎯 Next Steps for Partners

1. **Get Started:**
   - Share your referral link with potential clients
   - When clients sign up using your link, they're automatically assigned to you

2. **Assign Automations:**
   - Browse available automations in the Automations tab
   - Select a client and automation to assign
   - Track payment and setup status

3. **Support Clients:**
   - Monitor support tickets from clients
   - Respond to tickets via chat interface
   - Request Vault Network help when needed

4. **Track Performance:**
   - Monitor earnings in the Earnings tab
   - View leaderboard to see your ranking
   - Track key metrics in Overview tab

---

## 📝 Notes

- **Automation Availability:** Partners only see automations that admins have assigned to them via the Admin Dashboard
- **New Automations:** When admins create new automations, they must explicitly assign them to partners
- **The Vault Network Seller:** There's a special "The Vault Network" seller account that automatically gets all new automations (for direct client management)
- **Commission Rates:** Default commission rates are set per automation, but partners can have custom rates that override defaults



