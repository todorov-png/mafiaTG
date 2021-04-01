'use strict';

//Получаем переменные из env
import dotenv from 'dotenv';
dotenv.config();

import  mongoose  from  'mongoose';


//Подключаемся к БД
mongoose.connect(process.env.URL_BD_CONNECT, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify : false ,
    useCreateIndex: true
  })
    .then(() => console.log('Подключение к бд произошло успешно'))
    .catch((err) => console.log(err));


//Создаем схему пользователя и чата
const UsersSchema = new mongoose.Schema({
    userID: { type: Number, required: true },
    name: { type: String, required: true },
    userName: { type: String, required: true },
    gameCounter: { type: Number, required: true, default: 0 },
    victories: { type: Number, required: true, default: 0 },
    worldVictories: { type: Number, required: true, default: 0 },
    mafiaVictories: { type: Number, required: true, default: 0 },
    triadaVictories: { type: Number, required: true, default: 0 },
    money: { type: Number, required: true, default: 0 }
}, { versionKey: false });


const ChatsSchema = new mongoose.Schema({
    chatID: {type: Number, required: true },
    title: { type: String, required: true },
    messageID: { type: Number, required: true, default: 0 },
    registrationTimeLeft: { type: Number, required: true, default: 90 },
    statisticsGameInChat: {
        gameCounter: { type: Number, required: true, default: 0 },
        peacefulVictories: { type: Number, required: true, default: 0 },
        mafiaVictories: { type: Number, required: true, default: 0 },
        triadaVictories: { type: Number, required: true, default: 0 },
        knowUsers: { type: Number, required: true, default: 0 }
    },
    listOfUser:[UsersSchema],
    dataGame:{
        counterActiveRoles: { type: Number, required: true, default: 0 },
        counterPlayers: { type: Number, required: true, default: 0 },
        counterTriada: { type: Number, required: true, default: 0 },
        counterMafia: { type: Number, required: true, default: 0 },
        counterWorld: { type: Number, required: true, default: 0 },
        counterDays: { type: Number, required: true, default: 0 },
        statysDay: { type: Boolean, required: true, default: false },
        timeStart: { type: Number, required: true, default: 0 },
        inactivePlay: { type: Number, required: true, default: 5 }
    },
    players:[
        {
            userID: { type: Number, required: true },
            name: { type: String, required: true },
            role: { type: String, required: true },
            initialRole: { type: String, required: true },
            allies: { type: Number, required: true, default: 0 },
            votesAgainst: { type: Number, required: true, default: 0 },
            votes: { type: Boolean, required: true, default: true },
            votesFor: { type: Number, required: true, default: 0 },
            whetherVoted: { type: Boolean, required: true, default: false },
            votingResult: { type: Boolean, required: true, default: true },
            lifeStatus: { type: Boolean, required: true, default: true },
            suicide: { type: Boolean, required: true, default: false },
            copCheck: { type: Boolean, required: true, default: true },
            actID: { type: Number, required: true, default: 0 },
            therapyDay: { type: Number, required: true, default: 0 },
            dateOfDeath: { type: Number, required: true, default: 0 },
            dyingMessage: { type: Boolean, required: true, default: false },
            messageID: { type: Number, required: true, default: 0 } 
        }
    ]
}, { versionKey: false });


//Создаем модели юзеров и чатов
export const Users = mongoose.model('Users', UsersSchema);
export const Chats = mongoose.model('ChatsGame', ChatsSchema);