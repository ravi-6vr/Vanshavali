import { useState } from 'react';
import { GOTRAM_DATA } from '../data/vedic';

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [self, setSelf] = useState({ firstName: '', lastName: '', gender: 'Male', dob: '', pob: '', gotram: '' });
  const [father, setFather] = useState({ firstName: '', lastName: '' });
  const [mother, setMother] = useState({ firstName: '', lastName: '' });
  const [summary, setSummary] = useState(null);

  const handleFinish = async () => {
    setSaving(true);
    try {
      const selfId = crypto.randomUUID();
      const fatherId = father.firstName.trim() ? crypto.randomUUID() : null;
      const motherId = mother.firstName.trim() ? crypto.randomUUID() : null;

      const selfMember = {
        id: selfId,
        firstName: self.firstName,
        lastName: self.lastName,
        gender: self.gender,
        dob: self.dob,
        pob: self.pob,
        gotram: self.gotram,
        fatherId,
        motherId,
        spouseId: null,
        childrenIds: [],
        isDeceased: false,
      };

      // Save self
      await fetch('/api/members/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selfMember),
      });

      // Save father
      if (fatherId) {
        await fetch('/api/members/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: fatherId,
            firstName: father.firstName,
            lastName: father.lastName || self.lastName,
            gender: 'Male',
            gotram: self.gotram,
            childrenIds: [selfId],
            spouseId: motherId,
            fatherId: null, motherId: null, isDeceased: false,
          }),
        });
      }

      // Save mother
      if (motherId) {
        await fetch('/api/members/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: motherId,
            firstName: mother.firstName,
            lastName: mother.lastName,
            gender: 'Female',
            childrenIds: [selfId],
            spouseId: fatherId,
            fatherId: null, motherId: null, isDeceased: false,
          }),
        });
      }

      const count = 1 + (fatherId ? 1 : 0) + (motherId ? 1 : 0);
      setSummary({ name: `${self.firstName} ${self.lastName}`, count });
      setStep(3);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-white to-sacred-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i === step ? 'bg-saffron-600 scale-125' : i < step ? 'bg-saffron-300' : 'bg-stone-200'
            }`} />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center animate-in">
            <h1 className="font-telugu text-4xl font-bold text-saffron-700 mb-2">వంశావళి</h1>
            <h2 className="text-2xl font-display font-semibold text-stone-800 mb-4">Welcome to Vanshavali</h2>
            <p className="text-stone-500 mb-2">Your private family lineage tracker with Vedic roots.</p>
            <p className="text-stone-400 text-sm mb-8">Let's start by adding yourself to the family tree.</p>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-200 mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl">🌳</p>
                  <p className="text-xs text-stone-500 mt-1">Family Tree</p>
                </div>
                <div>
                  <p className="text-2xl">🕉️</p>
                  <p className="text-xs text-stone-500 mt-1">Vedic Details</p>
                </div>
                <div>
                  <p className="text-2xl">🔒</p>
                  <p className="text-xs text-stone-500 mt-1">100% Private</p>
                </div>
              </div>
            </div>
            <button onClick={() => setStep(1)} className="btn btn-primary px-8 py-3 text-base">
              Get Started
            </button>
          </div>
        )}

        {/* Step 1: Add yourself */}
        {step === 1 && (
          <div className="animate-in">
            <h2 className="text-xl font-display font-semibold text-stone-800 text-center mb-6">About You</h2>
            <div className="card space-y-4">
              <div>
                <label className="label">First Name *</label>
                <input className="input" value={self.firstName} onChange={e => setSelf(p => ({ ...p, firstName: e.target.value }))} autoFocus placeholder="Your first name" />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input" value={self.lastName} onChange={e => setSelf(p => ({ ...p, lastName: e.target.value }))} placeholder="Family name" />
              </div>
              <div>
                <label className="label">Gender</label>
                <div className="flex gap-3">
                  {['Male', 'Female', 'Other'].map(g => (
                    <label key={g} className={`flex-1 text-center py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition-all ${
                      self.gender === g
                        ? g === 'Male' ? 'bg-blue-50 border-blue-300 text-blue-700' : g === 'Female' ? 'bg-pink-50 border-pink-300 text-pink-700' : 'bg-purple-50 border-purple-300 text-purple-700'
                        : 'bg-white border-stone-300 text-stone-500 hover:bg-stone-50'
                    }`}>
                      <input type="radio" className="hidden" checked={self.gender === g} onChange={() => setSelf(p => ({ ...p, gender: g }))} />
                      {g}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date of Birth</label>
                  <input type="date" className="input" value={self.dob} onChange={e => setSelf(p => ({ ...p, dob: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Place of Birth</label>
                  <input className="input" value={self.pob} onChange={e => setSelf(p => ({ ...p, pob: e.target.value }))} placeholder="e.g., Hyderabad" />
                </div>
              </div>
              <div>
                <label className="label">Gotram</label>
                <select className="select" value={self.gotram} onChange={e => setSelf(p => ({ ...p, gotram: e.target.value }))}>
                  <option value="">-- Select (optional) --</option>
                  {GOTRAM_DATA.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(0)} className="btn btn-secondary">Back</button>
              <button
                onClick={() => { if (!self.firstName.trim()) return alert('First name is required'); setStep(2); }}
                className="btn btn-primary"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Add parents */}
        {step === 2 && (
          <div className="animate-in">
            <h2 className="text-xl font-display font-semibold text-stone-800 text-center mb-2">Add Your Parents</h2>
            <p className="text-center text-stone-400 text-sm mb-6">Optional — you can always add or edit them later</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="card">
                <h3 className="text-sm font-semibold text-blue-700 mb-3">Father</h3>
                <div className="space-y-3">
                  <div>
                    <label className="label">First Name</label>
                    <input className="input" value={father.firstName} onChange={e => setFather(p => ({ ...p, firstName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input className="input" value={father.lastName} onChange={e => setFather(p => ({ ...p, lastName: e.target.value }))} placeholder={self.lastName || ''} />
                  </div>
                </div>
              </div>
              <div className="card">
                <h3 className="text-sm font-semibold text-pink-700 mb-3">Mother</h3>
                <div className="space-y-3">
                  <div>
                    <label className="label">First Name</label>
                    <input className="input" value={mother.firstName} onChange={e => setMother(p => ({ ...p, firstName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input className="input" value={mother.lastName} onChange={e => setMother(p => ({ ...p, lastName: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn btn-secondary">Back</button>
              <div className="flex gap-3">
                <button onClick={() => { setFather({ firstName: '', lastName: '' }); setMother({ firstName: '', lastName: '' }); handleFinish(); }} className="btn btn-ghost text-stone-400">
                  Skip
                </button>
                <button onClick={handleFinish} className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Finish'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && summary && (
          <div className="text-center animate-in">
            <div className="text-6xl mb-4">🌳</div>
            <h2 className="text-2xl font-display font-semibold text-stone-800 mb-2">Your Family Tree Has Begun!</h2>
            <p className="text-stone-500 mb-6">
              Added <span className="font-bold text-saffron-700">{summary.count} members</span> starting with {summary.name}
            </p>
            <div className="bg-sacred-50 rounded-xl p-6 border border-sacred-200 mb-8">
              <p className="text-sm text-sacred-700">
                You can now explore the tree, add more family members, record stories, upload photos, and much more.
              </p>
            </div>
            <button onClick={onComplete} className="btn btn-primary px-8 py-3 text-base">
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
