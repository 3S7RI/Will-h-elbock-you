// app.js - التحكم الكامل في التطبيق والتفاعل

let quizConfig = {
  creatorName: "",
  gender: "male",
  questionCount: 10,
  answers: [] // مصفوفة الإجابات المختارة
};

let activeQuizData = null; // بيانات الاختبار عند فتح رابط مجيب
let currentQuestionIndex = 0;
let takerAnswers = [];
let takerName = "";

// 1. تحديد النوع والعدد
function selectGender(g) {
  quizConfig.gender = g;
  document.getElementById('gender-male').className = 'gender-btn ' + (g === 'male' ? 'active-male' : '');
  document.getElementById('gender-female').className = 'gender-btn ' + (g === 'female' ? 'active-female' : '');
}

function selectCount(count) {
  quizConfig.questionCount = count;
  const btns = document.querySelectorAll('.count-btn');
  btns.forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

// 2. البدء في إنشاء الاختبار
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

// 3. تشفير الاختبار وإنشاء الرابط
function finishQuizCreation() {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(quizConfig))));
  const shareUrl = `${window.location.origin}${window.location.pathname}#quiz=${encoded}`;

  document.getElementById('quiz-link-input').value = shareUrl;
  showScreen('share-screen');
}

function copyQuizLink() {
  const input = document.getElementById('quiz-link-input');
  input.select();
  document.execCommand('copy');
  alert("تم نسخ رابط الاختبار بنجاح! 📋");
}

function shareToWhatsApp() {
  const link = document.getElementById('quiz-link-input').value;
  const text = `أنا ${quizConfig.creatorName} عملت اختبار درجة الصداقة ومستوى الحظر! 🚫💕\nادخل جاوب وشوف هتحظر ولا لأ: 👇\n${link}`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
}

// 4. تحميل الاختبار عند فتح رابط صديق
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

// 5. حساب النتيجة وحفظها في المتصدرين
function calculateResult() {
  let correct = 0;
  const total = activeQuizData.answers.length;

  takerAnswers.forEach((ans, idx) => {
    if (ans === activeQuizData.answers[idx]) correct++;
  });

  const percentage = Math.round((correct / total) * 100);

  // تحديث كارت النتيجة
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

  // حفظ النتيجة محلياً للقائمة
  saveToLeaderboard(activeQuizData.creatorName, takerName, percentage);
  renderLeaderboard(activeQuizData.creatorName);

  showScreen('result-screen');
}

// 6. توليد صورة كارت الستوري
function downloadStoryCard() {
  const cardBox = document.getElementById('story-card');
  html2canvas(cardBox).then(canvas => {
    const link = document.createElement('a');
    link.download = `نتيجة_اختبار_${takerName}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });
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
