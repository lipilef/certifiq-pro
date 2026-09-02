import { User, Company, Signee, Course, Certificate } from '../types';

// Mock initial data
const MOCK_COMPANIES: Company[] = [
  { id: 'comp1', name: 'Tech Educação Ltda', primaryColor: '#2563eb', logoUrl: '' }
];

const MOCK_USERS: User[] = [
  { id: '1', name: 'Super Administrador', email: 'super@certifiq.pro', password: 'admin', role: 'SUPER_ADMIN' },
  { id: '2', name: 'Admin Tech Educação', email: 'admin@tech.com', password: '123', role: 'COMPANY_ADMIN', companyId: 'comp1' },
  { id: '3', name: 'João Silva', email: 'joao@aluno.com', password: '123', role: 'STUDENT', companyId: 'comp1' }
];

const MOCK_SIGNEES: Signee[] = [
  { 
    id: 'sig1', companyId: 'comp1', name: 'Dr. Roberto Almeida', role: 'Diretor Acadêmico', 
    councilType: 'CREA', councilNumber: '123456-D', 
    signatureImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Assinatura_falsa.png' // Imagem fake provisória
  }
];

const MOCK_COURSES: Course[] = [
  { 
    id: 'c1', companyId: 'comp1', title: 'Desenvolvimento Web Fullstack', 
    hours: 120, syllabus: '1. HTML5 e CSS3\n2. JavaScript ES6+', templateStyle: 'modern' 
  }
];

const MOCK_CERTIFICATES: Certificate[] = [];

// Initialize LocalStorage if empty
export const initDB = () => {
  if (!localStorage.getItem('certifiq_users')) {
    localStorage.setItem('certifiq_companies', JSON.stringify(MOCK_COMPANIES));
    localStorage.setItem('certifiq_users', JSON.stringify(MOCK_USERS));
    localStorage.setItem('certifiq_signees', JSON.stringify(MOCK_SIGNEES));
    localStorage.setItem('certifiq_courses', JSON.stringify(MOCK_COURSES));
    localStorage.setItem('certifiq_certificates', JSON.stringify(MOCK_CERTIFICATES));
  }
};

// Generic DB Service matching future cloud provider signature
export const db = {
  async getCompanies(): Promise<Company[]> {
    return JSON.parse(localStorage.getItem('certifiq_companies') || '[]');
  },
  async saveCompany(company: Company): Promise<void> {
    const companies = await this.getCompanies();
    const existing = companies.findIndex(c => c.id === company.id);
    if (existing >= 0) companies[existing] = company;
    else companies.push(company);
    localStorage.setItem('certifiq_companies', JSON.stringify(companies));
  },
  async deleteCompany(id: string): Promise<void> {
    const companies = await this.getCompanies();
    localStorage.setItem('certifiq_companies', JSON.stringify(companies.filter(c => c.id !== id)));
    // Real app would also delete associated users, courses, signees, etc.
  },
  
  async getUsers(): Promise<User[]> {
    return JSON.parse(localStorage.getItem('certifiq_users') || '[]');
  },
  async saveUser(user: User): Promise<void> {
    const users = await this.getUsers();
    const existing = users.findIndex(u => u.id === user.id);
    if (existing >= 0) users[existing] = user;
    else users.push(user);
    localStorage.setItem('certifiq_users', JSON.stringify(users));
  },
  async deleteUser(id: string): Promise<void> {
    const users = await this.getUsers();
    localStorage.setItem('certifiq_users', JSON.stringify(users.filter(u => u.id !== id)));
  },
  
  async getSigneesByCompany(companyId: string): Promise<Signee[]> {
    const all: Signee[] = JSON.parse(localStorage.getItem('certifiq_signees') || '[]');
    return all.filter(s => s.companyId === companyId);
  },
  async saveSignee(signee: Signee): Promise<void> {
    const all: Signee[] = JSON.parse(localStorage.getItem('certifiq_signees') || '[]');
    const existing = all.findIndex(s => s.id === signee.id);
    if (existing >= 0) all[existing] = signee;
    else all.push(signee);
    localStorage.setItem('certifiq_signees', JSON.stringify(all));
  },
  async deleteSignee(id: string): Promise<void> {
    const all: Signee[] = JSON.parse(localStorage.getItem('certifiq_signees') || '[]');
    localStorage.setItem('certifiq_signees', JSON.stringify(all.filter(s => s.id !== id)));
  },
  
  async getCoursesByCompany(companyId: string): Promise<Course[]> {
    const all: Course[] = JSON.parse(localStorage.getItem('certifiq_courses') || '[]');
    return all.filter(c => c.companyId === companyId);
  },
  async saveCourse(course: Course): Promise<void> {
    const all: Course[] = JSON.parse(localStorage.getItem('certifiq_courses') || '[]');
    const existing = all.findIndex(c => c.id === course.id);
    if (existing >= 0) all[existing] = course;
    else all.push(course);
    localStorage.setItem('certifiq_courses', JSON.stringify(all));
  },
  async deleteCourse(id: string): Promise<void> {
    const all: Course[] = JSON.parse(localStorage.getItem('certifiq_courses') || '[]');
    localStorage.setItem('certifiq_courses', JSON.stringify(all.filter(c => c.id !== id)));
  },
  
  async getCertificates(filter: { studentId?: string, companyId?: string }): Promise<Certificate[]> {
    const all: Certificate[] = JSON.parse(localStorage.getItem('certifiq_certificates') || '[]');
    return all.filter(c => {
      let match = true;
      if (filter.studentId && c.studentId !== filter.studentId) match = false;
      if (filter.companyId && c.companyId !== filter.companyId) match = false;
      return match;
    });
  },
  async saveCertificate(cert: Certificate): Promise<void> {
    const all: Certificate[] = JSON.parse(localStorage.getItem('certifiq_certificates') || '[]');
    all.push(cert);
    localStorage.setItem('certifiq_certificates', JSON.stringify(all));
  }
};
