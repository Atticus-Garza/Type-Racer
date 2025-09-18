document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const typingInput = document.getElementById('typing-input');
    const gameTextEl = document.getElementById('game-text');
    const wpmDisplay = document.getElementById('wpm-display');
    const accuracyDisplay = document.getElementById('accuracy-display');
    const raceTrack = document.querySelector('.race-track');
    const gameContainer = document.querySelector('.game-container'); // Add this line

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
    let playerLastWPM = localStorage.getItem('lastWPM') || 0;

    const player = {
        progress: 0,
        correctChars: 0,
        totalChars: 0,
        mistakes: 0,
        element: document.createElement('div')
    };

    function setupRacers() {
        raceTrack.innerHTML = '';

        player.element.className = 'racer player';
        player.element.textContent = 'YOU';
        raceTrack.appendChild(player.element);

        const botProfiles = getBotProfilesByDifficulty(playerLastWPM);
        botRacers = botProfiles.map((profile, index) => {
            profile.progress = 0;
            profile.element.className = `racer bot-${index + 1}`;
            profile.element.textContent = profile.name;
            raceTrack.appendChild(profile.element);
            return profile;
        });
    }

    function getBotProfilesByDifficulty(playerWPM) {
        if (playerWPM <= 30) {
            return [
                { name: "BOT 1", wpm: 25, accuracy: 0.90, element: document.createElement('div') },
                { name: "BOT 2", wpm: 30, accuracy: 0.92, element: document.createElement('div') },
                { name: "BOT 3", wpm: 35, accuracy: 0.94, element: document.createElement('div') }
            ];
        } else if (playerWPM > 30 && playerWPM <= 50) {
            return [
                { name: "BOT 1", wpm: 45, accuracy: 0.95, element: document.createElement('div') },
                { name: "BOT 2", wpm: 50, accuracy: 0.97, element: document.createElement('div') },
                { name: "BOT 3", wpm: 55, accuracy: 0.96, element: document.createElement('div') }
            ];
        } else {
            return [
                { name: "BOT 1", wpm: 65, accuracy: 0.98, element: document.createElement('div') },
                { name: "BOT 2", wpm: 80, accuracy: 0.99, element: document.createElement('div') },
                { name: "BOT 3", wpm: 90, accuracy: 0.97, element: document.createElement('div') }
            ];
        }
    }

    function createGameText() {
        const randomIndex = Math.floor(Math.random() * sentences.length);
        gameText = sentences[randomIndex];
        gameTextEl.innerHTML = gameText.split('').map(char => `<span>${char}</span>`).join('');
    }

    function updateGameText(input) {
        const textSpans = gameTextEl.querySelectorAll('span');
        let correctCount = 0;

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
            }
        }
        
        player.correctChars = correctCount;
        player.totalChars = input.length;
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
        const raceWidth = raceTrack.clientWidth - player.element.clientWidth - 20;
        const newPosition = (progress / gameText.length) * raceWidth;
        return newPosition;
    }

    function updateBotProgress(bot, elapsed) {
        const targetCharsPerMin = bot.wpm * 5;
        const targetMsPerChar = (60 * 1000) / targetCharsPerMin;
        const simulatedCharIndex = Math.floor(elapsed / targetMsPerChar);

        if (simulatedCharIndex > bot.progress) {
            bot.progress = Math.min(simulatedCharIndex, gameText.length);
        }
    }

    function gameLoop() {
        if (!gameActive) return;

        const elapsedTime = Date.now() - startTime;
        
        const wpm = calculateWPM();
        const accuracy = calculateAccuracy();
        wpmDisplay.textContent = wpm;
        accuracyDisplay.textContent = `${accuracy}%`;
        
        const playerInput = typingInput.value;
        player.element.style.transform = `translateX(${updateRacers(playerInput.length)}px)`;

        botRacers.forEach(bot => {
            updateBotProgress(bot, elapsedTime);
            bot.element.style.transform = `translateX(${updateRacers(bot.progress)}px)`;
        });

        if (playerInput.length >= gameText.length) {
            endGame(wpm, accuracy, 'player');
        } else {
            botRacers.forEach(bot => {
                if (bot.progress >= gameText.length) {
                    endGame(wpm, accuracy, 'bot', bot.name);
                }
            });
        }

        if (gameActive) {
            requestAnimationFrame(gameLoop);
        }
    }

    function endGame(finalWPM, finalAccuracy, winner, botName) {
        gameActive = false;
        typingInput.disabled = true;
        localStorage.setItem('lastWPM', finalWPM);

        if (winner === 'player') {
            alert(`You won! Your WPM was ${finalWPM} with ${finalAccuracy}% accuracy.`);
        } else {
            alert(`${botName} won! Your WPM was ${finalWPM} with ${finalAccuracy}% accuracy.`);
        }
        
        gameContainer.dataset.mode = 'idle';
    }

    function startRace() {
        if (gameActive) return;
        gameContainer.dataset.mode = 'playing';
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
