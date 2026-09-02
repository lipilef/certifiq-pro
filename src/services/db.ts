import { User, Company, Signee, Course, Certificate } from '../types';

const BASE_URL = import.meta.env.VITE_JSON_DB_URL || 'https://db.dunhas.com/api';
const API_KEY = import.meta.env.VITE_JSON_DB_API_KEY || '1b4a19fdc1eda3f481543b0f25b01ab428e0f6467ad7c9c1';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-api-key': API_KEY
});

// Mock initial seed data
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
    signatureImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Assinatura_falsa.png'
  }
];

const MOCK_COURSES: Course[] = [
  { 
    id: 'c1', companyId: 'comp1', title: 'Desenvolvimento Web Fullstack', 
    hours: 120, syllabus: '1. HTML5 e CSS3\n2. JavaScript ES6+\n3. React e TypeScript\n4. Node.js e APIs REST', templateStyle: 'modern' 
  }
];

// HTTP Helper functions for json-storage-db
async function fetchCollection<T>(collection: string): Promise<T[]> {
  try {
    const res = await fetch(`${BASE_URL}/${collection}?limit=100&offset=0`, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!res.ok) {
      console.warn(`[json-storage-db] Error fetching ${collection}: ${res.statusText}. Using localStorage cache.`);
      return JSON.parse(localStorage.getItem(collection) || '[]');
    }
    const json = await res.json();
    const items: T[] = (json.results || []).map((r: { id: string; data: T }) => {
      if (r.data && typeof r.data === 'object') {
        return { id: r.id, ...r.data };
      }
      return r.data;
    });
    // Sync to localStorage as offline cache
    localStorage.setItem(collection, JSON.stringify(items));
    return items;
  } catch (err) {
    console.warn(`[json-storage-db] Network error fetching ${collection}:`, err);
    return JSON.parse(localStorage.getItem(collection) || '[]');
  }
}

async function upsertDoc<T extends { id: string }>(collection: string, doc: T): Promise<void> {
  // Update local cache first
  const current: T[] = JSON.parse(localStorage.getItem(collection) || '[]');
  const idx = current.findIndex(item => item.id === doc.id);
  if (idx >= 0) current[idx] = doc;
  else current.push(doc);
  localStorage.setItem(collection, JSON.stringify(current));

  try {
    const res = await fetch(`${BASE_URL}/${collection}/${doc.id}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(doc)
    });
    if (!res.ok) {
      console.error(`[json-storage-db] Failed to save document ${doc.id} in ${collection}:`, res.statusText);
    }
  } catch (err) {
    console.error(`[json-storage-db] Network error saving document in ${collection}:`, err);
  }
}

async function deleteDoc(collection: string, id: string): Promise<void> {
  // Update local cache
  const current: Array<{ id: string }> = JSON.parse(localStorage.getItem(collection) || '[]');
  localStorage.setItem(collection, JSON.stringify(current.filter(item => item.id !== id)));

  try {
    const res = await fetch(`${BASE_URL}/${collection}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      console.error(`[json-storage-db] Failed to delete document ${id} from ${collection}:`, res.statusText);
    }
  } catch (err) {
    console.error(`[json-storage-db] Network error deleting document from ${collection}:`, err);
  }
}

// Initialize DB with seed data if remote database is empty
export const initDB = async (): Promise<void> => {
  try {
    const users = await fetchCollection<User>('certifiq_users');
    if (users.length === 0) {
      console.log('[json-storage-db] Seeding initial database data...');
      for (const comp of MOCK_COMPANIES) await upsertDoc('certifiq_companies', comp);
      for (const usr of MOCK_USERS) await upsertDoc('certifiq_users', usr);
      for (const sig of MOCK_SIGNEES) await upsertDoc('certifiq_signees', sig);
      for (const crs of MOCK_COURSES) await upsertDoc('certifiq_courses', crs);
    }
  } catch (err) {
    console.error('[json-storage-db] Error initializing database:', err);
  }
};

// Generic DB Service matching cloud provider signature
export const db = {
  async getCompanies(): Promise<Company[]> {
    return fetchCollection<Company>('certifiq_companies');
  },
  async saveCompany(company: Company): Promise<void> {
    return upsertDoc<Company>('certifiq_companies', company);
  },
  async deleteCompany(id: string): Promise<void> {
    return deleteDoc('certifiq_companies', id);
  },
  
  async getUsers(): Promise<User[]> {
    return fetchCollection<User>('certifiq_users');
  },
  async saveUser(user: User): Promise<void> {
    return upsertDoc<User>('certifiq_users', user);
  },
  async deleteUser(id: string): Promise<void> {
    return deleteDoc('certifiq_users', id);
  },
  
  async getSigneesByCompany(companyId: string): Promise<Signee[]> {
    const all = await fetchCollection<Signee>('certifiq_signees');
    return all.filter(s => s.companyId === companyId);
  },
  async saveSignee(signee: Signee): Promise<void> {
    return upsertDoc<Signee>('certifiq_signees', signee);
  },
  async deleteSignee(id: string): Promise<void> {
    return deleteDoc('certifiq_signees', id);
  },
  
  async getCoursesByCompany(companyId: string): Promise<Course[]> {
    const all = await fetchCollection<Course>('certifiq_courses');
    return all.filter(c => c.companyId === companyId);
  },
  async saveCourse(course: Course): Promise<void> {
    return upsertDoc<Course>('certifiq_courses', course);
  },
  async deleteCourse(id: string): Promise<void> {
    return deleteDoc('certifiq_courses', id);
  },
  
  async getCertificates(filter: { studentId?: string; companyId?: string }): Promise<Certificate[]> {
    const all = await fetchCollection<Certificate>('certifiq_certificates');
    return all.filter(c => {
      let match = true;
      if (filter.studentId && c.studentId !== filter.studentId) match = false;
      if (filter.companyId && c.companyId !== filter.companyId) match = false;
      return match;
    });
  },
  async saveCertificate(cert: Certificate): Promise<void> {
    return upsertDoc<Certificate>('certifiq_certificates', cert);
  }
};
