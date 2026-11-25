/*
Для реалізації інтерфейсу було обрано фреймворк Vue 3, оскільки він забезпечує реактивне керування даними
та автоматичне оновлення інтерфейсу без ручного перерендеру DOM-елементів. Компонентний підхід
Vue дозволяє створити багаторазовий компонент BookRow, передавати йому назву, автора, кількість сторінок
і статус книги через props, а зміни статусу передавати батьківському компоненту через emit. Додатковою
перевагою є можливість підключення Vue 3 через CDN без додаткових інструментів збирання, що спрощує
інтеграцію в наявний проєкт і дозволяє зберегти функціональність попередніх практичних робіт.
*/

/*
Практична робота №12.
Для варіанта 9 обрано CSS-перехід transition:
ширина смуги прогресу плавно змінюватиметься відповідно
до кількості прочитаних сторінок конкретної книги.
Прогрес відображатиметься в компоненті BookRow.

У компоненті BookRow реалізовано прогрес читання
«сторінка X із Y». Значення pagesRead зберігається в IndexedDB,
а ширина смуги обчислюється з даних конкретної книги.
Після збереження поточної сторінки Vue оновлює інтерфейс,
а CSS-перехід плавно змінює ширину смуги протягом 0,4 секунди.
*/

console.log('script.js підключено');

// Ключ для збереження власного списку книг
const STORAGE_KEY = 'bookTrackerBooks';

// Прапорець одноразової міграції
const MIGRATION_KEY = 'bookTrackerMigratedToIndexedDB';

// Схема бази даних IndexedDB
const DB_NAME = 'BookTrackerDB';
const DB_VERSION = 1;
const BOOKS_STORE = 'books';

// Зберігає масив книг у localStorage у форматі JSON
function saveToLocalStorage(items) {
    try {
        const json = JSON.stringify(items);

        localStorage.setItem(STORAGE_KEY, json);

        return true;
    } catch (error) {
        console.error(
            'Не вдалося зберегти книги в localStorage:',
            error
        );

        return false;
    }
}

// Читає масив книг із localStorage
function loadFromLocalStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (raw === null) {
            return [];
        }

        const items = JSON.parse(raw);

        if (!Array.isArray(items)) {
            throw new Error(
                'Збережені дані повинні бути масивом книг'
            );
        }

        return items;
    } catch (error) {
        console.error(
            'Не вдалося прочитати книги з localStorage:',
            error
        );

        return [];
    }
}

// Відкриває базу IndexedDB та створює сховище книг
// під час першого запуску
function openDB() {

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(
            DB_NAME,
            DB_VERSION
        );

        // Створення або оновлення структури бази
        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(BOOKS_STORE)) {
                db.createObjectStore(BOOKS_STORE, {
                    keyPath: 'id'
                });
            }
        };

        // Успішне відкриття бази
        request.onsuccess = () => {
            const db = request.result;

            // Не блокуємо зміну версії бази в іншій вкладці
            db.onversionchange = () => {
                db.close();
            };

            resolve(db);
        };

        // Помилка відкриття бази
        request.onerror = () => {
            reject(request.error);
        };

        // Інша вкладка перешкоджає оновленню бази
        request.onblocked = () => {
            console.warn(
                'Оновлення IndexedDB заблоковано. ' +
                'Закрийте інші вкладки цього застосунку.'
            );
        };
    });
}

// Визначає кількість прочитаних сторінок,
// зокрема для старих записів без поля pagesRead
function getReadPages(book) {
    if (book.status === 'completed') {
        return book.pages;
    }

    if (book.status === 'planned') {
        return 0;
    }

    const value = Math.trunc(Number(book.pagesRead) || 0);

    return Math.min(book.pages, Math.max(0, value));
}

// Формує запис книги для IndexedDB
function toBookRecord(book) {
    return {
        id: book.id,
        title: book.title,
        author: book.author,
        pages: book.pages,
        status: book.status,
        rating: book.rating ?? null,
        pagesRead: getReadPages(book)
    };
}

// Виконує операцію та очікує завершення всієї транзакції
async function runBooksTransaction(mode, operation) {
    const db = await openDB();

    try {
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(BOOKS_STORE, mode);
            const store = tx.objectStore(BOOKS_STORE);
            let request;

            tx.oncomplete = () => {
                resolve(request.result);
            };

            tx.onabort = () => {
                reject(
                    tx.error ||
                    new Error('Транзакцію IndexedDB скасовано')
                );
            };

            try {
                request = operation(store);
            } catch (error) {
                tx.abort();
                reject(error);
            }
        });
    } finally {
        db.close();
    }
}

// Створення або запис книги
async function addItem(item) {
    const record = toBookRecord(item);

    return runBooksTransaction(
        'readwrite',
        store => store.put(record)
    );
}

// Оновлення книги за її id
async function updateItem(item) {
    const record = toBookRecord(item);

    return runBooksTransaction(
        'readwrite',
        store => store.put(record)
    );
}

// Отримання всіх книг
async function getAllItems() {
    return runBooksTransaction(
        'readonly',
        store => store.getAll()
    );
}

// Видалення книги за її id
async function deleteItem(id) {
    return runBooksTransaction(
        'readwrite',
        store => store.delete(id)
    );
}

// Одноразове перенесення книг із localStorage до IndexedDB
async function migrateFromLocalStorage() {
    if (localStorage.getItem(MIGRATION_KEY) === 'true') {
        return 0;
    }

    const savedBooks = loadFromLocalStorage();

    if (savedBooks.length === 0) {
        return 0;
    }

    const existingBooks = await getAllItems();
    let migratedCount = 0;

    // Переносимо дані лише в порожнє сховище
    if (existingBooks.length === 0) {
        await runBooksTransaction('readwrite', store => {
            let request;

            for (const book of savedBooks) {
                request = store.put(toBookRecord(book));
            }

            return request;
        });

        migratedCount = savedBooks.length;
    }

    // Повторно старі дані не переносимо
    localStorage.setItem(MIGRATION_KEY, 'true');

    return migratedCount;
}

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
            type: String,
            required: true,
            validator: value =>
                ['planned', 'reading', 'completed'].includes(value)
        },
        disabled: {
            type: Boolean,
            default: false
        },
        pagesRead: {
            type: Number,
            default: 0
        }
    },

    computed: {
        progressPercent() {
            if (this.pages <= 0) {
                return 0;
            }

            return Math.min(
                100,
                Math.max(0, (this.pagesRead / this.pages) * 100)
            );
        }
    },

    methods: {
        // Передає новий прогрес батьківському компоненту
        submitProgress() {
            const pagesRead = this.$refs.pageInput.valueAsNumber;

            this.$emit('progress', {
                id: this.id,
                pagesRead: pagesRead
            });
        }
    },

    emits: ['toggle', 'remove', 'progress'],

    template: `
        <article
            class="book-card"
            :class="{ unread: status !== 'completed' }"
            :data-pages="pages"
        >
            <h3>{{ title }}</h3>

            <p>Автор: {{ author }}</p>

            <p>Кількість сторінок: {{ pages }}</p>

            <div class="reading-progress">
                <p class="reading-progress__text">
                    Сторінка {{ pagesRead }} із {{ pages }}
                </p>
            
                <div
                    class="reading-progress__track"
                    role="progressbar"
                    :aria-label="'Прогрес читання книги ' + title"
                    aria-valuemin="0"
                    :aria-valuemax="pages"
                    :aria-valuenow="pagesRead"
                >
                    <div
                        class="reading-progress__fill"
                        :style="{ width: progressPercent + '%' }"
                    ></div>
                </div>
            </div>
            
            <form
                class="reading-progress-form"
                @submit.prevent="submitProgress"
            >
                <label :for="'reading-page-' + id">
                    Оновити сторінку:
                </label>
            
                <div class="reading-progress-controls">
                    <input
                        :id="'reading-page-' + id"
                        ref="pageInput"
                        type="number"
                        :value="pagesRead"
                        min="0"
                        :max="pages"
                        step="1"
                        required
                        :disabled="disabled"
                    >
            
                    <button type="submit" :disabled="disabled">
                        Зберегти
                    </button>
                </div>
            </form>

            <p>
                Статус:
                <button
                    type="button"
                    class="status"
                    :disabled="disabled"
                    :class="{
                        'status-planned': status === 'planned',
                        'status-reading': status === 'reading',
                        'status-completed': status === 'completed'
                    }"
                    @click="$emit('toggle', id)"
                >
                    {{
                        status === 'completed'
                            ? 'Прочитано'
                            : status === 'reading'
                                ? 'Читаю'
                                : 'У планах'
                    }}
                </button>
            </p>
            <button
                type="button"
                class="delete-book-button"
                :disabled="disabled"
                @click="$emit('remove', id)"
            >
                Видалити
            </button>
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
            books: [],
            statusFilter: 'all',
            busy: true,
            ready: false,
            storageError: ''
        };
    },

    computed: {
        filteredBooks() {
            if (this.statusFilter === 'all') {
                return this.books;
            }

            return this.books.filter(
                book => book.status === this.statusFilter
            );
        }
    },

    // Завантаження книг з обробкою помилки доступу до бази
    async mounted() {
        try {
            await migrateFromLocalStorage();
            await this.refreshBooks();
            this.ready = true;
        } catch (error) {
            console.error('Помилка завантаження IndexedDB:', error);

            this.ready = false;

            this.storageError =
                'Не вдалося відкрити базу даних або завантажити книги. ' +
                'Перевірте, чи дозволено браузеру зберігати дані сайту, ' +
                'та спробуйте оновити сторінку.';
        } finally {
            this.busy = false;
        }
    },

    methods: {
        // Завантажує записи та оновлює список і навчальні підрахунки
        async refreshBooks() {
            const items = (await getAllItems()).map(toBookRecord);

            // Зберігаємо посилання на реактивний масив
            this.books.splice(0, this.books.length, ...items);

            calculateReadPages(this.books);

            for (const book of this.books) {
                if (book.status !== 'completed') {
                    console.log(`Ще не прочитано: ${book.title}`);
                }
            }

            if (this.books.length > 0) {
                console.log(
                    `Сторінок на день: ${
                        pagesPerDay(this.books[0].pages, 10)
                    }`
                );
            }
        },

        // Виконує зміну в базі та оновлює список
        async runBookAction(action) {
            if (this.busy || !this.ready) {
                return false;
            }

            this.busy = true;
            this.storageError = '';

            try {
                await action();
                await this.refreshBooks();
                return true;
            } catch (error) {
                console.error(error);
                this.storageError =
                    'Не вдалося виконати операцію з книгами.';
                return false;
            } finally {
                this.busy = false;
            }
        },

        async toggleStatus(id) {
            const book = this.books.find(book => book.id === id);

            if (!book) {
                return;
            }

            const statuses = ['planned', 'reading', 'completed'];
            const index = statuses.indexOf(book.status);

            const updatedBook = {
                ...book,
                status: statuses[(index + 1) % statuses.length]
            };

            await this.runBookAction(
                () => updateItem(updatedBook)
            );
        },

        // Зберігає поточну сторінку та узгоджує статус книги
        async updateProgress({ id, pagesRead }) {
            const book = this.books.find(book => book.id === id);

            if (!book) {
                return;
            }

            const status = pagesRead === book.pages
                ? 'completed'
                : pagesRead > 0
                    ? 'reading'
                    : 'planned';

            const updatedBook = {
                ...book,
                pagesRead: pagesRead,
                status: status
            };

            await this.runBookAction(
                () => updateItem(updatedBook)
            );
        },

        async removeBook(id) {
            await this.runBookAction(
                () => deleteItem(id)
            );
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
// Додає книгу в IndexedDB та оновлює список
form.addEventListener('submit', async event => {
    event.preventDefault();

    if (!booksVm.ready || booksVm.busy) {
        return;
    }

    const title = document.querySelector('#book-title').value.trim();
    const author = document.querySelector('#book-author').value.trim();
    const pages = Number(document.querySelector('#book-pages').value);
    const status = document.querySelector('#book-status').value;

    const newBook = {
        id: Math.max(0, ...books.map(book => book.id)) + 1,
        title: title,
        author: author,
        pages: pages,
        status: status,
        rating: null,
        pagesRead: status === 'completed' ? pages : 0
    };

    const saved = await booksVm.runBookAction(
        () => addItem(newBook)
    );

    if (saved) {
        form.reset();
    }
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
        if (books[i].status === 'completed') {
            totalPages += books[i].pages;
        }
    }

    console.log(`Сумарна кількість сторінок прочитаних книг: ${totalPages}`);
}

// Обчислює кількість сторінок для читання за один день
const pagesPerDay = (pages, days) => Math.round(pages / days);

// Синхронізація наявного лічильника зі станом книг
// Оновлює статистику після завантаження та зміни книг
Vue.watch(
    () => [
        books.length,
        books.filter(book => book.status === 'completed').length
    ],

    ([total, completed]) => {
        booksCount.textContent = `Усього книг: ${total}`;
        completedCount.textContent = `Прочитано: ${completed}`;
    },

    { immediate: true }
);
