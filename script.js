// HTML-Elemente
const connectButton = document.getElementById("connectBLEButton");
const disconnectButton = document.getElementById("disconnectBLEButton");
const deviceConnectedSpan = document.getElementById("deviceConnected");

const onButton = document.getElementById("onButton");
const offButton = document.getElementById("offButton");

const valueSpan = document.getElementById("value");
const fotoSpan = document.getElementById("value_foto");
const ledSpan = document.getElementById("ledStatus");

// UUIDs des ESP32 (UART Service)
const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const CHARACTERISTIC_UUID_RX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"; // write
const CHARACTERISTIC_UUID_TX = "6e400003-b3a5-f393-e0a9-e50e24dcca9e"; // notify

let bleDevice = null;
let bleServer = null;
let rxCharacteristic = null;
let txCharacteristic = null;


// Verbindung starten
connectButton.addEventListener("click", async () => {
    try {
        console.log("Starte Bluetooth Scan …");

        bleDevice = await navigator.bluetooth.requestDevice({
            filters: [{ name: "ESP32_BLE" }],
            optionalServices: [SERVICE_UUID]
        });

        bleDevice.addEventListener("gattserverdisconnected", onDisconnected);

        bleServer = await bleDevice.gatt.connect();
        console.log("Verbunden mit GATT-Server");

        const service = await bleServer.getPrimaryService(SERVICE_UUID);

        // TX → ESP32 sendet Daten
        txCharacteristic = await service.getCharacteristic("6E400003-B5A3-F393-E0A9-E50E24DCCA9E");
        await txCharacteristic.startNotifications();
        txCharacteristic.addEventListener("characteristicvaluechanged", handleNotification);

        // RX → Web sendet an ESP32
        rxCharacteristic = await service.getCharacteristic("6E400002-B5A3-F393-E0A9-E50E24DCCA9E");

        deviceConnectedSpan.innerHTML = "Connected";
        deviceConnectedSpan.style.color = "green";

        console.log("BLE erfolgreich verbunden!");

    } catch (error) {
        console.error("BLE Fehler:", error);
        alert("BLE Verbindung fehlgeschlagen!");
    }
});


// BLE-Trennung
disconnectButton.addEventListener("click", () => {
    if (bleDevice) bleDevice.gatt.disconnect();
});

function onDisconnected() {
    deviceConnectedSpan.innerHTML = "Disconnected";
    deviceConnectedSpan.style.color = "#d13a30";
    console.log("ESP32 wurde getrennt.");
}


// LED-Steuerung per BLE
onButton.addEventListener("click", () => sendCommand("ein"));
offButton.addEventListener("click", () => sendCommand("aus"));


async function sendCommand(cmd) {
    if (!rxCharacteristic) {
        alert("Bitte erst mit ESP32 verbinden!");
        return;
    }

    console.log("Sende:", cmd);
    let enc = new TextEncoder();
    await rxCharacteristic.writeValue(enc.encode(cmd));
}


// Notifications empfangen
function handleNotification(event) {
    let decoded = new TextDecoder().decode(event.target.value);
    console.log("Empfangen:", decoded);

    // Erwartetes Format: "Touch:123,Foto:456,LED:1"
    const parts = decoded.split(",");

    parts.forEach(p => {
        if (p.startsWith("Touch:"))
            valueSpan.innerHTML = p.split(":")[1];
        else if (p.startsWith("Foto:"))
            fotoSpan.innerHTML = p.split(":")[1];
        else if (p.startsWith("LED:"))
            ledSpan.innerHTML = p.split(":")[1];
    });
}




