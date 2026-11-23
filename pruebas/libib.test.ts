import assert from 'node:assert/strict'
import { test } from 'node:test'
import { consolaDe, deLibib, leerCsv } from '../src/libib.ts'

const CSV = `﻿"item_type","title","creators","first_name","last_name","ean_isbn13","upc_isbn10","description","publisher","publish_date","group","tags","notes"
"book","Dune","Frank Herbert","Frank","Herbert","9780441013593","0441013597","Una saga, con comas","Ace","2005-08-02","Ciencia ficción","",""
"video game","Halo 3","Bungie","","","","882224444325","","Microsoft","2007-09-25","","Xbox 360",""
"video game","Gears of War","Epic","","","","","","Microsoft","2006","","",""
"movie","Dune","Denis Villeneuve","","","","","Blu-ray","WB","2021","","",""`

test('lee el csv de libib con comillas y comas dentro', () => {
  const filas = leerCsv(CSV)
  assert.equal(filas.length, 4)
  assert.equal(filas[0].title, 'Dune')
  assert.equal(filas[0].description, 'Una saga, con comas')
  assert.equal(filas[0].item_type, 'book')
})

test('tipos, portada por isbn, género por grupo y consola', () => {
  const { libros, sinConsola } = deLibib(leerCsv(CSV), null)
  const [libro, halo, gears, peli] = libros
  assert.equal(libro.tipo, 'libro')
  assert.equal(libro.genero, 'ciencia ficción')
  assert.ok(libro.portada?.includes('9780441013593'))
  assert.equal(halo.tipo, 'videojuego')
  assert.equal(halo.plataforma, 'xbox 360')
  assert.equal(gears.plataforma, undefined)
  assert.equal(sinConsola, 1)
  assert.equal(peli.tipo, 'pelicula')
  assert.equal(peli.formato, 'bluray')
})

test('consola por defecto para los que no la dicen', () => {
  const { libros, sinConsola } = deLibib(leerCsv(CSV), 'xbox 360')
  assert.equal(libros[2].plataforma, 'xbox 360')
  assert.equal(sinConsola, 0)
  assert.equal(consolaDe('Nintendo DS'), 'ds')
  assert.equal(consolaDe('New Nintendo 3DS'), '3ds')
})
