//durch diese Festlegungen, ansprechen der Objekte der html Datei

const connectButton = document.getElementById("connectBLEButton");
const disconnectButton = document.getElementById("disconnectBLEButton");
const deviceConnectedSpan = document.getElementById("deviceConnected");

const onButton = document.getElementById("onButton");
const offButton = document.getElementById("offButton");

const valueSpan = document.getElementById("value");
const fotoSpan = document.getElementById("value_foto");
const ledSpan = document.getElementById("ledStatus");

// UUIDs in Kleinbuchstaben!
const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const CHARACTERISTIC_UUID_RX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const CHARACTERISTIC_UUID_TX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

//entstehende Objekte beim Verbindungsaufbau werden global definiert
let device, server, service;
let txCharacteristic, rxCharacteristic;

// Verbinden -> async ermöglicht await und asynchrone Abläufe
connectButton.addEventListener("click", async (event) => {
    try {
        console.log("Suche nach BLE Geräten...");

        device = await navigator.bluetooth.requestDevice({
            filters: [{ name: "ESP32_BLE" }],
            optionalServices: [SERVICE_UUID]
        });

        device.addEventListener("gattserverdisconnected", onDisconnected);

        server = await device.gatt.connect();
        console.log("Verbunden mit GATT Server");

        service = await server.getPrimaryService(SERVICE_UUID);

        txCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID_TX);
        rxCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID_RX);

        await txCharacteristic.startNotifications();
        txCharacteristic.addEventListener(
            "characteristicvaluechanged",
            handleNotifications
        );

        deviceConnectedSpan.textContent = "Connected";
        deviceConnectedSpan.style.color = "green";

        console.log("BLE Verbindung erfolgreich.");
    }
    catch (error) {
        console.error("Verbindungsfehler:", error);
    }
});

// Schreiben zur RX characteristic
async function writeValue(value) {
    if (!rxCharacteristic) return;

    let encoder = new TextEncoder();
    await rxCharacteristic.writeValue(encoder.encode(value));
}

// LED Buttons
onButton.addEventListener("click", () => writeValue("ein"));
offButton.addEventListener("click", () => writeValue("aus"));

// Sensorwerte empfangen
function handleNotifications(event) {
    let decoder = new TextDecoder();
    let data = decoder.decode(event.target.value);

    console.log("Empfangen:", data);

    let parts = data.split(",");

    valueSpan.textContent = parts[0].split(":")[1];
    fotoSpan.textContent = parts[1].split(":")[1];
    ledSpan.textContent = parts[2].split(":")[1];
}

function onDisconnected() {
    deviceConnectedSpan.textContent = "Disconnected";
    deviceConnectedSpan.style.color = "red";
    console.log("BLE getrennt");
valueSpan.textContent = "0";
fotoSpan.textContent = "0";
ledSpan.textContent = "aus";

}

disconnectButton.addEventListener("click", () => {
    if (device && device.gatt.connected) {
        device.gatt.disconnect();
    }
    else{
	console.log("Already disconnected");
    }
valueSpan.textContent = "0";
fotoSpan.textContent = "0";
ledSpan.textContent = "aus";

});