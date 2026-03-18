import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';
import { calculateAge, RAASI_LIST } from '../data/vedic';
import KundaliGrid from '../components/KundaliGrid';
import SamskaraTimeline from '../components/SamskaraTimeline';
import MemoryWall from '../components/MemoryWall';
import CompletenessBar from '../components/CompletenessBar';
import PravaraGenerator from '../components/PravaraGenerator';
import JourneyTimeline from '../components/JourneyTimeline';
import MiniFamilyTree from '../components/MiniFamilyTree';
import PhotoGallery from '../components/PhotoGallery';

export default function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { members, saveMember, deleteMember } = useFamily();
  const member = members.find(m => m.id === id);
  const [activeTab, setActiveTab] = useState('overview');

  if (!member) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-stone-500">Member not found</p>
        <Link to="/members" className="text-saffron-600 hover:underline mt-2 block">Back to Members</Link>
      </div>
    );
  }

  const age = calculateAge(member.dob, member.isDeceased && member.dateOfDeath ? new Date(member.dateOfDeath) : undefined);
  const currentAge = member.isDeceased ? null : age;
  const father = member.fatherId ? members.find(m => m.id === member.fatherId) : null;
  const mother = member.motherId ? members.find(m => m.id === member.motherId) : null;
  const spouse = member.spouseId ? members.find(m => m.id === member.spouseId) : null;
  const children = (member.childrenIds || []).map(cid => members.find(m => m.id === cid)).filter(Boolean);
  const siblings = members.filter(m =>
    m.id !== member.id &&
    ((member.fatherId && m.fatherId === member.fatherId) ||
     (member.motherId && m.motherId === member.motherId))
  );
  const raasiInfo = member.raasi ? RAASI_LIST.find(r => r.name === member.raasi) : null;

  // Timeline
  const timeline = [];
  if (member.dob) timeline.push({ date: member.dob, label: 'Born', detail: member.pob ? `at ${member.pob}` : '', type: 'birth' });
  if (member.marriageDate && spouse) timeline.push({ date: member.marriageDate, label: 'Married', detail: `${spouse.firstName} ${spouse.lastName}`, type: 'marriage' });
  children.forEach(child => {
    if (child.dob) timeline.push({ date: child.dob, label: `${child.gender === 'Female' ? 'Daughter' : 'Son'} born`, detail: child.firstName, type: 'child' });
  });
  if (member.isDeceased && member.dateOfDeath) timeline.push({ date: member.dateOfDeath, label: 'Passed away', detail: age !== null ? `at age ${age}` : '', type: 'death' });
  timeline.sort((a, b) => a.date.localeCompare(b.date));

  // Handlers for memories & samskaras
  const handleAddMemory = async (memory) => {
    const updatedMemories = [...(member.memories || []), memory];
    await saveMember({ ...member, memories: updatedMemories });
  };

  const handleDeleteMemory = async (memoryId) => {
    const updatedMemories = (member.memories || []).filter(m => m.id !== memoryId);
    await saveMember({ ...member, memories: updatedMemories });
  };

  const handleAddSamskara = async (samskaraName) => {
    const date = prompt(`Enter date for ${samskaraName} (YYYY-MM-DD):`);
    if (!date) return;
    const notes = prompt('Any notes? (optional)') || '';
    const updatedSamskaras = [...(member.samskaras || []), { name: samskaraName, date, notes }];
    await saveMember({ ...member, samskaras: updatedSamskaras });
  };

  const handleAddJourneyEvent = async (event) => {
    const updatedEvents = [...(member.journeyEvents || []), event];
    await saveMember({ ...member, journeyEvents: updatedEvents });
  };

  const handleDeleteJourneyEvent = async (eventId) => {
    const updatedEvents = (member.journeyEvents || []).filter(e => e.id !== eventId);
    await saveMember({ ...member, journeyEvents: updatedEvents });
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to remove ${member.firstName} ${member.lastName}?`)) {
      await deleteMember(member.id);
      navigate('/members');
    }
  };

  const TABS = [
    { key: 'overview', label: 'Overview', icon: '👤' },
    { key: 'vedic', label: 'Vedic', icon: '🕉️' },
    { key: 'photos', label: 'Photos', icon: '📷' },
    { key: 'samskaras', label: 'Samskaras', icon: '🔥' },
    { key: 'memories', label: 'Memories', icon: '📖' },
    { key: 'journey', label: 'Journey', icon: '🗺️' },
    { key: 'timeline', label: 'Timeline', icon: '📅' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* HEADER CARD */}
      <div className="card mb-6 bg-gradient-to-r from-white to-stone-50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold font-display shadow-inner ${
              member.gender === 'Male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
            }`}>
              {member.firstName?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-stone-800">
                {member.firstName} {member.lastName}
                {member.isDeceased && <span className="ml-2 text-stone-400 text-lg" title="Deceased">✦</span>}
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className={`badge ${member.gender === 'Male' ? 'badge-male' : 'badge-female'}`}>{member.gender}</span>
                {currentAge !== null && <span className="text-sm text-stone-500">{currentAge} years old</span>}
                {member.isDeceased && age !== null && <span className="badge badge-deceased">Lived {age} years</span>}
                {member.gotram && <span className="badge bg-saffron-100 text-saffron-700">{member.gotram}</span>}
              </div>
              {/* Completeness */}
              <div className="mt-3 w-64">
                <CompletenessBar member={member} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/members/${member.id}/edit`} className="btn btn-secondary">Edit</Link>
            <button onClick={handleDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-stone-200 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-saffron-500 text-saffron-700'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="card">
            <h3 className="card-header">Personal Details</h3>
            <InfoGrid items={[
              { label: 'Date of Birth', value: member.dob ? new Date(member.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
              { label: 'Time of Birth', value: member.tob || '-' },
              { label: 'Place of Birth', value: member.pob || '-' },
              ...(member.isDeceased ? [{ label: 'Date of Death', value: member.dateOfDeath ? new Date(member.dateOfDeath).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' }] : []),
            ]} />
          </div>

          {/* Family */}
          <div className="card">
            <h3 className="card-header">Family</h3>
            <div className="space-y-2">
              {father && <FamilyLink label="Father" member={father} />}
              {mother && <FamilyLink label="Mother" member={mother} />}
              {spouse && <FamilyLink label="Spouse" member={spouse} extra={member.marriageDate ? `Married ${new Date(member.marriageDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''} />}
              {siblings.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Siblings ({siblings.length})</p>
                  {siblings.map(s => <FamilyLink key={s.id} member={s} />)}
                </div>
              )}
              {children.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Children ({children.length})</p>
                  {children.map(c => <FamilyLink key={c.id} member={c} />)}
                </div>
              )}
            </div>
          </div>

          {/* Quick Vedic Summary */}
          {(member.nakshatram || member.gotram) && (
            <div className="card">
              <h3 className="card-header">Vedic Summary</h3>
              <div className="flex gap-6">
                {member.raasi && (
                  <KundaliGrid raasi={member.raasi} nakshatram={member.nakshatram} pada={member.pada} size="small" />
                )}
                <div className="flex-1">
                  <InfoGrid items={[
                    { label: 'Nakshatram', value: member.nakshatram || '-' },
                    { label: 'Raasi', value: raasiInfo ? `${member.raasi} (${raasiInfo.english})` : member.raasi || '-' },
                    { label: 'Gotram', value: member.gotram || '-' },
                  ]} />
                </div>
              </div>
            </div>
          )}

          {/* Completeness Details */}
          <div className="card">
            <h3 className="card-header">Profile Completeness</h3>
            <CompletenessBar member={member} showDetails={true} />
          </div>

          {/* Mini Family Tree */}
          <div className="card lg:col-span-2">
            <h3 className="card-header flex items-center gap-2">
              🌳 <span>Immediate Family</span>
              <span className="font-telugu text-xs font-normal text-stone-400 ml-1">సమీప కుటుంబం</span>
            </h3>
            <MiniFamilyTree member={member} members={members} />
          </div>
        </div>
      )}

      {activeTab === 'vedic' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Full Vedic Details */}
          <div className="card">
            <h3 className="card-header">Vedic Details</h3>
            <InfoGrid items={[
              { label: 'Nakshatram', value: member.nakshatram || '-' },
              { label: 'Pada', value: member.pada || '-' },
              { label: 'Raasi', value: raasiInfo ? `${member.raasi} (${raasiInfo.english})` : member.raasi || '-' },
              { label: 'Gotram', value: member.gotram || '-' },
              { label: 'Tithi', value: member.tithi || '-' },
              { label: 'Masam', value: member.masam || '-' },
              { label: 'Paksham', value: member.paksham || '-' },
            ]} />
            {raasiInfo && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">Element: {raasiInfo.element} | Lord: {raasiInfo.lord}</p>
              </div>
            )}
          </div>

          {/* Kundali Grid */}
          {member.raasi && (
            <div className="card">
              <h3 className="card-header">Rashi Chart (South Indian)</h3>
              <div className="flex justify-center">
                <KundaliGrid raasi={member.raasi} nakshatram={member.nakshatram} pada={member.pada} />
              </div>
            </div>
          )}

          {/* Pravara */}
          {member.gotram && (
            <div className="lg:col-span-2">
              <PravaraGenerator gotram={member.gotram} firstName={member.firstName} lastName={member.lastName} />
            </div>
          )}

          {/* Shraddha for deceased */}
          {member.isDeceased && (member.deathTithi || member.deathMasam) && (
            <div className="card bg-amber-50 border-amber-200">
              <h3 className="card-header text-amber-800">Shraddha Details</h3>
              <InfoGrid items={[
                { label: 'Death Tithi', value: member.deathTithi || '-' },
                { label: 'Death Masam', value: member.deathMasam || '-' },
                { label: 'Death Paksham', value: member.deathPaksham || '-' },
              ]} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'samskaras' && (
        <div className="card">
          <SamskaraTimeline
            samskaras={member.samskaras || []}
            isDeceased={member.isDeceased}
            onEdit={handleAddSamskara}
          />
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="card">
          <h3 className="card-header">Photo Gallery</h3>
          <PhotoGallery memberId={member.id} />
        </div>
      )}

      {activeTab === 'memories' && (
        <div className="card">
          <MemoryWall
            memories={member.memories || []}
            onAdd={handleAddMemory}
            onDelete={handleDeleteMemory}
          />
        </div>
      )}

      {activeTab === 'journey' && (
        <div className="card">
          <JourneyTimeline
            events={member.journeyEvents || []}
            onAdd={handleAddJourneyEvent}
            onDelete={handleDeleteJourneyEvent}
          />
        </div>
      )}

      {activeTab === 'timeline' && timeline.length > 0 && (
        <div className="card">
          <h3 className="card-header">Life Timeline</h3>
          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-sacred-300 via-saffron-300 to-stone-300" />
            {timeline.map((event, i) => (
              <div key={i} className="relative mb-8 last:mb-0">
                <div className={`absolute -left-5 w-4 h-4 rounded-full border-2 border-white shadow ${
                  event.type === 'birth' ? 'bg-sacred-500' :
                  event.type === 'marriage' ? 'bg-pink-500' :
                  event.type === 'child' ? 'bg-blue-500' :
                  'bg-stone-400'
                }`} />
                <div className="bg-stone-50 rounded-lg p-4 border border-stone-100">
                  <p className="font-semibold text-stone-700">{event.label}</p>
                  <p className="text-sm text-stone-500">
                    {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {event.detail && ` — ${event.detail}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
      {items.map(({ label, value }) => (
        <div key={label}>
          <p className="text-xs text-stone-400 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-medium text-stone-700 mt-0.5">{value}</p>
        </div>
      ))}
    </div>
  );
}

function FamilyLink({ label, member, extra }) {
  return (
    <Link to={`/members/${member.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 transition-colors">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
        member.gender === 'Male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
      }`}>
        {member.firstName?.[0]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-stone-700 truncate">
          {label && <span className="text-stone-400 font-normal mr-1">{label}:</span>}
          {member.firstName} {member.lastName}
          {member.isDeceased && <span className="ml-1 text-stone-400">✦</span>}
        </p>
        {extra && <p className="text-xs text-stone-400">{extra}</p>}
      </div>
    </Link>
  );
}
