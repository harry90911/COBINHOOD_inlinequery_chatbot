'use strict';

const request = require('request');
const trading_pair = require('./trading_pair.json');

const end_point = "https://api.cobinhood.com";
const stat = "/v1/market/stats";
const url = end_point + stat;

function getPrice(pair) {
  return new Promise(function(resolve,reject) {
    request.get(url, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var result = JSON.parse(body)["result"][pair]["last_price"];
        resolve(result);
      }
      else if (response.statusCode === 404) {
        reject(error);
      }
    });
  }).catch(error => {return "404 warning"});
}

exports.bot = function (req, res) {
  const update = req.body;

  if (update.hasOwnProperty('message') && update.message.hasOwnProperty('text')) {
    const pair = update.message.text;
    getPrice(pair).then(
      function(x) {
        const reply = {
          method: 'sendMessage',
          chat_id: update.message.chat.id,
          text: "*Current price of the trading pair*\n" + update.message.text + ' ' + x,
          parse_mode: "Markdown"
        };
        return res.json(reply);
      })
  } else if (update.hasOwnProperty('inline_query')) {
    const inline_query = update.inline_query;
    const query = inline_query.query;
    
    const results = [];
    for (var tp in trading_pair) {
      if (trading_pair[tp].pair.startsWith(query)) {
        getPrice(trading_pair[tp].pair).then(
          function(x) {
          const result = {
            type: "article",
            id: trading_pair[tp].id,
            title: trading_pair[tp].pair,
            input_message_content: {
              message_text: x,
              parse_mode: "Markdown"
            }
          };
          results.push(result);
        });
      }
    }
    const reply = {
      method: "answerInlineQuery",
      inline_query_id: inline_query.id,
      results: JSON.stringify(results)
    };
    return res.json(reply);
  } else {
    var query = "COB";
    const results = [];
    for (var tp in trading_pair) {
      if (trading_pair[tp].pair.startsWith(query)) {
        getPrice("COB-ETH").then(
          function(x) {
            const result = {
              type: "article",
              id: trading_pair[tp].id,
              title: trading_pair[tp].pair,
              input_message_content: {
                message_text: "Current price of the trading pair\n" + update.message.text + ' ' + x,
                parse_mode: "Markdown"
              }
            };
            results.push(result);
        });
      }
    console.log(JSON.stringify(results));
    }
    const reply = {
      method: "answerInlineQuery",
      inline_query_id: 652952119,
      results: JSON.stringify(results)
    };
    return res.json(reply);
  }
};



