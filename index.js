/**
 * Получение данных с по url через fetch (стырено из дз по js1 и измененно малость)
 * @param {string} url - адрес куда отправляется запрос
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
 * @param {string} searchText - то что ввели в строку поиска
 * @returns - массив возможных вариантов
 */
const loadSearch = async (searchText) => {
    const result = await getData(`https://api.jikan.moe/v4/anime?limit=10&letter=${searchText}`);
    return result.data;
};

/**
 * Функция обновляющая историю результатов на странице. Берём список из localSrorage и обновляем блок с историей.
 * Работает при загрузке страницы и при добавлении элемента в историю.
 */
const updateSearhHistory = () => {
    const historyList = document.querySelector('.history__list');
    let searchHistory = JSON.parse(window.localStorage.getItem('searchHistory'));
    historyList.innerHTML = '';
    if (searchHistory) {
        searchHistory.forEach((item) => {
            const historyItem = document.createElement('li');
            historyItem.classList.add('history__item');
            historyItem.dataset.mal_id = item.mal_id;
            historyItem.innerText = item.title;
            historyList.appendChild(historyItem);
            historyItem.addEventListener('click', (event) => {
                setResultData(event.target.dataset.mal_id);
                searchInpit.value = event.target.innerText;
            });
        });
        document.querySelector('.history').classList.add('visible');
    } else {
        document.querySelector('.history').classList.remove('visible');
    }
};

/**
 * Добавляет в предложенные варианты поиска ещё и варианты из истории, если есть что-то подходящее.
 * Также на каждый элемент вешается слушатель события клика.
 * @param {*} searchResultslist - блок куда добавляются варианты.
 * @param {string} value - то что ввели строку поиска
 */
const addHistoryToSearchList = (searchResultslist, value) => {
    const searchHistory = JSON.parse(window.localStorage.getItem('searchHistory')) || [];
    const historyMatch = searchHistory.filter((item) => item.title.toLowerCase().startsWith(value.toLowerCase()));
    if (historyMatch.length > 0) {
        historyMatch.forEach((item, index) => {
            if (index < 5) {
                const listItem = document.createElement('li');
                listItem.classList.add('search__results-list-item-history');
                listItem.dataset.mal_id = item.mal_id;
                listItem.innerText = item.title;
                searchResultslist.appendChild(listItem);
                listItem.addEventListener('click', (event) => {
                    document.querySelector('.search__results').classList.remove('search__results_visible');
                    setResultData(event.target.dataset.mal_id);
                    searchInpit.value = event.target.innerText;
                });
            }
        });
        searchResultslist.insertAdjacentHTML('beforeend', '<hr class = "search__results-divider">');
    }
};

/**
 * Обработчик нажатия на элемент в предложенных вариантах поиска (которые с сервера прилетели).
 * Тут обновляем переменную в localStorage, добавляем результат поиска и обновляем историю поиска.
 * @param {clickEvent} event 
 */
const searchResultClickHandler = (event) => {
    const { mal_id } = event.target.dataset;
    const searchInpit = document.getElementById('search__input');
    let searchHistory = JSON.parse(window.localStorage.getItem('searchHistory'));
    searchResults.classList.remove('search__results_visible');
    console.log(searchHistory);
    if (searchHistory) {
        searchHistory = searchHistory.filter((item) => item.mal_id !== mal_id);
        searchHistory = [{ title: event.target.innerText, mal_id }, ...searchHistory];
    } else {
        searchHistory = [{ title: event.target.innerText, mal_id }];
    }
    try {
        window.localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    } catch {
        console.log('Set local storage error');
    }

    setResultData(event.target.dataset.mal_id);
    updateSearhHistory();
    searchInpit.value = event.target.innerText;
};

/**
 * Загружаем данные с сервера по id и отображаем на странице.
 * @param {number} id 
 */
const setResultData = async (id) => {
    const result = await getData(`https://api.jikan.moe/v4/anime/${id}`);
    document.querySelector('.content').classList.add('content_visible');
    document.querySelector('.divider').classList.add('divider_visible');
    document.querySelector('.content__image').setAttribute('src', result.data.images.jpg.image_url);
    document.querySelector('.content__title').innerText = result.data.title;
    document.querySelector('.content__synopsis').innerText = result.data.synopsis;
};

const searchInpit = document.getElementById('search__input');
const searchResults = document.querySelector('.search__results');
const searchResultslist = document.querySelector('.search__results-list');
const searchResultsLoader = document.querySelector('.search__results-loader');
const searchNoResults = document.querySelector('.search__no-results');

// Основной скрипт, который обрабатываем ввод в поле поиска и загружает историю при старте.
(async () => {
    updateSearhHistory();
    searchInpit.addEventListener('input', (event) => {
        const { value } = event.target;
        if (value) {
            searchResultslist.innerHTML = '';
            searchResults.classList.add('search__results_visible');
            searchResultslist.classList.remove('visible');
            searchNoResults.classList.remove('visible');
            searchResultsLoader.classList.add('visible');

            addHistoryToSearchList(searchResultslist, value);

            loadSearch(value).then((data) => {
                if (data?.length > 0) {
                    data.forEach((item, index) => {
                        const listItem = document.createElement('li');
                        listItem.classList.add('search__results-list-item');
                        listItem.dataset.mal_id = item.mal_id;
                        listItem.innerText = item.title;
                        searchResultslist.appendChild(listItem);
                        searchResultslist.classList.add('visible');
                        searchResultsLoader.classList.remove('visible');
                        listItem.addEventListener('click', searchResultClickHandler);
                    });
                } else {
                    searchNoResults.classList.add('visible');
                    searchResultsLoader.classList.remove('visible');
                }
            });
        } else {
            searchResults.classList.remove('search__results_visible');
            searchResultslist.classList.remove('visible');
        }
    });
})();
