let device = null;
let server = null;
let uartService = null;

let txCharacteristic = null; // ESP32 → Web (Notify)
let rxCharacteristic = null; // Web → ESP32 (Write)

// UUIDs aus esp32_ble.json
let SERVICE_UUID;
let RX_UUID;
let TX_UUID;

// HTML Elemente
const connectButton = document.getElementById("connectBLEButton");
const disconnectButton = document.getElementById("disconnectBLEButton");
const deviceConnectedSpan = document.getElementById("deviceConnected");

const onButton = document.getElementById("onButton");
const offButton = document.getElementById("offButton");

const valueSpan = document.getElementById("value");
const fotoSpan = document.getElementById("value_foto");
const ledSpan = document.getElementById("ledStatus");


// -----------------------------
// JSON laden (UUIDs)
// -----------------------------
fetch("esp32_ble.json")
  .then(response => response.json())
  .then(json => {
    console.log("BLE JSON geladen:", json);

    SERVICE_UUID = json.services[0].uuid;
    RX_UUID = json.services[0].characteristics[0].uuid;
    TX_UUID = json.services[0].characteristics[1].uuid;

    console.log("Service:", SERVICE_UUID);
    console.log("RX:", RX_UUID);
    console.log("TX:", TX_UUID);
  })
  .catch(err => console.error("Fehler beim Laden der JSON:", err));


// -----------------------------
//   Verbindung herstellen
// -----------------------------
async function connect() {
  try {
    console.log("BLE Verbindung wird gesucht...");

    device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }]
    });

    device.addEventListener("gattserverdisconnected", onDisconnect);

    server = await device.gatt.connect();
    console.log("Verbunden!");

    uartService = await server.getPrimaryService(SERVICE_UUID);

    rxCharacteristic = await uartService.getCharacteristic(RX_UUID);
    txCharacteristic = await uartService.getCharacteristic(TX_UUID);

    await txCharacteristic.startNotifications();
    txCharacteristic.addEventListener("characteristicvaluechanged", handleNotifications);

    deviceConnectedSpan.textContent = "Verbunden";
    deviceConnectedSpan.style.color = "green";

  } catch (error) {
    console.error("Fehler beim Verbinden:", error);
  }
}


// -----------------------------
//   Notifications empfangen
// -----------------------------
function handleNotifications(event) {
  let value = new TextDecoder().decode(event.target.value);
  console.log("Notification:", value);

  // Format: "Touch:123,Foto:456,LED:1"
  const parts = value.split(",");

  parts.forEach(part => {
    if (part.startsWith("Touch:")) {
      valueSpan.textContent = part.replace("Touch:", "");
    }
    if (part.startsWith("Foto:")) {
      fotoSpan.textContent = part.replace("Foto:", "");
    }
    if (part.startsWith("LED:")) {
      ledSpan.textContent = part.replace("LED:", "");
    }
  });
}


// -----------------------------
//  Daten an den ESP32 senden
// -----------------------------
async function sendBLE(data) {
  if (!rxCharacteristic) return;

  console.log("Sende:", data);
  const encoder = new TextEncoder();
  await rxCharacteristic.writeValue(encoder.encode(data));
}


// -----------------------------
//  Disconnect
// -----------------------------
function disconnect() {
  if (!device) return;

  console.log("Gerät wird getrennt...");
  if (device.gatt.connected) {
    device.gatt.disconnect();
  }
}

function onDisconnect() {
  console.log("ESP32 getrennt");

  deviceConnectedSpan.textContent = "Getrennt";
  deviceConnectedSpan.style.color = "red";
}


// -----------------------------
//  Button-Events
// -----------------------------
connectButton.addEventListener("click", connect);
disconnectButton.addEventListener("click", disconnect);

onButton.addEventListener("click", () => sendBLE("ein"));
offButton.addEventListener("click", () => sendBLE("aus"));