document.addEventListener("DOMContentLoaded", () => {
  // === FUNGSI BERSAMA ===
  const getBooks = () => JSON.parse(localStorage.getItem("books")) || [];
  const saveBooks = (books) =>
    localStorage.setItem("books", JSON.stringify(books));
  const formatDate = (date) =>
    new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const getToday = () => new Date().toISOString().split("T")[0];
  const showToast = (message, type = "success") => {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };
  const openModal = (modalElement) => {
    if (modalElement) {
      modalElement.style.display = "block";
      document.body.classList.add("modal-open");
    }
  };
  const closeModal = (modalElement) => {
    if (modalElement) {
      modalElement.style.display = "none";
      document.body.classList.remove("modal-open");
    }
  };

  // Logika Hamburger & Sidebar
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("overlay");
  if (hamburgerBtn && sidebar && overlay) {
    hamburgerBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("active");
    });
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
    });
  }

  // Fungsi Seeding
  function seedInitialData() {
    if (typeof initialBooks !== "undefined" && getBooks().length === 0) {
      saveBooks(initialBooks);
    }
  }
  seedInitialData();

  // === LOGIKA HALAMAN TERTENTU ===

  // 1. Logika Halaman Beranda
  if (document.getElementById("totalBooksStat")) {
    const books = getBooks();
    document.getElementById("totalBooksStat").textContent = books.length;
    document.getElementById("borrowedBooksStat").textContent = books.filter(
      (b) => b.isBorrowed
    ).length;
    document.getElementById("availableBooksStat").textContent = books.filter(
      (b) => !b.isBorrowed
    ).length;
  }

  // 2. Logika Halaman Tambah Buku
  if (document.getElementById("addBookForm")) {
    document.getElementById("addBookForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const newBook = {
        id: Date.now(),
        title: document.getElementById("title").value.trim(),
        author: document.getElementById("author").value.trim(),
        category: document.getElementById("category").value,
        year: document.getElementById("year").value,
        isBorrowed: false,
        borrowerName: "",
        borrowDate: "",
        dueDate: "",
        history: [],
      };
      const books = getBooks();
      books.push(newBook);
      saveBooks(books);
      localStorage.setItem("toastMessage", "Buku berhasil ditambahkan!");
      window.location.href = "koleksi.html";
    });
  }

  // 3. Logika Halaman Koleksi Buku
  if (document.getElementById("bookList")) {
    let currentPage = 1;
    const booksPerPage = 12;
    const toastMessage = localStorage.getItem("toastMessage");
    if (toastMessage) {
      showToast(toastMessage);
      localStorage.removeItem("toastMessage");
    }
    const bookList = document.getElementById("bookList");
    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");
    const pageInfo = document.getElementById("page-info");
    const prevPageBtn = document.getElementById("prev-page-btn");
    const nextPageBtn = document.getElementById("next-page-btn");
    const editModal = document.getElementById("editModal");
    const borrowModal = document.getElementById("borrowModal");
    const historyModal = document.getElementById("historyModal");
    const confirmModal = document.getElementById("confirmModal");
    const loadingSpinner = document.getElementById("loading-spinner");
    const displayBooks = () => {
      loadingSpinner.classList.add("show");
      bookList.innerHTML = "";
      setTimeout(() => {
        const allBooks = getBooks();
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const filteredBooks = allBooks.filter(
          (book) =>
            (book.title.toLowerCase().includes(searchTerm) ||
              book.author.toLowerCase().includes(searchTerm)) &&
            (selectedCategory === "all" || book.category === selectedCategory)
        );
        const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
        if (totalPages > 0 && currentPage > totalPages)
          currentPage = totalPages;
        const startIndex = (currentPage - 1) * booksPerPage;
        const endIndex = startIndex + booksPerPage;
        const booksToShow = filteredBooks.slice(startIndex, endIndex);
        loadingSpinner.classList.remove("show");
        renderBookCards(booksToShow);
        renderPaginationControls(totalPages, filteredBooks.length);
      }, 200);
    };
    const renderBookCards = (books) => {
      bookList.innerHTML = "";
      if (books.length === 0) {
        bookList.innerHTML =
          "<p>Tidak ada buku yang cocok dengan kriteria.</p>";
        return;
      }
      const today = new Date(getToday());
      books.forEach((book) => {
        const bookCard = document.createElement("div");
        bookCard.classList.add("book-card");
        bookCard.dataset.id = book.id;
        const isOverdue = book.isBorrowed && new Date(book.dueDate) < today;
        const statusClass = isOverdue
          ? "status borrowed overdue"
          : book.isBorrowed
          ? "status borrowed"
          : "status available";
        const statusText = isOverdue
          ? "TERLAMBAT"
          : book.isBorrowed
          ? "Dipinjam"
          : "Tersedia";
        const mainActionButton = book.isBorrowed
          ? `<button class="btn btn-secondary return-btn">Kembalikan</button>`
          : `<button class="btn btn-primary borrow-btn">Pinjam</button>`;
        bookCard.innerHTML = `<span class="category-tag">${
          book.category || "Tanpa Kategori"
        }</span><h3>${book.title}</h3><p>Oleh ${book.author} (${
          book.year
        })</p>${
          book.isBorrowed
            ? `<div class="info-bar"><span>Oleh: <strong>${
                book.borrowerName
              }</strong></span><span>Jatuh Tempo: <strong>${formatDate(
                book.dueDate
              )}</strong></span></div>`
            : ""
        }<div class="${statusClass}">${statusText}</div><div class="actions"><div class="secondary-actions"><button class="history-btn">Riwayat</button><button class="edit-btn">Edit</button><button class="delete-btn">Hapus</button></div>${mainActionButton}</div>`;
        bookList.appendChild(bookCard);
      });
    };
    const renderPaginationControls = (totalPages, totalBooks) => {
      if (totalBooks === 0) {
        pageInfo.textContent = "Tidak ada buku";
      } else {
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages || 1}`;
      }
      prevPageBtn.disabled = currentPage === 1;
      nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    };
    const showConfirm = (title, message, onConfirm) => {
      document.getElementById("confirmTitle").textContent = title;
      document.getElementById("confirmMessage").textContent = message;
      openModal(confirmModal);
      const yesButton = document.getElementById("confirmYesBtn");
      const newYesButton = yesButton.cloneNode(true);
      yesButton.parentNode.replaceChild(newYesButton, yesButton);
      newYesButton.onclick = () => {
        onConfirm();
        closeModal(confirmModal);
      };
      document.getElementById("confirmNoBtn").onclick = () => {
        closeModal(confirmModal);
      };
    };
    const openBorrowModal = (bookId) => {
      document.getElementById("borrowBookId").value = bookId;
      const today = new Date();
      const defaultDueDate = new Date();
      defaultDueDate.setDate(today.getDate() + 7);
      document.getElementById("dueDate").value = defaultDueDate
        .toISOString()
        .split("T")[0];
      openModal(borrowModal);
    };
    const openHistoryModal = (book) => {
      const historyContent = document.getElementById("historyContent");
      if (book.history && book.history.length > 0) {
        let tableHTML = `<h3>${book.title}</h3><table class="history-table"><tr><th>Peminjam</th><th>Tgl Pinjam</th><th>Tgl Kembali</th></tr>`;
        book.history.forEach((rec) => {
          tableHTML += `<tr><td>${rec.borrowerName}</td><td>${formatDate(
            rec.borrowDate
          )}</td><td>${
            rec.returnDate ? formatDate(rec.returnDate) : "Masih dipinjam"
          }</td></tr>`;
        });
        tableHTML += "</table>";
        historyContent.innerHTML = tableHTML;
      } else {
        historyContent.innerHTML = `<div class="no-history">Buku ini belum pernah dipinjam.</div>`;
      }
      openModal(historyModal);
    };
    searchInput.addEventListener("input", () => {
      currentPage = 1;
      displayBooks();
    });
    categoryFilter.addEventListener("change", () => {
      currentPage = 1;
      displayBooks();
    });
    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        displayBooks();
      }
    });
    nextPageBtn.addEventListener("click", () => {
      const allBooks = getBooks();
      const searchTerm = searchInput.value.toLowerCase();
      const selectedCategory = categoryFilter.value;
      const filteredBooks = allBooks.filter(
        (book) =>
          (book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm)) &&
          (selectedCategory === "all" || book.category === selectedCategory)
      );
      const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        displayBooks();
      }
    });
    bookList.addEventListener("click", (e) => {
      const card = e.target.closest(".book-card");
      if (!card) return;
      const bookId = Number(card.dataset.id);
      const books = getBooks();
      const book = books.find((b) => b.id === bookId);
      if (e.target.classList.contains("borrow-btn")) {
        openBorrowModal(bookId);
      }
      if (e.target.classList.contains("return-btn")) {
        const todayStr = getToday();
        const lastHistory = book.history[book.history.length - 1];
        if (lastHistory && lastHistory.returnDate === null) {
          lastHistory.returnDate = todayStr;
        }
        book.isBorrowed = false;
        book.borrowerName = "";
        book.borrowDate = "";
        book.dueDate = "";
        saveBooks(books);
        displayBooks();
        showToast("Buku berhasil dikembalikan.");
      }
      if (e.target.classList.contains("history-btn")) {
        openHistoryModal(book);
      }
      if (e.target.classList.contains("edit-btn")) {
        document.getElementById("editBookId").value = book.id;
        document.getElementById("editTitle").value = book.title;
        document.getElementById("editAuthor").value = book.author;
        document.getElementById("editCategory").value = book.category || "";
        document.getElementById("editYear").value = book.year;
        openModal(editModal);
      }
      if (e.target.classList.contains("delete-btn")) {
        showConfirm(
          "Hapus Buku",
          `Apakah Anda yakin ingin menghapus "${book.title}"?`,
          () => {
            const currentBooks = getBooks();
            saveBooks(currentBooks.filter((b) => b.id !== bookId));
            displayBooks();
            showToast(`Buku "${book.title}" berhasil dihapus.`, "error");
          }
        );
      }
    });
    document.getElementById("editBookForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const bookId = Number(document.getElementById("editBookId").value);
      const books = getBooks();
      const bookToUpdate = books.find((b) => b.id === bookId);
      if (bookToUpdate) {
        bookToUpdate.title = document.getElementById("editTitle").value.trim();
        bookToUpdate.author = document
          .getElementById("editAuthor")
          .value.trim();
        bookToUpdate.category = document.getElementById("editCategory").value;
        bookToUpdate.year = document.getElementById("editYear").value;
        saveBooks(books);
        closeModal(editModal);
        displayBooks();
        showToast("Perubahan berhasil disimpan.");
      }
    });
    document
      .getElementById("borrowBookForm")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        const bookId = Number(document.getElementById("borrowBookId").value);
        const borrowerName = document
          .getElementById("borrowerName")
          .value.trim();
        const dueDateValue = document.getElementById("dueDate").value;
        if (!borrowerName || !dueDateValue) {
          showToast("Nama dan jatuh tempo harus diisi!", "error");
          return;
        }
        let books = getBooks();
        const book = books.find((b) => b.id === bookId);
        book.isBorrowed = true;
        book.borrowerName = borrowerName;
        book.borrowDate = getToday();
        book.dueDate = dueDateValue;
        if (!book.history) book.history = [];
        book.history.push({
          borrowerName: borrowerName,
          borrowDate: book.borrowDate,
          returnDate: null,
        });
        saveBooks(books);
        closeModal(borrowModal);
        document.getElementById("borrowBookForm").reset();
        displayBooks();
        showToast("Buku berhasil dipinjam.");
      });
    document
      .getElementById("closeModalBtn")
      .addEventListener("click", () => closeModal(editModal));
    document
      .getElementById("closeBorrowModalBtn")
      .addEventListener("click", () => closeModal(borrowModal));
    document
      .getElementById("closeHistoryModalBtn")
      .addEventListener("click", () => closeModal(historyModal));
    displayBooks();
  }
});
