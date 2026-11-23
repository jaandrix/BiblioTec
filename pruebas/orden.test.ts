import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apellidos, claveColor, ordenar, tituloParaOrdenar } from '../src/libros/orden.ts'
import type { Libro } from '../src/tipos.ts'

const l = (titulo: string, autor: string, extra: Partial<Libro> = {}): Libro =>
  ({ id: titulo, tipo: 'libro', titulo, autor, anio: null, paginas: null, portada: null, ...extra })

test('apellidos', () => {
  assert.equal(apellidos('Gabriel García Márquez'), 'García Márquez')
  assert.equal(apellidos('J. R. R. Tolkien'), 'Tolkien')
  assert.equal(apellidos('George R. R. Martin'), 'Martin')
  assert.equal(apellidos('Antoine de Saint-Exupéry'), 'Saint-Exupéry')
  assert.equal(apellidos('Homero'), 'Homero')
})

test('alfabético ignora artículos y signos', () => {
  assert.equal(tituloParaOrdenar('El juego del ángel'), 'juego del ángel')
  assert.equal(tituloParaOrdenar('The Hobbit'), 'Hobbit')
  const r = ordenar([l('The Hobbit', 'x'), l('El amor', 'x'), l('Ábaco', 'x')], 'alfabetico').map(x => x.titulo)
  assert.deepEqual(r, ['Ábaco', 'El amor', 'The Hobbit'])
})

test('autor por apellido y, dentro de una saga, por tomo', () => {
  const r = ordenar([
    l('Dos', 'J. K. Rowling', { saga: 'HP', tomo: 2 }),
    l('Uno', 'J. K. Rowling', { saga: 'HP', tomo: 1 }),
    l('Cien años', 'Gabriel García Márquez'),
    l('Hobbit', 'J. R. R. Tolkien'),
  ], 'autor').map(x => x.titulo)
  assert.deepEqual(r, ['Cien años', 'Uno', 'Dos', 'Hobbit'])
})

test('saga primero, sueltos al final', () => {
  const r = ordenar([l('Suelto', 'a'), l('B2', 'a', { saga: 'B', tomo: 2 }), l('A1', 'a', { saga: 'A', tomo: 1 }), l('B1', 'a', { saga: 'B', tomo: 1 })], 'saga').map(x => x.titulo)
  assert.deepEqual(r, ['A1', 'B1', 'B2', 'Suelto'])
})

test('año con vacíos al final', () => {
  const r = ordenar([l('a', 'x', { anio: 2000 }), l('b', 'x'), l('c', 'x', { anio: 1900 })], 'anio').map(x => x.titulo)
  assert.deepEqual(r, ['c', 'a', 'b'])
})

test('color: arcoíris y grises al final', () => {
  const colores: Record<string, string> = { rojo: '#c0392b', azul: '#2e5fa8', verde: '#2f8f4e', negro: '#111111', blanco: '#f4f4f4' }
  const r = ordenar(Object.keys(colores).map(k => l(k, 'x')), 'color', x => colores[x.titulo]).map(x => x.titulo)
  assert.deepEqual(r, ['rojo', 'verde', 'azul', 'blanco', 'negro'])
  assert.ok(claveColor('#808080') >= 1000)
})

test('fecha de alta: lo más nuevo primero', () => {
  const r = ordenar([l('viejo', 'x', { alta: '2025-01-01' }), l('nuevo', 'x', { alta: '2026-01-01' })], 'alta').map(x => x.titulo)
  assert.deepEqual(r, ['nuevo', 'viejo'])
})
