import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', telugu: 'ముఖ్యపుట', icon: '🏠' },
  { path: '/members', label: 'Members', telugu: 'సభ్యులు', icon: '👥' },
  { path: '/tree', label: 'Family Tree', telugu: 'కుటుంబ వృక్షం', icon: '🌳' },
  { path: '/relationships', label: 'Relationships', telugu: 'బంధుత్వాలు', icon: '🔗' },
  { path: '/stories', label: 'Stories', telugu: 'కథలు', icon: '📖' },
  { path: '/map', label: 'Migration Map', telugu: 'వలస పటం', icon: '🗺️' },
  { path: '/shraddha', label: 'Shraddha', telugu: 'శ్రాద్ధ పంచాంగం', icon: '🪔' },
  { path: '/gotra-checker', label: 'Gotra Check', telugu: 'గోత్ర పరీక్ష', icon: '🕉️' },
  { path: '/health', label: 'Health', telugu: 'ఆరోగ్యం', icon: '🩺' },
  { path: '/analytics', label: 'Analytics', telugu: 'విశ్లేషణ', icon: '📊' },
  { path: '/duplicates', label: 'Duplicates', telugu: 'నకిలీ తనిఖీ', icon: '🔍' },
  { path: '/settings', label: 'Settings', telugu: 'అమరికలు', icon: '⚙️' },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-stone-100">
          <h1 className="font-telugu text-2xl font-bold text-saffron-700 leading-tight">
            వంశావళి
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">Vanshavali — కుటుంబ వృక్షం</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-lg">{item.icon}</span>
              <div className="min-w-0">
                <span className="block text-sm">{item.label}</span>
                <span className="block text-[10px] font-telugu opacity-60 -mt-0.5">{item.telugu}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 text-center space-y-1">
          <p className="text-[10px] text-stone-400">Ctrl+K to search</p>
          <p className="text-[10px] text-stone-400">Private & Secure</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-stone-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-telugu text-lg font-bold text-saffron-700">వంశావళి</h1>
        </header>

        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
