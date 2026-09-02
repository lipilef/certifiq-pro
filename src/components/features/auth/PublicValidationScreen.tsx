import React, { useState } from 'react';
import { Award, Search, CheckCircle, XCircle } from 'lucide-react';
import { db } from '../../../services/db';

export function PublicValidationScreen({ onBack }: { onBack: () => void }) {
  const [certId, setCertId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    
    const allCerts = await db.getCertificates({});
    const cert = allCerts.find(c => c.id === certId.trim());
    
    if (cert) {
      const companies = await db.getCompanies();
      const users = await db.getUsers();
      const courses = await db.getCoursesByCompany(cert.companyId);
      
      setResult({
        valid: true,
        company: companies.find(c => c.id === cert.companyId)?.name,
        student: users.find(u => u.id === cert.studentId)?.name,
        course: courses.find(c => c.id === cert.courseId)?.title,
        date: new Date(cert.issueDate).toLocaleDateString('pt-BR')
      });
    } else {
      setResult({ valid: false });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800 mb-6 font-medium flex items-center">
          &larr; Voltar ao Login
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="bg-slate-900 p-3 rounded-full mb-3">
            <Search className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Validação Pública</h1>
          <p className="text-gray-500 text-sm mt-1 text-center">Verifique a autenticidade de um certificado.</p>
        </div>

        <form onSubmit={handleValidate} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código do Certificado</label>
            <input 
              type="text" 
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none font-mono text-center"
              placeholder="Ex: cert_1788328265940"
              value={certId} onChange={(e) => setCertId(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
            Validar Agora
          </button>
        </form>

        {searched && result && (
          <div className={`p-4 rounded-lg border ${result.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {result.valid ? (
              <div className="flex flex-col items-center text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                <h3 className="text-lg font-bold text-green-800 mb-2">Certificado Válido!</h3>
                <div className="text-sm text-green-900 space-y-1">
                  <p><strong>Aluno:</strong> {result.student}</p>
                  <p><strong>Curso:</strong> {result.course}</p>
                  <p><strong>Instituição:</strong> {result.company}</p>
                  <p><strong>Emissão:</strong> {result.date}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <XCircle className="w-12 h-12 text-red-500 mb-2" />
                <h3 className="text-lg font-bold text-red-800">Certificado Inválido</h3>
                <p className="text-sm text-red-700 mt-1">O código informado não consta em nossos registros.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
