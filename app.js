import express from 'express';
import {InfobipApi} from "./infobip-api.js";

const app = express();

app.use(express.urlencoded())
app.use(express.json())

let outboundCalls = [];

app.post('/infobip', async (req, res) => {
    let event = req.body;
    console.log("Received new event: %s", JSON.stringify(event));
    res.sendStatus(200);
    await handleInfobipEvent(event);
});

async function handleInfobipEvent(event) {
    if (event.type === "CALL_RECEIVED") { // Received inbound (parent) call
        let inboundCall = event.properties.call;
        let preAnswer = await InfobipApi.preAnswer(inboundCall.id); // Pre answer it with ringing
        console.log('Received pre-answer response %s', JSON.stringify(preAnswer));
        let outboundCall = await InfobipApi.createCall(inboundCall.id); // Create outbound (child) call (with parentCallId included) and save reference
        outboundCalls.push(outboundCall);
        console.log("Received create call response %s", JSON.stringify(outboundCall));
    } else if (event.type === "CALL_ESTABLISHED") { // One of the calls is established
        let call = event.properties.call;
        if (call.direction === "OUTBOUND") { // Outbound (child) call is established (answered), we can add it to dialog with inbound (parent) call
            let dialog = await InfobipApi.createDialog(call.parentCallId, call.id);
            console.log("Received create dialog response %s", JSON.stringify(dialog));
        }
    } else if (event.type === "CALL_FAILED") { // One of the calls failed
        let callLog = event.properties.callLog;
        if (callLog.direction === "OUTBOUND") { // Outbound (child) call failed, we need to hangup inbound (parent) call
            let response = await InfobipApi.hangup(callLog.parentCallId); // Outbound (child) call parentCallId is actually inbound (parent) call id (we passed it with create call api), which we want to hangup
            console.log("Received hangup response %s", JSON.stringify(response));
        } else if (callLog.direction === "INBOUND") { // Inbound (parent) call failed, we need to hangup outbound (child) call
            let childCall = outboundCalls.find(outboundCall => outboundCall.parentCallId === callLog.callId) // Find outbound (child) call reference
            if (childCall) {
                let response = await InfobipApi.hangup(childCall.id);
                console.log("Received hangup response %s", JSON.stringify(response));
                outboundCalls = outboundCalls.filter(outboundCall => outboundCall.id === childCall.id);
                console.log(JSON.stringify(outboundCalls));
            }
        }
    } else if (event.type === 'MACHINE_DETECTION_FINISHED') {
        // Do something with result
    } else if (event.type === 'DIALOG_FINISHED') {
        // Process dialog finished event (includes all relevant data about calls)
    }
}

const port = 8080;
app.listen(port, () => console.log('App started listening on: http://127.0.0.1:%d', port));
