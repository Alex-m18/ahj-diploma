import { coordinatesFromStr, CoordinatesFromStrError } from './coordinatesFromString';

export default class CoordinatesForm {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.submitListener = null;
    this.closeListener = null;
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
    title.textContent = 'Что-то пошло не так';
    header.append(title);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.classList.add('close');
    closeBtn.title = 'Не оставлять координаты';
    closeBtn.textContent = 'x';
    header.append(closeBtn);
    this.closeButtons.push(closeBtn);

    // Body
    const body = document.createElement('div');
    body.classList.add('modal-body');
    content.append(body);

    const form = document.createElement('form');
    form.id = 'coordinates-form';
    body.append(form);

    const p1 = document.createElement('p');
    p1.textContent = 'К сожалению, нам не удалось определить ваше местоположение, пожалуйста, дайте разрешение на использование геолокации, либо введите координаты вручную.';
    form.append(p1);

    const p2 = document.createElement('p');
    p2.textContent = 'Широта и долгота через запятую:';
    form.append(p2);

    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.placeholder = '12.345678, 23.456789';
    this.inputEl.required = true;
    form.append(this.inputEl);

    // Footer
    const footer = document.createElement('div');
    footer.classList.add('modal-footer');
    content.append(footer);

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.classList.add('close');
    cancelBtn.textContent = 'Не оставлять координаты';
    footer.append(cancelBtn);
    this.closeButtons.push(cancelBtn);

    const spaceEl = document.createElement('div');
    spaceEl.classList.add('space');
    footer.append(spaceEl);

    const okBtn = document.createElement('button');
    okBtn.type = 'submit';
    okBtn.classList.add('btn-primary');
    okBtn.textContent = 'OK';
    // okBtn.form = 'coordinates-form';
    footer.append(okBtn);

    // Add event listeners
    this.inputEl.addEventListener('input', this.validate.bind(this));
    this.element.addEventListener('submit', this.onSubmit.bind(this));
    this.closeButtons.forEach((o) => o.addEventListener('click', this.onClose.bind(this)));
  }

  validate() {
    if (this.inputEl.value === '') return;

    try {
      coordinatesFromStr(this.inputEl.value);
    } catch (e) {
      switch (e.code) {
        default:
        case CoordinatesFromStrError.WRONG_FORMAT:
          this.inputEl.setCustomValidity('Неверный формат. Введите долготу и широту через запятую');
          break;
        case CoordinatesFromStrError.WRONG_LATITUDE:
          this.inputEl.setCustomValidity('Широта должна быть в пределах от -90 до 90');
          break;
        case CoordinatesFromStrError.WRONG_LONGITUDE:
          this.inputEl.setCustomValidity('Долгота должна быть в пределах от -180 до 180');
          break;
      }
      return;
    }

    this.inputEl.setCustomValidity('');
  }

  show(submit, close) {
    this.submitListener = submit;
    this.closeListener = close;
    this.element.classList.remove('hidden');
    this.inputEl.focus();
  }

  hide() {
    this.submitListener = null;
    this.closeListener = null;
    this.clear();
    this.element.classList.add('hidden');
  }

  clear() {
    this.inputEl.value = '';
  }

  fill(name) {
    this.inputEl.value = name;
  }

  onSubmit(event) {
    event.preventDefault();
    if (this.inputEl.checkValidity() && this.submitListener) {
      this.submitListener.call(null, coordinatesFromStr(this.inputEl.value));
    }
  }

  onClose() {
    const data = {
      name: this.inputEl.value,
    };
    this.closeListener.call(null, data);
  }
}
