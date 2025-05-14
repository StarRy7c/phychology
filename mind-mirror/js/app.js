document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('category-select');
    const questionTextElement = document.getElementById('question-text');
    const questionCategoryTooltip = document.querySelector('#question-category-tooltip .tooltiptext');
    const answerInputElement = document.getElementById('answer-input');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const downloadCardBtn = document.getElementById('download-card-btn');
    const downloadModal = document.getElementById('download-modal');
    const cancelDownloadBtn = document.getElementById('cancel-download-btn');
    const confirmDownloadBtn = document.getElementById('confirm-download-btn');
    const cardToDownloadContainer = document.getElementById('card-to-download');
    const userNameInput = document.getElementById('user-name');
    const genderSelect = document.getElementById('gender-select');
    const fontStyleSelect = document.getElementById('font-style-select');
    const colorSchemeSelect = document.getElementById('color-scheme-select');
    const questionSpinner = document.getElementById('question-spinner');
    const themeToggle = document.getElementById('theme-toggle');

    document.getElementById('currentYear').textContent = new Date().getFullYear();

    let questionsData = {};
    let currentQuestions = [];
    let currentQuestionIndex = -1;
    let currentCategoryKey = '';

    const categoryDescriptions = {
        self_discovery: "Exploring your inner self, motivations, and hidden aspects.",
        philosophical_reflection: "Pondering life's big questions and abstract concepts.",
        emotional_depth: "Connecting with and understanding your feelings.",
        relationship_trust: "Examining connections, loyalty, and interpersonal dynamics.",
        existential_doubt: "Contemplating meaning, purpose, and existence itself."
    };

    // --- Dark Mode ---
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        themeToggle.checked = true;
    }
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    });

    // --- Load Questions ---
    async function loadQuestions() {
        showSpinner();
        try {
            // Attempt to load from localStorage first
            const cachedQuestions = localStorage.getItem('mindMirrorQuestions');
            if (cachedQuestions) {
                questionsData = JSON.parse(cachedQuestions);
                console.log('Questions loaded from cache.');
                populateCategories();
                hideSpinner();
                return;
            }

            const response = await fetch('data/questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            questionsData = await response.json();
            localStorage.setItem('mindMirrorQuestions', JSON.stringify(questionsData)); // Cache questions
            populateCategories();
        } catch (error) {
            console.error("Could not load questions:", error);
            questionTextElement.textContent = "Failed to load questions. Please try refreshing.";
        } finally {
            hideSpinner();
        }
    }

    function showSpinner() {
        questionSpinner.classList.remove('hidden');
        questionTextElement.classList.add('hidden');
    }

    function hideSpinner() {
        questionSpinner.classList.add('hidden');
        questionTextElement.classList.remove('hidden');
    }

    function populateCategories() {
        if (Object.keys(questionsData).length === 0) return;
        for (const key in questionsData) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = formatCategoryName(key);
            categorySelect.appendChild(option);
        }
        // Load questions for the first category by default
        currentCategoryKey = categorySelect.value;
        loadCategoryQuestions(currentCategoryKey);
    }

    function formatCategoryName(key) {
        return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    function loadCategoryQuestions(categoryKey) {
        showSpinner();
        currentCategoryKey = categoryKey;
        currentQuestions = questionsData[categoryKey] ? [...questionsData[categoryKey]] : [];
        shuffleArray(currentQuestions);
        currentQuestionIndex = -1; // Reset index
        displayNextQuestion();
        updateTooltip(categoryKey);
        answerInputElement.value = localStorage.getItem(`answer_${categoryKey}_${currentQuestionIndex}`) || ''; // Load saved answer for current Q
        hideSpinner();
    }
    
    function updateTooltip(categoryKey) {
        const description = categoryDescriptions[categoryKey] || "Reflect on this question.";
        questionCategoryTooltip.textContent = description;
    }


    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function displayNextQuestion() {
        if (currentQuestions.length === 0) {
            questionTextElement.textContent = "No questions available for this category.";
            return;
        }
        currentQuestionIndex = (currentQuestionIndex + 1) % currentQuestions.length;
        const question = currentQuestions[currentQuestionIndex];
        questionTextElement.textContent = question;
        // Load saved answer if exists
        answerInputElement.value = localStorage.getItem(`answer_${currentCategoryKey}_${currentQuestionIndex}`) || '';
    }

    // --- Event Listeners ---
    categorySelect.addEventListener('change', (e) => {
        loadCategoryQuestions(e.target.value);
    });

    nextQuestionBtn.addEventListener('click', displayNextQuestion);

    answerInputElement.addEventListener('focus', () => {
        answerInputElement.rows = 6;
    });
    answerInputElement.addEventListener('blur', () => {
        if (answerInputElement.value.trim() === '') {
            answerInputElement.rows = 4;
        }
    });
    // Save reflection to localStorage on input
    answerInputElement.addEventListener('input', () => {
        if (currentCategoryKey && currentQuestionIndex !== -1) {
             localStorage.setItem(`answer_${currentCategoryKey}_${currentQuestionIndex}`, answerInputElement.value);
        }
    });


    // --- Modal Logic ---
    downloadCardBtn.addEventListener('click', () => {
        downloadModal.classList.remove('hidden');
        setTimeout(() => {
            downloadModal.classList.remove('opacity-0');
            downloadModal.querySelector('div').classList.remove('scale-95');
        } , 10);
    });

    cancelDownloadBtn.addEventListener('click', () => {
        downloadModal.classList.add('opacity-0');
        downloadModal.querySelector('div').classList.add('scale-95');
        setTimeout(() => downloadModal.classList.add('hidden'), 300);
    });

    confirmDownloadBtn.addEventListener('click', generateAndDownloadCard);

    // --- Card Generation ---
    async function generateAndDownloadCard() {
        const question = questionTextElement.textContent;
        const answer = answerInputElement.value || "No reflection written.";
        const name = userNameInput.value || "Anonymous";
        const gender = genderSelect.value;
        const font = fontStyleSelect.value;
        const theme = colorSchemeSelect.value;

        // Create avatar element (simple placeholder)
        let avatarHtml = '';
        if (gender !== 'none') {
            avatarHtml = `<div class="w-10 h-10 rounded-full ${getAvatarClass(gender)} mr-2"></div>`;
        }
        
        cardToDownloadContainer.className = `fixed -left-[9999px] top-0 w-[600px] h-[400px] p-6 shadow-lg overflow-hidden flex flex-col justify-between text-left ${font} ${theme}`;

        cardToDownloadContainer.innerHTML = `
            <div>
                <p class="card-question text-xl mb-3 ${theme === 'theme-classic-elegance' ? 'font-lora' : ''} ${theme === 'theme-dark-academia' ? 'font-lora' : ''} ${theme === 'theme-minimal-zen' ? 'font-quicksand' : ''}">${question}</p>
                <p class="card-answer text-sm leading-relaxed card-answer-scroll pr-2 ${theme === 'theme-classic-elegance' ? 'max-h-[180px]' : 'max-h-[160px]'} overflow-y-auto">${answer.replace(/\n/g, '<br>')}</p>
            </div>
            <div>
                <div class="card-user-info flex items-center mt-4">
                    ${avatarHtml}
                    <span class="text-sm">${name}</span>
                </div>
                <p class="card-footer-text text-xs mt-3">A reflection from the Mind Mirror</p>
            </div>
        `;

        // Apply specific theme styles not covered by main class
        // This part can be expanded for more complex themes
        if (theme === 'theme-dark-academia') {
            cardToDownloadContainer.querySelector('.card-question').style.fontFamily = "'Roboto Mono', monospace"; // Example: typewriter font
            cardToDownloadContainer.querySelector('.card-answer').style.fontFamily = "'Roboto Mono', monospace";
        }

        confirmDownloadBtn.textContent = 'Generating...';
        confirmDownloadBtn.disabled = true;

        try {
            // Ensure images (if any embedded in CSS or HTML like avatars) are loaded
            // For local SVGs or images, preloading might be necessary or a slight delay
            await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for rendering

            const canvas = await html2canvas(cardToDownloadContainer, {
                scale: 2, // Higher resolution
                useCORS: true, // If using external images/fonts
                backgroundColor: null, // Use the element's background
                logging: false
            });
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'mind-mirror-reflection.png';
            link.href = image;
            link.click();
        } catch (error) {
            console.error('Error generating card:', error);
            alert('Sorry, there was an error generating your card. Please try again.');
        } finally {
            confirmDownloadBtn.textContent = 'Generate & Download';
            confirmDownloadBtn.disabled = false;
            cancelDownloadBtn.click(); // Close modal
        }
    }

    function getAvatarClass(gender) {
        if (gender === 'male') return 'avatar-male'; // You'd style these in CSS (e.g., with SVGs)
        if (gender === 'female') return 'avatar-female';
        if (gender === 'non-binary') return 'avatar-non-binary';
        return '';
    }

    // --- Initial Load ---
    loadQuestions();

    // --- Textarea auto-expand (simple version) ---
    // More sophisticated auto-expand would require calculating scrollHeight
    answerInputElement.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        // Cap the height if needed
        if (this.scrollHeight > 200) { // example max height
             this.style.overflowY = 'auto';
             this.style.height = '200px';
        } else {
            this.style.overflowY = 'hidden';
        }
    });
});
