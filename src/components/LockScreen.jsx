import { useState } from 'react';
import { useFamily } from '../context/FamilyContext';

export default function LockScreen() {
  const { login, setupPassword, authRequired } = useFamily();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSetup, setIsSetup] = useState(!authRequired);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const valid = await login(password);
    if (!valid) {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const success = await setupPassword(password);
    if (!success) {
      setError('Failed to set up password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-stone-50 to-sacred-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-saffron-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🕉️</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-saffron-800">वंशावली</h1>
          <p className="text-stone-500 mt-1">Vanshavali — Family Lineage Tracker</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8">
          {isSetup ? (
            <>
              <h2 className="text-lg font-semibold text-stone-700 mb-1">Welcome Back</h2>
              <p className="text-sm text-stone-500 mb-6">Enter your password to access your family records.</p>
              <form onSubmit={handleLogin}>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input mb-4"
                  autoFocus
                />
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                <button type="submit" className="btn btn-primary w-full">
                  Unlock
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-stone-700 mb-1">Set Up Protection</h2>
              <p className="text-sm text-stone-500 mb-6">Create a password to protect your family data.</p>
              <form onSubmit={handleSetup}>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create password (min 4 characters)"
                  className="input mb-3"
                  autoFocus
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="input mb-4"
                />
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                <button type="submit" className="btn btn-primary w-full">
                  Set Password & Continue
                </button>
              </form>
              <button
                onClick={() => {
                  // Skip password setup
                  window.location.reload();
                }}
                className="btn btn-ghost w-full mt-2 text-sm"
              >
                Skip for now
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          Your data is stored locally on this device only.
        </p>
      </div>
    </div>
  );
}
