import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import {
  NAKSHATRAM_LIST, RAASI_LIST, TITHI_LIST, MASAM_LIST, PAKSHAM_LIST,
  GOTRAM_DATA, SAMSKARA_LIST, deriveRaasi, inheritGotram, getGotramDetails,
} from '../data/vedic';

export default function MemberForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { members, saveMember } = useFamily();
  const isEdit = !!id;

  const existingMember = isEdit ? members.find(m => m.id === id) : null;

  const [form, setForm] = useState({
    firstName: '', lastName: '', gender: 'Male',
    dob: '', tob: '', pob: '',
    nakshatram: '', pada: '', raasi: '',
    tithi: '', masam: '', paksham: '', gotram: '',
    fatherId: '', motherId: '', spouseId: '',
    marriageDate: '',
    isDeceased: false, dateOfDeath: '',
    deathTithi: '', deathMasam: '', deathPaksham: '',
  });

  // Each entry: { id, firstName, lastName, gender, dob } — name captured at selection time
  const [childrenList, setChildrenList] = useState([]);
  const [saving, setSaving] = useState(false);

  // Pre-fill on edit
  useEffect(() => {
    if (existingMember) {
      setForm({
        firstName: existingMember.firstName || '',
        lastName: existingMember.lastName || '',
        gender: existingMember.gender || 'Male',
        dob: existingMember.dob || '',
        tob: existingMember.tob || '',
        pob: existingMember.pob || '',
        nakshatram: existingMember.nakshatram || '',
        pada: existingMember.pada || '',
        raasi: existingMember.raasi || '',
        tithi: existingMember.tithi || '',
        masam: existingMember.masam || '',
        paksham: existingMember.paksham || '',
        gotram: existingMember.gotram || '',
        fatherId: existingMember.fatherId || '',
        motherId: existingMember.motherId || '',
        spouseId: existingMember.spouseId || '',
        marriageDate: existingMember.marriageDate || '',
        isDeceased: existingMember.isDeceased || false,
        dateOfDeath: existingMember.dateOfDeath || '',
        deathTithi: existingMember.deathTithi || '',
        deathMasam: existingMember.deathMasam || '',
        deathPaksham: existingMember.deathPaksham || '',
      });
      // Build children list with names baked in
      setChildrenList((existingMember.childrenIds || []).map(cid => {
        const c = members.find(m => m.id === cid);
        return { id: cid, firstName: c?.firstName || '', lastName: c?.lastName || '', gender: c?.gender || '', dob: c?.dob || '' };
      }));
    }
  }, [existingMember]);

  // AUTO-DERIVE: Raasi from Nakshatram + Pada
  useEffect(() => {
    if (form.nakshatram && form.pada) {
      const derived = deriveRaasi(form.nakshatram, form.pada);
      if (derived) {
        setForm(prev => ({ ...prev, raasi: derived }));
      }
    }
  }, [form.nakshatram, form.pada]);

  // AUTO-DERIVE: Gotram from father's lineage
  useEffect(() => {
    if (!form.gotram && form.fatherId) {
      const inherited = inheritGotram(members, form.fatherId);
      if (inherited) {
        setForm(prev => ({ ...prev, gotram: inherited }));
      }
    }
  }, [form.fatherId, form.gotram, members]);

  // AUTO-SUGGEST: Last name from father
  useEffect(() => {
    if (!form.lastName && form.fatherId) {
      const father = members.find(m => m.id === form.fatherId);
      if (father?.lastName) {
        setForm(prev => ({ ...prev, lastName: father.lastName }));
      }
    }
  }, [form.fatherId, form.lastName, members]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Group members by last name for dropdowns
  const membersByLastName = useMemo(() => {
    const sorted = [...members].sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
    );
    return sorted;
  }, [members]);

  const gotramDetails = form.gotram ? getGotramDetails(form.gotram) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim()) return alert('First name is required');

    setSaving(true);
    try {
      const memberId = isEdit ? id : crypto.randomUUID();
      // Spread existing member first to preserve fields this form doesn't manage
      // (health, memories, journeyEvents, samskaras, etc.)
      const member = {
        ...(existingMember || {}),
        id: memberId,
        ...form,
        pada: form.pada || '',
        childrenIds: childrenList.map(c => c.id),
        fatherId: form.fatherId || null,
        motherId: form.motherId || null,
        spouseId: form.spouseId || null,
        marriageDate: form.marriageDate || null,
      };
      await saveMember(member);
      navigate(`/members/${memberId}`);
    } catch (err) {
      alert('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">{isEdit ? 'Edit Member' : 'Add New Member'}</h1>
        <p className="text-stone-500 text-sm mt-1">
          {isEdit ? 'Update member details' : 'Fields marked with * are required. Raasi, Gotram, and Last Name are auto-derived when possible.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* === PERSONAL DETAILS === */}
        <Section title="Personal Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First Name *" required>
              <input className="input" value={form.firstName} onChange={e => update('firstName', e.target.value)} autoFocus />
            </Field>
            <Field label="Last Name" hint={form.fatherId && !existingMember?.lastName ? 'Auto-filled from father' : ''}>
              <input className="input" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
            </Field>
            <Field label="Gender *">
              <div className="flex gap-3">
                {['Male', 'Female', 'Other'].map(g => (
                  <label key={g} className={`flex-1 text-center py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition-all ${
                    form.gender === g
                      ? g === 'Male' ? 'bg-blue-50 border-blue-300 text-blue-700' : g === 'Female' ? 'bg-pink-50 border-pink-300 text-pink-700' : 'bg-purple-50 border-purple-300 text-purple-700'
                      : 'bg-white border-stone-300 text-stone-500 hover:bg-stone-50'
                  }`}>
                    <input type="radio" className="hidden" checked={form.gender === g} onChange={() => update('gender', g)} />
                    {g}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Date of Birth">
              <input type="date" className="input" value={form.dob} onChange={e => update('dob', e.target.value)} />
            </Field>
            <Field label="Time of Birth">
              <input type="time" className="input" value={form.tob} onChange={e => update('tob', e.target.value)} />
            </Field>
            <Field label="Place of Birth">
              <input className="input" value={form.pob} onChange={e => update('pob', e.target.value)} placeholder="e.g., Machilipatnam" />
            </Field>
          </div>
        </Section>

        {/* === VEDIC / ASTROLOGICAL === */}
        <Section title="Vedic Details" subtitle="Raasi is auto-calculated from Nakshatram + Pada">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Nakshatram">
              <select className="select" value={form.nakshatram} onChange={e => update('nakshatram', e.target.value)}>
                <option value="">-- Select --</option>
                {NAKSHATRAM_LIST.map(n => (
                  <option key={n.name} value={n.name}>{n.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Pada">
              <select className="select" value={form.pada} onChange={e => update('pada', e.target.value)}>
                <option value="">-- Select --</option>
                {[1, 2, 3, 4].map(p => (
                  <option key={p} value={String(p)}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Raasi" hint={form.nakshatram && form.pada ? 'Auto-derived' : ''}>
              <select className="select" value={form.raasi} onChange={e => update('raasi', e.target.value)}>
                <option value="">-- Select --</option>
                {RAASI_LIST.map(r => (
                  <option key={r.name} value={r.name}>{r.name} ({r.english})</option>
                ))}
              </select>
            </Field>
            <Field label="Masam (Lunar Month)">
              <select className="select" value={form.masam} onChange={e => update('masam', e.target.value)}>
                <option value="">-- Select --</option>
                {MASAM_LIST.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Paksham">
              <select className="select" value={form.paksham} onChange={e => update('paksham', e.target.value)}>
                <option value="">-- Select --</option>
                {PAKSHAM_LIST.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Tithi">
              <select className="select" value={form.tithi} onChange={e => update('tithi', e.target.value)}>
                <option value="">-- Select --</option>
                {TITHI_LIST.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Gotram" hint={form.fatherId && !existingMember?.gotram ? 'Auto-inherited from father\'s lineage' : ''}>
              <div className="flex gap-3">
                <select className="select flex-1" value={form.gotram} onChange={e => update('gotram', e.target.value)}>
                  <option value="">-- Select or type below --</option>
                  {GOTRAM_DATA.map(g => (
                    <option key={g.name} value={g.name}>{g.name} (Rishi: {g.rishi})</option>
                  ))}
                </select>
                <input
                  className="input flex-1"
                  value={form.gotram}
                  onChange={e => update('gotram', e.target.value)}
                  placeholder="Or type custom gotram"
                />
              </div>
            </Field>
            {gotramDetails && (
              <div className="mt-2 p-3 bg-saffron-50 rounded-lg border border-saffron-100">
                <p className="text-sm text-saffron-800">
                  <strong>Pravara:</strong> {gotramDetails.pravara.join(' → ')}
                </p>
                <p className="text-xs text-saffron-600 mt-1">Rishi: {gotramDetails.rishi}</p>
              </div>
            )}
          </div>
        </Section>

        {/* === FAMILY RELATIONSHIPS === */}
        <Section title="Family Relationships" subtitle="Select existing members or leave blank">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Father">
              <MemberPicker
                value={form.fatherId}
                onChange={v => update('fatherId', v)}
                members={membersByLastName.filter(m => m.gender === 'Male' || !m.gender)}
                placeholder="-- Select Father --"
                excludeId={id}
              />
            </Field>
            <Field label="Mother">
              <MemberPicker
                value={form.motherId}
                onChange={v => update('motherId', v)}
                members={membersByLastName.filter(m => m.gender === 'Female' || !m.gender)}
                placeholder="-- Select Mother --"
                excludeId={id}
              />
            </Field>
            <Field label="Spouse">
              <MemberPicker
                value={form.spouseId}
                onChange={v => update('spouseId', v)}
                members={membersByLastName}
                placeholder="-- Select Spouse --"
                excludeId={id}
              />
            </Field>
            {form.spouseId && (
              <Field label="Marriage Date">
                <input type="date" className="input" value={form.marriageDate} onChange={e => update('marriageDate', e.target.value)} />
              </Field>
            )}
          </div>

          {/* Children */}
          <div className="mt-4">
            <Field label={`Children${childrenList.length > 0 ? ` (${childrenList.length})` : ''}`}>
              <div className="space-y-2">
                {/* List of added children — name is baked into each entry */}
                {childrenList.map((child) => (
                  <div key={child.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-stone-200 shadow-sm">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                      child.gender === 'Male' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                      child.gender === 'Female' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {child.firstName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {`${child.firstName} ${child.lastName || ''}`.trim() || 'Unknown'}
                      </p>
                      {child.dob && <p className="text-xs text-stone-400">{child.dob}</p>}
                    </div>
                    <button
                      type="button"
                      className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition font-medium"
                      onClick={() => setChildrenList(prev => prev.filter(c => c.id !== child.id))}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {/* Add child picker */}
                <MemberPicker
                  value=""
                  onChange={v => {
                    if (!v || childrenList.some(c => c.id === v)) return;
                    const m = members.find(x => x.id === v);
                    // Single state update — name is captured immediately
                    setChildrenList(prev => [...prev, {
                      id: v,
                      firstName: m?.firstName || '',
                      lastName: m?.lastName || '',
                      gender: m?.gender || '',
                      dob: m?.dob || '',
                    }]);
                  }}
                  members={membersByLastName.filter(m => m.id !== id && !childrenList.some(c => c.id === m.id))}
                  placeholder="+ Add child..."
                  excludeId={id}
                />
              </div>
            </Field>
          </div>
        </Section>

        {/* === DECEASED === */}
        <Section title="Status">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-stone-300 text-saffron-600 focus:ring-saffron-500"
              checked={form.isDeceased}
              onChange={e => update('isDeceased', e.target.checked)}
            />
            <span className="text-sm font-medium text-stone-700">Mark as deceased</span>
          </label>

          {form.isDeceased && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
              <Field label="Date of Death">
                <input type="date" className="input" value={form.dateOfDeath} onChange={e => update('dateOfDeath', e.target.value)} />
              </Field>
              <Field label="Death Tithi (for Shraddha)">
                <select className="select" value={form.deathTithi} onChange={e => update('deathTithi', e.target.value)}>
                  <option value="">-- Select --</option>
                  {TITHI_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Death Masam">
                <select className="select" value={form.deathMasam} onChange={e => update('deathMasam', e.target.value)}>
                  <option value="">-- Select --</option>
                  {MASAM_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Death Paksham">
                <select className="select" value={form.deathPaksham} onChange={e => update('deathPaksham', e.target.value)}>
                  <option value="">-- Select --</option>
                  {PAKSHAM_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </div>
          )}
        </Section>

        {/* === ACTIONS === */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-200">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Member' : 'Add Member'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="section-title">{title}</h3>
        {subtitle && <p className="text-xs text-stone-400 -mt-2">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="label">
        {label}
        {hint && <span className="ml-2 text-xs text-saffron-500 font-normal">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

/** Searchable member picker — replaces raw <select> for long member lists */
function MemberPicker({ value, onChange, members, placeholder = '-- None --', excludeId }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selected = members.find(m => m.id === value);

  const filtered = useMemo(() => {
    const list = members.filter(m => m.id !== excludeId);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(m =>
      `${m.firstName} ${m.lastName || ''}`.toLowerCase().includes(q) ||
      (m.dob || '').includes(q)
    );
  }, [members, search, excludeId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Display / trigger */}
      <button
        type="button"
        className="select w-full text-left flex items-center justify-between"
        onClick={() => setOpen(!open)}
      >
        <span className={selected ? 'text-stone-800' : 'text-stone-400'}>
          {selected ? `${selected.firstName} ${selected.lastName || ''} ${selected.dob ? `(${selected.dob})` : ''}` : placeholder}
        </span>
        <span className="text-stone-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-stone-200 shadow-lg max-h-64 flex flex-col">
          {/* Search input */}
          <div className="p-2 border-b border-stone-100">
            <input
              type="text"
              className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-md focus:outline-none focus:border-saffron-400"
              placeholder="Search by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto flex-1">
            {/* None option */}
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-stone-400 hover:bg-stone-50"
              onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
            >
              {placeholder}
            </button>

            {filtered.map(m => (
              <button
                key={m.id}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-saffron-50 flex items-center justify-between ${
                  m.id === value ? 'bg-saffron-50 text-saffron-700 font-medium' : 'text-stone-700'
                }`}
                onClick={() => { onChange(m.id); setOpen(false); setSearch(''); }}
              >
                <span>
                  {m.firstName} {m.lastName || ''}
                  {!m.gender && <span className="ml-1 text-xs text-amber-500">(no gender)</span>}
                </span>
                <span className="text-xs text-stone-400">{m.dob || ''}</span>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-stone-400 text-center">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
