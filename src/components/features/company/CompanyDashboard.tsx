import React, { useState, useEffect } from 'react';
import { User, Company, Signee, Course, Certificate } from '../../../types';
import { db } from '../../../services/db';
import { Settings, Users, Award, BookOpen, FileText } from 'lucide-react';

interface CompanyDashboardProps {
  currentUser: User;
}

export function CompanyDashboard({ currentUser }: CompanyDashboardProps) {
  const [activeTab, setActiveTab] = useState(currentUser.role === 'SECRETARY' ? 'students' : 'settings');
  const [company, setCompany] = useState<Company | null>(null);
  const [signees, setSignees] = useState<Signee[]>([]);
  
  useEffect(() => {
    const loadCompanyData = async () => {
      if (currentUser.companyId) {
        const companies = await db.getCompanies();
        setCompany(companies.find(c => c.id === currentUser.companyId) || null);
        setSignees(await db.getSigneesByCompany(currentUser.companyId));
      }
    };
    loadCompanyData();
  }, [currentUser]);

  if (!company) return <div>Carregando empresa...</div>;

  return (
    <div className="space-y-6">
      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {currentUser.role !== 'SECRETARY' && (
           <>
            <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="Identidade Visual" color={company.primaryColor} />
            <TabButton active={activeTab === 'fields'} onClick={() => setActiveTab('fields')} icon={Settings} label="Campos Customizados" color={company.primaryColor} />
            <TabButton active={activeTab === 'team'} onClick={() => setActiveTab('team')} icon={Users} label="Equipe" color={company.primaryColor} />
            <TabButton active={activeTab === 'signees'} onClick={() => setActiveTab('signees')} icon={Users} label="Assinantes" color={company.primaryColor} />
            <TabButton active={activeTab === 'courses'} onClick={() => setActiveTab('courses')} icon={BookOpen} label="Cursos" color={company.primaryColor} />
           </>
        )}
        <TabButton active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={Users} label="Alunos" color={company.primaryColor} />
        <TabButton active={activeTab === 'emit'} onClick={() => setActiveTab('emit')} icon={Award} label="Emitir" color={company.primaryColor} />
        <TabButton active={activeTab === 'issued'} onClick={() => setActiveTab('issued')} icon={FileText} label="Emitidos" color={company.primaryColor} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {activeTab === 'settings' && <CompanySettings company={company} setCompany={setCompany} />}
          {activeTab === 'fields' && <CompanyFields company={company} setCompany={setCompany} />}
        {activeTab === 'team' && <ManageTeam companyId={company.id} color={company.primaryColor} />}
        {activeTab === 'signees' && <ManageSignees companyId={company.id} signees={signees} setSignees={setSignees} color={company.primaryColor} />}
        {activeTab === 'courses' && <ManageCourses companyId={company.id} color={company.primaryColor} />}
        {activeTab === 'students' && <ManageStudents company={company} color={company.primaryColor} />}
        {activeTab === 'emit' && <EmitCertificate companyId={company.id} signees={signees} color={company.primaryColor} />}
        {activeTab === 'issued' && <IssuedCertificates companyId={company.id} color={company.primaryColor} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, color }: any) {
  return (
    <button
      onClick={onClick}
      style={active ? { backgroundColor: color || '#0f172a', color: '#fff' } : {}}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
        !active && 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

function CompanySettings({ company, setCompany }: { company: Company, setCompany: (c: Company) => void }) {
  const [formData, setFormData] = useState(company);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.saveCompany(formData);
    setCompany(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-xl">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Identidade Visual (White-label)</h2>
      {saved && <div className="p-3 bg-green-100 text-green-700 rounded-md">Configurações salvas com sucesso!</div>}
      
      <div>
        <label className="block text-sm font-medium mb-1">Nome da Empresa</label>
        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-md" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">URL da Logo</label>
        <input type="text" placeholder="https://..." value={formData.logoUrl || ''} onChange={e => setFormData({...formData, logoUrl: e.target.value})} className="w-full p-2 border rounded-md" />
        <p className="text-xs text-gray-500 mt-1">Insira a URL de uma imagem para testar a substituição da logo nos certificados.</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Cor Primária (Hexadecimal)</label>
        <div className="flex space-x-2">
          <input type="color" value={formData.primaryColor || '#000000'} onChange={e => setFormData({...formData, primaryColor: e.target.value})} className="h-10 w-10 border rounded-md cursor-pointer" />
          <input type="text" value={formData.primaryColor || ''} onChange={e => setFormData({...formData, primaryColor: e.target.value})} className="flex-1 p-2 border rounded-md font-mono" />
        </div>
      </div>
      <button type="submit" className="px-4 py-2 text-white rounded-md transition-colors" style={{ backgroundColor: formData.primaryColor || '#0f172a' }}>Salvar Configurações</button>
    </form>
  );
}

function ManageSignees({ companyId, signees, setSignees, color }: any) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<any>({ name: '', role: '', councilType: '', councilNumber: '', signatureImageUrl: '' });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSignee = {
      id: formData.id || 'sig_' + Date.now(),
      companyId,
      ...formData
    };
    await db.saveSignee(newSignee);
    const updated = await db.getSigneesByCompany(companyId);
    setSignees(updated);
    setIsCreating(false);
    setFormData({ name: '', role: '', councilType: '', councilNumber: '', signatureImageUrl: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deletar este assinante?')) {
        await db.deleteSignee(id);
        setSignees(await db.getSigneesByCompany(companyId));
    }
  };

  const handleEdit = (s: Signee) => {
    setFormData(s);
    setIsCreating(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-bold text-gray-800">Assinantes Autorizados</h2>
        <button onClick={() => { setIsCreating(!isCreating); setFormData({ name: '', role: '', councilType: '', councilNumber: '', signatureImageUrl: '' }) }} className="px-3 py-1 text-white rounded text-sm" style={{ backgroundColor: color || '#0f172a' }}>
          {isCreating ? 'Cancelar' : '+ Novo Assinante'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome Completo</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded" placeholder="Dr. João Silva" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cargo</label>
              <input required type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2 border rounded" placeholder="Diretor Executivo" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Conselho (Opcional)</label>
              <select value={formData.councilType} onChange={e => setFormData({...formData, councilType: e.target.value})} className="w-full p-2 border rounded bg-white">
                <option value="">Nenhum / Não aplicável</option>
                <option value="CREA">CREA</option>
                <option value="CRM">CRM</option>
                <option value="CRO">CRO</option>
                <option value="COREN">COREN</option>
                <option value="OAB">OAB</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">NÂº do Conselho (Opcional)</label>
              <input type="text" value={formData.councilNumber} onChange={e => setFormData({...formData, councilNumber: e.target.value})} className="w-full p-2 border rounded" placeholder="12345-X" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">URL da Imagem da Assinatura (Fundo transparente ideal)</label>
              <input required type="text" value={formData.signatureImageUrl} onChange={e => setFormData({...formData, signatureImageUrl: e.target.value})} className="w-full p-2 border rounded" placeholder="https://..." />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 text-white rounded font-medium" style={{ backgroundColor: color || '#0f172a' }}>Salvar Assinante</button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {signees.map((s: Signee) => (
          <div key={s.id} className="border p-4 rounded-lg flex items-start space-x-4">
            <div className="w-24 h-16 bg-gray-50 border border-gray-200 flex items-center justify-center p-1 rounded">
              <img src={s.signatureImageUrl} alt="Assinatura" className="max-w-full max-h-full object-contain mix-blend-multiply" />
            </div>
            <div className="flex-1">
              <p className="font-bold">{s.name}</p>
              <p className="text-sm text-gray-600">{s.role}</p>
              {s.councilType && <p className="text-xs text-gray-500">{s.councilType}: {s.councilNumber}</p>}
            </div>
            <div className="flex flex-col space-y-2">
              <button onClick={() => handleEdit(s)} className="text-blue-600 text-xs hover:underline">Editar</button>
              <button onClick={() => handleDelete(s.id)} className="text-red-600 text-xs hover:underline">Excluir</button>
            </div>
          </div>
        ))}
        {signees.length === 0 && !isCreating && <p className="text-gray-500 col-span-2">Nenhum assinante cadastrado.</p>}
      </div>
    </div>
  );
}

function ManageCourses({ companyId, color }: any) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<any>({ title: '', hours: 10, syllabus: '', templateStyle: 'classic' });

  const loadCourses = async () => {
    const all = await db.getCoursesByCompany(companyId);
    setCourses(all);
  };

  useEffect(() => { 
    let isMounted = true;
    db.getCoursesByCompany(companyId).then(all => {
      if (isMounted) setCourses(all);
    });
    return () => { isMounted = false; };
  }, [companyId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCourse = {
      id: formData.id || 'c_' + Date.now(),
      companyId,
      ...formData
    };
    await db.saveCourse(newCourse);
    await loadCourses();
    setIsCreating(false);
    setFormData({ title: '', hours: 10, syllabus: '', templateStyle: 'classic' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este curso?')) {
        await db.deleteCourse(id);
        await loadCourses();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-bold text-gray-800">Cursos</h2>
        <button onClick={() => { setIsCreating(!isCreating); setFormData({ title: '', hours: 10, syllabus: '', templateStyle: 'classic' }); }} className="px-3 py-1 text-white rounded text-sm" style={{ backgroundColor: color || '#0f172a' }}>
          {isCreating ? 'Cancelar' : '+ Novo Curso'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium mb-1">Título do Curso</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded" placeholder="Ex: Gestão de Projetos" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Carga Horária (Horas)</label>
            <input required type="number" min="1" value={formData.hours} onChange={e => setFormData({...formData, hours: Number(e.target.value)})} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ementa (Conteúdo Programático)</label>
            <textarea required rows={4} value={formData.syllabus} onChange={e => setFormData({...formData, syllabus: e.target.value})} className="w-full p-2 border rounded" placeholder="Módulo 1: Introdução..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estilo de Template</label>
            <select value={formData.templateStyle} onChange={e => setFormData({...formData, templateStyle: e.target.value})} className="w-full p-2 border rounded bg-white">
              <option value="classic">Clássico (Borda Dupla)</option>
              <option value="modern">Moderno (Minimalista Lateral)</option>
              <option value="minimal">Minimalista (Borda Fina)</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 text-white rounded font-medium" style={{ backgroundColor: color || '#0f172a' }}>Salvar Curso</button>
        </form>
      )}

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 border-b">Título</th>
              <th className="p-3 border-b">Horas</th>
              <th className="p-3 border-b">Template</th>
              <th className="p-3 border-b">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {courses.map((c) => (
              <tr key={c.id}>
                <td className="p-3 font-medium">{c.title}</td>
                <td className="p-3 text-gray-600">{c.hours}h</td>
                <td className="p-3 text-gray-600">{c.templateStyle}</td>
                <td className="p-3 flex space-x-3">
                  <button onClick={() => { setFormData(c); setIsCreating(true); }} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">Excluir</button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nenhum curso.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ManageStudents({ companyId, color }: any) {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<any>({ name: '', email: '', cpf: '', password: '' });

  const loadUsers = async () => {
    const all = await db.getUsers();
    setUsers(all.filter(u => u.companyId === companyId && u.role === 'STUDENT'));
  };

  useEffect(() => { 
    let isMounted = true;
    db.getUsers().then(all => {
      if (isMounted) setUsers(all.filter(u => u.companyId === companyId && u.role === 'STUDENT'));
    });
    return () => { isMounted = false; };
  }, [companyId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = {
      id: formData.id || 'stu_' + Date.now(),
      companyId,
      role: 'STUDENT' as const,
      ...formData
    };
    await db.saveUser(newUser);
    await loadUsers();
    setIsCreating(false);
    setFormData({ name: '', email: '', cpf: '', password: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deletar aluno? (Isso não deletará certificados já emitidos para ele no mock)')) {
        await db.deleteUser(id);
        await loadUsers();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-bold text-gray-800">Alunos (Alunos Cadastrados)</h2>
        <button onClick={() => { setIsCreating(!isCreating); setFormData({ name: '', email: '', cpf: '', password: '' }); }} className="px-3 py-1 text-white rounded text-sm" style={{ backgroundColor: color || '#0f172a' }}>
          {isCreating ? 'Cancelar' : '+ Novo Aluno'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium mb-1">Nome Completo</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded" placeholder="João da Silva" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CPF</label>
            <input type="text" value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full p-2 border rounded" placeholder="000.000.000-00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email (Login)</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded" placeholder="joao@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2 border rounded" placeholder="Senha provisória" />
          </div>
          <button type="submit" className="px-4 py-2 text-white rounded font-medium" style={{ backgroundColor: color || '#0f172a' }}>Salvar Aluno</button>
        </form>
      )}

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 border-b">Nome</th>
              <th className="p-3 border-b">CPF</th>
              <th className="p-3 border-b">Email</th>
              <th className="p-3 border-b">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-gray-600">{u.cpf || 'Não informado'}</td>
                <td className="p-3 text-gray-600">{u.email}<br/><span className="text-xs font-bold text-blue-600">{u.role === 'SECRETARY' ? 'Secretaria' : 'Admin'}</span></td>
                <td className="p-3 flex space-x-3">
                  <button onClick={() => { setFormData(u); setIsCreating(true); }} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline">Excluir</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nenhum aluno.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmitCertificate({ companyId, signees, color }: any) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSignees, setSelectedSignees] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    db.getCoursesByCompany(companyId).then(setCourses);
    db.getUsers().then(all => setUsers(all.filter(u => u.companyId === companyId && u.role === 'STUDENT')));
  }, [companyId]);

  const handleEmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !selectedStudent || selectedSignees.length === 0) {
      alert("Preencha todos os campos e selecione ao menos um assinante!");
      return;
    }

    await db.saveCertificate({
      id: 'cert_' + Date.now(),
      companyId,
      courseId: selectedCourse,
      studentId: selectedStudent,
      signeeIds: selectedSignees,
      issueDate: new Date().toISOString()
    });

    setSuccess(true);
    setSelectedCourse('');
    setSelectedStudent('');
    setSelectedSignees([]);
    setTimeout(() => setSuccess(false), 3000);
  };

  const toggleSignee = (id: string) => {
    setSelectedSignees(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div>
       <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Emissão de Certificado</h2>
       {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">Certificado emitido com sucesso! O aluno já pode acessá-lo.</div>}
       
       <form onSubmit={handleEmit} className="space-y-4 max-w-xl">
         <div>
           <label className="block text-sm font-medium mb-1">Selecione o Aluno</label>
           <select required value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="w-full p-2 border rounded bg-white">
             <option value="">-- Escolha um aluno --</option>
             {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
           </select>
         </div>

         <div>
           <label className="block text-sm font-medium mb-1">Selecione o Curso</label>
           <select required value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full p-2 border rounded bg-white">
             <option value="">-- Escolha um curso --</option>
             {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
           </select>
         </div>

         <div>
           <label className="block text-sm font-medium mb-1">Assinantes que constarão no rodapé:</label>
           <div className="space-y-2 border p-3 rounded-lg bg-gray-50">
             {signees.map((s: Signee) => (
               <label key={s.id} className="flex items-center space-x-2">
                 <input type="checkbox" checked={selectedSignees.includes(s.id)} onChange={() => toggleSignee(s.id)} className="rounded" />
                 <span>{s.name} ({s.role})</span>
               </label>
             ))}
             {signees.length === 0 && <span className="text-sm text-red-500">Cadastre assinantes primeiro.</span>}
           </div>
         </div>

         <button type="submit" className="px-6 py-2 text-white rounded font-medium transition-colors" style={{ backgroundColor: color || '#0f172a' }}>Emitir Certificado Agora</button>
       </form>
    </div>
  );
}


function IssuedCertificates({ companyId, color: _color }: any) {
  const [certs, setCerts] = React.useState<Certificate[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);

  React.useEffect(() => {
    const load = async () => {
      const allCerts = await db.getCertificates({ companyId });
      const allUsers = await db.getUsers();
      const allCourses = await db.getCoursesByCompany(companyId);
      setCerts(allCerts);
      setUsers(allUsers);
      setCourses(allCourses);
    };
    load();
  }, [companyId]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-bold text-gray-800">Certificados Emitidos</h2>
      </div>
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 border-b">ID Validação</th>
              <th className="p-3 border-b">Aluno</th>
              <th className="p-3 border-b">Curso</th>
              <th className="p-3 border-b">Data Emissão</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {certs.map(cert => {
              const student = users.find(u => u.id === cert.studentId);
              const course = courses.find(c => c.id === cert.courseId);
              return (
                <tr key={cert.id}>
                  <td className="p-3 font-mono text-xs text-gray-500">{cert.id}</td>
                  <td className="p-3 font-medium">{student ? student.name : 'Aluno Removido'}</td>
                  <td className="p-3 text-gray-600">{course ? course.title : 'Curso Removido'}</td>
                  <td className="p-3 text-gray-600">{new Date(cert.issueDate).toLocaleDateString('pt-BR')}</td>
                </tr>
              )
            })}
            {certs.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nenhum certificado emitido.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompanyFields({ company, setCompany }: { company: Company, setCompany: (c: Company) => void }) {
  const [fields, setFields] = useState<{key:string, label:string, showOnCertificate:boolean}[]>(company.customFieldsDef || []);
  const [saved, setSaved] = useState(false);

  const addField = () => {
    setFields([...fields, { key: 'custom_' + Date.now(), label: '', showOnCertificate: false }]);
  };

  const updateField = (idx: number, updates: any) => {
    const f = [...fields];
    f[idx] = { ...f[idx], ...updates };
    setFields(f);
  };

  const removeField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const saveFields = async () => {
    const updatedCompany = { ...company, customFieldsDef: fields.filter(f => f.label.trim() !== '') };
    await db.saveCompany(updatedCompany);
    setCompany(updatedCompany);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Campos Personalizados do Aluno</h2>
      <p className="text-sm text-gray-600">Defina campos adicionais para os alunos da sua instituição (ex: Matrícula, Cargo). Eles aparecerão no formulário de cadastro.</p>
      
      {saved && <div className="p-3 bg-green-100 text-green-700 rounded-md">Campos salvos com sucesso!</div>}
      
      <div className="space-y-3">
        {fields.map((f, i) => (
          <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 border rounded-lg">
            <div className="flex-1">
              <label className="text-xs text-gray-500 font-medium">Nome do Campo (Rótulo)</label>
              <input type="text" value={f.label} onChange={e => updateField(i, { label: e.target.value })} className="w-full p-2 border rounded text-sm" placeholder="Ex: CPF ou Cargo" />
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <input type="checkbox" id={"show_"+i} checked={f.showOnCertificate} onChange={e => updateField(i, { showOnCertificate: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
              <label htmlFor={"show_"+i} className="text-sm text-gray-700">Exibir no Certificado</label>
            </div>
            <button onClick={() => removeField(i)} className="text-red-500 hover:text-red-700 text-sm font-medium pt-4 pl-2">Remover</button>
          </div>
        ))}
      </div>
      
      <div className="flex space-x-3 pt-4 border-t">
        <button onClick={addField} className="px-4 py-2 bg-gray-100 text-gray-700 border rounded-md hover:bg-gray-200">+ Adicionar Campo</button>
        <button onClick={saveFields} className="px-6 py-2 text-white rounded-md transition-colors" style={{ backgroundColor: company.primaryColor || '#0f172a' }}>Salvar Campos</button>
      </div>
    </div>
  );
}


function ManageTeam({ companyId, color }: any) {
  const [users, setUsers] = useState<User[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<any>({ name: '', email: '', password: '' });

  const loadUsers = async () => {
    const all = await db.getUsers();
    setUsers(all.filter(u => u.companyId === companyId && (u.role === 'COMPANY_ADMIN' || u.role === 'SECRETARY')));
  };

  useEffect(() => {
    loadUsers();
  }, [companyId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = {
      id: formData.id || 'usr_' + Date.now(),
      companyId,
      role: formData.role || 'SECRETARY',
      name: formData.name,
      email: formData.email,
      password: formData.password
    };
    await db.saveUser(newUser);
    await loadUsers();
    setIsCreating(false);
    setFormData({ name: '', email: '', password: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deletar administrador?')) {
        await db.deleteUser(id);
        await loadUsers();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <div>
           <h2 className="text-xl font-bold text-gray-800">Equipe Administrativa</h2>
           <p className="text-sm text-gray-500">Adicione secretários(as) ou gestores para emitirem certificados.</p>
        </div>
        <button onClick={() => { setIsCreating(!isCreating); setFormData({ name: '', email: '', password: '' }); }} className="px-3 py-1 text-white rounded text-sm" style={{ backgroundColor: color || '#0f172a' }}>
          {isCreating ? 'Cancelar' : '+ Novo Administrador'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSave} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded" placeholder="Maria Secretária" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-mail</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded" placeholder="maria@instituicao.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Senha de Acesso</label>
            <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2 border rounded" placeholder="***" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nível de Acesso</label>
            <select value={formData.role || 'SECRETARY'} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2 border rounded">
               <option value="SECRETARY">Secretaria (Só alunos e emissão)</option>
               <option value="COMPANY_ADMIN">Administrador (Acesso total da Empresa)</option>
            </select>
          </div>
          
          <button type="submit" className="w-full py-2 text-white rounded-md transition-colors" style={{ backgroundColor: color || '#0f172a' }}>
            Salvar Acesso
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 border-b">Nome</th>
              <th className="p-3 border-b">Email</th>
              <th className="p-3 border-b">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id}>
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-gray-600">{u.email}<br/><span className="text-xs font-bold text-blue-600">{u.role === 'SECRETARY' ? 'Secretaria' : 'Admin'}</span></td>
                <td className="p-3 flex space-x-3">
                  <button onClick={() => { setFormData(u); setIsCreating(true); }} className="text-blue-600 hover:text-blue-800">Editar</button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-800">Remover</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-500">Nenhum administrador extra.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
