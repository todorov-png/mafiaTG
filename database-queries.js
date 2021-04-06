'use strict';
import * as mongobd from './mongobd.js';


export async function getDataRegistrationUserInGame(chatID) {
    return await mongobd.Chats.findOne(
        { chatID: chatID },
        {
        title: true,
        dataGame: true,
        players: true,
        'statisticsGameInChat.knowUsers': true,
        listOfUser: true,
        _id: false
        }
    );
}

export async function getDataStatisticsGameInChat(chatID) {
    return await mongobd.Chats.findOne(
        { chatID: chatID },
        {
        title: true,
        'statisticsGameInChat': true,
        _id: false
        }
    );
}

export async function updateDataRegistrationUserInGame(chatID, userID, name, userName) {
    await mongobd.Chats.updateOne(
        {chatID: chatID},
        {
          $push: {'players':{
            userID: userID,
            name: name,
            userName: userName}
          },
          $inc: {'dataGame.counterPlayers': 1}
        },
        {upsert: true, setDefaultsOnInsert: true}
    );
}

export async function getDataCheckingLoggedUser(chatID) {
    return await mongobd.Chats.findOne(
        { chatID: chatID },
        { listOfUser: true, _id: false }
    );
}

export async function getDataLeftUserOrChat(chatID) {
    return await mongobd.Chats.findOne(
        { chatID: chatID },
        {
          'statisticsGameInChat.knowUsers': true,
          listOfUser: true,
          _id: false
        }
    );
}

export async function updateDataLeftUserOrChat(chatID, userID) {
    await mongobd.Chats.updateOne(
        {chatID: chatID},
        {
          $inc: {'statisticsGameInChat.knowUsers': -1},
          $pull: {listOfUser:{userID: userID}}
        }
    );
}

export async function deleteDataLeftUserOrChat(chatID) {
    await mongobd.Chats.deleteOne({chatID: chatID});
}

export async function getDataCallUsers(chatID) {
    return await mongobd.Chats.findOne(
        { chatID: chatID },
        { listOfUser: true, _id: false }
    );
}

export async function getDataCloseWriteChat(chatID) {
    return await mongobd.Chats.findOne(
        { chatID: chatID },
        {
          'players': true,
          'dataGame.statysDay': true,
          'dataGame.counterDays': true,
          _id: false
        }
    );
}

export async function getDataSendMessageRegistration(chatID, messageID, time) {
    return await mongobd.Chats.updateOne(
        {chatID: chatID},
        {
          messageID: messageID,
          registrationTimeLeft: time
        }
    );
}

export async function getDataDeleteMessageRegistration(chatID) {
    return await mongobd.Chats.findOne(
        { chatID: chatID },
        {
          messageID: true,
          _id: false
        }
    );
}

export async function updateDataUpdateOrAddChatInBD(chatID, title) {
    await mongobd.Chats.findOneAndUpdate(
        {chatID: chatID},
        {chatID: chatID, title: title},
        {upsert: true, setDefaultsOnInsert: true}
    );
  }

export async function updateDataClearDataGame(chatID) {
    await mongobd.Chats.updateOne(
        {chatID: chatID},
        {
        'players': [],
        'messageID': 0,
        'dataGame.counterActiveRoles': 0,
        'dataGame.counterPlayers': 0,
        'dataGame.counterTriada': 0,
        'dataGame.counterMafia': 0,
        'dataGame.counterWorld': 0,
        'dataGame.counterDays': 0,
        'dataGame.statysDay': false,
        'dataGame.timeStart': 0,
        'dataGame.inactivePlay': 5,
        'registrationTimeLeft': 90
        }
    );
}

export async function updateDataInactivePlay(chatID) {
    await mongobd.Chats.updateOne(
        {chatID: chatID},
        {
            $inc: {'dataGame.inactivePlay': -1}
        }
    );
}

export async function updateDataCounterActiveRoles(chatID, triger) {
    if (triger) {
        await mongobd.Chats.updateOne(
            {chatID: chatID},
            {
                $inc: {'dataGame.counterActiveRoles': 1}
            }
        );
    } else {
        await mongobd.Chats.updateOne(
            {chatID: chatID},
            {
                $inc: {'dataGame.counterActiveRoles': -1}
            }
        );
    }
}

export async function clearCounterActiveRoles(chatID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        { 'dataGame.counterActiveRoles': 0 }
    );
}

export async function getDataCounterActiveRoles(chatID) {
    return await mongobd.Chats.findOne(
        { chatID: chatID },
        {
          'dataGame.counterActiveRoles': true,
          _id: false
        }
    );
}

export async function updateStatusDay(chatID, status) {
    await mongobd.Chats.updateOne(
        { chatID: chatID},
        {
            'dataGame.statysDay': status,
            $inc: {'dataGame.counterDays': 1}
        }
    );
}

export async function updateDataGame(chatID, dataGame, players) {
    await mongobd.Chats.updateOne(
        {chatID: chatID},
        {
            'dataGame': dataGame,
            'players': players
        }
    );
}

export async function updateDataAutoUpdateTitleChat(chatID, title) {
    await mongobd.Chats.updateOne(
        {chatID: chatID},
        {'title': title}
    );
}

export async function updateDataAutoUpdateIDChat(chatID, newChatID) {
    await mongobd.Chats.updateOne(
        {chatID: chatID},
        {'chatID': newChatID}
    );
}

export async function updateDataAddUserInChatBD(chatID, userID, nameUser, userName) {
    await mongobd.Chats.updateOne(
        {chatID: chatID},
        {
            $push : {listOfUser:{userID: userID, name: nameUser, userName: userName}},
            $inc: {'statisticsGameInChat.knowUsers': 1}
        },
        {upsert: true, setDefaultsOnInsert: true}
    );
}

export async function updateNameUser(chatID, userID, nameUser, userName) {
    await mongobd.Chats.updateOne(
        {chatID: chatID},
        { 'listOfUser.$[index].name': nameUser,
          'listOfUser.$[index].userName': userName},
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}

export async function getDataPlayers(chatID) {
    return await mongobd.Chats.findOne(
        { chatID: chatID },
        {
          'players': true,
          _id: false
        }
    );
}

export async function getDataUsers(chatID) {
    return await mongobd.Chats.findOne(
        { chatID: chatID },
        {
            title: true,
            'listOfUser': true,
            _id: false
        }
    );
}

export async function getDataGame(chatID) {
    return await mongobd.Chats.findOne(
        { chatID: chatID },
        {
          'dataGame': true,
          'players': true,
          _id: false
        }
    );
}

export async function getDataUpdateMessageRegistration(chatID) {
    return await mongobd.Chats.findOne(
        {chatID: chatID},
        {
          messageID: true,
          registrationTimeLeft: true,
          _id: false
        }
    );
}

export async function updateDataStartGame(chatID, time) {
    await mongobd.Chats.updateOne(
        {chatID: chatID},
        {
        'dataGame.counterDays': 1,
        'dataGame.timeStart': time
        }
    );
}

export async function clearMessageIDPlayers(chatID, userID) {
    await mongobd.Chats.updateOne(
        {chatID: chatID},
        { 'players.$[index].messageID': 0 },
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}

export async function updateCounterRolesGame(chatID, counterWorld, counterMafia, counterTriada) {
    await mongobd.Chats.updateOne(
        {chatID: chatID},
        {
        'dataGame.counterWorld': counterWorld,
        'dataGame.counterMafia': counterMafia,
        'dataGame.counterTriada': counterTriada
        }
    );
}

export async function addRolePlayer(chatID, userID, role, allies) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            'players.$[index].role': role,
            'players.$[index].initialRole': role,
            'players.$[index].allies': allies
        },
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}

export async function suspendPlayer(chatID, userID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            'players.$[index].lifeStatus': false,
            $inc: {'dataGame.counterPlayers': -1}
        },
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}

export async function decrementCounterTriada(chatID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            $inc: {'dataGame.counterTriada': -1}
        }
    );
}

export async function decrementCounterMafia(chatID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            $inc: {'dataGame.counterMafia': -1}
        }
    );
}

export async function decrementCounterWorld(chatID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            $inc: {'dataGame.counterWorld': -1}
        }
    );
}

export async function updateDyingMessage(chatID, userID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            'players.$[index].dyingMessage': false
        },
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}
/*Повышение роли, из крестного отца до дона например, но сработает на всех крестных отцов////////////////////*/
export async function riseRolePlayer(chatID, role, riseRole) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        { 'players.$[index].role': riseRole },
        { arrayFilters : [{ "index.role" : role }] }
    );
}

export async function addMafiaVictoryPlayer(chatID, userID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            $inc: {
              'listOfUser.$[index].victories': 1,
              'listOfUser.$[index].money': 10,
              'listOfUser.$[index].gameCounter': 1,
              'listOfUser.$[index].mafiaVictories': 1
            }
        },
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}

export async function addWorldVictoryPlayer(chatID, userID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            $inc: {
              'listOfUser.$[index].victories': 1,
              'listOfUser.$[index].money': 10,
              'listOfUser.$[index].gameCounter': 1,
              'listOfUser.$[index].worldVictories': 1
            }
        },
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}

export async function addTriadaVictoryPlayer(chatID, userID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            $inc: {
              'listOfUser.$[index].victories': 1,
              'listOfUser.$[index].money': 10,
              'listOfUser.$[index].gameCounter': 1,
              'listOfUser.$[index].triadaVictories': 1
            }
        },
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}

export async function addCounterGamePlayer(chatID, userID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        { $inc: { 'listOfUser.$[index].gameCounter': 1 } },
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}

export async function addMafiaVictoryChat(chatID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            $inc: {
              'statisticsGameInChat.gameCounter': 1,
              'statisticsGameInChat.mafiaVictories': 1
            }
        }
    );
}

export async function addWorldVictoryChat(chatID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            $inc: {
                'statisticsGameInChat.gameCounter': 1,
                'statisticsGameInChat.peacefulVictories': 1
            }
        }
    );
}

export async function addTriadaVictoryChat(chatID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            $inc: {
                'statisticsGameInChat.gameCounter': 1,
                'statisticsGameInChat.triadaVictories': 1
            }
        }
    );
}

export async function updateMessageIDPlayer(chatID, messageID, userID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        { 'players.$[index].messageID': messageID },
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}

export async function updateCallbackDataPlayer(chatID, actID, userID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            'players.$[index].actID': actID
        },
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}

export async function updateCallbackDataVotesAgainstPlayer(chatID, userID, value) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        { $inc: {
                   'players.$[index].votesAgainst': value
                }
        },
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}

export async function updateCallbackDataVotesForPlayer(chatID, userID, value) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        { $inc: {
                   'players.$[index].votesFor': value
                }
        },
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}

export async function updateCallbackDataVotesPlayer(chatID, userID, whetherVoted, votingResult) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            'players.$[index].whetherVoted': whetherVoted,
            'players.$[index].votingResult': votingResult
        },
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}

export async function clearVoticeDay(chatID, userID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            'players.$[index].votesAgainst': 0,
            'players.$[index].votesFor': 0,
            'players.$[index].whetherVoted': false
        },
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}

export async function updateCallbackDataCop(chatID, act, userID, messageID) {
    await mongobd.Chats.updateOne(
        { chatID: chatID },
        {
            'players.$[index].copCheck': act,
            'players.$[index].messageID': messageID
        },
        { arrayFilters : [{ "index.userID" : userID }] }
    );
}

export async function getInfoPlayer(chatID, userID) {
    return await mongobd.Chats.findOne(
        { chatID: chatID },
        {
            'players': { $elemMatch: { userID: { $eq: userID } } },
            _id: false
        }
    );
}
