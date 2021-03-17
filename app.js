'use strict';
import dotenv from 'dotenv';
import * as functions from './functions.js';
import * as game from './game.js';
import Telegraf from 'telegraf';
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
  if (ctx.message.text.length === 6) {
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
    if (functions.checkBotAdmin(ctx.message.chat.id)) {
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
bot.command('clear', (ctx) => {
  game.clearDataGame(ctx.message.chat.id);
});


//Отмечаем всех участников которых знает бот
bot.command('call', (ctx) => {
  functions.callUsers(ctx);
});


//При добавлении пользователя запоминаем его данные
bot.on('new_chat_members', (ctx) => {
  functions.checkingLoggedUser(ctx.message.chat.id, ctx.message.new_chat_members);
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
  console.log('callbake ', ctx.callbackQuery);
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




/* bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.command('oldschool', (ctx) => {
    console.log(ctx);
});
bot.on('sticker', (ctx) => ctx.reply('👍'));
bot.hears('hi', (ctx) => ctx.reply('Hey there'));


bot.command('oldschool', (ctx) => {
    console.log(ctx.message.chat.type);
});

bot.command('game', async (ctx) => {
    if (ctx.message.chat.type == 'group' || ctx.message.chat.type == 'supergroup') {
      await ctx.replyWithHTML('Игра начнётся через 90 секунд! \nСписок участников:', keyboards.yesNoKeyboard());
    }
    //https://t.me/todorovevbot?start=5324115
});

bot.on('new_chat_members', (ctx) => {
    console.log(ctx.message.chat.type);
});

bot.on('callback_query', (ctx) => {
    console.log(ctx.message.chat);
}); */

/* bot.start((ctx) => ctx.reply('Завершить регистрацию и начать новую игру'));

bot.command('oldschool', (ctx) => ctx.reply('Hello')); */


/*bot.on('text', (ctx) => {
    const scores = ctx.db.getScores(ctx.message.from.username);
    return ctx.reply(`${ctx.message.from.username}: ${scores}`);
});


//if message.chat.type == 'private' and message.text == '/start':

//Передача данных из функции в следующую функцию, ибо если нет условий 
//и сработает функция, то дальше по коду не пойдёт
bot.use((ctx, next) => {
  ctx.state.role = getUserRole(ctx.message)
  return next()
})

bot.on('text', (ctx) => {
  return ctx.reply(`Hello ${ctx.state.role}`)
})






//Добавление клавиатуры и кнопки и проверка ответа
const inlineKeyboard = Markup.inlineKeyboard(
    [
        Markup.callbackButton('Yes, text','yes'),
        Markup.callbackButton('No, text','no')
    ],
    {
        columns: 1
    }
);
bot.command('test', (ctx) => ctx.reply('Hello', inlineKeyboard.extra()));
bot.action('no', (ctx) => ctx.answerCbQuery('Я записал',false)); 
//false покажет сверху уведомление и оно само пропадет, нужно 
//всегда использовать этот метод, что б не крутились часы на кнопке

bot.action('yes', async (ctx) => {
    await ctx.answerCbQuery('Я записал',false);
    await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
});
*/

/* // Вариант 1: просто вызов асинхронной функции
doManyThings();
// Вариант 2: вызов в другой функции с оберткой тру 
(async function() {
  try {
    await doManyThings();
  } catch (err) {
    console.error(err);
  }
})();
// Вариант 3: вызов через промис
doManyThings().then((result) => {
  // Делаем штуки, которым нужно подождать нашей функции
}).catch((err) => {
  throw err;
}); */



