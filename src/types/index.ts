export type Role = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'SECRETARY' | 'STUDENT';

export interface CustomFieldDef {
  key: string;
  label: string;
  showOnCertificate: boolean;
}

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  cpf?: string;
  password?: string;
  companyId?: string | null; // Null for SUPER_ADMIN
  customData?: Record<string, string>;
}

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  customTemplateUrl?: string;
  customFieldsDef?: CustomFieldDef[];
}

export interface Signee {
  id: string;
  companyId: string;
  name: string;
  role: string; // e.g. "Diretor Executivo"
  councilType?: string; // e.g. "CREA", "CRM", "CRO"
  councilNumber?: string;
  signatureImageUrl: string;
}

export interface Course {
  id: string;
  companyId: string;
  title: string;
  hours: number;
  syllabus: string;
  templateStyle: 'classic' | 'modern' | 'minimal' | 'custom';
}

export interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  companyId: string;
  signeeIds: string[]; // List of signees that signed this certificate
  issueDate: string;
}
