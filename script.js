const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const onButton = document.getElementById('onButton');
const offButton = document.getElementById('offButton');
const touchSpan = document.getElementById("value");
const fotoSpan = document.getElementById("foto_value");
const ledSpan = document.getElementById("ledStatus");

const deviceName = 'ESP32_BLE';
const SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
const CHARACTERISTIC_UUID_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";
const CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";

connectBLEButton.addEventListener("click", async () => {
try {
device = await navigator.bluetooth.requestDevice({
filters: [{ name: "ESP32_BLE" }],
optionalServices: [SERVICE_UUID]
});

disconnectButton.addEventListener("click", diconnectDevice);

server = await device.gatt.connect();
service = await server.getPrimaryService(SERVICE_UUID);


charRX = await service.getCharacteristic(RX_UUID);
charTX = await service.getCharacteristic(TX_UUID);


await charTX.startNotifications();
charTX.addEventListener("characteristicvaluechanged", handleNotifications);


document.getElementById("controls").classList.remove("hidden");
} catch (error) {
console.error(error);
}
});


function handleNotifications(event) {
const value = new TextDecoder().decode(event.target.value);
console.log("Empfangen:", value);


const parts = value.split(",");
parts.forEach(p => {
const [key, val] = p.split(":");
if (key === "Touch") touchSpan.textContent = val;
if (key === "Foto") fotoSpan.textContent = val;
if (key === "LED") ledSpan.textContent = val;
});
}


// BLE Befehle senden
ledEinBtn.addEventListener("click", () => sendText("ein"));
ledAusBtn.addEventListener("click", () => sendText("aus"));


function sendText(text) {
const encoder = new TextEncoder();
charRX.writeValue(encoder.encode(text));
}