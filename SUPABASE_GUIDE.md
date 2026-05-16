# Supabase Backend Setup Guide

This guide will help you connect your PerformX Performance Portal to a real Supabase backend.

## 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and sign in.
2. Create a new project (e.g., `PerformX-Backend`).
3. Note your **Project URL** and **API Key (anon/public)**.

## 2. Setup Database Schema
1. In your Supabase dashboard, go to the **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open the `supabase_setup.sql` file created in your project root.
4. Copy the entire content and paste it into the Supabase SQL Editor.
5. Click **Run**.
   - This will create the `profiles`, `goals`, `check_ins`, and `audit_logs` tables.
   - It will also set up security policies (RLS) to protect your data.

## 3. Configure Environment Variables
1. Open the `.env` file in your project root.
2. Replace the placeholders with your actual Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Save the file and restart your development server (`npm run dev`).

## 4. Create Demo Users
To use the "Select Role" login buttons, you need to create matching users in Supabase:

1. Go to **Authentication > Users** in Supabase.
2. Click **Add User > Create new user**.
3. Use these demo credentials (or your own):
   - **Employee**: `harshi@demo.com` / `demo123`
   - **Manager**: `janhvi@demo.com` / `demo123`
   - **Admin**: `anshu@demo.com` / `demo123`
4. After creating them, you must add their records to the `profiles` table in the **Table Editor** so the app can fetch their roles:
   - Go to **Table Editor > profiles**.
   - Insert records with the `id` from the Auth users you just created.
   - Set `role` to `employee`, `manager`, or `admin` respectively.

## 5. Verify Setup
- Refresh the website.
- The error "Supabase credentials missing" should disappear.
- You should be able to log in and see data being fetched from (and saved to) Supabase!
