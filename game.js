'use strict';
import * as keyboards from './keyboards.js';
import * as app from './app.js';
import * as dq from './database-queries.js';
import * as functions from './functions.js';


//Запуск регистрации и игры
export async function launch(ChatID) {
    await dq.updateDataClearDataGame(ChatID);
    await registration(ChatID); //Зарегистрировали игроков
    await dq.updateDataStartGame(ChatID, Date.now()); //Закрыли регистрацию и записали время начала игры
    const data = await dq.getDataGame(ChatID);//Получаем записавшихся человек
    if (data.dataGame.counterPlayers > 3) {
        await app.bot.telegram.sendMessage(ChatID, 'Игра начинается!');
        const masRoles = await creatingRoles(ChatID, data.dataGame.counterPlayers); //Получаем массив ролей
        await distributionOfRoles(ChatID, masRoles, data.players); //Раздаю роли игрокам
        await sendRoleMessage(ChatID); //Отправляем сообщение с ролью и описанием
        let continueGame = true;
        while(continueGame) {
            const data = await dq.getDataGame(ChatID);
            console.log('Смена суток');
            console.log(data);
            //await deleteMessageAct(data, ChatID); //Удаляем сообщения на которые пользователь не нажимал
            if (data.dataGame.statysDay) {
                await day(ChatID, data); //Наступает день
            } else {
                await night(ChatID, data); //Наступает ночь
            }
            continueGame = await checkingTheEndOfTheGame(ChatID); //Проверяем нужно ли продолжить игру
        }
    } else {//Отправляем сообщение что недостаточно игроков и очищаем данные
        const dataMessageID = await dq.getDataDeleteMessageRegistration(ChatID);
        if (dataMessageID.messageID != 0 ) {
            await app.bot.telegram.sendMessage(
                ChatID, 
                'Недостаточно игроков, игра отменена!'
            );
        }
    }
    await dq.updateDataClearDataGame(ChatID);
}


//Редактируем сообщение регистрации
export async function updateMessageRegistration(chatID) {
    const data = await dq.getDataUpdateMessageRegistration(chatID);
    let textMessage = `Игра начнётся через ${data.registrationTimeLeft} секунд! \nСписок участников:` + await getLifeUsersText(chatID);
    app.bot.telegram.editMessageText(
        chatID, 
        data.messageID, 
        null, 
        textMessage, 
        {
        parse_mode: 'HTML', 
        reply_markup: keyboards.userRegistrationBtn(process.env.URL_BOT, chatID)
        }
    );
}


//Очищаем данные игры и останавливаем игру
export async function clearDataGame(chatID) {
    const dataMessageID = await dq.getDataDeleteMessageRegistration(chatID);
    try {
        if (dataMessageID != 0) {
        await app.bot.telegram.deleteMessage(chatID, dataMessageID.messageID);
        }
    }
    finally  {
        await dq.updateDataClearDataGame(chatID);
        await app.bot.telegram.sendMessage(
            chatID, 
            'Игра остановлена!'
        ); 
    }    
}


//Закрытие чата для всех кто не живой
export async function closeWriteChat(ctx) {
    const data = await dq.getDataCloseWriteChat(ctx.message.chat.id);
    console.log(data);
    if (data != null && data.dataGame.counterDays != 0) {
        if (data.dataGame.statysDay) {
            let DeleteMessage = true;
            for (const item of data.players) {
                if (item.userID == ctx.message.from.id && (item.lifeStatus || item.dyingMessage)) {
                    DeleteMessage = false;
                    if (item.dyingMessage) {
                        await dq.updateDyingMessage(ctx.message.chat.id, ctx.message.from.id);
                    }
                }
            }
            if (DeleteMessage) {
                ctx.deleteMessage();
            }
        } else {
            ctx.deleteMessage();
        }
    }
}

//Создаем массив с ролями и записываем в бд сколько у нас из какого клана
async function creatingRoles(chatID, counter) {
    let masRoles, counterWorld = 0, counterMafia = 2, counterTriada = 0;
    if (counter <5) {
        masRoles = ['Дон', 'Доктор', 'Счастливчик']; //2
        counterWorld = 2;
        counterMafia = 1;
    } else if (counter <7) {
        masRoles = ['Дон', 'Доктор', 'Комиссар', 'Счастливчик'];//2
        counterWorld = 3;
    } else if (counter <9) {
        masRoles = ['Дон', 'Крёстный отец', 'Доктор', 'Комиссар', 'Счастливчик', 'Камикадзе'];//3
        counterWorld = 4;
    } else if (counter <10) {
        masRoles = [
            'Дон', 'Крёстный отец', 'Доктор', 'Комиссар', 'Счастливчик', 'Камикадзе', 
            'Телохранитель', 'Мститель'
        ];//2
        counterWorld = 6;
    } else if (counter <11) {
        masRoles = [
            'Дон', 'Крёстный отец', 'Доктор', 'Комиссар', 'Счастливчик', 'Камикадзе', 
            'Телохранитель', 'Мститель', 'Красотка'
        ];//2
        counterWorld = 7;
    } else if (counter <13) {
        masRoles = [
            'Дон', 'Крёстный отец', 'Доктор', 'Комиссар', 'Лейтенант', 'Счастливчик', 
            'Камикадзе', 'Телохранитель', 'Мститель', 'Красотка'
        ];//3
        counterWorld = 8;
    } else if (counter <15) {
        masRoles = [
            'Дон', 'Крёстный отец', 'Доктор', 'Комиссар', 'Лейтенант', 'Счастливчик', 
            'Камикадзе', 'Телохранитель', 'Мститель', 'Красотка', 'Триада'
        ];//4
        counterWorld = 8;
        counterTriada = 1;
    } else if (counter <19) {
        masRoles = [
            'Дон', 'Крёстный отец', 'Доктор', 'Комиссар', 'Лейтенант', 'Счастливчик', 
            'Камикадзе', 'Телохранитель', 'Мститель', 'Красотка', 'Триада', 'Сенсей'
        ];//7
        counterWorld = 8;
        counterTriada = 2;
    }
    const WorldPlayer = counter-masRoles.length;
    if (WorldPlayer != 0) {
        for (let i = 0; i < WorldPlayer ; i++) { 
            masRoles.push('Мирный житель');
            counterWorld+=1;
        }
    }
    await dq.updateCounterRolesGame(chatID, counterWorld, counterMafia, counterTriada);   ///Тут может не работать ибо я не дожидаюсь завершения асинхронной функции
    return mixingMas(masRoles);
}

//Присваиваем роли игрокам
function distributionOfRoles(ChatID, masRoles, masPlayers) {
    masPlayers.forEach((item, i) => {
        let allies = 0;
        if (masRoles[i] == 'Комиссар' || masRoles[i] == 'Лейтенант') {
            allies = 1;
        } else if (masRoles[i] == 'Дон' || masRoles[i] == 'Крёстный отец') {
            allies = 2;
        } else if (masRoles[i] == 'Триада' || masRoles[i] == 'Сенсей') {
            allies = 3;
        }
        dq.addRolePlayer(ChatID, item.userID, masRoles[i], allies);
    });
}

//Перемешиваем массив с ролями
function mixingMas(arr) {
    let tmp, randindex;
    const length  = arr.length;
    for (let j = 0; j < 3 ; j++) {
        for (let i = 0; i < length ; i++) { 
            randindex = getRandomInt(0, length);
            tmp = arr[i];
            arr[i] = arr[randindex];
            arr[randindex] = tmp;
        }
    }
    return arr;
}

//Получение рандомного числа в диапазоне
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

//Наступление ночи
async function night(ChatID, data) {
    await dq.clearCounterActiveRoles(ChatID); //Очищаем счетчик активных ролей
    await sendNightMessage(ChatID); //Отправили гифку с наступлением ночи
    await sendNightMessageLivePlayers(ChatID); //Отправляем сообщение с живыми игроками
    await sendNightMessageActionsLivePlayers(ChatID, data);//Отправляем сообщение с кнопками для действий
    for (let i = 0; i < 12; i++) { //Ждем минуту или пока все активные роли не проголосуют
        await delay(5000);
        const data = await dq.getDataCounterActiveRoles(ChatID);
        if (data.dataGame.counterActiveRoles == 0){
            break;
        }              
    }
    let newData = await dq.getDataGame(ChatID);
    await ProcessingResultsNight(newData, ChatID); //Обрабатываем результаты ночи и перезаписываем данные
}

//Наступление дня
async function day(ChatID, data) {
    const i = data.dataGame.counterDays/2;
    await deleteMessageAct(data, ChatID); //Удаляем сообщения на которые пользователь не нажимал ночью
    await sendSunMessage(ChatID, i); //Отправили гифку с наступлением дня
    await sendDayMessageLivePlayers(ChatID, data); //Отправляем сообщение с живыми игроками
    await delay(45000); //Ждем 45 секунд
    await sendMessageVote(ChatID, data.players);//Отправляем голосовалку
    await delay(45000);// Ждем 45 секунд 
    await ProcessingResultsDay(ChatID); 
    await dq.updateStatusDay(ChatID, false);
}

//Отправляем сообщение с дневным голосованием
async function sendMessageVote(ChatID, players) {
    for (const player of players) {
        if (player.lifeStatus && player.votes) {
            const messageData = await app.bot.telegram.sendMessage(
                player.userID, 
                'Пришло время искать виноватых!\nКого ты хочешь линчевать?',
                { 
                    parse_mode: 'HTML', 
                    reply_markup: keyboards.buttonActionsDay(ChatID, players, player.userID) 
                }
            );
            await dq.updateMessageIDPlayer(ChatID, messageData.message_id, player.userID);
        }
    }
}

//Удаляем сообщения если пользователь не выбрал действие
async function deleteMessageAct(data, ChatID) {
    for (const player of data.players) {
        if (player.messageID != 0) {
            await app.bot.telegram.deleteMessage(player.userID, player.messageID);
        }
        await dq.clearMessageIDPlayers(ChatID, player.userID);
    }
}

//Отправляем сообщение в чат о том что игрок сделал ход
async function sendMessageAboutProgressRole(ChatID, userID, actUserID) { 
    const user = await dq.getInfoPlayer(ChatID, userID),
          userAct = await dq.getInfoPlayer(ChatID, actUserID);
    let textMessage = '',
        textMessageUser = '';
    switch(user.players[0].role){
        case 'Дон':
            textMessage = '🤵🏻 <b>Мафия</b> выбрала жертву...';
            textMessageUser = `Ты ушёл стрелять в <a href="tg://user?id=${userAct.players[0].userID}">${userAct.players[0].name}</a>`;
            break;
        case 'Крёстный отец':
            textMessage = '🤵🏼 <b>Крёстный отец</b> похитил игрока...';
            textMessageUser = `Ты похитил и заставил молчать <a href="tg://user?id=${userAct.players[0].userID}">${userAct.players[0].name}</a>`;
            break;
        case 'Доктор':
            textMessage = '👨🏼‍⚕️ <b>Доктор</b> вышел на ночное дежурство...';
            textMessageUser = `Ты ушёл лечить <a href="tg://user?id=${userAct.players[0].userID}">${userAct.players[0].name}</a>`;
            break;
        case 'Комиссар':
            if (user.players[0].copCheck){
                textMessage = '🕵🏼️‍♂️ <b>Комиссар</b> ушёл искать злодеев...';
                textMessageUser = `Ты ушёл проверять <a href="tg://user?id=${userAct.players[0].userID}">${userAct.players[0].name}</a>`;
            } else {
                textMessage = '🕵🏼️‍♂️ <b>Комиссар</b> зарядил свой пистолет и готов сделать выстрел...';
                textMessageUser = `Ты ушёл мочить <a href="tg://user?id=${userAct.players[0].userID}">${userAct.players[0].name}</a>`;
            }
            break;
        case 'Телохранитель':
            textMessage = '👥 <b>Телохранитель</b> ушёл рисковать жизнью...';
            textMessageUser = `Ты ушёл защищать <a href="tg://user?id=${userAct.players[0].userID}">${userAct.players[0].name}</a>`;
            break;
        case 'Мститель':
            textMessage = '🔪 <b>Мститель</b> ушёл в подворотни...';
            textMessageUser = `Ты ушёл стрелять в <a href="tg://user?id=${userAct.players[0].userID}">${userAct.players[0].name}</a>`;
            break;
        case 'Красотка':
            textMessage = '💃🏻 <b>Красотка</b> подарила незабываемую ночь...';
            textMessageUser = `Ты ушла радовать <a href="tg://user?id=${userAct.players[0].userID}">${userAct.players[0].name}</a>`;
            break;
        case 'Триада':
            textMessage = '👳🏻‍♂️ <b>Триада</b> сделала свой выстрел...';
            textMessageUser = `Ты ушёл стрелять в <a href="tg://user?id=${userAct.players[0].userID}">${userAct.players[0].name}</a>`;
            break;
        case 'Сенсей':
            textMessage = '🧘🏻 <b>Сенсей</b> ушёл проверять...';
            textMessageUser = `Ты ушёл проверять <a href="tg://user?id=${userAct.players[0].userID}">${userAct.players[0].name}</a>`;
            break;
    }
    if (textMessage !== '') {
        app.bot.telegram.sendMessage(
            ChatID, 
            textMessage, 
            { parse_mode: 'HTML' }
        );
        app.bot.telegram.sendMessage(
            userID, 
            textMessageUser, 
            { parse_mode: 'HTML' }
        );
    }
}

//Отправляем сообщение кто за кого голосовал
async function sendMessageVoiceUserInChat(ChatID, userID, userIDAct) {
    const user = await dq.getInfoPlayer(ChatID, userID),
          userAct = await dq.getInfoPlayer(ChatID, userIDAct);
    app.bot.telegram.sendMessage(
        ChatID, 
        `<a href="tg://user?id=${userID}">${user.players[0].name}</a> `+
        `проголосовал за <a href="tg://user?id=${userIDAct}">${userAct.players[0].name}</a>`, 
        { parse_mode: 'HTML' }
    );
}

//Проверка на наличие победителей
async function checkingTheEndOfTheGame(ChatID) {
    let data = await dq.getDataGame(ChatID);
    let continueGame = true;
    let won = 0;
    if (data.dataGame.inactivePlay != 0) {
        if (!data.dataGame.statysDay) { // конец дня
            if (data.dataGame.counterMafia == 0 && data.dataGame.counterTriada == 0) {
                won = 1;
            } else if (data.dataGame.counterWorld == 0 && data.dataGame.counterTriada == 0) {
                won = 2;
            } else if (data.dataGame.counterMafia == 0 && data.dataGame.counterWorld == 0) {
                won = 3;
            }
        } else { //Конец ночи
            if (data.dataGame.counterWorld == 0 && data.dataGame.counterMafia == 0 && data.dataGame.counterTriada == 0) {
                continueGame = false;
                app.bot.telegram.sendMessage(
                    ChatID, 
                    'Все игроки умерли - победителя нет'
                );
            } else if (data.dataGame.counterMafia == 0 && data.dataGame.counterTriada == 0) {
                won = 1;
            } else if ((data.dataGame.counterWorld <= data.dataGame.counterMafia) && data.dataGame.counterTriada == 0) {
                won = 2;
            } else if ((data.dataGame.counterMafia == 0 && data.dataGame.counterWorld == 0)||
                        (data.dataGame.counterMafia == 0 && (data.dataGame.counterWorld <= data.dataGame.counterTriada))) {
                won = 3;
            }
        }
        if (won !=0) {
            continueGame = false;
            sendMessageGameEnd(ChatID, won, data);
        }
    } else {
        continueGame = false;
        app.bot.telegram.sendMessage(
            ChatID, 
            'Давно не было активности, игра завершена!'
        );
    }
    return continueGame;
}

//Отправляем сообщение о завершении игры
async function sendMessageGameEnd(ChatID, won, data) {
    let textMessage = `<b>Игра окончена!</b>\nПобедил`;
    let textEndMessage = ``;
    switch (won) {
        case 1:
            textMessage += `и: Мирные жители\n\nПобедители:`;
            for (const player of data.players) {
                if (player.lifeStatus || player.suicide) {
                    textMessage+=`\n  <a href="tg://user?id=${player.userID}">${player.name}</a> - <b>${player.initialRole}</b>`;
                    await dq.addWorldVictoryPlayer(ChatID, player.userID);
                } else if (player.suicide) {
                    textMessage+=`\n  <a href="tg://user?id=${player.userID}">${player.name}</a> - <b>${player.initialRole}</b>`;
                    await dq.addWorldVictoryPlayer(ChatID, player.userID);
                } else {
                    textEndMessage+=`\n  <a href="tg://user?id=${player.userID}">${player.name}</a> - <b>${player.initialRole}</b>`;
                    await dq.addCounterGamePlayer(ChatID, player.userID);
                }
            }
            await dq.addWorldVictoryChat(ChatID);
            break;
        case 2:
            textMessage += `а: Мафия\n\nПобедители:`;
            for (const player of data.players) {
                if (player.lifeStatus && (player.initialRole == 'Дон' || player.initialRole == 'Крёстный отец')) {
                    textMessage+=`\n  <a href="tg://user?id=${player.userID}">${player.name}</a> - <b>${player.initialRole}</b>`;
                    await dq.addMafiaVictoryPlayer(ChatID, player.userID);
                } else if (player.suicide) {
                    textMessage+=`\n  <a href="tg://user?id=${player.userID}">${player.name}</a> - <b>${player.initialRole}</b>`;
                    await dq.addWorldVictoryPlayer(ChatID, player.userID);
                } else {
                    textEndMessage+=`\n  <a href="tg://user?id=${player.userID}">${player.name}</a> - <b>${player.initialRole}</b>`;
                    await dq.addCounterGamePlayer(ChatID, player.userID);
                }
            }
            await dq.addMafiaVictoryChat(ChatID);
            break;
        case 3:
            textMessage += `а: Триада\n\nПобедители:`;
            for (const player of data.players) {
                if (player.lifeStatus && (player.initialRole == 'Триада' || player.initialRole == 'Сенсей')) {
                    textMessage+=`\n  <a href="tg://user?id=${player.userID}">${player.name}</a> - <b>${player.initialRole}</b>`;
                    await dq.addTriadaVictoryPlayer(ChatID, player.userID);
                } else if (player.suicide) {
                    textMessage+=`\n  <a href="tg://user?id=${player.userID}">${player.name}</a> - <b>${player.initialRole}</b>`;
                    await dq.addWorldVictoryPlayer(ChatID, player.userID);
                } else {
                    textEndMessage+=`\n  <a href="tg://user?id=${player.userID}">${player.name}</a> - <b>${player.initialRole}</b>`;
                    await dq.addCounterGamePlayer(ChatID, player.userID);
                }
            }
            await dq.addTriadaVictoryChat(ChatID);
            break;
    }
    textMessage+=`\n\nОстальные участники:`+textEndMessage+`\n\nИгра длилась: `+convertTimeToText(data.dataGame.timeStart);
    await app.bot.telegram.sendMessage(
        ChatID, 
        textMessage, 
        {
            parse_mode: 'HTML', 
            reply_markup: keyboards.newGame()
        }
    );
}

//Отправляем гифку сначалом ночи
async function sendNightMessage(ChatID) {
    await app.bot.telegram.sendAnimation(
        ChatID, 
        'CgACAgIAAxkBAAIRbGBMtbtq2tK2J8vbmukGcqYaFb60AAKaCQADZWFKbIReB-j5Y_MeBA',
        {
          parse_mode: 'HTML', 
          caption: '🌃 <b>Наступает ночь</b>\nНа улицы города выходят лишь самые отважные и бесстрашные. Утром попробуем сосчитать их головы...',
          reply_markup: keyboards.goToBot(process.env.URL_BOT)
        }
    );
}

//Отправляем список живых игроков для ночи
async function sendNightMessageLivePlayers(ChatID) {
    await app.bot.telegram.sendMessage(
        ChatID, 
        `<b>Живые игроки:</b>`+await getLifeUsersText(ChatID)+`\n\nСпать осталось <b>1 мин.</b>`,
        { parse_mode: 'HTML' }
    );
}

//Отправляем сообщения с ролями игроков
async function sendRoleMessage(ChatID) {
    const data = await dq.getDataGame(ChatID);
    let textMessage;
    for (let player of data.players) {
        textMessage = 'error';
        switch(player.role) {
            case 'Мирный житель':
                textMessage = 'Ты - 👨🏼 <b>Мирный житель</b>.\nТвоя задача вычислить Мафию с Триадой и на городском собрании линчевать засранцев';
                break;
            case 'Дон':
                textMessage = 'Ты - 🤵🏻 <b>Дон (глава мафии)!</b>.\nТебе решать кто не проснётся этой ночью...';
                break;
            case 'Крёстный отец':
                textMessage = 'Ты - 🤵🏼 <b>Крёстный отец</b>.\nТебе решать кто лишится права голоса следующим днём...\nОднажды ты сможешь стать Доном.';
                break;
            case 'Доктор':
                textMessage = 'Ты - 👨🏼‍⚕️ <b>Доктор</b>.\nТебе решать кого спасти этой ночью...';
                break;
            case 'Комиссар':
                textMessage = 'Ты - 🕵🏼️‍♂️ <b>Комиссар</b>.\nГлавный городской защитник и гроза мафии...';
                break;
            case 'Лейтенант':
                textMessage = 'Ты - 👮🏻 <b>Лейтенант</b>.\nТвоя задача помогать Комиссару вычислить Мафию и Триаду. Однажы ты сможешь стать Комиссаром';
                break;
            case 'Счастливчик':
                textMessage = 'Ты - 🤞 <b>Счастливчик</b>.\nТвоя задача вычислить мафию и на городском собрании линчевать засранцев. Если повезёт, при покушении ты останешься жив.';
                break;
            case 'Камикадзе':
                textMessage = 'Ты - 🤦🏼‍♂️ <b>Камикадзе</b>.\nТвоя цель - умереть на городском собрании! :)';
                break;
            case 'Телохранитель':
                textMessage = 'Ты - 👥 <b>Телохранитель</b>.\nТебе решать кого спасать от пули...';
                break;
            case 'Мститель':
                textMessage = 'Ты - 🔪 <b>Мститель</b>.\nТебе решать кто этой ночью умрёт...';
                break;
            case 'Красотка':
                textMessage = 'Ты - 💃🏻 <b>Красотка</b>.\nТебе решать кто этой ночью забудет о своей работе и будет с тобой...';
                break;
            case 'Триада':
                textMessage = 'Ты - 👳🏻‍♂️ <b>Триада</b>.\nТебе решать кто этой ночью лишится жизни...';
                break;
            case 'Сенсей':
                textMessage = 'Ты - 🧘🏻 <b>Сенсей</b>.\nТебе решать кого проверить на притчастность к Мафии или Комиссару...';
                break;
        }
        await app.bot.telegram.sendMessage(
            player.userID, 
            textMessage, 
            { parse_mode: 'HTML' }
        );
    }
}

//Отправляем сообщение с действиями для активных ролей
async function sendNightMessageActionsLivePlayers(ChatID, data) {
    data.players.forEach( async (player) => {
        if (player.lifeStatus) {
            let textMessage = '';
            switch(player.role) {
                case 'Дон':
                case 'Мститель':
                case 'Триада':
                    textMessage = 'Кого будем убивать этой ночью?';
                    break;
                case 'Крёстный отец':
                    textMessage = 'Кого будем лишать права голоса днем?';
                    break;
                case 'Доктор':
                    textMessage = 'Кого будем лечить?';
                    break;
                case 'Комиссар':
                    const messageData = await app.bot.telegram.sendMessage(
                        player.userID, 
                        'Что будем делать?', 
                        { reply_markup: keyboards.checkOrKill(ChatID) }
                    );
                    await dq.updateMessageIDPlayer(ChatID, messageData.message_id, player.userID);
                    break;
                case 'Телохранитель':
                    textMessage = 'Кого будем защищать этой ночью?';
                    break;
                case 'Красотка':
                    textMessage = 'Кого будем радовать этой ночью?';
                    break;
                case 'Сенсей':
                    textMessage = 'Кого будем проверять?';
                    break;
            }
            if (textMessage != '') {
                dq.updateDataCounterActiveRoles(ChatID, true);
                const messageData = await app.bot.telegram.sendMessage(
                    player.userID, 
                    textMessage, 
                    { reply_markup: keyboards.buttonActionsNight(ChatID, data.players, player.userID, player.allies) }
                );
                await dq.updateMessageIDPlayer(ChatID, messageData.message_id, player.userID);
            }
        }
    });
}

//Обрабатываем результаты ночи
async function ProcessingResultsNight(data, ChatID) {
    let trigerAction = 0,
        kill = 0,
        Lucky = false;
    let cloneData = JSON.parse(JSON.stringify(data));
    cloneData.dataGame.statysDay = true;
    //Очищаем действия у того, к кому сходила красотка
    if (data.dataGame.counterPlayers >= 10) {
        data.players.forEach((player, i) => {
            if (player.lifeStatus && player.role == 'Красотка' && player.actID != 0) {
                const actID = player.actID;
                cloneData.players[i].actID = 0;
                data.players.forEach((player, i) => {
                    if (player.userID == actID) {
                        cloneData.players[i].actID = 0;
                        data.players[i].actID = 0;
                        trigerAction += 1;
                        app.bot.telegram.sendMessage(
                            player.userID, 
                            'Вы провели незабываемую ночь с девушкой своей мечты...');
                    }
                });
            }
        });
    }
    //Стреляем по игрокам и проверяем их
    data.players.forEach((player, i) => {
        if ((player.lifeStatus && player.role == 'Дон' && player.actID != 0)||
            (player.lifeStatus && player.role == 'Комиссар' && player.actID != 0 && !player.copCheck)||
            (player.lifeStatus && player.role == 'Мститель' && player.actID != 0)||
            (player.lifeStatus && player.role == 'Триада' && player.actID != 0)) {

            const actID = player.actID;
            cloneData.players[i].actID = 0;
            data.players.forEach((player, i) => {
                if (player.userID == actID) {
                    cloneData.players[i].lifeStatus = false;
                    cloneData.players[i].dyingMessage = true;
                    cloneData.players[i].therapyDay = 0;
                    cloneData = updateCounter(cloneData, i, true);
                    data.players[i].therapyDay = 0;
                    trigerAction += 1;
                    app.bot.telegram.sendMessage(
                        player.userID, 
                        'Тебя убили :(\nТы можешь отправить сюда своё предсмертное сообщение в чате с игрой!');
                    
                }
            });
        } else if ((player.lifeStatus && player.role == 'Комиссар' && player.actID != 0 && player.copCheck)||
                   (player.lifeStatus && player.role == 'Сенсей' && player.actID != 0)||
                   (player.lifeStatus && player.role == 'Крёстный отец' && player.actID != 0)) {
            const actID = player.actID, 
                  checkingID = player.userID,
                  role = player.role;

            cloneData.players[i].actID = 0;
            data.players.forEach((player, i) => {
                if (player.userID == actID) {
                    trigerAction += 1;
                    if (role == 'Крёстный отец') {
                        cloneData.players[i].votes = false;
                        app.bot.telegram.sendMessage(
                            player.userID, 
                            'Вы уехали из города и не можете посетить дневное собрание...');
                    } else {
                        app.bot.telegram.sendMessage(
                            player.userID, 
                            'Кто-то сильно заинтересовался твоей ролью...');
                    }
                    if (role == 'Комиссар') {
                        app.bot.telegram.sendMessage(
                            checkingID, 
                            `${player.name} - ${player.role}`);
                    } else if (role == 'Сенсей') {
                        if (player.role == 'Комиссар' || 
                            player.role == 'Лейтенант'|| 
                            player.role == 'Дон'|| 
                            player.role == 'Крёстный отец') {

                            app.bot.telegram.sendMessage(
                                checkingID, 
                                `${player.name} - ${player.role}`);
                        } else {
                            app.bot.telegram.sendMessage(
                                checkingID, 
                                `${player.name} - Мирный житель`);
                        }
                    }
                }
            });
        }
    });
    //Оживляем или убиваем игроков
    data.players.forEach((player, i) => {
        if (player.lifeStatus && player.role == 'Доктор' && player.actID != 0) {

            const actID = player.actID,
                  index = i;
            cloneData.players[i].actID = 0;
            trigerAction += 1;

            cloneData.players.forEach((player, i) => {
                if (player.userID == actID) {
                    if (player.lifeStatus) {
                        if (player.therapyDay == cloneData.dataGame.counterDays -2 ) {
                            cloneData.players[i].lifeStatus = false;
                            cloneData.players[i].dyingMessage = true;
                            cloneData = updateCounter(cloneData, i, true);
                            app.bot.telegram.sendMessage(
                            player.userID, 
                            'Доктор принес еще таблетки и у вас случилась передозировка... '+
                            'Можете сказать "спасибо" доктору в чате с игрой');
                        } else {
                            cloneData.players[i].therapyDay = cloneData.dataGame.counterDays;
                            app.bot.telegram.sendMessage(
                            player.userID, 
                            'У вас болела голова и доктор дал вам таблетку...');
                        }
                    } else {
                        cloneData.players[i].lifeStatus = true;
                        cloneData.players[i].therapyDay = 0;
                        cloneData = updateCounter(cloneData, i, false);
                        app.bot.telegram.sendMessage(
                            player.userID, 
                            'На вас было совершено покушение, но доктор успел вас спасти...');
                    }
                }
            });
        }
    });
    //Cпасаем игроков
    data.players.forEach((player, i) => {
        if (player.lifeStatus && player.role == 'Телохранитель' && player.actID != 0) {
            const actID = player.actID,
                  index = i;

            cloneData.players[i].actID = 0;
            trigerAction += 1;
            cloneData.players.forEach((player, i) => {
                if (player.userID == actID) {
                    if (player.lifeStatus) {
                        app.bot.telegram.sendMessage(
                            player.userID, 
                            'Телохранитель защищал вас всю ночь, но нападения не произошло...');
                    } else {
                        cloneData.players[index].role = 'Мирный житель';
                        cloneData.players[i].lifeStatus = true;
                        cloneData = updateCounter(cloneData, i, false);
                        app.bot.telegram.sendMessage(
                            player.userID, 
                            'На вас было совершено покушение, но телохранитель вас спас и получил ранение...');
                        app.bot.telegram.sendMessage(
                            cloneData.players[index].userID, 
                            'Вы спасли жителя, но получили ранение и больше не можете работать телохранителем...');
                    }
                }
            });
        }
    });
    //Проверяем были ли действия ночью
    if (trigerAction === 0) {
        await dq.updateDataInactivePlay(ChatID); //не было действий
        
    } else {
        cloneData.dataGame.inactivePlay = 5;
        //Отправляем в чат информацию, если кого-то убили
        cloneData.players.forEach((player, i) => {
            if (!player.lifeStatus && data.players[i].lifeStatus) {
                kill += 1;
                if (player.initialRole == 'Счастливчик'){
                    if (Math.random() > 0.65){
                        cloneData.players[i].lifeStatus = true;
                        cloneData = updateCounter(cloneData, i, false);
                        kill -= 1;
                        Lucky = true;
                        app.bot.telegram.sendMessage(
                            ChatID, 
                            `Этой ночью кому-то из жителей повезло...`);
                        app.bot.telegram.sendMessage(
                            player.userID, 
                            `Этой ночью вам повезло и вы чудом воскресли...`);
                    } else {
                        app.bot.telegram.sendMessage(
                            ChatID, 
                            `Этой ночью погиб ${player.name} - ${player.role}`);
                    }
                } else {
                    app.bot.telegram.sendMessage(
                        ChatID, 
                        `Этой ночью погиб ${player.name} - ${player.role}`);
                }
                if (player.initialRole == 'Дон') {
                    cloneData.players.forEach((player, i) => {
                        if (player.lifeStatus && player.role == 'Крёстный отец') {
                            app.bot.telegram.sendMessage(
                                ChatID, 
                                'Дон убит, теперь вы глава мафии!');
                            cloneData.players[i].role = 'Дон';
                        }
                    });
                } else if (player.initialRole == 'Комиссар') {
                    cloneData.players.forEach((player, i) => {
                        if (player.lifeStatus && player.role == 'Лейтенант') {
                            app.bot.telegram.sendMessage(
                                player.userID, 
                                'Комиссар убит, теперь вы возглавляете участок!');
                            cloneData.players[i].role = 'Комиссар';
                        }
                    });
                } else if (player.initialRole == 'Триада') {
                    cloneData.players.forEach((player, i) => {
                        if (player.lifeStatus && player.role == 'Сенсей') {
                            app.bot.telegram.sendMessage(
                                ChatID, 
                                'Триада убита, теперь вы главный!');
                            cloneData.players[i].role = 'Триада';
                        }
                    });
                }
            }
        });
        cloneData.dataGame.counterDays += 1;
        await dq.updateDataGame(ChatID, cloneData.dataGame, cloneData.players); //Перезаписываем данные игры
        if (kill == 0 && !Lucky) {
            app.bot.telegram.sendMessage(
                ChatID, 
                'Хм, этой ночью никто не умер...');
        }
    }
}

//Обрабатываем результаты дня
async function ProcessingResultsDay(ChatID) {
    const data = await dq.getDataGame(ChatID); //Получаю данные голосования
    let maxVoice = 0,
        counter = 0,
        userNumber;
    await deleteMessageAct(data, ChatID); //Удаляем сообщения на которые пользователь не нажимал
    data.players.forEach((player) => {
        if (player.lifeStatus && player.votesAgainst > maxVoice) {
            maxVoice = player.votesAgainst;
        }
    });
    data.players.forEach((player, i) => {
        if (player.lifeStatus && player.votesAgainst == maxVoice) {
            counter += 1;
            userNumber = i;
        }
        dq.clearVoticeDay(ChatID, player.userID);
    });
    if (counter == 1){
        const message = await app.bot.telegram.sendMessage(
            ChatID, 
            `Вы действительно холите линчевать <a href="tg://user?id=${data.players[userNumber].userID}">${data.players[userNumber].name}</a>?`,
            {
              parse_mode: 'HTML', 
              reply_markup: keyboards.voteYesNoDay(data.players[userNumber].userID, 0, 0)
            }
        );
        await delay(30000);
        await app.bot.telegram.deleteMessage(ChatID, message.message_id);
        //Отправляем сообщение с кнопками для повешанья в чат и записываем его айди, после таймера удалим его, в базу заносить не нужно
        const newData = await dq.getDataPlayers(ChatID); 
        if (newData.players[userNumber].votesAgainst > newData.players[userNumber].votesFor) {
            await dq.suspendPlayer(ChatID, newData.players[userNumber].userID); //Вешаем игрока
            if (newData.players[userNumber].initialRole == ('Триада'||'Сенсей')) {
                dq.decrementCounterTriada(ChatID);
            } else if (newData.players[userNumber].initialRole == ('Дон'||'Крёстный отец')) {
                dq.decrementCounterMafia(ChatID);
            } else {
                dq.decrementCounterWorld(ChatID);
            }
            await app.bot.telegram.sendMessage(
                ChatID, 
                `Сегодня был повешан <a href="tg://user?id=${newData.players[userNumber].userID}">`+
                `${newData.players[userNumber].name}</a> - ${newData.players[userNumber].role}`,
                { parse_mode: 'HTML' }
            );
        } else {
            await app.bot.telegram.sendMessage(
                ChatID, 
                `Мнения жителей разошлись, этой ночью никого не вешаем...`
            );
        }
        for (const player of data.players) {
            await dq.clearVoticeDay(ChatID, player.userID);
        }
    } else {
        await app.bot.telegram.sendMessage(
            ChatID, 
            `Мнения жителей разошлись, этой ночью никого не вешаем...`
        );
    }
}


//Обновляем счетчики жителей
function updateCounter(data, i, action) {
    if (action) {
        if (data.players[i].initialRole == ('Триада'||'Сенсей')) {
            data.dataGame.counterPlayers -= 1;
            data.dataGame.counterTriada -= 1;
        } else if (data.players[i].initialRole == ('Дон'||'Крёстный отец')) {
            data.dataGame.counterPlayers -= 1;
            data.dataGame.counterMafia -= 1;
        } else {
            data.dataGame.counterPlayers -= 1;
            data.dataGame.counterWorld -= 1;
        }
    } else {
        if (data.players[i].initialRole == ('Триада'||'Сенсей')) {
            data.dataGame.counterPlayers += 1;
            data.dataGame.counterTriada += 1;
        } else if (data.players[i].initialRole == ('Дон'||'Крёстный отец')) {
            data.dataGame.counterPlayers += 1;
            data.dataGame.counterMafia += 1;
        } else {
            data.dataGame.counterPlayers += 1;
            data.dataGame.counterWorld += 1;
        }
    }
    return data;
} 

//Отправляем гифку сначалом дня
async function sendSunMessage(ChatID, i) {
    await app.bot.telegram.sendAnimation(
        ChatID, 
        'CgACAgIAAxkBAAIRbWBMup4dG4YWuIwR37d4asbpkDa1AAKOCwADZWlKSU4NTWIvIJMeBA',
        {
          parse_mode: 'HTML', 
          caption: `🏙 <b>День ${i}</b>\nСолнце всходит, подсушивая на тротуарах пролитую ночью кровь...`,
          reply_markup: keyboards.goToBot(process.env.URL_BOT)
        }
    );
}

//Отправляем список живых игроков для дня
async function sendDayMessageLivePlayers(ChatID, data) {
    let listUsers = '';
    let listRoles = '';
    let caunter = 0;
    let masRole = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    data.players.forEach((player) => {
        if (player.lifeStatus) {
            caunter++;
            listUsers +=`\n${caunter}) <a href="tg://user?id=${player.userID}">${player.name}</a>`;
            switch(player.role) {
                case 'Мирный житель':
                    masRole[0]+=1;
                    break;
                case 'Дон':
                    masRole[1]=1;
                    break;
                case 'Крёстный отец':
                    masRole[2]=1;
                    break;
                case 'Доктор':
                    masRole[3]=1;
                    break;
                case 'Комиссар':
                    masRole[4]=1;
                    break;
                case 'Лейтенант':
                    masRole[5]=1;
                    break;
                case 'Счастливчик':
                    masRole[6]=1;
                    break;
                case 'Камикадзе':
                    masRole[7]=1;
                    break;
                case 'Телохранитель':
                    masRole[8]=1;
                    break;
                case 'Мститель':
                    masRole[9]=1;
                    break;
                case 'Красотка':
                    masRole[10]=1;
                    break;
                case 'Триада':
                    masRole[11]=1;
                    break;
                case 'Сенсей':
                    masRole[12]=1;
                    break;
            }
        }
    });
    if (masRole[0]>1) {
        listRoles+=`👨🏼 Мирный житель - ${masRole[0]}, `;
    } else if (masRole[0]==1) {
        listRoles+=`👨🏼 Мирный житель, `;
    }
    if (masRole[1]==1) { listRoles+=`🤵🏻 Дон, `; }
    if (masRole[2]==1) { listRoles+=`🤵🏼 Крёстный отец, `; }
    if (masRole[3]==1) { listRoles+=`👨🏼‍⚕️ Доктор, `; }
    if (masRole[4]==1) { listRoles+=`🕵🏼️‍♂️ Комиссар, `; }
    if (masRole[5]==1) { listRoles+=`👮🏻 Лейтенант, `; }
    if (masRole[6]==1) { listRoles+=`🤞 Счастливчик, `; }
    if (masRole[7]==1) { listRoles+=`🤦🏼‍♂️ Камикадзе, `; }
    if (masRole[8]==1) { listRoles+=`👥 Телохранитель, `; }
    if (masRole[9]==1) { listRoles+=`🔪 Мститель, `; }
    if (masRole[10]==1) { listRoles+=`💃🏻 Красотка, `; }
    if (masRole[11]==1) { listRoles+=`👳🏻‍♂️ Триада, `; }
    if (masRole[12]==1) { listRoles+=`🧘🏻 Сенсей, `; }
    await app.bot.telegram.sendMessage(
        ChatID, 
        `<b>Живые игроки:</b>`+listUsers+`\n\n<b>Кто-то из них:</b>`+listRoles.slice(0, -2)+
            `\nВсего: ${caunter} чел.\n\nСейчас самое время обсудить результаты ночи, разобраться в причинах и следствиях...`,
        { parse_mode: 'HTML' }
    );
}

//Пауза
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//Проверяем жив ли игрок с определенной ролью
function roleLifeCheck(players, role) {
    return players.some((player) => {
        return player.role == role && player.lifeStatus;
    });
}

//Конвертируем время в текст
function convertTimeToText(time) {
    let text = '';
    const timeGame = Date.now() - time,
          hours = Math.floor(timeGame/(1000*60*60)),
          minutes = Math.floor(timeGame/(1000*60))-hours*60,
          seconds = Math.floor(timeGame/(1000))-minutes*60-hours*60*60;
    if (hours != 0) {
        text+=`${hours} ч. `;
    }
    if (minutes != 0) {
        text+=`${minutes} мин. `;
    }
    if (seconds != 0) {
        text+=`${seconds} сек. `;
    }
    return text;
}

//Запуск регистрации
async function registration(ChatID) {
    for (let i = 90; i > 0; i -= 30) {
        await sendMessageRegistration(ChatID, i);
        await delay(30000);
        const data = await dq.getDataDeleteMessageRegistration(ChatID);
        if (data.messageID == 0){
            break;
        }              
    }
    await deleteMessageRegistration(ChatID);
}


//Отправка сообщения регистрации
async function sendMessageRegistration(ChatID, time) {
    if (time != 90) {
      deleteMessageRegistration(ChatID);
    }
    const messageRegistration = await app.bot.telegram.sendMessage(
        ChatID, 
        `Игра начнётся через ${time} секунд! \nСписок участников:`+ await getLifeUsersText(ChatID), 
        {
            parse_mode: 'HTML', 
            reply_markup: keyboards.userRegistrationBtn(process.env.URL_BOT, ChatID)
        }
    );
    await dq.getDataSendMessageRegistration(ChatID, messageRegistration.message_id, time);
}


//Удаление сообщения регистрации
async function deleteMessageRegistration(chatID) {
    const data = await dq.getDataDeleteMessageRegistration(chatID);
    if (data.messageID != 0){
        app.bot.telegram.deleteMessage(chatID, data.messageID);
    }
}


//Получаем список живых игроков
async function getLifeUsersText(chatID) {
    let listUsers = '',
        caunter = 0;
    const data = await dq.getDataPlayers(chatID);

    data.players.forEach((player) => {
        if (player.lifeStatus) {
            caunter++;
            listUsers +=`\n${caunter}) <a href="tg://user?id=${player.userID}">${player.name}</a>`;
        }
    });
    return listUsers;
}

//Дневное голосование
async function lastVote(ChatID, result, userID, userIDAct, messageID) {
    const user = await dq.getInfoPlayer(ChatID, userID),
          userAct = await dq.getInfoPlayer(ChatID, userIDAct);

    if (userID != userIDAct) {
        if (user.players[0].lifeStatus && 
            user.players[0].votes && 
            !user.players[0].whetherVoted) {
                if (result) { //За
                    await dq.updateCallbackDataVotesAgainstPlayer(ChatID, userIDAct, 1);
                    app.bot.telegram.editMessageReplyMarkup(
                        ChatID, 
                        messageID,
                        null,
                        keyboards.voteYesNoDay(
                            userAct.players[0].userID, 
                            userAct.players[0].votesAgainst+1, userAct.players[0].votesFor
                        )
                    );
                } else { //Против
                    await dq.updateCallbackDataVotesForPlayer(ChatID, userIDAct, 1);
                    app.bot.telegram.editMessageReplyMarkup(
                        ChatID, 
                        messageID,
                        null,
                        keyboards.voteYesNoDay(
                            userAct.players[0].userID, 
                            userAct.players[0].votesAgainst, userAct.players[0].votesFor+1
                        )
                    );
                }
                await dq.updateCallbackDataVotesPlayer(ChatID, userID, true, result);
        } else if (user.players[0].lifeStatus && 
                   user.players[0].votes &&
                   user.players[0].whetherVoted) {
            //Пользователь уже голосовал
            if (user.players[0].votingResult != result) {
                await dq.updateCallbackDataVotesPlayer(ChatID, userID, true, result);
                if (result) {
                    await dq.updateCallbackDataVotesAgainstPlayer(ChatID, userIDAct, 1);
                    await dq.updateCallbackDataVotesForPlayer(ChatID, userIDAct, -1);
                    app.bot.telegram.editMessageReplyMarkup(
                        ChatID, 
                        messageID,
                        null,
                        keyboards.voteYesNoDay(
                            userAct.players[0].userID, 
                            userAct.players[0].votesAgainst+1, userAct.players[0].votesFor-1
                        )
                    );
                } else {
                    await dq.updateCallbackDataVotesAgainstPlayer(ChatID, userIDAct, -1);
                    await dq.updateCallbackDataVotesForPlayer(ChatID, userIDAct, 1);
                    app.bot.telegram.editMessageReplyMarkup(
                        ChatID, 
                        messageID,
                        null,
                        keyboards.voteYesNoDay(
                            userAct.players[0].userID, 
                            userAct.players[0].votesAgainst-1, userAct.players[0].votesFor+1
                        )
                    );
                }
            }
        }
    }
}


//Обрабатываем колбеки
export async function callbackQuery(ctx) {
    if (ctx.callbackQuery.data.slice(0, 3) == 'act') {
      await ctx.deleteMessage();
      const messageData = ctx.callbackQuery.data.split(' ');
      await dq.updateDataCounterActiveRoles(messageData[1], false);
      await dq.updateMessageIDPlayer(messageData[1], 0, ctx.callbackQuery.from.id);
      sendMessageAboutProgressRole(messageData[1], ctx.callbackQuery.from.id, messageData[2]);
      await dq.updateCallbackDataPlayer(messageData[1], messageData[2], ctx.callbackQuery.from.id);
    } else if (ctx.callbackQuery.data.slice(0, 2) == 'vs') {
      await ctx.deleteMessage();
      const messageData = ctx.callbackQuery.data.split(' ');
      await dq.updateMessageIDPlayer(messageData[1], 0, ctx.callbackQuery.from.id);
      sendMessageVoiceUserInChat(messageData[1], ctx.callbackQuery.from.id, messageData[2]);
      await dq.updateCallbackDataVotesAgainstPlayer(messageData[1], messageData[2], 1);
    } else if (ctx.callbackQuery.data.slice(0, 8) == 'copcheck') {
      await ctx.deleteMessage();
      await dq.updateDataCounterActiveRoles(ctx.callbackQuery.data.slice(8), true);
      const dataPlayers = await dq.getDataPlayers(ctx.callbackQuery.data.slice(8));
      const message = await app.bot.telegram.sendMessage(
        ctx.callbackQuery.from.id, 
        'Кого будем проверять?',
        { 
          reply_markup: keyboards.buttonActionsNight(
            ctx.callbackQuery.data.slice(8), 
            dataPlayers.players, 
            ctx.callbackQuery.from.id, 1) 
        }
      );
      await dq.updateCallbackDataCop(ctx.callbackQuery.data.slice(8), true, ctx.callbackQuery.from.id, message.message_id);
    } else if (ctx.callbackQuery.data.slice(0, 7) == 'copkill') {
      await ctx.deleteMessage();
      await dq.updateDataCounterActiveRoles(ctx.callbackQuery.data.slice(7), true);
      const dataPlayers = await dq.getDataPlayers(ctx.callbackQuery.data.slice(7));
      const message = await app.bot.telegram.sendMessage(
        ctx.callbackQuery.from.id, 
        'Кого будем убивать?',
        { 
          reply_markup: keyboards.buttonActionsNight(
            ctx.callbackQuery.data.slice(7), 
            dataPlayers.players, 
            ctx.callbackQuery.from.id, 1) 
        }
      );
      await dq.updateCallbackDataCop(ctx.callbackQuery.data.slice(7), false, ctx.callbackQuery.from.id, message.message_id);
    } else if (ctx.callbackQuery.data == 'newgame') {
      await ctx.deleteMessage();
      if (functions.checkBotAdmin(ctx.callbackQuery.message.chat.id)) {
        functions.updateOrAddChatInBD(ctx.callbackQuery.message.chat.id, ctx.callbackQuery.message.chat.title);
        launch(ctx.callbackQuery.message.chat.id);
      }
    } else if (ctx.callbackQuery.data.slice(0, 3) == 'yes') {
      lastVote(
        ctx.callbackQuery.message.chat.id, //ChatID
        true,                              //Голос за
        ctx.callbackQuery.from.id,         //Айди того кто нажал на кнопку
        ctx.callbackQuery.data.slice(3),   //Айди того кому нужно добавить голос
        ctx.callbackQuery.message.message_id//Айди сообщения которое нужно изменить
        );
    } else if (ctx.callbackQuery.data.slice(0, 2) == 'no') {
      lastVote(
        ctx.callbackQuery.message.chat.id, //ChatID
        false,                              //Голос за
        ctx.callbackQuery.from.id,         //Айди того кто нажал на кнопку
        ctx.callbackQuery.data.slice(2),   //Айди того кому нужно добавить голос
        ctx.callbackQuery.message.message_id//Айди сообщения которое нужно изменить
        );
    }
  }

