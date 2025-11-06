const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());
let todos = [];

app.get('/todos', (req, res) => {
  res.json(todos);
});


app.post('/todos', (req, res) => {
  const { task } = req.body;
  const newTodo = { id: todos.length + 1, task };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});


app.put('/todos/:id', (req, res) => {
  const { id } = req.params;
  const { task } = req.body;
  const todo = todos.find((t) => t.id === parseInt(id));

  if (todo) {
    todo.task = task;
    res.json(todo);
  } else {
    res.status(404).send('To-Do item not found');
  }
});


app.delete('/todos/:id', (req, res) => {
  const { id } = req.params;
  todos = todos.filter((t) => t.id !== parseInt(id));
  res.status(204).send();
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
