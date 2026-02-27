import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserJourneyProvider } from './contexts/UserJourneyContext';
import LandingPage from './pages/LandingPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import PatientJourneyPage from './pages/PatientJourneyPage';
import CaregiverJourneyPage from './pages/CaregiverJourneyPage';
import ProfessionalJourneyPage from './pages/ProfessionalJourneyPage';
import ResultsPage from './pages/ResultsPage';
import SearchResultsPage from './pages/SearchResultsPage';
import { APP_ROUTES } from './utils/constants';

function App() {
  return (
    <BrowserRouter>
      <UserJourneyProvider>
        <Routes>
          {/* Landing Page */}
          <Route path={APP_ROUTES.home} element={<LandingPage />} />
          
          {/* Role Selection */}
          <Route path={APP_ROUTES.roleSelection} element={<RoleSelectionPage />} />
          
          {/* Journey Pages */}
          <Route path={APP_ROUTES.patientJourney} element={<PatientJourneyPage />} />
          <Route path={APP_ROUTES.caregiverJourney} element={<CaregiverJourneyPage />} />
          <Route path={APP_ROUTES.professionalJourney} element={<ProfessionalJourneyPage />} />
          
          {/* Results Page */}
          <Route path={APP_ROUTES.results} element={<ResultsPage />} />
          
          {/* Search Results Page */}
          <Route path={APP_ROUTES.searchResults} element={<SearchResultsPage />} />
          
          {/* 404 - Redirect to home */}
          <Route path="*" element={<Navigate to={APP_ROUTES.home} replace />} />
        </Routes>
      </UserJourneyProvider>
    </BrowserRouter>
  );
}

export default App;
