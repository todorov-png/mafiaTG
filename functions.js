'use strict';
import dotenv from 'dotenv';
import * as dq from './database-queries.js';
import * as game from './game.js';
import * as app from './app.js';
import Extra from 'telegraf/extra.js';
dotenv.config();

//Проверка разрешений бота в чате
export async function checkBotAdmin(ChatID) {
  var status = false;
  const data = await app.bot.telegram.getChatAdministrators(ChatID);
  data.forEach((item) => {
    if ((item.user.id == process.env.BOT_ID) && (item.can_delete_messages == true)) {
      status = true;
    }
  });
  if (status == false) {
    await app.bot.telegram.sendMessage(
      ChatID, 
      'Сделайте бота администратором и дайте разрешение на удаление сообщений!'
    );
  }
  return status;
}

export async function checkStartGame(ChatID) {
  let check = false;
  const data = await dq.getDataDeleteMessageRegistration(ChatID);
  if (data == null || data.messageID == 0) { 
    check = true;
  } 
  return check;
}

//Записываем пользователя на игру и сохраняем его в чате
export async function registrationUserInGame(ctx, chatID) {
  const users = await dq.getDataRegistrationUserInGame(chatID);
  console.log(users);
  if (users == null) {
    ctx.reply('Чат игры не найден, попробуйте еще', Extra.inReplyTo(ctx.message.message_id));
  } else {
    if (checkUserInBD(users.listOfUser, ctx.message.from.id)) {
      await dq.updateDataAddUserInChatBD(
        chatID, 
        ctx.message.from.id, 
        fillingUserName(ctx.message.from), 
        ctx.message.from.username
      );
    }    
    if (users.dataGame.counterDays == 0) {
      if (users.players.length > 24) {
        ctx.reply('Вы опоздали на регистрацию, я уже набрал максимальное количество участников!');
      } else {
        if (checkUserInBD(users.players, ctx.message.from.id)) {
          await dq.updateDataRegistrationUserInGame(
            chatID, 
            ctx.message.from.id, 
            fillingUserName(ctx.message.from), 
            ctx.message.from.username
          );
          ctx.reply('Ты присоединился к игре в '+users.title, Extra.inReplyTo(ctx.message.message_id));
          await game.updateMessageRegistration(chatID);
        } else {
          ctx.reply('Ты уже играешь в '+users.title, Extra.inReplyTo(ctx.message.message_id));
        }
      }
    } else {
      ctx.reply('Вы опоздали на регистрацию, игра уже началась!');
    }
  }
}


//Проверка вступившего пользователя на наличие в БД и добавление его, если его там нет
export async function checkingLoggedUser(chatID, newChatMembers) {
  const users = await dq.getDataCheckingLoggedUser(chatID);
  if (users != null) {
    for (const userChat of newChatMembers) {
      if (userChat.is_bot == false) { 
        let addTtriger = true;
        for (const user of users.listOfUser) { 
          if (user.userID == userChat.id) {
            addTtriger = false;
          }
        }
        if (addTtriger) {
          await dq.updateDataAddUserInChatBD(chatID, userChat.id, fillingUserName(userChat), userChat.username);
        }
      }
    }
  }
}


//Удаляем юзера или чат из базы при выходе из чата
export async function leftUserOrChat(chatID, leftChatMember) {
  if (leftChatMember.is_bot == false) {
    const users = await dq.getDataleftUserOrChat(chatID);
    if (users != null) {
      users.listOfUser.forEach(async (user) => {
        if (user.userID == leftChatMember.id) {
          await dq.updateDataLeftUserOrChat(chatID, leftChatMember.id);
        }
      });
    }
  } else if(leftChatMember.id == process.env.BOT_ID) {
    await dq.deleteDataLeftUserOrChat(chatID);
  }
}


//Вызов участников для участия в игре
export async function callUsers(ctx) {
  if (checkTypeChat(ctx.message.chat.type)) {
    let usersName = '';
    const users = await dq.getDataCallUsers(ctx.message.chat.id);
    if (users != null && users.listOfUser.length > 0) {
      users.listOfUser.forEach((item, i) => {
        usersName+=`\n${i+1}) <a href="tg://user?id=${item.userID}">${item.name}</a>`;
      });
      ctx.replyWithHTML('Призываю в игру: '+usersName);
    } else {
      ctx.reply('Я пока никого из вас не знаю, поиграйте и тогда поговорим😉');
    }
  } else {
    ctx.reply('Эту команду необходимо отправлять в групповом чате!');
  }
}

//Проверка типа группы откуда пришла команда
export function checkTypeChat(chatType) {
  if (chatType == 'group' || chatType == 'supergroup') {
    return true;
  } else {
    return false;
  }
}

//Выход бота из чата
export function leaveChat(chatID) {
  app.bot.telegram.leaveChat(chatID);
}

//Делаем запись чата или обновление его данных
export async function updateOrAddChatInBD(chatID, title) {
  await dq.updateDataUpdateOrAddChatInBD(chatID, title);
}


//Обновляем заголовок чата
export async function autoUpdateTitleChat(chatID, title) {
  await dq.updateDataAutoUpdateTitleChat(chatID, title);
}


//Обновляем ID чата
export async function autoUpdateIDChat(chatID, newChatID) {
  await dq.updateDataAutoUpdateIDChat(chatID, newChatID);
}


//Обьединяем имя и фамилию
function fillingUserName(from) {
  let nameUser = from.first_name;
  if (from.last_name != undefined) {
    nameUser += ' ' + from.last_name;
  }
  return nameUser;
}


//Проверяем есть ли этот пользователь в массиве
function checkUserInBD(array, checkUserId) {
  let checkAddUser = true;
  array.forEach((user) => {
    if(user.userID == checkUserId) {
      checkAddUser = false;
    }
  });
  return checkAddUser;
}

//Статистика пользователя
export async function getInfoUser(chatID, userID) {
  const data = await dq.getDataUsers(chatID);
  if (data != null) {
    data.listOfUser.forEach(async (user) => {
      if (user.userID === userID) {
        const textMessage = `${user.name}, ваша статистика в чате ${data.title}:\n`+
        `- сыграно игр: ${user.gameCounter};\n`+
        `- побед: ${user.victories};\n`+
        `- побед мирным жителем: ${user.worldVictories};\n`+
        `- побед мафией: ${user.mafiaVictories};\n`+
        `- побед триадой: ${user.triadaVictories};\n`+
        `- баланс: ${user.money} монет.`;
        await app.bot.telegram.sendMessage(
          chatID, 
          textMessage
        );
      }
    });
  } else {
    await app.bot.telegram.sendMessage(
      chatID, 
      'Я вас не знаю, поиграйте, потом и поговорим😉'
    );
  }
}

//Статистика чата
export async function getInfoChat(chatID) {
  const data = await dq.getDataStatisticsGameInChat(chatID);
  if (data != null) {
    const textMessage = `Статистика чата ${data.title}:\n`+
    `- проведено игр: ${data.statisticsGameInChat.gameCounter};\n`+
    `- побед мирных жителей: ${data.statisticsGameInChat.peacefulVictories};\n`+
    `- побед мафий: ${data.statisticsGameInChat.mafiaVictories};\n`+
    `- побед триады: ${data.statisticsGameInChat.triadaVictories};\n`+
    `- знаю ${data.statisticsGameInChat.knowUsers} участников в чате;`;
    await app.bot.telegram.sendMessage(
      chatID, 
      textMessage
    );
  } else {
    await app.bot.telegram.sendMessage(
      chatID, 
      'Я не знаю ваш чат, поиграйте, потом и поговорим😉'
    );
  }
}


//Топ победителей в чате
export async function topChat(chatID, text, field) {
  const data = await dq.getDataUsers(chatID);
  if (data != null) {
    let users = [],
        textMessage = `Топ ${text} в чате ${data.title}`;

    data.listOfUser.forEach((user) => {
      if (user[field] > 0) {
        users.push(user);
      }
    });    
    users.sort(byField(field));
    if (users.length > 0) {
      textMessage += ':';
      users.forEach(async (user, i) => {
        textMessage += `\n${i+1}) ${user.name} - ${user[field]};`;
      }); 
    } else {
      textMessage += ` не найден!`;
    }
    await app.bot.telegram.sendMessage(
      chatID, 
      textMessage.substr(0, 3900)
    );
  } else {
    await app.bot.telegram.sendMessage(
      chatID, 
      'Я не знаю ваш чат, поиграйте, потом и поговорим😉'
    );
  }
}

function byField(field) {
  return (a, b) => a[field] < b[field] ? 1 : -1;
}