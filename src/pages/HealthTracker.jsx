import { useState, useMemo } from 'react';
import { useFamily } from '../context/FamilyContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SEVERITY_OPTIONS = ['mild', 'moderate', 'severe'];

const BLOOD_COMPATIBILITY = {
  'O-': { canGiveTo: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], canReceiveFrom: ['O-'] },
  'O+': { canGiveTo: ['A+','B+','AB+','O+'], canReceiveFrom: ['O+','O-'] },
  'A-': { canGiveTo: ['A+','A-','AB+','AB-'], canReceiveFrom: ['A-','O-'] },
  'A+': { canGiveTo: ['A+','AB+'], canReceiveFrom: ['A+','A-','O+','O-'] },
  'B-': { canGiveTo: ['B+','B-','AB+','AB-'], canReceiveFrom: ['B-','O-'] },
  'B+': { canGiveTo: ['B+','AB+'], canReceiveFrom: ['B+','B-','O+','O-'] },
  'AB-': { canGiveTo: ['AB+','AB-'], canReceiveFrom: ['A-','B-','AB-','O-'] },
  'AB+': { canGiveTo: ['AB+'], canReceiveFrom: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
};

function emptyHealth() {
  return {
    bloodGroup: '',
    conditions: [],
    allergies: [],
    medications: [],
    emergencyContact: '',
    notes: '',
  };
}

function severityColor(severity) {
  switch (severity) {
    case 'mild': return 'bg-green-100 text-green-800';
    case 'moderate': return 'bg-amber-100 text-amber-800';
    case 'severe': return 'bg-red-100 text-red-800';
    default: return 'bg-stone-100 text-stone-600';
  }
}

export default function HealthTracker() {
  const { members, saveMember } = useFamily();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editHealth, setEditHealth] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCompatibility, setShowCompatibility] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');

  // New condition/allergy/medication form state
  const [newCondition, setNewCondition] = useState({ name: '', diagnosedDate: '', notes: '', severity: 'mild' });
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', since: '' });

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return members;
    return members.filter(m => {
      const name = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase();
      const bg = (m.health?.bloodGroup || '').toLowerCase();
      return name.includes(q) || bg.includes(q);
    });
  }, [members, search]);

  // Blood group distribution
  const bloodGroupDistribution = useMemo(() => {
    const dist = {};
    BLOOD_GROUPS.forEach(bg => { dist[bg] = 0; });
    members.forEach(m => {
      const bg = m.health?.bloodGroup;
      if (bg && dist[bg] !== undefined) dist[bg]++;
    });
    return dist;
  }, [members]);

  const totalWithBloodGroup = useMemo(
    () => Object.values(bloodGroupDistribution).reduce((a, b) => a + b, 0),
    [bloodGroupDistribution]
  );

  // Common conditions (appear in 2+ members)
  const commonConditions = useMemo(() => {
    const condMap = {};
    members.forEach(m => {
      (m.health?.conditions || []).forEach(c => {
        const key = c.name.toLowerCase().trim();
        if (!key) return;
        if (!condMap[key]) condMap[key] = { name: c.name, members: [] };
        condMap[key].members.push(`${m.firstName} ${m.lastName || ''}`.trim());
      });
    });
    return Object.values(condMap).filter(c => c.members.length >= 2).sort((a, b) => b.members.length - a.members.length);
  }, [members]);

  const handleExpand = (member) => {
    if (expandedId === member.id) {
      setExpandedId(null);
      setEditHealth(null);
    } else {
      setExpandedId(member.id);
      setEditHealth(JSON.parse(JSON.stringify(member.health || emptyHealth())));
      setNewCondition({ name: '', diagnosedDate: '', notes: '', severity: 'mild' });
      setNewAllergy('');
      setNewMedication({ name: '', dosage: '', since: '' });
    }
  };

  const handleSave = async (member) => {
    setSaving(true);
    try {
      await saveMember({ ...member, health: editHealth });
      setExpandedId(null);
      setEditHealth(null);
    } catch (err) {
      console.error('Failed to save health data:', err);
    } finally {
      setSaving(false);
    }
  };

  const addCondition = () => {
    if (!newCondition.name.trim()) return;
    setEditHealth(prev => ({
      ...prev,
      conditions: [...prev.conditions, { ...newCondition, name: newCondition.name.trim() }],
    }));
    setNewCondition({ name: '', diagnosedDate: '', notes: '', severity: 'mild' });
  };

  const removeCondition = (index) => {
    setEditHealth(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const addAllergy = () => {
    if (!newAllergy.trim()) return;
    setEditHealth(prev => ({
      ...prev,
      allergies: [...prev.allergies, newAllergy.trim()],
    }));
    setNewAllergy('');
  };

  const removeAllergy = (index) => {
    setEditHealth(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }));
  };

  const addMedication = () => {
    if (!newMedication.name.trim()) return;
    setEditHealth(prev => ({
      ...prev,
      medications: [...prev.medications, { ...newMedication, name: newMedication.name.trim() }],
    }));
    setNewMedication({ name: '', dosage: '', since: '' });
  };

  const removeMedication = (index) => {
    setEditHealth(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">
          <span className="font-telugu">ఆరోగ్యం</span>
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Health Records &mdash; Track blood groups, medical conditions, allergies, and medications for family members.
        </p>
      </div>

      {/* Blood Group Distribution */}
      <div className="card mb-6">
        <h3 className="card-header">Blood Group Distribution</h3>
        {totalWithBloodGroup === 0 ? (
          <p className="text-stone-400 text-sm">No blood group data recorded yet. Expand a member below to add their health info.</p>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {BLOOD_GROUPS.map(bg => (
              <div
                key={bg}
                className={`text-center p-3 rounded-lg border ${
                  bloodGroupDistribution[bg] > 0
                    ? 'border-saffron-200 bg-saffron-50'
                    : 'border-stone-100 bg-stone-50'
                }`}
              >
                <div className={`text-lg font-bold ${bloodGroupDistribution[bg] > 0 ? 'text-saffron-700' : 'text-stone-300'}`}>
                  {bg}
                </div>
                <div className={`text-sm ${bloodGroupDistribution[bg] > 0 ? 'text-saffron-500' : 'text-stone-300'}`}>
                  {bloodGroupDistribution[bg]}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Common Conditions (Hereditary Tracking) */}
      {commonConditions.length > 0 && (
        <div className="card mb-6 border-amber-200 bg-amber-50/50">
          <h3 className="card-header text-amber-800">Common Conditions in Family</h3>
          <p className="text-xs text-amber-600 mb-3">
            Conditions appearing in multiple family members — may indicate hereditary patterns.
          </p>
          <div className="space-y-2">
            {commonConditions.map((cond, i) => (
              <div key={i} className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                <div>
                  <span className="font-medium text-stone-800">{cond.name}</span>
                  <span className="text-xs text-stone-400 ml-2">({cond.members.length} members)</span>
                </div>
                <div className="text-xs text-stone-500">
                  {cond.members.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blood Group Compatibility */}
      <div className="card mb-6">
        <button
          onClick={() => setShowCompatibility(!showCompatibility)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="card-header mb-0">Blood Group Compatibility</h3>
          <span className="text-stone-400 text-sm">{showCompatibility ? 'Hide' : 'Show'}</span>
        </button>
        {showCompatibility && (
          <div className="mt-4">
            <p className="text-xs text-stone-500 mb-3">
              Select a blood group to see donation and receiving compatibility — useful in emergencies.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {BLOOD_GROUPS.map(bg => (
                <button
                  key={bg}
                  onClick={() => setSelectedBloodGroup(selectedBloodGroup === bg ? '' : bg)}
                  className={`btn text-sm ${selectedBloodGroup === bg ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {bg}
                </button>
              ))}
            </div>
            {selectedBloodGroup && BLOOD_COMPATIBILITY[selectedBloodGroup] && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="text-sm font-semibold text-green-800 mb-2">
                    {selectedBloodGroup} can donate to:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {BLOOD_COMPATIBILITY[selectedBloodGroup].canGiveTo.map(bg => (
                      <span key={bg} className="badge bg-green-100 text-green-700">{bg}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">
                    {selectedBloodGroup} can receive from:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {BLOOD_COMPATIBILITY[selectedBloodGroup].canReceiveFrom.map(bg => (
                      <span key={bg} className="badge bg-blue-100 text-blue-700">{bg}</span>
                    ))}
                  </div>
                </div>
                {/* Show family members with compatible blood groups */}
                {(() => {
                  const compatDonors = members.filter(m =>
                    m.health?.bloodGroup && BLOOD_COMPATIBILITY[selectedBloodGroup].canReceiveFrom.includes(m.health.bloodGroup)
                  );
                  if (compatDonors.length === 0) return null;
                  return (
                    <div className="md:col-span-2 bg-saffron-50 rounded-lg p-4 border border-saffron-200">
                      <h4 className="text-sm font-semibold text-saffron-800 mb-2">
                        Family members who can donate to {selectedBloodGroup}:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {compatDonors.map(m => (
                          <span key={m.id} className="badge bg-saffron-100 text-saffron-700">
                            {m.firstName} {m.lastName || ''} ({m.health.bloodGroup})
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          className="input"
          placeholder="Search members by name or blood group..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-lg">
            {members.length === 0 ? 'No family members yet' : 'No members match your search'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map(member => {
            const health = member.health || {};
            const condCount = (health.conditions || []).length;
            const allergyCount = (health.allergies || []).length;
            const isExpanded = expandedId === member.id;

            return (
              <div key={member.id} className="card">
                {/* Summary Row */}
                <button
                  onClick={() => handleExpand(member)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-semibold text-stone-800">
                        {member.firstName} {member.lastName || ''}
                      </span>
                      {member.gender && (
                        <span className="text-xs text-stone-400 ml-2">{member.gender}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {health.bloodGroup && (
                      <span className="badge bg-saffron-100 text-saffron-700 font-bold">
                        {health.bloodGroup}
                      </span>
                    )}
                    {condCount > 0 && (
                      <span className="badge bg-amber-100 text-amber-700">
                        {condCount} condition{condCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {allergyCount > 0 && (
                      <span className="badge bg-red-100 text-red-700">
                        {allergyCount} allerg{allergyCount !== 1 ? 'ies' : 'y'}
                      </span>
                    )}
                    {!health.bloodGroup && condCount === 0 && allergyCount === 0 && (
                      <span className="text-xs text-stone-300">No health data</span>
                    )}
                    <span className="text-stone-400 text-sm ml-1">{isExpanded ? '\u25B2' : '\u25BC'}</span>
                  </div>
                </button>

                {/* Expanded Edit View */}
                {isExpanded && editHealth && (
                  <div className="mt-4 pt-4 border-t border-stone-200 space-y-6">
                    {/* Blood Group & Emergency Contact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Blood Group</label>
                        <select
                          className="select"
                          value={editHealth.bloodGroup}
                          onChange={e => setEditHealth({ ...editHealth, bloodGroup: e.target.value })}
                        >
                          <option value="">-- Select --</option>
                          {BLOOD_GROUPS.map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Emergency Contact</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Phone number or name"
                          value={editHealth.emergencyContact}
                          onChange={e => setEditHealth({ ...editHealth, emergencyContact: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Conditions */}
                    <div>
                      <label className="label">Medical Conditions</label>
                      {editHealth.conditions.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {editHealth.conditions.map((cond, i) => (
                            <div key={i} className="flex items-start justify-between bg-stone-50 rounded-lg p-3">
                              <div>
                                <span className="font-medium text-stone-700">{cond.name}</span>
                                <span className={`badge ml-2 text-xs ${severityColor(cond.severity)}`}>
                                  {cond.severity}
                                </span>
                                {cond.diagnosedDate && (
                                  <span className="text-xs text-stone-400 ml-2">Since {cond.diagnosedDate}</span>
                                )}
                                {cond.notes && (
                                  <p className="text-xs text-stone-500 mt-1">{cond.notes}</p>
                                )}
                              </div>
                              <button
                                onClick={() => removeCondition(i)}
                                className="text-red-400 hover:text-red-600 text-sm ml-2"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          className="input"
                          placeholder="Condition name"
                          value={newCondition.name}
                          onChange={e => setNewCondition({ ...newCondition, name: e.target.value })}
                        />
                        <select
                          className="select"
                          value={newCondition.severity}
                          onChange={e => setNewCondition({ ...newCondition, severity: e.target.value })}
                        >
                          {SEVERITY_OPTIONS.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                        <input
                          type="date"
                          className="input"
                          value={newCondition.diagnosedDate}
                          onChange={e => setNewCondition({ ...newCondition, diagnosedDate: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input"
                          placeholder="Notes (optional)"
                          value={newCondition.notes}
                          onChange={e => setNewCondition({ ...newCondition, notes: e.target.value })}
                        />
                      </div>
                      <button onClick={addCondition} className="btn btn-secondary text-sm mt-2">
                        + Add Condition
                      </button>
                    </div>

                    {/* Allergies */}
                    <div>
                      <label className="label">Allergies</label>
                      {editHealth.allergies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {editHealth.allergies.map((allergy, i) => (
                            <span key={i} className="badge bg-red-50 text-red-700 flex items-center gap-1">
                              {allergy}
                              <button
                                onClick={() => removeAllergy(i)}
                                className="text-red-400 hover:text-red-600 ml-1"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input flex-1"
                          placeholder="Add allergy (e.g., Penicillin)"
                          value={newAllergy}
                          onChange={e => setNewAllergy(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }}
                        />
                        <button onClick={addAllergy} className="btn btn-secondary text-sm">
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Medications */}
                    <div>
                      <label className="label">Current Medications</label>
                      {editHealth.medications.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {editHealth.medications.map((med, i) => (
                            <div key={i} className="flex items-center justify-between bg-stone-50 rounded-lg p-3">
                              <div>
                                <span className="font-medium text-stone-700">{med.name}</span>
                                {med.dosage && (
                                  <span className="text-xs text-stone-500 ml-2">&mdash; {med.dosage}</span>
                                )}
                                {med.since && (
                                  <span className="text-xs text-stone-400 ml-2">Since {med.since}</span>
                                )}
                              </div>
                              <button
                                onClick={() => removeMedication(i)}
                                className="text-red-400 hover:text-red-600 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          type="text"
                          className="input"
                          placeholder="Medication name"
                          value={newMedication.name}
                          onChange={e => setNewMedication({ ...newMedication, name: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input"
                          placeholder="Dosage (e.g., 10mg daily)"
                          value={newMedication.dosage}
                          onChange={e => setNewMedication({ ...newMedication, dosage: e.target.value })}
                        />
                        <input
                          type="date"
                          className="input"
                          value={newMedication.since}
                          onChange={e => setNewMedication({ ...newMedication, since: e.target.value })}
                        />
                      </div>
                      <button onClick={addMedication} className="btn btn-secondary text-sm mt-2">
                        + Add Medication
                      </button>
                    </div>

                    {/* General Notes */}
                    <div>
                      <label className="label">General Health Notes</label>
                      <textarea
                        className="input min-h-[80px]"
                        placeholder="Any additional health notes..."
                        value={editHealth.notes}
                        onChange={e => setEditHealth({ ...editHealth, notes: e.target.value })}
                      />
                    </div>

                    {/* Save / Cancel */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleSave(member)}
                        disabled={saving}
                        className="btn btn-primary"
                      >
                        {saving ? 'Saving...' : 'Save Health Data'}
                      </button>
                      <button
                        onClick={() => { setExpandedId(null); setEditHealth(null); }}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
