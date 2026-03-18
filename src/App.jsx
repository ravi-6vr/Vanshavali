import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useFamily } from './context/FamilyContext';
import Layout from './components/Layout';
import LockScreen from './components/LockScreen';
import GlobalSearch from './components/GlobalSearch';
import OnboardingWizard from './components/OnboardingWizard';
import Dashboard from './pages/Dashboard';
import MemberList from './pages/MemberList';
import MemberForm from './pages/MemberForm';
import MemberProfile from './pages/MemberProfile';
import FamilyTree from './pages/FamilyTree';
import RelationshipFinder from './pages/RelationshipFinder';
import ShraddhaCalendar from './pages/ShraddhaCalendar';
import Settings from './pages/Settings';
import GotraChecker from './pages/GotraChecker';
import HealthTracker from './pages/HealthTracker';
import Analytics from './pages/Analytics';
import AllEvents from './pages/AllEvents';
import Stories from './pages/Stories';
import MigrationMap from './pages/MigrationMap';
import DuplicateChecker from './pages/DuplicateChecker';

export default function App() {
  const { isAuthenticated, authRequired, loading, members, fetchMembers } = useFamily();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!loading && members.length === 0 && isAuthenticated) {
      const dismissed = sessionStorage.getItem('vanshavali-onboarding-dismissed');
      if (!dismissed) {
        setShowOnboarding(true);
      }
    }
  }, [loading, members.length, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-saffron-200 border-t-saffron-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500 font-display text-lg">Loading Vanshavali...</p>
        </div>
      </div>
    );
  }

  if (authRequired && !isAuthenticated) {
    return <LockScreen />;
  }

  if (showOnboarding) {
    return (
      <OnboardingWizard
        onComplete={() => {
          setShowOnboarding(false);
          sessionStorage.setItem('vanshavali-onboarding-dismissed', 'true');
          fetchMembers();
        }}
      />
    );
  }

  return (
    <Layout>
      <GlobalSearch />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<MemberList />} />
        <Route path="/members/new" element={<MemberForm />} />
        <Route path="/members/:id/edit" element={<MemberForm />} />
        <Route path="/members/:id" element={<MemberProfile />} />
        <Route path="/tree" element={<FamilyTree />} />
        <Route path="/relationships" element={<RelationshipFinder />} />
        <Route path="/shraddha" element={<ShraddhaCalendar />} />
        <Route path="/gotra-checker" element={<GotraChecker />} />
        <Route path="/health" element={<HealthTracker />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/events" element={<AllEvents />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/map" element={<MigrationMap />} />
        <Route path="/duplicates" element={<DuplicateChecker />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
