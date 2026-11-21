const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Todo = require('../models/Todo');

const dataDir = path.join(__dirname, '..', 'data');
const dataFilePath = path.join(dataDir, 'todos.json');

// Initial default todos so the app is colorful and ready immediately
const defaultTodos = [
  {
    _id: 'default-1',
    title: '✨ Welcome to your Colorful Todo App!',
    description: 'Hover over cards to see smooth animations, toggle completion, or delete tasks.',
    priority: 'high',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'default-2',
    title: '🎨 Modern UI & Color Themes',
    description: 'Clean Tailwind gradients, responsive layout, and instant interactive filters.',
    priority: 'medium',
    completed: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'default-3',
    title: '☁️ MongoDB Atlas Cloud Sync',
    description: 'Network Access me IP whitelist karne par MongoDB auto-connect ho jayega.',
    priority: 'low',
    completed: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

// Ensure data folder and todos.json exist
function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify(defaultTodos, null, 2), 'utf-8');
  }
}

function readLocalTodos() {
  try {
    ensureDataFile();
    const content = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('Error reading local todos:', err.message);
    return [];
  }
}

function writeLocalTodos(todos) {
  try {
    ensureDataFile();
    fs.writeFileSync(dataFilePath, JSON.stringify(todos, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local todos:', err.message);
  }
}

function isMongoConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

const todoStore = {
  isMongoConnected,

  async getAll() {
    if (isMongoConnected()) {
      try {
        return await Todo.find().sort({ createdAt: -1 });
      } catch (err) {
        console.warn('Mongo fetch failed, falling back to local file:', err.message);
      }
    }
    const local = readLocalTodos();
    return local.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async create({ title, description, priority = 'medium' }) {
    if (isMongoConnected()) {
      try {
        return await Todo.create({ title, description, priority });
      } catch (err) {
        console.warn('Mongo create failed, saving locally:', err.message);
      }
    }
    const local = readLocalTodos();
    const newTodo = {
      _id: 'local-' + Date.now(),
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      completed: false,
      createdAt: new Date().toISOString(),
    };
    local.unshift(newTodo);
    writeLocalTodos(local);
    return newTodo;
  },

  async toggle(id) {
    if (isMongoConnected()) {
      try {
        const todo = await Todo.findById(id);
        if (todo) {
          todo.completed = !todo.completed;
          await todo.save();
          return todo;
        }
      } catch (err) {
        console.warn('Mongo toggle failed, checking local:', err.message);
      }
    }
    const local = readLocalTodos();
    const todo = local.find((t) => String(t._id) === String(id));
    if (todo) {
      todo.completed = !todo.completed;
      writeLocalTodos(local);
      return todo;
    }
    return null;
  },

  async delete(id) {
    if (isMongoConnected()) {
      try {
        const result = await Todo.findByIdAndDelete(id);
        if (result) return true;
      } catch (err) {
        console.warn('Mongo delete failed, checking local:', err.message);
      }
    }
    let local = readLocalTodos();
    local = local.filter((t) => String(t._id) !== String(id));
    writeLocalTodos(local);
    return true;
  },
};

module.exports = todoStore;
