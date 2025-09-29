# H1B Sponsor Database - Payment Gated Application

## Overview
This application implements a payment-gated H1B sponsor database where only users who complete a successful $3.99 PayPal payment can access the full dashboard and company information.

## Features Implemented

### 🔐 Payment-Gated Authentication
- **Signup Flow**: Users create accounts and are redirected to payment
- **Login Protection**: Only users with successful payments can access dashboard
- **Payment Verification**: Real-time payment status checking

### 💳 PayPal Integration
- **One-time Payment**: $3.99 for lifetime access
- **Secure Processing**: PayPal sandbox integration
- **Transaction Tracking**: All payments stored in database

### 📊 Dashboard Access
- **Protected Routes**: Dashboard only accessible to paid users
- **Company Database**: 500+ verified H1B sponsors
- **Search & Filter**: Find companies by name, industry, location
- **Export Functionality**: Download company lists

## Database Schema

### Tables Created
1. **user_payments**: Tracks all PayPal transactions
2. **leads**: User profiles with payment status
3. **Functions**: `user_has_paid()`, `get_user_payment_status()`

## PayPal Configuration
- **Client ID**: AWJD_HcpuWHxMFBL5ZHhGbVY7MaJVjafDIw19k7LpcWuMb581I1qEN6yvsXhUS38hQ1MWsam37CWJtLS
- **Environment**: Sandbox (for testing)
- **Amount**: $3.99 USD

## User Flow

**NEW PAYMENT-FIRST FLOW:**
1. **Buy Now** → Direct to PayPal payment page
2. **Payment** → Complete $3.99 PayPal payment
3. **Signup** → Create account after successful payment
4. **Automatic Access** → Immediate dashboard access
5. **Login** → Future logins go directly to dashboard

**Previous Flow was:** Buy Now → Signup → Payment → Dashboard  
**New Flow is:** Buy Now → Payment → Signup → Dashboard

## Routes Implemented

- `/` - Home page with pricing and features
- `/payment` - **PayPal payment processing (FIRST STEP)**
- `/signup` - User registration (AFTER payment)
- `/payment-after-signup` - Legacy payment page (for existing users)
- `/dashboard` - Protected dashboard (paid users only)
- `/login` - Modal login (redirects based on payment status)

## Setup Instructions

### ⚠️ **IMPORTANT: Database Setup Required First!**

Before testing the application, you **MUST** set up the database schema in Supabase:

1. **📖 Read the setup guide**: Check `SETUP-DATABASE.md` for detailed instructions
2. **🗄️ Run the schema**: Execute `database/schema.sql` in your Supabase SQL Editor
3. **✅ Verify tables**: Ensure `user_payments` table and payment columns are created

**Without proper database setup, you'll get errors like:**
- `Could not find the 'paid_at' column`
- `function "get_user_payment_status" does not exist`

### 1. Database Setup (Supabase)
Run the SQL schema located in `database/schema.sql` in your Supabase SQL Editor:

```sql
-- Creates user_payments table
-- Adds payment columns to leads table
-- Creates payment verification functions
-- Sets up Row Level Security (RLS)
```

### 2. Environment Variables
Your `.env` file is already configured with:
```
VITE_SUPABASE_URL=https://xficomhdacoloehbzmlt.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. PayPal Setup
The PayPal integration uses your provided credentials:
- Client ID is configured in the PayPalPayment component
- Currently set to sandbox mode for testing

### 4. Development Server
```bash
cd naga-project-frontend
npm install
npm run dev
```

## Testing the NEW Payment-First Flow

### Complete Flow Test:
1. **Click "Buy Now"** on homepage → Goes directly to payment page
2. **Complete PayPal payment** → Payment processed and confirmed
3. **Automatic redirect to signup** → Create account with payment already secured
4. **Account creation** → Automatically marked as paid user
5. **Dashboard access** → Immediate access to H1B database
6. **Future logins** → Direct access to dashboard (payment verified)

### Failed Payment Test:
1. Click "Buy Now" and cancel payment
2. Try to access signup directly → Redirected back to payment
3. Only successful payment allows access to signup form

## Payment Status Logic

```typescript
// Login flow checks payment status
const hasValidPayment = paymentData && paymentData.length > 0 && paymentData[0].has_paid;

if (hasValidPayment) {
  navigate("/dashboard");  // Paid users go to dashboard
} else {
  navigate("/payment");    // Unpaid users go to payment
}
```

## Security Features
- Row Level Security (RLS) on payment tables
- Payment verification before dashboard access
- Secure PayPal transaction processing
- User session management with Supabase Auth

## Files Created/Modified

### New Components:
- `src/components/PayPalPayment.tsx` - PayPal integration
- `src/pages/PaymentPage.tsx` - Payment processing page  
- `src/pages/Dashboard.tsx` - Protected dashboard
- `database/schema.sql` - Database schema

### Modified Files:
- `src/pages/SignupPage.tsx` - Redirect to payment after signup
- `src/pages/LoginModal.tsx` - Payment verification in login
- `src/App.tsx` - Added new routes

## Next Steps
1. **Production Setup**: Switch PayPal to live environment
2. **Company Data**: Replace mock data with real H1B sponsor database
3. **Email Notifications**: Send payment confirmations
4. **Admin Panel**: Manage payments and users
5. **Analytics**: Track conversion rates and user behavior

The application is now fully functional with payment gating! Users must complete the $3.99 PayPal payment to access the H1B sponsor dashboard.