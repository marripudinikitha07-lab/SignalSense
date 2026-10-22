import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 sm:my-12 px-4">
      <div className="card-theme p-6 sm:p-8 rounded-2xl shadow-lg border border-plum-900/10 dark:border-coral-300/20">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#BD5579] to-[#EA9D9D] text-white shadow-md mb-3">
            <UserPlus className="w-6 h-6 text-[#200718]" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-plum-900 dark:text-cream-200">
            Create an Account
          </h2>
          <p className="text-xs text-berry-700 dark:text-coral-300 mt-1">
            Join SignalSense for anomaly exploration and benchmark evaluation
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 flex items-start space-x-2.5 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1 font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-plum-800 dark:text-coral-200 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-plum-600 dark:text-coral-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-warm-cream/30 dark:bg-plum-900/40 border border-plum-900/20 dark:border-coral-300/20 text-plum-950 dark:text-cream-100 placeholder-plum-700/40 dark:placeholder-coral-300/40 text-sm focus:outline-none focus:ring-2 focus:ring-berry-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-plum-800 dark:text-coral-200 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-plum-600 dark:text-coral-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@university.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-warm-cream/30 dark:bg-plum-900/40 border border-plum-900/20 dark:border-coral-300/20 text-plum-950 dark:text-cream-100 placeholder-plum-700/40 dark:placeholder-coral-300/40 text-sm focus:outline-none focus:ring-2 focus:ring-berry-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-plum-800 dark:text-coral-200 mb-1.5">
              Password <span className="normal-case font-normal text-[11px] text-berry-600 dark:text-coral-300">(min. 8 characters)</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-plum-600 dark:text-coral-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-warm-cream/30 dark:bg-plum-900/40 border border-plum-900/20 dark:border-coral-300/20 text-plum-950 dark:text-cream-100 placeholder-plum-700/40 dark:placeholder-coral-300/40 text-sm focus:outline-none focus:ring-2 focus:ring-berry-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-plum-600 dark:text-coral-300 hover:text-plum-900 dark:hover:text-cream-100 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-plum-800 dark:text-coral-200 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-plum-600 dark:text-coral-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-warm-cream/30 dark:bg-plum-900/40 border border-plum-900/20 dark:border-coral-300/20 text-plum-950 dark:text-cream-100 placeholder-plum-700/40 dark:placeholder-coral-300/40 text-sm focus:outline-none focus:ring-2 focus:ring-berry-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-plum-600 dark:text-coral-300 hover:text-plum-900 dark:hover:text-cream-100 p-1"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl btn-primary font-semibold text-sm flex items-center justify-center space-x-2 mt-6 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
          >
            {isSubmitting ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-5 border-t border-plum-900/10 dark:border-coral-300/15 text-center text-xs text-plum-800 dark:text-coral-200">
          Already registered?{' '}
          <Link
            to="/login"
            state={location.state}
            className="font-bold text-berry-600 dark:text-coral-300 hover:underline inline-flex items-center gap-0.5"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
