let device;
let txCharacteristic;
let rxCharacteristic;

const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const TX_UUID = 'abcd1234-5678-90ab-cdef-1234567890ab';
const RX_UUID = 'abcd5678-1234-90ab-cdef-1234567890ab';

document.getElementById('connectBtn').addEventListener('click', async () => {
  try {
    device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);

    txCharacteristic = await service.getCharacteristic(TX_UUID);
    rxCharacteristic = await service.getCharacteristic(RX_UUID);

    txCharacteristic.startNotifications().then(_ => {
      txCharacteristic.addEventListener('characteristicvaluechanged', handleNotifications);
    });

    document.getElementById('status').innerText = 'Status: Verbunden';
  } catch (error) {
    console.log(error);
  }
});

function handleNotifications(event) {
  const value = new TextDecoder().decode(event.target.value);
  document.getElementById('sensorData').innerText = `Sensor: ${value}`;
}

document.getElementById('ledOnBtn').addEventListener('click', async () => {
  const data = new TextEncoder().encode('ON');
  await rxCharacteristic.writeValue(data);
});

document.getElementById('ledOffBtn').addEventListener('click', async () => {
  const data = new TextEncoder().encode('OFF');
  await rxCharacteristic.writeValue(data);
});
