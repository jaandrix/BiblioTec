// Genera src/datos/libros-demo.json desde Open Library: los libros de ejemplo
// de la fase 1, mientras no existe el enlace con Bitácora.
import { writeFile } from 'node:fs/promises';

const LIBROS = [
  ['Dune', 'Frank Herbert', 'Dune', 1], ['Dune Messiah', 'Frank Herbert', 'Dune', 2], ['Children of Dune', 'Frank Herbert', 'Dune', 3],
  ['Harry Potter and the Philosopher\'s Stone', 'J. K. Rowling', 'Harry Potter', 1], ['Harry Potter and the Chamber of Secrets', 'J. K. Rowling', 'Harry Potter', 2],
  ['Harry Potter and the Prisoner of Azkaban', 'J. K. Rowling', 'Harry Potter', 3], ['Harry Potter and the Goblet of Fire', 'J. K. Rowling', 'Harry Potter', 4],
  ['The Fellowship of the Ring', 'J. R. R. Tolkien', 'El Señor de los Anillos', 1], ['The Two Towers', 'J. R. R. Tolkien', 'El Señor de los Anillos', 2],
  ['The Return of the King', 'J. R. R. Tolkien', 'El Señor de los Anillos', 3], ['The Hobbit', 'J. R. R. Tolkien'],
  ['A Game of Thrones', 'George R. R. Martin', 'Canción de hielo y fuego', 1], ['A Clash of Kings', 'George R. R. Martin', 'Canción de hielo y fuego', 2],
  ['Cien años de soledad', 'Gabriel García Márquez'], ['El amor en los tiempos del cólera', 'Gabriel García Márquez'],
  ['Don Quijote de la Mancha', 'Miguel de Cervantes'], ['La sombra del viento', 'Carlos Ruiz Zafón'], ['El juego del ángel', 'Carlos Ruiz Zafón'],
  ['1984', 'George Orwell'], ['Animal Farm', 'George Orwell'], ['Brave New World', 'Aldous Huxley'], ['Fahrenheit 451', 'Ray Bradbury'],
  ['The Great Gatsby', 'F. Scott Fitzgerald'], ['Pride and Prejudice', 'Jane Austen'], ['Jane Eyre', 'Charlotte Brontë'],
  ['Frankenstein', 'Mary Shelley'], ['Dracula', 'Bram Stoker'], ['Crime and Punishment', 'Fyodor Dostoevsky'],
  ['The Little Prince', 'Antoine de Saint-Exupéry'], ['El Principito', 'Antoine de Saint-Exupéry'], ['Siddhartha', 'Hermann Hesse'],
  ['Sapiens', 'Yuval Noah Harari'], ['Project Hail Mary', 'Andy Weir'], ['The Martian', 'Andy Weir'],
  ['The Name of the Wind', 'Patrick Rothfuss'], ['Mistborn', 'Brandon Sanderson'], ['The Way of Kings', 'Brandon Sanderson'],
  ['Neuromancer', 'William Gibson'], ['Foundation', 'Isaac Asimov'], ['I, Robot', 'Isaac Asimov'],
  ['The Hitchhiker\'s Guide to the Galaxy', 'Douglas Adams'], ['Norwegian Wood', 'Haruki Murakami'], ['Kafka on the Shore', 'Haruki Murakami'],
  ['La casa de los espíritus', 'Isabel Allende'], ['Rayuela', 'Julio Cortázar'], ['Ficciones', 'Jorge Luis Borges'],
  ['Patria', 'Fernando Aramburu'], ['El infinito en un junco', 'Irene Vallejo'],
];

const campos = 'key,title,author_name,first_publish_year,number_of_pages_median,cover_i';
const salida = [];
for (const [titulo, autor, saga, tomo] of LIBROS) {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(titulo)}&author=${encodeURIComponent(autor)}&fields=${campos}&limit=1`;
  const r = await fetch(url, { headers: { 'User-Agent': 'BiblioTec/0.1 (proyecto personal)' } });
  const d = (await r.json()).docs?.[0];
  if (!d) { console.warn('sin resultado:', titulo); continue; }
  salida.push({
    id: 'demo_' + d.key.split('/').pop(),
    tipo: 'libro',
    titulo: d.title, autor: d.author_name?.[0] ?? autor,
    anio: d.first_publish_year ?? null, paginas: d.number_of_pages_median ?? null,
    portada: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null,
    ...(saga ? { saga, tomo } : {}),
  });
  console.log('ok', d.title);
  await new Promise(res => setTimeout(res, 400));
}
// Después se añadieron a mano `genero` y `alta` (fecha de alta inventada) a cada libro.
await writeFile(new URL('../src/datos/libros-demo.json', import.meta.url), JSON.stringify(salida, null, 2) + '\n');
console.log(salida.length, 'libros');
