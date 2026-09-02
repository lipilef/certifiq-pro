import React, { useEffect, useState } from 'react';
import { Company, User } from '../../../types';
import { db } from '../../../services/db';
import { CertificateRenderer } from '../certificate/CertificateRenderer';
import { generatePDF } from '../../../utils/pdfGenerator';
import { Download } from 'lucide-react';
import { Eye, X } from 'lucide-react';

export function SuperAdminDashboard({ currentUser: _currentUser }: { currentUser: User }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({ name: '', adminEmail: '', adminPassword: '', primaryColor: '#0f172a', logoUrl: '' });

  const loadData = async () => {
    const data = await db.getCompanies();
    setCompanies(data);
  };

  useEffect(() => { 
    let isMounted = true;
    db.getCompanies().then(data => {
      if (isMounted) setCompanies(data);
    });
    return () => { isMounted = false; };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      await db.saveCompany({ id: isEditing, name: formData.name, primaryColor: formData.primaryColor, logoUrl: formData.logoUrl, customTemplateUrl: formData.customTemplateUrl });
      if (adminUserId) {
        const allUsers = await db.getUsers();
        const adminUser = allUsers.find(u => u.id === adminUserId);
        if (adminUser) {
           await db.saveUser({ ...adminUser, email: formData.adminEmail, password: formData.adminPassword });
        }
      } else {
        await db.saveUser({
          id: 'usr_' + Date.now(),
          role: 'COMPANY_ADMIN',
          name: 'Admin ' + formData.name,
          email: formData.adminEmail,
          password: formData.adminPassword,
          companyId: isEditing
        });
      }
    } else {
      const newCompanyId = 'comp_' + Date.now();
      await db.saveCompany({ id: newCompanyId, name: formData.name, primaryColor: formData.primaryColor, logoUrl: formData.logoUrl, customTemplateUrl: formData.customTemplateUrl });
      await db.saveUser({
        id: 'usr_' + Date.now(),
        role: 'COMPANY_ADMIN',
        name: 'Admin ' + formData.name,
        email: formData.adminEmail,
        password: formData.adminPassword,
        companyId: newCompanyId
      });
    }
    setFormData({ name: '', adminEmail: '', adminPassword: '', primaryColor: '#0f172a', logoUrl: '', customTemplateUrl: '' });
    setAdminUserId(null);
    setIsEditing(null);
    setIsCreating(false);
    loadData();
  };

  const handleEdit = (c: Company) => {
    setFormData({ name: c.name, primaryColor: c.primaryColor || '#0f172a', logoUrl: c.logoUrl || '', adminEmail: '', adminPassword: '' });
    setIsEditing(c.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Clientes (Tenants)</h2>
          <p className="text-sm text-slate-500 mt-1">Bem-vindo ao painel Super Admin. Controle as empresas licenciadas.</p>
        </div>
        {!isEditing && (
          <button onClick={() => { setIsCreating(!isCreating); setFormData({ name: '', adminEmail: '', adminPassword: '', primaryColor: '#0f172a', logoUrl: '', customTemplateUrl: '' }); setAdminUserId(null); }} className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 shadow-md">
            {isCreating ? 'Cancelar' : '+ Nova Empresa'}
          </button>
        )}
      </div>

      {(isCreating || isEditing) && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-4">
          <h3 className="font-bold text-lg border-b pb-2 text-slate-800">{isEditing ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Nome da Empresa</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500" placeholder="Ex: Acme Corp" />
            </div>
            {!isEditing && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Email do Admin</label>
                  <input required type="email" value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500" placeholder="admin@empresa.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Senha Inicial</label>
                  <input required type="password" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500" placeholder="***" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Cor Primária</label>
              <div className="flex space-x-2">
                <input type="color" value={formData.primaryColor} onChange={e => setFormData({...formData, primaryColor: e.target.value})} className="h-10 w-16 p-1 border border-slate-300 rounded cursor-pointer" />
                <input type="text" value={formData.primaryColor} onChange={e => setFormData({...formData, primaryColor: e.target.value})} className="w-full p-2 border border-slate-300 rounded font-mono uppercase focus:ring-2 focus:ring-slate-500" placeholder="#000000" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-slate-700">Logo URL (Opcional)</label>
              <input type="url" value={formData.logoUrl} onChange={e => setFormData({...formData, logoUrl: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500" placeholder="https://exemplo.com/logo.png" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium">
              {isEditing ? 'Salvar Alterações' : 'Criar Empresa & Admin'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-sm">
                <th className="p-4 font-semibold border-b border-slate-200">Logo</th>
                <th className="p-4 font-semibold border-b border-slate-200">Nome da Empresa</th>
                <th className="p-4 font-semibold border-b border-slate-200">Cor Primária</th>
                <th className="p-4 font-semibold border-b border-slate-200">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    {c.logoUrl ? <img src={c.logoUrl} alt="Logo" className="h-10 w-auto object-contain bg-slate-100 p-1 rounded" /> : <span className="text-xs text-slate-400 font-medium">Sem Logo</span>}
                  </td>
                  <td className="p-4 font-medium text-slate-800">{c.name}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-md shadow-sm border border-slate-200" style={{ backgroundColor: c.primaryColor }}></div>
                      <span className="text-sm text-slate-600 font-mono">{c.primaryColor}</span>
                    </div>
                  </td>
                  <td className="p-4 flex space-x-4">
                    <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">Editar</button>
                    <button onClick={async () => {
                        if (confirm(`Tem certeza que deseja deletar a empresa ${c.name}?`)) {
                            await db.deleteCompany(c.id);
                            loadData();
                        }
                    }} className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors">Excluir</button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Nenhuma empresa cadastrada no momento.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AllCertificatesList />
    </div>
  );
}


function AllCertificatesList() {
  const [certs, setCerts] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [courses, setCourses] = React.useState<any[]>([]);
  const [companies, setCompanies] = React.useState<any[]>([]);
  const [signees, setSignees] = React.useState<any[]>([]);
  const [viewCert, setViewCert] = React.useState<any>(null);

  React.useEffect(() => {
    const load = async () => {
      setCerts(await db.getCertificates({}));
      setUsers(await db.getUsers());
      setCompanies(await db.getCompanies());
      
      const allC = [];
      const allS = [];
      for (const comp of await db.getCompanies()) {
        allC.push(...(await db.getCoursesByCompany(comp.id)));
        allS.push(...(await db.getSigneesByCompany(comp.id)));
      }
      setCourses(allC);
      setSignees(allS);
    };
    load();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
      <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Todos os Certificados Emitidos na Plataforma</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 border-b">ID Validação</th>
              <th className="p-3 border-b">Empresa</th>
              <th className="p-3 border-b">Aluno</th>
              <th className="p-3 border-b">Curso</th>
              <th className="p-3 border-b">Data</th>
              <th className="p-3 border-b">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {certs.map(cert => {
              const student = users.find(u => u.id === cert.studentId);
              const course = courses.find(c => c.id === cert.courseId);
              const company = companies.find(c => c.id === cert.companyId);
              return (
                <tr key={cert.id}>
                  <td className="p-3 font-mono text-xs text-gray-500">{cert.id}</td>
                  <td className="p-3 font-medium">{company ? company.name : '-'}</td>
                  <td className="p-3 font-medium">{student ? student.name : '-'}</td>
                  <td className="p-3 text-gray-600">{course ? course.title : '-'}</td>
                  <td className="p-3 text-gray-600">{new Date(cert.issueDate).toLocaleDateString('pt-BR')}</td>
                  <td className="p-3">
                    <button onClick={() => setViewCert({cert, course, student, company})} className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                      <Eye size={16} /> <span>Visualizar</span>
                    </button>
                  </td>
                </tr>
              )
            })}
            {certs.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-gray-500">Nenhum certificado emitido.</td></tr>}
          </tbody>
        </table>
      </div>

      {viewCert && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-5xl my-8 relative overflow-x-auto">
            <div className="sticky top-0 right-0 bg-white p-4 border-b flex justify-between items-center z-10">
               <h3 className="font-bold text-lg">Visualização do Certificado</h3>
               
               <div className="flex items-center space-x-2">
                 <button 
                    onClick={() => {
                      const cleanStr = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
                      const filename = `${cleanStr(viewCert.company.name)}-${cleanStr(viewCert.course.title)}-${cleanStr(viewCert.student.name)}`;
                      generatePDF(viewCert.cert.id, filename);
                    }}
                    className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                 >
                    <Download size={16} /> <span>Baixar PDF</span>
                 </button>
                 <button onClick={() => setViewCert(null)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                    <X size={20} />
                 </button>
               </div>

            </div>
            <div className="p-8 flex justify-center min-w-[1100px]">
               {viewCert.company && viewCert.student && viewCert.course ? (
                 <CertificateRenderer 
                    certificate={viewCert.cert} 
                    company={viewCert.company}
                    student={viewCert.student}
                    course={viewCert.course}
                    signees={signees.filter(s => viewCert.cert.signeeIds?.includes(s.id))}
                 />
               ) : (
                 <p className="text-red-500">Dados incompletos para renderizar.</p>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}