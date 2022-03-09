const ewelink = require('ewelink-api');
const axios = require('axios');
const fs = require('fs');
const { promisify } = require('util')
const sleep = promisify(setTimeout)

async function getMinerStatus(minerID) {
  minerStatus = await axios.get("https://hiveon.net/api/v1/stats/miner/" + minerID + "/ETH/workers");
  return minerStatus.data;
}

async function checkWorkers(miner) {
  console.log('Obteniendo estadísticas de la API de hiveon');
  minerStatus = await getMinerStatus(miner.id);
  const workers = minerStatus.workers;

  console.log('Lista de Workers')
  console.log(Object.keys(workers));

  for (const worker of Object.keys(workers)) {
    console.log("Revisando " + worker)

    if (!workers[worker].online) {

      console.log(worker + " desconectado.");
      console.log("Detalles:");
      console.log(workers[worker]);
      await handleWorkerDisconnect(worker);

    } else {

      console.log(worker + ' está conectado, todo ok');

    }
  }
}

async function handleWorkerDisconnect(worker) {

  // me conecto a la api de ewelink usando las creds del dispositivo
  workerControllerConfig = config.miners.find(element => element.controllerDevice.name == worker);

  const connection = new ewelink({
    email: workerControllerConfig.controllerDevice.email,
    password: workerControllerConfig.controllerDevice.password,
    region: workerControllerConfig.controllerDevice.region
  });

  const channel = workerControllerConfig.controllerDevice.relayChannel
  const devices = await connection.getDevices();
  const workerControlDevice = devices.find(element => element.name == worker);

  // prendo y apago el aparato
  console.log('Comenzando reinicio de ' + worker)

  await connection.toggleDevice(workerControlDevice.deviceid, channel);
  await sleep(6000);
  await connection.toggleDevice(workerControlDevice.deviceid, channel);

  console.log('Reinicio completado');

  console.log('Esperando 15 minutos a que minero se reinicie y conecte al pool')
  await sleep(15 * 60 *1000);

  console.log('finalizado.')
}

async function checkMiners(config) {
  while (true) {
    console.log("Iniciando check de mineros " + (new Date().toLocaleString('es-AR')));
    for (const miner of config.miners) {
      await checkWorkers(miner);
    }
    console.log("Checkeando otra vez en " + config.checkEveryMinutes + " minutos.");
    await sleep(config.checkEveryMinutes * 1000 * 60);
  }
}

config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
checkMiners(config);
