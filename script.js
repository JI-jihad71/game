// Game State Variables
const gameState = {
    playerScore: 0,
    computerScore: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    round: 1,
    playerStreak: 0,
    computerStreak: 0,
    playerChoice: null,
    computerChoice: null,
    gameMode: 'ai', // ai, multiplayer, timed
    aiMode: 'smart', // smart, random
    theme: 'light',
    history: [],
    achievements: {
        beginnerWarrior: false,
        masterPlayer: false,
        legendMode: false
    },
    playerLevel: 1,
    soundEnabled: true,
    vibrationEnabled: true,
    timerActive: false,
    timerSeconds: 3,
    timerInterval: null,
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    player2Choice: null,
    multiplayerTurn: 1
};

// DOM Elements
const elements = {
    playerScore: document.getElementById('playerScore'),
    computerScore: document.getElementById('computerScore'),
    playerStreak: document.getElementById('playerStreak'),
    computerStreak: document.getElementById('computerStreak'),
    roundCount: document.getElementById('roundCount'),
    timer: document.getElementById('timer'),
    resultIcon: document.getElementById('resultIcon'),
    resultText: document.getElementById('resultText'),
    resultDesc: document.getElementById('resultDesc'),
    comboDisplay: document.getElementById('comboDisplay'),
    comboText: document.getElementById('comboText'),
    computerChoice: document.getElementById('computerChoice'),
    winsCount: document.getElementById('winsCount'),
    lossesCount: document.getElementById('lossesCount'),
    drawsCount: document.getElementById('drawsCount'),
    winRate: document.getElementById('winRate'),
    playerLevel: document.getElementById('playerLevel'),
    historyPanel: document.getElementById('historyPanel'),
    historyList: document.getElementById('historyList'),
    closeHistory: document.getElementById('closeHistory'),
    historyBtn: document.getElementById('historyBtn'),
    playBtn: document.getElementById('playBtn'),
    resetBtn: document.getElementById('resetBtn'),
    shareBtn: document.getElementById('shareBtn'),
    soundToggle: document.getElementById('soundToggle'),
    vibrationToggle: document.getElementById('vibrationToggle'),
    aiModeSelection: document.getElementById('aiModeSelection'),
    multiplayerSection: document.getElementById('multiplayerSection'),
    player1NameInput: document.getElementById('player1Name'),
    player2NameInput: document.getElementById('player2Name'),
    player2NameDisplay: document.getElementById('player2NameDisplay')
};

// Audio Elements
const sounds = {
    win: document.getElementById('winSound'),
    lose: document.getElementById('loseSound'),
    draw: document.getElementById('drawSound'),
    click: document.getElementById('clickSound'),
    combo: document.getElementById('comboSound')
};

// AI Prediction Model
const aiModel = {
    playerPatterns: [],
    lastPlayerChoices: [],
    
    predictNextMove: function() {
        if (this.lastPlayerChoices.length < 3) {
            return this.getRandomChoice();
        }
        
        // Look for patterns in last 5 moves
        const recentChoices = this.lastPlayerChoices.slice(-5);
        const choiceCount = {
            rock: 0,
            paper: 0,
            scissors: 0
        };
        
        recentChoices.forEach(choice => {
            choiceCount[choice]++;
        });
        
        // Find most frequent choice
        let mostFrequent = 'rock';
        let maxCount = 0;
        
        for (const [choice, count] of Object.entries(choiceCount)) {
            if (count > maxCount) {
                maxCount = count;
                mostFrequent = choice;
            }
        }
        
        // Counter the most frequent choice
        return this.getCounterMove(mostFrequent);
    },
    
    getCounterMove: function(move) {
        const counters = {
            rock: 'paper',
            paper: 'scissors',
            scissors: 'rock'
        };
        return counters[move];
    },
    
    getRandomChoice: function() {
        const choices = ['rock', 'paper', 'scissors'];
        return choices[Math.floor(Math.random() * 3)];
    },
    
    recordPlayerMove: function(move) {
        this.lastPlayerChoices.push(move);
        if (this.lastPlayerChoices.length > 10) {
            this.lastPlayerChoices.shift();
        }
    }
};

// Initialize the game
function initGame() {
    loadGameState();
    setupEventListeners();
    updateUI();
    applyTheme(gameState.theme);
}

// Load game state from localStorage
function loadGameState() {
    const savedState = localStorage.getItem('rpsGameState');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        Object.assign(gameState, parsed);
    }
}

// Save game state to localStorage
function saveGameState() {
    localStorage.setItem('rpsGameState', JSON.stringify(gameState));
}

// Setup all event listeners
function setupEventListeners() {
    // Choice buttons
    document.querySelectorAll('.choice-btn').forEach(button => {
        button.addEventListener('click', function() {
            const choice = this.dataset.choice;
            const player = this.dataset.player || '1';
            
            if (gameState.gameMode === 'multiplayer') {
                if (player === '2') {
                    gameState.player2Choice = choice;
                    this.classList.add('selected');
                    document.querySelectorAll(`.choice-btn[data-player="2"]`).forEach(btn => {
                        if (btn !== this) btn.classList.remove('selected');
                    });
                    
                    // If both players have chosen, play the round
                    if (gameState.playerChoice && gameState.player2Choice) {
                        playMultiplayerRound();
                    }
                } else {
                    gameState.playerChoice = choice;
                    this.classList.add('selected');
                    document.querySelectorAll(`.choice-btn:not([data-player])`).forEach(btn => {
                        if (btn !== this) btn.classList.remove('selected');
                    });
                    
                    // If both players have chosen, play the round
                    if (gameState.player2Choice && gameState.playerChoice) {
                        playMultiplayerRound();
                    }
                }
            } else {
                gameState.playerChoice = choice;
                this.classList.add('selected');
                document.querySelectorAll(`.choice-btn:not([data-player])`).forEach(btn => {
                    if (btn !== this) btn.classList.remove('selected');
                });
            }
            
            playSound('click');
        });
    });
    
    // Play button
    elements.playBtn.addEventListener('click', function() {
        if (gameState.gameMode === 'timed') {
            startTimer();
        } else if (gameState.gameMode === 'ai') {
            if (gameState.playerChoice) {
                playRound();
            } else {
                showMessage('Please select a choice first!', 'error');
            }
        }
    });
    
    // Reset button
    elements.resetBtn.addEventListener('click', resetGame);
    
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(button => {
        button.addEventListener('click', function() {
            const mode = this.dataset.mode;
            setGameMode(mode);
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // AI mode buttons
    document.querySelectorAll('.ai-mode-btn').forEach(button => {
        button.addEventListener('click', function() {
            const aiMode = this.dataset.ai;
            gameState.aiMode = aiMode;
            document.querySelectorAll('.ai-mode-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            saveGameState();
        });
    });
    
    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(button => {
        button.addEventListener('click', function() {
            const theme = this.dataset.theme;
            setTheme(theme);
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // History button
    elements.historyBtn.addEventListener('click', function() {
        elements.historyPanel.classList.add('active');
        updateHistoryPanel();
    });
    
    // Close history
    elements.closeHistory.addEventListener('click', function() {
        elements.historyPanel.classList.remove('active');
    });
    
    // Share button
    elements.shareBtn.addEventListener('click', shareScore);
    
    // Sound toggle
    elements.soundToggle.addEventListener('click', function() {
        gameState.soundEnabled = !gameState.soundEnabled;
        updateSoundToggle();
        saveGameState();
    });
    
    // Vibration toggle
    elements.vibrationToggle.addEventListener('click', function() {
        gameState.vibrationEnabled = !gameState.vibrationEnabled;
        updateVibrationToggle();
        saveGameState();
    });
    
    // Player name inputs
    elements.player1NameInput.addEventListener('change', function() {
        gameState.player1Name = this.value || 'Player 1';
        updateUI();
        saveGameState();
    });
    
    elements.player2NameInput.addEventListener('change', function() {
        gameState.player2Name = this.value || 'Player 2';
        elements.player2NameDisplay.textContent = `${gameState.player2Name} Choice`;
        updateUI();
        saveGameState();
    });
}

// Set game mode
function setGameMode(mode) {
    gameState.gameMode = mode;
    
    // Show/hide relevant sections
    if (mode === 'ai') {
        elements.aiModeSelection.style.display = 'flex';
        elements.multiplayerSection.style.display = 'none';
        elements.playBtn.style.display = 'flex';
        elements.playBtn.innerHTML = '<i class="fas fa-play"></i> Play Round';
    } else if (mode === 'multiplayer') {
        elements.aiModeSelection.style.display = 'none';
        elements.multiplayerSection.style.display = 'block';
        elements.playBtn.style.display = 'none';
        resetChoices();
    } else if (mode === 'timed') {
        elements.aiModeSelection.style.display = 'none';
        elements.multiplayerSection.style.display = 'none';
        elements.playBtn.style.display = 'flex';
        elements.playBtn.innerHTML = '<i class="fas fa-clock"></i> Start Timer';
    }
    
    saveGameState();
    updateUI();
}

// Set theme
function setTheme(theme) {
    gameState.theme = theme;
    applyTheme(theme);
    saveGameState();
}

// Apply theme to body
function applyTheme(theme) {
    document.body.className = '';
    if (theme !== 'light') {
        document.body.classList.add(`${theme}-theme`);
    }
}

// Play a round (AI mode)
function playRound() {
    if (!gameState.playerChoice) return;
    
    // Get computer choice based on AI mode
    if (gameState.aiMode === 'smart') {
        gameState.computerChoice = aiModel.predictNextMove();
        aiModel.recordPlayerMove(gameState.playerChoice);
    } else {
        gameState.computerChoice = aiModel.getRandomChoice();
    }
    
    // Determine winner
    const result = determineWinner(gameState.playerChoice, gameState.computerChoice);
    
    // Update scores
    if (result === 'win') {
        gameState.playerScore++;
        gameState.wins++;
        gameState.playerStreak++;
        gameState.computerStreak = 0;
        playSound('win');
        vibrate(100);
        showConfetti();
    } else if (result === 'lose') {
        gameState.computerScore++;
        gameState.losses++;
        gameState.computerStreak++;
        gameState.playerStreak = 0;
        playSound('lose');
        vibrate(200);
    } else {
        gameState.draws++;
        playSound('draw');
        vibrate(50);
    }
    
    // Update round
    gameState.round++;
    
    // Add to history
    addToHistory(gameState.playerChoice, gameState.computerChoice, result);
    
    // Check for achievements
    checkAchievements();
    
    // Update UI
    updateUI();
    animateResult(result);
    
    // Reset choices for next round
    setTimeout(() => {
        resetChoices();
    }, 2000);
    
    // Save game state
    saveGameState();
}

// Play multiplayer round
function playMultiplayerRound() {
    if (!gameState.playerChoice || !gameState.player2Choice) return;
    
    // Determine winner
    const result = determineWinner(gameState.playerChoice, gameState.player2Choice);
    
    // Update scores
    if (result === 'win') {
        gameState.playerScore++;
        gameState.wins++;
        gameState.playerStreak++;
        playSound('win');
        vibrate(100);
    } else if (result === 'lose') {
        // In multiplayer, player2 wins
        gameState.computerScore++;
        gameState.losses++;
        playSound('lose');
        vibrate(200);
    } else {
        gameState.draws++;
        playSound('draw');
        vibrate(50);
    }
    
    // Update round
    gameState.round++;
    
    // Add to history
    addToHistory(gameState.playerChoice, gameState.player2Choice, result, true);
    
    // Check for achievements
    checkAchievements();
    
    // Update UI
    updateUI();
    animateResult(result);
    
    // Reset choices for next round
    setTimeout(() => {
        resetChoices();
        gameState.player2Choice = null;
        document.querySelectorAll(`.choice-btn[data-player="2"]`).forEach(btn => {
            btn.classList.remove('selected');
        });
    }, 2000);
    
    // Save game state
    saveGameState();
}

// Determine winner
function determineWinner(player, opponent) {
    if (player === opponent) return 'draw';
    
    if (
        (player === 'rock' && opponent === 'scissors') ||
        (player === 'paper' && opponent === 'rock') ||
        (player === 'scissors' && opponent === 'paper')
    ) {
        return 'win';
    }
    
    return 'lose';
}

// Add round to history
function addToHistory(playerChoice, opponentChoice, result, isMultiplayer = false) {
    const historyItem = {
        round: gameState.round - 1,
        playerChoice,
        opponentChoice,
        result,
        isMultiplayer,
        timestamp: new Date().toLocaleTimeString()
    };
    
    gameState.history.unshift(historyItem);
    
    // Keep only last 10 items
    if (gameState.history.length > 10) {
        gameState.history.pop();
    }
}

// Update the UI
function updateUI() {
    // Update scores
    elements.playerScore.textContent = gameState.playerScore;
    elements.computerScore.textContent = gameState.computerScore;
    
    // Update streaks
    updateStreaks();
    
    // Update round
    elements.roundCount.textContent = gameState.round;
    
    // Update stats
    elements.winsCount.textContent = gameState.wins;
    elements.lossesCount.textContent = gameState.losses;
    elements.drawsCount.textContent = gameState.draws;
    
    // Update win rate
    const totalGames = gameState.wins + gameState.losses + gameState.draws;
    const winRate = totalGames > 0 ? Math.round((gameState.wins / totalGames) * 100) : 0;
    elements.winRate.textContent = `${winRate}%`;
    
    // Update player level
    elements.playerLevel.textContent = gameState.playerLevel;
    
    // Update achievements
    updateAchievements();
    
    // Update computer choice display
    if (gameState.computerChoice) {
        const choiceIcons = {
            rock: '✊',
            paper: '✋',
            scissors: '✌️'
        };
        elements.computerChoice.innerHTML = `<span style="font-size: 3rem;">${choiceIcons[gameState.computerChoice]}</span>`;
    } else {
        elements.computerChoice.innerHTML = '<i class="fas fa-question"></i>';
    }
    
    // Update chart
    updateChart();
}

// Update streaks display
function updateStreaks() {
    // Player streak
    if (gameState.playerStreak >= 3) {
        elements.playerStreak.textContent = `${gameState.playerStreak} Win Streak!`;
        elements.playerStreak.style.background = 'linear-gradient(90deg, #ff8a00, #ff0080)';
        
        if (gameState.playerStreak >= 5) {
            elements.comboDisplay.style.display = 'flex';
            elements.comboText.textContent = `COMBO x${gameState.playerStreak} - BONUS!`;
            
            if (gameState.playerStreak % 5 === 0) {
                // Bonus points for every 5 streak
                gameState.playerScore += 1;
                playSound('combo');
                showMessage(`Combo Bonus! +1 Point`, 'combo');
            }
        } else {
            elements.comboDisplay.style.display = 'none';
        }
    } else {
        elements.playerStreak.textContent = 'No Streak';
        elements.playerStreak.style.background = '';
        elements.comboDisplay.style.display = 'none';
    }
    
    // Computer streak
    if (gameState.computerStreak >= 3) {
        elements.computerStreak.textContent = `${gameState.computerStreak} Win Streak!`;
        elements.computerStreak.style.background = 'linear-gradient(90deg, #ff416c, #ff4b2b)';
    } else {
        elements.computerStreak.textContent = 'No Streak';
        elements.computerStreak.style.background = '';
    }
}

// Check and update achievements
function checkAchievements() {
    const totalWins = gameState.wins;
    let level = 1;
    
    if (totalWins >= 50) {
        gameState.achievements.legendMode = true;
        level = 3;
    } else if (totalWins >= 25) {
        gameState.achievements.masterPlayer = true;
        level = 2;
    } else if (totalWins >= 10) {
        gameState.achievements.beginnerWarrior = true;
        level = 1;
    }
    
    gameState.playerLevel = level;
}

// Update achievements display
function updateAchievements() {
    document.querySelectorAll('.achievement').forEach(achievement => {
        const level = parseInt(achievement.dataset.level);
        
        if (level === 10 && gameState.wins >= 10) {
            achievement.classList.remove('locked');
            achievement.classList.add('unlocked');
        } else if (level === 25 && gameState.wins >= 25) {
            achievement.classList.remove('locked');
            achievement.classList.add('unlocked');
        } else if (level === 50 && gameState.wins >= 50) {
            achievement.classList.remove('locked');
            achievement.classList.add('unlocked');
        }
    });
}

// Update history panel
function updateHistoryPanel() {
    elements.historyList.innerHTML = '';
    
    if (gameState.history.length === 0) {
        elements.historyList.innerHTML = '<div class="history-empty">No game history yet. Play some rounds!</div>';
        return;
    }
    
    gameState.history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${item.result}`;
        
        const choiceIcons = {
            rock: '✊',
            paper: '✋',
            scissors: '✌️'
        };
        
        const resultText = {
            win: 'You Won',
            lose: 'You Lost',
            draw: 'Draw'
        };
        
        const playerName = item.isMultiplayer ? gameState.player1Name : 'You';
        const opponentName = item.isMultiplayer ? gameState.player2Name : 'Computer';
        
        historyItem.innerHTML = `
            <div class="history-round">Round ${item.round}</div>
            <div class="history-choices">
                ${playerName}: ${choiceIcons[item.playerChoice]} vs 
                ${opponentName}: ${choiceIcons[item.opponentChoice]}
            </div>
            <div class="history-result">${resultText[item.result]}</div>
            <div class="history-time">${item.timestamp}</div>
        `;
        
        elements.historyList.appendChild(historyItem);
    });
}

// Update chart
function updateChart() {
    const totalGames = gameState.wins + gameState.losses + gameState.draws;
    
    if (totalGames === 0) {
        document.querySelector('.win-bar').style.height = '0%';
        document.querySelector('.loss-bar').style.height = '0%';
        document.querySelector('.draw-bar').style.height = '100%';
    } else {
        const winPercent = (gameState.wins / totalGames) * 100;
        const lossPercent = (gameState.losses / totalGames) * 100;
        const drawPercent = (gameState.draws / totalGames) * 100;
        
        document.querySelector('.win-bar').style.height = `${winPercent}%`;
        document.querySelector('.loss-bar').style.height = `${lossPercent}%`;
        document.querySelector('.draw-bar').style.height = `${drawPercent}%`;
    }
}

// Animate result
function animateResult(result) {
    const resultIcons = {
        win: '🎉',
        lose: '💀',
        draw: '🤝'
    };
    
    const resultTexts = {
        win: 'You Win!',
        lose: 'You Lose!',
        draw: 'It\'s a Draw!'
    };
    
    const resultDescs = {
        win: `${capitalizeFirstLetter(gameState.playerChoice)} beats ${gameState.computerChoice}`,
        lose: `${capitalizeFirstLetter(gameState.computerChoice)} beats ${gameState.playerChoice}`,
        draw: 'Both chose the same'
    };
    
    elements.resultIcon.textContent = resultIcons[result];
    elements.resultText.textContent = resultTexts[result];
    elements.resultDesc.textContent = resultDescs[result];
    
    // Animation
    elements.resultIcon.style.animation = 'none';
    elements.resultText.style.animation = 'none';
    
    setTimeout(() => {
        elements.resultIcon.style.animation = 'pulse 0.5s ease 3';
        elements.resultText.style.animation = 'glow 1s ease 2';
    }, 10);
}

// Reset choices
function resetChoices() {
    gameState.playerChoice = null;
    document.querySelectorAll('.choice-btn:not([data-player])').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    if (gameState.gameMode !== 'multiplayer') {
        gameState.computerChoice = null;
    }
    
    elements.resultIcon.textContent = '⚔️';
    elements.resultText.textContent = 'Choose Your Weapon!';
    elements.resultDesc.textContent = 'First to 5 wins the game!';
}

// Reset game
function resetGame() {
    if (confirm('Are you sure you want to reset the game? Your scores will be saved.')) {
        gameState.playerScore = 0;
        gameState.computerScore = 0;
        gameState.playerStreak = 0;
        gameState.computerStreak = 0;
        gameState.round = 1;
        resetChoices();
        updateUI();
        saveGameState();
        playSound('click');
    }
}

// Start timer for timed mode
function startTimer() {
    if (gameState.timerActive) return;
    
    gameState.timerActive = true;
    gameState.timerSeconds = 3;
    elements.timer.textContent = `${gameState.timerSeconds}s`;
    elements.timer.style.color = '#f72585';
    
    gameState.timerInterval = setInterval(() => {
        gameState.timerSeconds--;
        elements.timer.textContent = `${gameState.timerSeconds}s`;
        
        if (gameState.timerSeconds <= 0) {
            clearInterval(gameState.timerInterval);
            gameState.timerActive = false;
            
            // Time's up - automatic draw
            if (!gameState.playerChoice) {
                gameState.draws++;
                gameState.round++;
                addToHistory('none', 'none', 'draw');
                updateUI();
                animateResult('draw');
                playSound('draw');
                showMessage('Time\'s up! Automatic draw.', 'info');
                
                elements.timer.textContent = '3s';
                elements.timer.style.color = '';
                
                // Reset for next round
                setTimeout(() => {
                    resetChoices();
                }, 2000);
            }
        }
    }, 1000);
    
    // Reset play button
    elements.playBtn.disabled = true;
    elements.playBtn.innerHTML = '<i class="fas fa-hourglass-half"></i> Time Running...';
    
    setTimeout(() => {
        elements.playBtn.disabled = false;
        elements.playBtn.innerHTML = '<i class="fas fa-clock"></i> Start Timer';
        gameState.timerActive = false;
        clearInterval(gameState.timerInterval);
        elements.timer.textContent = '3s';
        elements.timer.style.color = '';
    }, 3000);
}

// Share score
function shareScore() {
    const totalGames = gameState.wins + gameState.losses + gameState.draws;
    const winRate = totalGames > 0 ? Math.round((gameState.wins / totalGames) * 100) : 0;
    
    const shareText = `🎮 Rock Paper Scissors Score 🎮
Wins: ${gameState.wins}
Losses: ${gameState.losses}
Draws: ${gameState.draws}
Win Rate: ${winRate}%
Current Streak: ${gameState.playerStreak}
Level: ${gameState.playerLevel}

Play the ultimate Rock Paper Scissors game!`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Rock Paper Scissors Score',
            text: shareText,
            url: window.location.href
        }).catch(err => {
            console.log('Error sharing:', err);
            fallbackShare(shareText);
        });
    } else {
        fallbackShare(shareText);
    }
}

// Fallback share method
function fallbackShare(text) {
    navigator.clipboard.writeText(text).then(() => {
        showMessage('Score copied to clipboard!', 'success');
    }).catch(err => {
        console.log('Error copying:', err);
        showMessage('Could not share score', 'error');
    });
}

// Play sound
function playSound(soundType) {
    if (!gameState.soundEnabled) return;
    
    const sound = sounds[soundType];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Audio play failed:', e));
    }
}

// Vibrate device
function vibrate(duration) {
    if (!gameState.vibrationEnabled || !navigator.vibrate) return;
    
    navigator.vibrate(duration);
}

// Update sound toggle button
function updateSoundToggle() {
    if (gameState.soundEnabled) {
        elements.soundToggle.innerHTML = '<i class="fas fa-volume-up"></i> Sound On';
    } else {
        elements.soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i> Sound Off';
    }
}

// Update vibration toggle button
function updateVibrationToggle() {
    if (gameState.vibrationEnabled) {
        elements.vibrationToggle.innerHTML = '<i class="fas fa-mobile-alt"></i> Vibration On';
    } else {
        elements.vibrationToggle.innerHTML = '<i class="fas fa-mobile-alt"></i> Vibration Off';
    }
}

// Show message
function showMessage(message, type = 'info') {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : type === 'combo' ? '#ff9800' : '#2196F3'};
        color: white;
        border-radius: 10px;
        z-index: 10000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(messageEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageEl.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 300);
    }, 3000);
}

// Show confetti animation
function showConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confettiPieces = [];
    const confettiCount = 150;
    
    // Create confetti pieces
    for (let i = 0; i < confettiCount; i++) {
        confettiPieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 10 + 5,
            d: Math.random() * 5 + 2,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            tilt: Math.random() * 10 - 10,
            tiltAngleIncrement: Math.random() * 0.05 + 0.05,
            tiltAngle: 0
        });
    }
    
    let animationId;
    let time = 0;
    
    function drawConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        confettiPieces.forEach(p => {
            ctx.beginPath();
            ctx.lineWidth = p.r / 2;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
            ctx.stroke();
            
            // Update position
            p.y += p.d;
            p.tiltAngle += p.tiltAngleIncrement;
            p.tilt = Math.sin(p.tiltAngle) * 15;
            
            // Reset if off screen
            if (p.y > canvas.height) {
                p.y = -10;
                p.x = Math.random() * canvas.width;
            }
        });
        
        time++;
        
        if (time < 300) {
            animationId = requestAnimationFrame(drawConfetti);
        } else {
            cancelAnimationFrame(animationId);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    drawConfetti();
}

// Helper function
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Add CSS for message animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);
