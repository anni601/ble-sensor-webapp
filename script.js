const serviceUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const characteristicUUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
let characteristic;

document.getElementById("connectBtn").addEventListener("click", async () => {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "ESP_BLE" }],
      optionalServices: [serviceUUID]
    });

    document.getElementById("status").innerText = "Verbinde...";
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(serviceUUID);
    characteristic = await service.getCharacteristic(characteristicUUID);

    await characteristic.startNotifications();
    characteristic.addEventListener("characteristicvaluechanged", handleNotifications);

    document.getElementById("status").innerText = "Verbunden mit " + device.name;
  } catch (error) {
    console.error(error);
    document.getElementById("status").innerText = "Fehler: " + error;
  }
});

function handleNotifications(event) {
  const value = new TextDecoder().decode(event.target.value);
  document.getElementById("values").innerText = value;
  console.log("Empfangen:", value);
}
