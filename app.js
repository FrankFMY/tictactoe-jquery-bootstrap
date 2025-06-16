/**
 * Константы для игры Крестики-нолики.
 */
const GameConstants = {
    PLAYERS: { X: 'X', O: 'O' },
    GAME_OUTCOMES: { DRAW: 'draw', WIN: 'win' },
    MESSAGES: {
        TURN_X: 'Ходит X',
        TURN_O: 'Ходит O',
        DRAW: 'Ничья!',
        WIN: (player) => `Победил ${player}!`,
        CELL_OCCUPIED: (index, player) =>
            `Клетка ${index} занята игроком ${player}`,
        CELL_EMPTY: (index) => `Клетка ${index} пуста`,
    },
    THEME: {
        STORAGE_KEY: 'theme',
        DARK: 'dark',
        LIGHT: 'light',
        CLASS_NAME: 'dark-theme',
    },
    BOARD_SIZE: 9,
    WIN_COMBOS: [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8], // Горизонтали
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8], // Вертикали
        [0, 4, 8],
        [2, 4, 6], // Диагонали
    ],
};

/**
 * Класс для управления пользовательским интерфейсом игры Крестики-нолики с использованием jQuery.
 */
class GameUI {
    constructor() {
        this.$cells = $('.cell');
        this.$statusDisplay = $('#status');
        this.$restartButton = $('#restart');
        this.$themeToggleButton = $('#theme-toggle');
        this.$resultsList = $('#game-results');

        if (
            !this.$statusDisplay.length ||
            !this.$restartButton.length ||
            !this.$themeToggleButton.length ||
            !this.$resultsList.length
        ) {
            console.error(
                'Не удалось найти необходимые DOM-элементы. Убедитесь, что ID корректны.'
            );
            return;
        }

        this.initEventListeners();
    }

    /**
     * Инициализирует слушателей событий для элементов UI.
     */
    initEventListeners() {
        // Обработчики будут привязаны извне, в классе TicTacToe
    }

    /**
     * Обновляет содержимое указанной ячейки на доске.
     * @param {jQuery} $cellElement - Элемент DOM ячейки, обернутый в jQuery.
     * @param {string} content - Содержимое для установки (X или O).
     */
    updateCell($cellElement, content) {
        $cellElement.text(content);
        if (content === GameConstants.PLAYERS.X) {
            $cellElement.addClass('player-x').removeClass('player-o');
        } else if (content === GameConstants.PLAYERS.O) {
            $cellElement.addClass('player-o').removeClass('player-x');
        } else {
            $cellElement.removeClass('player-x player-o');
        }
    }

    /**
     * Очищает все ячейки на доске.
     */
    clearCells() {
        this.$cells.text('').removeClass('player-x player-o');
    }

    /**
     * Обновляет сообщение о статусе игры.
     * @param {string} message - Сообщение для отображения.
     */
    updateStatus(message) {
        this.$statusDisplay.text(message);
    }

    /**
     * Устанавливает ARIA-метку для ячейки.
     * @param {jQuery} $cellElement - Элемент DOM ячейки, обернутый в jQuery.
     * @param {number} index - Индекс ячейки.
     * @param {string} content - Текущее содержимое ячейки (X, O, или пустая строка).
     */
    setCellAriaLabel($cellElement, index, content) {
        if (
            content === GameConstants.PLAYERS.X ||
            content === GameConstants.PLAYERS.O
        ) {
            $cellElement.attr(
                'aria-label',
                GameConstants.MESSAGES.CELL_OCCUPIED(index, content)
            );
        } else {
            $cellElement.attr(
                'aria-label',
                GameConstants.MESSAGES.CELL_EMPTY(index)
            );
        }
    }

    /**
     * Переключает класс темной темы для body.
     * @param {boolean} isDark - true, если должна быть темная тема, false для светлой.
     */
    toggleThemeClass(isDark) {
        if (isDark) {
            $('body').addClass(GameConstants.THEME.CLASS_NAME);
        } else {
            $('body').removeClass(GameConstants.THEME.CLASS_NAME);
        }
    }

    /**
     * Обновляет иконку кнопки переключения темы.
     * @param {boolean} isDarkThemeActive - true, если активна темная тема.
     */
    updateThemeIcon(isDarkThemeActive) {
        const $iconElement = this.$themeToggleButton.find('i');
        if ($iconElement.length) {
            if (isDarkThemeActive) {
                $iconElement
                    .removeClass('bi-sun-fill')
                    .addClass('bi-moon-fill');
            } else {
                $iconElement
                    .removeClass('bi-moon-fill')
                    .addClass('bi-sun-fill');
            }
        }
    }

    /**
     * Добавляет результат игры в список.
     * @param {number} gameNumber - Номер игры.
     * @param {string} result - Результат игры (например, 'Победа X', 'Ничья!').
     */
    addGameResult(gameNumber, result) {
        const $listItem = $('<li>')
            .addClass('list-group-item')
            .text(`Игра ${gameNumber} - ${result}`);
        this.$resultsList.append($listItem);
        this.$resultsList.scrollTop(this.$resultsList[0].scrollHeight); // Прокрутка вниз
    }

    /**
     * Очищает список результатов игр.
     */
    clearResults() {
        this.$resultsList.empty();
    }
}

/**
 * Класс для управления логикой игры Крестики-нолики.
 */
class TicTacToe {
    /**
     * @param {GameUI} ui - Экземпляр класса GameUI для взаимодействия с пользовательским интерфейсом.
     */
    constructor(ui) {
        this.ui = ui;
        this.board = Array(GameConstants.BOARD_SIZE).fill('');
        this.turn = GameConstants.PLAYERS.X;
        this.gameOver = false;
        this.gameNumber = 1; // Добавляем номер текущей игры

        this.init();
    }

    /**
     * Инициализирует игру, настраивает слушателей событий и загружает тему.
     */
    init() {
        this.ui.$cells.on('click', this.handleCellClick.bind(this));
        this.ui.$cells.each((index, cell) => {
            this.ui.setCellAriaLabel($(cell), $(cell).data('index'), ''); // Установить начальные ARIA-метки
        });

        this.ui.$restartButton.on('click', this.restartGame.bind(this));
        this.ui.$themeToggleButton.on('click', this.toggleTheme.bind(this));

        this.loadTheme();
        this.ui.updateStatus(GameConstants.MESSAGES.TURN_X);
    }

    /**
     * Проверяет наличие победителя или ничьей.
     * @returns {string|null} Игрок-победитель (X или O), 'draw' для ничьей, или null, если игра продолжается.
     */
    checkWinner() {
        for (let i = 0; i < GameConstants.WIN_COMBOS.length; i++) {
            const [a, b, c] = GameConstants.WIN_COMBOS[i];
            if (
                this.board[a] &&
                this.board[a] === this.board[b] &&
                this.board[a] === this.board[c]
            ) {
                return this.board[a];
            }
        }
        return this.board.includes('')
            ? null
            : GameConstants.GAME_OUTCOMES.DRAW;
    }

    /**
     * Обновляет статус игры и UI.
     */
    updateGameStatus() {
        const winner = this.checkWinner();
        if (winner) {
            let resultMessage;
            if (winner === GameConstants.GAME_OUTCOMES.DRAW) {
                resultMessage = GameConstants.MESSAGES.DRAW;
            } else {
                resultMessage = GameConstants.MESSAGES.WIN(winner);
            }
            this.ui.updateStatus(resultMessage);
            this.ui.addGameResult(
                ((this.gameNumber - 1) % 5) + 1,
                resultMessage
            ); // Добавляем результат игры, используя номер в блоке
            this.gameOver = true;
        } else {
            this.ui.updateStatus(
                this.turn === GameConstants.PLAYERS.X
                    ? GameConstants.MESSAGES.TURN_X
                    : GameConstants.MESSAGES.TURN_O
            );
        }
    }

    /**
     * Обрабатывает клик по ячейке.
     * @param {Event} event - Событие клика.
     */
    handleCellClick(event) {
        const $cell = $(event.target);
        const idx = parseInt($cell.data('index'), 10);

        if (this.board[idx] || this.gameOver) {
            return;
        }

        this.board[idx] = this.turn;
        this.ui.updateCell($cell, this.turn);
        this.ui.setCellAriaLabel($cell, idx, this.turn);

        const winner = this.checkWinner();
        if (winner) {
            this.updateGameStatus();
            if (this.gameOver) {
                this.gameNumber++; // Увеличиваем номер игры только после завершения
            }
        } else {
            this.turn =
                this.turn === GameConstants.PLAYERS.X
                    ? GameConstants.PLAYERS.O
                    : GameConstants.PLAYERS.X;
            this.updateGameStatus();
        }
    }

    /**
     * Перезапускает игру.
     */
    restartGame() {
        if ((this.gameNumber - 1) % 5 === 0 && this.gameNumber > 1) {
            // Если только что сыграна 5-я, 10-я и т.д. игра
            this.ui.clearResults();
        }
        this.board.fill('');
        this.ui.clearCells();
        this.ui.$cells.each((index, cell) => {
            this.ui.setCellAriaLabel($(cell), $(cell).data('index'), '');
        });
        this.turn = GameConstants.PLAYERS.X;
        this.gameOver = false;
        this.ui.updateStatus(GameConstants.MESSAGES.TURN_X);
    }

    /**
     * Загружает сохраненную тему или устанавливает светлую по умолчанию.
     */
    loadTheme() {
        const savedTheme = localStorage.getItem(
            GameConstants.THEME.STORAGE_KEY
        );
        const prefersDark = window.matchMedia(
            '(prefers-color-scheme: dark)'
        ).matches;
        let isDark = false;

        if (savedTheme) {
            isDark = savedTheme === GameConstants.THEME.DARK;
        } else {
            isDark = prefersDark;
        }

        this.ui.toggleThemeClass(isDark);
        this.ui.updateThemeIcon(isDark);
    }

    /**
     * Переключает тему между светлой и темной.
     */
    toggleTheme() {
        const isDark = $('body').hasClass(GameConstants.THEME.CLASS_NAME);
        const newTheme = isDark
            ? GameConstants.THEME.LIGHT
            : GameConstants.THEME.DARK;

        localStorage.setItem(GameConstants.THEME.STORAGE_KEY, newTheme);
        this.ui.toggleThemeClass(newTheme === GameConstants.THEME.DARK);
        this.ui.updateThemeIcon(newTheme === GameConstants.THEME.DARK);
    }
}

$(document).ready(() => {
    const ui = new GameUI();
    new TicTacToe(ui);
});
