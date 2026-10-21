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

console.log(books);

// Вибір контейнера для списку книг
const booksList = document.querySelector('#books-list');

// Знаходить і видаляє статичний приклад картки
const staticBookCard = document.querySelector('.book-card');

if (staticBookCard) {
    staticBookCard.remove();
}

// Рендер карток книг із масиву
function renderBooks(books) {
    for (const book of books) {
        const article = document.createElement('article');
        const title = document.createElement('h3');
        const author = document.createElement('p');

        // Додавання класу та атрибута
        article.classList.add('book-card');
        article.setAttribute('data-pages', book.pages);

        // Позначення непрочитаної книги
        if (!book.finished) {
            article.classList.add('unread');
        }

        // Заповнення даних картки
        title.textContent = book.title;
        author.textContent = `Автор: ${book.author}`;

        // Додавання елементів у DOM
        article.append(title, author);
        booksList.append(article);
    }
}

// Виведення книг на сторінку
renderBooks(books);

// Оновлення кількості книг
const booksCount = document.querySelector('#books-count');

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