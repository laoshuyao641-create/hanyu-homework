const L3 = [
  { pinyin: "nián", initial: "n", final: "ian", audio: "audio/lesson3/syllable-01.wav", review: false },
  { pinyin: "qín", initial: "q", final: "in", audio: "audio/lesson3/syllable-02.wav", review: false },
  { pinyin: "jué", initial: "j", final: "üe", audio: "audio/lesson3/syllable-03.wav", review: false },
  { pinyin: "xìn", initial: "x", final: "in", audio: "audio/lesson3/syllable-04.wav", review: false },
  { pinyin: "qián", initial: "q", final: "ian", audio: "audio/lesson3/syllable-05.wav", review: false },
  { pinyin: "liú", initial: "l", final: "iu", audio: "audio/lesson3/syllable-06.wav", review: false },
  { pinyin: "yuán", initial: "y", final: "üan", audio: "audio/lesson3/syllable-07.wav", review: false },
  { pinyin: "xìn", initial: "x", final: "in", audio: "audio/lesson3/syllable-08.wav", review: false },
  { pinyin: "piào", initial: "p", final: "iao", audio: "audio/lesson3/syllable-09.wav", review: false }
];

const REVIEW_WORDS = [
  { pinyin: "bāo", initial: "b", final: "ao", audio: "audio/review/bao.wav", review: true },
  { pinyin: "méi", initial: "m", final: "ei", audio: "audio/review/mei.wav", review: true },
  { pinyin: "nǎi", initial: "n", final: "ai", audio: "audio/review/nai.wav", review: true },
  { pinyin: "tóu", initial: "t", final: "ou", audio: "audio/review/tou.wav", review: true },
  { pinyin: "hái", initial: "h", final: "ai", audio: "audio/review/hai.wav", review: true },
  { pinyin: "fēi", initial: "f", final: "ei", audio: "audio/review/fei.wav", review: true }
];

const WORDS = [...L3, ...REVIEW_WORDS];

const MODES = [
  {
    id: "initial",
    label: "题型一 / Task 1",
    title: "听音辨声母",
    instruction: "听录音，选择你听到的声母。<br />Listen and choose the correct initial.",
    prompt: "选择声母 / Choose the initial",
    optionKey: "initial",
    pool: [L3[0], L3[1], L3[2], L3[3], L3[4], REVIEW_WORDS[0], REVIEW_WORDS[1], REVIEW_WORDS[2], REVIEW_WORDS[3], REVIEW_WORDS[4]]
  },
  {
    id: "final",
    label: "题型二 / Task 2",
    title: "听音辨韵母",
    instruction: "听录音，选择你听到的韵母。<br />Listen and choose the correct final.",
    prompt: "选择韵母 / Choose the final",
    optionKey: "final",
    pool: [...L3, REVIEW_WORDS[0]]
  },
  {
    id: "syllable",
    label: "题型三 / Task 3",
    title: "听音选音节",
    instruction: "听录音，选择完整的音节。<br />Listen and choose the complete syllable.",
    prompt: "选择音节 / Choose the syllable",
    optionKey: "pinyin",
    pool: [...L3, REVIEW_WORDS[5]]
  }
];

const state = {
  name: "",
  modeIndex: 0,
  questionIndex: 0,
  totalScore: 0,
  modeScores: [0, 0, 0],
  answered: false,
  questionsByMode: [],
  currentOptions: []
};

let currentAudio = null;
let activePlayButton = null;

const $ = (id) => document.getElementById(id);

function shuffle(items) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function uniqueValues(key) {
  return [...new Set(WORDS.map((w) => w[key]))];
}

function buildOptions(word, key) {
  const correct = word[key];
  let pool;
  if (key === "initial") {
    pool = ["j", "q", "x", "b", "m", "n", "t", "h", "f"].filter((value) => value !== correct);
  } else {
    pool = uniqueValues(key).filter((value) => value !== correct);
  }
  const distractors = shuffle(pool).slice(0, 3);
  return shuffle([correct, ...distractors]);
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (activePlayButton) {
    activePlayButton.classList.remove("playing");
    activePlayButton.textContent = "▶";
    activePlayButton = null;
  }
}

function playAudio(word, button) {
  stopAudio();
  const audio = new Audio(word.audio);
  currentAudio = audio;
  if (button) {
    activePlayButton = button;
    button.classList.add("playing");
    button.textContent = "Ⅱ";
  }
  audio.addEventListener("ended", () => {
    if (activePlayButton === button) {
      button.classList.remove("playing");
      button.textContent = "▶";
      activePlayButton = null;
    }
  });
  audio.play().catch(() => {
    if (button) {
      button.classList.remove("playing");
      button.textContent = "▶";
    }
  });
}

function currentWord() {
  return state.questionsByMode[state.modeIndex][state.questionIndex];
}

function renderHeader() {
  $("headerName").textContent = state.name || "未登录 / Not signed in";
}

function renderProgress() {
  const totalPerMode = MODES[state.modeIndex].pool.length;
  const overallIndex = state.modeIndex * 10 + state.questionIndex + 1;
  const overallTotal = 30;
  $("progressText").textContent = `第 ${state.questionIndex + 1} / ${totalPerMode} 题 · ${overallIndex} / ${overallTotal}`;
  $("progressFill").style.width = `${((overallIndex - 1) / overallTotal) * 100}%`;
  $("scoreText").textContent = String(state.totalScore);
}

function renderQuestion() {
  const mode = MODES[state.modeIndex];
  const word = currentWord();
  state.answered = false;
  state.currentOptions = buildOptions(word, mode.optionKey);

  $("taskLabel").textContent = mode.label;
  $("taskTitle").textContent = mode.title;
  $("taskInstruction").innerHTML = mode.instruction;
  $("questionPrompt").textContent = mode.prompt;
  $("feedback").className = "feedback";
  $("feedback").textContent = "";
  $("nextBtn").hidden = true;
  $("playBtn").classList.remove("playing");
  $("playBtn").textContent = "▶";
  const reviewBadge = $("reviewBadge");
  if (reviewBadge) {
    reviewBadge.hidden = !word.review;
  }
  renderProgress();

  const options = $("options");
  options.innerHTML = "";
  state.currentOptions.forEach((value) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.type = "button";
    btn.textContent = value;
    btn.addEventListener("click", () => answer(value, word, mode));
    options.appendChild(btn);
  });

  playAudio(word, $("playBtn"));
}

function answer(value, word, mode) {
  if (state.answered) {
    return;
  }
  state.answered = true;
  const correct = word[mode.optionKey];
  const isCorrect = value === correct;
  const buttons = [...document.querySelectorAll(".option-btn")];
  buttons.forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === correct) {
      btn.classList.add("correct");
    } else if (btn.textContent === value) {
      btn.classList.add("wrong");
    }
  });

  if (isCorrect) {
    state.totalScore += 1;
    state.modeScores[state.modeIndex] += 1;
    $("feedback").className = "feedback good";
    $("feedback").textContent = "答对了！ / Correct!";
  } else {
    $("feedback").className = "feedback try-again";
    $("feedback").textContent = `再听一次：正确答案是 ${correct}。 / Listen again: the correct answer is ${correct}.`;
  }
  renderProgress();
  $("nextBtn").hidden = false;
}

function nextQuestion() {
  stopAudio();
  state.questionIndex += 1;
  if (state.questionIndex >= MODES[state.modeIndex].pool.length) {
    state.questionIndex = 0;
    state.modeIndex += 1;
  }
  if (state.modeIndex >= MODES.length) {
    showFinish();
    return;
  }
  renderQuestion();
}

function showFinish() {
  $("gameScreen").hidden = true;
  $("finishScreen").hidden = false;
  $("finishTitle").textContent = `${state.name}，祝贺你完成了这次练习！`;
  $("finishEnglish").textContent = `Congratulations, ${state.name}! You have completed this practice.`;
  $("finalScore").textContent = `${state.totalScore} / 30`;
  $("modeScores").innerHTML = MODES.map((mode, index) => `
    <div class="mode-score">
      <span>${mode.title}</span>
      <strong>${state.modeScores[index]} / ${mode.pool.length}</strong>
    </div>
  `).join("");
  $("completionCode").textContent = `HY3-${state.name}-${state.totalScore}30`;
  renderHeader();
}

function resetPractice() {
  state.modeIndex = 0;
  state.questionIndex = 0;
  state.totalScore = 0;
  state.modeScores = [0, 0, 0];
  state.questionsByMode = MODES.map((mode) => shuffle(mode.pool));
}

function startGame() {
  const name = $("studentName").value.trim();
  if (!name) {
    $("studentName").focus();
    $("studentName").placeholder = "请先填写中文名 / Please enter your Chinese name";
    return;
  }
  state.name = name;
  localStorage.setItem("hanyuHomeworkName", name);
  resetPractice();
  $("loginScreen").hidden = true;
  $("finishScreen").hidden = true;
  $("gameScreen").hidden = false;
  renderHeader();
  renderQuestion();
}

function init() {
  const savedName = localStorage.getItem("hanyuHomeworkName");
  if (savedName) {
    $("studentName").value = savedName;
  }
  $("startBtn").addEventListener("click", startGame);
  $("studentName").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      startGame();
    }
  });
  $("playBtn").addEventListener("click", () => playAudio(currentWord(), $("playBtn")));
  $("nextBtn").addEventListener("click", nextQuestion);
  $("printBtn").addEventListener("click", () => window.print());
  $("againBtn").addEventListener("click", () => {
    resetPractice();
    $("finishScreen").hidden = true;
    $("gameScreen").hidden = false;
    renderHeader();
    renderQuestion();
  });
}

init();
