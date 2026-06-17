import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(identifier, password);
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4">
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          className="absolute -bottom-10 -right-10 h-[420px] w-[620px] text-orange-500"
          viewBox="0 0 620 420"
          fill="none"
        >
          <path
            d="M40 420C160 380 200 300 270 300C340 300 320 380 390 380C460 380 480 260 580 180C620 150 640 100 640 60"
            stroke="currentColor"
            strokeWidth="3"
          />
        </svg>
        <span className="absolute bottom-24 right-44 h-4 w-4 rounded-full bg-orange-300" />
        <span className="absolute bottom-10 right-72 h-16 w-16 rounded-full bg-gray-900" />
        <span className="absolute -bottom-6 right-16 h-28 w-28 rounded-full bg-orange-500" />
        <span className="absolute bottom-44 right-6 h-3 w-3 rounded-full bg-orange-400" />

        <span className="absolute left-10 top-1/2 h-2.5 w-2.5 rounded-full bg-orange-500" />
        <span className="absolute left-24 top-[58%] h-2 w-2 rounded-full bg-gray-900" />
        <span className="absolute left-6 top-[64%] h-16 w-16 rounded-full bg-orange-500" />
        <span className="absolute left-32 top-[78%] h-3.5 w-3.5 rounded-full bg-gray-900" />
      </div>

      <div className="relative w-full max-w-sm rounded-2xl bg-white p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="BillXpress" className="mb-4 h-10 w-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="mb-1 block text-sm text-gray-700">
              Username <span className="text-orange-500">*</span>
            </label>
            <input
              id="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-md border-0 bg-gray-100 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none ring-1 ring-transparent focus:bg-white focus:ring-orange-500"
              placeholder="Enter your Username, Email or Phone"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-gray-700">
              Password <span className="text-orange-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border-0 bg-gray-100 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none ring-1 ring-transparent focus:bg-white focus:ring-orange-500"
              placeholder="Enter your Password"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            Remember me
          </label>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>

          <p className="text-center text-sm text-gray-400">Forgot password?</p>
        </form>
      </div>
    </div>
  );
}
