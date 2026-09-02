import { test, expect } from '@playwright/test';

test.describe('Responsiveness & Layout Tests across Viewports', () => {

  test('Login Screen fits viewport with no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify main brand heading and form elements
    await expect(page.locator('text=CertifiqPRO').first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Entrar na Plataforma")')).toBeVisible();

    // Verify "Validar um Certificado" button is accessible
    const validateBtn = page.locator('button:has-text("Validar um Certificado")');
    await expect(validateBtn).toBeVisible();

    // Verify viewport horizontal scroll width does not exceed window
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // Tolerates subpixel rounding
  });

  test('Public Validation Screen and Deep-linking responsiveness', async ({ page }) => {
    // Navigate with deep-link query parameter
    await page.goto('/?validar=test_invalid_code_123');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Validação Pública')).toBeVisible();
    await expect(page.locator('button:has-text("Voltar ao Login")')).toBeVisible();

    // Verify validation result renders
    await expect(page.locator('text=Certificado Inválido')).toBeVisible();

    // Test Back button
    await page.click('button:has-text("Voltar ao Login")');
    await expect(page.locator('text=Entrar na Plataforma')).toBeVisible();
  });

  test('Super Admin Dashboard responsive layout and table scrolling', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'super@certifiq.pro');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button:has-text("Entrar na Plataforma")');

    // Check dashboard loaded
    await expect(page.locator('text=Gestão de Clientes (Tenants)')).toBeVisible();
    await expect(page.locator('text=Olá, Super Administrador')).toBeVisible();

    // Verify table container has overflow handling
    const tableContainer = page.locator('.overflow-x-auto').first();
    await expect(tableContainer).toBeVisible();

    // Verify "+ Nova Empresa" button
    const newCompBtn = page.locator('button:has-text("+ Nova Empresa")');
    await expect(newCompBtn).toBeVisible();
    await newCompBtn.click();
    await expect(page.locator('text=Cadastrar Nova Empresa')).toBeVisible();

    // Logout
    await page.click('button:has-text("Sair")');
    await expect(page.locator('text=Entrar na Plataforma')).toBeVisible();
  });

  test('Company Admin Dashboard tabs and navigation responsiveness', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@tech.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button:has-text("Entrar na Plataforma")');

    await expect(page.locator('text=Olá, Admin Tech Educação')).toBeVisible();

    // Test switching tabs
    const tabs = ['Assinantes', 'Cursos', 'Alunos', 'Emitir', 'Emitidos', 'White-label'];
    for (const tab of tabs) {
      const tabButton = page.locator(`button:has-text("${tab}")`).first();
      await expect(tabButton).toBeVisible();
      await tabButton.click();
      await page.waitForTimeout(100);
    }

    // Logout
    await page.click('button:has-text("Sair")');
    await expect(page.locator('text=Entrar na Plataforma')).toBeVisible();
  });

  test('Student Dashboard & Certificate preview container responsiveness', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'joao@aluno.com');
    await page.fill('input[type="password"]', '123');
    await page.click('button:has-text("Entrar na Plataforma")');

    await expect(page.locator('text=Olá, João Silva')).toBeVisible();
    await expect(page.locator('button:has-text("Meus Certificados")')).toBeVisible();
    await expect(page.locator('button:has-text("Meu Perfil")')).toBeVisible();

    // Test Profile tab
    await page.click('button:has-text("Meu Perfil")');
    await expect(page.locator('text=Meus Dados')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();

    // Return to certificates tab
    await page.click('button:has-text("Meus Certificados")');

    // Logout
    await page.click('button:has-text("Sair")');
    await expect(page.locator('text=Entrar na Plataforma')).toBeVisible();
  });
});
