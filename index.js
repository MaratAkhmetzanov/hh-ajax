const searchInpit = document.getElementById('search__input');
const searchResults = document.querySelector('.search__results');
const searchResultslist = document.querySelector('.search__results-list');
const searchResultsLoader = document.querySelector('.search__results-loader');
const searchNoResults = document.querySelector('.search__no-results');
const historyList = document.querySelector('.history__list');

/**
 * Получение данных с по url через fetch (стырено из дз по js1 и измененно малость)
 * @param {String} url - адрес куда отправляется запрос
 * @returns
 */
const getData = async (url) =>
    await fetch(url, {
        method: 'GET',
        redirect: 'follow',
    }).then((res) => {
        if (res.ok) {
            return res.json();
        } else {
            return Promise.reject('Error');
        }
    });

/**
 * Поисковой запрос на сервер по введенному тексту. Берем текст и получаем данные через getData и оттуда забираем только массив
 * @param {String} searchText - то что ввели в строку поиска
 * @returns - массив возможных вариантов
 */
const loadSearch = async (searchText, count) => {
    const result = await getData(`https://api.jikan.moe/v4/anime?limit=${count}&letter=${searchText}`);
    return result.data;
};

/**
 * Добавление новой записи в localStorage
 * @param {String} title - название аниме
 * @param {Number} mal_id - id аниме
 */
const addToLocalStorage = (title, mal_id) => {
    let searchHistory = JSON.parse(window.localStorage.getItem('searchHistory'));

    if (searchHistory) {
        searchHistory = searchHistory.filter((item) => item.mal_id !== mal_id);
        searchHistory = [{ title, mal_id }, ...searchHistory];
    } else {
        searchHistory = [{ title, mal_id }];
    }

    try {
        window.localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    } catch {
        console.log('Set local storage error');
    }

    updateSearhHistory();
};

/**
 * Добавляет в предложенные варианты поиска ещё и варианты из истории, если есть что-то подходящее.
 * Также на каждый элемент вешается слушатель события клика.
 * @param {*} searchResultslist - блок куда добавляются варианты.
 * @param {Array} historyMatch - массив подходящих элементов из истории.
 */
const addHistoryToSearchList = (searchResultslist, historyMatch) => {
    if (historyMatch.length > 0) {
        historyMatch.forEach((item, index) => {
            if (index < 5) {
                const listItem = document.createElement('li');
                listItem.classList.add('search__results-list-item-history');
                listItem.dataset.mal_id = item.mal_id;
                listItem.innerText = item.title;
                searchResultslist.appendChild(listItem);
                listItem.addEventListener('click', searchResultItemClickHandler);
            }
        });
        searchResultslist.insertAdjacentHTML('beforeend', '<hr class = "search__results-divider">');
    }
};

/**
 * Функция обновляющая историю результатов на странице. Берём список из localSrorage и обновляем блок с историей.
 * Работает при загрузке страницы и при добавлении элемента в историю.
 */
const updateSearhHistory = () => {
    let searchHistory = JSON.parse(window.localStorage.getItem('searchHistory'));
    historyList.innerHTML = '';

    if (searchHistory) {
        for (let i = 0; i < 3; i++) {
            if (searchHistory[i]) {
                const historyItem = document.createElement('li');
                historyItem.classList.add('history__item');
                historyItem.dataset.mal_id = searchHistory[i].mal_id;
                historyItem.innerText = searchHistory[i].title;
                historyList.appendChild(historyItem);
                historyItem.addEventListener('click', (event) => {
                    setResultData(event.target.dataset.mal_id);
                    searchInpit.value = event.target.innerText;
                });
            } else {
                break;
            }
        }
        document.querySelector('.history').classList.add('visible');
    } else {
        document.querySelector('.history').classList.remove('visible');
    }
};

/**
 * Обработчик нажатия на элемент в предложенных вариантах поиска.
 * Тут обновляем переменную в localStorage, обновляем историю поиска, добавляем результат под поле поиска.
 * @param {Event} event
 */
const searchResultItemClickHandler = (event) => {
    searchResults.classList.remove('search__results_visible');
    addToLocalStorage(event.target.innerText, event.target.dataset.mal_id);
    setResultData(event.target.dataset.mal_id);
    searchInpit.value = event.target.innerText;
};

/**
 * Загружаем данные с сервера по id и отображаем на странице.
 * @param {Number} id
 */
const setResultData = async (id) => {
    const result = await getData(`https://api.jikan.moe/v4/anime/${id}`);
    document.querySelector('.content').classList.add('content_visible');
    document.querySelector('.divider').classList.add('divider_visible');
    document.querySelector('.content__image').setAttribute('src', result.data.images.jpg.image_url);
    document.querySelector('.content__title').innerText = result.data.title;
    document.querySelector('.content__synopsis').innerText = result.data.synopsis;
};

// Основной скрипт, который обрабатываем ввод в поле поиска и загружает историю при старте.
(async () => {
    updateSearhHistory();
    searchInpit.addEventListener('input', (event) => {
        const { value } = event.target;
        if (value) {
            searchResults.classList.add('search__results_visible');
            searchResultslist.classList.remove('visible');
            searchNoResults.classList.remove('visible');
            searchResultsLoader.classList.add('visible');

            const searchHistory = JSON.parse(window.localStorage.getItem('searchHistory')) || [];
            const historyMatch = searchHistory.filter((item) =>
                item.title.toLowerCase().startsWith(value.toLowerCase()),
            );

            const searchCount = historyMatch.length <= 5 ? 10 - historyMatch.length : 5;
            loadSearch(value, searchCount).then((data) => {
                searchResultslist.innerHTML = '';
                addHistoryToSearchList(searchResultslist, historyMatch);
                if (data?.length > 0) {
                    data.forEach((item, index) => {
                        const listItem = document.createElement('li');
                        listItem.classList.add('search__results-list-item');
                        listItem.dataset.mal_id = item.mal_id;
                        listItem.innerText = item.title;
                        searchResultslist.appendChild(listItem);
                        listItem.addEventListener('click', searchResultItemClickHandler);
                        searchResultslist.classList.add('visible');
                        searchResultsLoader.classList.remove('visible');
                    });
                } else {
                    searchNoResults.classList.add('visible');
                    searchResultsLoader.classList.remove('visible');
                    searchResultslist.classList.remove('visible');
                }
            });
        } else {
            searchResults.classList.remove('search__results_visible');
            searchResultslist.classList.remove('visible');
        }
    });

    window.addEventListener('storage', updateSearhHistory);
})();
