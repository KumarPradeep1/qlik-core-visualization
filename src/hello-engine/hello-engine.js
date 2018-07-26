/* eslint no-console:0 */
const WebSocket = require('ws');
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/3.2.json'); 
(async () => {
  try {
    console.log('Creating and opening session.');
    const session = enigma.create({
      schema,
      url: 'wss://qlik.mashey.com/hdr/app/?Xrfkey=123456789ABCDEFG', 
      createSocket: url => new WebSocket(url, {
      headers: {
      'x-Qlik-Xrfkey' : '123456789ABCDEFG',
      'hdr-usr' : "MASHEY\\Techmango"
      } 
      }),
    });
    const global = await session.open();

    const version = await global.engineVersion();
    console.log(`Engine version retrieved: ${version.qComponentVersion}`);

    await session.close();
    console.log('Session closed.');
  } catch (err) {
    console.log('Woops! An error occurred.', err);
    process.exit(1);
  }
})();
