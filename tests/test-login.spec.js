import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import fs from 'fs';

test.beforeAll(async () => {
    if (!fs.existsSync('./screenshots')) {
        fs.mkdirSync('./screenshots');
    }
});

test('should complete full login flow successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    console.log('Navegando a la página de login...');
    await loginPage.navigate();
    await page.waitForTimeout(2000); // Espera 2 segundos
    await loginPage.getScreenshot('1-inicio');
    
    console.log('Completando formulario de login...');
    await loginPage.login('admin', 'admin123');
    await page.waitForTimeout(2000); // Espera 2 segundos
    await loginPage.getScreenshot('2-formulario');
    
    console.log('Verificando acceso al dashboard...');
    await dashboardPage.waitForLoad();
    await page.waitForTimeout(2000); // Espera 2 segundos
    await dashboardPage.getScreenshot('3-dashboard');
    
    const title = await dashboardPage.getTitle();
    await expect(title).toContain('Dashboard');
    
    const ticketsCount = await dashboardPage.getTicketsCount();
    await expect(ticketsCount).toBeGreaterThan(0);
    console.log(`Tickets encontrados: ${ticketsCount}`);
    
    console.log('Cerrando sesión...');
    await page.waitForTimeout(2000); // Espera 2 segundos
    await dashboardPage.logout();
    
    const isLoginVisible = await loginPage.isLoginFormVisible();
    await expect(isLoginVisible).toBeTruthy();
    await page.waitForTimeout(1000); // Espera 1 segundo
    await loginPage.getScreenshot('4-logout');
    
    console.log('✅ Flujo de prueba completado');
});

test('should show error message with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    console.log('Navegando a la página de login...');
    await loginPage.navigate();
    
    console.log('Intentando login con credenciales inválidas...');
    await loginPage.login('usuario_invalido', 'password123');
    await loginPage.getScreenshot('invalid-login');
    
    const isErrorVisible = await loginPage.isErrorMessageVisible();
    await expect(isErrorVisible).toBeTruthy();
    
    const errorMessage = await loginPage.getErrorMessage();
    await expect(errorMessage).toContain('Credenciales incorrectas');
    
    // Verificar que seguimos en la página de login
    const isLoginVisible = await loginPage.isLoginFormVisible();
    await expect(isLoginVisible).toBeTruthy();
    
    console.log('✅ Test de credenciales inválidas completado');
});