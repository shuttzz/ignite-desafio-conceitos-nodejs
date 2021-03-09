const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  
  const userFind = users.find(user => user.username === username);
  
  if (!userFind) {
    return response.status(404).json({ error: 'User not exists!' });
  }
  
  request.user = userFind;
  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  let userFind;
  
  users.forEach(user => {
    if (user.username === username) {
      userFind = user;
    }
  });
  
  if (userFind) {
    return response.status(400).json({ error: 'User already exists! '});
  }
  
  const userNew = {
    id: uuidv4(),
    name,
    username,
    todos: []
  };
  
  users.push(userNew);
  
  return response.status(201).json(userNew);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  
  return response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;
  
  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  user.todos.push(newTodo);
  
  users.forEach(userItem => {
    if (userItem.username === user.username) {
      userItem.todos = user.todos
    }
  });
  
  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { id } = request.params;
  const { user } = request;
  
  let modifiedTodo;

  user.todos.forEach(todo => {
    if (todo.id === id) {
      todo.title = title;
      todo.deadline = new Date(deadline);
      modifiedTodo = todo;
    }
  });
  
  if (!modifiedTodo) {
    return response.status(404).json({ error: 'Not found an todo with id passade!' });
  }

  users.forEach(userItem => {
    if (userItem.username === user.username) {
      userItem.todos = user.todos
    }
  });
  
  return response.json(modifiedTodo).status(200);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  let todoFind;

  user.todos.forEach(todoItem => {
    if  (todoItem.id === id) {
      todoFind = todoItem;
    }
  });
  
  if (!todoFind) {
    return response.status(404).json({ error: 'Not found an todo with id passade!' });
  }
  
  todoFind.done = true;
  const indexTodo = user.todos.indexOf(todoFind);
  
  user.todos.splice(indexTodo, 1, todoFind);
  
  let userIndex = users.indexOf(user);

  users.splice(userIndex, 1, user);
  
  return response.json(todoFind);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  let todoFind;
  user.todos.forEach(todo => {
    if (todo.id === id) {
      todoFind = todo;
    }
  });
  
  if (!todoFind) {
    return response.status(404).json({ error: 'Not found an todo with id passade!' });
  }
  
  const indexTodo = user.todos.indexOf(todoFind);
  
  user.todos.splice(indexTodo, 1);

  users.forEach(userItem => {
    if (userItem.username === user.username) {
      userItem.todos = user.todos
    }
  });
  
  return response.status(204).send();
});

module.exports = app;