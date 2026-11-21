require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const todoStore = require('./services/todoStore');

const app = express();
const PORT = process.env.PORT || 5004;

// Attempt MongoDB Connection asynchronously (won't block server)
connectDB();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// GET / - Redirect to /todos
app.get('/', (req, res) => {
  res.redirect('/todos');
});

// GET /todos - Fetch and render todos page
app.get('/todos', async (req, res) => {
  try {
    const todos = await todoStore.getAll();
    const isMongo = todoStore.isMongoConnected();

    const stats = {
      total: todos.length,
      completed: todos.filter((t) => t.completed).length,
      pending: todos.filter((t) => !t.completed).length,
    };

    res.render('todos', {
      todos,
      stats,
      isMongo,
      error: null,
    });
  } catch (error) {
    console.error('Error fetching todos:', error.message);
    res.render('todos', {
      todos: [],
      stats: { total: 0, completed: 0, pending: 0 },
      isMongo: false,
      error: 'Data load karne me dikkat hui: ' + error.message,
    });
  }
});

// POST /todos - Add a new todo
app.post('/todos', async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    if (title && title.trim()) {
      await todoStore.create({
        title: title.trim(),
        description: description ? description.trim() : '',
        priority: priority || 'medium',
      });
    }
    res.redirect('/todos');
  } catch (error) {
    console.error('Error adding todo:', error.message);
    res.redirect('/todos');
  }
});

// POST /todos/:id/toggle - Toggle completed status
app.post('/todos/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    await todoStore.toggle(id);
    res.redirect('/todos');
  } catch (error) {
    console.error('Error toggling todo:', error.message);
    res.redirect('/todos');
  }
});

// POST /todos/:id/delete - Delete a todo
app.post('/todos/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;
    await todoStore.delete(id);
    res.redirect('/todos');
  } catch (error) {
    console.error('Error deleting todo:', error.message);
    res.redirect('/todos');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server successfully chal raha hai: http://localhost:${PORT}`);
});
