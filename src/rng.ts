import seedrandom from 'seedrandom';

seedrandom('eugeneAndRegina', { global: true });

export default function rng(min: number, max: number) {
  return Math.round(Math.random() * (max - min)) + min;
}