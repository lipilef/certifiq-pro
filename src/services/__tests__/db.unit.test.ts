import { describe, it, expect, beforeAll } from 'vitest';
import { db, initDB } from '../db';
import { Company, User, Course, Signee, Certificate } from '../../types';

// Mock localStorage for node environment if not present
if (typeof localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (idx: number) => Array.from(store.keys())[idx] || null,
    length: store.size
  };
}

describe('json-storage-db Unit Tests', () => {
  const testTimestamp = Date.now();
  const testCompanyId = `comp_test_${testTimestamp}`;
  const testUserId = `usr_test_${testTimestamp}`;
  const testCourseId = `c_test_${testTimestamp}`;
  const testSigneeId = `sig_test_${testTimestamp}`;
  const testCertId = `cert_test_${testTimestamp}`;

  beforeAll(async () => {
    // Ensure DB is initialized
    await initDB();
  });

  it('should initialize and retrieve default companies', async () => {
    const companies = await db.getCompanies();
    expect(Array.isArray(companies)).toBe(true);
    expect(companies.length).toBeGreaterThan(0);
  });

  it('should initialize and retrieve default users', async () => {
    const users = await db.getUsers();
    expect(Array.isArray(users)).toBe(true);
    const superAdmin = users.find(u => u.role === 'SUPER_ADMIN');
    expect(superAdmin).toBeDefined();
    expect(superAdmin?.email).toBe('super@certifiq.pro');
  });

  it('should create, retrieve and delete a company in json-storage-db', async () => {
    const newCompany: Company = {
      id: testCompanyId,
      name: 'Empresa Teste Vitest',
      primaryColor: '#6366f1',
      logoUrl: 'https://placehold.co/100x50.png'
    };

    await db.saveCompany(newCompany);
    const companies = await db.getCompanies();
    const found = companies.find(c => c.id === testCompanyId);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Empresa Teste Vitest');
    expect(found?.primaryColor).toBe('#6366f1');

    await db.deleteCompany(testCompanyId);
    const companiesAfter = await db.getCompanies();
    expect(companiesAfter.find(c => c.id === testCompanyId)).toBeUndefined();
  });

  it('should create, retrieve and delete a student user', async () => {
    const newUser: User = {
      id: testUserId,
      name: 'Aluno Teste',
      email: `aluno_${testTimestamp}@test.com`,
      password: '321',
      cpf: '123.456.789-00',
      role: 'STUDENT',
      companyId: testCompanyId
    };

    await db.saveUser(newUser);
    const users = await db.getUsers();
    const found = users.find(u => u.id === testUserId);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Aluno Teste');
    expect(found?.cpf).toBe('123.456.789-00');

    await db.deleteUser(testUserId);
    const usersAfter = await db.getUsers();
    expect(usersAfter.find(u => u.id === testUserId)).toBeUndefined();
  });

  it('should create, retrieve and delete a course for a company', async () => {
    const newCourse: Course = {
      id: testCourseId,
      companyId: testCompanyId,
      title: 'Curso de Automação e Qualidade',
      hours: 40,
      syllabus: 'Módulo 1: Playwright\nMódulo 2: Vitest\nMódulo 3: Performance DB',
      templateStyle: 'modern'
    };

    await db.saveCourse(newCourse);
    const courses = await db.getCoursesByCompany(testCompanyId);
    const found = courses.find(c => c.id === testCourseId);
    expect(found).toBeDefined();
    expect(found?.title).toBe('Curso de Automação e Qualidade');
    expect(found?.hours).toBe(40);

    await db.deleteCourse(testCourseId);
    const coursesAfter = await db.getCoursesByCompany(testCompanyId);
    expect(coursesAfter.find(c => c.id === testCourseId)).toBeUndefined();
  });

  it('should create, retrieve and delete a signee for a company', async () => {
    const newSignee: Signee = {
      id: testSigneeId,
      companyId: testCompanyId,
      name: 'Eng. Carlos Andrade',
      role: 'Coordenador Técnico',
      councilType: 'CREA',
      councilNumber: '998877-SP',
      signatureImageUrl: 'https://placehold.co/150x50.png'
    };

    await db.saveSignee(newSignee);
    const signees = await db.getSigneesByCompany(testCompanyId);
    const found = signees.find(s => s.id === testSigneeId);
    expect(found).toBeDefined();
    expect(found?.councilType).toBe('CREA');
    expect(found?.councilNumber).toBe('998877-SP');

    await db.deleteSignee(testSigneeId);
    const signeesAfter = await db.getSigneesByCompany(testCompanyId);
    expect(signeesAfter.find(s => s.id === testSigneeId)).toBeUndefined();
  });

  it('should save and query issued certificates', async () => {
    const newCert: Certificate = {
      id: testCertId,
      studentId: testUserId,
      courseId: testCourseId,
      companyId: testCompanyId,
      signeeIds: [testSigneeId],
      issueDate: new Date().toISOString()
    };

    await db.saveCertificate(newCert);
    const certsByStudent = await db.getCertificates({ studentId: testUserId });
    expect(certsByStudent.some(c => c.id === testCertId)).toBe(true);

    const certsByCompany = await db.getCertificates({ companyId: testCompanyId });
    expect(certsByCompany.some(c => c.id === testCertId)).toBe(true);
  });
});
