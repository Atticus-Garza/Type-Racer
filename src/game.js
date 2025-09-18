document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const typingInput = document.getElementById('typing-input');
    const gameTextEl = document.getElementById('game-text');
    const wpmDisplay = document.getElementById('wpm-display');
    const accuracyDisplay = document.getElementById('accuracy-display');
    const raceTrack = document.querySelector('.race-track');

    const sentences = [
        "The quick brown fox jumps over the lazy dog.",
        "A journey of a thousand miles begins with a single step.",
        "Sphinx of black quartz, judge my vow.",
        "Jived fox nymph grabs quick waltz.",
        "How razorback-jumping frogs can level six piqued gymnasts.",
        "Pack my box with five dozen liquor jugs.",
        "The five boxing wizards jump quickly.",
        "Big fjords vex quick waltz glyphs."
    ];

    let gameText;
    let gameActive = false;
    let startTime;
    let botRacers = [];

    const player = {
        progress: 0,
        correctChars: 0,
        totalChars: 0,
        mistakes: 0,
        element: document.createElement('div')
    };

    const botProfiles = [
        { name: "Bot 1", wpm: 55, accuracy: 0.95, element: document.createElement('div') },
        { name: "Bot 2", wpm: 70, accuracy: 0.98, element: document.createElement('div') },
        { name: "Bot 3", wpm: 85, accuracy: 0.97, element: document.createElement('div') }
    ];

    function setupRacers() {
        // Clear old racers
        raceTrack.innerHTML = '';

        // Setup player racer
        player.element.className = 'racer player';
        player.element.textContent = 'You';
        raceTrack.appendChild(player.element);

        // Setup bot racers
        botRacers = botProfiles.map((profile, index) => {
            profile.progress = 0;
            profile.element.className = `racer bot-${index + 1}`;
            profile.element.textContent = profile.name;
            raceTrack.appendChild(profile.element);
            return profile;
        });
    }

    function createGameText() {
        const randomIndex = Math.floor(Math.random() * sentences.length);
        gameText = sentences[randomIndex];
        gameTextEl.innerHTML = gameText.split('').map(char => `<span>${char}</span>`).join('');
    }

    function updateGameText(input) {
        const textSpans = gameTextEl.querySelectorAll('span');
        let correctCount = 0;
        let incorrectCount = 0;

        for (let i = 0; i < gameText.length; i++) {
            const charSpan = textSpans[i];
            const charTyped = input[i];

            if (charTyped == null) {
                charSpan.classList.remove('correct', 'incorrect');
            } else if (charTyped === gameText[i]) {
                charSpan.classList.add('correct');
                charSpan.classList.remove('incorrect');
                correctCount++;
            } else {
                charSpan.classList.add('incorrect');
                charSpan.classList.remove('correct');
                incorrectCount++;
            }
        }

        player.correctChars = correctCount;
        player.totalChars = input.length;
        player.mistakes = incorrectCount;
    }

    function calculateWPM() {
        if (!startTime) return 0;
        const elapsedTimeInMinutes = (Date.now() - startTime) / 60000;
        const wordsTyped = (player.correctChars / 5);
        return Math.round(wordsTyped / elapsedTimeInMinutes);
    }

    function calculateAccuracy() {
        if (player.totalChars === 0) return 100;
        return Math.round((player.correctChars / player.totalChars) * 100);
    }

    function updateRacers(progress) {
        const raceWidth = raceTrack.clientWidth - player.element.clientWidth - 20; // -20 for padding
        const newPosition = (progress / gameText.length) * raceWidth;
        return newPosition;
    }

    function updateBotProgress(bot, elapsed) {
        const targetCharsPerMin = bot.wpm * 5;
        const targetMsPerChar = (60 * 1000) / targetCharsPerMin;

        // Calculate a character based on elapsed time, with some jitter
        const simulatedCharIndex = Math.floor(elapsed / targetMsPerChar);

        // Update bot's progress, simulating typing errors based on accuracy
        if (simulatedCharIndex > bot.progress) {
            bot.progress = Math.min(simulatedCharIndex, gameText.length);
        }
    }

    function gameLoop() {
        if (!gameActive) return;

        const elapsedTime = Date.now() - startTime;
        
        // Update WPM and Accuracy
        const wpm = calculateWPM();
        const accuracy = calculateAccuracy();
        wpmDisplay.textContent = wpm;
        accuracyDisplay.textContent = `${accuracy}%`;
        
        // Update player position
        const playerInput = typingInput.value;
        player.element.style.transform = `translateX(${updateRacers(playerInput.length)}px)`;

        // Update bots
        botRacers.forEach(bot => {
            updateBotProgress(bot, elapsedTime);
            bot.element.style.transform = `translateX(${updateRacers(bot.progress)}px)`;
        });

        // Check for winner
        if (playerInput.length >= gameText.length) {
            gameActive = false;
            typingInput.disabled = true;
            alert(`You finished! Your WPM was ${wpm} with ${accuracy}% accuracy.`);
        } else {
            botRacers.forEach(bot => {
                if (bot.progress >= gameText.length) {
                    gameActive = false;
                    typingInput.disabled = true;
                    alert(`${bot.name} won!`);
                }
            });
        }

        if (gameActive) {
            requestAnimationFrame(gameLoop);
        }
    }

    function startRace() {
        if (gameActive) return;
        gameActive = true;
        startTime = Date.now();
        typingInput.value = '';
        typingInput.disabled = false;
        typingInput.focus();

        createGameText();
        setupRacers();

        player.progress = 0;
        player.correctChars = 0;
        player.totalChars = 0;
        player.mistakes = 0;
        wpmDisplay.textContent = '0';
        accuracyDisplay.textContent = '100%';

        requestAnimationFrame(gameLoop);
    }

    startBtn.addEventListener('click', startRace);
    typingInput.addEventListener('input', (event) => {
        if (!gameActive) return;
        updateGameText(event.target.value);
    });
});
