<template>
  <div class="container mt-5">
    <h2>Dashboard</h2>
    <div class="mb-3">
      <h5>Welcome, {{ userEmail }}</h5>
      <button class="btn btn-secondary btn-sm" @click="logout">Logout</button>
    </div>

    <div class="mb-4">
      <h5>Motivational Quote</h5>
      <blockquote class="blockquote">
        <p>{{ quote }}</p>
        <footer class="blockquote-footer">{{ author }}</footer>
      </blockquote>
    </div>

    <div>
      <h5>Tasks</h5>
      <div class="mb-3">
        <button class="btn btn-outline-primary me-2" :class="{ active: filter === 'all' }" @click="filter = 'all'">All</button>
        <button class="btn btn-outline-primary me-2" :class="{ active: filter === 'pending' }" @click="filter = 'pending'">Pending</button>
        <button class="btn btn-outline-primary" :class="{ active: filter === 'completed' }" @click="filter = 'completed'">Completed</button>
      </div>

      <form @submit.prevent="addTask" class="mb-3 d-flex">
        <input v-model="newTask" type="text" class="form-control me-2" placeholder="New task" required />
        <button type="submit" class="btn btn-primary">Add</button>
      </form>

      <ul class="list-group">
        <li v-for="task in filteredTasks" :key="task.id" class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <input type="checkbox" v-model="task.completed" @change="updateTaskStatus(task)" />
            <span :class="{ 'text-decoration-line-through': task.completed }">{{ task.title }}</span>
          </div>
          <div>
            <button class="btn btn-sm btn-warning me-2" @click="editTask(task)">Edit</button>
            <button class="btn btn-sm btn-danger" @click="deleteTask(task.id)">Delete</button>
          </div>
        </li>
      </ul>

      <div v-if="editingTask" class="mt-3">
        <h5>Edit Task</h5>
        <form @submit.prevent="updateTask">
          <input v-model="editingTask.title" type="text" class="form-control mb-2" required />
          <button type="submit" class="btn btn-success me-2">Save</button>
          <button type="button" class="btn btn-secondary" @click="cancelEdit">Cancel</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      userEmail: '',
      quote: '',
      author: '',
      tasks: [],
      filter: 'all',
      newTask: '',
      editingTask: null,
      token: '',
    };
  },
  computed: {
    filteredTasks() {
      if (this.filter === 'pending') {
        return this.tasks.filter((t) => !t.completed);
      } else if (this.filter === 'completed') {
        return this.tasks.filter((t) => t.completed);
      }
      return this.tasks;
    },
  },
  async created() {
    this.token = localStorage.getItem('token');
    if (!this.token) {
      this.$router.push('/login');
      return;
    }
    await this.fetchUser();
    await this.fetchTasks();
    await this.fetchQuote();
  },
  methods: {
    async fetchUser() {
      try {
        const res = await fetch('http://localhost:3001/api/auth/me', {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        if (res.ok) {
          const data = await res.json();
          this.userEmail = data.email;
        } else {
          this.logout();
        }
      } catch {
        this.logout();
      }
    },
    async fetchTasks() {
      try {
        const res = await fetch('http://localhost:3001/api/tasks', {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        if (res.ok) {
          this.tasks = await res.json();
        }
      } catch (error) {
        console.error('Failed to fetch tasks', error);
      }
    },
    async fetchQuote() {
      try {
        const res = await fetch('https://api.quotable.io/random');
        if (res.ok) {
          const data = await res.json();
          this.quote = data.content;
          this.author = data.author;
        }
      } catch (error) {
        console.error('Failed to fetch quote', error);
      }
    },
    async addTask() {
      try {
        const res = await fetch('http://localhost:3001/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({ title: this.newTask }),
        });
        if (res.ok) {
          const task = await res.json();
          this.tasks.push(task);
          this.newTask = '';
        }
      } catch (error) {
        console.error('Failed to add task', error);
      }
    },
    editTask(task) {
      this.editingTask = { ...task };
    },
    cancelEdit() {
      this.editingTask = null;
    },
    async updateTask() {
      try {
        const res = await fetch(`http://localhost:3001/api/tasks/${this.editingTask.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({ title: this.editingTask.title, completed: this.editingTask.completed }),
        });
        if (res.ok) {
          const index = this.tasks.findIndex((t) => t.id === this.editingTask.id);
          if (index !== -1) {
            this.tasks.splice(index, 1, this.editingTask);
          }
          this.editingTask = null;
        }
      } catch (error) {
        console.error('Failed to update task', error);
      }
    },
    async updateTaskStatus(task) {
      try {
        const res = await fetch(`http://localhost:3001/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({ completed: task.completed, title: task.title }),
        });
        if (!res.ok) {
          console.error('Failed to update task status');
        }
      } catch (error) {
        console.error('Failed to update task status', error);
      }
    },
    async deleteTask(id) {
      try {
        const res = await fetch(`http://localhost:3001/api/tasks/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${this.token}` },
        });
        if (res.ok) {
          this.tasks = this.tasks.filter((t) => t.id !== id);
        }
      } catch (error) {
        console.error('Failed to delete task', error);
      }
    },
    logout() {
      localStorage.removeItem('token');
      this.$router.push('/login');
    },
  },
};
</script>
