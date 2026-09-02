import React, { useState, useEffect } from 'react';
import { User, Company } from './types';
import { auth } from './services/auth';
import { db } from './services/db';
import { LoginScreen } from './components/features/auth/LoginScreen';
import { PublicValidationScreen } from './components/features/auth/PublicValidationScreen';
import { SuperAdminDashboard } from './components/features/admin/SuperAdminDashboard';
import { ClientDashboard } from './components/features/student/ClientDashboard';
import { CompanyDashboard } from './components/features/company/CompanyDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantCompany, setTenantCompany] = useState<Company | null>(null);
  const [isValidationMode, setIsValidationMode] = useState(false);

  useEffect(() => {
    const loadInitData = async () => {
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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Carregando Plataforma...</div>;
  }

  if (!currentUser) {
    if (isValidationMode) {
      return <PublicValidationScreen onBack={() => setIsValidationMode(false)} />;
    }
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
        <div className="fixed bottom-4 right-4 z-50">
           <button 
             onClick={() => setIsValidationMode(true)}
             className="bg-white text-slate-800 shadow-lg px-4 py-2 rounded-full font-medium text-sm border hover:bg-gray-50"
           >
             Validar um Certificado &rarr;
           </button>
        </div>
      </>
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
        {currentUser.role === 'COMPANY_ADMIN' && <CompanyDashboard currentUser={currentUser} />}
        {currentUser.role === 'STUDENT' && <ClientDashboard currentUser={currentUser} />}
      </main>
    </div>
  );
}
