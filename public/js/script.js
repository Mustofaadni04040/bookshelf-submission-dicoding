const modal = document.querySelector(".modal");

function handlerModal() {
  modal.classList.toggle("hidden");
  resetModalInput();
}

function resetModalInput() {
  document.getElementById("book-title").value = "";
  document.getElementById("book-author").value = "";
  document.getElementById("book-year").value = "";
}

const books = [];
const RENDER_EVENT = "render-book";
const SAVED_EVENT = "saved-book";
const STORAGE_KEY = "BOOKSHELF_APPS";

document.addEventListener("DOMContentLoaded", function () {
  const submitBook = document.querySelector(".modal-content");

  submitBook.addEventListener("submit", function (e) {
    const bookTitle = document.getElementById("book-title").value;
    e.preventDefault();
    Swal.fire({
      title: "Success",
      text: `Buku "${bookTitle}" berhasil ditambahkan!`,
      icon: "success",
      confirmButtonText: "OK",
    });
    addBook();
    handlerModal();
  });

  if (isStorageExist()) {
    loadDataFromStorage();
  }
});

function addBook() {
  const bookTitle = document.getElementById("book-title").value;
  const bookAuthor = document.getElementById("book-author").value;
  const bookYear = document.getElementById("book-year").value;
  const bookStatus = document.getElementById("book-status").checked;

  const generateID = generateId();
  const bookObject = generateBookObject(
    generateID,
    bookTitle,
    bookAuthor,
    bookYear,
    bookStatus,
    false
  );
  books.push(bookObject);
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function generateId() {
  return +new Date();
}

function generateBookObject(id, title, author, year, isCompleted) {
  return {
    id,
    title,
    author,
    year,
    isCompleted,
  };
}

function findBook(bookId) {
  for (bookItem of books) {
    if (bookItem.id === bookId) {
      return bookItem;
    }
  }
  return null;
}

function findBookIndex(bookId) {
  for (index in books) {
    if (books[index].id == bookId) {
      return index;
    }
  }
  return -1;
}

function addBookToCompleted(bookId) {
  const bookTarget = findBook(bookId);
  if (bookTarget == null) return;

  bookTarget.isCompleted = true;
  document.dispatchEvent(new Event(RENDER_EVENT));

  saveData();
}

function removeBookFromCompleted(bookId) {
  const bookTarget = findBookIndex(bookId);
  if (bookTarget === -1) return;

  books.splice(bookTarget, 1);
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

function undoBookFromCompleted(bookId) {
  const bookTarget = findBook(bookId);
  if (bookTarget === null) return;

  bookTarget.isCompleted = false;
  document.dispatchEvent(new Event(RENDER_EVENT));

  saveData();
}

function makeBook(bookObject) {
  const bookCard = document.createElement("div");
  bookCard.classList.add(
    "book-card",
    "relative",
    "border-slate-200",
    "rounded-xl",
    "p-5",
    "shadow-md",
    "mb-5"
  );

  bookCard.style.backgroundColor = bookObject.isCompleted
    ? "#86efac"
    : "#fca5a5";

  const deleteButton = document.createElement("button");
  deleteButton.classList.add(
    "flex",
    "items-center",
    "justify-center",
    "absolute",
    "w-8",
    "h-8",
    "-top-3",
    "-right-3",
    "rounded-full",
    "border-2",
    "border-white",
    "bg-red-500",
    "hover:bg-red-600",
    "transition",
    "duration-300",
    "ease-in-out"
  );
  deleteButton.id = "delete-button";
  deleteButton.innerHTML =
    '<i class="ri-close-line text-xl cursor-pointer text-white transition duration-200"></i>';
  bookCard.appendChild(deleteButton);

  deleteButton.addEventListener("click", function () {
    Swal.fire({
      text: `Apakah anda yakin menghapus buku "${bookObject.title}" ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        removeBookFromCompleted(bookObject.id);
        Swal.fire({
          text: `Buku "${bookObject.title}" berhasil dihapus`,
          icon: "success",
        });
      }
    });
  });

  const bookItem = document.createElement("div");
  bookItem.classList.add(
    "book-item",
    "flex",
    "items-center",
    "justify-between"
  );

  const bookInfo = document.createElement("div");
  bookInfo.id = "book-info";

  const bookTitle = document.createElement("h3");
  bookTitle.classList.add(
    "text-lg",
    "font-bold",
    "text-slate-600",
    "mb-1",
    "lg:text-2xl"
  );
  bookTitle.innerText = bookObject.title;

  const bookAuthor = document.createElement("p");
  bookAuthor.classList.add("text-sm", "text-slate-600", "lg:text-lg");
  bookAuthor.innerText = `Penulis: ${bookObject.author}`;

  const bookYear = document.createElement("p");
  bookYear.classList.add("text-sm", "text-slate-600", "lg:text-lg");
  bookYear.innerText = `Tahun: ${bookObject.year}`;

  bookInfo.append(bookTitle, bookAuthor, bookYear);

  const action = document.createElement("div");
  action.classList.add("action");

  if (bookObject.isCompleted) {
    const undoButton = document.createElement("i");
    undoButton.classList.add(
      "ri-arrow-go-back-fill",
      "text-3xl",
      "cursor-pointer",
      "text-red-600",
      "hover:text-red-700",
      "transition",
      "duration-200",
      "lg:text-4xl"
    );
    undoButton.id = "undo-button";

    undoButton.addEventListener("click", function () {
      undoBookFromCompleted(bookObject.id);
    });
    action.append(undoButton);
  } else {
    const completeButton = document.createElement("i");
    completeButton.classList.add(
      "ri-checkbox-circle-line",
      "text-3xl",
      "cursor-pointer",
      "text-green-600",
      "hover:text-green-700",
      "transition",
      "duration-200",
      "lg:text-4xl"
    );
    completeButton.id = "complete-button";
    completeButton.addEventListener("click", function () {
      addBookToCompleted(bookObject.id);
    });

    action.append(completeButton);
  }
  bookItem.append(bookInfo, action);
  bookCard.append(bookItem);

  return bookCard;
}

document.addEventListener(RENDER_EVENT, function () {
  const unCompletedBook = document.getElementById("books-uncompleted");
  unCompletedBook.innerHTML = "";

  const completedBook = document.getElementById("books-completed");
  completedBook.innerHTML = "";

  for (bookItem of books) {
    const bookElement = makeBook(bookItem);
    if (bookItem.isCompleted == false) {
      unCompletedBook.append(bookElement);
    } else {
      completedBook.append(bookElement);
    }
  }
});

function saveData() {
  if (isStorageExist()) {
    const parsed = JSON.stringify(books);
    localStorage.setItem(STORAGE_KEY, parsed);
    document.dispatchEvent(new Event(SAVED_EVENT));
  }
}

function isStorageExist() {
  if (typeof Storage === "undefined") {
    alert("Browser kamu tidak mendukung local storage");
    return false;
  }
  return true;
}

function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);
  let data = JSON.parse(serializedData);

  if (data !== null) {
    for (let book of data) {
      books.push(book);
    }
  }
  document.dispatchEvent(new Event(RENDER_EVENT));
}

const btnSearch = document.getElementById("search-submit");
btnSearch.addEventListener("click", function (e) {
  e.preventDefault();

  const searchBookTitle = document.getElementById("search-book-title").value;
  const bookItem = document.querySelectorAll(".book-card");
  const notFoundBook = document.getElementById("not-found-book");
  let foundBook = false;

  for (let book of bookItem) {
    const bookTitle = book.innerText;

    if (bookTitle.includes(searchBookTitle)) {
      book.style.display = "block";
      foundBook = true;
    } else {
      book.style.display = "none";
    }
  }

  if (!foundBook) {
    notFoundBook.classList.remove("opacity-0");
  } else {
    notFoundBook.classList.add("opacity-0");
  }
});
