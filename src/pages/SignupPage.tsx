// //src/pages/SignupPage.tsx
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import LoginModal from './LoginModal'; // Import LoginModal component

// const SignupPage: React.FC = () => {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     fullName: "",
//     countryCode: "",
//     phone: "",
//     email: "",
//     promoCode: "",
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // State for login modal visibility

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setLoading(true);
//     try {
//       // TODO: Replace with API call for OTP sending/verification
//       await new Promise((r) => setTimeout(r, 800));
//       alert("OTP sent to your email/phone.");
//       navigate("/verify-otp");
//     } catch (err) {
//       setError("Something went wrong. Try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLoginClick = () => {
//     setIsLoginModalOpen(true); // Open the login modal
//   };

//   return (
//     <div className="min-h-screen bg-white text-gray-900">
//       {/* Back link */}
//       <div className="mx-auto w-full max-w-5xl px-4 pt-6">
//         <button
//           onClick={() => navigate("/")}
//           className="group inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
//         >
//           <svg
//             className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
//             viewBox="0 0 20 20"
//             fill="currentColor"
//           >
//             <path
//               fillRule="evenodd"
//               d="M12.293 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L8.414 9H17a1 1 0 110 2H8.414l3.879 3.879a1 1 0 010 1.414z"
//               clipRule="evenodd"
//             />
//           </svg>
//           Back to home
//         </button>
//       </div>

//       {/* Card */}
//       <div className="mx-auto mt-8 w-full max-w-3xl px-4 pb-12">
//         <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
//           <div className="p-8 sm:p-12">
//             <h1 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
//               Create your account
//             </h1>
//             <p className="mt-3 text-center text-base text-gray-500">
//               Join thousands of successful job seekers
//             </p>

//             <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-2xl space-y-6">
//               {/* Full Name */}
//               <div className="space-y-2">
//                 <label
//                   htmlFor="fullName"
//                   className="text-sm font-medium text-gray-700"
//                 >
//                   Full Name
//                 </label>
//                 <input
//                   id="fullName"
//                   name="fullName"
//                   value={form.fullName}
//                   onChange={handleChange}
//                   placeholder="Enter your full name"
//                   required
//                   className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
//                 />
//               </div>

//               {/* Country Code + Phone */}
//               <div className="grid grid-cols-3 gap-4">
//                 <div className="col-span-1 space-y-2">
//                   <label
//                     htmlFor="countryCode"
//                     className="text-sm font-medium text-gray-700"
//                   >
//                     Country Code
//                   </label>
//                   <select
//                     id="countryCode"
//                     name="countryCode"
//                     value={form.countryCode}
//                     onChange={handleChange}
//                     required
//                     className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
//                   >
//                     <option value="">Code</option>
//                     <option value="+1">+1 (US)</option>
//                     <option value="+44">+44 (UK)</option>
//                     <option value="+91">+91 (India)</option>
//                   </select>
//                 </div>
//                 <div className="col-span-2 space-y-2">
//                   <label
//                     htmlFor="phone"
//                     className="text-sm font-medium text-gray-700"
//                   >
//                     Phone Number
//                   </label>
//                   <input
//                     id="phone"
//                     name="phone"
//                     type="tel"
//                     value={form.phone}
//                     onChange={handleChange}
//                     placeholder="Enter phone number"
//                     required
//                     className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
//                   />
//                 </div>
//               </div>

//               {/* Email */}
//               <div className="space-y-2">
//                 <label
//                   htmlFor="email"
//                   className="text-sm font-medium text-gray-700"
//                 >
//                   Email ID
//                 </label>
//                 <input
//                   id="email"
//                   name="email"
//                   type="email"
//                   value={form.email}
//                   onChange={handleChange}
//                   placeholder="Enter your email"
//                   required
//                   className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
//                 />
//               </div>

//               {/* Promo Code */}
//               <div className="space-y-2">
//                 <label
//                   htmlFor="promoCode"
//                   className="text-sm font-medium text-gray-700"
//                 >
//                   Promo Code
//                 </label>
//                 <input
//                   id="promoCode"
//                   name="promoCode"
//                   type="text"
//                   value={form.promoCode}
//                   onChange={handleChange}
//                   placeholder="Enter promo code (optional)"
//                   className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
//                 />
//               </div>

//               {/* Info Note */}
//               <p className="rounded-xl bg-purple-50 px-4 py-3 text-sm text-purple-600">
//                 You&apos;ll receive an OTP to verify your account.
//               </p>

//               {/* Error */}
//               {error && <p className="text-sm text-red-600">{error}</p>}

//               {/* Verify Button */}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:scale-[1.01] transition-transform focus:ring-4 focus:ring-blue-300 disabled:opacity-70 disabled:cursor-not-allowed"
//               >
//                 {loading ? "Processing..." : "Verify"}
//               </button>

//               {/* Footer */}
//               <p className="text-center text-sm text-gray-600">
//                 Already have an account?{" "}
//                 <button
//                   type="button"
//                   onClick={handleLoginClick} // Open login modal
//                   className="font-medium text-blue-600 hover:text-blue-700"
//                 >
//                   Login
//                 </button>
//               </p>
//             </form>
//           </div>
//         </div>
//       </div>

//       {/* Login Modal */}
//       <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
//     </div>
//   );
// };

// export default SignupPage;


// // import { createClient } from '@supabase/supabase-js';
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import  supabase  from '../utils/supabase';
// import LoginModal from './LoginModal'; // Import LoginModal component

// const SignupPage: React.FC = () => {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     fullName: "",
//     countryCode: "",
//     phone: "",
//     email: "",
//     promoCode: "",
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // State for login modal visibility

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setLoading(true);

//     try {
//       // Sign up the user with Supabase authentication (signUp with email and phone as password)
//       const { user, error } = await supabase.auth.signUp({
//         email: form.email,
//         password: form.phone, // Use phone or other logic for password
//       });

//       if (error) throw error;

//       // Send OTP to the user (handled by Supabase automatically)
//       alert("A confirmation email has been sent to your email.");

//       // Navigate to OTP verification page (if using one)
//       navigate("/verify-otp");

//     } catch (err) {
//       setError("Something went wrong. Try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLoginClick = () => {
//     setIsLoginModalOpen(true); // Open the login modal
//   };

//   return (
//     <div className="min-h-screen bg-white text-gray-900">
//       {/* Back link */}
//       <div className="mx-auto w-full max-w-5xl px-4 pt-6">
//         <button
//           onClick={() => navigate("/")}
//           className="group inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
//         >
//           <svg
//             className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
//             viewBox="0 0 20 20"
//             fill="currentColor"
//           >
//             <path
//               fillRule="evenodd"
//               d="M12.293 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L8.414 9H17a1 1 0 110 2H8.414l3.879 3.879a1 1 0 010 1.414z"
//               clipRule="evenodd"
//             />
//           </svg>
//           Back to home
//         </button>
//       </div>

//       {/* Card */}
//       <div className="mx-auto mt-8 w-full max-w-3xl px-4 pb-12">
//         <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
//           <div className="p-8 sm:p-12">
//             <h1 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
//               Create your account
//             </h1>
//             <p className="mt-3 text-center text-base text-gray-500">
//               Join thousands of successful job seekers
//             </p>

//             <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-2xl space-y-6">
//               {/* Full Name */}
//               <div className="space-y-2">
//                 <label
//                   htmlFor="fullName"
//                   className="text-sm font-medium text-gray-700"
//                 >
//                   Full Name
//                 </label>
//                 <input
//                   id="fullName"
//                   name="fullName"
//                   value={form.fullName}
//                   onChange={handleChange}
//                   placeholder="Enter your full name"
//                   required
//                   className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
//                 />
//               </div>

//               {/* Country Code + Phone */}
//               <div className="grid grid-cols-3 gap-4">
//                 <div className="col-span-1 space-y-2">
//                   <label
//                     htmlFor="countryCode"
//                     className="text-sm font-medium text-gray-700"
//                   >
//                     Country Code
//                   </label>
//                   <select
//                     id="countryCode"
//                     name="countryCode"
//                     value={form.countryCode}
//                     onChange={handleChange}
//                     required
//                     className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
//                   >
//                     <option value="">Code</option>
//                     <option value="+1">+1 (US)</option>
//                     <option value="+44">+44 (UK)</option>
//                     <option value="+91">+91 (India)</option>
//                   </select>
//                 </div>
//                 <div className="col-span-2 space-y-2">
//                   <label
//                     htmlFor="phone"
//                     className="text-sm font-medium text-gray-700"
//                   >
//                     Phone Number
//                   </label>
//                   <input
//                     id="phone"
//                     name="phone"
//                     type="tel"
//                     value={form.phone}
//                     onChange={handleChange}
//                     placeholder="Enter phone number"
//                     required
//                     className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
//                   />
//                 </div>
//               </div>

//               {/* Email */}
//               <div className="space-y-2">
//                 <label
//                   htmlFor="email"
//                   className="text-sm font-medium text-gray-700"
//                 >
//                   Email ID
//                 </label>
//                 <input
//                   id="email"
//                   name="email"
//                   type="email"
//                   value={form.email}
//                   onChange={handleChange}
//                   placeholder="Enter your email"
//                   required
//                   className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
//                 />
//               </div>

//               {/* Promo Code */}
//               <div className="space-y-2">
//                 <label
//                   htmlFor="promoCode"
//                   className="text-sm font-medium text-gray-700"
//                 >
//                   Promo Code
//                 </label>
//                 <input
//                   id="promoCode"
//                   name="promoCode"
//                   type="text"
//                   value={form.promoCode}
//                   onChange={handleChange}
//                   placeholder="Enter promo code (optional)"
//                   className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
//                 />
//               </div>

//               {/* Info Note */}
//               <p className="rounded-xl bg-purple-50 px-4 py-3 text-sm text-purple-600">
//                 You&apos;ll receive an OTP to verify your account.
//               </p>

//               {/* Error */}
//               {error && <p className="text-sm text-red-600">{error}</p>}

//               {/* Verify Button */}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:scale-[1.01] transition-transform focus:ring-4 focus:ring-blue-300 disabled:opacity-70 disabled:cursor-not-allowed"
//               >
//                 {loading ? "Processing..." : "Verify"}
//               </button>

//               {/* Footer */}
//               <p className="text-center text-sm text-gray-600">
//                 Already have an account?{" "}
//                 <button
//                   type="button"
//                   onClick={handleLoginClick} // Open login modal
//                   className="font-medium text-blue-600 hover:text-blue-700"
//                 >
//                   Login
//                 </button>
//               </p>
//             </form>
//           </div>
//         </div>
//       </div>

//       {/* Login Modal */}
//       <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
//     </div>
//   );
// };

// export default SignupPage;


import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import supabase from '../utils/supabase';
import LoginModal from './LoginModal'; // Import LoginModal component
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { CheckCircle } from "lucide-react";


const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [requiredEmail, setRequiredEmail] = useState<string>(''); // ELON'S RULE: PayPal email
  const [emailVerified, setEmailVerified] = useState(false); // NEW: Email verification status

  const [form, setForm] = useState({
    fullName: "",
    countryCode: "",
    phone: "",
    email: "",
    promoCode: "",
    password: "",  // Add password to form state
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // State for login modal visibility
  const [showDialog, setShowDialog] = useState(false); // New state
  const [showPassword, setShowPassword] = useState(false);

  // Check if user came from email verification page or direct PayPal redirect
  useEffect(() => {
    const state = location.state as {
      paymentId?: string;
      email?: string;
      amount?: string;
      paymentStatus?: string;
      userData?: any; // PayPal user data
      fullPaymentData?: any;
      paymentCompleted?: boolean;
      paymentData?: any;
      requiredEmail?: string;
      emailVerified?: boolean;
    };
    
    // NEW: Check localStorage for PayPal payment data (from PayPal redirect)
    const paypalDataString = localStorage.getItem('paypalPaymentData');
    if (paypalDataString) {
      try {
        const paypalData = JSON.parse(paypalDataString);
        console.log('🎉 PayPal data found in localStorage:', paypalData);
        
        // Clear the localStorage data after reading
        localStorage.removeItem('paypalPaymentData');
        
        // Set up payment state
        setPaymentCompleted(true);
        setPaymentData({
          payment_id: paypalData.paymentId,
          payer_email: paypalData.email,
          amount: paypalData.amount || '3.99',
          payment_status: paypalData.paymentStatus,
          userData: paypalData.userData
        });
        setRequiredEmail(paypalData.email);
        setEmailVerified(true); // Skip email verification since payment is confirmed
        
        // PRE-FILL ALL FORM DATA FROM PAYPAL
        setForm((prev) => ({
          ...prev,
          email: paypalData.email || '',
          fullName: paypalData.userData?.fullName || '',
          phone: paypalData.userData?.phone || '',
          countryCode: paypalData.userData?.countryCode || '',
          // Keep existing password and promo code
          password: prev.password,
          promoCode: prev.promoCode
        }));
        
        console.log('✅ Form pre-filled with PayPal localStorage data:');
        console.log('📧 Email:', paypalData.email);
        console.log('👤 Full Name:', paypalData.userData?.fullName);
        console.log('📱 Phone Number:', paypalData.userData?.phone);
        console.log('🌍 Country Code:', paypalData.userData?.countryCode);
        
        return; // Exit early, we've handled PayPal data
      } catch (error) {
        console.error('❌ Error parsing PayPal data from localStorage:', error);
        localStorage.removeItem('paypalPaymentData'); // Clean up bad data
      }
    }
    
    // NEW: Handle direct redirect from PayPal payment with full user data
    if (state?.paymentId && state?.email && state?.paymentStatus === 'completed' && state?.userData) {
      console.log('\ud83c\udf89 PayPal data received:', state.userData);
      
      setPaymentCompleted(true);
      setPaymentData({
        payment_id: state.paymentId,
        payer_email: state.email,
        amount: state.amount || '3.99',
        payment_status: state.paymentStatus,
        userData: state.userData
      });
      setRequiredEmail(state.email);
      setEmailVerified(true); // Skip email verification since payment is confirmed
      
      // PRE-FILL ALL FORM DATA FROM PAYPAL
      setForm((prev) => ({
        ...prev,
        email: state.email || '',
        fullName: state.userData.fullName || '',
        phone: state.userData.phone || '',
        countryCode: state.userData.countryCode || '', // Already has + prefix from PayPal
        // Keep existing password and promo code
        password: prev.password,
        promoCode: prev.promoCode
      }));
      
      console.log('\u2705 Form pre-filled with PayPal data:');
      console.log('📧 Email:', state.email);
      console.log('👤 Full Name:', state.userData.fullName);
      console.log('📱 Phone Number:', state.userData.phone);
      console.log('🌍 Country Code:', state.userData.countryCode);
      console.log('📊 Complete userData:', state.userData);
      
    }
    // EXISTING: Handle redirect from email verification page
    else if (state?.paymentCompleted && state?.paymentData && state?.requiredEmail) {
      setPaymentCompleted(true);
      setPaymentData(state.paymentData);
      setRequiredEmail(state.requiredEmail);
      setEmailVerified(state.emailVerified || false);
      // ENFORCE: Set email to PayPal email and lock it
      setForm(prev => ({ ...prev, email: state.requiredEmail || '' }));
    } else {
      // If no payment completed, redirect to payment page
      navigate('/payment');
    }
  }, [location.state, navigate]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // ELON'S SECURITY RULE: Prevent email changes if it's locked to PayPal email
    if (name === 'email' && requiredEmail && value !== requiredEmail) {
      setError(`Email must match your PayPal email: ${requiredEmail}`);
      return;
    }
    
    // Prevent changes to pre-filled PayPal data (except password and promo code)
    if (paymentData?.userData) {
      if (name === 'fullName' && paymentData.userData.fullName) {
        setError('Name is locked from PayPal data for security');
        return;
      }
      if (name === 'phone' && paymentData.userData.phone) {
        setError('Phone is locked from PayPal data for security');
        return;
      }
      if (name === 'countryCode' && paymentData.userData.countryCode) {
        setError('Country code is locked from PayPal data for security');
        return;
      }
    }
    
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null); // Clear error on valid changes
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    // ELON'S CRITICAL CHECK: Verify email matches PayPal email
    if (requiredEmail && form.email !== requiredEmail) {
      throw new Error(`Security Error: Email must match your PayPal email (${requiredEmail})`);
    }

    // STEP 1: Verify payment exists and is completed
    const { data: paymentCheck, error: paymentError } = await supabase
      .from('user_payments')
      .select('payment_status, email, payer_email, payment_id')
      .eq('payment_id', paymentData.payment_id)
      .eq('payment_status', 'completed')
      .single();

    if (paymentError || !paymentCheck) {
      throw new Error('Payment verification failed. Please contact support.');
    }

    // STEP 2: Verify email matches payment email (Security Rule)
    const paymentEmail = paymentCheck.payer_email || paymentCheck.email;
    if (paymentEmail.toLowerCase().trim() !== form.email.toLowerCase().trim()) {
      throw new Error(`Email mismatch: Payment email (${paymentEmail}) must match signup email`);
    }

    // STEP 3: Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('leads')
      .select('email')
      .eq('email', form.email)
      .single();

    if (existingUser) {
      throw new Error('User already exists with this email. Please login instead.');
    }

    // STEP 4: Create user profile in leads table with RLS bypass approach
    console.log('🔄 Attempting to create user profile...');
    
    try {
      // First approach: Try with service role bypass headers
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert({
          email: form.email,
          full_name: form.fullName,
          phone: form.phone,
          country_code: form.countryCode,
          promo_code: form.promoCode,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (leadError) {
        console.error('❌ Lead creation error:', leadError);
        
        // If RLS error, try alternative approach
        if (leadError.message.includes('row-level security') || leadError.message.includes('policy')) {
          console.log('🔧 RLS error detected, trying alternative approach...');
          
          // Alternative: Direct REST API call to bypass potential client-side RLS issues
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/leads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              email: form.email,
              full_name: form.fullName,
              phone: form.phone,
              country_code: form.countryCode,
              promo_code: form.promoCode,
              created_at: new Date().toISOString()
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`REST API failed: ${response.status} - ${errorText}`);
          }
          
          const restData = await response.json();
          console.log('✅ User profile created via REST API:', restData);
        } else {
          throw new Error('Failed to create user profile: ' + leadError.message);
        }
      } else {
        console.log('✅ User profile created successfully:', leadData);
      }
    } catch (dbError: any) {
      console.error('❌ Database operation failed:', dbError);
      throw new Error('Failed to create user profile: ' + dbError.message);
    }

    // STEP 5: Update payment record with verification
    const { error: paymentUpdateError } = await supabase
      .from('user_payments')
      .update({
        email_verified: true,
        verification_status: 'verified',
        email: form.email
      })
      .eq('payment_id', paymentData.payment_id);

    if (paymentUpdateError) {
      console.warn('Warning: Failed to update payment verification:', paymentUpdateError);
      // Continue anyway - user profile was created successfully
    }

    // STEP 6: Create Supabase auth user
    const { data: userData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          payment_verified: true,
          payment_id: paymentData.payment_id
        }
      }
    });

    if (authError) {
      // If auth user creation fails, we should clean up the lead record
      await supabase
        .from('leads')
        .delete()
        .eq('email', form.email);
      throw new Error('Account creation failed: ' + authError.message);
    }

    console.log('✅ Account created successfully:', userData);

    // Show success dialog and redirect to dashboard
    setShowDialog(true);
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);

  } catch (err: any) {
    console.error('Signup error:', err);
    setError(err.message || "Something went wrong. Try again.");
  } finally {
    setLoading(false);
  }
};


  const handleLoginClick = () => {
    setIsLoginModalOpen(true); // Open the login modal
  };

  // Show loading if payment data is not yet available
  if (!paymentCompleted || !paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Back link */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-6">
        <button
          onClick={() => navigate("/")}
          className="group inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg
            className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.293 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L8.414 9H17a1 1 0 110 2H8.414l3.879 3.879a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to home
        </button>
      </div>

      {/* Card */}
      <div className="mx-auto mt-8 w-full max-w-3xl px-4 pb-12">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
          <div className="p-8 sm:p-12">
            {/* Header only - remove auto-fill message */}
            <h1 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
              Complete Your Account Setup
            </h1>
            <div className="mt-3 flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-center text-base text-green-600">
                {emailVerified 
                  ? 'Payment completed! Create your account below.' 
                  : 'Payment completed! Now create your account to access the database.'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-2xl space-y-6">
              {/* Full Name - Pre-filled from PayPal */}
              <div className="space-y-2">
                <label
                  htmlFor="fullName"
                  className="text-sm font-medium text-gray-700"
                >
                  Full Name {form.fullName && '✅ From PayPal'}
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  readOnly={!!form.fullName} // Lock if pre-filled from PayPal
                  className={`w-full rounded-xl border border-transparent px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300 ${
                    form.fullName ? 'bg-green-50 border-green-200 ring-green-100 text-green-800' : 'bg-indigo-50/60'
                  }`}
                />
                {form.fullName && (
                  <p className="text-xs text-green-600">
                    ✨ Auto-filled from your PayPal account
                  </p>
                )}
              </div>

              {/* Country Code + Phone - Pre-filled from PayPal */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-2">
                  <label
                    htmlFor="countryCode"
                    className="text-sm font-medium text-gray-700"
                  >
                    Country Code {form.countryCode && '✅'}
                  </label>
                  <select
                    id="countryCode"
                    name="countryCode"
                    value={form.countryCode}
                    onChange={handleChange}
                    required
                    disabled={!!form.countryCode} // Disable if pre-filled
                    className={`w-full rounded-xl border border-transparent px-4 py-3 text-gray-900 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300 ${
                      form.countryCode ? 'bg-green-50 border-green-200 ring-green-100 text-green-800' : 'bg-indigo-50/60'
                    }`}
                  >
                    <option value="">Code</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+91">+91 (India)</option>
                    <option value="+61">+61 (Australia)</option>
                    <option value="+49">+49 (Germany)</option>
                    <option value="+33">+33 (France)</option>
                    <option value="+86">+86 (China)</option>
                    <option value="+81">+81 (Japan)</option>
                    <option value="+82">+82 (South Korea)</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-700"
                  >
                    Phone Number {form.phone && '✅ From PayPal'}
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    required
                    readOnly={!!form.phone} // Lock if pre-filled
                    className={`w-full rounded-xl border border-transparent px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300 ${
                      form.phone ? 'bg-green-50 border-green-200 ring-green-100 text-green-800' : 'bg-indigo-50/60'
                    }`}
                  />
                  {form.phone && (
                    <p className="text-xs text-green-600">
                      ✨ Auto-filled from your PayPal account
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email ID
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    readOnly={!!requiredEmail} // Lock if PayPal email is set
                    className={`w-full rounded-xl border border-transparent px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300 ${
                      requiredEmail ? 'bg-green-50 border-green-200 ring-green-100 text-green-800 font-medium' : 'bg-indigo-50/60'
                    }`}
                  />
                  {requiredEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
                {!requiredEmail && (
                  <p className="text-xs text-gray-500">
                    Use the same email as your PayPal payment
                  </p>
                )}
              </div>

              {/* Password */}
              {/* <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
                />
              </div> */}

              {/* Password - MAIN ACTION REQUIRED */}
              <div className="space-y-2 relative border-2 border-blue-300 rounded-xl p-4 bg-blue-50">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                  <label
                    htmlFor="password"
                    className="text-sm font-bold text-blue-800"
                  >
                    CREATE YOUR PASSWORD → Only Step Required!
                  </label>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter a secure password (minimum 6 characters)"
                  required
                  minLength={6}
                  className="w-full rounded-xl border-2 border-blue-300 bg-white px-4 py-4 text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-6 top-[52px] text-blue-600 hover:text-blue-800"
                >
                  {showPassword ? <AiFillEyeInvisible size={24} /> : <AiFillEye size={24} />}
                </button>
                <p className="text-xs text-blue-700 font-medium">
                  🔒 This will be your login password for future access
                </p>
              </div>


              {/* Promo Code */}
              <div className="space-y-2">
                <label
                  htmlFor="promoCode"
                  className="text-sm font-medium text-gray-700"
                >
                  Promo Code
                </label>
                <input
                  id="promoCode"
                  name="promoCode"
                  type="text"
                  value={form.promoCode}
                  onChange={handleChange}
                  placeholder="Enter promo code (optional)"
                  className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              {/* Info Note */}
              <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">
                    Payment of $3.99 completed successfully! Your account will have lifetime access.
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && <p className="text-sm text-red-600">{error}</p>}

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={loading || !form.password || form.password.length < 6}
                className="w-full rounded-xl bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4 text-xl font-bold text-white shadow-lg hover:scale-[1.02] transition-all focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    Creating your account...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 mr-2" />
                    Create Account & Access Database →
                  </div>
                )}
              </button>
              
              {!form.password && (
                <p className="text-center text-sm text-blue-600 font-medium">
                  ↑ Just enter your password above to complete signup!
                </p>
              )}

              {/* Footer */}
              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={handleLoginClick} // Open login modal
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Login
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Verification Dialog */}
{showDialog && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 ">
    <div className="rounded-xl bg-white p-6 shadow-lg max-w-lg text-center">
      <h2 className="text-lg font-semibold text-gray-900">Account Created Successfully!</h2>
      <p className="mt-2 text-sm text-gray-600">
        Your account has been created and your payment is confirmed! You will be redirected to your dashboard.
      </p>
      <button
        onClick={() => setShowDialog(false)}
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-300"
      >
        OK
      </button>
    </div>
  </div>
)}


      {/* Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
};

export default SignupPage;