import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  Star,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  LogIn,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, type Variants, AnimatePresence } from "framer-motion";

// ---------- Reusable Slide-Up (slow) ----------
const slideUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.4,
      duration: 1.0,
      ease: "easeOut",
    },
  }),
};

const featureCardVariants: Variants = slideUp;

// Floating badges (unchanged)
const floatUpDown: Variants = {
  initial: { y: 0, opacity: 0 },
  animate: {
    opacity: 1,
    y: [0, -8, 0],
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
  },
};

const floatUpDownDelayed: Variants = {
  initial: { y: 0, opacity: 0 },
  animate: {
    opacity: 1,
    y: [0, -6, 0],
    transition: { duration: 3, delay: 0.6, repeat: Infinity, ease: "easeInOut" },
  },
};

// Slide-down animation for the mobile menu
const mobileMenuVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

// Login Modal Component
const LoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("kishore@Applywizz.com");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      if (navigate) navigate("/dashboard");
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
            <h1 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="mt-3 text-center text-base text-gray-500">
              Sign in to access your H1B sponsor database
            </p>

            <form onSubmit={onSubmit} className="mx-auto mt-6 space-y-4">
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

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <p className="text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <a href="/register" className="font-medium text-blue-600 hover:text-blue-700">
                  Create account
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Component ----------
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const testimonials = [
    {
      name: "Aarav Patel",
      role: "Software Engineer",
      image:
        "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop&crop=face",
      text: `"This platform saved me weeks of searching. Instead of browsing hundreds of sites, I got direct access to verified H1B sponsoring companies in minutes. Totally worth the one-time payment!"`,
    },
    {
      name: "Sofia Martinez",
      role: "Product Designer",
      image:
        "https://images.pexels.com/photos/3764013/pexels-photo-3764013.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop&crop=face",
      text: `"As an international job seeker, finding verified sponsors was my biggest challenge. This site gave me not only names but also career page links — I landed my first interview within days!"`,
    },
    {
      name: "Rajesh Kumar",
      role: "Data Scientist",
      image:
        "https://images.pexels.com/photos/2586823/pexels-photo-2586823.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop&crop=face",
      text: `"The weekly updates keep the company list fresh and relevant. I found several new opportunities that weren't available on other platforms. Highly recommend for anyone serious about their job search!"`,
    },
    {
      name: "Ling Chen",
      role: "UX Researcher",
      image:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop&crop=face",
      text: `"The direct career links saved me so much time. No more guessing which portal to use or if a company actually sponsors visas. This service is a game-changer for international professionals!"`,
    },
    {
      name: "Miguel Rodriguez",
      role: "DevOps Engineer",
      image:
        "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop&crop=face",
      text: `"For less than the cost of a coffee, I got lifetime access to verified sponsors. The ROI is incredible - I received multiple interview calls within the first week of using this platform!"`,
    },
  ];

  // 🔁 REPLACED: Logos → Images
  const galleryImages = [
    " /LOGO_AQUENT_images-removebg-preview.png",
    " /_Covetrus_Logo_rgb-TM_2020 1.png",
    " /DIGITAL OCEAN.png",
    " /ford-logo-02.png",
    " /LOGO_AQUENT_images-removebg-preview.png",
    " /onedigital-logo-vector.png",
    " /SIGNIFY-removebg-preview.png",
    " /VIRTUSA-removebg-preview.png",
    " /YAHOO-removebg-preview.png",
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileOpen(false);
    }
  };

  // Get it now → scroll to pricing (unchanged)
  const handleGetItNow = () => {
    setMobileOpen(false);
    scrollToSection("pricing");
  };

  // NEW: Buy Now → go to payment page directly
  const handleBuyNow = () => {
    setMobileOpen(false);
    if (navigate) navigate("/payment");
  };

  const handleLoginClick = () => {
    setMobileOpen(false);
    setIsLoginModalOpen(true);
  };

  const extendedTestimonials = [...testimonials, ...testimonials, ...testimonials];

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= testimonials.length * 3) return 0;
        return nextIndex;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= extendedTestimonials.length) return 0;
      return nextIndex;
    });
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => {
      const prevIndex = prev - 1;
      if (prevIndex < 0) return extendedTestimonials.length - 1;
      return prevIndex;
    });
    setIsAutoPlaying(false);
  };

  const visibleIndex = currentTestimonial % testimonials.length;

  const cardClass = "group relative";
  const glow =
    "pointer-events-none absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300 blur-xl bg-gradient-to-tr from-purple-500/30 via-fuchsia-400/30 to-blue-400/30";
  const innerCard = "relative p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow";

  return (
    <div className="min-h-screen bg-white">
      {/* Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="relative">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <motion.div
                variants={slideUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                custom={0}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-black">Skill Passport</span>
              </motion.div>

              {/* Desktop Navigation */}
              <motion.nav
                variants={slideUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                custom={1}
                className="hidden md:flex items-center gap-8"
              >
                <button onClick={() => scrollToSection("about")} className="text-gray-600 hover:text-black transition-colors">Featured</button>
                <button onClick={() => scrollToSection("process")} className="text-gray-600 hover:text-black transition-colors">How it works</button>
                <button onClick={() => scrollToSection("pricing")} className="text-gray-600 hover:text-black transition-colors">Pricing</button>
                <button onClick={() => scrollToSection("testimonial")} className="text-gray-600 hover:text-black transition-colors">Testimonial</button>
                <button onClick={() => scrollToSection("contact")} className="text-gray-600 hover:text-black transition-colors">Contact</button>
              </motion.nav>

              {/* Desktop CTA */}
              <motion.button
                variants={slideUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                custom={2}
                onClick={handleLoginClick}
                className="hidden md:inline-flex items-center gap-2 bg-blue-700 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all duration-300"
              >
                <LogIn className="w-5 h-5" />
                Login
              </motion.button>

              {/* Mobile Hamburger */}
              <button
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((s) => !s)}
                className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                key="mobile-menu"
                variants={mobileMenuVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-sm"
              >
                <nav className="px-6 py-4 flex flex-col gap-2">
                  <button onClick={() => scrollToSection("about")} className="w-full text-left py-2 text-gray-700 hover:text-black">Featured</button>
                  <button onClick={() => scrollToSection("process")} className="w-full text-left py-2 text-gray-700 hover:text-black">How it works</button>
                  <button onClick={() => scrollToSection("pricing")} className="w-full text-left py-2 text-gray-700 hover:text-black">Pricing</button>
                  <button onClick={() => scrollToSection("testimonial")} className="w-full text-left py-2 text-gray-700 hover:text-black">Testimonial</button>
                  <button onClick={() => scrollToSection("contact")} className="w-full text-left py-2 text-gray-700 hover:text-black">Contact</button>
                  <button onClick={handleLoginClick} className="w-full text-left py-2 text-gray-700 hover:text-black">Login</button>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ========== 1) EASY ACCESS (Hero) ========== */}
      <section className="pt-32 pb-20 bg-gradient-to-r from-blue-50 via-lavender-200 to-purple-200">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-6 text-center md:text-left">
              <p className="text-sm font-bold tracking-wider uppercase text-purple-700">Easy access</p>
              <motion.h1
                variants={slideUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                custom={0}
                className="text-5xl lg:text-6xl font-bold text-black leading-tight"
              >
                Instant Access to Verified{" "}
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  H1B Sponsors
                </span>
              </motion.h1>

              <motion.p
                variants={slideUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                custom={1}
                className="text-xl text-gray-600 leading-relaxed"
              >
                Your shortcut to abroad jobs: verified sponsors, updated links,
                and reliable company details.
              </motion.p>

              <motion.div
                variants={slideUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                custom={2}
                className="flex justify-center md:justify-start"
              >
                <button
                  onClick={handleGetItNow}
                  className="text-blue-700 px-8 py-4 rounded-full font-semibold text-lg border border-black hover:shadow-lg transition-all duration-300 hover:bg-blue-700 hover:text-white"
                >
                  Get it now
                </button>
              </motion.div>
            </div>

            {/* Right Visual */}
            <motion.div
              variants={slideUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={0}
              className="relative"
            >
              <div className="relative">
                <img
                  src=" /image_for_project naga.avif"
                  alt="Professional using laptop"
                  className="w-full h-full object-cover "
                />

                <motion.div variants={floatUpDown} initial="initial" animate="animate" className="absolute top-4 left-4 bg-white rounded-xl p-4 shadow-lg">
                  <div className="text-sm text-gray-500">Company Portals</div>
                  <div className="text-lg font-bold text-blue-600">150+ Trusted</div>
                </motion.div>

                <motion.div
                  variants={floatUpDownDelayed}
                  initial="initial"
                  animate="animate"
                  className="absolute bottom-4 right-4 bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
                >
                  <div className="flex -space-x-2">
                    <img src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&fit=crop&crop=face" alt="" className="w-8 h-8 rounded-full border-2 border-white" />
                    <img src="https://images.pexels.com/photos/3764013/pexels-photo-3764013.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&fit=crop&crop=face" alt="" className="w-8 h-8 rounded-full border-2 border-white" />
                    <img src="https://images.pexels.com/photos/2586823/pexels-photo-2586823.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&fit=crop&crop=face" alt="" className="w-8 h-8 rounded-full border-2 border-white" />
                  </div>
                  <span className="text-sm text-gray-600">10K+ Active users</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== 2) FEATURED (About) ========== */}
      <section id="about" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm font-bold tracking-wider uppercase text-purple-700">Featured</p>
          <motion.h2
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={0}
            className="text-4xl font-bold text-center mb-20"
          >
            Why choose us for effortless job applications?
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                iconSrc: "/document-verification.svg",
                title: "Verified companies",
                desc: "Access trusted US employers offering H1B visa sponsorships today.",
                bgColor: "bg-purple-50",
              },
              {
                iconSrc: "/One-time-payment.svg",
                title: "One-time payment",
                desc: "Simple lifetime access. Pay once and unlock career opportunities forever.",
                bgColor: "bg-blue-50",
              },
              {
                iconSrc: "/career_links.svg",
                title: "Direct career links",
                desc: "Apply smarter using official portals without wasting time searching online.",
                bgColor: "bg-purple-50",
              },
              {
                iconSrc: "/update.svg",
                title: "Regular updates",
                desc: "Freshly reviewed companies added weekly for the most reliable guidance.",
                bgColor: "bg-blue-50",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={featureCardVariants}
                className={`${cardClass} w-full max-w-xs mx-auto`}
                whileHover={{
                  scale: 1.03,
                  transition: { duration: 0.2 },
                }}
              >
                <div className={glow} />
                <div className={`${innerCard} flex flex-col items-center text-center ${card.bgColor} h-full`}>
                  <img
                    src={card.iconSrc}
                    alt={card.title}
                    className="w-14 h-14 mb-4"
                    loading="lazy"
                  />
                  <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                  <p className="text-gray-600">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== IMAGE CAROUSEL SECTION (replaces logos) ========== */}
      <section className="py-16 bg-gray-50">
        <div>
          <motion.div
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={0}
            className="text-center mb-12"
          >
            {/* optional heading */}
          </motion.div>

          <div className="relative overflow-hidden">
            {/* Seamless infinite loop: duplicate the sequence once */}
            <div className="gallery-track">
              {galleryImages.map((src, index) => (
                <div key={`g1-${index}`} className="flex-shrink-0 mx-4 transition-all duration-300">
                  <img
                    src={src}
                    alt={`Gallery image ${index + 1}`}
                    className="h-20 w-96 object-cover rounded-xl shadow-md"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://via.placeholder.com/256x160/cccccc/666666?text=Image";
                    }}
                    loading="lazy"
                  />
                </div>
              ))}
              {galleryImages.map((src, index) => (
                <div key={`g2-${index}`} className="flex-shrink-0 mx-4 transition-all duration-300" aria-hidden="true">
                  <img
                    src={src}
                    alt=""
                    className="h-20 w-96 object-cover rounded-xl shadow-md"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>
          {`
            /* Seamless, continuous scrolling gallery */
            .gallery-track {
              display: flex;
              gap: 0;
              width: max-content;
              will-change: transform;
              animation: gallery-scroll 10s linear infinite;
            }

            @keyframes gallery-scroll {
              from { transform: translateX(0); }
              to   { transform: translateX(-50%); }
            }

            /* Pause on hover */
            .gallery-track:hover {
              animation-play-state: paused;
            }
          `}
        </style>
      </section>

      {/* ========== 3) HOW IT WORKS (Process) ========== */}
      <section id="process" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm font-bold tracking-wider uppercase text-purple-700">How it works</p>
          <motion.h2
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={0}
            className="text-4xl font-bold text-center mb-20"
          >
            Unlock your H1B opportunities in 3 quick steps
          </motion.h2>
        </div>

        <div className="container mx-auto px-6">
          <motion.div
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={1}
            className="max-w-5xl mx-auto"
          >
            <div className="grid md:grid-cols-3 gap-8 justify-center">
              {[
                {
                  title: "Sign up free",
                  desc: "Create your account quickly using email or social login to access the portal.",
                  bgColor: "bg-blue-50",
                  image: " /add-user.svg",
                },
                {
                  title: "Make one-time payment",
                  desc: "Unlock lifetime access by paying just $14.99 — no hidden fees, no subscriptions.",
                  bgColor: "bg-purple-50",
                  image: " /wallet (1).svg",
                },
                {
                  title: "Explore company list",
                  desc: "Instantly browse verified H1B sponsoring companies with names, domains, and career page links.",
                  bgColor: "bg-blue-50",
                  image: " /document-verification.svg",
                },
              ].map((card, idx) => (
                <motion.div
                  key={idx}
                  variants={slideUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  custom={idx}
                  className={`${cardClass} w-full max-w-xs mx-auto`}
                  whileHover={{
                    scale: 1.03,
                    transition: { duration: 0.2 },
                  }}
                >
                  <div className={glow} />
                  <div className={`${innerCard} text-center ${card.bgColor} h-full`}>
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white flex items-center justify-center overflow-hidden">
                      <img src={card.image} alt={card.title} className="w-12 h-12 object-contain" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">{card.title}</h3>
                    <p className="text-gray-600">{card.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              variants={slideUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={3}
              className="text-center mt-12"
            >
              <button
                onClick={handleGetItNow}
                className="bg-blue-700 text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-all duration-300"
              >
                Get Started Now
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========== 4) PRICING ========== */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm font-bold tracking-wider uppercase text-purple-700">Pricing</p>
          <motion.h2
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={0}
            className="text-4xl font-bold text-center mb-20"
          >
            Simple one-time pricing
          </motion.h2>

          <motion.div
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={1}
            className={`${cardClass} max-w-md mx-auto`}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <div className={glow} />
            <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl p-8 text-white overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10" />
              <div className="relative">
                <h3 className="text-xl font-semibold mb-4 text-gray-300">Lifetime Access</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$14.99</span>
                  <span className="text-gray-400 ml-2">/lifetime</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Access 500+ verified companies</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Company names, domains &amp; career links</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Weekly list updates included</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Lifetime login, no expiry</span>
                  </li>
                </ul>
                <button

                  onClick={handleBuyNow} 
                //    {/* <-- Navigate to /signup */}
                  className="w-full bg-blue-700 text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========== 5) TESTIMONIALS ========== */}
      <section id="testimonial" className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm font-bold tracking-wider uppercase text-purple-700">Testimonials</p>
          <motion.h2
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={0}
            className="text-4xl font-bold text-center mb-12"
          >
            We've earned trust through reviews from real users.
          </motion.h2>

          {/* Mobile view - stacked cards */}
          <div className="lg:hidden space-y-8 mt-10">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                variants={slideUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                custom={idx + 1}
                className={`${cardClass} w-full max-w-md mx-auto`}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <div className={glow} />
                <div className={`${innerCard} p-6 bg-white`}>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">{testimonial.text}</p>
                  <div className="flex items-center gap-3">
                    <img src={testimonial.image} alt={testimonial.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop view - carousel */}
          <div className="hidden lg:block mt-14">
            <div className="relative max-w-6xl mx-auto">
              <div className="overflow-hidden">
                <motion.div
                  className="flex"
                  animate={{ x: `-${currentTestimonial * 33.333}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {extendedTestimonials.map((testimonial, idx) => (
                    <div key={idx} className="w-1/3 flex-shrink-0 px-4">
                      <div className={cardClass}>
                        <div className={glow} />
                        <div className={`${innerCard} p-6 h-full bg-white`}>
                          <div className="flex gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <p className="text-gray-700 mb-4">{testimonial.text}</p>
                          <div className="flex items-center gap-3 mt-auto">
                            <img src={testimonial.image} alt={testimonial.name} className="w-10 h-10 rounded-full" />
                            <div>
                              <div className="font-semibold">{testimonial.name}</div>
                              <div className="text-sm text-gray-500">{testimonial.role}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Navigation buttons */}
              <button
                onClick={prevTestimonial}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextTestimonial}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Indicators */}
              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentTestimonial(idx);
                      setIsAutoPlaying(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      visibleIndex === idx ? "bg-blue-700 w-6" : "bg-gray-300"
                    }`}
                    aria-label={`Go to testimonial ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ========== 6) CONTACT ========== */}
      <section id="contact" className="py-20 bg-white border-t border-gray-100">
        <div className="container mx-auto px-6">
          <motion.div
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="max-w-3xl mx-auto text-center space-y-6"
          >
            <p className="text-sm font-bold tracking-wider uppercase text-purple-700">Contact</p>
            <h2 className="text-4xl font-bold text-gray-900">Chat with our WhatsApp support</h2>
            <p className="text-base text-gray-600">Need help getting started? Reach our team directly on WhatsApp and we'll respond quickly.</p>
            <div>
              <a
                href="https://wa.me/917997719874"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-full bg-green-600 px-8 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp +91 79977 19874
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;


