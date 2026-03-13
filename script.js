let touchStartY = 0;
let touchEndY = 0;
let hasInteracted = false;

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация аудио для Safari
    const initAudioForSafari = () => {
        const audioElements = ['billiardSound', 'shakeSound', 'rollSound'];
        audioElements.forEach(id => {
            const audio = document.getElementById(id);
            if (audio) {
                // Создаем тишину для инициализации аудио контекста
                audio.volume = 0.1;
                audio.play().then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                    audio.volume = 1;
                }).catch(e => {
                    console.log(`Инициализация аудио ${id} не удалась:`, e);
                });
            }
        });
    };

    // Запускаем инициализацию при первом взаимодействии
    const firstInteraction = () => {
        initAudioForSafari();
        document.removeEventListener('touchstart', firstInteraction);
        document.removeEventListener('click', firstInteraction);
    };
    
    document.addEventListener('touchstart', firstInteraction, { once: true });
    document.addEventListener('click', firstInteraction, { once: true });
    // Всегда показываем шары при загрузке
    const invitationContent = document.getElementById('invitationContent');
    const poolContainer = document.querySelector('.pool-container');
    
    if (invitationContent) {
        invitationContent.classList.remove('show');
    }
    
    if (poolContainer) {
        poolContainer.style.display = 'flex';
        poolContainer.style.opacity = '1';
    }
    
    document.body.style.overflow = 'hidden';
    
    const cue = document.getElementById('cue');
    const balls = [
        document.getElementById('ball16'),
        document.getElementById('ball5'),
        document.getElementById('ball26')
    ];
    const predictionBall = document.getElementById('predictionBall');
    const predictionText = document.getElementById('predictionText');

    // Touch events
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Дополнительно: тап по центру шаров тоже запускает удар
    balls.forEach(ball => {
        ball.addEventListener('click', () => {
            if (!hasInteracted) triggerCueAnimation();
        });
    });
    
    // Mouse events for desktop testing
    let mouseDown = false;
    let mouseStartY = 0;
    
    document.addEventListener('mousedown', function(e) {
        if (!hasInteracted) {
            mouseDown = true;
            mouseStartY = e.clientY;
        }
    });
    
    document.addEventListener('mouseup', function(e) {
        if (mouseDown && !hasInteracted) {
            const mouseEndY = e.clientY;
            const diff = mouseStartY - mouseEndY;

            // срабатываем только на движение снизу вверх
            if (diff > 30) {
                triggerCueAnimation();
            }
            mouseDown = false;
        }
    });

    function handleTouchStart(e) {
        if (!hasInteracted) {
            touchStartY = e.touches[0].clientY;
        }
    }

    function handleTouchEnd(e) {
        if (!hasInteracted) {
            touchEndY = e.changedTouches[0].clientY;
            const diff = touchStartY - touchEndY;

            // свайп снизу вверх
            if (diff > 30) {
                triggerCueAnimation();
            }
        }
    }

    function triggerCueAnimation() {
        if (hasInteracted) return;
        
        hasInteracted = true;
        
        // Воспроизводим звук удара кия
        const billiardSound = document.getElementById('billiardSound');
        if (billiardSound) {
            billiardSound.currentTime = 0;
            billiardSound.play().catch(e => console.log('Не удалось воспроизвести звук:', e));
        }
        
        // Add hitting animation to cue
        cue.classList.add('hitting');
        
        // Scatter balls with delay
        setTimeout(() => {
            balls.forEach((ball, index) => {
                setTimeout(() => {
                    ball.classList.add('scattering');
                }, index * 100);
            });
        }, 300);
        
        // Hide swipe hint
        const swipeHint = document.querySelector('.swipe-hint');
        if (swipeHint) {
            swipeHint.style.opacity = '0';
        }
        
        // Show invitation content
        setTimeout(() => {
            invitationContent.classList.add('show');
            poolContainer.style.opacity = '0';
            
            // Enable scrolling on invitation content
            document.body.style.overflow = 'auto';
            
            // Hide pool container completely after transition
            setTimeout(() => {
                poolContainer.style.display = 'none';
            }, 1000);
        }, 1500);
    }

    // До удара не даём странице скроллиться, чтобы жест ощущался как удар
    document.addEventListener('touchmove', function(e) {
        if (!hasInteracted) {
            e.preventDefault();
        }
    }, { passive: false });

    // Шар-предсказание
    if (predictionBall && predictionText) {
        const predictions = [
            'не забьёшь<br>ни одного<br>шара',
            'забьёшь<br>свой шар',
            'напьёшься<br>пивом',
            'тебя чмокнет<br>Никита',
            'тебя чмокнет<br>Таня'
        ];

        const startPrediction = () => {
            // запускаем тряску на 3 секунды, затем показываем предсказание
            predictionBall.classList.add('shaking');
            predictionText.textContent = 'Шар думает...';
            
            // Воспроизводим звук тряски с улучшениями для Safari
            const shakeSound = document.getElementById('shakeSound');
            if (shakeSound) {
                shakeSound.currentTime = 0;
                // Для Safari: создаем обещание и обрабатываем ошибки
                const playPromise = shakeSound.play();
                
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('Звук тряски воспроизведен успешно');
                    }).catch(error => {
                        console.log('Ошибка воспроизведения звука тряски:', error);
                        // Повторная попытка для Safari
                        setTimeout(() => {
                            shakeSound.play().catch(e2 => console.log('Вторая попытка не удалась:', e2));
                        }, 200);
                    });
                }
            }
            
            setTimeout(() => {
                predictionBall.classList.remove('shaking');
                const random = predictions[Math.floor(Math.random() * predictions.length)];
                predictionText.innerHTML = random;
            }, 3000);
        };

        predictionBall.addEventListener('click', startPrediction);
        predictionBall.addEventListener('touchend', function(e) {
            e.preventDefault();
            startPrediction();
        }, { passive: false });
    }

    // Обратный отсчет до 16.05.2026
    function updateCountdown() {
        const targetDate = new Date('2026-05-16T20:00:00+03:00'); // 16 мая 2026, 20:00 по Москве
        const now = new Date();
        const difference = targetDate - now;
        
        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            
            const countdownNumber = document.getElementById('countdownNumber');
            if (countdownNumber) {
                countdownNumber.textContent = days;
            }
        }
    }

    // Функция для запуска анимации шара
    function rollBall() {
        if (hasRolled) return;
        
        const countdownBall = document.getElementById('countdownBall');
        if (countdownBall) {
            hasRolled = true;
            // Сначала убираем шар с экрана
            countdownBall.style.transform = 'translateX(-100vw) rotate(720deg)';
            countdownBall.style.opacity = '0';
            
            // Затем через короткое время показываем с анимацией
            setTimeout(() => {
                countdownBall.style.transition = 'transform 2s ease-out, opacity 2s ease-out';
                countdownBall.style.transform = 'translateX(0) rotate(0deg)';
                countdownBall.style.opacity = '1';
            }, 100);
        }
    }

    // Отслеживаем прокрутку до шара
    function setupCountdownBall() {
        const countdownBall = document.getElementById('countdownBall');
        if (!countdownBall) return;
        
        let hasRolled = false;
        
        // Функция для запуска анимации шара
        function rollBall() {
            if (hasRolled) return;
            hasRolled = true;
            
            // Воспроизводим звук выкатывания
            const rollSound = document.getElementById('rollSound');
            if (rollSound) {
                rollSound.currentTime = 0;
                rollSound.play().catch(e => console.log('Не удалось воспроизвести звук выкатывания:', e));
            }
            
            // Анимация выкатывания шара
            countdownBall.style.transition = 'none';
            countdownBall.style.transform = 'translateX(-100vw) rotate(720deg)';
            countdownBall.style.opacity = '0';
            
            setTimeout(() => {
                countdownBall.style.transition = 'all 3s ease-out';
                countdownBall.style.transform = 'translateX(0) rotate(0deg)';
                countdownBall.style.opacity = '1';
            }, 100);
        }
        
        // Используем IntersectionObserver
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    rollBall();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(countdownBall);
    }
    
    // Запускаем после небольшой задержки
    setTimeout(setupCountdownBall, 500);

    // Обновляем таймер каждую минуту
    updateCountdown();
    setInterval(updateCountdown, 60000); // 60000 мс = 1 минута
});
