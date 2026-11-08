/*
Для реалізації інтерфейсу було обрано фреймворк Vue 3, оскільки він забезпечує реактивне керування даними
та автоматичне оновлення інтерфейсу без ручного перерендеру DOM-елементів. Компонентний підхід
Vue дозволяє створити багаторазовий компонент BookRow, передавати йому назву, автора, кількість сторінок
і статус книги через props, а зміни статусу передавати батьківському компоненту через emit. Додатковою
перевагою є можливість підключення Vue 3 через CDN без додаткових інструментів збирання, що спрощує
інтеграцію в наявний проєкт і дозволяє зберегти функціональність попередніх практичних робіт.
*/

console.log('script.js підключено');

// Компонент книги отримує дані через props
// і повідомляє батьківський компонент про зміну статусу
const BookRow = {
    props: {
        id: {
            type: Number,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        author: {
            type: String,
            required: true
        },
        pages: {
            type: Number,
            required: true
        },
        status: {
            type: Boolean,
            required: true
        }
    },

    emits: ['toggle'],

    template: `
        <article
            class="book-card"
            :class="{ unread: !status }"
            :data-pages="pages"
        >
            <h3>{{ title }}</h3>

            <p>Автор: {{ author }}</p>

            <p>Кількість сторінок: {{ pages }}</p>

            <p>
                Статус:
                <button
                    type="button"
                    class="status"
                    :class="{ 'status-completed': status }"
                    :aria-pressed="status"
                    @click="$emit('toggle', id)"
                >
                    {{ status ? 'Прочитано' : 'Читаю' }}
                </button>
            </p>
        </article>
    `
};

// Реактивний стан списку книг
const booksApp = Vue.createApp({
    components: {
        BookRow
    },
    data() {
        return {
            books: [
                {
                    id: 1,
                    title: '1984',
                    author: 'Джордж Орвелл',
                    pages: 328,
                    finished: true
                },
                {
                    id: 2,
                    title: 'Прекрасний новий світ',
                    author: 'Олдос Гакслі',
                    pages: 288,
                    finished: true
                },
                {
                    id: 3,
                    title: 'Квіти для Елджернона',
                    author: 'Деніел Кіз',
                    pages: 320,
                    finished: false
                },
                {
                    id: 4,
                    title: 'Парфуми. Історія одного вбивці',
                    author: 'Патрік Зюскінд',
                    pages: 304,
                    finished: true
                }
            ]
        };
    },
    // Перемикає статус книги, Vue автоматично оновлює її картку
    methods: {
        toggleStatus(id) {
            const book = this.books.find(book => book.id === id);

            if (book) {
                book.finished = !book.finished;
            }
        }
    }
});

// Підключення Vue до наявного розділу «Мої книги»
const booksVm = booksApp.mount('#my-books');

// Тимчасове посилання на стан для обробників попередніх робіт
const books = booksVm.books;

// Ручний рендер списку «Мої книги» замінено компонентом BookRow
// та директивою v-for. Зміни реактивного масиву books
// автоматично відображаються в інтерфейсі.

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
        id: Math.max(0, ...books.map(book => book.id)) + 1,
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


    booksCount.textContent = `Усього книг: ${books.length}`;

    // Оновлення статистики
    const completedBooks = books.filter(book => book.finished).length;
    completedCount.textContent = `Прочитано: ${completedBooks}`;

    // Очищення форми
    form.reset();
});

// Ручний DOM-рендер використовується лише для результатів API.
// Список «Мої книги» відображається компонентами Vue.
function renderBooks(apiBooks, container) {
    container.innerHTML = '';

    apiBooks.forEach(book => {
        const article = document.createElement('article');
        article.classList.add('book-card');

        const title = document.createElement('h3');
        title.textContent = book.title;

        const author = document.createElement('p');
        author.textContent = `Автор: ${book.author}`;

        const year = document.createElement('p');
        year.textContent =
            `Рік першого видання: ${book.firstPublishYear ?? 'Невідомо'}`;

        article.append(title, author, year);
        container.append(article);
    });
}

// Вибір елементів статистики
const booksCount = document.querySelector('#books-count');
const completedCount = document.querySelector('#completed-count');

// Оновлення статистики
booksCount.textContent = `Усього книг: ${books.length}`;

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

// Синхронізація наявного лічильника зі станом книг
Vue.watch(
    () => books.filter(book => book.finished).length,
    count => {
        completedCount.textContent = `Прочитано: ${count}`;
    },
    { immediate: true }
);