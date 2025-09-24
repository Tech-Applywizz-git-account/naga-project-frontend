// //src/pages/LoginModal.tsx
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { X, Eye, EyeOff } from "lucide-react";

// interface LoginModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("kishore@Applywizz.com");
//   const [password, setPassword] = useState("");
//   const [showPwd, setShowPwd] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   async function onSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setError(null);
//     setLoading(true);
//     try {
//       // TODO: replace with your auth call (Supabase, Firebase, custom API, etc.)
//       await new Promise((r) => setTimeout(r, 700));
//       // navigate to dashboard
//       if (navigate) navigate("/dashboard");
//     } catch (err) {
//       setError("Invalid credentials. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       <div className="flex min-h-full items-center justify-center p-4">
//         {/* Backdrop */}
//         <div className="fixed inset-0 bg-black/30" onClick={onClose}></div>
        
//         {/* Modal content */}
//         <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
//           <button
//             onClick={onClose}
//             className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100"
//           >
//             <X className="h-5 w-5" />
//           </button>

//           <div className="mx-auto w-full max-w-md px-4 pt-2 pb-6">
//             {/* Title */}
//             <h1 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
//               Welcome back
//             </h1>
//             <p className="mt-3 text-center text-base text-gray-500">
//               Sign in to access your H1B sponsor database
//             </p>

//             {/* Form */}
//             <form onSubmit={onSubmit} className="mx-auto mt-6 space-y-4">
//               {/* Email */}
//               <div className="space-y-2">
//                 <label htmlFor="email" className="text-sm font-medium text-gray-700">
//                   Email ID
//                 </label>
//                 <input
//                   id="email"
//                   name="email"
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                   className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300"
//                   placeholder="you@example.com"
//                 />
//               </div>

//               {/* Password */}
//               <div className="space-y-2">
//                 <label htmlFor="password" className="text-sm font-medium text-gray-700">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <input
//                     id="password"
//                     name="password"
//                     type={showPwd ? "text" : "password"}
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                     className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300"
//                     placeholder="•••••"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPwd((s) => !s)}
//                     className="absolute inset-y-0 right-0 mr-3 flex items-center text-gray-500 hover:text-gray-700"
//                     aria-label={showPwd ? "Hide password" : "Show password"}
//                   >
//                     {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
//                   </button>
//                 </div>
//               </div>

//               {/* Error */}
//               {error && (
//                 <p className="text-sm text-red-600" role="alert">
//                   {error}
//                 </p>
//               )}

//               {/* Submit */}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-70"
//               >
//                 {loading ? "Logging in..." : "Login"}
//               </button>

             
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginModal;







// //src/pages/LoginModal.tsx
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { X, Eye, EyeOff } from "lucide-react";
// import  supabase  from '../utils/supabase'
// interface LoginModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPwd, setShowPwd] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   async function onSubmit(e: React.FormEvent) {
//   e.preventDefault();
//   setError(null);
//   setLoading(true);

//   try {
//     // Use signInWithPassword instead of signIn in Supabase v2.0+
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error) throw error;

//     // Check if the email is confirmed
//     if (!data?.user?.email_confirmed_at) {
//       setError("Please confirm your email first.");
//       return;
//     }

//     // Navigate to the dashboard after successful login
//     navigate("/dashboard");
//   } catch (err) {
//     setError("Invalid credentials. Please try again.");
//   } finally {
//     setLoading(false);
//   }
// }


//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       <div className="flex min-h-full items-center justify-center p-4">
//         {/* Backdrop */}
//         <div className="fixed inset-0 bg-black/30" onClick={onClose}></div>

//         {/* Modal content */}
//         <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
//           <button
//             onClick={onClose}
//             className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100"
//           >
//             <X className="h-5 w-5" />
//           </button>

//           <div className="mx-auto w-full max-w-md px-4 pt-2 pb-6">
//             {/* Title */}
//             <h1 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
//               Welcome back
//             </h1>
//             <p className="mt-3 text-center text-base text-gray-500">
//               Sign in to access your H1B sponsor database
//             </p>

//             {/* Form */}
//             <form onSubmit={onSubmit} className="mx-auto mt-6 space-y-4">
//               {/* Email */}
//               <div className="space-y-2">
//                 <label htmlFor="email" className="text-sm font-medium text-gray-700">
//                   Email ID
//                 </label>
//                 <input
//                   id="email"
//                   name="email"
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                   className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300"
//                   placeholder="you@example.com"
//                 />
//               </div>

//               {/* Password */}
//               <div className="space-y-2">
//                 <label htmlFor="password" className="text-sm font-medium text-gray-700">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <input
//                     id="password"
//                     name="password"
//                     type={showPwd ? "text" : "password"}
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                     className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300"
//                     placeholder="•••••"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPwd((s) => !s)}
//                     className="absolute inset-y-0 right-0 mr-3 flex items-center text-gray-500 hover:text-gray-700"
//                     aria-label={showPwd ? "Hide password" : "Show password"}
//                   >
//                     {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
//                   </button>
//                 </div>
//               </div>

//               {/* Error */}
//               {error && (
//                 <p className="text-sm text-red-600" role="alert">
//                   {error}
//                 </p>
//               )}

//               {/* Submit */}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-70"
//               >
//                 {loading ? "Logging in..." : "Login"}
//               </button>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginModal;






import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Eye, EyeOff } from "lucide-react";
import supabase from '../utils/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Use signInWithPassword instead of signIn in Supabase v2.0+
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Supabase Auth Error:", error.message);  // Log the error message
        throw error;
      }

      // Check if the email is confirmed
      if (!data?.user?.email_confirmed_at) {
        setError("Please confirm your email first.");
        return;
      }

      // Navigate to the dashboard after successful login
      navigate("/");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/30" onClick={onClose}></div>

        {/* Modal content */}
        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto w-full max-w-md px-4 pt-2 pb-6">
            {/* Title */}
            <h1 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="mt-3 text-center text-base text-gray-500">
              Sign in to access your H1B sponsor database
            </p>

            {/* Form */}
            <form onSubmit={onSubmit} className="mx-auto mt-6 space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email ID
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-transparent bg-indigo-50/60 px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 outline-none ring-1 ring-indigo-100 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300"
                    placeholder="•••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute inset-y-0 right-0 mr-3 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
