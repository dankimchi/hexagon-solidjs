

import rng from "./rng";


export class Hexagon {
constructor(cells: Record<letter, Cell>,rows:Cell[][],combinations:string[]){
  this.cells=cells;
  this.rows=rows;
  this.combinations=combinations;
}

  rows: Cell[][];
  cells: Record<letter, Cell>;
  combinations: string[];
  sums: Record<string, number>;
  rarity: Record<number, number>;
  sortedByRarity: string[];
}

enum directions {
  downleft,
  downright,
  right,
}
export type letter = string;

export interface Cell {
  letter: string;
  number: number;
  connection: { [index in directions]: letter };
}

export function randomize(h: Hexagon, min: number, max: number) {
  for (let letter in h.cells)
    h.cells[letter].number = rng(min, max);

  h.sums = {};
  h.rarity = {};
  h.sortedByRarity = [];

  for (let c of h.combinations) {
    let sum = 0;

    for (let letter of c) sum += h.cells[letter].number;
    h.sums[c] = sum;

    if (!h.rarity[sum]) h.rarity[sum] = 0;
    h.rarity[sum]++;
  }

  h.sortedByRarity = Object.entries(h.rarity)
    .sort((a, b) => (a[1] > b[1] ? -1 : 1))
    .map((a) => a[0]);
}

export function generateHexagon() {
  const rows: Cell[][] = [];
  const cells: Record<letter, Cell> = {};

  function fillRow(row: string, nextRow: string) {
    const upperHalf = row.length < nextRow?.length;
    const hRow: Cell[] = [];
    for (let i = 0; i < row.length; i++) {
      const cell: Cell = {
        letter: row[i],
        number: 0,
        connection: {
          [directions.right]: row[i + 1] || undefined,
          [directions.downleft]: nextRow?.[upperHalf ? i : i - 1] || undefined,
          [directions.downright]: nextRow?.[upperHalf ? i + 1 : i] || undefined,
        },
      };
      hRow.push(cell);
      cells[row[i]] = cell;
    }
    rows.push(hRow);
  }

  const lines = "abc|defg|hijkl|mnop|qrs".split("|");

  for (let i = 0; i < lines.length; i++) fillRow(lines[i], lines[i + 1]);

  const combinations = [];

  for (let letter in cells)
    for (let [_, dir] of Object.entries(directions)) {
      let secondLetter = cells[letter]?.connection[dir];
      let thirdLetter = cells[secondLetter]?.connection[dir];

      if (secondLetter && thirdLetter)
        combinations.push(letter + secondLetter + thirdLetter);
    }
    
  return new Hexagon(cells,rows,combinations);
}