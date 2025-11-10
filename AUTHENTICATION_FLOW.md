# Authentication & Signup Flow Explanation

## 🔐 IMPORTANT: All Dashboards Require Login!

Both **Client Dashboard** and **Partner Dashboard** check for authentication and redirect to `/login` if the user is not logged in.

---

## 📋 Complete User Flow

### For **CLIENTS** (Businesses):

1. **Step 1: Register Account**
   - User goes to `/login` page
   - Clicks "Sign Up" tab
   - Enters: Email, Password, Full Name
   - Account created in `auth.users` table
   - Profile automatically created in `profiles` table (via database trigger)

2. **Step 2: Login**
   - User enters email/password
   - Gets authenticated via Supabase Auth
   - If no role assigned yet → redirected to home page `/`

3. **Step 3: Create Business Account**
   - User goes to `/for-businesses` page
   - **MUST BE LOGGED IN** (code checks `if (!user)` → redirects to `/login`)
   - Fills out business form:
     - Business Name
     - Contact Name
     - Industry (optional)
     - Description (optional)
   - Submits form
   - Creates record in `clients` table with `user_id` linking to their account
   - Automatically assigns "client" role in `user_roles` table

4. **Step 4: Access Client Dashboard**
   - User logs in again (or already logged in)
   - Login checks roles → finds "client" role → redirects to `/client-dashboard`
   - Dashboard checks authentication → if logged in, shows dashboard
   - Dashboard checks if client record exists → if not, redirects to `/for-businesses`

---

### For **SELLERS** (Partners):

1. **Step 1: Register Account**
   - Same as clients: Register at `/login` page

2. **Step 2: Login**
   - Same as clients: Login with email/password

3. **Step 3: Apply as Partner**
   - User goes to `/partners` page
   - **MUST BE LOGGED IN** (code checks `if (!user)` → redirects to `/login`)
   - Fills out partner application:
     - Business/Individual Name
     - Website (optional)
     - About section
   - Submits application
   - Creates record in `sellers` table with `user_id` linking to their account
   - Status set to "pending"
   - Automatically assigns "seller" role in `user_roles` table

4. **Step 4: Access Partner Dashboard**
   - User logs in again (or already logged in)
   - Login checks roles → finds "seller" role → redirects to `/partner-dashboard`
   - Dashboard checks authentication → if logged in, shows dashboard
   - If status is "pending" → shows "Application Pending" message
   - If status is "approved" → shows full dashboard

---

## 🔒 Security Checks in Code

### Client Dashboard (`src/pages/ClientDashboard.tsx`):
```typescript
useEffect(() => {
  if (!authLoading && !user) {
    navigate("/login");  // ← REQUIRES LOGIN!
  }
}, [user, authLoading, navigate]);
```

### Partner Dashboard (`src/pages/PartnerDashboard.tsx`):
```typescript
useEffect(() => {
  if (!authLoading && !user) {
    navigate("/login");  // ← REQUIRES LOGIN!
  }
}, [user, authLoading, navigate]);
```

### For Businesses Page (`src/pages/ForBusinesses.tsx`):
```typescript
if (!user) {
  toast({
    title: "Authentication required",
    description: "Please log in to create a business account.",
    variant: "destructive",
  });
  navigate("/login");  // ← REQUIRES LOGIN!
  return;
}
```

### Partners Page (`src/pages/Partners.tsx`):
```typescript
if (!user) {
  toast({
    title: "Authentication required",
    description: "Please log in to apply as a partner.",
    variant: "destructive",
  });
  navigate("/login");  // ← REQUIRES LOGIN!
  return;
}
```

---

## 🎯 Summary

**NO ONE can access dashboards without logging in!**

The flow is:
1. **Register** → Creates auth account
2. **Login** → Authenticates user
3. **Create Business/Partner Account** → Creates client/seller record + assigns role
4. **Access Dashboard** → Requires login + role check

All dashboards have authentication guards that redirect to `/login` if not authenticated.

