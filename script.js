document.addEventListener("DOMContentLoaded", () => {
  const newListInput = document.getElementById("new-list-input");
  const addListButton = document.getElementById("add-list-button");
  const listsContainer = document.getElementById("lists-container");
  const overallProgress = document.getElementById("overall-progress");

  let lists = JSON.parse(localStorage.getItem("lists")) || [];

  function saveToLocalStorage() {
    localStorage.setItem("lists", JSON.stringify(lists));
  }

  function calculateProgress(tasks) {
    if (tasks.length === 0) return 0;
    const doneTasks = tasks.filter((task) => task.done).length;
    return Math.round((doneTasks / tasks.length) * 100);
  }

  function updateOverallProgress() {
    const allTasks = lists.flatMap((list) => list.tasks);
    const progress = calculateProgress(allTasks);
    overallProgress.style.width = `${progress}%`;
    overallProgress.innerText = `Overall Progress: ${progress}%`;
  }

  function renderLists() {
    listsContainer.innerHTML = "";
    lists.forEach((list, index) => {
      const listElement = document.createElement("div");
      listElement.classList.add("list");
      const progress = calculateProgress(list.tasks);
      listElement.innerHTML = `
              <h2>${index + 1}. <span class="list-title">${list.name}</span>
                  <button class="edit-list-button" data-list-index="${index}">Edit</button>
                  <button class="delete-list-button" data-list-index="${index}">Delete</button>
              </h2>
              <div class="progress-bar" style="width: ${progress}%;">${progress}%</div>
              <input type="text" class="new-task-input" placeholder="New Task">
              <button class="add-task-button" data-list-index="${index}">Add Task</button>
              <ul>
                  ${list.tasks
                    .map(
                      (task, taskIndex) => `
                      <li>
                          <span class="${
                            task.done ? "done" : ""
                          }" data-list-index="${index}" data-task-index="${taskIndex}">${String.fromCharCode(
                        97 + taskIndex
                      )}. <span class="task-title" data-list-index="${index}" data-task-index="${taskIndex}">${
                        task.name
                      }</span></span>
                          <button class="edit-task-button" data-list-index="${index}" data-task-index="${taskIndex}">Edit</button>
                          <button class="delete-task-button" data-list-index="${index}" data-task-index="${taskIndex}">Delete</button>
                      </li>
                  `
                    )
                    .join("")}
              </ul>
          `;
      listsContainer.appendChild(listElement);
    });
    updateOverallProgress();
  }

  function addTaskToList(listIndex, taskName) {
    lists[listIndex].tasks.push({ name: taskName, done: false });
    saveToLocalStorage();
    renderLists();
  }

  function deleteTaskFromList(listIndex, taskIndex) {
    lists[listIndex].tasks.splice(taskIndex, 1);
    saveToLocalStorage();
    renderLists();
  }

  function deleteList(listIndex) {
    lists.splice(listIndex, 1);
    saveToLocalStorage();
    renderLists();
  }

  function toggleTaskDone(listIndex, taskIndex) {
    lists[listIndex].tasks[taskIndex].done =
      !lists[listIndex].tasks[taskIndex].done;
    saveToLocalStorage();
    renderLists();
  }

  function editListName(listIndex, newName) {
    lists[listIndex].name = newName;
    saveToLocalStorage();
    renderLists();
  }

  function editTaskName(listIndex, taskIndex, newName) {
    lists[listIndex].tasks[taskIndex].name = newName;
    saveToLocalStorage();
    renderLists();
  }

  addListButton.addEventListener("click", () => {
    const listName = newListInput.value.trim();
    if (listName) {
      lists.push({ name: listName, tasks: [] });
      saveToLocalStorage();
      renderLists();
      newListInput.value = "";
    }
  });

  listsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-task-button")) {
      const listIndex = e.target.getAttribute("data-list-index");
      const taskInput = e.target.previousElementSibling;
      const taskName = taskInput.value.trim();
      if (taskName) {
        addTaskToList(listIndex, taskName);
        taskInput.value = "";
      }
    } else if (e.target.classList.contains("delete-task-button")) {
      const listIndex = e.target.getAttribute("data-list-index");
      const taskIndex = e.target.getAttribute("data-task-index");
      deleteTaskFromList(listIndex, taskIndex);
    } else if (e.target.classList.contains("delete-list-button")) {
      const listIndex = e.target.getAttribute("data-list-index");
      deleteList(listIndex);
    } else if (e.target.classList.contains("edit-list-button")) {
      const listIndex = e.target.getAttribute("data-list-index");
      const newName = prompt(
        "Enter new name for the list",
        lists[listIndex].name
      );
      if (newName) {
        editListName(listIndex, newName);
      }
    } else if (e.target.classList.contains("edit-task-button")) {
      const listIndex = e.target.getAttribute("data-list-index");
      const taskIndex = e.target.getAttribute("data-task-index");
      const newName = prompt(
        "Enter new name for the task",
        lists[listIndex].tasks[taskIndex].name
      );
      if (newName) {
        editTaskName(listIndex, taskIndex, newName);
      }
    } else if (e.target.classList.contains("task-title")) {
      const listIndex = e.target.getAttribute("data-list-index");
      const taskIndex = e.target.getAttribute("data-task-index");
      toggleTaskDone(listIndex, taskIndex);
    }
  });

  renderLists();
});
