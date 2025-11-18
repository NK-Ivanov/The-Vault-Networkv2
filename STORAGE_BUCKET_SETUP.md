# Module Images Storage Bucket Setup Guide

## Error Explanation

The error "Storage Bucket Not Found" occurs because the `module-images` storage bucket doesn't exist in your Supabase project yet. Storage buckets must be created through the Supabase Dashboard UI - they cannot be created via SQL migrations.

## Step-by-Step Setup Instructions

### 1. Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar

### 2. Create the Bucket
1. Click the **"New bucket"** button (or **"Create bucket"**)
2. Fill in the bucket details:
   - **Name**: `module-images` (must be exactly this name)
   - **Public bucket**: ✅ **Check this box** (very important!)
   - **File size limit**: Set to `10MB` or higher (depending on your image sizes)
   - **Allowed MIME types**: `image/*` (or leave empty for all types)

3. Click **"Create bucket"**

### 3. Set Up RLS Policies (Optional but Recommended)

After creating the bucket, you need to set up Row Level Security (RLS) policies:

1. Click on the `module-images` bucket you just created
2. Go to the **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Public Read Access
- **Policy name**: `Public can view module images`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**: 
  ```sql
  bucket_id = 'module-images'
  ```

#### Policy 2: Authenticated Upload (Admins Only)
- **Policy name**: `Admins can upload module images`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'module-images' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  ```

#### Policy 3: Admin Delete Access
- **Policy name**: `Admins can delete module images`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
  ```sql
  bucket_id = 'module-images' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  ```

### 4. Verify the Setup

After creating the bucket and policies:
1. Try uploading an image again in the Admin Dashboard
2. The upload should now work successfully
3. You should see the image URL generated

## Quick Setup (Minimal)

If you just want to get it working quickly:

1. Create bucket named `module-images`
2. ✅ Check **"Public bucket"**
3. That's it! The uploads will work.

You can add the RLS policies later for better security.

## Troubleshooting

### Still getting errors?
- Make sure the bucket name is exactly `module-images` (case-sensitive)
- Verify "Public bucket" is checked
- Check that you're logged in as an admin user
- Refresh the page and try again

### 400 Bad Request errors?
- The bucket might exist but not be public
- Check the bucket settings and ensure "Public bucket" is enabled

