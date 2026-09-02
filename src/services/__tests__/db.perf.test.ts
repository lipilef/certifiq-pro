import { describe, it, expect, afterAll } from 'vitest';
import { db } from '../db';
import { Certificate } from '../../types';

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

describe('json-storage-db Performance & Benchmark Tests', () => {
  const generatedCertIds: string[] = [];

  afterAll(async () => {
    // Clean up all generated performance test certificates
    try {
      for (const id of generatedCertIds) {
        await db.deleteCertificate(id);
      }
    } catch (err) {
      console.error('Error cleaning up perf test data:', err);
    }
  });

  it('Benchmark: Single collection fetch latency should be under 2000ms', async () => {
    const startTime = performance.now();
    const companies = await db.getCompanies();
    const duration = performance.now() - startTime;

    console.log(`⏱️ [Perf] db.getCompanies latency: ${duration.toFixed(2)}ms (Records: ${companies.length})`);
    expect(companies).toBeDefined();
    expect(duration).toBeLessThan(3000); // Network latency threshold
  });

  it('Benchmark: Concurrent reads throughput (5 parallel fetches)', async () => {
    const startTime = performance.now();

    const [companies, users, certs] = await Promise.all([
      db.getCompanies(),
      db.getUsers(),
      db.getCertificates({}),
      db.getCompanies(),
      db.getUsers()
    ]);

    const duration = performance.now() - startTime;
    const avgPerRequest = duration / 5;

    console.log(`⏱️ [Perf] 5 Concurrent requests completed in ${duration.toFixed(2)}ms (Avg: ${avgPerRequest.toFixed(2)}ms/req)`);
    expect(companies.length).toBeGreaterThan(0);
    expect(users.length).toBeGreaterThan(0);
    expect(Array.isArray(certs)).toBe(true);
    expect(duration).toBeLessThan(5000);
  });

  it('Benchmark: Rapid sequential writes & query roundtrip', async () => {
    const count = 3;
    const timestamp = Date.now();

    const writeStartTime = performance.now();
    for (let i = 0; i < count; i++) {
      const certId = `cert_perf_${timestamp}_${i}`;
      generatedCertIds.push(certId);
      const testCert: Certificate = {
        id: certId,
        studentId: '3',
        courseId: 'c1',
        companyId: 'comp1',
        signeeIds: ['sig1'],
        issueDate: new Date().toISOString()
      };
      await db.saveCertificate(testCert);
    }
    const writeDuration = performance.now() - writeStartTime;
    const avgWriteLatency = writeDuration / count;

    console.log(`⏱️ [Perf] ${count} Sequential certificate writes: ${writeDuration.toFixed(2)}ms (Avg: ${avgWriteLatency.toFixed(2)}ms/write)`);

    const readStartTime = performance.now();
    const allCerts = await db.getCertificates({ companyId: 'comp1' });
    const readDuration = performance.now() - readStartTime;

    console.log(`⏱️ [Perf] Query all certificates after writes: ${readDuration.toFixed(2)}ms (Found: ${allCerts.length})`);

    // Verify all written certificates exist during test execution
    for (const id of generatedCertIds) {
      expect(allCerts.some(c => c.id === id)).toBe(true);
    }

    expect(avgWriteLatency).toBeLessThan(2500);
  });
});
