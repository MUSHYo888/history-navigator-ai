import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Stethoscope, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const CLINICAL_PEARLS = [
  "The most common cause of missed diagnosis is premature closure of the differential; always consider 'The Great Mimickers' like TB or Sarcoidosis.",
  "Red Flags in History: Always screen for unintentional weight loss, night sweats, or focal neurological deficits in patients with chronic complaints.",
  "Diagnostic Reasoning: AI-assisted history taking reduces bias by suggesting rare but critical differentials that might be overlooked in a high-volume clinical setting."
];

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-teal-500/70 focus-within:bg-teal-600/10">
    {children}
  </div>
);

export default function WelcomeSandbox() {
  const [showPassword, setShowPassword] = useState(false);
  const [currentPearlIndex, setCurrentPearlIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPearlIndex((prevIndex) => (prevIndex + 1) % CLINICAL_PEARLS.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const { error } = isSignUp 
      ? await signUp(email, password)
      : await signIn(email, password);
      
    setIsLoading(false);
    
    if (error) {
      toast.error(error.message || `Invalid ${isSignUp ? 'sign up' : 'login'} credentials`);
    } else {
      if (isSignUp) {
        toast.success('Account created successfully! Check your email to confirm.');
      } else {
        toast.success('Welcome back, Doctor.');
        navigate('/'); // Redirect to the clinical dashboard on success
      }
    }
  };

  return (
    <div className="flex flex-row min-h-screen w-screen overflow-hidden bg-white">
      {/* Left Side: Login Form */}
      <section className="w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-semibold leading-tight flex items-center gap-3"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
              >
                <Stethoscope className="h-10 w-10 text-teal-600" />
              </motion.div>
              <span className="font-semibold text-gray-900 tracking-tight">
                {isSignUp ? "Create Your Doctor Account" : <>Welcome to <span className="text-teal-600">History Pro</span></>}
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-muted-foreground"
            >
              Your AI-Powered Clinical Partner. Please sign in to access your clinical workspace.
            </motion.p>

            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-5" 
              onSubmit={handleSubmit}
            >
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Email Address</label>
                <GlassInputWrapper>
                  <input name="email" type="email" placeholder="doctor@hospital.org" className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" required />
                </GlassInputWrapper>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="rememberMe" className="custom-checkbox h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-600" />
                  <span className="text-foreground/90">Keep me signed in</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Reset Password clicked"); }} className="hover:underline text-teal-600 transition-colors font-medium">Reset password</a>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full flex items-center justify-center rounded-2xl bg-teal-600 py-4 font-medium text-white hover:bg-teal-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </motion.form>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative flex items-center justify-center mt-2"
            >
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-sm text-muted-foreground bg-white absolute">Or continue with</span>
            </motion.div>

            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              type="button" 
              onClick={() => toast.info("Google Sign In clicked")} 
              className="w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors"
            >
                <GoogleIcon />
                Continue with Google
            </motion.button>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-center text-sm text-muted-foreground mt-4"
            >
              {isSignUp ? (
                <>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(false); }} className="text-teal-600 hover:text-teal-500 hover:underline transition-colors font-medium">Sign In</a></>
              ) : (
                <>New to our platform? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(true); }} className="text-teal-600 hover:text-teal-500 hover:underline transition-colors font-medium">Create Account</a></>
              )}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Right Side: Brand/Hero */}
      <section className="w-1/2 relative flex flex-col items-center justify-center p-12 overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500 to-teal-800">
        
        {/* Animated Mesh Gradient Blobs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-teal-400 opacity-20 blur-[100px] pointer-events-none"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-teal-900 opacity-40 blur-[100px] pointer-events-none"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            x: [0, -30, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] left-[20%] h-[400px] w-[400px] rounded-full bg-emerald-500 opacity-20 blur-[100px] pointer-events-none"
        />

        <div className="flex flex-col items-center max-w-lg text-center space-y-8 z-10">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-full bg-white/10 p-6 backdrop-blur-md shadow-inner border border-white/20"
          >
            <Stethoscope className="h-20 w-20 text-white" strokeWidth={1.5} />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6 w-full"
          >
            <div className="space-y-4">
              <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl text-white drop-shadow-sm">
                History Pro
              </h1>
              <p className="text-lg font-medium text-teal-50 sm:text-xl drop-shadow-sm">
                Your AI-Powered Clinical Partner.
              </p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
              className="mt-8 p-6 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl text-teal-50 text-sm text-left leading-relaxed shadow-2xl min-h-[140px] flex items-center overflow-hidden relative"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPearlIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="w-full"
                >
                  <strong className="font-semibold text-white tracking-wide uppercase text-xs mb-2 block opacity-80">Clinical Pearl</strong>
                  <span className="text-base leading-relaxed block">{CLINICAL_PEARLS[currentPearlIndex]}</span>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}