console.log('script.js підключено');

// Масив об'єктів із даними про книги
const books = [
    {
        title: '1984',
        author: 'Джордж Орвелл',
        pages: 328,
        finished: true
    },
    {
        title: 'Прекрасний новий світ',
        author: 'Олдос Гакслі',
        pages: 288,
        finished: true
    },
    {
        title: 'Квіти для Елджернона',
        author: 'Деніел Кіз',
        pages: 320,
        finished: false
    },
    {
        title: 'Парфуми. Історія одного вбивці',
        author: 'Патрік Зюскінд',
        pages: 304,
        finished: true
    }
];

const API_URL = 'https://openlibrary.org/search.json?q=';

// Завантаження даних з Open Library Search API:
// https://openlibrary.org/search.json?q=<назва книги>
async function loadData(query) {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
    searchResultsList.innerHTML = '';
    loadingMessage.hidden = false;

    try {
        const response = await fetch(
            API_URL + encodeURIComponent(query)
        );

        if (!response.ok) {
            throw new Error(
                `Сервер відповів кодом ${response.status}`
            );
        }

        const data = await response.json();
        console.log(data);

        if (data.docs.length === 0) {
            errorMessage.textContent =
                'За запитом нічого не знайдено';

            errorMessage.style.display = 'block';

            return;
        }

        const apiBooks = data.docs.map(book => ({
            title: book.title,
            author: book.author_name
                ? book.author_name.join(', ')
                : 'Невідомий автор',
            firstPublishYear:
                book.first_publish_year ?? 'Невідомо'
        }));

        renderBooks(apiBooks, searchResultsList);

    } catch (error) {
        console.error(error);

        errorMessage.textContent =
            'Не вдалося завантажити книги. Перевірте з’єднання та спробуйте ще раз.';

        errorMessage.style.display = 'block';

    } finally {
        loadingMessage.hidden = true;
    }
}

console.log(books);

// Вибір контейнера для списку книг
const booksList = document.querySelector('#books-list');

const apiSearchInput =
    document.querySelector('#api-search-input');

const apiSearchButton =
    document.querySelector('#api-search-button');

const refreshButton =
    document.querySelector('#refresh-button');

const searchResultsList =
    document.querySelector('#search-results-list');

const loadingMessage =
    document.querySelector('#loading-message');

const errorMessage =
    document.querySelector('#error-message');

// Пошук книги через Open Library API
apiSearchButton.addEventListener('click', () => {
    const query = apiSearchInput.value.trim();

    if (query !== '') {
        loadData(query);
    }
});

// Повторний запит до Open Library API
refreshButton.addEventListener('click', () => {
    const query = apiSearchInput.value.trim();

    if (query !== '') {
        loadData(query);
    }
});

// Вибір форми додавання книги
const form = document.querySelector('#book-form');

// Вибір поля автора
const authorInput = document.querySelector('#book-author');

// Перевірка коректності введеного автора
authorInput.addEventListener('input', () => {
    const author = authorInput.value.trim();

    if (author !== '' && !/^[^0-9]+$/.test(author)) {
        authorInput.setCustomValidity(
            'Ім’я автора не повинно містити цифри'
        );
    } else {
        authorInput.setCustomValidity('');
    }
});

// Обробка надсилання форми та додавання нової книги
form.addEventListener('submit', event => {
    event.preventDefault();

    // Зчитування значень полів форми
    const title = document.querySelector('#book-title').value.trim();
    const author = document.querySelector('#book-author').value.trim();
    const pages = Number(document.querySelector('#book-pages').value);
    const status = document.querySelector('#book-status').value;

    // Створення нового об'єкта книги
    const newBook = {
        title: title,
        author: author,
        pages: pages,
        finished: status === 'completed'
    };

    // Додавання нової книги до масиву
    books.push(newBook);

    console.log(
        `Додано книгу: ${newBook.title}. Усього книг: ${books.length}`
    );

    renderBooks(books, booksList);

    booksCount.textContent = `Усього книг: ${books.length}`;

    // Оновлення статистики
    const completedBooks = books.filter(book => book.finished).length;
    completedCount.textContent = `Прочитано: ${completedBooks}`;

    // Очищення форми
    form.reset();
});

// Знаходить і видаляє статичний приклад картки
const staticBookCard = document.querySelector('.book-card');

if (staticBookCard) {
    staticBookCard.remove();
}

// Рендер карток книг із масиву
function renderBooks(books, container) {
    container.innerHTML = '';

    books.forEach((book, index) => {
        const article = document.createElement('article');
        const title = document.createElement('h3');
        const author = document.createElement('p');

        article.classList.add('book-card');

        if (book.pages !== undefined) {
            article.setAttribute('data-pages', book.pages);
        }

        if (
            typeof book.finished === 'boolean' &&
            !book.finished
        ) {
            article.classList.add('unread');
        }

        title.textContent = book.title;
        author.textContent = `Автор: ${book.author}`;

        article.append(title, author);

        // Рік першого видання для результатів API
        if (book.firstPublishYear !== undefined) {
            const year = document.createElement('p');

            year.textContent =
                `Рік першого видання: ${book.firstPublishYear}`;

            article.append(year);
        }

        // Статус для книг трекера
        if (typeof book.finished === 'boolean') {
            const statusSelect =
                document.createElement('select');

            statusSelect.classList.add(
                'book-status-select'
            );

            statusSelect.dataset.index = index;

            statusSelect.innerHTML = `
                <option value="reading">Читаю</option>
                <option value="completed">Прочитано</option>
            `;

            statusSelect.value = book.finished
                ? 'completed'
                : 'reading';

            article.append(statusSelect);
        }

        container.append(article);
    });
}

// Обробка зміни статусу книги через делегування подій
booksList.addEventListener('change', event => {
    if (event.target.classList.contains('book-status-select')) {
        const index = Number(event.target.dataset.index);

        books[index].finished = event.target.value === 'completed';

        console.log(
            `Статус книги "${books[index].title}" змінено на: ${event.target.value}`
        );

        renderBooks(books, booksList);

        const completedBooks = books.filter(book => book.finished).length;
        completedCount.textContent = `Прочитано: ${completedBooks}`;
    }
});

// Виведення книг на сторінку
renderBooks(books, booksList);

// Вибір елементів статистики
const booksCount = document.querySelector('#books-count');
const completedCount = document.querySelector('#completed-count');

// Оновлення статистики
booksCount.textContent = `Усього книг: ${books.length}`;

const completedBooks = books.filter(book => book.finished).length;
completedCount.textContent = `Прочитано: ${completedBooks}`;

// Підраховує сумарну кількість сторінок прочитаних книг
function calculateReadPages(books) {
    let totalPages = 0;

    for (let i = 0; i < books.length; i++) {
        if (books[i].finished === true) {
            totalPages += books[i].pages;
        }
    }

    console.log(`Сумарна кількість сторінок прочитаних книг: ${totalPages}`);
}

calculateReadPages(books);

// Перебирає книги та знаходить ті, які ще не прочитані
for (const book of books) {
    if (book.finished === false) {
        console.log(`Ще не прочитано: ${book.title}`);
    }
}

// Обчислює кількість сторінок для читання за один день
const pagesPerDay = (pages, days) => Math.round(pages / days);

console.log(`Сторінок на день: ${pagesPerDay(books[0].pages, 10)}`);
