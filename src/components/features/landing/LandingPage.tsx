import React, { useState, useEffect } from 'react';
import { 
  Award, 
  ShieldCheck, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Mail, 
  Search, 
  FileText, 
  Layers, 
  Users, 
  XCircle,
  X
} from 'lucide-react';
import { Company, User } from '../../../types';
import { db } from '../../../services/db';
import { auth } from '../../../services/auth';

interface LandingPageProps {
  onLogin: (user: User) => void;
  onOpenValidation: (initialCertId?: string) => void;
}

export function LandingPage({ onLogin, onOpenValidation }: LandingPageProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState({ companies: 0, certs: 0, users: 0 });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Quick validator on landing page
  const [quickCertId, setQuickCertId] = useState('');
  const [quickResult, setQuickResult] = useState<any>(null);
  const [isValidatingQuick, setIsValidatingQuick] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadPlatformData = async () => {
      try {
        const [allCompanies, allCerts, allUsers] = await Promise.all([
          db.getCompanies(),
          db.getCertificates({}),
          db.getUsers()
        ]);
        if (!isMounted) return;
        setCompanies(allCompanies);
        setStats({
          companies: allCompanies.length,
          certs: allCerts.length,
          users: allUsers.length
        });
      } catch (err) {
        console.error('Erro ao carregar dados da landing page:', err);
      }
    };
    loadPlatformData();
    return () => { isMounted = false; };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const user = await auth.login(email, password);
      if (user) {
        onLogin(user);
      } else {
        setLoginError('Email ou senha incorretos.');
      }
    } catch {
      setLoginError('Erro ao autenticar.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleQuickValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCertId.trim()) return;
    setIsValidatingQuick(true);
    setQuickResult(null);

    try {
      const allCerts = await db.getCertificates({});
      const cert = allCerts.find(c => c.id.trim().toLowerCase() === quickCertId.trim().toLowerCase());
      if (cert) {
        const [comps, users, courses] = await Promise.all([
          db.getCompanies(),
          db.getUsers(),
          db.getCoursesByCompany(cert.companyId)
        ]);
        setQuickResult({
          valid: true,
          company: comps.find(c => c.id === cert.companyId)?.name || 'Instituição',
          student: users.find(u => u.id === cert.studentId)?.name || 'Aluno',
          course: courses.find(c => c.id === cert.courseId)?.title || 'Curso Concluído',
          date: new Date(cert.issueDate).toLocaleDateString('pt-BR'),
          id: cert.id
        });
      } else {
        setQuickResult({ valid: false });
      }
    } catch {
      setQuickResult({ valid: false });
    } finally {
      setIsValidatingQuick(false);
    }
  };

  const fillTestAccount = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white w-full overflow-x-clip">
      
      {/* 🧭 Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                CertifiqPRO
              </span>
              <span className="hidden xs:inline text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Cloud
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#clients" className="hover:text-white transition-colors">Instituições</a>
            <a href="#validator" className="hover:text-white transition-colors">Validação Rápida</a>
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => onOpenValidation()}
              className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/50 transition-colors flex items-center space-x-1 sm:space-x-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Validar</span>
            </button>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Entrar na Plataforma
            </button>
          </div>
        </div>
      </header>

      {/* 🚀 Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 w-full">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[300px] bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 blur-[120px] pointer-events-none rounded-full"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] sm:text-xs font-medium text-slate-300 mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Multi-tenant SaaS &middot; Conselhos de Classe &middot; Antifraude</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-5 sm:mb-6">
            Emissão e Validação Segura de <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-400 bg-clip-text text-transparent">
              Certificados Digitais
            </span>
          </h1>

          <p className="text-sm sm:text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10">
            A plataforma definitiva para instituições de ensino, escolas técnicas e empresas emitirem certificados com identidade visual própria, histórico escolar no verso e validação pública instantânea em nuvem.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 text-sm sm:text-base"
            >
              <span>Acessar Plataforma</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#validator"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold px-6 py-3 rounded-xl transition-colors text-sm sm:text-base"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span>Testar Validação de Certificado</span>
            </a>
          </div>

          {/* 📈 Live Platform Stats */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4 max-w-3xl mx-auto p-3 sm:p-6 bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-2xl shadow-xl">
            <div className="text-center border-r border-slate-800 px-1 sm:px-2">
              <div className="text-xl sm:text-3xl font-extrabold text-indigo-400 font-mono">{stats.companies}</div>
              <div className="text-[10px] sm:text-sm text-slate-400 mt-0.5 sm:mt-1">Instituições</div>
            </div>
            <div className="text-center border-r border-slate-800 px-1 sm:px-2">
              <div className="text-xl sm:text-3xl font-extrabold text-violet-400 font-mono">{stats.certs}</div>
              <div className="text-[10px] sm:text-sm text-slate-400 mt-0.5 sm:mt-1">Certificados</div>
            </div>
            <div className="text-center px-1 sm:px-2">
              <div className="text-xl sm:text-3xl font-extrabold text-emerald-400 font-mono">&lt; 250ms</div>
              <div className="text-[10px] sm:text-sm text-slate-400 mt-0.5 sm:mt-1">Latência</div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔍 Quick Validator Section */}
      <section id="validator" className="py-16 bg-slate-900/40 border-y border-slate-800/80 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-3">
                <ShieldCheck className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Validação Pública Instantânea</h2>
              <p className="text-sm text-slate-400 mt-1 max-w-md">
                Digite o identificador único de qualquer certificado emitido pela plataforma para verificar sua autenticidade.
              </p>
            </div>

            <form onSubmit={handleQuickValidate} className="max-w-lg mx-auto flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                placeholder="Ex: cert_1788328265940"
                value={quickCertId}
                onChange={(e) => setQuickCertId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-center sm:text-left font-mono placeholder:font-sans placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              />
              <button
                type="submit"
                disabled={isValidatingQuick}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
              >
                {isValidatingQuick ? <span>Consultando...</span> : <span>Verificar Autenticidade</span>}
              </button>
            </form>

            {/* Quick Result Feedback */}
            {quickResult && (
              <div className="mt-6 max-w-lg mx-auto">
                {quickResult.valid ? (
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-5 text-emerald-300">
                    <div className="flex items-center space-x-2.5 mb-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                      <span className="font-bold text-white text-base">Certificado Autêntico & Válido</span>
                    </div>
                    <div className="text-xs sm:text-sm space-y-1.5 text-slate-300 border-t border-emerald-500/20 pt-3">
                      <p><strong className="text-white">Aluno(a):</strong> {quickResult.student}</p>
                      <p><strong className="text-white">Curso:</strong> {quickResult.course}</p>
                      <p><strong className="text-white">Instituição:</strong> {quickResult.company}</p>
                      <p><strong className="text-white">Data de Emissão:</strong> {quickResult.date}</p>
                      <p className="font-mono text-xs text-slate-400 pt-1">ID: {quickResult.id}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-5 text-rose-300 flex items-center space-x-3">
                    <XCircle className="w-6 h-6 text-rose-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-white">Certificado Não Encontrado</h4>
                      <p className="text-xs text-slate-400 mt-0.5">O código informado não corresponde a nenhum registro oficial ativo.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 🏢 Clients & Institutions Showcase */}
      <section id="clients" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>Ecossistema de Clientes</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">Instituições Conectadas</h2>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Organizações que confiam no CertifiqPRO para emitir e autenticar certificados profissionais e acadêmicos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div 
              key={company.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all hover:-translate-y-1 group relative overflow-hidden"
            >
              {/* Brand Color Bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: company.primaryColor || '#6366f1' }}
              />

              <div className="flex items-center space-x-4 mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-inner"
                  style={{ backgroundColor: company.primaryColor || '#334155' }}
                >
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name} className="w-8 h-8 object-contain" />
                  ) : (
                    <span>{company.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{company.name}</h3>
                  <span className="inline-flex items-center text-[11px] text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Tenant Verificado
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Instituição credenciada com emissão white-label de certificados digitais e validação em tempo real.
              </p>
            </div>
          ))}

          {companies.length === 0 && (
            <div className="col-span-full text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
              Nenhuma instituição listada no momento.
            </div>
          )}
        </div>
      </section>

      {/* 💎 Bento Grid Features */}
      <section id="features" className="py-20 bg-slate-900/30 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white">Tecnologia Feita para Emissão Profissional</h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Recursos essenciais para escolas, cursos livres, universidades corporativas e conselhos de classe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">White-Label Completo</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Substitua logotipos, cores primárias, estilos de borda e templates para combinar com a identidade exata da sua marca.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Histórico & Ementa no Verso</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Certificados frente e verso gerados automaticamente com carga horária, módulos do curso e conteúdo programático completo.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Conselhos de Classe</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Cadastre assinantes autorizados com registro em conselhos (CREA, CRM, CRO, COREN, OAB) e assinaturas escaneadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔐 Interactive Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative">
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2.5 rounded-xl shadow-lg mb-3">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Acessar Plataforma</h3>
              <p className="text-xs text-slate-400 mt-1 text-center">Entre com seu e-mail e senha para continuar.</p>
            </div>

            {loginError && (
              <div className="bg-rose-950/50 border border-rose-500/40 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs mb-4">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/25 text-sm mt-2 disabled:opacity-50"
              >
                {isLoggingIn ? 'Entrando...' : 'Entrar na Plataforma'}
              </button>
            </form>

            {/* Quick Test Demo Credentials */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5 text-center">
                Acessos de Teste (Demo):
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillTestAccount('super@certifiq.pro', 'admin')}
                  className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 transition-colors text-center"
                >
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillTestAccount('admin@tech.com', '123')}
                  className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 transition-colors text-center"
                >
                  Empresa
                </button>
                <button
                  type="button"
                  onClick={() => fillTestAccount('joao@aluno.com', '123')}
                  className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 transition-colors text-center"
                >
                  Aluno
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🦶 Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">CertifiqPRO</span>
            <span>&copy; {new Date().getFullYear()} - Plataforma de Certificados SaaS</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Infraestrutura em Nuvem: <strong className="text-slate-300 font-mono">db.dunhas.com</strong></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
