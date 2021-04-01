'use strict';

import Markup from 'telegraf/markup.js';

export function userRegistrationBtn(urlBot, chatID) {
    return Markup.inlineKeyboard([
        Markup.urlButton('🕵️‍♂️ Присоединиться 🕵️‍♂️', urlBot+'?start='+chatID)
    ]);
}

export function voteDay(urlBot) {
    return Markup.inlineKeyboard([
        Markup.urlButton('🗳 Голосовать 🗳', urlBot)
    ]);
}

export function goToBot(urlBot) {
    return Markup.inlineKeyboard([
        Markup.urlButton('🚶 Перейти к боту 🚶', urlBot)
    ]);
}

export function voteYesNoDay(userID, counterYes, counterNo) {
    if (counterYes == 0) { counterYes = ''; }
    if (counterNo == 0) { counterNo = ''; }
    return Markup.inlineKeyboard([
        Markup.callbackButton(`${counterYes} 👍`, 'yes'+userID),
        Markup.callbackButton(`${counterNo} 👎`, 'no'+userID)
    ], {columns: 2});
}

export function newGame() {
    return Markup.inlineKeyboard([
        Markup.callbackButton('Начать новую игру!', 'newgame')
    ]);
}

export function checkOrKill(ChatID) {
    return Markup.inlineKeyboard([
        Markup.callbackButton('Проверять', 'copcheck'+ChatID),
        Markup.callbackButton('Стрелять', 'copkill'+ChatID)
    ], {columns: 2});
}





export function buttonActionsNight(ChatID, players, userID, allies) { 
    let keyboard = [];
    players.forEach((player) => {
        if(player.lifeStatus) {
            if (player.userID == userID && (player.role != 'Комиссар'||
                                            player.role != 'Телохранитель'||
                                            player.role != 'Мститель'||
                                            player.role != 'Красотка'||
                                            player.role != 'Сенсей')) {
                keyboard.push(Markup.callbackButton('☑️ '+player.name, `act ${ChatID} ${player.userID}`));
            } else {
                if (allies!=0 && player.allies==allies) {
                    keyboard.push(Markup.callbackButton('☑️ '+player.name, `act ${ChatID} ${player.userID}`)); 
                } else {
                    keyboard.push(Markup.callbackButton(player.name, `act ${ChatID} ${player.userID}`)); 
                }
            }
        }
    });
    return Markup.inlineKeyboard(keyboard, {columns: 1});
} 


export function buttonActionsDay(ChatID, players, userID) {
    let keyboard = [];
    players.forEach((player) => {
        if(player.lifeStatus && player.userID != userID) {
            keyboard.push(Markup.callbackButton(player.name, `vs ${ChatID} ${player.userID}`)); 
        }
    });
    return Markup.inlineKeyboard(keyboard, {columns: 1});
}