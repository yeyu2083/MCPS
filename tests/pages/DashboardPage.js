export class DashboardPage {
    constructor(page) {
        this.page = page;
        this.dashboardContainer = '#dashboard';
        this.welcomeTitle = 'h1:has-text("Bienvenido al Dashboard")';
        this.tickets = '.ticket';
        this.logoutButton = '#logout-btn';
        this.fileUploadInput = '#file-upload';
        this.uploadButton = '.upload-button';
        this.documentsList = '.documents-list';
        this.progressContainer = '.progress-container';
        this.dropZone = '#drop-zone';
    }

    async waitForLoad() {
        await this.page.waitForSelector(this.dashboardContainer);
        await this.page.waitForSelector(this.welcomeTitle);
    }

    async getTitle() {
        return await this.page.title();
    }

    async getTicketsCount() {
        return await this.page.locator(this.tickets).count();
    }

    async clickTicket(number) {
        await this.page.click(`h3:has-text("Ticket #${number}")`);
    }

    async logout() {
        await this.page.click(this.logoutButton);
    }

    async getScreenshot(name) {
        await this.page.screenshot({ path: `./screenshots/${name}.png` });
    }

    async uploadFile(filePath) {
        const input = await this.page.locator(this.fileUploadInput);
        await input.setInputFiles(filePath);
    }

    async waitForUploadComplete() {
        await this.page.waitForSelector(`${this.progressContainer}.active`, { state: 'attached' });
        await this.page.waitForSelector(`${this.progressContainer}.active`, { state: 'detached' });
    }

    async getUploadedFiles() {
        await this.page.waitForSelector('.document-item');
        
        const files = await this.page.locator('.document-item').all();
        const uniqueFiles = new Set();
        
        for (const file of files) {
            const filename = await file.locator('.document-info strong').textContent();
            // Solo contar archivos que empiecen con número y guión (1-, 2-, etc.)
            if (filename.match(/^\d+-/)) {
                // Extraer el nombre base sin el timestamp
                uniqueFiles.add(filename);
            }
        }
        
        return uniqueFiles.size;
    }

    async deleteFile(fileName) {
        // Configurar el manejador del diálogo antes de hacer clic
        this.page.on('dialog', async dialog => {
            // Aceptar el diálogo de confirmación
            await dialog.accept();
        });

        // Buscar y hacer clic en el botón de eliminar del archivo específico
        const deleteButton = await this.page.locator(`.document-item:has-text("${fileName}") .delete-btn`).first();
        await deleteButton.click();
        
        // Esperar a que el archivo desaparezca del DOM
        await this.page.waitForFunction(
            (fname) => {
                const items = document.querySelectorAll('.document-item');
                return Array.from(items).every(item => {
                    const nameEl = item.querySelector('.document-info strong');
                    return !nameEl.textContent.includes(fname);
                });
            },
            fileName,
            { timeout: 5000 }
        );
    }

    async isFileVisible(fileName) {
        // Esperar a que la lista se actualice
        await this.page.waitForTimeout(500);
        
        const files = await this.page.locator('.document-item').all();
        for (const file of files) {
            const name = await file.locator('.document-info strong').textContent();
            if (name.includes(fileName)) {
                return true;
            }
        }
        return false;
    }

    async getFileInfo(fileName) {
        const baseFileName = fileName.includes('-') ? fileName.split('-')[1] : fileName;
        try {
            const fileItem = await this.page.locator(`.document-item:has-text("${baseFileName}")`).first();
            const text = await fileItem.innerText();
            return {
                name: fileName,
                exists: true,
                info: text
            };
        } catch {
            return {
                name: fileName,
                exists: false,
                info: ''
            };
        }
    }
}