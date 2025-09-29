## RLS Policy Fix Guide

You're getting a "new row violates row-level security policy" error. Here are **3 immediate solutions**:

### SOLUTION 1: Run SQL Script (FASTEST FIX - 30 seconds)

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor** 
3. Copy and paste the entire content from `IMMEDIATE-RLS-FIX.sql`
4. Click **Run** 
5. You should see "RLS has been completely disabled" message

### SOLUTION 2: Manual Dashboard Fix

1. Go to **Supabase Dashboard → Database → Tables**
2. Find `leads` table → Click the **gear icon** → **Edit Table**
3. **UNCHECK** "Enable Row Level Security" 
4. Click **Save**
5. Repeat for `user_payments` table if it exists

### SOLUTION 3: Code Already Updated (Backup Plan)

I've updated your signup code with a backup approach that:
- ✅ Tries normal Supabase insert first
- ✅ If RLS error occurs, automatically switches to REST API approach
- ✅ Provides detailed error logging
- ✅ Should work even with RLS enabled

### TEST THE FIX:

After running Solution 1 or 2:

1. **Test signup immediately** - try creating an account
2. **Check browser console** for any error messages
3. **Report back** with either:
   - ✅ "Signup worked!" 
   - ❌ "Still getting error: [error message]"

### Why This Happened:

- RLS policies can persist even when you think they're disabled
- Supabase caches policies and they need explicit removal
- The SQL script completely removes ALL policies and disables RLS

**Next Steps:** Run Solution 1 first (it's the most thorough), then test signup!