import { useState, useRef } from 'react';
import { useFamily } from '../context/FamilyContext';
import { useTranslation } from 'react-i18next';

function printFamilyDirectory(members) {
  const sorted = [...members].sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
  const rows = sorted.map(m => {
    const age = m.dob ? Math.floor((Date.now() - new Date(m.dob)) / 31557600000) : '';
    return `<tr>
      <td style="padding:6px 10px;border-bottom:1px solid #e7e5e4">${m.firstName} ${m.lastName || ''}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e7e5e4">${m.gender || ''}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e7e5e4">${m.isDeceased ? '✦' : (age || '-')}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e7e5e4">${m.gotram || '-'}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e7e5e4">${m.nakshatram || '-'}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e7e5e4">${m.pob || '-'}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e7e5e4">${m.dob || '-'}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><title>వంశావళి - Family Directory</title>
    <style>body{font-family:Inter,system-ui,sans-serif;padding:30px;color:#292524}
    h1{color:#e8590c;font-size:24px}h2{color:#78716c;font-size:14px;margin-top:-10px}
    table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}
    th{background:#fff8f0;padding:8px 10px;text-align:left;border-bottom:2px solid #ffc480;color:#e8590c;font-size:12px;text-transform:uppercase}
    @media print{body{padding:15px}}</style></head>
    <body><h1>వంశావళి — Family Directory</h1>
    <h2>Sri Madhwa Sampradaya | ${members.length} Members | Printed ${new Date().toLocaleDateString('en-IN')}</h2>
    <table><thead><tr><th>Name</th><th>Gender</th><th>Age</th><th>Gotram</th><th>Nakshatram</th><th>Birth Place</th><th>DOB</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.print();
}

function exportCSV(members) {
  const headers = ['First Name','Last Name','Gender','DOB','Place of Birth','Gotram','Nakshatram','Raasi','Deceased','Date of Death'];
  const rows = members.map(m => [
    m.firstName, m.lastName || '', m.gender || '', m.dob || '', m.pob || '',
    m.gotram || '', m.nakshatram || '', m.raasi || '',
    m.isDeceased ? 'Yes' : 'No', m.dateOfDeath || '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vanshavali-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Settings() {
  const { members, importData, setupPassword } = useFamily();
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef(null);
  const gedcomInputRef = useRef(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    const data = JSON.stringify(members, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vanshavali-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Data exported successfully!');
  };

  const handleExportGedcom = async () => {
    try {
      const res = await fetch('/api/export?format=gedcom');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vanshavali-export-${new Date().toISOString().split('T')[0]}.ged`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('GEDCOM exported successfully!');
    } catch (err) {
      setMessage(`Export failed: ${err.message}`);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        throw new Error('Invalid format: expected an array of members');
      }
      await importData(data);
      setMessage(`Imported ${data.length} members successfully!`);
    } catch (err) {
      setMessage(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportGedcom = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      await importData(text, 'gedcom');
      setMessage('GEDCOM imported successfully!');
    } catch (err) {
      setMessage(`GEDCOM import failed: ${err.message}`);
    } finally {
      setImporting(false);
      if (gedcomInputRef.current) gedcomInputRef.current.value = '';
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setMessage('Password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    const success = await setupPassword(newPassword);
    if (success) {
      setMessage('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage('Failed to update password');
    }
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('vanshavali-lang', lang);
    setMessage(`Language changed to ${lang === 'te' ? 'Telugu' : lang === 'hi' ? 'Hindi' : 'English'}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title">{t('settings.title')} <span className="font-telugu text-lg text-saffron-400">అమరికలు</span></h1>
        <p className="text-stone-500 text-sm mt-1">Manage your data, security, and preferences</p>
      </div>

      {message && (
        <div className={`mb-6 p-3 rounded-lg text-sm ${
          message.includes('failed') || message.includes('must') || message.includes('match')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-sacred-50 text-sacred-700 border border-sacred-200'
        }`}>
          {message}
          <button onClick={() => setMessage('')} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Language */}
      <div className="card mb-6">
        <h3 className="card-header">{t('settings.language')} <span className="font-telugu text-xs font-normal text-stone-400 ml-1">భాష</span></h3>
        <div className="flex gap-3">
          {[
            { code: 'en', label: 'English', native: 'English' },
            { code: 'te', label: 'Telugu', native: 'తెలుగు' },
            { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
          ].map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`flex-1 text-center py-3 rounded-lg border text-sm font-medium transition-all ${
                i18n.language === lang.code
                  ? 'bg-saffron-50 border-saffron-300 text-saffron-700'
                  : 'bg-white border-stone-300 text-stone-500 hover:bg-stone-50'
              }`}
            >
              <p>{lang.native}</p>
              <p className="text-xs opacity-60">{lang.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="card mb-6">
        <h3 className="card-header">{t('settings.dataManagement')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
            <div>
              <p className="font-medium text-stone-700">Export Data (JSON)</p>
              <p className="text-xs text-stone-500">Download all family data as a JSON file</p>
            </div>
            <button onClick={handleExport} className="btn btn-secondary">
              {t('settings.exportJSON')}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
            <div>
              <p className="font-medium text-stone-700">Import Data (JSON)</p>
              <p className="text-xs text-stone-500">Load family data from a JSON file (replaces current data)</p>
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" id="importFile" />
              <label htmlFor="importFile" className="btn btn-secondary cursor-pointer">
                {importing ? 'Importing...' : t('settings.importJSON')}
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-saffron-50 rounded-lg border border-saffron-100">
            <div>
              <p className="font-medium text-saffron-800">Export GEDCOM</p>
              <p className="text-xs text-saffron-600">Industry-standard genealogy format. Compatible with Ancestry, MyHeritage, FamilySearch, etc.</p>
            </div>
            <button onClick={handleExportGedcom} className="btn btn-primary">
              {t('settings.exportGEDCOM')}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-saffron-50 rounded-lg border border-saffron-100">
            <div>
              <p className="font-medium text-saffron-800">Import GEDCOM</p>
              <p className="text-xs text-saffron-600">Import from .ged files (adds to existing data)</p>
            </div>
            <div>
              <input ref={gedcomInputRef} type="file" accept=".ged,.gedcom" onChange={handleImportGedcom} className="hidden" id="importGedcom" />
              <label htmlFor="importGedcom" className="btn btn-primary cursor-pointer">
                {importing ? 'Importing...' : t('settings.importGEDCOM')}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card mb-6">
        <h3 className="card-header">{t('settings.security')}</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min 4 characters"
            />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Set / Update Password
          </button>
        </form>
      </div>

      {/* Sharing & Print */}
      <div className="card mb-6">
        <h3 className="card-header">Sharing & Print <span className="font-telugu text-xs font-normal text-stone-400 ml-1">భాగస్వామ్యం</span></h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
            <div>
              <p className="font-medium text-stone-700">Print Family Directory</p>
              <p className="text-xs text-stone-500">Generate a printable directory of all members (opens print dialog)</p>
            </div>
            <button onClick={() => printFamilyDirectory(members)} className="btn btn-secondary">
              {t('settings.print')}
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
            <div>
              <p className="font-medium text-stone-700">Export as CSV</p>
              <p className="text-xs text-stone-500">Download member data as a spreadsheet-compatible CSV file</p>
            </div>
            <button onClick={() => exportCSV(members)} className="btn btn-secondary">
              {t('settings.exportCSV')}
            </button>
          </div>
        </div>
      </div>

      {/* AI Configuration */}
      <AIConfigSection onMessage={setMessage} />

      {/* Statistics */}
      <div className="card">
        <h3 className="card-header">Data Statistics</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Stat label="Total Members" value={members.length} />
          <Stat label="Living" value={members.filter(m => !m.isDeceased).length} />
          <Stat label="Deceased" value={members.filter(m => m.isDeceased).length} />
          <Stat label="Males" value={members.filter(m => m.gender === 'Male').length} />
          <Stat label="Females" value={members.filter(m => m.gender === 'Female').length} />
          <Stat label="Married" value={members.filter(m => m.spouseId).length} />
          <Stat label="With Nakshatram" value={members.filter(m => m.nakshatram).length} />
          <Stat label="With Gotram" value={members.filter(m => m.gotram).length} />
          <Stat label="Storage" value="SQLite (local)" />
        </div>
      </div>
    </div>
  );
}

function AIConfigSection({ onMessage }) {
  const getConfig = () => {
    try {
      const stored = localStorage.getItem('vanshavali-ai-config');
      return stored ? JSON.parse(stored) : { provider: 'ollama', apiKey: '', baseUrl: 'https://ollama.com', model: 'qwen3-vl:235b-instruct' };
    } catch { return { provider: 'ollama', apiKey: '', baseUrl: 'https://ollama.com/v1', model: 'qwen3.5' }; }
  };

  const PROVIDERS = [
    { id: 'ollama', name: 'Ollama Cloud', baseUrl: 'https://ollama.com', models: 'qwen3-vl:235b-instruct, qwen3.5, deepseek-v3.2, glm-5', defaultModel: 'qwen3-vl:235b-instruct' },
    { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: 'gpt-4o, gpt-4o-mini, gpt-3.5-turbo', defaultModel: 'gpt-4o-mini' },
    { id: 'anthropic', name: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1', models: 'claude-sonnet-4-6, claude-haiku-4-5', defaultModel: 'claude-sonnet-4-6' },
    { id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', models: 'llama-3.3-70b, mixtral-8x7b', defaultModel: 'llama-3.3-70b' },
    { id: 'together', name: 'Together AI', baseUrl: 'https://api.together.xyz/v1', models: 'meta-llama/Llama-3-70b, Qwen/Qwen2.5-72B', defaultModel: 'meta-llama/Llama-3-70b' },
    { id: 'local', name: 'Local Ollama', baseUrl: 'http://localhost:11434/v1', models: 'Any model you have pulled locally', defaultModel: 'qwen2.5:7b' },
    { id: 'custom', name: 'Custom', baseUrl: '', models: 'Any OpenAI-compatible API', defaultModel: '' },
  ];

  const [config, setConfig] = useState(getConfig);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);

  const selectProvider = (providerId) => {
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      setConfig({
        ...config,
        provider: providerId,
        baseUrl: provider.baseUrl,
        model: provider.defaultModel,
      });
    }
  };

  const saveConfig = () => {
    if (config.apiKey || config.provider === 'local') {
      localStorage.setItem('vanshavali-ai-config', JSON.stringify(config));
      onMessage('AI configuration saved! You can now use the chat panel.');
    } else {
      localStorage.removeItem('vanshavali-ai-config');
      onMessage('AI configuration cleared.');
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Say "Connection successful" in one sentence.',
          sessionId: 'test-' + Date.now(),
          config,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onMessage(`Test failed: ${data.error}`);
      } else {
        onMessage(`Test passed! Response: "${data.content?.slice(0, 100)}..."`);
      }
    } catch (err) {
      onMessage(`Test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const clearConfig = () => {
    localStorage.removeItem('vanshavali-ai-config');
    setConfig({ provider: 'ollama', apiKey: '', baseUrl: 'https://ollama.com', model: 'qwen3-vl:235b-instruct' });
    onMessage('AI configuration cleared.');
  };

  const activeProvider = PROVIDERS.find(p => p.id === config.provider) || PROVIDERS[0];

  return (
    <div className="card mb-6">
      <h3 className="card-header">AI Configuration <span className="font-telugu text-xs font-normal text-stone-400 ml-1">కృత్రిమ మేధ</span></h3>
      <p className="text-xs text-stone-500 mb-4">
        Optional: Connect an LLM to chat with your family data using AI agents.
        Your API key is stored only in your browser (localStorage) — never sent to our server or committed to git.
      </p>

      <div className="space-y-4">
        {/* Provider Selection */}
        <div>
          <label className="label">Provider</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => selectProvider(p.id)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  config.provider === p.id
                    ? 'bg-saffron-50 border-saffron-300 text-saffron-700'
                    : 'bg-white border-stone-300 text-stone-500 hover:bg-stone-50'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="label">API Key {config.provider === 'local' && <span className="text-stone-400 font-normal">(not needed for local)</span>}</label>
          <div className="flex gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              className="input flex-1"
              value={config.apiKey}
              onChange={e => setConfig({ ...config, apiKey: e.target.value })}
              placeholder={config.provider === 'local' ? 'Not required' : `Enter your ${activeProvider.name} API key`}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-600 hover:bg-stone-50"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Base URL */}
        <div>
          <label className="label">Base URL</label>
          <input
            type="text"
            className="input"
            value={config.baseUrl}
            onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
            placeholder={activeProvider.baseUrl}
          />
          <p className="text-xs text-stone-400 mt-1">Auto-filled from provider. Edit for custom endpoints.</p>
        </div>

        {/* Model */}
        <div>
          <label className="label">Model</label>
          <input
            type="text"
            className="input"
            value={config.model}
            onChange={e => setConfig({ ...config, model: e.target.value })}
            placeholder={activeProvider.defaultModel}
          />
          <p className="text-xs text-stone-400 mt-1">Available: {activeProvider.models}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={saveConfig} className="btn btn-primary">Save AI Config</button>
          <button onClick={testConnection} className="btn btn-secondary">{testing ? 'Testing...' : 'Test Connection'}</button>
          <button onClick={clearConfig} className="btn btn-secondary">Clear</button>
        </div>

        <div className="p-3 bg-stone-50 rounded-lg text-xs text-stone-500">
          <p className="font-medium text-stone-700 mb-1">How it works</p>
          <p>When configured, a chat button appears at the bottom-right. The AI uses 4 specialized agents — Bandhuvulu (relationships), Arogya (health), Katha (stories), and Samskara (cultural) — coordinated by the Kula orchestrator to answer questions about your family tree.</p>
          <p className="mt-1">The app works fully without AI. This is an optional enhancement.</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="p-3 bg-stone-50 rounded-lg">
      <p className="text-xs text-stone-400 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-semibold text-stone-700 mt-0.5">{value}</p>
    </div>
  );
}
