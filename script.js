const newListInput = document.getElementById("new-list-input");
const addListButton = document.getElementById("add-list-button");
const listsContainer = document.getElementById("lists-container");
const overallProgress = document.getElementById("overall-progress");

let draggedListIndex = null; // Збереження індексу перетягуваного списку

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

let lists = [];

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
    const progress = calculateProgress(tasks);
    const listHTML = `
      <div class="list" draggable="true" data-index="${listIndex}">
        <h2>
          <span class="list-title">${name}</span>
          <div class="list-buttons">
            <button class="edit-list-button" data-list-index="${listIndex}"></button>
            <button class="delete-list-button" data-list-index="${listIndex}">-</button>
          </div>
        </h2>
        <div class="progress-bar" style="width: ${progress}%;">${progress}%</div>
        <input type="text" class="new-task-input" placeholder="New Task">
        <button class="add-task-button" data-list-index="${listIndex}">Add Task</button>
        <ol class="task-list">
          ${tasks
            .map(
              ({ name: taskName, done }, taskIndex) => `
            <li>
              <span class="${
                done ? "done" : ""
              }" data-list-index="${listIndex}" data-task-index="${taskIndex}">
                <span class="task-title">${taskIndex + 1}. ${taskName}</span>
              </span>
              <button class="done-task-button" data-list-index="${listIndex}" data-task-index="${taskIndex}"></button>
              <button class="edit-task-button" data-list-index="${listIndex}" data-task-index="${taskIndex}"></button>
              <button class="delete-task-button" data-list-index="${listIndex}" data-task-index="${taskIndex}">-</button>
            </li>
          `
            )
            .join("")}
        </ol>
      </div>
    `;
    listsContainer.innerHTML += listHTML;
  });

  // Додавання списків і завдань за допомогою лівої кнопки мишки та клавіші "Enter"
  document.querySelectorAll(".new-task-input").forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const listIndex = input.nextElementSibling.dataset.listIndex;
        const taskName = input.value.trim();
        if (taskName) {
          addTaskToList(listIndex, taskName);
          input.value = "";
        }
      }
    });
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
    const listIndex = Number(dataset.listIndex);
    const taskIndex = Number(dataset.taskIndex);
    await deleteTaskFromList(listIndex, taskIndex);
  } else if (classList.contains("delete-list-button")) {
    const listIndex = Number(dataset.listIndex);
    await deleteList(listIndex);
  } else if (classList.contains("done-task-button")) {
    const listIndex = Number(dataset.listIndex);
    const taskIndex = Number(dataset.taskIndex);
    await toggleTaskDone(listIndex, taskIndex);
  } else if (classList.contains("edit-list-button")) {
    const listIndex = Number(dataset.listIndex);
    const newName = prompt(
      "Enter new name for the list",
      lists[listIndex].name
    );
    if (newName) {
      await editListName(listIndex, newName);
    }
  } else if (classList.contains("edit-task-button")) {
    const listIndex = Number(dataset.listIndex);
    const taskIndex = Number(dataset.taskIndex);
    const newName = prompt(
      "Enter new name for the task",
      lists[listIndex].tasks[taskIndex].name
    );
    if (newName) {
      await editTaskName(listIndex, taskIndex, newName);
    }
  }
});

// Перемикання світлої/темної теми
const toggleButton = document.getElementById("theme-toggle");
const html = document.documentElement;

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