import React from 'react';
import { Award, Shield } from 'lucide-react';
import { Certificate, Course, Signee, User, Company } from '../../../types';

interface CertificateRendererProps {
  certificate: Certificate;
  course: Course;
  student: User;
  company: Company;
  signees: Signee[];
}

export function CertificateRenderer({ certificate, course, student, company, signees }: CertificateRendererProps) {
  // Styles based on template type
  const styles = {
    classic: {
      wrapper: "bg-white p-2 border border-gray-200 shadow-xl",
      container: "border-[16px] border-double bg-[#fffdf0] text-gray-900", // color dinamico
      title: "font-serif",
      fontName: "font-serif italic text-5xl",
      seal: ""
    },
    modern: {
      wrapper: "bg-white shadow-2xl rounded-r-2xl overflow-hidden",
      container: "border-l-[24px] bg-white text-slate-800", // cor lateral dinamica
      title: "font-sans font-black uppercase tracking-widest",
      fontName: "font-sans font-bold text-5xl text-slate-900",
      seal: ""
    },
    minimal: {
      wrapper: "bg-white p-4 shadow-xl border border-gray-100",
      container: "border-2 bg-white text-black p-12 flex flex-col justify-between",
      title: "text-black font-mono uppercase tracking-[0.4em]",
      fontName: "font-sans text-4xl font-light",
      seal: "text-black"
    },
    custom: {
      // Background via CSS inlined further down
      wrapper: "bg-white p-0 shadow-xl overflow-hidden",
      container: "bg-transparent text-gray-900",
      title: "font-serif",
      fontName: "font-serif italic text-5xl",
      seal: ""
    }
  };

  const theme = styles[course.templateStyle || 'classic'];
  const formattedDate = new Date(certificate.issueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const primaryColor = company.primaryColor || '#1e293b';

  return (
    <div className="font-sans flex flex-col items-center print:block overflow-hidden print:overflow-visible" style={{ width: '1123px' }}>
      
      {/* PÁGINA 1: FRENTE DO CERTIFICADO */}
      <div 
        className={`${theme.wrapper} relative mb-8 print:mb-0 print:break-after-page`}
        style={{ width: '1123px', height: '792px' }}
      >
        {/* Custom background se for template customizado */}
        {course.templateStyle === 'custom' && company.customTemplateUrl && (
          <img src={company.customTemplateUrl} alt="Template Fundo" className="absolute inset-0 w-full h-full object-cover z-0" />
        )}

        <div 
          className={`w-full h-full p-10 flex flex-col justify-between relative z-10 ${theme.container}`}
          style={{
            borderColor: course.templateStyle === 'modern' ? primaryColor : (course.templateStyle === 'classic' ? primaryColor : '#000'),
          }}
        >
          
          {/* Logo da Empresa ou Ícone padrão */}
          <div className="absolute top-8 left-8 opacity-10 pointer-events-none">
            {company.logoUrl ? (
              <img src={company.logoUrl} className="w-32 h-auto grayscale" alt="" />
            ) : (
              <Shield className="w-32 h-32" />
            )}
          </div>
          
          <div className="absolute bottom-8 right-8 opacity-5 pointer-events-none" style={{ color: primaryColor }}>
            <Award className="w-32 h-32" />
          </div>

          {/* Cabeçalho */}
          <div className="text-center mt-6 z-10 flex-shrink-0">
            {company.logoUrl && (
               <div className="flex justify-center mb-6">
                 <img src={company.logoUrl} alt={`Logo ${company.name}`} className="h-16 object-contain" />
               </div>
            )}
            <h1 className={`text-4xl mb-2 ${theme.title}`} style={{ color: primaryColor }}>
              Certificado de Conclusão
            </h1>
            <p className="text-lg text-gray-600 uppercase tracking-widest">
              A instituição <strong>{company.name}</strong> certifica que
            </p>
          </div>

          {/* Corpo Principal */}
          <div className="text-center my-4 z-10 flex-1 flex flex-col justify-center">
            <h2 className={`mb-4 ${theme.fontName}`}>
              {student.name}
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
              portador(a) do documento nº <strong>{student.cpf || '___.___.___-__'}</strong>, concluiu com êxito o curso de <br/>
              <strong className="font-bold text-gray-900 text-2xl mt-2 block">{course.title}</strong><br/>
              com carga horária total de <strong>{course.hours} horas</strong>.
            </p>
          </div>

          {/* Rodapé / Assinaturas (Layout flexível e robusto) */}
          <div className="flex justify-between items-end mt-6 z-10 flex-shrink-0">
            
            {/* Info Emissão */}
            <div className="text-left flex-1 min-w-[200px]">
              <p className="text-base text-gray-600 mb-1">Emitido em {formattedDate}</p>
              <div className="font-mono text-xs text-gray-400 mt-1">
                ID Validação:<br/>{certificate.id}
              </div>
            </div>

            {/* Selo Central */}
            <div className="flex justify-center flex-1" style={{ color: primaryColor }}>
               <Award className="w-20 h-20 opacity-80" />
            </div>

            {/* Assinaturas Dinâmicas (Mapeadas do DB) */}
            <div className="flex flex-1 justify-end space-x-6">
              {signees.map(signee => (
                <div key={signee.id} className="text-center flex flex-col items-center">
                  <div className="h-20 flex items-end justify-center border-b border-gray-800 mb-1 w-40">
                     {signee.signatureImageUrl ? (
                       <img src={signee.signatureImageUrl} alt={`Assinatura ${signee.name}`} className="max-h-16 max-w-full object-contain mix-blend-multiply" />
                     ) : (
                       <div className="h-16 w-full"></div>
                     )}
                  </div>
                  <p className="font-bold text-gray-800 text-base leading-tight">{signee.name}</p>
                  <p className="text-xs text-gray-600">{signee.role}</p>
                  {signee.councilType && signee.councilNumber && (
                    <p className="text-[10px] text-gray-500">{signee.councilType}: {signee.councilNumber}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PÁGINA 2: EMENTA / VERSO DO CERTIFICADO */}
      <div 
        className={`bg-white border border-gray-200 flex flex-col p-16`}
        style={{ width: '1123px', height: '792px' }}
      >
        <div className="mb-12 border-b-2 border-gray-200 pb-8 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold uppercase tracking-wider mb-4" style={{ color: primaryColor }}>Histórico Escolar / Ementa</h2>
            <p className="text-gray-700 text-xl mb-2"><strong>Curso:</strong> {course.title}</p>
            <p className="text-gray-700 text-xl"><strong>Carga Horária:</strong> {course.hours} horas</p>
          </div>
          <div className="text-right">
            <p className="text-gray-700 text-xl mb-2"><strong>Aluno(a):</strong> {student.name}</p>
            <p className="text-gray-500 text-base">Emissão: {new Date(certificate.issueDate).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-6 bg-gray-50 p-4 rounded">Conteúdo Programático:</h3>
          <div className="text-gray-700 whitespace-pre-line leading-loose text-lg columns-2 gap-12 px-8">
            {course.syllabus}
          </div>
        </div>

        <div className="mt-16 text-center text-sm text-gray-500 border-t pt-8 max-w-4xl mx-auto">
           Este documento é digital e sua autenticidade pode ser verificada informando o código de validação: <strong>{certificate.id}</strong>.<br/>
           Documento gerado eletronicamente sob responsabilidade da instituição {company.name}.
        </div>
      </div>

    </div>
  );
}
