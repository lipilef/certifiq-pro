import React, { useState, useEffect } from 'react';
import { Award, Clock, FileText, Printer, Download } from 'lucide-react';
import { User, Certificate, Course, Company, Signee } from '../../../types';
import { db } from '../../../services/db';
import { CertificateRenderer } from '../certificate/CertificateRenderer';


interface ClientDashboardProps {
  currentUser: User;
}

export function ClientDashboard({ currentUser }: ClientDashboardProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [signees, setSignees] = useState<Signee[]>([]);
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // Carrega os certificados do aluno atual
      const certs = await db.getCertificates({ studentId: currentUser.id });
      setCertificates(certs);
      
      // Carrega dados da empresa (baseado no companyId do aluno)
      if (currentUser.companyId) {
        const companies = await db.getCompanies();
        const comp = companies.find(c => c.id === currentUser.companyId) || null;
        setCompany(comp);
        
        const compCourses = await db.getCoursesByCompany(currentUser.companyId);
        setCourses(compCourses);
        
        const compSignees = await db.getSigneesByCompany(currentUser.companyId);
        setSignees(compSignees);
      }
    };
    loadData();
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState('certificates');

  const downloadPDF = (courseName: string) => {
    if (!company || !currentUser) return;

    // nome-da-empresa-nome-do-curso-nome-do-aluno-data-da-emissao.pdf
    const formattedDate = new Date().toISOString().split('T')[0];
    const cleanStr = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    
    const filename = `${cleanStr(company.name)}-${cleanStr(courseName)}-${cleanStr(currentUser.name)}-${formattedDate}`;

    const originalTitle = document.title;
    document.title = filename; // Isso força o navegador a usar este nome como default do PDF

    setTimeout(() => {
      window.print();
      document.title = originalTitle; // Restaura o titulo logo apos abrir a tela de impressao
    }, 100);
  };

  if (viewingCert) {
    const course = courses.find(c => c.id === viewingCert.courseId);
    // Filtra apenas os assinantes que assinaram este certificado
    const certSignees = signees.filter(s => viewingCert.signeeIds.includes(s.id));

    if (!course || !company) return <div>Erro ao carregar dados do certificado.</div>;

    return (
      <div className="space-y-4">
        <div className="print:hidden mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg shadow-sm gap-4">
          <button 
            onClick={() => setViewingCert(null)}
            className="text-slate-600 hover:text-slate-900 font-medium px-4 py-2 bg-gray-100 rounded-md transition-colors w-full sm:w-auto text-center"
          >
            &larr; Voltar para meus certificados
          </button>
          <button 
            onClick={() => downloadPDF(course.title)}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto shadow-sm"
            style={{ backgroundColor: company.primaryColor }}
          >
            <Download className="w-4 h-4" />
            <span>Baixar Certificado (PDF)</span>
          </button>
        </div>
        
        <div className="bg-gray-200 p-4 sm:p-8 rounded-lg print:p-0 print:bg-transparent overflow-x-auto print:overflow-visible flex justify-center print:block">
           <div id="certificate-print-area">
             <CertificateRenderer 
               certificate={viewingCert} 
               course={course} 
               student={currentUser} 
               company={company}
               signees={certSignees}
             />
           </div>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const updatedUser = { 
        ...currentUser, 
        name: fd.get('name') as string, 
        cpf: fd.get('cpf') as string,
        email: fd.get('email') as string 
    };
    if (fd.get('password')) updatedUser.password = fd.get('password') as string;
    await db.saveUser(updatedUser);
    alert('Perfil atualizado com sucesso! Faça login novamente se tiver alterado o email/senha.');
  };

  return (
    <div className="print:hidden space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button onClick={() => setActiveTab('certificates')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'certificates' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Meus Certificados</button>
        <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'profile' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Meu Perfil</button>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="max-w-md space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Meus Dados</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Nome (como sairá no certificado)</label>
              <input name="name" required defaultValue={currentUser.name} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CPF</label>
              <input name="cpf" required defaultValue={currentUser.cpf || ''} className="w-full p-2 border rounded" placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email (Login)</label>
              <input name="email" type="email" required defaultValue={currentUser.email} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nova Senha (opcional)</label>
              <input name="password" type="password" placeholder="Deixe em branco para manter" className="w-full p-2 border rounded" />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Salvar Alterações</button>
          </form>
        )}

        {activeTab === 'certificates' && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Meus Certificados</h2>
            <p className="text-gray-500 mb-6">Acesse, visualize e faça o download dos seus certificados de conclusão.</p>

            {certificates.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-1">Nenhum certificado disponível</h3>
                <p className="text-gray-500 max-w-md mx-auto">Você ainda não possui certificados emitidos. Assim que concluir um curso, ele aparecerá aqui.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map(cert => {
                  const course = courses.find(c => c.id === cert.courseId);
                  if (!course) return null;
                  
                  return (
                    <div key={cert.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all transform hover:-translate-y-1 bg-white flex flex-col group">
                      <div className="h-32 flex items-center justify-center p-4 text-center relative overflow-hidden" style={{ backgroundColor: company?.primaryColor || '#0f172a' }}>
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                        {company?.logoUrl ? (
                          <img src={company.logoUrl} alt="Logo" className="h-16 z-10 brightness-0 invert" />
                        ) : (
                          <Award className="w-12 h-12 text-yellow-400 z-10 group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-lg text-gray-800 leading-tight mb-2">{course.title}</h3>
                        <div className="text-sm text-gray-500 mb-4 flex-1 space-y-1">
                          <p className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {course.hours} horas</p>
                          <p className="flex items-center"><FileText className="w-3 h-3 mr-1" /> {new Date(cert.issueDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <button 
                          onClick={() => setViewingCert(cert)}
                          className="w-full bg-slate-50 border font-semibold py-2.5 rounded-lg transition-colors"
                          style={{ color: company?.primaryColor || '#2563eb', borderColor: company?.primaryColor || '#2563eb' }}
                        >
                          Visualizar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
