export class LoginPage {
    constructor(page) {
        this.page = page;
        this.userNameInput = '#username';
        this.passwordInput = '#password';
        this.loginButton = '#login-btn';
    }

    async navigate() {
        await this.page.goto('http://localhost:3000');
    }

    async login(username, password) {
        await this.page.fill(this.userNameInput, username);
        await this.page.fill(this.passwordInput, password);
        await this.page.click(this.loginButton);
    }

    async getScreenshot(name) {
        await this.page.screenshot({ path: `./screenshots/${name}.png` });
    }

    async isLoginFormVisible() {
        return await this.page.isVisible('#login-section');
    }

    async isErrorMessageVisible() {
        return await this.page.isVisible('#login-error');
    }

    async getErrorMessage() {
        return await this.page.textContent('#login-error');
    }
}