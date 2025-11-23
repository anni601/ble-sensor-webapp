// DOM Elemente
const connectButton = document.getElementById("connectBLEButton");
const disconnectButton = document.getElementById("disconnectBLEButton");
const deviceConnectedSpan = document.getElementById("deviceConnected");

const onButton = document.getElementById("onButton");
const offButton = document.getElementById("offButton");

const valueSpan = document.getElementById("value");
const fotoSpan = document.getElementById("value_foto");
const ledSpan = document.getElementById("ledStatus");

// BLE UUIDs
const SERVICE_UUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
const CHARACTERISTIC_UUID_RX = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";  // Write
const CHARACTERISTIC_UUID_TX = "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";  // Notify

// BLE Variablen
let bleDevice = null;
let bleServer = null;
let characteristicRX = null;
let characteristicTX = null;


// WEB BLUETOOTH CHECK
function isWebBluetoothEnabled() {
    if (!navigator.bluetooth) {
        alert("Web Bluetooth wird von diesem Browser NICHT unterstützt.");
        return false;
    }
    return true;
}


// VERBINDEN
connectButton.addEventListener("click", async () => {
    if (!isWebBluetoothEnabled()) return;

    try {
        bleDevice = await navigator.bluetooth.requestDevice({
            filters: [{ name: "ESP32_BLE" }],
            optionalServices: [SERVICE_UUID]
        });

        console.log("Gefundenes Gerät:", bleDevice.name);

        bleDevice.addEventListener("gattserverdisconnected", onDisconnected);

        bleServer = await bleDevice.gatt.connect();
        console.log("Verbunden mit GATT Server");

        const service = await bleServer.getPrimaryService(SERVICE_UUID);

        // TX Characteristic (Notify)
        characteristicTX = await service.getCharacteristic(CHARACTERISTIC_UUID_TX);
        await characteristicTX.startNotifications();
        characteristicTX.addEventListener("characteristicvaluechanged", handleNotifications);

        // RX Characteristic (Write)
        characteristicRX = await service.getCharacteristic(CHARACTERISTIC_UUID_RX);

        deviceConnectedSpan.textContent = "Verbunden";
        deviceConnectedSpan.style.color = "green";

        console.log("BLE vollständig verbunden!");

    } catch (error) {
        console.error("Verbindungsfehler:", error);
    }
});


// NOTIFICATION HANDLING
function handleNotifications(event) {
    const value = new TextDecoder().decode(event.target.value);
    console.log("Empfangen:", value);

    // Erwartetes Format:
    // Touch:xxxx,Foto:xxxx,LED:x
    const parts = value.split(",");

    parts.forEach(part => {
        if (part.startsWith("Touch:")) {
            valueSpan.textContent = part.replace("Touch:", "");
        }
        if (part.startsWith("Foto:")) {
            fotoSpan.textContent = part.replace("Foto:", "");
        }
        if (part.startsWith("LED:")) {
            const state = part.replace("LED:", "");
            ledSpan.textContent = state == "1" ? "AN" : "AUS";
        }
    });
}


// LED STEUERUNG
async function sendBLECommand(text) {
    if (!characteristicRX) {
        alert("Noch nicht verbunden!");
        return;
    }
    try {
        await characteristicRX.writeValue(new TextEncoder().encode(text));
        console.log("Gesendet:", text);
    } catch (error) {
        console.error("Sende-Fehler:", error);
    }
}

onButton.addEventListener("click", () => sendBLECommand("ein"));
offButton.addEventListener("click", () => sendBLECommand("aus"));


// DISCONNECT
disconnectButton.addEventListener("click", disconnectDevice);

function disconnectDevice() {
    if (!bleDevice) return;

    if (bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
        console.log("Manuell getrennt.");
    }
}

function onDisconnected() {
    console.log("ESP32 wurde getrennt.");
    deviceConnectedSpan.textContent = "Getrennt";
    deviceConnectedSpan.style.color = "red";
}




