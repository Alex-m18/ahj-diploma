export default class LoginForm {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.onLoginListener = null;
    this.onRegisterListener = null;
    this.onCloseListener = null;
    this.closeButtons = [];
  }

  init() {
    this.element = document.createElement('div');
    this.element.classList.add('modal-dialog', 'hidden');
    this.container.append(this.element);

    const dialog = document.createElement('div');
    dialog.classList.add('modal-dialog');
    this.element.append(dialog);

    const content = document.createElement('div');
    content.classList.add('modal-content');
    dialog.append(content);

    // Header
    const header = document.createElement('div');
    header.classList.add('modal-header');
    content.append(header);

    const title = document.createElement('h4');
    title.classList.add('modal-title');
    title.textContent = 'Добро пожаловать!';
    header.append(title);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.classList.add('close');
    closeBtn.title = 'Отмена';
    closeBtn.textContent = 'x';
    header.append(closeBtn);
    this.closeButtons.push(closeBtn);

    // Body
    const body = document.createElement('div');
    body.classList.add('modal-body');
    content.append(body);

    const form = document.createElement('form');
    form.id = 'login-form';
    body.append(form);

    const p1 = document.createElement('p');
    p1.textContent = 'Имя:';
    form.append(p1);

    this.inputLoginEl = document.createElement('input');
    this.inputLoginEl.type = 'text';
    this.inputLoginEl.placeholder = 'demo';
    this.inputLoginEl.required = true;
    form.append(this.inputLoginEl);

    const p2 = document.createElement('p');
    p2.textContent = 'Пароль:';
    form.append(p2);

    this.inputPasswordEl = document.createElement('input');
    this.inputPasswordEl.type = 'password';
    this.inputPasswordEl.placeholder = 'demo';
    this.inputPasswordEl.required = true;
    form.append(this.inputPasswordEl);

    // Footer
    const footer = document.createElement('div');
    footer.classList.add('modal-footer');
    content.append(footer);

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.classList.add('close');
    cancelBtn.textContent = 'Отмена';
    footer.append(cancelBtn);
    this.closeButtons.push(cancelBtn);

    const spaceEl = document.createElement('div');
    spaceEl.classList.add('space');
    footer.append(spaceEl);

    this.registerBtn = document.createElement('button');
    this.registerBtn.type = 'button';
    this.registerBtn.classList.add('btn-primary');
    this.registerBtn.textContent = 'Зарегистрироваться';
    footer.append(this.registerBtn);

    this.loginBtn = document.createElement('button');
    this.loginBtn.type = 'button';
    this.loginBtn.classList.add('btn-primary');
    this.loginBtn.textContent = 'Войти';
    footer.append(this.loginBtn);

    // Add event listeners
    this.inputLoginEl.addEventListener('keypress', this.onInput.bind(this));
    this.inputPasswordEl.addEventListener('keypress', this.onInput.bind(this));
    this.registerBtn.addEventListener('click', this.onRegister.bind(this));
    this.loginBtn.addEventListener('click', this.onLogin.bind(this));
    this.closeButtons.forEach((o) => o.addEventListener('click', this.onClose.bind(this)));
  }

  onInput(evt) {
    this.clearValidation();
    if (evt.code === 'Enter') this.loginBtn.dispatchEvent(new MouseEvent('click'));
  }

  clearValidation() {
    this.registerBtn.setCustomValidity = '';
    this.loginBtn.setCustomValidity = '';
  }

  show(onLogin, onRegister, onClose) {
    this.onLoginListener = onLogin;
    this.onRegisterListener = onRegister;
    this.onCloseListener = onClose;
    this.element.classList.remove('hidden');
    this.inputLoginEl.focus();
  }

  hide() {
    this.submitListener = null;
    this.closeListener = null;
    this.clear();
    this.element.classList.add('hidden');
  }

  get hidden() {
    return this.element.classList.contains('hidden');
  }

  clear() {
    this.inputLoginEl.value = '';
    this.inputPasswordEl.value = '';
  }

  fill(name) {
    this.inputLoginEl.value = name;
  }

  onRegister(/* event */) {
    // event.preventDefault();
    const data = {
      name: this.inputLoginEl.value,
      password: this.inputPasswordEl.value,
    };
    if (this.onRegister) this.onRegisterListener.call(null, data);
  }

  onLogin(/* event */) {
    // event.preventDefault();
    const data = {
      name: this.inputLoginEl.value,
      password: this.inputPasswordEl.value,
    };
    if (this.onLogin) this.onLoginListener.call(null, data);
  }

  onClose() {
    const data = {
      name: this.inputLoginEl.value,
      password: this.inputPasswordEl.value,
    };
    this.onCloseListener.call(null, data);
  }
}
