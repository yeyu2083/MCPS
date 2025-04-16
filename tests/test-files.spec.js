import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import path from 'path';

test.describe('File Upload and Management', () => {
    let loginPage;
    let dashboardPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);
        
        // Login before each test
        await loginPage.navigate();
        await loginPage.login('admin', 'admin123');
        await dashboardPage.waitForLoad();
    });

    test('should upload a PNG file successfully', async ({ page }) => {
        const testFile = path.join(process.cwd(), 'screenshots', '1-inicio.png');
        const fileName = '1-inicio.png';
        
        // Upload file
        await dashboardPage.uploadFile(testFile);
        await dashboardPage.waitForUploadComplete();
        
        // Verify file was uploaded
        expect(await dashboardPage.isFileVisible(fileName)).toBeTruthy();
        
        // Check file information
        const fileInfo = await dashboardPage.getFileInfo(fileName);
        expect(fileInfo.exists).toBeTruthy();
        expect(fileInfo.info).toContain('PNG');
    });

    test('should delete an uploaded file', async ({ page }) => {
        const testFile = path.join(process.cwd(), 'screenshots', '1-inicio.png');
        const fileName = '1-inicio.png';
        
        // Upload file first
        await dashboardPage.uploadFile(testFile);
        await dashboardPage.waitForUploadComplete();
        
        // Verify file exists
        expect(await dashboardPage.isFileVisible(fileName)).toBeTruthy();
        
        // Delete file
        await dashboardPage.deleteFile(fileName);
        
        // Verify file was deleted
        expect(await dashboardPage.isFileVisible(fileName)).toBeFalsy();
    });

    test('should show multiple uploaded files', async ({ page }) => {
        const files = [
            path.join(process.cwd(), 'screenshots', '1-inicio.png'),
            path.join(process.cwd(), 'screenshots', '2-formulario.png')
        ];
        
        // Upload multiple files
        for (const file of files) {
            await dashboardPage.uploadFile(file);
            await dashboardPage.waitForUploadComplete();
        }
        
        // Verify number of unique uploaded files
        const uniqueFileCount = await dashboardPage.getUploadedFiles();
        expect(uniqueFileCount).toBe(files.length);
    });

    test('should maintain uploaded files after logout and login', async ({ page }) => {
        const testFile = path.join(process.cwd(), 'screenshots', '1-inicio.png');
        const fileName = '1-inicio.png';
        
        // Upload file
        await dashboardPage.uploadFile(testFile);
        await dashboardPage.waitForUploadComplete();
        
        // Logout
        await dashboardPage.logout();
        
        // Login again
        await loginPage.login('admin', 'admin123');
        await dashboardPage.waitForLoad();
        
        // Verify file still exists
        expect(await dashboardPage.isFileVisible(fileName)).toBeTruthy();
    });
});