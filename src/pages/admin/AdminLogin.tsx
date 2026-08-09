import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { googleLogin } from '../../services/admin.service';

export default function AdminLogin() {
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (localStorage.getItem('admin_token')) {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    if (!clientId) {
      setError('Google sign-in has not been configured for this deployment.');
      setLoading(false);
      return;
    }

    const render = () => {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setError('');
          try {
            const result = await googleLogin(credential);
            localStorage.setItem('admin_token', result.token);
            localStorage.setItem('admin_email', result.admin.email);
            navigate('/admin/dashboard');
          } catch (loginError) {
            if (axios.isAxiosError(loginError) && typeof loginError.response?.data?.error === 'string') {
              setError(loginError.response.data.error);
            } else {
              setError('Sign-in failed. Please try again.');
            }
          }
        },
      });
      buttonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        width: 300,
      });
      setLoading(false);
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    if (existing) {
      if (window.google) render();
      else existing.addEventListener('load', render, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.addEventListener('load', render, { once: true });
    script.addEventListener('error', () => {
      setError('Google sign-in could not be loaded.');
      setLoading(false);
    }, { once: true });
    document.head.appendChild(script);
  }, [clientId, navigate]);

  return (
    <main className="grid min-h-screen bg-earth-50 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-earth-900 p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(233,120,24,0.35),transparent_48%)]" />
        <div className="relative max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-saffron-500">Gaushala administration</p>
          <h1 className="mt-4 text-5xl font-bold leading-tight">Keep every visit organized in one place.</h1>
          <p className="mt-6 text-lg leading-8 text-stone-300">Manage bookings, availability, and the weekly visit schedule.</p>
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-soft sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron-50 text-2xl">ॐ</div>
          <p className="mt-7 text-sm font-semibold text-saffron-600">Admin access</p>
          <h2 className="mt-1 text-3xl font-bold">Welcome back</h2>
          <p className="mt-3 leading-7 text-earth-700">Sign in with the authorized Gaushala Google account.</p>
          <div className="mt-8 flex min-h-[44px] justify-center">
            {loading && <div className="h-11 w-[300px] animate-pulse rounded-full bg-earth-100" />}
            <div ref={buttonRef} className={loading ? 'hidden' : ''} />
          </div>
          {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          <Link to="/" className="mt-8 inline-flex text-sm font-semibold text-saffron-700">← Return to public booking</Link>
        </div>
      </section>
    </main>
  );
}
