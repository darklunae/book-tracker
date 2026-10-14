console.log('script.js підключено');

// Масив об'єктів із даними про книги
const books = [
    {
        title: '1984',
        pages: 328,
        finished: true
    },
    {
        title: 'Прекрасний новий світ',
        pages: 288,
        finished: true
    },
    {
        title: 'Квіти для Елджернона',
        pages: 320,
        finished: false
    },
    {
        title: 'Парфуми. Історія одного вбивці',
        pages: 304,
        finished: true
    }
];

console.log(books);

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