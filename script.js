const newListInput = document.getElementById("new-list-input");
const addListButton = document.getElementById("add-list-button");
const listsContainer = document.getElementById("lists-container");
const overallProgress = document.getElementById("overall-progress");
const listTemplate = document.getElementById("list-template");
const taskTemplate = document.getElementById("task-template");
const toggleButton = document.getElementById("theme-toggle");
const html = document.documentElement;

let draggedListIndex = null; // Збереження індексу перетягуваного списку
let lists = [];

// Отримати списки з API сервера (симуляція виклику сервера за допомогою async/await)
const fetchLists = async () => {
  try {
    const localData = localStorage.getItem("lists");
    if (localData) {
      return JSON.parse(localData); // Повернути збережені локально списки
    }
    // Якщо в localStorage нічого немає — беремо з сервера
    const response = await fetch("/api/lists");
    if (!response.ok) throw new Error("Failed to fetch lists");
    return await response.json();
  } catch (error) {
    console.error(error);
    return []; // Повертаємо порожній масив у разі помилки
  }
};

// Зберегти інформацію на сервер API (використовуючи async/await)
const saveListsToServer = async (lists) => {
  try {
    localStorage.setItem("lists", JSON.stringify(lists));

    const response = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lists),
    });

    if (!response.ok) throw new Error("Failed to save lists");
  } catch (error) {
    console.error(error);
  }
};

// Ініціалізація додатку через завантаження списків із сервера
const initializeApp = async () => {
  lists = await fetchLists();
  renderLists();
  updateOverallProgress();
};

// Обрахунок прогресу для завдань
const calculateProgress = (tasks) => {
  if (tasks.length === 0) return 0;
  const doneTasks = tasks.filter(({ done }) => done).length;
  return Math.round((doneTasks / tasks.length) * 100);
};

// Оновлення панелі загального прогресу
const updateOverallProgress = () => {
  const allTasks = lists.flatMap(({ tasks }) => tasks);
  const progress = calculateProgress(allTasks);
  overallProgress.style.width = `${progress}%`;
  overallProgress.innerText = `Overall Progress: ${progress}%`;
};

// Рендер всіх списків і завдань
const renderLists = () => {
  listsContainer.innerHTML = "";
  lists.forEach(({ name, tasks }, listIndex) => {
    const listClone = listTemplate.content.cloneNode(true);
    const listElem = listClone.querySelector(".list");

    listElem.dataset.index = listIndex;
    listElem.querySelector(".list-title").textContent = name;

    const progress = calculateProgress(tasks);
    const progressBar = listElem.querySelector(".progress-bar");
    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `${progress}%`;

    const addTaskBtn = listElem.querySelector(".add-task-button");
    const newTaskInput = listElem.querySelector(".new-task-input");
    const taskList = listElem.querySelector(".task-list");

    addTaskBtn.dataset.listIndex = listIndex;
    newTaskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const taskName = newTaskInput.value.trim();
        if (taskName) {
          addTaskToList(listIndex, taskName);
          newTaskInput.value = "";
        }
      }
    });

    listElem.querySelector(".edit-list-button").dataset.listIndex = listIndex;
    listElem.querySelector(".delete-list-button").dataset.listIndex = listIndex;

    tasks.forEach(({ name: taskName, done }, taskIndex) => {
      const taskClone = taskTemplate.content.cloneNode(true);
      const li = taskClone.querySelector("li");

      const span = li.querySelector("span");
      span.className = done ? "done" : "";
      span.dataset.listIndex = listIndex;
      span.dataset.taskIndex = taskIndex;

      li.querySelector(".task-title").textContent = `${
        taskIndex + 1
      }. ${taskName}`;

      ["done", "edit", "delete"].forEach((action) => {
        const btn = li.querySelector(`.${action}-task-button`);
        btn.dataset.listIndex = listIndex;
        btn.dataset.taskIndex = taskIndex;
      });

      taskList.appendChild(li);
    });

    listsContainer.appendChild(listElem);
  });

  // Динамічне переміщення списків
  document.querySelectorAll(".list").forEach((listElem) => {
    listElem.addEventListener("dragstart", (e) => {
      draggedListIndex = Number(listElem.dataset.index);
      e.dataTransfer.effectAllowed = "move";
    });

    listElem.addEventListener("dragover", (e) => {
      e.preventDefault();
      listElem.style.border = "2px dashed #aaa";
    });

    listElem.addEventListener("dragleave", () => {
      listElem.style.border = "";
    });

    listElem.addEventListener("drop", async (e) => {
      e.preventDefault();
      listElem.style.border = "";

      const targetIndex = Number(listElem.dataset.index);
      if (draggedListIndex !== null && draggedListIndex !== targetIndex) {
        const draggedList = lists.splice(draggedListIndex, 1)[0];
        lists.splice(targetIndex, 0, draggedList);
        await saveListsToServer(lists);
        renderLists();
        updateOverallProgress();
      }
    });
  });
};

// Додати нове завдання до списку
const addTaskToList = async (listIndex, taskName) => {
  lists[listIndex].tasks.push({ name: taskName, done: false });
  await saveListsToServer(lists);
  renderLists();
  updateOverallProgress();
};

// Додати новий список
const addList = async (listName) => {
  lists.push({ name: listName, tasks: [] });
  await saveListsToServer(lists);
  renderLists();
};

// Видалити завдання зі списку
const deleteTaskFromList = async (listIndex, taskIndex) => {
  lists[listIndex].tasks.splice(taskIndex, 1);
  await saveListsToServer(lists);
  renderLists();
  updateOverallProgress();
};

// Видалити список
const deleteList = async (listIndex) => {
  lists.splice(listIndex, 1);
  await saveListsToServer(lists);
  renderLists();
  updateOverallProgress();
};

// Перемикання статусу виконаного завдання
const toggleTaskDone = async (listIndex, taskIndex) => {
  const task = lists[listIndex].tasks[taskIndex];
  task.done = !task.done;
  await saveListsToServer(lists);
  renderLists();
  updateOverallProgress();
};

// Редагувати список
const editListName = async (listIndex, newName) => {
  lists[listIndex].name = newName;
  await saveListsToServer(lists);
  renderLists();
};

// Редагувати завдання
const editTaskName = async (listIndex, taskIndex, newName) => {
  lists[listIndex].tasks[taskIndex].name = newName;
  await saveListsToServer(lists);
  renderLists();
};

// Додавання нового списку (лівою кнопкою мишки)
addListButton.addEventListener("click", async () => {
  const listName = newListInput.value.trim();
  if (listName) {
    await addList(listName);
    newListInput.value = "";
  }
});

// Додавання нового списку (клавішою "Enter")
newListInput.addEventListener("keypress", async (e) => {
  if (e.key === "Enter") {
    const listName = newListInput.value.trim();
    if (listName) {
      await addList(listName);
      newListInput.value = "";
    }
  }
});

listsContainer.addEventListener("click", async (e) => {
  const { classList, dataset } = e.target;

  if (classList.contains("add-task-button")) {
    const listIndex = Number(dataset.listIndex);
    const taskInput = e.target.previousElementSibling;
    const taskName = taskInput.value.trim();
    if (taskName) {
      await addTaskToList(listIndex, taskName);
      taskInput.value = "";
    }
  } else if (classList.contains("delete-task-button")) {
    await deleteTaskFromList(
      Number(dataset.listIndex),
      Number(dataset.taskIndex)
    );
  } else if (classList.contains("delete-list-button")) {
    await deleteList(Number(dataset.listIndex));
  } else if (classList.contains("done-task-button")) {
    await toggleTaskDone(Number(dataset.listIndex), Number(dataset.taskIndex));
  } else if (classList.contains("edit-list-button")) {
    const newName = prompt("Enter new name for the list");
    if (newName) {
      await editListName(Number(dataset.listIndex), newName);
    }
  } else if (classList.contains("edit-task-button")) {
    const newName = prompt("Enter new name for the task");
    if (newName) {
      await editTaskName(
        Number(dataset.listIndex),
        Number(dataset.taskIndex),
        newName
      );
    }
  }
});

// Перемикання світлої/темної теми
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  html.setAttribute("data-theme", savedTheme);
  toggleButton.textContent = savedTheme === "dark" ? "🌞" : "🌙";
}

toggleButton.addEventListener("click", () => {
  const current = html.getAttribute("data-theme");
  const newTheme = current === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  toggleButton.textContent = newTheme === "dark" ? "🌞" : "🌙";
});

// Запуск додатка
initializeApp();
