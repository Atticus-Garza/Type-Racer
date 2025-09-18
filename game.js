document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const storeBtn = document.getElementById('store-btn');
    const backBtn = document.getElementById('back-btn');
    const typingInput = document.getElementById('typing-input');
    const gameTextEl = document.getElementById('game-text');
    const wpmDisplay = document.getElementById('wpm-display');
    const accuracyDisplay = document.getElementById('accuracy-display');
    const raceTrack = document.querySelector('.race-track');
    const gameContainer = document.querySelector('.game-container');
    const currencyDisplay = document.getElementById('currency');
    const characterListEl = document.getElementById('character-list');

    const paragraphs = [
        "In the neon-lit alleyways, a rogue AI named 'Spectre' was said to haunt the data streams of the city. A sudden surge corrupted its core, turning it into a phantom of its former self. It now moves with blinding speed.",
        "The ancient forest lay silent under a blanket of digital fog. A beast of myth, the Wampus, emerged from the network's darkest corners. The Wampus doesn't race against you; it hunts you with erratic and unpredictable code.",
        "Deep within the monolithic data centers, a new challenge emerged from the network itself. An algorithm, dubbed 'The Labyrinth', randomly generated sprawling paragraphs of text. It is a test of endurance and focus.",
        "The year is 2077. You are a 'Data Courier,' a freelance typist. Today's job is a high-stakes delivery through a heavily encrypted network. Your speed and accuracy are the only things keeping you from becoming a digital ghost in the system."
    ];

    const characters = [
        { id: 'default', name: 'Standard Avatar', cost: 0, unlocked: true, image: 'assets/images/default.png' },
        { id: 'glitch', name: 'Glitch Runner', cost: 100, unlocked: false, image: 'assets/images/glitch.png' },
        { id: 'matrix', name: 'Matrix Code', cost: 250, unlocked: false, image: 'assets/images/matrix.png' },
        { id: 'neon', name: 'Neon Spectre', cost: 500, unlocked: false, image: 'assets/images/neon.png' }
    ];

    let gameText;
    let gameActive = false;
    let startTime;
    let botRacers = [];
    let playerLastWPM = parseInt(localStorage.getItem('lastWPM')) || 0;
    let playerCurrency = parseInt(localStorage.getItem('playerCurrency')) || 0;
    let playerCharacters = JSON.parse(localStorage.getItem('playerCharacters')) || { default: true };
    let equippedCharacter = localStorage.getItem('equippedCharacter') || 'default';

    const player = {
        progress: 0,
        correctChars: 0,
        totalChars: 0,
        mistakes: 0,
        element: null
    };

    function updateCurrencyDisplay() {
        currencyDisplay.textContent = `Bits: ${playerCurrency}`;
    }

    function getCharacterById(id) {
        return characters.find(char => char.id === id);
    }

    function createRacerElement(name, imageSrc) {
        const racer = document.createElement('img');
        racer.src = imageSrc;
        racer.alt = name;
        racer.title = name;
        racer.className = 'racer';
        return racer;
    }

    function setupRacers() {
        raceTrack.innerHTML = '';
        player.element = createRacerElement(getCharacterById(equippedCharacter).name, getCharacterById(equippedCharacter).image);
        player.element.classList.add('player');
        raceTrack.appendChild(player.element);

        const botProfiles = getBotProfilesByDifficulty(playerLastWPM);
        botRacers = botProfiles.map((profile, index) => {
            profile.progress = 0;
            profile.element = createRacerElement(profile.name, profile.image);
            profile.element.classList.add(`bot-${index + 1}`);
            if (profile.name === 'WAMPUS') {
                profile.element.classList.add('wampus');
            }
            raceTrack.appendChild(profile.element);
            return profile;
        });
    }

    function getBotProfilesByDifficulty(playerWPM) {
        const wampusImage = 'assets/images/wampus.png';
        if (playerWPM <= 30) {
            return [
                { name: "BOT 1", wpm: 25, accuracy: 0.90, image: 'assets/images/bot1.png' },
                { name: "BOT 2", wpm: 30, accuracy: 0.92, image: 'assets/images/bot2.png' },
                { name: "BOT 3", wpm: 35, accuracy: 0.94, image: 'assets/images/bot3.png' }
            ];
        } else if (playerWPM > 30 && playerWPM <= 50) {
            return [
                { name: "BOT 1", wpm: 45, accuracy: 0.95, image: 'assets/images/bot1.png' },
                { name: "BOT 2", wpm: 50, accuracy: 0.97, image: 'assets/images/bot2.png' },
                { name: "BOT 3", wpm: 55, accuracy: 0.96, image: 'assets/images/bot3.png' }
            ];
        } else {
            return [
                { name: "BOT 1", wpm: 65, accuracy: 0.98, image: 'assets/images/bot1.png' },
                { name: "BOT 2", wpm: 80, accuracy: 0.99, image: 'assets/images/bot2.png' },
                { name: "WAMPUS", wpm: 90, accuracy: 0.97, image: wampusImage }
            ];
        }
    }

    function createGameText() {
        const randomIndex = Math.floor(Math.random() * paragraphs.length);
        gameText = paragraphs[randomIndex];
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

    function updateRacers(progress, element) {
        const raceWidth = raceTrack.clientWidth - element.clientWidth - 20;
        const newPosition = (progress / gameText.length) * raceWidth;
        return newPosition;
    }

    function updateBotProgress(bot, elapsed) {
        let targetCharsPerMin = bot.wpm * 5;
        if (bot.name === 'WAMPUS' && elapsed > 10000 && elapsed < 15000) {
            targetCharsPerMin *= 2;
        }
        
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
        player.element.style.transform = `translateX(${updateRacers(playerInput.length, player.element)}px)`;

        botRacers.forEach(bot => {
            updateBotProgress(bot, elapsedTime);
            bot.element.style.transform = `translateX(${updateRacers(bot.progress, bot.element)}px)`;
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
            const bitsEarned = Math.floor(finalWPM * (finalAccuracy / 100));
            playerCurrency += bitsEarned;
            localStorage.setItem('playerCurrency', playerCurrency);
            updateCurrencyDisplay();
            alert(`You won! You earned ${bitsEarned} Bits. Your WPM was ${finalWPM} with ${finalAccuracy}% accuracy.`);
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

    function showStore() {
        gameContainer.dataset.mode = 'store';
        renderCharacterStore();
    }

    function renderCharacterStore() {
        characterListEl.innerHTML = '';
        characters.forEach(char => {
            const card = document.createElement('div');
            card.className = `character-card ${equippedCharacter === char.id ? 'equipped' : ''} ${playerCharacters[char.id] ? '' : 'locked'}`;
            card.innerHTML = `
                <img src="${char.image}" alt="${char.name}">
                <p>${char.name}</p>
                ${playerCharacters[char.id] ? 
                    '<span class="price">Owned</span>' : 
                    `<span class="price">${char.cost} Bits</span>`
                }
            `;
            card.addEventListener('click', () => {
                handleCharacterPurchase(char, card);
            });
            characterListEl.appendChild(card);
        });
    }

    function handleCharacterPurchase(char, card) {
        if (playerCharacters[char.id]) {
            equippedCharacter = char.id;
            localStorage.setItem('equippedCharacter', equippedCharacter);
            renderCharacterStore();
            alert(`Equipped ${char.name}!`);
        } else if (playerCurrency >= char.cost) {
            const confirmBuy = confirm(`Do you want to buy ${char.name} for ${char.cost} Bits?`);
            if (confirmBuy) {
                playerCurrency -= char.cost;
                playerCharacters[char.id] = true;
                localStorage.setItem('playerCurrency', playerCurrency);
                localStorage.setItem('playerCharacters', JSON.stringify(playerCharacters));
                equippedCharacter = char.id;
                localStorage.setItem('equippedCharacter', equippedCharacter);
                updateCurrencyDisplay();
                renderCharacterStore();
                alert(`You bought and equipped ${char.name}!`);
            }
        } else {
            alert('Not enough Bits!');
        }
    }

    // Keyboard shortcut for admin panel
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'o') {
            const password = prompt('Enter admin password:');
            if (password === 'Wampus') {
                window.open('admin.html', '_blank', 'width=800,height=600');
            } else {
                alert('Incorrect password.');
            }
        }
    });

    startBtn.addEventListener('click', startRace);
    storeBtn.addEventListener('click', showStore);
    backBtn.addEventListener('click', () => {
        gameContainer.dataset.mode = 'idle';
    });
    typingInput.addEventListener('input', (event) => {
        if (!gameActive) return;
        updateGameText(event.target.value);
    });
    
    updateCurrencyDisplay();
});
