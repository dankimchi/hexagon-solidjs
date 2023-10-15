
import { Show, Switch, Match, createSignal, For, createEffect, Setter } from "solid-js";
import { render } from "solid-js/web";

import { generateHexagon, randomize, Hexagon, Cell } from "./hexagon";

import styles from "./app.module.css";
import rng from "./rng";

enum gamePhases {
  titleScreen,
  memorization,
  pickingCombinations,
  wrong,
  correct,
  alreadyCalled,
  allDone,
  giveUp
}

const min = 1;

function App() {
  const [max, setMax] = createSignal(6);
  const [memoTime, setMemoTime] = createSignal(30);
  const [hexagon, setHexagon] = createSignal<Hexagon | null>(null);
  const [points, setPoints] = createSignal(0);
  const [points2, setPoints2] = createSignal(0);
  const [twoPlayersMode, setTwoPlayersMode] = createSignal(false);
  const [twoPlayersSetting, setTwoPlayersSetting] = createSignal(false);
  const [time, setTime] = createSignal<number | null>(null);
  const [phase, setPhase] = createSignal<gamePhases>(gamePhases.titleScreen);
  const [sum, setSum] = createSignal<number | null>(null);
  const [combo, setCombo] = createSignal<string>("");
  const [calledCombos, setCalledCombos] = createSignal<string[]>([]);
  const [comboLoop, setComboLoop] = createSignal<number>(0);

  function startGame() {
    setPhase(gamePhases.memorization);
    setCombo("");
    setCalledCombos([]);
    if (twoPlayersSetting() != twoPlayersMode()) resetPoints();
    setTwoPlayersMode(twoPlayersSetting());
    const h = generateHexagon();
    randomize(h, min, max());
    setHexagon(h);

    // pick sum from one of the top 3 repeated sums
    setSum(parseInt(hexagon().sortedByRarity[rng(0, 2)]));
    // console.dir(hexagon().rarity);
    setTime(memoTime());
  }

  function click(cell: Cell, pointSetter: Setter<number>) {
    if (cell && phase() == gamePhases.pickingCombinations) {
      if (combo().includes(cell.letter)) {
        setCombo(combo().replace(cell.letter, ""));
      } else {
        let newCombo = Array.from(combo() + cell.letter)
          .sort()
          .join("");
        setCombo(newCombo);
        if (newCombo.length > 2) {
          if (calledCombos().includes(newCombo)) {
            pointSetter(p => p - 1);
            showResponseToUser(gamePhases.alreadyCalled, 1000);
          }
          // check if combo of 3 letters has correct sum
          else if (hexagon().sums[newCombo] == sum()) {
            pointSetter(p => p + 1);
            setCalledCombos(calledCombos().concat(newCombo));
            if (calledCombos().length == hexagon().rarity[sum()] - 1)
              setPhase(gamePhases.allDone);
            else
              showResponseToUser(gamePhases.correct, 2000);
          } else {
            pointSetter(p => p - 1);
            showResponseToUser(gamePhases.wrong, 1000);
          }
        }
      }
    }
  }

  function keyPress(e: KeyboardEvent) {
    click(hexagon().cells?.[e.key], twoPlayersMode() ? setPoints2 : setPoints);
  }

  function giveUp() {
    setPhase(gamePhases.giveUp);
    setCalledCombos(Object.entries(hexagon().sums).filter(([_, s]) => s == sum()).map(([c]) => c));
  }

  function showResponseToUser(phase: gamePhases, delay: number) {
    setPhase(phase);
    setTimeout(() => {
      setPhase(gamePhases.pickingCombinations);
      setCombo("");
    }, delay);
  }

  setInterval(() => {
    switch (phase()) {
      case gamePhases.memorization:
        if (time() > 0) setTime(time() - 1);
        else setPhase(gamePhases.pickingCombinations);
        break;
      case gamePhases.giveUp:
        let c = calledCombos().length - 1;
        setCombo(calledCombos()[setComboLoop(l => l >= c ? 0 : l + 1)]);
        break;
    }
  }, 1000);

  function resetPoints() {
    setPoints2(setPoints(0));
  }

  return (
    <>
      <div class={styles.main} onKeyPress={keyPress} tabIndex={0}>
        <Show when={phase() != gamePhases.titleScreen}>
          <div class={styles.big}>
            {twoPlayersMode() ? 'Mouse:' : 'Points:'}
            {points()}&nbsp;
            <Show when={twoPlayersMode()}>
              Keyboard: {points2()}
            </Show>&nbsp;
            <button onClick={resetPoints}>Reset points</button>
          </div>
          <div
            class={styles.big}
            classList={{
              [styles.red]: phase() == gamePhases.memorization && time() < 10,
            }}
          >
            Time: {time()}
          </div>
          <div class={styles.big}>
            Target: {phase() != gamePhases.memorization ? sum() : "???"}
          </div>
        </Show>
        <For each={hexagon()?.rows}>
          {(row) => (
            <div class={styles.row}>
              <For each={row}>
                {(cell: Cell) => (
                  <div
                    classList={{
                      [styles.cell]: true,
                      [styles.big]: true,
                      [styles.clicked]: combo().includes(cell.letter),
                    }}
                    onClick={() => click(cell, setPoints)}
                  >
                    {[gamePhases.memorization, gamePhases.giveUp].includes(phase()) ||
                      phase() == gamePhases.correct && combo().includes(cell.letter)
                      ? cell.number
                      : cell.letter}
                  </div>
                )}
              </For>
            </div>
          )}
        </For>
        <div class={styles.messages}>
          <Switch>
            <Match when={phase() == gamePhases.wrong}>
              <div class={styles.red}>Wrong</div>
            </Match>
            <Match when={phase() == gamePhases.alreadyCalled}>
              <div class={styles.red}>Already called</div>
            </Match>
            <Match when={phase() == gamePhases.correct}>
              <div>Correct! +1 points</div>
            </Match>
            <Match when={phase() == gamePhases.giveUp}>
              <div>{calledCombos().length} combinations</div>
            </Match>
            <Match when={phase() == gamePhases.allDone}>
              All done! <button onClick={startGame}>New round</button>?
            </Match>
          </Switch>
        </div>
        <Switch>
          <Match when={phase() == gamePhases.titleScreen}>
            <p>Game "Hexagon" as played in Korean game show <a href="https://www.netflix.com/title/81653386">Devil's Plan</a>.</p>
          </Match>
          <Match when={phase() == gamePhases.memorization}>
            <p>Try to memorize numbers on the hexagon within {memoTime()} seconds.</p>
          </Match>
          <Match when={phase() == gamePhases.pickingCombinations}>
            <p>Now, find all combinations of 3 cells going in one line (horizonthally or diagonally) with sum of the numbers being {sum()} or just <button onClick={giveUp}>give up</button></p>
            <p>You can click on a cell or press it's letter on a keyboard to select/deselect.</p>
          </Match>
        </Switch>

        <button onClick={startGame}>
          {phase() == gamePhases.titleScreen
            ? "Start the game"
            : "Restart the game"}
        </button>
        <label>
          <input type="checkbox" checked={twoPlayersSetting()} onInput={e => setTwoPlayersSetting(e.target.checked)} />Two players mode (keyboard vs mouse)
        </label>

        <p>when restarting, hexagon will be filled with numbers
          from {min} to <input type='number' value={max()} onInput={e => setMax(parseInt(e.currentTarget.value))} />.</p>
        <p>Time for memorization: <input type='number' value={memoTime()} onInput={e => setMemoTime(parseInt(e.currentTarget.value))} /> seconds.</p>
      </div>
    </>
  );
}

render(App, document.body)