'use strict';
import dotenv from 'dotenv';
import * as functions from './functions.js';
import * as game from './game.js';
import Telegraf from 'telegraf';
import * as keyboards from './keyboards.js';
import rateLimit from 'telegraf-ratelimit';
dotenv.config();

 
// Set limit to 75 message per 3 seconds
const limitConfig = {
  window: 3000,
  limit: 75,
  onLimitExceeded: (ctx, next) => ctx.reply('Ограничение скорости превышено')
};

//Создаем обьект бота
export const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
//bot.use(rateLimit(limitConfig));
bot.use(Telegraf.log()); //Выводит сообщение в консоль

//Обработка ошибок
bot.catch((err, ctx) => {
    console.log(`Ой, произошла ошибка для ${ctx.updateType}`, err);
});

//Приветствуем пользователя и записываем его на игру, если с командой пришел id чата
bot.start( (ctx) => {
  if (ctx.message.text.length == 6) {
    ctx.reply('Привет, для запуска игры отправь команду /game в групповом чате');
  } else {
    //Сохраняем в бд пользователя и записываем его на игру
    functions.registrationUserInGame(ctx, ctx.message.text.slice(7));
  }
});


//Выводим подсказку
bot.help((ctx) => {
  ctx.reply('Привет!\nЯ бот, который позволяет играть в Мафию.\n\n'+
  'Для запуска игры мне нужно выдать права 👨‍⚖ администратора:\n\n'+
  '  - Удаление сообщений\n\nПосле выполнения всех действий, '+
  'вы сможете запустить игру командой /game\n\nДля помощи /help');
});


//Запускаем игру
bot.command('game', (ctx) => {
  //Если пришло с группового чата, то запускаем регистрацию участников
  if (functions.checkTypeChat(ctx.message.chat.type)) {
    //Проверяем дали ли боту права админа
    if (functions.checkBotAdmin(ctx.message.chat.id) &&
        functions.checkStartGame(ctx.message.chat.id)) {
          functions.updateOrAddChatInBD(ctx.message.chat.id, ctx.message.chat.title);
          game.launch(ctx.message.chat.id);
    }
  } else {
    ctx.reply('Эту команду необходимо отправлять в групповом чате!');
  }
});

//Запускаем игру
bot.command('role', (ctx) => {
  ctx.reply(`В игре доступны следующие роли:
👨🏼 <b>Мирный житель</b> - обычный горожанин, главная цель которого вычислить мафию и линчевать её днем.
🤞 <b>Счастливчик</b> - при смерти может повезти и он не умрёт.
🤵🏻 <b>Дон</b> - глава мафии, ночью убивает игрока.
🤵🏼 <b>Крёстный отец</b> - помощник мафии, лишает игрока голоса днем, при смерти дона становится главой мафии.
👨🏼‍⚕️ <b>Доктор</b> - лечит жителей, но если полечит одного игрока 2 раза подряд, а в него не стреляли ни разу, то залечивает его до смерти.
🕵🏼️‍♂️ <b>Комиссар</b> - ищет мафию, может проверить или убить игрока.
👮🏻 <b>Лейтенант</b> - помощник комиссара, при смерти начальника получает повышение и становится комиссаром.
🤦🏼‍♂️ <b>Камикадзе</b> - смертник, его цель быть повешаным на дневном собрании.
👥 <b>Телохранитель</b> - прикрывает любого игрока, при ранее уходит с работы, но спасает игрока от смерти.
🔪 <b>Мститель</b> - единолично хочет разобраться с мафией, может убивать любого жителя.
💃🏻 <b>Красотка</b> - отвлекает игрока ночью и он лишается возможности действовать.
👳🏻‍♂️ <b>Триада</b> - глава 2 преступного клана в городе, цель которого убить мафию и мирных жителей.
🧘🏻 <b>Сенсей</b> - помощник триады, проверяет игрока на наличе роли комиссара или мафии, при смерти триады занимает его место.
`, {parse_mode: 'HTML'});
});

//Очищаем данные игры
bot.command('stopgame', (ctx) => {
  game.clearDataGame(ctx.message.chat.id);
});

//Отмечаем всех участников которых знает бот
bot.command('call', (ctx) => {
  functions.callUsers(ctx);
});

//Отправляем статистику пользователя
bot.command('userinfo', (ctx) => {
  functions.getInfoUser(ctx.message.chat.id, ctx.message.from.id);
});

//Отправляем статистику чата
bot.command('chatinfo', (ctx) => {
  functions.getInfoChat(ctx.message.chat.id);
});

//Отправляем топ чата
bot.command('topvictories', (ctx) => {
  functions.topChat(ctx.message.chat.id, 'победителей', 'victories');
});

//Отправляем топ чата
bot.command('topworld', (ctx) => {
  functions.topChat(ctx.message.chat.id, 'победителей в мирной роли', 'worldVictories');
});

//Отправляем топ чата
bot.command('topmafia', (ctx) => {
  functions.topChat(ctx.message.chat.id, 'победителей в роли мафии', 'mafiaVictories');
});

//Отправляем топ чата
bot.command('toptriada', (ctx) => {
  functions.topChat(ctx.message.chat.id, 'победителей в роли триады', 'triadaVictories');
});

//При добавлении пользователя запоминаем его данные
bot.on('new_chat_members', (ctx) => {
  if (functions.checkTypeChat(ctx.message.chat.type)) {
    functions.checkingLoggedUser(ctx.message.chat.id, ctx.message.new_chat_members);
  } else {
    functions.leaveChat(ctx.message.chat.id);
  }
});


//При выходе участника удаляем его из бд
bot.on('left_chat_member', (ctx) => {
  functions.leftUserOrChat(ctx.message.chat.id, ctx.message.left_chat_member);
});


//Ловим изменение типа чата и его айди
bot.on('migrate_to_chat_id', (ctx) => {
  functions.autoUpdateIDChat(ctx.message.chat.id, ctx.message.migrate_to_chat_id);
});


//Ловим изменение имени чата
bot.on('new_chat_title', (ctx) => {
  functions.autoUpdateTitleChat(ctx.message.chat.id, ctx.message.chat.title);
});


//Ловим колбеки от кнопок
bot.on('callback_query', async (ctx) => {
  console.log('callbake ');
  console.log(ctx.callbackQuery);
  game.callbackQuery(ctx);
  
});


//Удаляем сообщение, если ночь или убит
bot.on('text', (ctx) => {
  if (functions.checkTypeChat(ctx.message.chat.type)) {
    game.closeWriteChat(ctx);
  }
});


//Запускаем бесконечный цикл полинга
bot.launch();