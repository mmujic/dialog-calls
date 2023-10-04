import axios from 'axios';
import config from './config.json' assert {type: 'json'};

const INFOBIP_CALLS_API_URL = "https://api.infobip.com/calls/1";
export class InfobipApi {
    static async preAnswer(callId) {
        let preAnswerRequest = {ringing: true};
        let url = `${INFOBIP_CALLS_API_URL}/calls/${callId}/pre-answer`;
        return axios.post(url, preAnswerRequest, this.getHeaders())
            .then(response => response.data);
    }

    static async hangup(callId) {
        let url = `${INFOBIP_CALLS_API_URL}/calls/${callId}/hangup`;
        return axios.post(url, {}, this.getHeaders())
            .then(response => response.data)
            .catch(err => console.error(`Failed to hangup call: ${err.message}`));
    }

    static async createCall(parentCallId) {
        let callRequest = {
            applicationId: "your-app-id",
            parentCallId: parentCallId,
            endpoint: {
                type: "PHONE",
                phoneNumber: "34913247411" // Set correct number
            },
            from: "34915969369", // Set correct number
            connectTimeout: 30,
            machineDetection: {
                enabled: true
            },
        };
        let url = `${INFOBIP_CALLS_API_URL}/calls`;
        return axios.post(url, callRequest, this.getHeaders())
            .then(response => response.data);
    }

    static async createDialog(parentCallId, childCallId) {
        let url = `${INFOBIP_CALLS_API_URL}/dialogs/parent-call/${parentCallId}/child-call/${childCallId}`;
        return axios.post(url, {}, this.getHeaders())
            .then(response => response.data);
    }

    static getHeaders() {
        return {headers: {Authorization: `App ${config['INFOBIP_API_KEY']}`}};
    }
}