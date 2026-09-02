import { useState, useEffect } from 'react';
import { User, Company } from './types';
import { auth } from './services/auth';
import { db, initDB } from './services/db';
import { LandingPage } from './components/features/landing/LandingPage';
import { PublicValidationScreen } from './components/features/auth/PublicValidationScreen';
import { SuperAdminDashboard } from './components/features/admin/SuperAdminDashboard';
import { ClientDashboard } from './components/features/student/ClientDashboard';
import { CompanyDashboard } from './components/features/company/CompanyDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantCompany, setTenantCompany] = useState<Company | null>(null);
  const [isValidationMode, setIsValidationMode] = useState(false);
  const [initialCertId, setInitialCertId] = useState<string>('');

  useEffect(() => {
    const loadInitData = async () => {
      // Initialize remote database if needed
      await initDB();

      // Check URL query parameters for validation deep links (?validar=cert_xxx or ?cert=cert_xxx or ?id=cert_xxx)
      const params = new URLSearchParams(window.location.search);
      const queryCertId = params.get('validar') || params.get('cert') || params.get('id');
      if (queryCertId) {
        setInitialCertId(queryCertId.trim());
        setIsValidationMode(true);
      }

      const user = auth.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        if (user.companyId) {
          const companies = await db.getCompanies();
          setTenantCompany(companies.find(c => c.id === user.companyId) || null);
        }
      }
      setLoading(false);
    };
    loadInitData();
  }, []);

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    if (user.companyId) {
      const companies = await db.getCompanies();
      setTenantCompany(companies.find(c => c.id === user.companyId) || null);
    }
  };

  const handleLogout = () => {
    auth.logout();
    setCurrentUser(null);
    setTenantCompany(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-sm">Carregando Plataforma...</p>
      </div>
    );
  }

  if (!currentUser) {
    if (isValidationMode) {
      return (
        <PublicValidationScreen 
          initialCertId={initialCertId} 
          onBack={() => {
            setIsValidationMode(false);
            setInitialCertId('');
            // Clean up URL query param if present
            if (window.history.pushState) {
              const cleanUrl = window.location.pathname;
              window.history.pushState(null, '', cleanUrl);
            }
          }} 
        />
      );
    }
    return (
      <LandingPage 
        onLogin={handleLogin}
        onOpenValidation={(certId) => {
          if (certId) setInitialCertId(certId);
          setIsValidationMode(true);
        }}
      />
    );
  }

  const primaryColor = currentUser.role === 'SUPER_ADMIN' ? '#0f172a' : (tenantCompany?.primaryColor || '#0f172a');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header 
        className="text-white p-4 shadow-md print:hidden flex justify-between items-center transition-colors"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center space-x-3">
          {tenantCompany?.logoUrl ? (
            <img src={tenantCompany.logoUrl} alt="Logo" className="h-8 bg-white/10 rounded px-2" />
          ) : (
            <h1 className="text-xl font-bold tracking-tight">{tenantCompany ? tenantCompany.name : 'CertifiqPRO'}</h1>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm">Olá, {currentUser.name}</span>
          <button 
            onClick={handleLogout}
            className="bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
          >
            Sair
          </button>
        </div>
      </header>
      
      <main className="flex-1 p-4 sm:p-8 w-full max-w-7xl mx-auto">
        {currentUser.role === 'SUPER_ADMIN' && <SuperAdminDashboard currentUser={currentUser} />}
        {['COMPANY_ADMIN', 'SECRETARY'].includes(currentUser.role) && <CompanyDashboard currentUser={currentUser} />}
        {currentUser.role === 'STUDENT' && <ClientDashboard currentUser={currentUser} />}
      </main>
    </div>
  );
}
