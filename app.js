let quizConfig = {
  creatorName: "",
  gender: "male",
  questionCount: 10,
  answers: []
};

let activeQuizData = null;
let currentQuestionIndex = 0;
let takerAnswers = [];
let takerName = "";
let finalShortUrl = "";

function selectGender(g) {
  quizConfig.gender = g;
  document.getElementById('gender-male').className = 'gender-btn ' + (g === 'male' ? 'active-male' : '');
  document.getElementById('gender-female').className = 'gender-btn ' + (g === 'female' ? 'active-female' : '');
}

function selectCount(count) {
  quizConfig.questionCount = count;
  const btns = document.querySelectorAll('.count-btn');
  btns.forEach(b => b.classList.remove('active'));
  if (event && event.target) {
    event.target.classList.add('active');
  }
}

function startCreatingQuiz() {
  const nameInput = document.getElementById('creator-name').value.trim();
  if (!nameInput) {
    alert("يرجى كتابة اسمك أولاً!");
    return;
  }
  quizConfig.creatorName = nameInput;
  quizConfig.answers = [];
  currentQuestionIndex = 0;

  showScreen('creator-quiz-screen');
  renderCreatorQuestion();
}

function renderCreatorQuestion() {
  const q = QUESTION_BANK[currentQuestionIndex];
  const total = quizConfig.questionCount;

  document.getElementById('creator-progress').style.width = `${((currentQuestionIndex) / total) * 100}%`;
  document.getElementById('creator-step-text').innerText = `سؤال ${currentQuestionIndex + 1} من ${total}`;
  document.getElementById('creator-question-title').innerText = q.question;

  const container = document.getElementById('creator-options-container');
  container.innerHTML = "";

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.innerText = opt;
    btn.onclick = () => saveCreatorAnswer(idx);
    container.appendChild(btn);
  });
}

function saveCreatorAnswer(optionIdx) {
  quizConfig.answers.push(optionIdx);
  currentQuestionIndex++;

  if (currentQuestionIndex < quizConfig.questionCount && currentQuestionIndex < QUESTION_BANK.length) {
    renderCreatorQuestion();
  } else {
    finishQuizCreation();
  }
}

// دالة سريعة جداً مع نظام مهلة (Timeout) لضمان ظهور الرابط فوريًا بدون تعليق
async function finishQuizCreation() {
  showScreen('share-screen');
  const inputEl = document.getElementById('quiz-link-input');
  inputEl.value = "جاري تجهيز الرابط الشيك... ⚡";

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(quizConfig))));
  const longUrl = `${window.location.origin}${window.location.pathname}#quiz=${encoded}`;
  
  let shortUrl = longUrl;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // أقصى وقت انتظار 1.5 ثانية فقط

    const apiUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`;
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    const data = await response.json();
    const parsedData = JSON.parse(data.contents);

    if (parsedData.shorturl) {
      shortUrl = parsedData.shorturl;
    }
  } catch (e) {
    shortUrl = longUrl; // استخدام الرابط المباشر فوراً لو حصل أي تأخير
  }

  finalShortUrl = shortUrl;
  inputEl.value = finalShortUrl;
  // ضبط المؤشر وعرض بداية الرابط بوضوح
  inputEl.scrollLeft = 0;
  inputEl.setSelectionRange(0, 0);
}

function getShareText() {
  const link = finalShortUrl || document.getElementById('quiz-link-input').value;
  const isFemale = quizConfig.gender === 'female';
  
  if (isFemale) {
    return `✨ اختبار الصداقة ومستوى الحظر 💕\n\nأنا ${quizConfig.creatorName} عملت لكم اختبار إجاباته عني! 🙈🌸\nمين أكتر أخت وصاحبة فاهماني ومين هتاخد بلوك وتتحظر؟ 🚫👀\n\nادخلي اختبري نفسك ورجيني النتيجة من هنا: 👇\n${link}`;
  } else {
    return `🔥 اختبار درجة الصداقة ومستوى الحظر 🚫\n\nأنا ${quizConfig.creatorName} عملت اختبار تفاصيل ومعلومات عني! 😎\nتفتكر صاحب عمر وجدع وفاهم كل حاجة ولا على وشك البلوك؟ 🛑💣\n\nادخل جاوب وشوف درجتك فوراً من هنا: 👇\n${link}`;
  }
}

function copyQuizLink() {
  const shareText = getShareText();
  navigator.clipboard.writeText(shareText).then(() => {
    alert("تم نسخ رسالة الدعوة والابط بنجاح! تقدر تنزلها ستوري فوراً 📋✨");
  }).catch(() => {
    const input = document.getElementById('quiz-link-input');
    input.select();
    document.execCommand('copy');
    alert("تم نسخ الرابط! 📋");
  });
}

function shareToWhatsApp() {
  const text = getShareText();
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
}

window.onload = function() {
  const hash = window.location.hash;
  if (hash.includes('#quiz=')) {
    try {
      const base64Data = hash.split('#quiz=')[1];
      activeQuizData = JSON.parse(decodeURIComponent(escape(atob(base64Data))));
      document.getElementById('quiz-creator-display-name').innerText = activeQuizData.creatorName;
      showScreen('taker-start-screen');
    } catch (e) {
      console.error("خطأ في قراءة بيانات الاختبار", e);
    }
  }
};

function startTakingQuiz() {
  const name = document.getElementById('taker-name').value.trim();
  if (!name) {
    alert("يرجى كتابة اسمك أولاً!");
    return;
  }
  takerName = name;
  currentQuestionIndex = 0;
  takerAnswers = [];

  showScreen('taker-quiz-screen');
  renderTakerQuestion();
}

function renderTakerQuestion() {
  const q = QUESTION_BANK[currentQuestionIndex];
  const total = activeQuizData.answers.length;

  document.getElementById('taker-progress').style.width = `${((currentQuestionIndex) / total) * 100}%`;
  document.getElementById('taker-step-text').innerText = `سؤال ${currentQuestionIndex + 1} من ${total}`;
  document.getElementById('taker-question-title').innerText = q.question;

  const container = document.getElementById('taker-options-container');
  container.innerHTML = "";

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.innerText = opt;
    btn.onclick = () => saveTakerAnswer(idx);
    container.appendChild(btn);
  });
}

function saveTakerAnswer(optionIdx) {
  takerAnswers.push(optionIdx);
  currentQuestionIndex++;

  if (currentQuestionIndex < activeQuizData.answers.length) {
    renderTakerQuestion();
  } else {
    calculateResult();
  }
}

function calculateResult() {
  let correct = 0;
  const total = activeQuizData.answers.length;

  takerAnswers.forEach((ans, idx) => {
    if (ans === activeQuizData.answers[idx]) correct++;
  });

  const percentage = Math.round((correct / total) * 100);

  document.getElementById('res-names').innerText = `${takerName} ✖️ ${activeQuizData.creatorName}`;
  document.getElementById('res-score-percent').innerText = `${percentage}%`;

  let statusTitle = "";
  let statusDesc = "";

  if (percentage <= 30) {
    statusTitle = "🚫 حظر فوري بدون تفاهم!";
    statusDesc = "مش فاهم أي حاجة عني وتستاهل البلوك فوراً!";
  } else if (percentage <= 60) {
    statusTitle = "⚠️ منطقة الخطر!";
    statusDesc = "عارف شوية حاجات بس محتاج تركز معايا أكتر!";
  } else if (percentage <= 85) {
    statusTitle = "💕 صديق مقرب جداً!";
    statusDesc = "حافظ معظم تفاصيلي وتستاهل مكانة خاصة!";
  } else {
    statusTitle = "👑 صديق الروح ولا يمكن حظرك!";
    statusDesc = "أنت فاهم كل تفصيلة في حياتي بدون كلام!";
  }

  document.getElementById('res-status-title').innerText = statusTitle;
  document.getElementById('res-status-desc').innerText = statusDesc;

  saveToLeaderboard(activeQuizData.creatorName, takerName, percentage);
  renderLeaderboard(activeQuizData.creatorName);

  showScreen('result-screen');
}

function downloadStoryCard() {
  const cardBox = document.getElementById('story-card');
  html2canvas(cardBox).then(canvas => {
    const link = document.createElement('a');
    link.download = `نتيجة_اختبار_${takerName}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });
}

function shareResultWhatsApp() {
  const text = `أنا ${takerName} عملت اختبار ${activeQuizData.creatorName} وجبت ${document.getElementById('res-score-percent').innerText}! 😎🔥`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
}

function saveToLeaderboard(creator, taker, score) {
  const key = `lb_${creator}`;
  let lb = JSON.parse(localStorage.getItem(key) || '[]');
  lb.push({ taker, score, date: new Date().toLocaleDateString('ar-EG') });
  lb.sort((a, b) => b.score - a.score);
  localStorage.setItem(key, JSON.stringify(lb));
}

function renderLeaderboard(creator) {
  const key = `lb_${creator}`;
  const lb = JSON.parse(localStorage.getItem(key) || '[]');
  const listEl = document.getElementById('leaderboard-list');

  if (lb.length === 0) {
    listEl.innerHTML = '<li class="empty-lb">لا توجد إجابات سابقة لهذا الاختبار بعد.</li>';
    return;
  }

  listEl.innerHTML = lb.map((item, idx) => `
    <li>
      <span>#${idx + 1} ${item.taker}</span>
      <span>${item.score}%</span>
    </li>
  `).join('');
}

function createNewQuizForSelf() {
  window.location.hash = '';
  location.reload();
}

function showScreen(id) {
  document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
