class ToDoBase {
  static baseUrl = 'https://todo.hillel.it/';
  static authorizationSuffix = 'auth/login';
  static todoSuffix = 'todo';
  static token;

  get AuthorizationUrl() {
    return `${ToDoBase.baseUrl}${ToDoBase.authorizationSuffix}`;
  }

  get ListUrl() {
    return `${ToDoBase.baseUrl}${ToDoBase.todoSuffix}`;
  }
}

class ToDoApp extends ToDoBase {
  constructor($authorizationCard, $taskCreationCard, $taskListCard) {
    super();
    this.authorizatonCard = new AuthorizationCard($authorizationCard);
    this.taskCreationCard = new TaskCreationCard($taskCreationCard);
    this.taskListCard = new TaskListCard($taskListCard);

    this.authorizatonCard.LogIn()
      .then(result => this.Token = result);
  }

  set Token(token) {
    ToDoBase.token = token;
    this.authorizatonCard.VisualState = this.authorizatonCard.VisualStateHidden;
    this.taskCreationCard.VisualState = this.taskCreationCard.VisualStateNormal;
    this.taskListCard.VisualState = this.taskListCard.VisualStateNormal;
    this.taskListCard.GetList();

    this.taskCreationCard.NewTaskEvent(task => {
      this.taskListCard.AppendTask(task)
      this.taskCreationCard.VisualState = this.taskCreationCard.VisualStateNormal;
    });
  }
}

class AuthorizationCard extends ToDoBase {
  constructor($authorizationCard) {
    super();
    this.$authorizationCard = $authorizationCard;
    this.$logInForm = this.$authorizationCard.querySelector('form');
    this.$preloader = this.$logInForm.querySelector('span.spinner-border');
  }

  get VisualStateNormal() {
    return 'normal';
  }

  get VisualStatePreload() {
    return 'preload';
  }

  get VisualStateHidden() {
    return 'hidden';
  }

  set VisualState(visualState) {
    switch (visualState) {

      case this.VisualStateNormal:
        this.$logInForm.reset();
        if (this.$authorizationCard.hidden)
          this.$authorizationCard.hidden = false;
        if (!this.$preloader.hidden)
          this.$preloader.hidden = true;
        break;

      case this.VisualStatePreload:
        if (this.$authorizationCard.hidden)
          this.$authorizationCard.hidden = false;
        if (this.$preloader.hidden)
          this.$preloader.hidden = false;
        break;

      case this.VisualStateHidden:
        if (!this.$authorizationCard.hidden)
          this.$authorizationCard.hidden = true;
        break;
    }
  }

  LogIn() {
    return new Promise(resolve => {
      this.$logInForm.addEventListener('submit', event => {
        event.preventDefault();
        this.VisualState = this.VisualStatePreload;

        const formData = new FormData(this.$logInForm);
        const userData = {
          value: '',
        };
        formData.forEach(input => userData.value += input);

        const options = {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        };
        return fetch(this.AuthorizationUrl, options)
          .then(result => result.json())
          .then(result => resolve(result['access_token']));
      })
    })
  }
}

class TaskCreationCard extends ToDoBase {
  constructor($taskCreationCard) {
    super();
    this.$taskCreationCard = $taskCreationCard;
    this.$taskCreationForm = this.$taskCreationCard.querySelector('form');
    this.$preloader = this.$taskCreationForm.querySelector('span.spinner-border');
  }

  get VisualStateNormal() {
    return 'normal';
  }

  get VisualStatePreload() {
    return 'preload';
  }

  get VisualStateHidden() {
    return 'hidden';
  }

  set VisualState(visualState) {
    switch (visualState) {
      case this.VisualStateNormal:
        if (this.$taskCreationCard.hidden) {
          this.$taskCreationCard.hidden = false;
          this.$taskCreationForm.reset();
        }
        if (!this.$preloader.hidden)
          this.$preloader.hidden = true;
        break;

      case this.VisualStatePreload:
        if (this.$taskCreationCard.hidden)
          this.$taskCreationCard.hidden = false;
        if (this.$preloader)
          this.$preloader.hidden = false;
        break;

      case this.VisualStateHidden:
        if (!this.$taskCreationCard.hidden)
          this.$taskCreationCard.hidden = true;
        break;
    }
  }

  NewTaskEvent(callBack) {
    this.$taskCreationForm.addEventListener('submit', event => {
      event.preventDefault();
      this.VisualState = this.VisualStatePreload;

      const formData = {
        value: this.$taskCreationForm.querySelector('[name="value"]').value,
        priority: this.$taskCreationForm.querySelector('[name="priority"]').valueAsNumber,
      };
      const option = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ToDoBase.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      };

      fetch(this.ListUrl, option)
        .then(result => result.json())
        .then(result => callBack(result));
    })
  }
}

class TaskListCard extends ToDoBase {
  constructor($taskListCard) {
    super();
    this.$taskListCard = $taskListCard;
    this.$ul = this.$taskListCard.querySelector('ul');
    this.taskList = [];

    this.$ul.addEventListener('deleteTask', ({id}) => {
      const index = this.taskList.findIndex(task => task.id = id);
      this.taskList.slice(index, 1);
    })
  }

  get VisualStateNormal() {
    return 'normal';
  }

  get VisualStateHidden() {
    return 'hidden';
  }

  set VisualState(visualState) {
    switch (visualState) {
      case this.VisualStateNormal:
        if (this.$taskListCard.hidden)
          this.$taskListCard.hidden = false;
        break;

      case this.VisualStateHidden:
        if (!this.$taskListCard.hidden)
          this.$taskListCard.hidden = true;
        break;
    }
  }

  GetList() {
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${ToDoBase.token}`,
      },
    };

    fetch(this.ListUrl, options)
      .then(result => result.json())
      .then(result => {
        if (result.length > 0) {
          result.forEach(task => {
            this.taskList.push(new TaskElement(task));
          });
        }
        this.$ul.append(...(this.taskList
          .sort((a, b) => {
            if (a.checked !== b.checked)
              return b.checked - a.checked;
            return b.id - a.id;
          })
          .map(task => task.$taskNode)));
      });
  }

  AppendTask(task) {
    const taskElement = new TaskElement(task);
    this.taskList.push(taskElement);
    this.$ul.prepend(taskElement.$taskNode);
  }
}

class TaskElement extends ToDoBase {
  constructor({_id: id, priority, value, checked, token, url}) {
    super();

    this.id = id;
    this.priority = priority;
    this.value = value;
    this.checked = checked;

    this.$taskNode = document.createElement('li');
    this.$taskNode.className = 'list-group-item';
    this.$taskNode.innerHTML = this.SetTaskInner();

    this.$taskNode.addEventListener('click', event => {
      if (event.target.nodeName !== 'BUTTON') return;

      const $btn = event.target;
      switch ($btn.dataset.action) {
        case 'toggle':
          this.ChangeStatus();
          break;
        case 'delete':
          this.DeleteTask();
          break;
      }
    })
  }

  SetTaskInner() {
    return this.checked
      ? `
          <div class='row'>
            <h2 class="col-1 align-self-center"><del>${this.priority}</del></h2>
            <p class="col-11 col-lg-8"><del>${this.value}</del></p>
            <div class="col-12 col-lg-3">
                <button class="btn btn-block btn-secondary" data-action="toggle">Продолжить</button>
                <button class="btn btn-block btn-danger" data-action="delete">Удалить</button>
            </div>
          </div>
        
      `
      : `
          <div class='row'>
            <h2 class="col-1 align-self-center">${this.priority}</h2>
            <p class="col-11 col-lg-8">${this.value}</p>
            <div class="col-12 col-lg-3">
                <button class="btn btn-block btn-success" data-action="toggle">Завершить</button>
                <button class="btn btn-block btn-danger" data-action="delete">Удалить</button>
            </div>
          </div>
      `;
  }

  ChangeStatus() {
    const option = {
      method: 'PUT',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${ToDoBase.token}`,
      }
    }

    fetch(`${this.ListUrl}/${this.id}/toggle`, option)
      .then(result => result.json())
      .then(({checked}) => {
        this.checked = checked;

        this.$taskNode.innerHTML = this.SetTaskInner();
      })
  }

  DeleteTask() {
    const option = {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${ToDoBase.token}`,
      }
    }

    fetch(`${this.ListUrl}/${this.id}`, option)
      .then(() => {
        this.$taskNode.dispatchEvent(new CustomEvent('deleteTask', {id: this.id}));
        this.$taskNode.remove();
      });
  }
}

//General
const $loginFormHost = document.querySelector('#loginFormHost');
const $taskCreationCard = document.querySelector('#taskCreationCard');
const $taskListCard = document.querySelector('#taskListCard');

const toDoApp = new ToDoApp($loginFormHost, $taskCreationCard, $taskListCard);
